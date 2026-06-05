import type { Metadata } from "next";
import { RoleLoginPage } from "@/components/role-login-page";

export const metadata: Metadata = {
  title: "Member Login | Local City Places",
  description: "Sign in to your Local City Places member account.",
};

export default function MemberLoginPage() {
  return <RoleLoginPage loginRole="member" />;
}
