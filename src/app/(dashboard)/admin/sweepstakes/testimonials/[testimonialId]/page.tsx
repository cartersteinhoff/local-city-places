import { redirect } from "next/navigation";

export default async function LegacyAdminMerchantNominationDetailPage({
  params,
}: {
  params: Promise<{ testimonialId: string }>;
}) {
  const { testimonialId } = await params;

  redirect(`/admin/merchant-nominations/${testimonialId}`);
}
