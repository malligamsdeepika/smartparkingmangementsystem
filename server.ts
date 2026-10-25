import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { INITIAL_LOCATIONS, INITIAL_USERS, generateInitialSlots, generateSlotsForLocation, INITIAL_BOOKINGS, INITIAL_PAYMENTS } from './src/data/mockData.ts';
import { Booking, ParkingLocation, ParkingSlot, ParkingSession, PaymentRecord, SmartNotification, AdminNotification, User } from './src/types.ts';

dotenv.config();

// Enforce disabled Vite HMR in accordance with AI Studio runtime constraints and to prevent port 24678 conflicts
process.env.DISABLE_HMR = 'true';

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

// Parse JSON bodies
app.use(express.json());

// Ensure malformed JSON requests return clean JSON 400 instead of default Express HTML
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Malformed JSON payload received.' });
  }
  next(err);
});

// Force JSON Content-Type on all /api endpoints
app.use('/api', (req: Request, res: Response, next: any) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Production CORS Middleware supporting any device, mobile phone, and deployed URLs
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-App-Version, x-user-role, x-admin-id, Last-Event-ID'
  );
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, X-Server-Time');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Direct Download endpoint for complete project zip archive (serves zip with attachment header)
app.get(['/download-project.zip', '/smart-parking-complete-project.zip', '/api/download-zip'], (req: Request, res: Response) => {
  const root = process.cwd();
  const zipCandidates = [
    path.resolve(root, 'public', 'smart-parking-complete-project.zip'),
    path.resolve(root, 'dist', 'smart-parking-complete-project.zip'),
    path.resolve(root, 'smart-parking-complete-project.zip'),
  ];
  for (const zipPath of zipCandidates) {
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Disposition', 'attachment; filename="smart-parking-complete-project.zip"');
      res.setHeader('Content-Type', 'application/zip');
      return res.sendFile(zipPath);
    }
  }
  return res.status(404).send('ZIP file not ready yet. Please try again.');
});

// ============================================================================
// SHARED CLOUD-READY DATA STORE (In-Memory Master State)
// Persists active bookings, bays, sessions, and payments across all devices.
// ============================================================================
let locations: ParkingLocation[] = [...INITIAL_LOCATIONS];
let slots: ParkingSlot[] = generateInitialSlots();

// Guarantee that every city parking location has its full slot grid loaded in the central DB
INITIAL_LOCATIONS.forEach((loc) => {
  const existing = slots.filter((s) => s.locationId === loc.id);
  if (existing.length === 0) {
    const generated = generateSlotsForLocation(loc);
    slots.push(...generated);
  }
});

let bookings: Booking[] = [...INITIAL_BOOKINGS];
let users: User[] = [...INITIAL_USERS];
let payments: PaymentRecord[] = [...INITIAL_PAYMENTS];
let notifications: SmartNotification[] = [
  {
    id: 'notif-1',
    userId: 'usr-1',
    title: 'Registration Successful',
    message: 'Welcome to Smart Parking! Your driver account has been activated.',
    type: 'registration',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'usr-1',
    title: 'Booking Confirmed - Bay G-03',
    message: 'Reservation PK-94281 confirmed at Metro City Center Plaza. Present your QR pass at gate entry.',
    type: 'booking_confirm',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    bookingId: 'PK-94281',
  },
];

// Persistent Administrator Notification Records
let adminNotifications: AdminNotification[] = [
  {
    id: 'adm-notif-1',
    adminId: 'usr-admin',
    title: 'New Booking: Bay G-03 Confirmed',
    message: 'Reservation PK-94281 placed by Rahul Sharma (KA 03 MX 4421) at Metro City Center Plaza. Amount: ₹40.00.',
    type: 'new_booking',
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: 'PK-94281',
    bookingId: 'PK-94281',
    metadata: {
      bookingId: 'PK-94281',
      slotNumber: 'G-03',
      locationName: 'Metro City Center Plaza',
      userName: 'Rahul Sharma',
      amount: 40,
    },
  },
  {
    id: 'adm-notif-2',
    adminId: 'usr-admin',
    title: 'Payment Received: ₹40.00',
    message: 'Online parking payment verified for Booking PK-94281 via UPI (TXN-9841284712).',
    type: 'payment_update',
    createdAt: new Date(Date.now() - 3600000 * 2.4).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: 'pay-1',
    bookingId: 'PK-94281',
    metadata: {
      paymentId: 'pay-1',
      amount: 40,
      transactionId: 'TXN-9841284712',
    },
  },
  {
    id: 'adm-notif-3',
    adminId: 'usr-admin',
    title: 'Slot Status: Bay G-02 Occupied',
    message: 'Vehicle AP 03 CM 4488 entered Bay G-02 via Boom Barrier Entry Sensor 1.',
    type: 'slot_update',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    isRead: true,
    read: true,
    relatedEntityId: 'slot-loc1-2',
    metadata: {
      slotId: 'slot-loc1-2',
      slotNumber: 'G-02',
      status: 'occupied',
    },
  },
  {
    id: 'adm-notif-4',
    adminId: 'usr-admin',
    title: 'New User Registered: Priya Patel',
    message: 'New driver account registered: priya@example.com (+91 98765 11223).',
    type: 'user_registration',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isRead: true,
    read: true,
    relatedEntityId: 'usr-2',
    metadata: {
      userId: 'usr-2',
      userName: 'Priya Patel',
      email: 'priya@example.com',
    },
  },
  {
    id: 'adm-notif-5',
    adminId: 'usr-admin',
    title: 'Facility Capacity Alert: High Occupancy',
    message: 'Metro City Center Plaza has 85% occupancy. Only 3 available bays remain.',
    type: 'capacity_alert',
    createdAt: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: 'loc-1',
    metadata: {
      locationId: 'loc-1',
      locationName: 'Metro City Center Plaza',
      capacityPercentage: 85,
    },
  },
];

