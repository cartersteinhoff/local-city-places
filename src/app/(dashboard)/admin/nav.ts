import {
  BarChart3,
  ClipboardList,
  FileText,
  FolderOpen,
  Globe,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MessageSquare,
  Send,
  Store,
  Users,
} from "lucide-react";

export const adminNavItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    section: "Overview",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    section: "Overview",
  },
  { label: "Users", href: "/admin/users", icon: Users, section: "People" },
  {
    label: "Merchant Pages",
    href: "/admin/merchants",
    icon: Store,
    section: "Merchants",
  },
  {
    label: "Merchant Requests",
    href: "/admin/merchant-requests",
    icon: ClipboardList,
    section: "Merchants",
  },
  {
    label: "Merchant Invites",
    href: "/admin/invites",
    icon: Mail,
    section: "Merchants",
  },
  {
    label: "Trial Requests",
    href: "/admin/marketlock-trials",
    icon: LockKeyhole,
    section: "Merchants",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderOpen,
    section: "Merchants",
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: MessageSquare,
    section: "Merchants",
  },
  {
    label: "Email Campaigns",
    href: "/admin/emails",
    icon: Send,
    section: "Marketing",
  },
  {
    label: "Email Templates",
    href: "/admin/emails/templates",
    icon: FileText,
    section: "Marketing",
  },
  {
    label: "Site Pages",
    href: "/admin/pages",
    icon: Globe,
    section: "Pages",
  },
];
