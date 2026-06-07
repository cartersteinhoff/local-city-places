import {
  BarChart3,
  ClipboardList,
  FileText,
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

export const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Merchant Pages", href: "/admin/merchants", icon: Store },
  {
    label: "Merchant Requests",
    href: "/admin/merchant-requests",
    icon: ClipboardList,
  },
  { label: "Email Campaigns", href: "/admin/emails", icon: Send },
  {
    label: "Email Templates",
    href: "/admin/emails/templates",
    icon: FileText,
  },
  { label: "Sweepstakes", href: "/admin/sweepstakes", icon: Sparkles },
  {
    label: "Merchant Nominations",
    href: "/admin/merchant-nominations",
    icon: ImageIcon,
  },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { label: "Trials", href: "/admin/invites", icon: Mail },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];
