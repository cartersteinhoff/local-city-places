import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms of Service | LOCAL City Places",
  description: "Terms of Service for LOCAL City Places.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout>
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective Date: March 29, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using LOCAL City Places, you agree to these Terms of
            Service.
          </p>
          <p className="mt-2">
            If you do not agree, you may not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Description of Services</h2>
          <p className="mt-2">LOCAL City Places provides:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Exclusive city-based merchant marketplaces</li>
            <li>GRC (Gas &amp; Grocery Rebate Certificate) programs</li>
            <li>Merchant Pages and promotional tools</li>
            <li>AI-powered assistance (Ask MILO™)</li>
            <li>
              Media distribution (press releases, radio, digital magazines)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Eligibility</h2>
          <p className="mt-2">
            You must be at least 18 years old to use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Merchant Participation</h2>
          <p className="mt-2">Merchants agree to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Provide accurate business information</li>
            <li>Honor issued GRC offers</li>
            <li>Maintain compliance with applicable laws</li>
            <li>Participate in monthly program requirements (if applicable)</li>
          </ul>
          <p className="mt-2">
            LOCAL City Places reserves the right to approve, deny, or remove
            merchants.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Marketplace Exclusivity</h2>
          <p className="mt-2">
            LOCAL City Places may grant category exclusivity within a city.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Exclusivity is not guaranteed unless explicitly stated</li>
            <li>Violations or inactivity may result in loss of exclusivity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. GRC Program Terms</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>GRCs are promotional incentives, not cash equivalents</li>
            <li>Redemption requires compliance with program rules</li>
            <li>
              LOCAL City Places is not responsible for misuse or
              misunderstanding of offers
            </li>
            <li>Approval of rebates is subject to validation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            7. Payments &amp; Subscriptions
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Subscription fees are billed as agreed</li>
            <li>Fees are non-refundable unless otherwise stated</li>
            <li>Failure to pay may result in suspension or termination</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Use the platform for unlawful purposes</li>
            <li>Misrepresent information</li>
            <li>Interfere with platform functionality</li>
            <li>Attempt unauthorized access</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Intellectual Property</h2>
          <p className="mt-2">
            All platform content, branding, and technology are owned by or
            licensed to LOCAL City Places LLC.
          </p>
          <p className="mt-2">
            You may not copy, reproduce, or distribute without permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. AI Tools Disclaimer</h2>
          <p className="mt-2">AI-generated responses (e.g., Ask MILO™):</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Are for informational purposes</li>
            <li>May not always be accurate</li>
            <li>Should not be solely relied upon for decisions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Limitation of Liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, LOCAL City Places shall not
            be liable for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Indirect or consequential damages</li>
            <li>Lost profits or business interruption</li>
            <li>Errors or delays in service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">12. Termination</h2>
          <p className="mt-2">We may suspend or terminate access:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>For violation of these Terms</li>
            <li>For non-payment</li>
            <li>To protect platform integrity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">13. Governing Law</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the State of Arizona.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">14. Dispute Resolution</h2>
          <p className="mt-2">
            Disputes shall be resolved through binding arbitration in Arizona
            unless otherwise required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">15. Changes to Terms</h2>
          <p className="mt-2">
            We may update these Terms at any time. Continued use constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">16. Contact</h2>
          <p className="mt-2">LOCAL City Places LLC</p>
          <p>3075 W. Ray Road, Suite 200</p>
          <p>Chandler, Arizona</p>
          <p>Email: legal@localcityplaces.com</p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
