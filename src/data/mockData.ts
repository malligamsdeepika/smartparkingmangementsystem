import { ParkingLocation, ParkingSlot, User, Booking, PaymentRecord } from '../types';

export const INITIAL_LOCATIONS: ParkingLocation[] = [
  // --- BANGALORE FACILITIES (Including 4 Original Demo Locations) ---
  {
    id: 'loc-1',
    name: 'Metro City Center Plaza',
    city: 'Bangalore',
    area: 'MG Road Commercial District',
    address: 'Plot 42, Central Boulevard, Near MG Road Metro Station',
    landmark: 'Opposite Metro Gate 2',
    totalSlots: 48,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    latitude: 12.9756,
    longitude: 77.6066,
    parkingType: 'Multi-Level Covered',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 80 2558 9100',
    distanceFromCampusKm: 1.2,
  },
  {
    id: 'loc-2',
    name: 'CyberTech IT Park Parking',
    city: 'Bangalore',
    area: 'Whitefield Tech Corridor',
    address: 'Block C, Electronic City Phase 1, Tech Boulevard',
    landmark: 'Near Software Technology Park Gate 4',
    totalSlots: 20,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    latitude: 12.9854,
    longitude: 77.7289,
    parkingType: 'Underground Basement',
    operatingHours: '06:00 AM - 11:30 PM',
    openingTime: '06:00',
    closingTime: '23:30',
    contactPhone: '+91 80 4112 3400',
    distanceFromCampusKm: 4.5,
  },
  {
    id: 'loc-3',
    name: 'Grand Central Shopping Mall',
    city: 'Bangalore',
    area: 'Koramangala 5th Block',
    address: '80ft Road, Sector 6, Next to Multiplex Arena',
    landmark: 'Basement Level B1 & B2',
    totalSlots: 18,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    latitude: 12.9345,
    longitude: 77.6189,
    parkingType: 'Multi-Level Covered',
    operatingHours: '09:00 AM - 11:00 PM',
    openingTime: '09:00',
    closingTime: '23:00',
    contactPhone: '+91 80 2553 4411',
    distanceFromCampusKm: 2.8,
  },
  {
    id: 'loc-4',
    name: 'Railway Junction Station South',
    city: 'Bangalore',
    area: 'Majestic Railway Hub',
    address: 'Platform 1 Circulating Area, Station Approach Rd',
    landmark: 'Next to Prepaid Auto Stand',
    totalSlots: 16,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    latitude: 12.9782,
    longitude: 77.5694,
    parkingType: 'Open Air Surface',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 80 2287 1420',
    distanceFromCampusKm: 5.1,
  },
  {
    id: 'loc-bng-5',
    name: 'Kempegowda International Airport Parking T1',
    city: 'Bangalore',
    area: 'Devanahalli Airport Zone',
    address: 'P4 Multi-Level Car Park, Terminal 1 Boulevard',
    landmark: 'Opposite Terminal 1 Departure Gate 3',
    totalSlots: 32,
    rates: { firstHour: 30, additionalHour: 15 },
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    latitude: 13.1986,
    longitude: 77.7066,
    parkingType: 'Smart Automated Stack',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 80 6678 2222',
    distanceFromCampusKm: 18.0,
  },

  // --- TIRUPATI FACILITIES ---
  {
    id: 'loc-tpt-1',
    name: 'Tirupati Alipiri Grand Transit Parking',
    city: 'Tirupati',
    area: 'Alipiri Footway & Toll Gate',
    address: 'Alipiri Bypass Road, Near Footway Entrance to Seven Hills',
    landmark: 'Adjacent to Alipiri Garuda Statue & Srivari Mettu Hub',
    totalSlots: 26,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    latitude: 13.6521,
    longitude: 79.3942,
    parkingType: 'Multi-Level Covered',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 877 227 7777',
    distanceFromCampusKm: 3.2,
  },
  {
    id: 'loc-tpt-2',
    name: 'Tirupati Central Railway Station West Bay',
    city: 'Tirupati',
    area: 'Gandhi Road Station Hub',
    address: 'Platform 4 West Circulating Area, Station Approach Rd',
    landmark: 'Near APSRTC Central Bus Station Walkway',
    totalSlots: 20,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    latitude: 13.6288,
    longitude: 79.4192,
    parkingType: 'Open Air Surface',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 877 222 5555',
    distanceFromCampusKm: 1.5,
  },
  {
    id: 'loc-tpt-3',
    name: 'Tirumala Balaji SV Ground Parking',
    city: 'Tirupati',
    area: 'Tirumala Hill Top',
    address: 'Outer Ring Road, Near PAC 4 & Annaprasadam Complex',
    landmark: 'Behind SV Guest House & Pilgrim Amenities Center',
    totalSlots: 24,
    rates: { firstHour: 25, additionalHour: 15 },
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    latitude: 13.6833,
    longitude: 79.3472,
    parkingType: 'Multi-Level Covered',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 877 226 3333',
    distanceFromCampusKm: 14.0,
  },
  {
    id: 'loc-tpt-4',
    name: 'Bairagi Patteda Smart City Parking',
    city: 'Tirupati',
    area: 'Bairagi Patteda Commercial Area',
    address: 'Main Commercial Street, Opposite Municipal Children Park',
    landmark: 'Near Tirupati Smart City Command Center',
    totalSlots: 18,
    rates: { firstHour: 15, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    latitude: 13.6190,
    longitude: 79.4310,
    parkingType: 'Smart Automated Stack',
    operatingHours: '06:00 AM - 11:00 PM',
    openingTime: '06:00',
    closingTime: '23:00',
    contactPhone: '+91 877 224 8899',
    distanceFromCampusKm: 2.1,
  },

  // --- CHENNAI FACILITIES ---
  {
    id: 'loc-chn-1',
    name: 'Chennai Central Station North Plaza',
    city: 'Chennai',
    area: 'Park Town Heritage Zone',
    address: 'Poonamallee High Road, Gate 3 Concourse',
    landmark: 'Near Central Metro Station Exit 2 & Moore Market',
    totalSlots: 28,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    latitude: 13.0827,
    longitude: 80.2707,
    parkingType: 'Multi-Level Covered',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 44 2535 3535',
    distanceFromCampusKm: 4.0,
  },
  {
    id: 'loc-chn-2',
    name: 'T-Nagar Ranganathan Street Smart Parking',
    city: 'Chennai',
    area: 'T-Nagar Retail Hub',
    address: 'Thanikachalam Road, Near Usman Road Junction',
    landmark: 'Adjacent to T-Nagar Elevated Flyover & Shopping Mall',
    totalSlots: 24,
    rates: { firstHour: 25, additionalHour: 15 },
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    latitude: 13.0418,
    longitude: 80.2341,
    parkingType: 'Smart Automated Stack',
    operatingHours: '07:00 AM - 11:30 PM',
    openingTime: '07:00',
    closingTime: '23:30',
    contactPhone: '+91 44 2434 8800',
    distanceFromCampusKm: 6.2,
  },
  {
    id: 'loc-chn-3',
    name: 'Marina Beach Promenade Parking Lot',
    city: 'Chennai',
    area: 'Triplicane Seafront',
    address: 'Kamarajar Salai, Next to Light House & Marina Deck',
    landmark: 'Opposite Queen Marys College & Gandhi Statue',
    totalSlots: 20,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    latitude: 13.0544,
    longitude: 80.2828,
    parkingType: 'Open Air Surface',
    operatingHours: '05:00 AM - 11:30 PM',
    openingTime: '05:00',
    closingTime: '23:30',
    contactPhone: '+91 44 2844 1200',
    distanceFromCampusKm: 7.5,
  },
  {
    id: 'loc-chn-4',
    name: 'OMR IT Corridor Park & Ride Deck',
    city: 'Chennai',
    area: 'Sholinganallur Tech Corridor',
    address: 'Rajiv Gandhi Salai, Next to Sholinganallur Signal',
    landmark: 'Near ELCOT SEZ & Cyber Vale Tech Park',
    totalSlots: 22,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    latitude: 12.9010,
    longitude: 80.2279,
    parkingType: 'Underground Basement',
    operatingHours: '06:00 AM - 11:30 PM',
    openingTime: '06:00',
    closingTime: '23:30',
    contactPhone: '+91 44 4390 1000',
    distanceFromCampusKm: 12.0,
  },

  // --- HYDERABAD FACILITIES ---
  {
    id: 'loc-hyd-1',
    name: 'Hyderabad HITEC City Cyber Towers Parking',
    city: 'Hyderabad',
    area: 'Madhapur IT Hub',
    address: 'Cyber Towers Quadrangle, Sector 2, HITEC City',
    landmark: 'Opposite Cyber Towers Metro Station Gate A',
    totalSlots: 26,
    rates: { firstHour: 25, additionalHour: 15 },
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    latitude: 17.4504,
    longitude: 78.3808,
    parkingType: 'Underground Basement',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 40 2311 0000',
    distanceFromCampusKm: 5.5,
  },
  {
    id: 'loc-hyd-2',
    name: 'Secunderabad Junction Railway Hub Deck',
    city: 'Hyderabad',
    area: 'Secunderabad Railway Area',
    address: 'Station Road, Platform 1 Circulating Plaza',
    landmark: 'Next to Rathifile Bus Station & Metro Link',
    totalSlots: 20,
    rates: { firstHour: 20, additionalHour: 10 },
    image: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    latitude: 17.4334,
    longitude: 78.5045,
    parkingType: 'Multi-Level Covered',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 40 2778 6170',
    distanceFromCampusKm: 8.0,
  },

  // --- MUMBAI FACILITIES ---
  {
    id: 'loc-mum-1',
    name: 'BKC Financial Hub Underground Parking',
    city: 'Mumbai',
    area: 'Bandra Kurla Complex',
    address: 'G-Block, Behind Bharat Diamond Bourse, BKC',
    landmark: 'Near Jio World Drive & US Consulate',
    totalSlots: 30,
    rates: { firstHour: 30, additionalHour: 20 },
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    latitude: 19.0657,
    longitude: 72.8687,
    parkingType: 'Underground Basement',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 22 2659 0000',
    distanceFromCampusKm: 10.2,
  },
  {
    id: 'loc-mum-2',
    name: 'Chhatrapati Shivaji Maharaj Terminus Bay',
    city: 'Mumbai',
    area: 'Fort / South Mumbai',
    address: 'Dr. D.N. Road, CSMT Station Concourse East',
    landmark: 'Opposite BMC Headquarters & Suburban Exit 2',
    totalSlots: 22,
    rates: { firstHour: 25, additionalHour: 15 },
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    latitude: 18.9401,
    longitude: 72.8353,
    parkingType: 'Multi-Level Covered',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 22 2262 0000',
    distanceFromCampusKm: 12.5,
  },

  // --- DELHI FACILITIES ---
  {
    id: 'loc-del-1',
    name: 'Connaught Place Underground Plaza',
    city: 'Delhi',
    area: 'Connaught Place Central Hub',
    address: 'Radial Road 4, Inner Circle Block B & C',
    landmark: 'Adjacent to Rajiv Chowk Metro Gate 5 & Palika Underground',
    totalSlots: 28,
    rates: { firstHour: 25, additionalHour: 15 },
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    latitude: 28.6315,
    longitude: 77.2167,
    parkingType: 'Underground Basement',
    operatingHours: '07:00 AM - 12:00 AM',
    openingTime: '07:00',
    closingTime: '23:59',
    contactPhone: '+91 11 2336 0000',
    distanceFromCampusKm: 6.0,
  },
  {
    id: 'loc-del-2',
    name: 'IGI Airport Terminal 3 Multi-Level Deck',
    city: 'Delhi',
    area: 'Aerocity IGI Airport',
    address: 'Terminal 3 Parking Boulevard, Multi-Level Structure P3',
    landmark: 'Connected to T3 Departure Hall via Air-conditioned Skywalk',
    totalSlots: 32,
    rates: { firstHour: 30, additionalHour: 20 },
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    latitude: 28.5562,
    longitude: 77.1000,
    parkingType: 'Smart Automated Stack',
    operatingHours: '24/7 All Days',
    openingTime: '00:00',
    closingTime: '23:59',
    contactPhone: '+91 11 4797 3000',
    distanceFromCampusKm: 15.0,
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '9876543210',
    role: 'user',
    password: 'user123',
    createdAt: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 'usr-2',
    name: 'Priya Patel',
    email: 'priya@example.com',
    phone: '9876511223',
    role: 'user',
    password: 'user123',
    createdAt: '2026-02-18T14:30:00.000Z',
  },
  {
    id: 'usr-admin',
    name: 'System Administrator',
    email: 'admin@smartparking.com',
    phone: '9999900000',
    role: 'admin',
    password: 'admin123',
    createdAt: '2026-01-01T08:00:00.000Z',
  }
];

export function generateInitialSlots(): ParkingSlot[] {
  const slots: ParkingSlot[] = [];

  // Location 1: 24 slots (G, Floor 1)
  const loc1Slots = [
    // Ground Floor: G-01 to G-12 (Cars, Bikes, EV)
    { num: 'G-01', floor: 'Ground Floor', type: 'car' as const, status: 'available' as const },
    { num: 'G-02', floor: 'Ground Floor', type: 'car' as const, status: 'occupied' as const },
    { num: 'G-03', floor: 'Ground Floor', type: 'car' as const, status: 'reserved' as const },
    { num: 'G-04', floor: 'Ground Floor', type: 'car' as const, status: 'available' as const },
    { num: 'G-05', floor: 'Ground Floor', type: 'ev' as const, status: 'available' as const, charging: true },
    { num: 'G-06', floor: 'Ground Floor', type: 'ev' as const, status: 'occupied' as const, charging: true },
    { num: 'G-07', floor: 'Ground Floor', type: 'bike' as const, status: 'available' as const },
    { num: 'G-08', floor: 'Ground Floor', type: 'bike' as const, status: 'available' as const },
    { num: 'G-09', floor: 'Ground Floor', type: 'bike' as const, status: 'occupied' as const },
    { num: 'G-10', floor: 'Ground Floor', type: 'bike' as const, status: 'available' as const },
    { num: 'G-11', floor: 'Ground Floor', type: 'car' as const, status: 'maintenance' as const },
    { num: 'G-12', floor: 'Ground Floor', type: 'car' as const, status: 'available' as const },

    // Floor 1: F1-01 to F1-12
    { num: 'F1-01', floor: 'Floor 1', type: 'car' as const, status: 'available' as const },
    { num: 'F1-02', floor: 'Floor 1', type: 'car' as const, status: 'available' as const },
    { num: 'F1-03', floor: 'Floor 1', type: 'car' as const, status: 'occupied' as const },
    { num: 'F1-04', floor: 'Floor 1', type: 'car' as const, status: 'available' as const },
    { num: 'F1-05', floor: 'Floor 1', type: 'car' as const, status: 'available' as const },
    { num: 'F1-06', floor: 'Floor 1', type: 'ev' as const, status: 'available' as const, charging: true },
    { num: 'F1-07', floor: 'Floor 1', type: 'bike' as const, status: 'available' as const },
    { num: 'F1-08', floor: 'Floor 1', type: 'bike' as const, status: 'occupied' as const },
    { num: 'F1-09', floor: 'Floor 1', type: 'bike' as const, status: 'available' as const },
    { num: 'F1-10', floor: 'Floor 1', type: 'car' as const, status: 'available' as const },
    { num: 'F1-11', floor: 'Floor 1', type: 'car' as const, status: 'reserved' as const },
    { num: 'F1-12', floor: 'Floor 1', type: 'car' as const, status: 'available' as const },

    // Floor 2: F2-01 to F2-12
    { num: 'F2-01', floor: 'Floor 2', type: 'car' as const, status: 'available' as const },
    { num: 'F2-02', floor: 'Floor 2', type: 'car' as const, status: 'occupied' as const },
    { num: 'F2-03', floor: 'Floor 2', type: 'car' as const, status: 'available' as const },
    { num: 'F2-04', floor: 'Floor 2', type: 'ev' as const, status: 'available' as const, charging: true },
    { num: 'F2-05', floor: 'Floor 2', type: 'ev' as const, status: 'occupied' as const, charging: true },
    { num: 'F2-06', floor: 'Floor 2', type: 'car' as const, status: 'available' as const },
    { num: 'F2-07', floor: 'Floor 2', type: 'bike' as const, status: 'available' as const },
    { num: 'F2-08', floor: 'Floor 2', type: 'bike' as const, status: 'occupied' as const },
    { num: 'F2-09', floor: 'Floor 2', type: 'bike' as const, status: 'available' as const },
    { num: 'F2-10', floor: 'Floor 2', type: 'car' as const, status: 'available' as const },
    { num: 'F2-11', floor: 'Floor 2', type: 'car' as const, status: 'available' as const },
    { num: 'F2-12', floor: 'Floor 2', type: 'car' as const, status: 'available' as const },

    // Floor 3: F3-01 to F3-12 (Rooftop Sky Deck)
    { num: 'F3-01', floor: 'Floor 3', type: 'car' as const, status: 'available' as const },
    { num: 'F3-02', floor: 'Floor 3', type: 'car' as const, status: 'available' as const },
    { num: 'F3-03', floor: 'Floor 3', type: 'car' as const, status: 'occupied' as const },
    { num: 'F3-04', floor: 'Floor 3', type: 'ev' as const, status: 'available' as const, charging: true },
    { num: 'F3-05', floor: 'Floor 3', type: 'car' as const, status: 'available' as const },
    { num: 'F3-06', floor: 'Floor 3', type: 'car' as const, status: 'available' as const },
    { num: 'F3-07', floor: 'Floor 3', type: 'bike' as const, status: 'available' as const },
    { num: 'F3-08', floor: 'Floor 3', type: 'bike' as const, status: 'available' as const },
    { num: 'F3-09', floor: 'Floor 3', type: 'car' as const, status: 'available' as const },
    { num: 'F3-10', floor: 'Floor 3', type: 'car' as const, status: 'available' as const },
    { num: 'F3-11', floor: 'Floor 3', type: 'car' as const, status: 'reserved' as const },
    { num: 'F3-12', floor: 'Floor 3', type: 'car' as const, status: 'available' as const },
  ];

  loc1Slots.forEach((s, idx) => {
    slots.push({
      id: `slot-loc1-${idx + 1}`,
      locationId: 'loc-1',
      slotNumber: s.num,
      floor: s.floor,
      vehicleType: s.type,
      status: s.status,
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: s.charging ?? false,
      distanceToEntranceMeters: (idx + 1) * 8 + 10,
      isShaded: s.floor === 'Ground Floor' || idx % 2 === 0,
    });
  });

  // Location 2: 12 slots (CyberTech IT Park)
  const loc2Slots = [
    { num: 'A-01', floor: 'Basement 1', type: 'car' as const, status: 'available' as const },
    { num: 'A-02', floor: 'Basement 1', type: 'car' as const, status: 'occupied' as const },
    { num: 'A-03', floor: 'Basement 1', type: 'ev' as const, status: 'available' as const, charging: true },
    { num: 'A-04', floor: 'Basement 1', type: 'bike' as const, status: 'available' as const },
    { num: 'A-05', floor: 'Basement 1', type: 'bike' as const, status: 'occupied' as const },
    { num: 'B-01', floor: 'Basement 2', type: 'car' as const, status: 'available' as const },
    { num: 'B-02', floor: 'Basement 2', type: 'car' as const, status: 'available' as const },
    { num: 'B-03', floor: 'Basement 2', type: 'car' as const, status: 'reserved' as const },
    { num: 'B-04', floor: 'Basement 2', type: 'ev' as const, status: 'available' as const, charging: true },
    { num: 'B-05', floor: 'Basement 2', type: 'car' as const, status: 'available' as const },
  ];

  loc2Slots.forEach((s, idx) => {
    slots.push({
      id: `slot-loc2-${idx + 1}`,
      locationId: 'loc-2',
      slotNumber: s.num,
      floor: s.floor,
      vehicleType: s.type,
      status: s.status,
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: s.charging ?? false,
      distanceToEntranceMeters: (idx + 1) * 12 + 15,
      isShaded: true,
    });
  });

  // Location 3: 8 slots (Grand Central Mall)
  const loc3Slots = [
    { num: 'M-101', floor: 'Lower Ground', type: 'car' as const, status: 'available' as const },
    { num: 'M-102', floor: 'Lower Ground', type: 'car' as const, status: 'available' as const },
    { num: 'M-103', floor: 'Lower Ground', type: 'ev' as const, status: 'occupied' as const, charging: true },
    { num: 'M-104', floor: 'Lower Ground', type: 'bike' as const, status: 'available' as const },
    { num: 'M-105', floor: 'Lower Ground', type: 'car' as const, status: 'reserved' as const },
    { num: 'M-106', floor: 'Lower Ground', type: 'car' as const, status: 'available' as const },
  ];

  loc3Slots.forEach((s, idx) => {
    slots.push({
      id: `slot-loc3-${idx + 1}`,
      locationId: 'loc-3',
      slotNumber: s.num,
      floor: s.floor,
      vehicleType: s.type,
      status: s.status,
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: s.charging ?? false,
      distanceToEntranceMeters: (idx + 1) * 10 + 20,
      isShaded: true,
    });
  });

  // Location 4: 6 slots (Railway Junction)
  const loc4Slots: Array<{ num: string; floor: string; type: 'car' | 'bike' | 'ev'; status: 'available' | 'occupied' | 'reserved' | 'maintenance'; charging?: boolean }> = [
    { num: 'R-01', floor: 'Open Parking Lot', type: 'car', status: 'available' },
    { num: 'R-02', floor: 'Open Parking Lot', type: 'car', status: 'occupied' },
    { num: 'R-03', floor: 'Open Parking Lot', type: 'bike', status: 'available' },
    { num: 'R-04', floor: 'Open Parking Lot', type: 'bike', status: 'available' },
    { num: 'R-05', floor: 'Open Parking Lot', type: 'car', status: 'available' },
    { num: 'R-06', floor: 'Open Parking Lot', type: 'car', status: 'available' },
  ];

  loc4Slots.forEach((s, idx) => {
    slots.push({
      id: `slot-loc4-${idx + 1}`,
      locationId: 'loc-4',
      slotNumber: s.num,
      floor: s.floor,
      vehicleType: s.type,
      status: s.status,
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: s.charging ?? false,
      distanceToEntranceMeters: (idx + 1) * 15 + 5,
      isShaded: false,
    });
  });

  // Automatically generate complete slot inventories for all other city facilities
  INITIAL_LOCATIONS.forEach((loc) => {
    if (loc.id !== 'loc-1' && loc.id !== 'loc-2' && loc.id !== 'loc-3' && loc.id !== 'loc-4') {
      const generated = generateSlotsForLocation(loc);
      slots.push(...generated);
    }
  });

  return slots;
}

export function generateSlotsForLocation(loc: ParkingLocation): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  const isBasement = loc.parkingType?.toLowerCase().includes('basement');
  const isOpen = loc.parkingType?.toLowerCase().includes('open');
  const floors = isBasement
    ? ['Basement 1', 'Basement 2']
    : isOpen
    ? ['Open Parking Lot']
    : ['Ground Floor', '1st Floor'];

  const count = loc.totalSlots || 20;
  const perFloor = Math.ceil(count / floors.length);
  let globalIdx = 1;

  floors.forEach((floor, fIdx) => {
    const prefix = floor.startsWith('Basement')
      ? `B${fIdx + 1}`
      : floor.startsWith('Ground')
      ? 'G'
      : floor.startsWith('Open')
      ? 'P'
      : 'F1';

    for (let i = 1; i <= perFloor && globalIdx <= count; i++) {
      const num = `${prefix}-${i < 10 ? '0' + i : i}`;
      // Vehicle type allocation
      const type: 'car' | 'bike' | 'ev' = (i % 6 === 0) ? 'ev' : (i % 3 === 0 ? 'bike' : 'car');
      // Realistic slot distribution
      const status: 'available' | 'occupied' | 'reserved' =
        (globalIdx === 2 || globalIdx === 5)
          ? 'occupied'
          : (globalIdx === 3)
          ? 'reserved'
          : 'available';

      slots.push({
        id: `slot-${loc.id}-${globalIdx}`,
        locationId: loc.id,
        slotNumber: num,
        floor,
        vehicleType: type,
        status,
        hourlyRateFirstHour: loc.rates?.firstHour || 20,
        hourlyRateAdditional: loc.rates?.additionalHour || 10,
        hasCharging: type === 'ev',
        distanceToEntranceMeters: 10 + i * 8,
        isShaded: !isOpen,
      });
      globalIdx++;
    }
  });

  return slots;
}

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'PK-94281',
    userId: 'usr-1',
    userName: 'Rahul Sharma',
    userEmail: 'rahul@example.com',
    userPhone: '9876543210',
    locationId: 'loc-1',
    locationName: 'Metro City Center Plaza',
    slotId: 'slot-loc1-3',
    slotNumber: 'G-03',
    floor: 'Ground Floor',
    vehicleType: 'car',
    vehicleNumber: 'KA 03 MX 4421',
    bookingDate: new Date().toISOString().split('T')[0],
    entryTime: '10:00 AM',
    exitTime: '01:00 PM',
    durationHours: 3,
    amount: 40, // ₹20 first hour + 2 * ₹10 = ₹40
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'UPI / PhonePe',
    transactionId: 'TXN-9841284712',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    qrCodeData: 'SPMS-PK-94281-SLOT-G03-LOC1',
  },
  {
    id: 'PK-87114',
    userId: 'usr-1',
    userName: 'Rahul Sharma',
    userEmail: 'rahul@example.com',
    userPhone: '9876543210',
    locationId: 'loc-2',
    locationName: 'CyberTech IT Park Parking',
    slotId: 'slot-loc2-8',
    slotNumber: 'B-03',
    floor: 'Basement 2',
    vehicleType: 'car',
    vehicleNumber: 'KA 03 MX 4421',
    bookingDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    entryTime: '09:00 AM',
    exitTime: '11:00 AM',
    durationHours: 2,
    amount: 30, // ₹20 + ₹10 = ₹30
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'Debit Card',
    transactionId: 'TXN-7612349012',
    createdAt: new Date(Date.now() - 90000000).toISOString(),
    qrCodeData: 'SPMS-PK-87114-SLOT-B03-LOC2',
  },
  {
    id: 'PK-76229',
    userId: 'usr-2',
    userName: 'Priya Patel',
    userEmail: 'priya@example.com',
    userPhone: '9876511223',
    locationId: 'loc-1',
    locationName: 'Metro City Center Plaza',
    slotId: 'slot-loc1-23',
    slotNumber: 'F1-11',
    floor: '1st Floor',
    vehicleType: 'car',
    vehicleNumber: 'KA 05 EQ 8900',
    bookingDate: new Date().toISOString().split('T')[0],
    entryTime: '11:30 AM',
    exitTime: '01:30 PM',
    durationHours: 2,
    amount: 30,
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'Google Pay',
    transactionId: 'TXN-3829104812',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    qrCodeData: 'SPMS-PK-76229-SLOT-F111-LOC1',
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    bookingId: 'PK-94281',
    userId: 'usr-1',
    userName: 'Rahul Sharma',
    amount: 40,
    paymentMethod: 'UPI / PhonePe',
    status: 'paid',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    transactionRef: 'TXN-9841284712',
  },
  {
    id: 'pay-2',
    bookingId: 'PK-87114',
    userId: 'usr-1',
    userName: 'Rahul Sharma',
    amount: 30,
    paymentMethod: 'Debit Card',
    status: 'paid',
    timestamp: new Date(Date.now() - 90000000).toISOString(),
    transactionRef: 'TXN-7612349012',
  },
  {
    id: 'pay-3',
    bookingId: 'PK-76229',
    userId: 'usr-2',
    userName: 'Priya Patel',
    amount: 30,
    paymentMethod: 'Google Pay',
    status: 'paid',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    transactionRef: 'TXN-3829104812',
  }
];
