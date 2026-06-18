const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8766'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('admin_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    sessionStorage.removeItem('admin_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    request<{ sessionToken: string; requires2FA: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  verify2FA: (sessionToken: string, code: string) =>
    request<{ token: string }>('/api/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, code }),
    }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  getOverview: () =>
    request<{ onlineNow: number; today: number; totalUsers: number; countries: number }>('/api/stats/overview'),

  getCountries: () =>
    request<{ countries: Array<{ country: string; count: number }> }>('/api/stats/countries'),

  getDevices: () =>
    request<{ devices: Array<{ name: string; count: number; percentage: number }>; total: number }>('/api/stats/devices'),

  getUsers: (page = 1, limit = 50) =>
    request<{ users: any[]; total: number; page: number; limit: number }>(`/api/stats/users?page=${page}&limit=${limit}`),

  getAds: () => request<{ ads: any[] }>('/api/ads'),

  createAd: (data: { title: string; image_url: string; target_url: string; active?: boolean }) =>
    request<{ id: number }>('/api/ads', { method: 'POST', body: JSON.stringify(data) }),

  updateAd: (id: number, data: Partial<{ title: string; image_url: string; target_url: string; active: boolean }>) =>
    request<{ ok: boolean }>(`/api/ads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAd: (id: number) => request<{ ok: boolean }>(`/api/ads/${id}`, { method: 'DELETE' }),
}
