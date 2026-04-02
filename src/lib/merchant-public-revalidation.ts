import { revalidatePath } from "next/cache";
import { getMerchantPageUrl } from "@/lib/utils";

interface MerchantPublicIdentity {
  city?: string | null;
  state?: string | null;
  slug?: string | null;
}

export function revalidateMerchantPublicPaths(...merchants: MerchantPublicIdentity[]) {
  const paths = new Set<string>(["/api/featured-merchants"]);

  for (const merchant of merchants) {
    if (!merchant?.slug) {
      continue;
    }

    paths.add(`/api/merchants/public/${merchant.slug}`);

    if (merchant.city && merchant.state) {
      paths.add(getMerchantPageUrl(merchant.city, merchant.state, merchant.slug));
    }
  }

  for (const path of paths) {
    revalidatePath(path);
  }
}