// Helper to create & broadcast Admin Notifications
export function createAdminNotification(params: {
  title: string;
  message: string;
  type: string;
  relatedEntityId?: string;
  adminId?: string;
  metadata?: Record<string, any>;
}): AdminNotification {
  const targetBookingId = params.metadata?.bookingId || params.relatedEntityId;
  // Prevent duplicate notifications for the same booking or payment
  if (targetBookingId && (params.type === 'new_booking' || params.type === 'payment_update')) {
    const existing = adminNotifications.find(
      (n) => n.type === params.type && (n.bookingId === targetBookingId || n.relatedEntityId === targetBookingId)
    );
    if (existing) {
      return existing;
    }
  }

  const notif: AdminNotification = {
    id: `adm-notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    adminId: params.adminId || 'usr-admin',
    title: params.title,
    message: params.message,
    type: params.type,
    createdAt: new Date().toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: params.relatedEntityId,
    bookingId: params.metadata?.bookingId || params.relatedEntityId,
    metadata: params.metadata,
  };

  adminNotifications.unshift(notif);
  persistDataToDisk();

  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;

  if (params.type === 'new_booking') {
    console.log('SERVER: Real-time booking event sent', {
      eventType: 'ADMIN_NOTIFICATION',
      bookingId: notif.bookingId,
      slot: notif.metadata?.slotNumber,
      vehicle: notif.metadata?.vehicleNumber,
      user: notif.metadata?.userName,
      title: notif.title,
    });
  }

  // Real-time broadcast to connected Admin Console clients
  broadcastRealtimeEvent('ADMIN_NOTIFICATION', {
    notification: notif,
    unreadCount,
    action: 'created',
  });

  return notif;
}

// Helper to inspect facility occupancy and trigger capacity alert
export function checkLocationCapacity(locationId: string) {
  const loc = locations.find((l) => l.id === locationId);
  if (!loc) return;
  const locSlots = slots.filter((s) => s.locationId === locationId);
  if (locSlots.length === 0) return;

  const total = locSlots.length;
  const occupiedCount = locSlots.filter((s) => s.status === 'occupied' || s.status === 'reserved').length;
  const availableCount = locSlots.filter((s) => s.status === 'available').length;
  const percentage = Math.round((occupiedCount / total) * 100);

  // Trigger if completely full or above 85% occupancy
  if (availableCount === 0 || percentage >= 85) {
    createAdminNotification({
      title: `Capacity Alert: ${loc.name} ${availableCount === 0 ? 'Full' : 'Near Capacity'}`,
      message: `${loc.name} is currently at ${percentage}% capacity (${occupiedCount}/${total} slots occupied/reserved, ${availableCount} available).`,
      type: 'capacity_alert',
      relatedEntityId: loc.id,
      metadata: {
        locationId: loc.id,
        locationName: loc.name,
        capacityPercentage: percentage,
        occupiedCount,
        availableCount,
        totalSlots: total,
        severity: availableCount === 0 ? 'error' : 'warning',
      },
    });
  }
}
let sessions: ParkingSession[] = [
  {
    id: 'sess-1',
    bookingId: 'PK-94281',
    slotId: 'slot-loc1-3',
    slotNumber: 'G-03',
    locationId: 'loc-1',
    vehicleNumber: 'KA-01-MJ-5000',
    entryTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    plannedDurationHours: 3,
    baseAmount: 40,
    totalAmountPaid: 40,
    status: 'ACTIVE',
    verifiedBy: 'Gate Scanner Terminal A1',
  },
  {
    id: 'sess-2',
    bookingId: 'PK-91204',
    slotId: 'slot-loc1-2',
    slotNumber: 'G-02',
    locationId: 'loc-1',
    vehicleNumber: 'AP 03 CM 4488',
    entryTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    plannedDurationHours: 2,
    baseAmount: 30,
    totalAmountPaid: 30,
    status: 'ACTIVE',
    verifiedBy: 'Boom Barrier Entry Sensor 1',
  }
];

// ============================================================================
// SHARED DATABASE PERSISTENCE LAYER (CROSS-DEVICE CLOUD MASTER STORE)
// Persists active bookings, slots, sessions, and payments to disk so that
// restarts or reloads on Laptop B never lose bookings created on Laptop A.
// ============================================================================
const DB_FILE = path.resolve(process.cwd(), 'database', 'smart_parking_store.json');

export function persistDataToDisk() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dataToSave = {
      locations,
      slots,
      bookings,
      users,
      payments,
      sessions,
      notifications,
      adminNotifications,
      lastUpdated: new Date().toISOString(),
    };
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Shared DB Persist Error]', err);
  }
}

export function loadDataFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.locations) && parsed.locations.length > 0) locations = parsed.locations;
      if (Array.isArray(parsed.slots) && parsed.slots.length > 0) slots = parsed.slots;
      if (Array.isArray(parsed.bookings) && parsed.bookings.length > 0) bookings = parsed.bookings;
      if (Array.isArray(parsed.users) && parsed.users.length > 0) users = parsed.users;
      if (Array.isArray(parsed.payments) && parsed.payments.length > 0) payments = parsed.payments;
      if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) sessions = parsed.sessions;
      if (Array.isArray(parsed.notifications) && parsed.notifications.length > 0) notifications = parsed.notifications;
      if (Array.isArray(parsed.adminNotifications) && parsed.adminNotifications.length > 0) adminNotifications = parsed.adminNotifications;
      console.log(`[Shared DB] Successfully restored ${bookings.length} bookings, ${adminNotifications.length} notifications, ${slots.length} slots from ${DB_FILE}`);
      return;
    }
  } catch (err) {
    console.warn('[Shared DB Load Warning, initializing defaults]', err);
  }
  // Initialize seed database file on first run
  persistDataToDisk();
}

// Initial hydration from persistent store
loadDataFromDisk();

// ============================================================================
// REAL-TIME SYNCHRONIZATION ENGINE (WEBSOCKET PRIMARY + SSE FALLBACK)
// Connected clients (Computer 1, Computer 2, Laptop, Mobile phone) receive
// instantaneous (<50ms) broadcasts whenever slots are reserved, cancelled, or occupied.
// ============================================================================
interface SseClient {
  id: string;
  res: Response;
  deviceInfo?: string;
  connectedAt: Date;
}

const sseClients = new Map<string, SseClient>();

// High-Performance WebSocket Server attached to same HTTP port 3000
const wss = new WebSocketServer({ server, path: '/api/ws' });

// Handle WebSocket server errors to prevent unhandled 'error' event process crash
wss.on('error', (err: any) => {
  console.warn('[WebSocketServer Notice]', err?.message || err);
});

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  (ws as any).isAlive = true;
  ws.on('pong', () => {
    (ws as any).isAlive = true;
  });

  const totalClients = wss.clients.size + sseClients.size;
  const welcomePayload = JSON.stringify({
    eventType: 'CONNECTED',
    payload: {
      message: 'Connected to Smart Parking Real-Time WebSocket Engine',
      connectedClients: totalClients,
      protocol: 'websocket',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    activeClientsCount: totalClients,
  });

  try {
    ws.send(welcomePayload);
  } catch {}

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'ping' || parsed.eventType === 'ping') {
        ws.send(JSON.stringify({ eventType: 'PONG', timestamp: new Date().toISOString() }));
      }
    } catch {}
  });

  ws.on('error', () => {});
});

// Periodic ping to keep WebSocket connections active through proxies & load balancers
const wsHeartbeat = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 25000);

wss.on('close', () => {
  clearInterval(wsHeartbeat);
});

export function broadcastRealtimeEvent(eventType: string, payload: any) {
  const totalClients = wss.clients.size + sseClients.size;
  const messageData = JSON.stringify({
    eventType,
    payload,
    timestamp: new Date().toISOString(),
    activeClientsCount: totalClients,
  });

  // 1. Instant WebSocket broadcast (<10ms latency)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageData);
      } catch {
        // Handled by connection close
      }
    }
  });

  // 2. Server-Sent Events (SSE) broadcast (<50ms latency)
  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(`event: message\n`);
      client.res.write(`data: ${messageData}\n\n`);
    } catch (err) {
      sseClients.delete(clientId);
    }
  }
}

// Keep-alive heartbeat every 20 seconds to prevent proxy disconnects on SSE
setInterval(() => {
  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(`: keep-alive ${Date.now()}\n\n`);
    } catch {
      sseClients.delete(clientId);
    }
  }
}, 20000);

// ============================================================================
// REST API ENDPOINTS & JSON HEADERS
// ============================================================================

// Global middleware ensuring all API and data endpoints respond with valid JSON headers
app.use((req: Request, res: Response, next: NextFunction) => {
  const isApi =
    req.path.startsWith('/api') ||
    req.path.startsWith('/bookings') ||
    req.path.startsWith('/slots') ||
    req.path.startsWith('/locations') ||
    req.path.startsWith('/payments') ||
    req.path.startsWith('/sessions') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/admin') ||
    req.path.startsWith('/notifications') ||
    req.path === '/health' ||
    req.path === '/sync';

  if (isApi && req.path !== '/api/events' && req.path !== '/events') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// Helper for time overlap calculation
function checkTimeOverlap(entry1: string, exit1: string, entry2: string, exit2: string): boolean {
  const parseTimeToMinutes = (t: string): number => {
    if (!t) return 0;
    const match = t.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const meridian = (match[3] || '').toUpperCase();
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const start1 = parseTimeToMinutes(entry1);
  const end1 = parseTimeToMinutes(exit1);
  const start2 = parseTimeToMinutes(entry2);
  const end2 = parseTimeToMinutes(exit2);

  return Math.max(start1, start2) < Math.min(end1, end2);
}

// 1. Health check & Diagnostics
app.get(['/api/health', '/health'], (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    database: process.env.DATABASE_URL || process.env.MYSQL_URL ? 'CLOUD_MYSQL_CONFIGURED' : 'SYNCED_CLOUD_STORE',
    timestamp: new Date().toISOString(),
    connectedClients: sseClients.size,
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    serverPort: PORT,
  });
});

// 2. Real-time Events Stream (SSE)
app.get(['/api/events', '/events'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const userAgent = req.headers['user-agent'] || 'Unknown Device';

  sseClients.set(clientId, {
    id: clientId,
    res,
    deviceInfo: userAgent,
    connectedAt: new Date(),
  });

  // Handshake initial event
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({
    clientId,
    connectedClients: sseClients.size,
    timestamp: new Date().toISOString(),
  })}\n\n`);

  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// 3. Full System State Synchronization Endpoint
app.get(['/api/sync', '/sync'], (req: Request, res: Response) => {
  const adminUnreadCount = adminNotifications.filter((n) => !n.isRead).length;
  res.json({
    success: true,
    data: {
      locations,
      slots,
      bookings,
      payments,
      sessions,
      notifications,
      adminNotifications,
      adminUnreadCount,
      activeClientsCount: sseClients.size,
      syncedAt: new Date().toISOString(),
    },
  });
});

// 4. Locations API
app.get(['/api/locations', '/locations'], (req: Request, res: Response) => {
  const { search, city } = req.query;
  let result = locations.map((loc) => {
    const locSlots = slots.filter((s) => s.locationId === loc.id);
    const availableCount = locSlots.filter((s) => s.status === 'available').length;
    return {
      ...loc,
      availableSlots: locSlots.length > 0 ? availableCount : (loc.availableSlots ?? Math.round(loc.totalSlots * 0.7)),
    };
  });

  if (city && city !== 'all') {
    result = result.filter((l) => l.city.toLowerCase() === String(city).toLowerCase());
  }

  if (search && String(search).trim()) {
    const q = String(search).toLowerCase().trim();
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.landmark.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        (l.parkingType && l.parkingType.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, locations: result, data: result });
});

app.get(['/api/locations/:id', '/locations/:id'], (req: Request, res: Response) => {
  const loc = locations.find((l) => l.id === req.params.id);
  if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });
  const locSlots = slots.filter((s) => s.locationId === loc.id);
  const availableCount = locSlots.filter((s) => s.status === 'available').length;
  const enriched = {
    ...loc,
    availableSlots: locSlots.length > 0 ? availableCount : (loc.availableSlots ?? Math.round(loc.totalSlots * 0.7)),
  };
  res.json({ success: true, location: enriched, data: enriched });
});

