"use client";

import { Check, FileText } from "lucide-react";
import { useRef, useState, type WheelEvent } from "react";
import {
  AgreementAcceptanceForm,
  AgreementSignedStatusPanel,
} from "./agreement-form";

type AgreementBlock =
  | {
      kind: "paragraph";
      text: string;
    }
  | {
      kind: "list";
      items: readonly string[];
    };

interface AgreementContent {
  title: string;
  subtitle: string;
  version: string;
  company: string;
  merchant: string;
  sections: readonly {
    number: string;
    title: string;
    blocks: readonly AgreementBlock[];
  }[];
  acceptanceStatements: readonly string[];
  footer: readonly string[];
}

interface AgreementSigningExperienceProps {
  agreement: AgreementContent;
  agreementVersion: string;
  merchantName: string;
  monthlyPaymentLabel: string | null;
  servicePeriodLabel: string;
  signedAgreement?: {
    acceptedAtIso: string;
    agreementPdfUrl: string | null;
    agreementVersion: string;
    id: string;
    servicePeriodLabel: string;
    typedName: string;
  } | null;
}

const keyTerms = [
  {
    label: "30-day service period",
    detail: "Current monthly window",
  },
  {
    label: "One-time payment",
    detail: "No automatic charge",
  },
  {
    label: "New agreement monthly",
    detail: "Sign again next period",
  },
  {
    label: "No refunds",
    detail: "Payments are final",
  },
] as const;

const signatureFontStyle = {
  fontFamily:
    '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive',
};

export function AgreementSigningExperience({
  agreement,
  agreementVersion,
  merchantName,
  monthlyPaymentLabel,
  servicePeriodLabel,
  signedAgreement,
}: AgreementSigningExperienceProps) {
  const documentScrollerRef = useRef<HTMLDivElement>(null);
  const [typedName, setTypedName] = useState("");
  const signaturePreview = signedAgreement?.typedName ?? typedName.trim();
  const signedAtLabel = signedAgreement
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(signedAgreement.acceptedAtIso))
    : null;

  function handleScrollHandoff(event: WheelEvent<HTMLDivElement>) {
    if (event.deltaY <= 0) {
      return;
    }

    const scroller = documentScrollerRef.current;

    if (!scroller) {
      return;
    }

    if (event.target instanceof Node && scroller.contains(event.target)) {
      return;
    }

    const canScrollDocumentDown =
      scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 2;

    if (!canScrollDocumentDown) {
      return;
    }

    const pageScrollHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );
    const pageIsAtBottom =
      window.scrollY + window.innerHeight >= pageScrollHeight - 2;

    if (!pageIsAtBottom) {
      return;
    }

    const scrollDelta =
      event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * scroller.clientHeight
          : event.deltaY;

    event.preventDefault();
    scroller.scrollTop += scrollDelta;
  }

  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
      onWheel={handleScrollHandoff}
    >
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <FileText className="h-4 w-4" />
                Agreement document
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                {agreement.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {agreement.subtitle} - Version {agreement.version}
              </p>
            </div>
            <span className="inline-flex h-8 shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-bold uppercase text-slate-600">
              {signedAgreement ? "Already signed" : "PDF after signing"}
            </span>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 sm:px-7">
          <div className="grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
            {keyTerms.map((term) => (
              <div key={term.label} className="min-w-0">
                <p className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Check className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                  {term.label}
                </p>
                <p className="mt-0.5 text-slate-500">{term.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-100/80 px-5 py-4 text-sm leading-6 sm:px-7">
          <p className="font-semibold text-slate-900">{agreement.company}</p>
          <p className="my-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            and
          </p>
          <p className="font-semibold text-slate-900">{agreement.merchant}</p>
        </div>

        <div
          className="space-y-7 px-5 py-6 text-sm leading-7 sm:px-7 lg:max-h-[calc(100vh-340px)] lg:min-h-[540px] lg:overflow-y-auto"
          ref={documentScrollerRef}
        >
          {agreement.sections.map((section) => (
            <section
              key={section.number}
              id={`agreement-section-${section.number}`}
              className="scroll-mt-6"
            >
              <h3 className="text-base font-bold uppercase tracking-wide text-slate-950">
                {section.number}. {section.title}
              </h3>
              <div className="mt-3 space-y-3 text-slate-700">
                {section.blocks.map((block, index) => {
                  const key = `${section.number}-${index}`;

                  if (block.kind === "list") {
                    return (
                      <ul
                        key={key}
                        className="ml-5 list-disc space-y-1 marker:text-orange-600"
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

          <div className="h-px bg-slate-200" />

          <section id="electronic-acceptance" className="scroll-mt-6">
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-950">
              Electronic Acceptance
            </h3>
            <p className="mt-3 text-slate-700">
              By selecting "I Agree", electronically signing, and submitting
              payment for the upcoming service period, Merchant acknowledges
              that:
            </p>
            <ul className="mt-3 space-y-2">
              {agreement.acceptanceStatements.map((statement) => (
                <li key={statement} className="flex gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-orange-600" />
                  <span className="text-slate-700">{statement}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Electronic signature
                  </p>
                  <p
                    className={
                      signaturePreview
                        ? "mt-2 min-h-14 break-words border-b border-slate-300 pb-1 text-4xl leading-tight text-slate-950"
                        : "mt-2 flex min-h-14 items-end border-b border-slate-300 pb-2 text-sm italic text-slate-400"
                    }
                    style={signaturePreview ? signatureFontStyle : undefined}
                  >
                    {signaturePreview || "Signature appears here as you type"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {signedAgreement
                      ? "This is the electronic signature saved for the current service period."
                      : "The typed legal name is shown as the electronic signature preview before submission."}
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  <p className="font-bold uppercase tracking-wide text-slate-500">
                    Service period
                  </p>
                  <p className="font-semibold text-slate-900">
                    {servicePeriodLabel}
                  </p>
                  <p className="mt-2 font-bold uppercase tracking-wide text-slate-500">
                    Recorded
                  </p>
                  <p>{signedAtLabel ?? "On signature submission"}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-200" />

          <div className="space-y-1 text-sm font-semibold">
            {agreement.footer.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>Version {agreement.version}</p>
          </div>
        </div>
      </section>

      {signedAgreement ? (
        <AgreementSignedStatusPanel
          acceptedAtIso={signedAgreement.acceptedAtIso}
          agreementAcceptanceId={signedAgreement.id}
          agreementPdfUrl={signedAgreement.agreementPdfUrl}
          agreementVersion={signedAgreement.agreementVersion}
          merchantName={merchantName}
          servicePeriodLabel={signedAgreement.servicePeriodLabel}
          typedName={signedAgreement.typedName}
        />
      ) : (
        <AgreementAcceptanceForm
          agreementVersion={agreementVersion}
          merchantName={merchantName}
          monthlyPaymentLabel={monthlyPaymentLabel}
          onTypedNameChange={setTypedName}
          servicePeriodLabel={servicePeriodLabel}
          typedName={typedName}
        />
      )}
    </div>
  );
}
