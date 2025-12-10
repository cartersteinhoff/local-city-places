import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userEmail?: string;
  userName?: string;
}
