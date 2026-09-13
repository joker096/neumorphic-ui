export interface User {
  publicKey: string;
  country: string;
  ip: string;
  status: 'online' | 'offline';
  lastSeen: number;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  country: string;
  lastSeen: number;
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  active: boolean;
  impressions: number;
  clicks: number;
}

export interface DashboardStats {
  onlineNow: number;
  todayUsers: number;
  totalUsers: number;
  countries: number;
  topCountries: {country: string; users: number}[];
  deviceDistribution: {device: string; count: number}[];
  recentAds: Ad[];
}

export interface AuthState {
  token: string | null;
  tfaRequired: boolean;
}
