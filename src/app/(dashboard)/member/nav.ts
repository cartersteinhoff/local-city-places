import { LayoutDashboard, Sparkles, UserCircle } from "lucide-react";

export const memberNavItems = [
  { label: "Dashboard", href: "/member", icon: LayoutDashboard },
  {
    label: "Favorite Merchant",
    href: "/member/sweepstakes/testimonials/new",
    icon: Sparkles,
  },
  { label: "Profile", href: "/member/profile", icon: UserCircle },
];