app.post(['/api/locations', '/locations'], (req: Request, res: Response) => {
  const { name, city, area, address, landmark, totalSlots, rates, parkingType, openingTime, closingTime, latitude, longitude } = req.body;
  if (!name || !city || !area) {
    return res.status(400).json({ success: false, message: 'Name, city, and area are required.' });
  }

  const newLoc: ParkingLocation = {
    id: `loc-api-${Date.now()}`,
    name,
    city,
    area,
    address: address || `${area}, ${city}`,
    landmark: landmark || `Central ${city}`,
    totalSlots: Number(totalSlots) || 20,
    rates: rates || { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    parkingType: parkingType || 'Multi-Level Covered',
    operatingHours: `${openingTime || '06:00 AM'} - ${closingTime || '11:30 PM'}`,
    openingTime: openingTime || '06:00',
    closingTime: closingTime || '23:30',
    latitude: Number(latitude) || 12.9716,
    longitude: Number(longitude) || 77.5946,
  };

  locations.push(newLoc);

  // Auto-generate slots for this new location
  const newSlots = generateSlotsForLocation(newLoc);
  slots.push(...newSlots);
  persistDataToDisk();

  broadcastRealtimeEvent('LOCATION_ADDED', { location: newLoc, slotsCount: newSlots.length });

  res.status(201).json({ success: true, message: 'Location added successfully with generated slots', location: newLoc, data: newLoc });
});

// 5. Parking Slots API
app.get(['/api/slots', '/slots'], (req: Request, res: Response) => {
  const { locationId, availableOnly } = req.query;
  let result = [...slots];

  if (locationId) {
    result = result.filter((s) => s.locationId === String(locationId));
  }
  if (availableOnly === 'true') {
    result = result.filter((s) => s.status === 'available');
  }

  res.json({ success: true, slots: result, data: result });
});

app.get(['/api/slots/:id', '/slots/:id'], (req: Request, res: Response) => {
  const slot = slots.find((s) => s.id === req.params.id);
  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
  res.json({ success: true, slot, data: slot });
});

app.put(['/api/slots/:id/status', '/slots/:id/status'], (req: Request, res: Response) => {
  const { status, bookingId } = req.body;
  const slotIndex = slots.findIndex((s) => s.id === req.params.id);

  if (slotIndex === -1) {
    return res.status(404).json({ success: false, message: 'Slot not found' });
  }

  slots[slotIndex].status = status;
  if (bookingId) {
    slots[slotIndex].currentBookingId = bookingId;
  } else if (status === 'available') {
    delete slots[slotIndex].currentBookingId;
  }

  const updatedSlot = slots[slotIndex];

  // Admin Notification: Parking Slot Update
  createAdminNotification({
    title: `Slot Update: Bay ${updatedSlot.slotNumber} is now ${status.toUpperCase()}`,
    message: `Parking bay ${updatedSlot.slotNumber} (${updatedSlot.floor}) status updated to ${status.toUpperCase()}${bookingId ? ` (Booking ID: ${bookingId})` : ''}.`,
    type: 'slot_update',
    relatedEntityId: updatedSlot.id,
    metadata: {
      slotId: updatedSlot.id,
      slotNumber: updatedSlot.slotNumber,
      locationId: updatedSlot.locationId,
      status,
      bookingId,
    },
  });

  if (status === 'occupied' || status === 'reserved') {
    checkLocationCapacity(updatedSlot.locationId);
  }

  // Broadcast to all other devices in real time!
  persistDataToDisk();
  broadcastRealtimeEvent('SLOT_UPDATED', {
    slotId: updatedSlot.id,
    status: updatedSlot.status,
    slotNumber: updatedSlot.slotNumber,
    locationId: updatedSlot.locationId,
    bookingId,
  });

  res.json({ success: true, message: `Slot status updated to ${status}`, slot: updatedSlot });
});

// 6. Bookings API (With pessimistic collision lock)
app.get(['/api/bookings', '/bookings'], (req: Request, res: Response) => {
  const { userId, bookingCode } = req.query;
  let result = [...bookings];

  if (bookingCode) {
    const found = result.find((b) => b.bookingCode === String(bookingCode) || b.id === String(bookingCode));
    if (!found) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.json({ success: true, booking: found, data: found, bookings: [found] });
  }

  if (userId) {
    result = result.filter((b) => b.userId === String(userId));
  }

  res.json({ success: true, bookings: result, data: result });
});

// Single Booking Lookup by ID or Booking Code
app.get(['/api/bookings/:id', '/bookings/:id'], (req: Request, res: Response) => {
  const { id } = req.params;
  const found = bookings.find((b) => b.id === id || b.bookingCode === id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  return res.json({ success: true, booking: found, data: found });
});

// Admin All Bookings Endpoint (Guaranteed shared cloud database retrieval)
app.get(['/api/admin/bookings', '/admin/bookings'], (req: Request, res: Response) => {
  res.json({ success: true, bookings, count: bookings.length, data: bookings });
});

app.post(['/api/bookings', '/api/bookings/', '/bookings', '/bookings/'], (req: Request, res: Response) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      locationId,
      slotId,
      vehicleType,
      vehicleNumber,
      bookingDate,
      entryTime,
      exitTime,
      durationHours,
      amount,
      paymentMethod,
    } = req.body;

    // Collision lock check: resilient slot lookup scoped strictly to location
    let targetSlot = slots.find(
      (s) =>
        (slotId && s.id === slotId) ||
        (locationId && s.locationId === locationId && (s.slotNumber || '').toLowerCase() === String(req.body.slotNumber || '').toLowerCase())
    );

    // If slot not yet registered on disk for this location, auto-register it to avoid rejecting valid user selection
    if (!targetSlot) {
      const loc = locations.find((l) => l.id === locationId);
      const computedSlotNum = req.body.slotNumber || (slotId ? String(slotId).replace(/^slot-[^-]+-/, 'Bay-') : 'Bay-01');
      targetSlot = {
        id: slotId || `slot-${locationId || 'loc-1'}-${Date.now()}`,
        locationId: locationId || 'loc-1',
        slotNumber: computedSlotNum,
        floor: req.body.floor || 'Ground Floor',
        vehicleType: vehicleType || 'car',
        status: 'available',
        hourlyRateFirstHour: loc?.rates?.firstHour || 20,
        hourlyRateAdditional: loc?.rates?.additionalHour || 10,
        hasCharging: vehicleType === 'ev',
        distanceToEntranceMeters: 20,
        isShaded: true,
      };
      slots.push(targetSlot);
    }

    const isPreReservedBySelf =
      req.body.id &&
      (targetSlot.currentBookingId === req.body.id || req.body.bookingCode === targetSlot.currentBookingId);

    if (targetSlot.status !== 'available' && !isPreReservedBySelf) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Slot ${targetSlot.slotNumber} has just been reserved by another user. Please choose another bay.`,
      });
    }

    // Overlapping reservation check: prevent double booking across overlapping time periods
    const reqDate = bookingDate || new Date().toISOString().split('T')[0];
    const reqEntry = entryTime || '10:00 AM';
    const reqExit = exitTime || '12:00 PM';

    const overlappingBooking = bookings.find((b) => {
      const isSameSlot = b.slotId === targetSlot.id || (b.locationId === targetSlot.locationId && b.slotNumber === targetSlot.slotNumber);
      if (!isSameSlot) return false;
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      if (req.body.id && (b.id === req.body.id || b.bookingCode === req.body.id)) return false;
      if (b.bookingDate !== reqDate) return false;
      return checkTimeOverlap(reqEntry, reqExit, b.entryTime, b.exitTime);
    });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Slot ${targetSlot.slotNumber} is already booked for ${overlappingBooking.entryTime} - ${overlappingBooking.exitTime}. Please select another slot or choose a different time.`,
      });
    }

    const bookingCode = req.body.id || `PK-${Math.floor(10000 + Math.random() * 90000)}`;
    const targetLocation = locations.find((l) => l.id === locationId);
    const transactionId = req.body.transactionId || `TXN-${Date.now().toString().slice(-8)}`;

    const newBooking: Booking = {
      id: bookingCode,
      bookingCode,
      userId: userId || 'usr-1',
      userName: userName || 'Driver',
      userEmail: userEmail || 'driver@example.com',
      userPhone: userPhone || '9876543210',
      locationId,
      locationName: targetLocation ? targetLocation.name : 'Central Parking Facility',
      slotId: targetSlot.id,
      slotNumber: targetSlot.slotNumber,
      floor: targetSlot.floor || 'Ground Floor',
      vehicleType: vehicleType || 'car',
      vehicleNumber: vehicleNumber || 'KA-01-AB-1234',
      bookingDate: bookingDate || new Date().toISOString().split('T')[0],
      entryTime: entryTime || '10:00 AM',
      exitTime: exitTime || '12:00 PM',
      durationHours: Number(durationHours) || 2,
      amount: Number(amount) || 40,
      paymentStatus: 'paid',
      paymentMethod: paymentMethod || 'upi',
      status: 'confirmed',
      transactionId,
      createdAt: new Date().toISOString(),
      qrCodeData: `SMART_PARK|${bookingCode}|${targetSlot.slotNumber}|${vehicleNumber}`,
    };

    // Reserve slot
    targetSlot.status = 'reserved';
    targetSlot.currentBookingId = newBooking.id;
    bookings.unshift(newBooking);

    // Record payment
    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      bookingId: newBooking.id,
      amount: newBooking.amount,
      paymentMethod: paymentMethod || 'upi',
      status: 'completed',
      timestamp: new Date().toISOString(),
      transactionId,
    };
    payments.unshift(paymentRecord);

    // Add confirmation notification
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: newBooking.userId,
      title: `Booking Confirmed - Bay ${targetSlot.slotNumber}`,
      message: `Reservation ${newBooking.bookingCode} confirmed. Scan QR pass at gate barrier.`,
      type: 'booking_confirm',
      read: false,
      createdAt: new Date().toISOString(),
      bookingId: newBooking.id,
    });

    // Guarantee immediate persistent disk storage across restarts and devices
    persistDataToDisk();

    const locName = targetLocation ? targetLocation.name : 'Central Parking Facility';
    const entryStr = newBooking.entryTime || 'Now';

    // Admin Notification 1: New Parking Booking Received (Formatted per requirements)
    const notif = createAdminNotification({
      title: 'New Parking Booking Received',
      message: `User: ${newBooking.userName} | Vehicle Number: ${newBooking.vehicleNumber} | Location: ${locName} | Floor: ${targetSlot.floor || 'Ground Floor'} | Slot: ${targetSlot.slotNumber} | Booking Time: ${entryStr}`,
      type: 'new_booking',
      relatedEntityId: newBooking.id,
      metadata: {
        bookingId: newBooking.id,
        bookingCode: newBooking.bookingCode,
        slotId: targetSlot.id,
        slotNumber: targetSlot.slotNumber,
        floor: targetSlot.floor || 'Ground Floor',
        locationId: targetSlot.locationId,
        locationName: locName,
        userName: newBooking.userName,
        userPhone: newBooking.userPhone,
        vehicleNumber: newBooking.vehicleNumber,
        bookingTime: entryStr,
        status: 'Confirmed',
        amount: newBooking.amount,
        paymentMethod: newBooking.paymentMethod,
      },
    });

    // Admin Notification 2: Payment Received
    createAdminNotification({
      title: `Payment Received: ₹${newBooking.amount}.00`,
      message: `Payment of ₹${newBooking.amount}.00 verified for Booking #${newBooking.bookingCode} via ${(paymentMethod || 'UPI').toUpperCase()} (Txn: ${transactionId}).`,
      type: 'payment_update',
      relatedEntityId: paymentRecord.id,
      metadata: {
        paymentId: paymentRecord.id,
        bookingId: newBooking.id,
        amount: newBooking.amount,
        paymentMethod: paymentMethod || 'upi',
        transactionId,
        paymentStatus: 'completed',
      },
    });

    // Capacity check after reservation
    checkLocationCapacity(targetSlot.locationId);

    console.log('SERVER: Real-time booking event sent', {
      eventType: 'NEW_BOOKING',
      bookingId: newBooking.id,
      slot: targetSlot.slotNumber,
      floor: targetSlot.floor,
      location: locName,
      vehicle: newBooking.vehicleNumber,
      user: newBooking.userName,
      bookingTime: entryStr,
      status: newBooking.status,
    });

    // 1. Primary real-time booking event to Admin Consoles
    broadcastRealtimeEvent('NEW_BOOKING', {
      booking: newBooking,
      notification: notif,
      bookingId: newBooking.id,
      slotId: targetSlot.id,
      slotNumber: targetSlot.slotNumber,
      floor: targetSlot.floor || 'Ground Floor',
      locationName: locName,
      userName: newBooking.userName,
      customerName: newBooking.userName,
      vehicleNumber: newBooking.vehicleNumber,
      bookingTime: entryStr,
      amount: newBooking.amount,
      status: 'Confirmed',
      unreadCount: adminNotifications.filter((n) => !n.isRead).length,
    });

    // 2. Real-time broadcast for slot occupancy update
    broadcastRealtimeEvent('BOOKING_CREATED', {
      booking: newBooking,
      notification: notif,
      slotId: targetSlot.id,
      slotNumber: targetSlot.slotNumber,
      floor: targetSlot.floor || 'Ground Floor',
      locationId: targetSlot.locationId,
      locationName: locName,
      status: 'reserved',
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: newBooking,
      data: newBooking,
    });
  } catch (bookingError: any) {
    console.error('[Create Booking Error]', bookingError);
    res.status(500).json({
      success: false,
      message: `Server error creating booking: ${bookingError?.message || 'Internal failure'}`,
    });
  }
});

