// ============================================================================
// BACKEND API SERVICE
// Handles all communication with the Node.js backend
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Helper: get stored token ─────────────────────────────────────────────────
const getToken = (): string | null => {
  return localStorage.getItem('ghana_pest_alert_token');
};

// ── Helper: build headers ────────────────────────────────────────────────────
const getHeaders = (requiresAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// ── Helper: handle response ──────────────────────────────────────────────────
const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

// ============================================================================
// AUTH
// ============================================================================

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  register: async (data: object) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  verify: async () => {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// ALERTS
// ============================================================================

export const alertsApi = {
  getAll: async (filters?: {
    status?: string;
    severity?: string;
    region?: string;
    source?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.source) params.append('source', filters.source);

    const response = await fetch(`${API_URL}/alerts?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/alerts/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data: object) => {
    const response = await fetch(`${API_URL}/alerts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: string, data: object) => {
    const response = await fetch(`${API_URL}/alerts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/alerts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  publish: async (id: string) => {
    const response = await fetch(`${API_URL}/alerts/${id}/publish`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// VALIDATION
// ============================================================================

export const validationApi = {
  getQueue: async () => {
    const response = await fetch(`${API_URL}/validation`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  approve: async (id: string, data?: {
    modified_content?: object;
    officer_notes?: string;
  }) => {
    const response = await fetch(`${API_URL}/validation/${id}/approve`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });
    return handleResponse(response);
  },

  reject: async (id: string, data: {
    rejection_reason: string;
    officer_notes?: string;
  }) => {
    const response = await fetch(`${API_URL}/validation/${id}/reject`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  assign: async (id: string, officerId: string) => {
    const response = await fetch(`${API_URL}/validation/${id}/assign`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ officer_id: officerId }),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// FARMERS
// ============================================================================

export const farmersApi = {
  getAll: async (filters?: { region?: string; crop?: string }) => {
    const params = new URLSearchParams();
    if (filters?.region) params.append('region', filters.region);
    if (filters?.crop) params.append('crop', filters.crop);

    const response = await fetch(`${API_URL}/farmers?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPending: async () => {
    const response = await fetch(`${API_URL}/farmers/pending`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  approve: async (id: string, notes?: string) => {
    const response = await fetch(`${API_URL}/farmers/pending/${id}/approve`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ notes }),
    });
    return handleResponse(response);
  },

  reject: async (id: string, reason: string) => {
    const response = await fetch(`${API_URL}/farmers/pending/${id}/reject`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/farmers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// OFFICERS
// ============================================================================

export const officersApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/officers`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data: object) => {
    const response = await fetch(`${API_URL}/officers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: string, data: object) => {
    const response = await fetch(`${API_URL}/officers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/officers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// SMS
// ============================================================================

export const smsApi = {
  send: async (data: {
    recipients: Array<{ phone: string; name: string; farmerId: string }>;
    message: string;
    alertId?: string;
  }) => {
    const response = await fetch(`${API_URL}/sms/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getHistory: async (alertId?: string) => {
    const params = new URLSearchParams();
    if (alertId) params.append('alertId', alertId);

    const response = await fetch(`${API_URL}/sms/history?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// AI ANALYSIS
// ============================================================================

export const aiApi = {
  analyze: async (data: {
    analysisType: 'identify' | 'analyze' | 'recommend';
    pestName?: string;
    symptoms?: string;
    affectedCrops?: string[];
    region?: string;
  }) => {
    const response = await fetch(`${API_URL}/ai/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notificationsApi = {
  getAll: async (filters?: { status?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

    const response = await fetch(`${API_URL}/notifications?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_URL}/notifications/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// STATS
// ============================================================================

export const statsApi = {
  getDashboard: async () => {
    const response = await fetch(`${API_URL}/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getAlertsBySeverity: async () => {
    const response = await fetch(`${API_URL}/stats/alerts-by-severity`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getAlertsByRegion: async () => {
    const response = await fetch(`${API_URL}/stats/alerts-by-region`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};