import { merchantAgreementServiceTimeZone } from "./merchant-service-period";

const pageWidth = 612;
const pageHeight = 792;
const marginX = 54;
const topY = 738;
const bottomY = 54;
const bodyMaxChars = 86;
const headingMaxChars = 74;

type PdfFont = "F1" | "F2" | "F3";

interface PdfLine {
  text: string;
  font: PdfFont;
  size: number;
  gapAfter?: number;
}

export interface MerchantAgreementPdfInput {
  acceptanceId: string;
  merchantName: string;
  typedName: string;
  agreementVersion: string;
  agreementTitle: string;
  agreementText: string;
  servicePeriodLabel: string;
  acceptedAt: Date;
  agreementContentHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function getMerchantAgreementPdfHref(acceptanceId: string) {
  return `/api/merchant/marketlock360/agreement/${encodeURIComponent(acceptanceId)}/pdf`;
}

const acceptedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: merchantAgreementServiceTimeZone,
});

function normalizePdfText(value: string) {
  return value
    .replace(/™/g, "(TM)")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/[^\t\n\r -~]/g, "");
}

function escapePdfText(value: string) {
  return normalizePdfText(value).replace(/[\\()]/g, "\\$&");
}

function wrapText(text: string, maxChars: number) {
  const words = normalizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (!line) {
      line = word;
      continue;
    }

    if (`${line} ${word}`.length <= maxChars) {
      line = `${line} ${word}`;
      continue;
    }

    lines.push(line);
    line = word;
  }

  if (line) {
    lines.push(line);
  }

  return lines.length > 0 ? lines : [""];
}

function addWrappedLines(
  lines: PdfLine[],
  text: string,
  options: {
    font?: PdfFont;
    size?: number;
    maxChars?: number;
    gapAfter?: number;
  },
) {
  const wrapped = wrapText(text, options.maxChars ?? bodyMaxChars);

  wrapped.forEach((line, index) => {
    lines.push({
      text: line,
      font: options.font ?? "F1",
      size: options.size ?? 11,
      gapAfter: index === wrapped.length - 1 ? options.gapAfter : 0,
    });
  });
}