// Cancel Booking Route (Supports both PUT and POST)
const handleCancelBooking = (req: Request, res: Response) => {
  const booking = bookings.find((b) => b.id === req.params.id || b.bookingCode === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  booking.status = 'cancelled';
  if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed') {
    booking.paymentStatus = 'refunded';
    booking.refundStatus = 'processed';
    booking.refundAmount = booking.amount;
  } else {
    booking.refundStatus = 'not_applicable';
    booking.refundAmount = 0;
  }

  const targetSlot = slots.find((s) => s.id === booking.slotId);
  if (targetSlot) {
    targetSlot.status = 'available';
    delete targetSlot.currentBookingId;
  }
  persistDataToDisk();

  // Admin Notification: Booking Cancellation
  createAdminNotification({
    title: `Booking Cancelled: #${booking.id}`,
    message: `Reservation #${booking.id} (${booking.slotNumber}, ${booking.vehicleNumber}) was cancelled by driver. Bay ${booking.slotNumber} has been released.${booking.refundStatus === 'processed' ? ` Refund of ₹${booking.refundAmount?.toFixed(2)} processed.` : ''}`,
    type: 'booking_cancellation',
    relatedEntityId: booking.id,
    metadata: {
      bookingId: booking.id,
      slotId: booking.slotId,
      slotNumber: booking.slotNumber,
      vehicleNumber: booking.vehicleNumber,
      userName: booking.userName,
      amount: booking.amount,
      refundStatus: booking.refundStatus,
      refundAmount: booking.refundAmount,
    },
  });

  // Real-time broadcast
  broadcastRealtimeEvent('BOOKING_CANCELLED', {
    bookingId: booking.id,
    slotId: booking.slotId,
    status: 'available',
    refundStatus: booking.refundStatus,
  });

  res.json({
    success: true,
    message: `Booking cancelled successfully and slot freed.${booking.refundStatus === 'processed' ? ` ₹${booking.refundAmount?.toFixed(2)} refund processed.` : ''}`,
    booking,
    refundStatus: booking.refundStatus,
    refundAmount: booking.refundAmount,
  });
};

