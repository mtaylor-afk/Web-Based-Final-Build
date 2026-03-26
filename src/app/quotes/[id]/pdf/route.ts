import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCurrencyPDF(amount: any): string {
  const num = Number(amount);
  return `£${num.toFixed(2)}`;
}

function formatDatePDF(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const [quote, settings] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!quote) {
    return new NextResponse("Quote not found", { status: 404 });
  }

  const companyName = settings?.companyDisplayName || "WV Construction";
  const legalName = settings?.companyLegalName || "ACOR Building and Property Solutions Ltd";
  const companyReg = settings?.companyReg || "9287377";
  const tradingAs = settings?.tradingAs || "WV Construction";

  const lineItemsHTML = quote.lineItems.map((item, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="desc-cell">${item.description}</td>
      <td class="num-cell">${Number(item.quantity)}</td>
      <td class="num-cell">${item.unit || "—"}</td>
      <td class="num-cell">${formatCurrencyPDF(item.unitPrice)}</td>
      <td class="num-cell total-col">${formatCurrencyPDF(item.total)}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quote ${quote.ref} — ${companyName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10.5pt; color: #1a2744; background: #fff; }
  .page { max-width: 210mm; margin: 0 auto; padding: 20mm 18mm; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #1a2744; }
  .company-name { font-size: 22pt; font-weight: 800; color: #1a2744; letter-spacing: -0.5px; }
  .company-trading { font-size: 9pt; color: #c4860a; font-weight: 600; margin-top: 2px; }
  .company-sub { font-size: 8pt; color: #6b7280; margin-top: 4px; }
  .doc-title-block { text-align: right; }
  .doc-type { font-size: 18pt; font-weight: 800; color: #c4860a; letter-spacing: 1px; }
  .doc-ref { font-size: 11pt; font-weight: 700; color: #1a2744; margin-top: 4px; font-family: 'Courier New', monospace; }
  .doc-date { font-size: 9pt; color: #6b7280; margin-top: 3px; }
  .doc-status { display: inline-block; margin-top: 6px; padding: 2px 8px; background: #1a2744; color: white; border-radius: 3px; font-size: 8pt; font-weight: 600; text-transform: uppercase; }

  /* Parties */
  .parties { display: flex; gap: 40px; margin-bottom: 24px; }
  .party { flex: 1; }
  .party-label { font-size: 7.5pt; font-weight: 700; color: #c4860a; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .party-name { font-size: 11pt; font-weight: 700; color: #1a2744; }
  .party-sub { font-size: 9pt; color: #374151; margin-top: 2px; line-height: 1.4; }

  /* Works address */
  .works-box { background: #f8f4ed; border-left: 4px solid #c4860a; padding: 10px 14px; margin-bottom: 24px; border-radius: 0 4px 4px 0; }
  .works-label { font-size: 7.5pt; font-weight: 700; color: #c4860a; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .works-address { font-size: 10pt; color: #1a2744; font-weight: 600; }

  /* Title */
  .quote-title { font-size: 12pt; font-weight: 700; color: #1a2744; margin-bottom: 16px; }

  /* Line items table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .items-table thead tr { background: #1a2744; color: white; }
  .items-table th { padding: 8px 10px; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .items-table th.num-th { text-align: right; }
  .items-table td { padding: 7px 10px; font-size: 9.5pt; vertical-align: top; }
  .desc-cell { width: 45%; }
  .num-cell { text-align: right; width: 13%; }
  .total-col { font-weight: 700; }
  .row-even { background: #fff; }
  .row-odd { background: #f9fafb; }
  .items-table tbody tr { border-bottom: 1px solid #e5e7eb; }

  /* Totals */
  .totals-section { display: flex; justify-content: flex-end; margin-top: 0; border-top: 2px solid #1a2744; }
  .totals-box { width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 10px; font-size: 10pt; }
  .totals-row.grand-total { background: #1a2744; color: white; font-size: 12pt; font-weight: 800; border-radius: 0 0 4px 4px; }

  /* Notes sections */
  .section { margin-top: 20px; page-break-inside: avoid; }
  .section-title { font-size: 9pt; font-weight: 700; color: #c4860a; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  .section-body { font-size: 9.5pt; color: #374151; line-height: 1.55; white-space: pre-wrap; }

  /* Footer */
  .doc-footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 8pt; color: #9ca3af; }
  .footer-company { font-weight: 600; color: #6b7280; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 12mm 14mm; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
      <div class="company-trading">t/a ${tradingAs}</div>
      <div class="company-sub">${legalName}<br>Company Reg: ${companyReg}</div>
    </div>
    <div class="doc-title-block">
      <div class="doc-type">QUOTATION</div>
      <div class="doc-ref">${quote.ref}</div>
      <div class="doc-date">${formatDatePDF(quote.date)}</div>
      <div class="doc-status">${quote.status}</div>
    </div>
  </div>

  <!-- Parties -->
  <div class="parties">
    <div class="party">
      <div class="party-label">Prepared for</div>
      <div class="party-name">${quote.client.fullName}</div>
      ${quote.client.companyName ? `<div class="party-sub">${quote.client.companyName}</div>` : ""}
      <div class="party-sub">${quote.client.address.replace(/\n/g, "<br>")}</div>
      ${quote.client.email ? `<div class="party-sub">${quote.client.email}</div>` : ""}
      ${quote.client.phone ? `<div class="party-sub">${quote.client.phone}</div>` : ""}
    </div>
    <div class="party">
      <div class="party-label">Prepared by</div>
      <div class="party-name">${companyName}</div>
      <div class="party-sub">${legalName}</div>
      <div class="party-sub">Company Reg: ${companyReg}</div>
    </div>
  </div>

  <!-- Works Address -->
  <div class="works-box">
    <div class="works-label">Works Address</div>
    <div class="works-address">${quote.address.replace(/\n/g, "<br>")}</div>
  </div>

  ${quote.title ? `<div class="quote-title">${quote.title}</div>` : ""}

  <!-- Line Items -->
  <table class="items-table">
    <thead>
      <tr>
        <th>Description of Works</th>
        <th class="num-th">Qty</th>
        <th class="num-th">Unit</th>
        <th class="num-th">Unit Price</th>
        <th class="num-th">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHTML}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row" style="background:#f9fafb;">
        <span>Subtotal</span>
        <span>${formatCurrencyPDF(quote.subtotal)}</span>
      </div>
      <div class="totals-row grand-total">
        <span>TOTAL</span>
        <span>${formatCurrencyPDF(quote.total)}</span>
      </div>
    </div>
  </div>

  ${quote.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div class="section-body">${quote.notes}</div>
  </div>` : ""}

  ${quote.exclusions ? `
  <div class="section">
    <div class="section-title">Exclusions</div>
    <div class="section-body">${quote.exclusions}</div>
  </div>` : ""}

  ${quote.assumptions ? `
  <div class="section">
    <div class="section-title">Assumptions</div>
    <div class="section-body">${quote.assumptions}</div>
  </div>` : ""}

  ${quote.terms ? `
  <div class="section">
    <div class="section-title">Terms &amp; Conditions</div>
    <div class="section-body">${quote.terms}</div>
  </div>` : ""}

  <!-- Footer -->
  <div class="doc-footer">
    <div class="footer-company">${legalName} · Reg. ${companyReg}</div>
    <div>This quotation is valid for 30 days from the date shown above.</div>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
