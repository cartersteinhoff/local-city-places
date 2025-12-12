import {
  LayoutDashboard,
  ShoppingCart,
  Send,
  FileText,
  ClipboardList,
  Star,
  UserCircle,
} from "lucide-react";

export const merchantNavItems = [
  { label: "Dashboard", href: "/merchant", icon: LayoutDashboard },
  { label: "Purchase GRCs", href: "/merchant/purchase", icon: ShoppingCart },
  { label: "Issue GRC", href: "/merchant/issue", icon: Send },
  { label: "My GRCs", href: "/merchant/grcs", icon: FileText },
  { label: "Surveys", href: "/merchant/surveys", icon: ClipboardList },
  { label: "Reviews", href: "/merchant/reviews", icon: Star },
  { label: "Profile", href: "/merchant/profile", icon: UserCircle },
];