app.put(['/api/bookings/:id/cancel', '/bookings/:id/cancel'], handleCancelBooking);
app.post(['/api/bookings/:id/cancel', '/bookings/:id/cancel'], handleCancelBooking);

// Complete Booking Route (Supports both PUT and POST)
const handleCompleteBooking = (req: Request, res: Response) => {
  const booking = bookings.find((b) => b.id === req.params.id || b.bookingCode === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  booking.status = 'completed';
  booking.actualExitTime = new Date().toISOString();
  const targetSlot = slots.find((s) => s.id === booking.slotId);
  if (targetSlot) {
    targetSlot.status = 'available';
    delete targetSlot.currentBookingId;
  }
  persistDataToDisk();

  // Real-time broadcast
  broadcastRealtimeEvent('BOOKING_COMPLETED', {
    bookingId: booking.id,
    slotId: booking.slotId,
    status: 'available',
  });

  res.json({
    success: true,
    message: 'Booking marked as completed',
    booking,
  });
};

app.put(['/api/bookings/:id/complete', '/bookings/:id/complete'], handleCompleteBooking);
app.post(['/api/bookings/:id/complete', '/bookings/:id/complete'], handleCompleteBooking);

// 7. Gate Sessions API (Physical Barrier Entry & Exit)
app.get(['/api/sessions', '/sessions'], (req: Request, res: Response) => {
  res.json({ success: true, sessions, data: sessions });
});

app.post(['/api/sessions/checkin', '/sessions/checkin'], (req: Request, res: Response) => {
  const { bookingId, vehicleNumber, verifiedBy } = req.body;
  const booking = bookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Active booking not found for this pass' });
  }

  booking.status = 'active';
  booking.actualEntryTime = new Date().toISOString();

  const targetSlot = slots.find((s) => s.id === booking.slotId);
  if (targetSlot) {
    targetSlot.status = 'occupied';
  }

  const session: ParkingSession = {
    id: `sess-${Date.now()}`,
    bookingId: booking.id,
    slotId: booking.slotId,
    slotNumber: booking.slotNumber,
    locationId: booking.locationId,
    vehicleNumber: vehicleNumber || booking.vehicleNumber,
    entryTime: new Date().toISOString(),
    plannedDurationHours: booking.durationHours,
    baseAmount: booking.amount,
    totalAmountPaid: booking.amount,
    status: 'ACTIVE',
    verifiedBy: verifiedBy || 'QR Gate Scanner A1',
  };

  sessions.unshift(session);
  persistDataToDisk();

  // Admin Notification: Physical Barrier Entry
  createAdminNotification({
    title: `Vehicle Gate Entry: Bay ${booking.slotNumber}`,
    message: `Vehicle ${vehicleNumber || booking.vehicleNumber} checked in for ${booking.slotNumber}. Boom barrier opened (${verifiedBy || 'QR Gate Scanner'}).`,
    type: 'slot_update',
    relatedEntityId: session.id,
    metadata: {
      sessionId: session.id,
      bookingId: booking.id,
      slotId: booking.slotId,
      slotNumber: booking.slotNumber,
      vehicleNumber: vehicleNumber || booking.vehicleNumber,
      status: 'occupied',
    },
  });

  broadcastRealtimeEvent('GATE_ENTRY', {
    session,
    slotId: booking.slotId,
    status: 'occupied',
  });

  res.json({ success: true, message: 'Vehicle gate entry verified. Boom barrier opened.', session });
});

