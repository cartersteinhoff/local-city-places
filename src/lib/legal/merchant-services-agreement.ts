type AgreementBlock =
  | {
      kind: "paragraph";
      text: string;
    }
  | {
      kind: "list";
      items: string[];
    };

export interface AgreementSection {
  number: string;
  title: string;
  blocks: AgreementBlock[];
}

export const merchantServicesAgreement = {
  title: "MARKETLOCK360™ Merchant Services Agreement",
  subtitle: "Monthly Subscription Services Agreement",
  version: "1.0",
  company:
    'LOCAL City Places LLC ("LOCAL City Places," "Company," "we," "our," or "us")',
  merchant:
    'The Merchant identified in the Merchant Dashboard ("Merchant," "you," or "your")',
  sections: [
    {
      number: "1",
      title: "Agreement",
      blocks: [
        {
          kind: "paragraph",
          text: 'This Merchant Services Agreement ("Agreement") governs the monthly subscription relationship between LOCAL City Places LLC and Merchant for participation in the MARKETLOCK360™ program and any associated services, media, marketing, advertising, promotional, technology, and business support services provided by LOCAL City Places.',
        },
        {
          kind: "paragraph",
          text: "By electronically signing this Agreement, Merchant agrees to all terms and conditions contained herein.",
        },
      ],
    },
    {
      number: "2",
      title: "Term",
      blocks: [
        {
          kind: "paragraph",
          text: "This Agreement is effective upon electronic acceptance by Merchant and shall remain in effect for the current thirty (30) day service period identified in the Merchant Dashboard.",
        },
        {
          kind: "paragraph",
          text: "This Agreement is renewed on a month-to-month basis only upon Merchant's payment and electronic acceptance of a new Agreement for the next service period.",
        },
        {
          kind: "paragraph",
          text: "Neither party is obligated to renew beyond the current service period.",
        },
        {
          kind: "paragraph",
          text: "There are no long-term contracts.",
        },
      ],
    },
    {
      number: "3",
      title: "Services Provided",
      blocks: [
        {
          kind: "paragraph",
          text: "LOCAL City Places shall provide the MARKETLOCK360™ benefits and services selected by Merchant and displayed within the Merchant Dashboard during the applicable service period.",
        },
        {
          kind: "paragraph",
          text: "The specific benefits, features, promotions, media placements, advertising opportunities, technology services, AI services, chamber benefits, radio services, merchant page services, sweepstakes services, magazine services, lead generation services, and any other included offerings may be modified, enhanced, replaced, expanded, reduced, or updated by LOCAL City Places from time to time.",
        },
        {
          kind: "paragraph",
          text: "Merchant acknowledges and agrees that the current MARKETLOCK360™ benefits available during any service period are those displayed within the Merchant Dashboard.",
        },
        {
          kind: "paragraph",
          text: "The Merchant Dashboard is incorporated into this Agreement by reference.",
        },
      ],
    },
    {
      number: "4",
      title: "Fees",
      blocks: [
        {
          kind: "paragraph",
          text: "Merchant agrees to pay the monthly subscription fee associated with the selected MARKETLOCK360™ plan.",
        },
        {
          kind: "paragraph",
          text: "All fees are due in advance for the upcoming thirty (30) day service period.",
        },
        {
          kind: "paragraph",
          text: "Failure to make payment may result in suspension or termination of services.",
        },
      ],
    },
    {
      number: "5",
      title: "No Refunds",
      blocks: [
        {
          kind: "paragraph",
          text: "ALL PAYMENTS ARE FINAL.",
        },
        {
          kind: "paragraph",
          text: "Merchant expressly acknowledges and agrees that:",
        },
        {
          kind: "list",
          items: [
            "No refunds shall be issued for any reason.",
            "No partial refunds shall be issued for any reason.",
            "No prorated refunds shall be issued for any reason.",
            "No service credits shall be issued for any unused services.",
            "No service credits shall be issued for early cancellation.",
            "No service credits shall be issued if Merchant elects not to utilize available services.",
          ],
        },
        {
          kind: "paragraph",
          text: "Merchant understands that LOCAL City Places allocates resources, personnel, technology, media inventory, advertising opportunities, category availability, and business support resources upon activation and renewal.",
        },
        {
          kind: "paragraph",
          text: "Accordingly, all payments are non-refundable.",
        },
      ],
    },
    {
      number: "6",
      title: "Category Exclusivity",
      blocks: [
        {
          kind: "paragraph",
          text: "Where category exclusivity is included as part of Merchant's MARKETLOCK360™ benefits, such exclusivity shall remain active only while Merchant remains in good standing and maintains an active paid subscription.",
        },
        {
          kind: "paragraph",
          text: "If Merchant cancels, fails to renew, becomes delinquent, or is terminated, LOCAL City Places may immediately release the category for availability to another merchant.",
        },
        {
          kind: "paragraph",
          text: "LOCAL City Places retains sole discretion regarding category definitions and category assignments.",
        },
      ],
    },
    {
      number: "7",
      title: "Merchant Content",
      blocks: [
        {
          kind: "paragraph",
          text: "Merchant grants LOCAL City Places a non-exclusive, royalty-free license during the service period to use, display, publish, distribute, reproduce, modify, and promote Merchant-provided content including:",
        },
        {
          kind: "list",
          items: [
            "Business names",
            "Logos",
            "Photographs",
            "Videos",
            "Audio recordings",
            "Marketing materials",
            "Promotional offers",
            "Testimonials",
            "Reviews",
            "Other submitted content",
          ],
        },
        {
          kind: "paragraph",
          text: "for purposes of providing services under this Agreement.",
        },
        {
          kind: "paragraph",
          text: "Merchant represents that it owns or has the legal right to provide all submitted content.",
        },
      ],
    },
    {
      number: "8",
      title: "Intellectual Property",
      blocks: [
        {
          kind: "paragraph",
          text: "All software, systems, technology, websites, databases, marketing systems, AI systems, sweepstakes systems, radio systems, advertising systems, content platforms, trademarks, trade names, logos, graphics, processes, and intellectual property belonging to LOCAL City Places shall remain the exclusive property of LOCAL City Places LLC.",
        },
        {
          kind: "paragraph",
          text: "Nothing contained in this Agreement transfers ownership of any intellectual property to Merchant.",
        },
      ],
    },
    {
      number: "9",
      title: "Independent Business Relationship",
      blocks: [
        {
          kind: "paragraph",
          text: "Merchant acknowledges that LOCAL City Places is an independent service provider.",
        },
        {
          kind: "paragraph",
          text: "Nothing contained herein shall be construed as creating:",
        },
        {
          kind: "list",
          items: [
            "A partnership",
            "Joint venture",
            "Franchise relationship",
            "Agency relationship",
            "Employment relationship",
          ],
        },
        {
          kind: "paragraph",
          text: "between the parties.",
        },
      ],
    },
    {
      number: "10",
      title: "No Guarantee of Results",
      blocks: [
        {
          kind: "paragraph",
          text: "LOCAL City Places does not guarantee:",
        },
        {
          kind: "list",
          items: [
            "Sales results",
            "Revenue increases",
            "Lead generation quantities",
            "Customer acquisition results",
            "Advertising performance",
            "Search rankings",
            "Traffic levels",
            "Sweepstakes participation levels",
            "Media exposure levels",
            "Return on investment",
          ],
        },
        {
          kind: "paragraph",
          text: "Any examples, projections, testimonials, case studies, or illustrations are provided for informational purposes only and are not guarantees of future performance.",
        },
      ],
    },
    {
      number: "11",
      title: "Limitation of Liability",
      blocks: [
        {
          kind: "paragraph",
          text: "To the fullest extent permitted by law, LOCAL City Places LLC shall not be liable for any:",
        },
        {
          kind: "list",
          items: [
            "Lost profits",
            "Lost revenue",
            "Lost opportunities",
            "Business interruption",
            "Indirect damages",
            "Consequential damages",
            "Incidental damages",
            "Special damages",
            "Punitive damages",
          ],
        },
        {
          kind: "paragraph",
          text: "arising out of or relating to this Agreement.",
        },
        {
          kind: "paragraph",
          text: "The maximum liability of LOCAL City Places under this Agreement shall not exceed the amount paid by Merchant for the current thirty (30) day service period.",
        },
      ],
    },
    {
      number: "12",
      title: "Indemnification",
      blocks: [
        {
          kind: "paragraph",
          text: "Merchant agrees to defend, indemnify, and hold harmless LOCAL City Places LLC, its owners, officers, employees, contractors, affiliates, successors, and assigns from any claims, damages, liabilities, costs, expenses, or attorney fees arising from:",
        },
        {
          kind: "list",
          items: [
            "Merchant content",
            "Merchant products or services",
            "Merchant advertising claims",
            "Merchant promotions",
            "Merchant sweepstakes prizes",
            "Merchant conduct",
            "Merchant violations of law",
          ],
        },
      ],
    },
    {
      number: "13",
      title: "Termination",
      blocks: [
        {
          kind: "paragraph",
          text: "Either party may elect not to renew this Agreement at the end of the current service period.",
        },
        {
          kind: "paragraph",
          text: "Termination or non-renewal shall not entitle Merchant to any refund, partial refund, credit, or reimbursement.",
        },
        {
          kind: "paragraph",
          text: "Any rights or obligations intended to survive termination shall remain in effect.",
        },
      ],
    },
    {
      number: "14",
      title: "Electronic Signatures",
      blocks: [
        {
          kind: "paragraph",
          text: "Merchant agrees that:",
        },
        {
          kind: "list",
          items: [
            "Electronic signatures shall have the same legal effect as handwritten signatures.",
            "Electronic records shall be admissible as evidence.",
            "LOCAL City Places may store electronic copies of this Agreement.",
            "Electronic acceptance through the Merchant Dashboard constitutes execution of this Agreement.",
          ],
        },
        {
          kind: "paragraph",
          text: "Merchant further agrees that LOCAL City Places may archive executed Agreements and related records within the Merchant Dashboard and its internal systems.",
        },
      ],
    },
    {
      number: "15",
      title: "Governing Law",
      blocks: [
        {
          kind: "paragraph",
          text: "This Agreement shall be governed by and construed under the laws of the State of Arizona, without regard to conflict of law principles.",
        },
        {
          kind: "paragraph",
          text: "Any legal action arising from this Agreement shall be brought exclusively in the state or federal courts located in Maricopa County, Arizona.",
        },
        {
          kind: "paragraph",
          text: "The parties consent to the jurisdiction of such courts.",
        },
      ],
    },
    {
      number: "16",
      title: "Entire Agreement",
      blocks: [
        {
          kind: "paragraph",
          text: "This Agreement, together with the benefits, services, policies, pricing, and disclosures displayed within the Merchant Dashboard, constitutes the entire agreement between the parties regarding the subject matter herein.",
        },
        {
          kind: "paragraph",
          text: "LOCAL City Places may update this Agreement for future service periods. Any revised Agreement shall become effective only upon Merchant's acceptance during a subsequent renewal period.",
        },
      ],
    },
  ] satisfies AgreementSection[],
  acceptanceStatements: [
    "Merchant has read this Agreement in its entirety.",
    "Merchant understands and accepts all terms and conditions.",
    "Merchant understands that services are provided on a month-to-month basis.",
    "Merchant understands that all payments are non-refundable.",
    "Merchant agrees to the MARKETLOCK360™ services and benefits displayed in the Merchant Dashboard for the applicable service period.",
    "Merchant intends to be legally bound by this Agreement.",
  ],
  footer: [
    "LOCAL CITY PLACES LLC",
    "Chandler, Arizona",
    "MARKETLOCK360™ Monthly Merchant Services Agreement",
  ],
} as const;

export function getMerchantServicesAgreementText() {
  const sectionText = merchantServicesAgreement.sections.map((section) => {
    const blocks = section.blocks.map((block) => {
      if (block.kind === "list") {
        return block.items.map((item) => `- ${item}`).join("\n");
      }

      return block.text;
    });

    return [
      `${section.number}. ${section.title.toUpperCase()}`,
      ...blocks,
    ].join("\n\n");
  });

  return [
    merchantServicesAgreement.title.toUpperCase(),
    merchantServicesAgreement.subtitle,
    "",
    merchantServicesAgreement.company,
    "",
    "and",
    "",
    merchantServicesAgreement.merchant,
    "",
    ...sectionText,
    "ELECTRONIC ACCEPTANCE",
    'By selecting "I Agree", electronically signing, and submitting payment for the upcoming service period, Merchant acknowledges that:',
    merchantServicesAgreement.acceptanceStatements
      .map((statement) => `- ${statement}`)
      .join("\n"),
    ...merchantServicesAgreement.footer,
    `Version ${merchantServicesAgreement.version}`,
  ].join("\n\n");
}
