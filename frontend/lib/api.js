const API_URL = typeof window !== 'undefined'
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const isFormData = options.body instanceof FormData;
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.error || data.message || 'Request failed');
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return this.request(`${endpoint}${qs ? `?${qs}` : ''}`);
  }

  post(endpoint, body) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, { 
      method: 'POST', 
      body: isFormData ? body : JSON.stringify(body) 
    });
  }

  put(endpoint, body) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, { 
      method: 'PUT', 
      body: isFormData ? body : JSON.stringify(body) 
    });
  }

  patch(endpoint, body) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, { 
      method: 'PATCH', 
      body: isFormData ? body : JSON.stringify(body) 
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient();
export default api;