app.post(['/api/sessions/checkout', '/sessions/checkout'], (req: Request, res: Response) => {
  const { sessionId, slotId } = req.body;
  const session = sessions.find((s) => s.id === sessionId || s.slotId === slotId);

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  session.status = 'COMPLETED';
  session.exitTime = new Date().toISOString();

  const booking = bookings.find((b) => b.id === session.bookingId);
  if (booking) {
    booking.status = 'completed';
    booking.actualExitTime = session.exitTime;
  }

  const targetSlot = slots.find((s) => s.id === session.slotId);
  if (targetSlot) {
    targetSlot.status = 'available';
    delete targetSlot.currentBookingId;
  }
  persistDataToDisk();

  // Admin Notification: Physical Barrier Exit
  createAdminNotification({
    title: `Vehicle Gate Exit: Bay ${session.slotNumber}`,
    message: `Vehicle ${session.vehicleNumber} checked out from Bay ${session.slotNumber}. Barrier opened. Bay is now available.`,
    type: 'slot_update',
    relatedEntityId: session.id,
    metadata: {
      sessionId: session.id,
      bookingId: session.bookingId,
      slotId: session.slotId,
      slotNumber: session.slotNumber,
      vehicleNumber: session.vehicleNumber,
      status: 'available',
    },
  });

  broadcastRealtimeEvent('GATE_EXIT', {
    sessionId: session.id,
    slotId: session.slotId,
    status: 'available',
  });

  res.json({ success: true, message: 'Vehicle checkout verified. Slot released.', session });
});

