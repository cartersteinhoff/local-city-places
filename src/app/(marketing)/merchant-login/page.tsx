import type { Metadata } from "next";
import { RoleLoginPage } from "@/components/role-login-page";

export const metadata: Metadata = {
  title: "Merchant Login | Local City Places",
  description: "Sign in to your Local City Places merchant dashboard.",
};

export default function MerchantLoginPage() {
  return <RoleLoginPage loginRole="merchant" />;
}
