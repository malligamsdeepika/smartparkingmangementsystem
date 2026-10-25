/**
 * Smart Parking Management System - API Client Service
 * Connects the React TypeScript Frontend with the Deployed Java Servlet / Node Backend
 * 
 * Target Backend:
 * - Configured via environment variable VITE_BACKEND_API_URL
 * - Automatically falls back to relative '/api' on cloud platforms (Cloud Run, Vercel, Render)
 * - Zero hardcoded localhost or computer-specific URLs
 */

export function resolveApiBaseUrl(): string {
  let envUrl = (import.meta.env.VITE_BACKEND_API_URL as string | undefined)?.trim()?.replace(/\/+$/, '');

  // If environment variable was configured with localhost/127.0.0.1, but browser is on another machine or on Cloud Run:
  if (typeof window !== 'undefined' && envUrl) {
    try {
      if (envUrl.startsWith('http://localhost') || envUrl.startsWith('http://127.0.0.1') || envUrl.startsWith('https://localhost')) {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.hostname !== '') {
          return '/api';
        }
      }
    } catch {}
  }

  if (!envUrl) return '/api';

  // Ensure base URL always points to /api
  if (!envUrl.endsWith('/api') && !envUrl.includes('/api/')) {
    envUrl = `${envUrl}/api`;
  }

  return envUrl;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  users?: any[];
  slots?: any[];
  slot?: any;
  locations?: any[];
  location?: any;
  bookings?: any[];
  booking?: any;
  payments?: any[];
  payment?: any;
  sessions?: any[];
  session?: any;
  notifications?: any[];
  adminNotifications?: any[];
  unreadCount?: number;
  count?: number;
  status?: string;
}