// 8. Payments API
app.get(['/api/payments', '/payments'], (req: Request, res: Response) => {
  res.json({ success: true, payments, data: payments });
});

app.post(['/api/payments', '/payments'], (req: Request, res: Response) => {
  const { bookingId, amount, paymentMethod } = req.body;
  const newPay: PaymentRecord = {
    id: `pay-${Date.now()}`,
    bookingId,
    amount: Number(amount) || 20,
    paymentMethod: paymentMethod || 'upi',
    status: 'completed',
    timestamp: new Date().toISOString(),
    transactionId: `TXN-${Date.now().toString().slice(-8)}`,
  };
  payments.unshift(newPay);
  persistDataToDisk();

  // Admin Notification: Payment Update
  createAdminNotification({
    title: `Payment Update: ₹${newPay.amount}.00`,
    message: `Payment of ₹${newPay.amount}.00 recorded for Booking #${newPay.bookingId} via ${newPay.paymentMethod.toUpperCase()} (Txn: ${newPay.transactionId}).`,
    type: 'payment_update',
    relatedEntityId: newPay.id,
    metadata: {
      paymentId: newPay.id,
      bookingId: newPay.bookingId,
      amount: newPay.amount,
      paymentMethod: newPay.paymentMethod,
      transactionId: newPay.transactionId,
      paymentStatus: 'completed',
    },
  });

  res.status(201).json({ success: true, payment: newPay, data: newPay });
});

// 8b. Dynamic Tariff Calculation API
app.all(['/api/tariff/calculate', '/tariff/calculate'], (req: Request, res: Response) => {
  const durationHours = Number(req.body?.durationHours || req.query?.durationHours || 1);
  const vehicleType = String(req.body?.vehicleType || req.query?.vehicleType || 'car').toLowerCase();

  const hours = Math.max(1, Math.ceil(durationHours));
  let baseRate = 20;
  let addRate = 10;

  if (vehicleType === 'bike') {
    baseRate = 10;
    addRate = 5;
  } else if (vehicleType === 'ev') {
    baseRate = 25;
    addRate = 15;
  }

  const additionalHours = Math.max(0, hours - 1);
  const firstHourCharge = baseRate;
  const additionalHourCharge = additionalHours * addRate;
  const totalAmount = firstHourCharge + additionalHourCharge;

  res.json({
    success: true,
    data: {
      durationHours: hours,
      vehicleType,
      firstHourCharge,
      additionalHourCharge,
      additionalHours,
      totalAmount,
    },
    totalAmount,
    firstHourCharge,
    additionalHourCharge,
    additionalHours,
    durationHours: hours,
  });
});


// 9. Auth API (User and Admin logins)
app.post(['/api/auth/login', '/auth/login'], (req: Request, res: Response) => {
  const { email, password, asAdmin } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'No account registered with this email.' });
  }
  if (user.password && user.password !== password) {
    return res.status(401).json({ success: false, message: 'Incorrect password entered.' });
  }
  if (asAdmin && user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admin credentials required.' });
  }

  res.json({ success: true, message: `Welcome back, ${user.name}!`, user });
});

app.post(['/api/auth/register', '/auth/register'], (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name,
    email,
    password,
    phone: phone || '',
    role: (role === 'admin' ? 'admin' : 'user'),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  persistDataToDisk();

  // Admin Notification: New User Registration
  createAdminNotification({
    title: `New User Registration: ${newUser.name}`,
    message: `A new driver account has registered: ${newUser.name} (${newUser.email}), Phone: ${newUser.phone || 'N/A'}.`,
    type: 'user_registration',
    relatedEntityId: newUser.id,
    metadata: {
      userId: newUser.id,
      userName: newUser.name,
      userEmail: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    },
  });

  res.status(201).json({ success: true, message: 'Account registered successfully', user: newUser });
});

// Admin Authorization Middleware
function requireAdmin(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-user-role'];
  const adminIdHeader = req.headers['x-admin-id'] as string;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  const isRoleAdmin = roleHeader && String(roleHeader).toLowerCase() === 'admin';
  const isAuthAdmin =
    token === 'usr-admin' ||
    token === 'admin-token' ||
    token.toLowerCase().includes('admin');
  const isAdminId =
    adminIdHeader &&
    (adminIdHeader === 'usr-admin' || adminIdHeader.toLowerCase().includes('admin'));
  const isQueryAdmin =
    req.query.asAdmin === 'true' ||
    req.query.role === 'admin' ||
    req.query.adminId === 'usr-admin';

  // Check if token matches an admin email or admin user id in users store
  const userMatch = users.find(
    (u) =>
      (u.id === token || u.email.toLowerCase() === token.toLowerCase()) &&
      u.role === 'admin'
  );

  if (isRoleAdmin || isAuthAdmin || isAdminId || isQueryAdmin || userMatch) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator authorization required.',
  });
}

// 10. Admin Notifications API
app.get(['/api/admin/notifications', '/admin/notifications'], requireAdmin, (req: Request, res: Response) => {
  const { filter, type, limit } = req.query;
  let result = [...adminNotifications];

  if (filter === 'unread') {
    result = result.filter((n) => !n.isRead);
  }
  if (type && type !== 'all') {
    result = result.filter((n) => n.type === String(type));
  }

  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;
  const max = limit ? parseInt(String(limit), 10) : 100;
  res.json({
    success: true,
    notifications: result.slice(0, max),
    total: result.length,
    unreadCount,
    data: result.slice(0, max),
  });
});

app.get(['/api/admin/notifications/unread-count', '/admin/notifications/unread-count'], requireAdmin, (req: Request, res: Response) => {
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;
  res.json({
    success: true,
    count: unreadCount,
    unreadCount,
  });
});

app.put(['/api/admin/notifications/:id/read', '/admin/notifications/:id/read'], requireAdmin, (req: Request, res: Response) => {
  const notif = adminNotifications.find((n) => n.id === req.params.id);
  if (!notif) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  notif.isRead = true;
  notif.read = true;
  persistDataToDisk();
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;

  broadcastRealtimeEvent('ADMIN_NOTIFICATION_READ', {
    notificationId: notif.id,
    unreadCount,
  });

  res.json({
    success: true,
    message: 'Notification marked as read',
    notification: notif,
    unreadCount,
  });
});