function isAgreementHeading(text: string) {
  return (
    text === "ELECTRONIC ACCEPTANCE" ||
    /^\d+\.\s[A-Z][A-Z0-9\s()/,'"-]+$/.test(text)
  );
}

function buildPdfLines(input: MerchantAgreementPdfInput) {
  const lines: PdfLine[] = [];

  addWrappedLines(lines, input.agreementTitle, {
    font: "F2",
    size: 18,
    maxChars: 56,
    gapAfter: 6,
  });
  addWrappedLines(lines, "Executed monthly merchant services agreement", {
    size: 11,
    maxChars: 80,
    gapAfter: 14,
  });

  const recordLines = [
    `Acceptance ID: ${input.acceptanceId}`,
    `Merchant: ${input.merchantName}`,
    `Service period: ${input.servicePeriodLabel}`,
    `Agreement version: ${input.agreementVersion}`,
    `Accepted by electronic signature: ${input.typedName}`,
    `Accepted at: ${acceptedAtFormatter.format(input.acceptedAt)} ${merchantAgreementServiceTimeZone}`,
    `Agreement content hash: ${input.agreementContentHash}`,
  ];

  if (input.ipAddress) {
    recordLines.push(`IP address: ${input.ipAddress}`);
  }

  if (input.userAgent) {
    recordLines.push(`User agent: ${input.userAgent}`);
  }

  lines.push({ text: "Execution Record", font: "F2", size: 13, gapAfter: 4 });
  for (const line of recordLines) {
    addWrappedLines(lines, line, { size: 10, maxChars: 92, gapAfter: 2 });
  }

  lines.push({
    text: "Electronic Signature",
    font: "F2",
    size: 13,
    gapAfter: 4,
  });
  addWrappedLines(lines, "Signed by typed legal name:", {
    size: 10,
    maxChars: 92,
    gapAfter: 2,
  });
  addWrappedLines(lines, input.typedName, {
    font: "F3",
    size: 24,
    maxChars: 42,
    gapAfter: 0,
  });
  lines.push({
    text: "________________________________________",
    font: "F1",
    size: 10,
    gapAfter: 2,
  });
  addWrappedLines(
    lines,
    `Electronic signature accepted ${acceptedAtFormatter.format(input.acceptedAt)} ${merchantAgreementServiceTimeZone}`,
    {
      size: 9.5,
      maxChars: 92,
      gapAfter: 6,
    },
  );

  lines.push({ text: "", font: "F1", size: 10, gapAfter: 10 });

  for (const paragraph of input.agreementText.split(/\n{2,}/)) {
    const rawLines = paragraph.split("\n").map((line) => line.trim());

    for (const rawLine of rawLines) {
      if (!rawLine) {
        continue;
      }

      const heading = isAgreementHeading(rawLine);
      addWrappedLines(lines, rawLine, {
        font: heading ? "F2" : "F1",
        size: heading ? 12 : 10.5,
        maxChars: heading ? headingMaxChars : bodyMaxChars,
        gapAfter: heading ? 5 : 2,
      });
    }

    lines.push({ text: "", font: "F1", size: 10, gapAfter: 5 });
  }

  return lines;
}

function paginate(lines: PdfLine[]) {
  const pages: PdfLine[][] = [];
  let currentPage: PdfLine[] = [];
  let y = topY;

  for (const line of lines) {
    const lineHeight = line.size + 4 + (line.gapAfter ?? 0);

    if (currentPage.length > 0 && y - lineHeight < bottomY) {
      pages.push(currentPage);
      currentPage = [];
      y = topY;
    }

    currentPage.push(line);
    y -= lineHeight;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function renderPageContent(
  lines: PdfLine[],
  pageNumber: number,
  pageCount: number,
) {
  let y = topY;
  let content = "";

  for (const line of lines) {
    if (line.text) {
      content += [
        "BT",
        `/${line.font} ${line.size.toFixed(1)} Tf`,
        `${marginX} ${y.toFixed(2)} Td`,
        `(${escapePdfText(line.text)}) Tj`,
        "ET",
        "",
      ].join("\n");
    }

    y -= line.size + 4 + (line.gapAfter ?? 0);
  }

  content += [
    "BT",
    "/F1 9 Tf",
    `${marginX} 32 Td`,
    `(Page ${pageNumber} of ${pageCount}) Tj`,
    "ET",
    "",
  ].join("\n");

  return content;
}

function buildPdf(objects: string[]) {
  let output = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(output, "utf8");
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  output += [
    "trailer",
    `<</Size ${objects.length + 1} /Root 1 0 R>>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    "",
  ].join("\n");

  return Buffer.from(output, "utf8");
}

export function generateMerchantAgreementPdf(input: MerchantAgreementPdfInput) {
  const pages = paginate(buildPdfLines(input));
  const pageIds = pages.map((_, index) => 6 + index * 2);
  const objects = [
    "<</Type /Catalog /Pages 2 0 R>>",
    `<</Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length}>>`,
    "<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>",
    "<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>>",
    "<</Type /Font /Subtype /Type1 /BaseFont /ZapfChancery-MediumItalic>>",
  ];

  pages.forEach((pageLines, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const pageContent = renderPageContent(pageLines, index + 1, pages.length);

    objects.push(
      `<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources <</Font <</F1 3 0 R /F2 4 0 R /F3 5 0 R>>>> /Contents ${contentId} 0 R>>`,
    );
    objects.push(
      `<</Length ${Buffer.byteLength(pageContent, "utf8")}>>\nstream\n${pageContent}endstream`,
    );
  });

  return buildPdf(objects);
}
