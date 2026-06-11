import {
  LayoutDashboard,
  LockKeyhole,
  RadioTower,
  Star,
  UserCircle,
} from "lucide-react";

export const merchantNavItems = [
  { label: "Dashboard", href: "/merchant", icon: LayoutDashboard },
  {
    label: "MarketLock360",
    href: "/merchant/marketlock360",
    icon: LockKeyhole,
  },
  { label: "On-Air Studio", href: "/merchant/on-air-studio", icon: RadioTower },
  { label: "Reviews", href: "/merchant/reviews", icon: Star },
  { label: "Profile", href: "/merchant/profile", icon: UserCircle },
];
