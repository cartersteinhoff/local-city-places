import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section?: string;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
}