export const ApiService = {
  getBaseUrl(): string {
    return resolveApiBaseUrl();
  },

  /**
   * Safe centralized HTTP fetch wrapper that guarantees valid JSON parsing,
   * enforces credentials for authenticated/cross-origin sessions,
   * guards against HTML redirects (e.g. cookie check, auth walls, 404/500 pages),
   * and provides meaningful human-readable error messages.
   */
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const base = this.getBaseUrl().replace(/\/+$/, '');
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Prevent duplicate /api/api if both base and cleanEndpoint contain /api
    if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
      cleanEndpoint = cleanEndpoint.slice(4);
    } else if (base.endsWith('/api') && cleanEndpoint === '/api') {
      cleanEndpoint = '';
    }

    const url = `${base}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials || 'same-origin',
      });
    } catch (networkError: any) {
      // In dev environment or during network switch, fallback gracefully without throwing fatal unhandled exceptions
      return {
        success: false,
        message: `Network error connecting to backend: ${networkError?.message || 'Connection refused'}. Please verify connection.`,
      };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isHtmlHeader = contentType.includes('text/html') || contentType.includes('application/xhtml+xml');

    // Detect if cloud proxy redirected the API call to an HTML cookie/auth flow page
    if (res.redirected && (isHtmlHeader || res.url.includes('cookie_check') || res.url.endsWith('.html'))) {
      console.warn(`[API Redirect Guard] ${options.method || 'GET'} ${url} was redirected to HTML: ${res.url}`);
      return {
        success: false,
        message: 'Cloud session verification in progress. Please refresh the page to sync credentials.',
        status: String(res.status),
      };
    }

    // Read full raw text first so we never throw SyntaxError on invalid or HTML payloads
    let rawText = '';
    try {
      rawText = await res.text();
    } catch (readError: any) {
      console.error(`[API Body Read Error] ${options.method || 'GET'} ${url}:`, readError);
      return {
        success: false,
        message: `Failed to read server response: ${readError?.message || 'Unknown read error'}.`,
        status: String(res.status),
      };
    }

    const trimmed = rawText.trim();
    const startsWithHtmlTag =
      trimmed.toLowerCase().startsWith('<!doctype') ||
      trimmed.toLowerCase().startsWith('<html') ||
      trimmed.toLowerCase().startsWith('<head') ||
      trimmed.toLowerCase().startsWith('<body') ||
      (trimmed.startsWith('<') && trimmed.includes('>'));

    // Guard against server returning HTML pages (e.g. 404, 500, Vite fallback index.html, Cloud Run cold start)
    if (isHtmlHeader || startsWithHtmlTag) {
      console.warn(
        `[API Non-JSON Response] ${options.method || 'GET'} ${url} returned HTML (${res.status} ${res.statusText}):`,
        trimmed.slice(0, 160)
      );

      // Transient warmup retry (handles container startup or Cloud Run spin-up gracefully)
      if (!(options as any)._retried && (options.method === 'POST' || options.method === 'PUT')) {
        await new Promise((r) => setTimeout(r, 650));
        return this.request(endpoint, { ...options, _retried: true } as any);
      }

      return {
        success: false,
        message: `Backend service is initializing (${res.status} ${res.statusText || 'Warmup'}). Local state preserved.`,
        status: String(res.status),
      };
    }

    // Safely parse JSON
    let data: any = null;
    const isJsonHeader = contentType.includes('application/json');
    const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');

    if (trimmed.length > 0 && (isJsonHeader || looksLikeJson)) {
      try {
        data = JSON.parse(trimmed);
      } catch (parseError: any) {
        console.error(`[API JSON Parse Error] ${options.method || 'GET'} ${url}:`, parseError, 'Raw:', trimmed.slice(0, 100));
        return {
          success: false,
          message: `Invalid JSON received from server (${res.status} ${res.statusText || 'Error'}).`,
          status: String(res.status),
        };
      }
    } else if (trimmed.length === 0) {
      data = {};
    } else {
      // Plain text response
      if (!res.ok) {
        return {
          success: false,
          message: trimmed || `Request failed with status ${res.status} (${res.statusText || 'Error'}).`,
          status: String(res.status),
        };
      }
      return {
        success: true,
        data: trimmed as any,
        message: trimmed,
      };
    }

    // Check response.ok status
    if (!res.ok) {
      return {
        success: false,
        message: data?.message || data?.error || `Request failed with status ${res.status} (${res.statusText || 'Error'})`,
        status: String(res.status),
        ...data,
      };
    }

    return data;
  },

  /**
   * Pings backend health endpoint to verify cloud connectivity
   */
  async checkConnection(): Promise<boolean> {
    const base = this.getBaseUrl();
    try {
      const res = await fetch(`${base}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
        signal: AbortSignal.timeout(3000),
      });
      const ct = res.headers.get('content-type') || '';
      return res.ok && ct.includes('application/json');
    } catch {
      try {
        const res2 = await fetch(`${base}/locations`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
          signal: AbortSignal.timeout(2000),
        });
        const ct2 = res2.headers.get('content-type') || '';
        return res2.ok && ct2.includes('application/json');
      } catch {
        return false;
      }
    }
  },

  /**
   * Fetches full cloud state snapshot for cross-device initialization
   */
  async getSyncData(): Promise<ApiResponse> {
    return this.request('/sync');
  },

  /**
   * User & Admin Login
   */
  async login(email: string, password: string, asAdmin?: boolean): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, asAdmin }),
    });
  },

  /**
   * User Registration
   */
  async register(data: { name: string; email: string; password: string; phone: string; role?: string }): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all parking locations
   */
  async getLocations(): Promise<ApiResponse> {
    return this.request('/locations');
  },

  /**
   * Get slots (optionally filtered by location and availability)
   */
  async getSlots(locationId?: string | number, availableOnly?: boolean): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (locationId) params.append('locationId', locationId.toString());
    if (availableOnly) params.append('availableOnly', 'true');
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/slots${q}`);
  },

  /**
   * Update slot status (AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE)
   */
  async updateSlotStatus(slotId: string | number, status: string, bookingId?: string): Promise<ApiResponse> {
    return this.request(`/slots/${slotId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: status.toUpperCase(), bookingId }),
    });
  },

  /**
   * Get all bookings from central database (Admin / Cross-Device)
   */
  async getAllBookings(userId?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/bookings${q}`);
  },

  /**
   * Create Booking with pessimistic lock
   */
  async createBooking(bookingData: any): Promise<ApiResponse> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  /**
   * Cancel booking & release slot
   */
  async cancelBooking(bookingId: string | number): Promise<ApiResponse> {
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
    });
  },

  /**
   * Complete booking & release slot
   */
  async completeBooking(bookingId: string | number): Promise<ApiResponse> {
    return this.request(`/bookings/${bookingId}/complete`, {
      method: 'PUT',
    });
  },

  /**
   * Look up booking by QR Code pass
   */
  async getBookingByCode(bookingCode: string): Promise<ApiResponse> {
    return this.request(`/bookings?bookingCode=${encodeURIComponent(bookingCode)}`);
  },

  /**
   * QR Gate Barrier Check-in
   */
  async gateCheckIn(bookingId: string, vehicleNumber?: string, verifiedBy?: string): Promise<ApiResponse> {
    return this.request('/sessions/checkin', {
      method: 'POST',
      body: JSON.stringify({ bookingId, vehicleNumber, verifiedBy }),
    });
  },

  /**
   * QR Gate Barrier Check-out
   */
  async gateCheckOut(sessionId?: string, slotId?: string): Promise<ApiResponse> {
    return this.request('/sessions/checkout', {
      method: 'POST',
      body: JSON.stringify({ sessionId, slotId }),
    });
  },

  /**
   * Process payment transaction
   */
  async processPayment(paymentData: {
    bookingId: string | number;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  }): Promise<ApiResponse> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  /**
   * Admin: Get all payments/revenue
   */
  async getAllPayments(): Promise<ApiResponse> {
    return this.request('/payments');
  },

  /**
   * Admin: Get Admin Notifications
   */
  async getAdminNotifications(filter: 'all' | 'unread' = 'all', type?: string, adminToken = 'usr-admin'): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filter === 'unread') params.append('filter', 'unread');
    if (type && type !== 'all') params.append('type', type);
    params.append('asAdmin', 'true');

    return this.request(`/admin/notifications?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'admin',
        'x-admin-id': adminToken,
      },
    });
  },

  /**
   * Admin: Get Unread Notifications Count
   */
  async getAdminUnreadCount(adminToken = 'usr-admin'): Promise<number> {
    try {
      const data = await this.request('/admin/notifications/unread-count?asAdmin=true', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-user-role': 'admin',
          'x-admin-id': adminToken,
        },
      });
      return data.count ?? data.unreadCount ?? 0;
    } catch {
      return 0;
    }
  },

  /**
   * Admin: Mark notification as read
   */
  async markAdminNotificationRead(id: string, adminToken = 'usr-admin'): Promise<ApiResponse> {
    return this.request(`/admin/notifications/${id}/read?asAdmin=true`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'admin',
        'x-admin-id': adminToken,
      },
    });
  },

  /**
   * Admin: Mark all notifications as read
   */
  async markAllAdminNotificationsRead(adminToken = 'usr-admin'): Promise<ApiResponse> {
    return this.request('/admin/notifications/read-all?asAdmin=true', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'admin',
        'x-admin-id': adminToken,
      },
    });
  },

  /**
   * Admin: Delete a notification
   */
  async deleteAdminNotification(id: string, adminToken = 'usr-admin'): Promise<ApiResponse> {
    return this.request(`/admin/notifications/${id}?asAdmin=true`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'admin',
        'x-admin-id': adminToken,
      },
    });
  },

  /**
   * Admin: Create system / operational alert
   */
  async createAdminSystemAlert(alert: {
    title: string;
    message: string;
    severity?: 'warning' | 'error' | 'info';
    relatedEntityId?: string;
    metadata?: Record<string, any>;
  }, adminToken = 'usr-admin'): Promise<ApiResponse> {
    return this.request('/admin/notifications/system-alert?asAdmin=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'admin',
        'x-admin-id': adminToken,
      },
      body: JSON.stringify(alert),
    });
  },
};

