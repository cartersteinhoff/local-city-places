import { Check, FileText, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { merchantServicesAgreement } from "@/lib/legal/merchant-services-agreement";
import { MerchantDashboardShell } from "../../merchant-dashboard-shell";
import { AgreementAcceptanceForm } from "./agreement-form";

export const metadata: Metadata = {
  title: "Merchant Services Agreement | LOCAL City Places",
  description:
    "Review and accept the MARKETLOCK360 monthly merchant services agreement.",
};

export default async function MerchantMarketLockAgreementPage() {
  const session = await getSession();

  if (
    !session ||
    (session.user.role !== "merchant" && session.user.role !== "admin")
  ) {
    redirect("/");
  }

  if (!session.merchant) {
    redirect("/merchant");
  }

  const merchant = session.merchant;
  const marketLabel =
    [merchant.city, merchant.state].filter(Boolean).join(", ") ||
    "Current market";

  return (
    <MerchantDashboardShell>
      <div className="mx-auto max-w-[1180px]">
        <PageHeader
          title="Merchant Services Agreement"
          description="Accept the current monthly agreement before continuing to payment."
          breadcrumbs={[
            { label: "Merchant", href: "/merchant" },
            { label: "MarketLock360", href: "/merchant/marketlock360" },
            { label: "Agreement" },
          ]}
        />

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <FileText className="h-4 w-4" />
              Agreement
            </div>
            <p className="mt-2 text-sm font-semibold">
              {merchantServicesAgreement.subtitle}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Merchant
            </div>
            <p
              className="mt-2 truncate text-sm font-semibold"
              title={merchant.businessName}
            >
              {merchant.businessName}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Check className="h-4 w-4" />
              Service Period
            </div>
            <p className="mt-2 text-sm font-semibold">
              Current 30-day period in {marketLabel}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle>{merchantServicesAgreement.title}</CardTitle>
              <CardDescription>
                {merchantServicesAgreement.company}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                <p className="font-semibold">
                  {merchantServicesAgreement.company}
                </p>
                <p className="mt-3 text-center text-muted-foreground">and</p>
                <p className="mt-3 font-semibold">
                  {merchantServicesAgreement.merchant}
                </p>
              </div>

              <div className="mt-6 max-h-[72vh] min-h-[520px] space-y-6 overflow-y-auto pr-2 text-sm leading-6 text-foreground">
                {merchantServicesAgreement.sections.map((section) => (
                  <section key={section.number} className="scroll-mt-6">
                    <h2 className="text-base font-bold uppercase tracking-wide">
                      {section.number}. {section.title}
                    </h2>
                    <div className="mt-3 space-y-3 text-muted-foreground">
                      {section.blocks.map((block, index) => {
                        const key = `${section.number}-${index}`;

                        if (block.kind === "list") {
                          return (
                            <ul
                              key={key}
                              className="ml-5 list-disc space-y-1 marker:text-primary"
                            >
                              {block.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          );
                        }

                        return <p key={key}>{block.text}</p>;
                      })}
                    </div>
                  </section>
                ))}

                <Separator />

                <section className="scroll-mt-6">
                  <h2 className="text-base font-bold uppercase tracking-wide">
                    Electronic Acceptance
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    By selecting "I Agree", electronically signing, and
                    submitting payment for the upcoming service period, Merchant
                    acknowledges that:
                  </p>
                  <ul className="mt-3 space-y-2">
                    {merchantServicesAgreement.acceptanceStatements.map(
                      (statement) => (
                        <li key={statement} className="flex gap-2">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">
                            {statement}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </section>

                <Separator />

                <div className="space-y-1 text-sm font-semibold">
                  {merchantServicesAgreement.footer.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <p>Version {merchantServicesAgreement.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <AgreementAcceptanceForm
            agreementVersion={merchantServicesAgreement.version}
            merchantName={merchant.businessName}
          />
        </div>
      </div>
    </MerchantDashboardShell>
  );
}
