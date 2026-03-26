import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(amount: any): string {
  const num = Number(amount);
  return `£${num.toFixed(2)}`;
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        sourceQuote: { select: { ref: true } },
      },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!invoice) return new NextResponse("Invoice not found", { status: 404 });

  const companyName = settings?.companyDisplayName || "WV Construction";
  const legalName = settings?.companyLegalName || "ACOR Building and Property Solutions Ltd";
  const companyReg = settings?.companyReg || "9287377";

  const lineItemsHTML = invoice.lineItems
    .map(
      (item, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="desc-cell">${item.description}</td>
      <td class="num-cell">${Number(item.quantity)}</td>
      <td class="num-cell">${item.unit || "—"}</td>
      <td class="num-cell">${fmt(item.unitPrice)}</td>
      <td class="num-cell total-col">${fmt(item.total)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.ref} — ${companyName}</title>
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10.5pt;color:#1a2744;background:#fff; }
  .page { max-width:210mm;margin:0 auto;padding:20mm 18mm; }
  .header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #1a2744; }
  .company-name { font-size:22pt;font-weight:800;color:#1a2744; }
  .company-sub { font-size:8pt;color:#6b7280;margin-top:4px; }
  .doc-type { font-size:18pt;font-weight:800;color:#c4860a;letter-spacing:1px; }
  .doc-ref { font-size:11pt;font-weight:700;color:#1a2744;margin-top:4px;font-family:'Courier New',monospace; }
  .doc-date { font-size:9pt;color:#6b7280;margin-top:3px; }
  .parties { display:flex;gap:40px;margin-bottom:24px; }
  .party { flex:1; }
  .party-label { font-size:7.5pt;font-weight:700;color:#c4860a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px; }
  .party-name { font-size:11pt;font-weight:700; }
  .party-sub { font-size:9pt;color:#374151;margin-top:2px;line-height:1.4; }
  .works-box { background:#f8f4ed;border-left:4px solid #c4860a;padding:10px 14px;margin-bottom:24px;border-radius:0 4px 4px 0; }
  .works-label { font-size:7.5pt;font-weight:700;color:#c4860a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px; }
  .works-address { font-size:10pt;font-weight:600; }
  .items-table { width:100%;border-collapse:collapse;margin-bottom:0; }
  .items-table thead tr { background:#1a2744;color:white; }
  .items-table th { padding:8px 10px;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.5px; }
  .items-table th.num-th { text-align:right; }
  .items-table td { padding:7px 10px;font-size:9.5pt;vertical-align:top; }
  .desc-cell { width:45%; }
  .num-cell { text-align:right;width:13%; }
  .total-col { font-weight:700; }
  .row-even { background:#fff; }
  .row-odd { background:#f9fafb; }
  .items-table tbody tr { border-bottom:1px solid #e5e7eb; }
  .totals-section { display:flex;justify-content:flex-end;border-top:2px solid #1a2744; }
  .totals-box { width:260px; }
  .totals-row { display:flex;justify-content:space-between;padding:6px 10px;font-size:10pt; }
  .totals-row.grand-total { background:#1a2744;color:white;font-size:12pt;font-weight:800;border-radius:0 0 4px 4px; }
  .section { margin-top:20px;page-break-inside:avoid; }
  .section-title { font-size:9pt;font-weight:700;color:#c4860a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e5e7eb; }
  .section-body { font-size:9.5pt;color:#374151;line-height:1.55;white-space:pre-wrap; }
  .payment-box { margin-top:24px;background:#1a2744;color:white;padding:14px 18px;border-radius:6px; }
  .payment-title { font-size:10pt;font-weight:700;margin-bottom:6px; }
  .payment-body { font-size:9pt;line-height:1.5; }
  .doc-footer { margin-top:36px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af; }
  @media print { body { -webkit-print-color-adjust:exact;print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
      <div class="company-sub">${legalName} · Reg: ${companyReg}</div>
    </div>
    <div style="text-align:right">
      <div class="doc-type">INVOICE</div>
      <div class="doc-ref">${invoice.ref}</div>
      <div class="doc-date">${fmtDate(invoice.date)}</div>
      ${invoice.sourceQuote ? `<div style="font-size:8pt;color:#6b7280;margin-top:4px">Re: Quote ${invoice.sourceQuote.ref}</div>` : ""}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Invoice To</div>
      <div class="party-name">${invoice.client.fullName}</div>
      ${invoice.client.companyName ? `<div class="party-sub">${invoice.client.companyName}</div>` : ""}
      <div class="party-sub">${invoice.client.address.replace(/\n/g, "<br>")}</div>
      ${invoice.client.email ? `<div class="party-sub">${invoice.client.email}</div>` : ""}
      ${invoice.client.phone ? `<div class="party-sub">${invoice.client.phone}</div>` : ""}
    </div>
    <div class="party">
      <div class="party-label">From</div>
      <div class="party-name">${companyName}</div>
      <div class="party-sub">${legalName}</div>
      <div class="party-sub">Company Reg: ${companyReg}</div>
    </div>
  </div>

  <div class="works-box">
    <div class="works-label">Works Address</div>
    <div class="works-address">${invoice.address.replace(/\n/g, "<br>")}</div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="num-th">Qty</th>
        <th class="num-th">Unit</th>
        <th class="num-th">Unit Price</th>
        <th class="num-th">Total</th>
      </tr>
    </thead>
    <tbody>${lineItemsHTML}</tbody>
  </table>

  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row" style="background:#f9fafb"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
      <div class="totals-row grand-total"><span>TOTAL DUE</span><span>${fmt(invoice.total)}</span></div>
    </div>
  </div>

  ${invoice.paymentTerms ? `
  <div class="payment-box">
    <div class="payment-title">Payment Terms</div>
    <div class="payment-body">${invoice.paymentTerms}</div>
  </div>` : ""}

  ${invoice.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div class="section-body">${invoice.notes}</div>
  </div>` : ""}

  <div class="doc-footer">
    <div>${legalName} · Reg. ${companyReg}</div>
    <div>Thank you for your business.</div>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
