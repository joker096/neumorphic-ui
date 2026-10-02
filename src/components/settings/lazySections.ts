import { lazy } from 'react';

export const NetworkSection = lazy(() => import('./NetworkSection').then(m => ({ default: m.NetworkSection })));
export const DevicesSection = lazy(() => import('./DevicesSection').then(m => ({ default: m.DevicesSection })));
export const SecuritySection = lazy(() => import('./SecuritySection').then(m => ({ default: m.SecuritySection })));
export const BotsSection = lazy(() => import('./BotsSection').then(m => ({ default: m.BotsSection })));
export const SystemStatusSection = lazy(() => import('./SystemStatusSection').then(m => ({ default: m.SystemStatusSection })));
export const StorageSection = lazy(() => import('./StorageSection').then(m => ({ default: m.StorageSection })));
export const NotificationsSection = lazy(() => import('./NotificationsSection').then(m => ({ default: m.NotificationsSection })));
export const FoldersSection = lazy(() => import('./FoldersSection').then(m => ({ default: m.FoldersSection })));
export const BackupExportSection = lazy(() => import('./BackupExportSection').then(m => ({ default: m.BackupExportSection })));
export const HelpSupportSection = lazy(() => import('./HelpSupportSection').then(m => ({ default: m.HelpSupportSection })));
export const CompanyGuideSection = lazy(() => import('./CompanyGuideSection').then(m => ({ default: m.CompanyGuideSection })));
export const PaymentsSection = lazy(() => import('./PaymentsSection').then(m => ({ default: m.PaymentsSection })));
export const PaymentRequestsSection = lazy(() => import('./PaymentRequestsSection').then(m => ({ default: m.PaymentRequestsSection })));
export const CallsSection = lazy(() => import('./CallsSection').then(m => ({ default: m.CallsSection })));
export const PremiumSection = lazy(() => import('./PremiumSection').then(m => ({ default: m.PremiumSection })));
export const MeshSection = lazy(() => import('./MeshSection').then(m => ({ default: m.MeshSection })));
