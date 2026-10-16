let rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (rawBaseUrl === undefined) {
  rawBaseUrl = 'http://127.0.0.1:8000';
}
if (rawBaseUrl && !rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const API_BASE_URL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('mie_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 204) {
      return null;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const errorMsg = data?.detail || `HTTP Error ${res.status}`;
      throw new Error(errorMsg);
    }
    if (!data) {
      throw new Error('Server returned an empty or invalid response.');
    }
    return data;
  } catch (err) {
    console.error(`API Request Error [${endpoint}]:`, err);
    throw err;
  }
}

// Authentication
export const authApi = {
  register: (payload) => apiRequest('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiRequest('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  googleLogin: (payload) => apiRequest('/api/v1/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/api/v1/auth/me')
};

// Catalog & Titles
export const titlesApi = {
  list: (params = {}) => {
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        cleanParams[key] = value;
      }
    }
    const query = new URLSearchParams(cleanParams).toString();
    return apiRequest(`/api/v1/titles${query ? `?${query}` : ''}`);
  },
  getDetail: (identifier) => apiRequest(`/api/v1/titles/${identifier}`)
};

// Watchlist
export const watchlistApi = {
  get: (status) => apiRequest(`/api/v1/watchlist${status ? `?status_filter=${status}` : ''}`),
  add: (payload) => apiRequest('/api/v1/watchlist', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/api/v1/watchlist/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => apiRequest(`/api/v1/watchlist/${id}`, { method: 'DELETE' })
};

// Preferences
export const preferencesApi = {
  get: () => apiRequest('/api/v1/preferences'),
  update: (payload) => apiRequest('/api/v1/preferences', { method: 'PATCH', body: JSON.stringify(payload) })
};

// Recommendations & Cross-Genre
export const recommendationsApi = {
  get: (limit = 12) => apiRequest(`/api/v1/recommendations?limit=${limit}`)
};

// Trends & Analytics
export const trendsApi = {
  get: (period = 'weekly') => apiRequest(`/api/v1/trends?period=${period}`)
};

// Feedback
export const feedbackApi = {
  submit: (payload) => apiRequest('/api/v1/feedback', { method: 'POST', body: JSON.stringify(payload) })
};

// Health
export const healthApi = {
  check: () => apiRequest('/api/v1/health')
};
