import { Construction, Droplets, HeartPulse, Lightbulb, Shapes, ShieldAlert, Store, Trash2, TreePine, Waves, type LucideIcon } from 'lucide-react';
import type { Category, Status } from './types';

export const STATUS_ORDER: Status[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

export const STATUS: Record<Status, { label: string; badge: string }> = {
  PENDING: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  RESOLVED: { label: 'Resolved', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
};

export const CATEGORY: Record<Category, { label: string; icon: LucideIcon; color: string }> = {
  WATER_SUPPLY: { label: 'Water Supply', icon: Droplets, color: '#2563eb' },
  STREET_LIGHTING: { label: 'Street Lighting', icon: Lightbulb, color: '#d97706' },
  GARBAGE_COLLECTION: { label: 'Garbage Collection', icon: Trash2, color: '#0d9488' },
  ROAD_MAINTENANCE: { label: 'Road Maintenance', icon: Construction, color: '#7c3aed' },
  SEWERAGE_DRAINAGE: { label: 'Sewerage & Drainage', icon: Waves, color: '#0891b2' },
  PUBLIC_HEALTH: { label: 'Public Health & Sanitation', icon: HeartPulse, color: '#dc2626' },
  PUBLIC_SAFETY: { label: 'Public Safety', icon: ShieldAlert, color: '#475569' },
  MARKETS_TRADING: { label: 'Markets & Trading', icon: Store, color: '#ea580c' },
  ENVIRONMENT_PARKS: { label: 'Environment & Parks', icon: TreePine, color: '#65a30d' },
  OTHER: { label: 'Other', icon: Shapes, color: '#db2777' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORY) as Category[];
