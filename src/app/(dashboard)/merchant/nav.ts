import {
  FileText,
  LayoutDashboard,
  RadioTower,
  Sparkles,
  Star,
  UserCircle,
} from "lucide-react";

export const merchantNavItems = [
  { label: "Dashboard", href: "/merchant", icon: LayoutDashboard },
  {
    label: "Dashboard Concept",
    href: "/merchant/dashboard-concept",
    icon: Sparkles,
  },
  { label: "Merchant Page", href: "/merchant/merchant-page", icon: FileText },
  { label: "On-Air Studio", href: "/merchant/on-air-studio", icon: RadioTower },
  { label: "Reviews", href: "/merchant/reviews", icon: Star },
  { label: "Profile", href: "/merchant/profile", icon: UserCircle },
];
