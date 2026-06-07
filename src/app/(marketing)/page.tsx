import { HomeClient } from "@/components/home-client";
import { getFeaturedMerchants } from "@/lib/featured-merchants";

export default async function Home() {
  const featuredMerchants = await getFeaturedMerchants();

  return <HomeClient featuredMerchants={featuredMerchants} />;
}
