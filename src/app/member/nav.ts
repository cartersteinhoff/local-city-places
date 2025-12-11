import {
  LayoutDashboard,
  Upload,
  UserCircle,
  Gift,
  Receipt,
} from "lucide-react";

export const memberNavItems = [
  { label: "Dashboard", href: "/member", icon: LayoutDashboard },
  { label: "GRCs", href: "/member/grcs", icon: Gift },
  { label: "Upload Receipt", href: "/member/upload", icon: Upload },
  { label: "Receipts", href: "/member/receipts", icon: Receipt },
  { label: "Profile", href: "/member/profile", icon: UserCircle },
];
