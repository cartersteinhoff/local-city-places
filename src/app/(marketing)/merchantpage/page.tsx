import type { Metadata } from "next";
import { MerchantPageFinder } from "@/components/merchant-page-finder";

export const metadata: Metadata = {
  title: "Find Your Merchant Page | Local City Places",
  description:
    "Enter your 10 digit business phone number to find your Local City Places merchant page.",
};

export default function MerchantPageLookupPage() {
  return <MerchantPageFinder />;
}
