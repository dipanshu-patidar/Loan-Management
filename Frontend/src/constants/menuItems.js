import { 
  LayoutDashboard, 
  Users, 
  User,
  UserCheck, 
  UserCog, 
  Clock, 
  FileCheck, 
  CheckCircle2, 
  Activity, 
  History, 
  CalendarClock, 
  AlertCircle, 
  ClipboardList, 
  TrendingUp, 
  PieChart, 
  FileText, 
  Download, 
  Bell, 
  Settings2, 
  ShieldAlert, 
  CalendarRange,
  Briefcase,
  Wallet,
  FilePlus,
  ShieldCheck,
  MessageSquare,
  Package,
  BarChart3
} from 'lucide-react';

export const ADMIN_MENU = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Borrowers', path: '/admin/borrowers', icon: Users },
  { label: 'Agents', path: '/admin/agents', icon: UserCheck },
  { label: 'Staff', path: '/admin/staff', icon: UserCog },
  { label: 'Loan Applications', path: '/admin/applications', icon: FileText },
  { label: 'Active Loans', path: '/admin/active-loans', icon: Activity },
  { label: 'Payment History', path: '/admin/payment-history', icon: History },
  { label: 'Due Payments', path: '/admin/due-payments', icon: CalendarClock },
  { label: 'Communication', path: '/admin/communication', icon: MessageSquare },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings2 },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { label: 'My Profile', path: '/admin/profile', icon: User },
];

export const STAFF_MENU = [
  { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Loan Requests', path: '/staff/loan-requests', icon: Clock },
  { label: 'Loan Review', path: '/staff/loan-review', icon: FileCheck },
  { label: 'Payment Verification', path: '/staff/payment-verification', icon: ShieldCheck },
  { label: 'Communication', path: '/staff/communications', icon: MessageSquare },
  { label: 'My Profile', path: '/staff/profile', icon: User },
];

export const AGENT_MENU = [
  { label: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
  { label: 'My Clients', path: '/agent/clients', icon: Users },
  { label: 'Earnings', path: '/agent/earnings', icon: TrendingUp },
  { label: 'Communication', path: '/agent/logs', icon: MessageSquare },
  { label: 'Notifications', path: '/agent/notifications', icon: Bell },
  { label: 'My Profile', path: '/agent/profile', icon: User },
];

export const BORROWER_MENU = [
  { label: 'Dashboard', path: '/borrower/dashboard', icon: LayoutDashboard },
  { label: 'Apply Loan', path: '/borrower/apply-loan', icon: FilePlus },
  { label: 'My Loans', path: '/borrower/my-loans', icon: Briefcase },
  { label: 'Make Payment', path: '/borrower/make-payment', icon: Wallet },
  { label: 'Payment History', path: '/borrower/payment-history', icon: History },
  { label: 'Communication', path: '/borrower/communication', icon: MessageSquare },
  { label: 'Notifications', path: '/borrower/notifications', icon: Bell },
  { label: 'My Profile', path: '/borrower/profile', icon: User },
];
