import {
  LayoutDashboard,
  ClipboardCheck,
  Receipt,
  CreditCard,
  Users,
  Mail,
  Send,
  FolderOpen,
  BarChart3,
  Store,
  MessageSquare,
} from "lucide-react";

export const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Merchant Pages", href: "/admin/merchants", icon: Store },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { label: "Receipts", href: "/admin/receipts", icon: ClipboardCheck },
  { label: "Orders", href: "/admin/orders", icon: Receipt },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Emails", href: "/admin/emails", icon: Send },
  { label: "Trials", href: "/admin/invites", icon: Mail },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];
