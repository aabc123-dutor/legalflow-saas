import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send cookies (refresh token)
});

// Inject access token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → refresh token → retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ── Typed helpers ──────────────────────────────────────────────────────────

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const expedientesApi = {
  list: () => api.get('/expedientes'),
  get: (id: string) => api.get(`/expedientes/${id}`),
  create: (data: any) => api.post('/expedientes', data),
  update: (id: string, data: any) => api.patch(`/expedientes/${id}`, data),
  delete: (id: string) => api.delete(`/expedientes/${id}`),
};

export const clientesApi = {
  list: () => api.get('/clients'),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const facturasApi = {
  list: () => api.get('/facturas'),
  get: (id: string) => api.get(`/facturas/${id}`),
  create: (data: any) => api.post('/facturas', data),
  update: (id: string, data: any) => api.patch(`/facturas/${id}`, data),
  delete: (id: string) => api.delete(`/facturas/${id}`),
};

export const fiscalApi = {
  getConfig: () => api.get('/fiscal/config'),
  updateConfig: (data: any) => api.patch('/fiscal/config', data),
  resumen: (anio: number) => api.get(`/fiscal/resumen/${anio}`),
  calcular: (base: number) => api.get(`/fiscal/calcular/${base}`),
  modelo303: (anio: number, t: number) => api.get(`/fiscal/modelo303/${anio}/${t}`),
  modelo130: (anio: number, t: number) => api.get(`/fiscal/modelo130/${anio}/${t}`),
};

export const aiApi = {
  navegacion: (data: any) => api.post('/ai/navegacion', data),
  jurisprudencia: (data: any) => api.post('/ai/jurisprudencia', data),
  conversaciones: (tipo?: string) => api.get('/ai/conversaciones', { params: { tipo } }),
  conversacion: (id: string) => api.get(`/ai/conversaciones/${id}`),
};
