import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // envía la cookie refreshToken automáticamente
});

// Lee el accessToken del store de Zustand (memoria), no de localStorage
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
    ?? (typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el accessToken expira (401), lo renueva con el refreshToken (cookie HttpOnly)
// y reintenta la petición original de forma transparente
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    console.log('interceptor error:', error.response?.status, error.config?.url);
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/login')) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        useAuthStore.getState().setAuth(useAuthStore.getState().user!, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
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
  refresh: () => api.post('/auth/refresh'),
};

export const expedientesApi = {
  list: () => api.get('/expedientes'),
  get: (id: string) => api.get(`/expedientes/${id}`),
  create: (data: any) => api.post('/expedientes', data),
  update: (id: string, data: any) => api.patch(`/expedientes/${id}`, data),
  delete: (id: string) => api.delete(`/expedientes/${id}`),

  createHito: (expedienteId: string, data: any) => api.post(`/expedientes/${expedienteId}/hitos`, data),
  updateHito: (hitoId: string, data: any) => api.patch(`/expedientes/hitos/${hitoId}`, data),
  deleteHito: (hitoId: string) => api.delete(`/expedientes/hitos/${hitoId}`),

  createNota: (expedienteId: string, data: any) => api.post(`/expedientes/${expedienteId}/notas`, data),
  updateNota: (notaId: string, data: any) => api.patch(`/expedientes/notas/${notaId}`, data),
  deleteNota: (notaId: string) => api.delete(`/expedientes/notas/${notaId}`),

  proximosHitos: () => api.get('/expedientes/hitos/proximos'),
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
  createSuplido: (facturaId: string, data: any) => api.post(`/facturas/${facturaId}/suplidos`, data),
  deleteSuplido: (suplidoId: string) => api.delete(`/facturas/suplidos/${suplidoId}`),
  getPdfUrl: (id: string) => api.get(`/facturas/${id}/pdf`),
  createConcepto: (facturaId: string, data: any) => api.post(`/facturas/${facturaId}/conceptos`, data),
  deleteConcepto: (conceptoId: string) => api.delete(`/facturas/conceptos/${conceptoId}`),
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


