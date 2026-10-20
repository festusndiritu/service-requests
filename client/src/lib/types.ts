export type Role = 'CITIZEN' | 'ADMIN';
export type Status = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
export type Category =
  | 'WATER_SUPPLY'
  | 'STREET_LIGHTING'
  | 'GARBAGE_COLLECTION'
  | 'ROAD_MAINTENANCE'
  | 'SEWERAGE_DRAINAGE'
  | 'PUBLIC_HEALTH'
  | 'PUBLIC_SAFETY'
  | 'MARKETS_TRADING'
  | 'ENVIRONMENT_PARKS'
  | 'OTHER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  idNumber: string;
  phone: string;
  role: Role;
}

export interface RequestSummary {
  id: string;
  reference: string;
  category: Category;
  location: string;
  status: Status;
  createdAt: string;
  submittedBy: string;
}

export interface RequestDetail {
  id: string;
  reference: string;
  category: Category;
  location: string;
  description: string;
  status: Status;
  createdAt: string;
  imageUrls: string[];
  submittedBy: { fullName: string; email: string; phone: string };
  history: { id: string; status: Status; note: string | null; createdAt: string; by: string }[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export interface DashboardData {
  stats: Stats;
  recent: RequestSummary[];
  byCategory: { category: Category; count: number }[];
}

export interface Analytics {
  days: number;
  period: { submitted: number; resolved: number };
  previous: { submitted: number; resolved: number };
  avgResolutionHours: number | null;
  byCategory: { category: Category; count: number }[];
  trend: { date: string; submitted: number; resolved: number }[];
}

export interface UserRow extends User {
  createdAt: string;
  requestCount: number;
}

export type NotificationType = 'REQUEST_SUBMITTED' | 'STATUS_CHANGED';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  requestId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage extends Page<NotificationItem> {
  unread: number;
}