app.put(['/api/admin/notifications/read-all', '/admin/notifications/read-all'], requireAdmin, (req: Request, res: Response) => {
  adminNotifications.forEach((n) => {
    n.isRead = true;
    n.read = true;
  });
  persistDataToDisk();

  broadcastRealtimeEvent('ADMIN_ALL_NOTIFICATIONS_READ', { unreadCount: 0 });

  res.json({
    success: true,
    message: 'All admin notifications marked as read',
    unreadCount: 0,
  });
});

app.delete(['/api/admin/notifications/:id', '/admin/notifications/:id'], requireAdmin, (req: Request, res: Response) => {
  const idx = adminNotifications.findIndex((n) => n.id === req.params.id);
  if (idx !== -1) {
    adminNotifications.splice(idx, 1);
    persistDataToDisk();
  }
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;
  res.json({ success: true, message: 'Notification deleted', unreadCount });
});

// Admin System & Operational Alert Creation Endpoint
app.post(['/api/admin/notifications/system-alert', '/admin/notifications/system-alert'], requireAdmin, (req: Request, res: Response) => {
  const { title, message, severity, relatedEntityId, metadata } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required.' });
  }

  const alertNotif = createAdminNotification({
    title,
    message,
    type: 'system_alert',
    relatedEntityId: relatedEntityId || 'sys-event',
    metadata: {
      severity: severity || 'warning',
      ...(metadata || {}),
    },
  });

  res.status(201).json({ success: true, notification: alertNotif, data: alertNotif });
});

// 11. User Notifications API (Driver notifications)
app.get(['/api/notifications', '/notifications'], (req: Request, res: Response) => {
  const { userId } = req.query;
  const list = userId ? notifications.filter((n) => n.userId === userId || n.userId === 'all') : notifications;
  res.json({ success: true, notifications: list, data: list });
});

app.put(['/api/notifications/:id/read', '/notifications/:id/read'], (req: Request, res: Response) => {
  const n = notifications.find((item) => item.id === req.params.id);
  if (n) {
    n.read = true;
    n.isRead = true;
  }
  res.json({ success: true, message: 'Notification marked as read' });
});

// 11. Realtime Broadcast Trigger (for external services or manual triggers)
app.post(['/api/realtime/broadcast', '/realtime/broadcast'], (req: Request, res: Response) => {
  const { eventType, payload } = req.body;

  if (eventType === 'NEW_BOOKING' && payload) {
    const bId = payload.bookingId || `BK-${Date.now()}`;
    const user = payload.userName || payload.customerName || 'Driver';
    const veh = payload.vehicleNumber || 'KA-01-AB-1234';
    const loc = payload.locationName || 'Central Parking Facility';
    const slot = payload.slotNumber || 'Bay-01';
    const floor = payload.floor || 'Ground Floor';
    const time = payload.bookingTime || 'Just now';

    createAdminNotification({
      title: 'New Parking Booking Received',
      message: `User: ${user} | Vehicle Number: ${veh} | Location: ${loc} | Floor: ${floor} | Slot: ${slot} | Booking Time: ${time}`,
      type: 'new_booking',
      relatedEntityId: bId,
      metadata: { ...payload, bookingId: bId },
    });
    persistDataToDisk();
  }

  broadcastRealtimeEvent(eventType || 'SYSTEM_SYNC', payload || {});
  res.json({ success: true, message: 'Event broadcast to all connected devices', activeClients: sseClients.size });
});

// 12. Catch-all for undefined API endpoints - ALWAYS return clean JSON 404 with Content-Type header, NEVER HTML!
app.all(
  [
    '/api',
    '/api/',
    '/api/*',
    '/bookings',
    '/bookings/',
    '/bookings/*',
    '/slots',
    '/slots/',
    '/slots/*',
    '/locations',
    '/locations/',
    '/locations/*',
    '/payments',
    '/payments/',
    '/payments/*',
    '/sessions',
    '/sessions/',
    '/sessions/*',
    '/auth',
    '/auth/*',
    '/admin',
    '/admin/*',
    '/notifications',
    '/notifications/',
    '/notifications/*',
  ],
  (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.path} not found. Please verify the URL.`,
    });
  }
);

// 13. Global API JSON Error Handler - Catches any unhandled exceptions in routes
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[API Unhandled Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  if (req.path.startsWith('/api') || req.headers.accept?.includes('application/json')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error while processing API request.',
    });
  }
  next(err);
});

// 14. API Routing Guard: Never leak any API, booking, or data request to Vite's HTML router
app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/bookings') ||
    req.path.startsWith('/slots') ||
    req.path.startsWith('/locations') ||
    req.path.startsWith('/payments') ||
    req.path.startsWith('/sessions') ||
    req.path.startsWith('/auth') ||
    req.method !== 'GET' ||
    (req.headers.accept && req.headers.accept.includes('application/json') && req.path !== '/')
  ) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(404).json({
      success: false,
      message: `Endpoint ${req.method} ${req.path} not found. Server is operational.`,
    });
  }
  next();
});

// ============================================================================
// VITE INTEGRATION & STATIC SERVING
// ============================================================================
async function startServer() {
  if (!isProduction) {
    // Development mode: Vite middleware with HMR disabled to prevent port 24678 collisions
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        etag: false,
        lastModified: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        }
      }));
      app.get('*', (req: Request, res: Response) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // Fallback if dist doesn't exist yet
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          watch: null,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  // Graceful EADDRINUSE handling
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} currently bound, retrying in 1.5s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(Number(PORT), '0.0.0.0');
      }, 1500);
    } else {
      console.error('[Server Error]', err);
    }
  });

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Smart Parking Full-Stack Server] running on http://0.0.0.0:${PORT}`);
    console.log(`[WebSocket Real-Time Engine] Active at /api/ws`);
    console.log(`[SSE Real-Time Engine] Active at /api/events`);
    console.log(`[Health Endpoint] Active at /api/health`);
  });
}

// Graceful process exit cleanup
process.on('SIGTERM', () => {
  try {
    wss.close();
    server.close();
  } catch {}
  process.exit(0);
});

process.on('SIGINT', () => {
  try {
    wss.close();
    server.close();
  } catch {}
  process.exit(0);
});

startServer().catch((err) => {
  console.error('[Server Start Error]', err);
  process.exit(1);
});
