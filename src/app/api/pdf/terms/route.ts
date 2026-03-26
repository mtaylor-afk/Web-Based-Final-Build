import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get("quoteId");

  const [settings, quote] = await Promise.all([
    prisma.settings.findFirst(),
    quoteId ? prisma.quote.findUnique({ where: { id: quoteId }, include: { client: true } }) : null,
  ]);

  const companyName = settings?.companyDisplayName || "WV Construction";
  const legalName = settings?.companyLegalName || "ACOR Building and Property Solutions Ltd";
  const companyReg = settings?.companyReg || "9287377";
  const defaultTerms = settings?.defaultTerms || "";
  const defaultPaymentTerms = settings?.defaultPaymentTerms || "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Terms of Engagement — ${companyName}</title>
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10.5pt;color:#1a2744;background:#fff; }
  .page { max-width:210mm;margin:0 auto;padding:20mm 18mm; }
  .header { border-bottom:3px solid #1a2744;padding-bottom:20px;margin-bottom:28px; }
  .company-name { font-size:22pt;font-weight:800;color:#1a2744; }
  .company-sub { font-size:8pt;color:#6b7280;margin-top:4px; }
  .doc-type { font-size:16pt;font-weight:800;color:#c4860a;margin-top:8px; }
  .parties { display:flex;gap:40px;margin:24px 0; }
  .party { flex:1; }
  .party-label { font-size:7.5pt;font-weight:700;color:#c4860a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px; }
  .party-name { font-size:11pt;font-weight:700; }
  .party-sub { font-size:9pt;color:#374151;margin-top:2px;line-height:1.4; }
  .info-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;background:#f9fafb;padding:16px;border-radius:6px; }
  .info-item {}
  .info-label { font-size:7.5pt;font-weight:700;color:#c4860a;text-transform:uppercase;letter-spacing:0.8px; }
  .info-value { font-size:10pt;font-weight:600;color:#1a2744;margin-top:2px; }
  .section { margin-top:24px; }
  .section-title { font-size:10pt;font-weight:700;color:#1a2744;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb; }
  .section-body { font-size:9.5pt;color:#374151;line-height:1.65;white-space:pre-wrap; }
  .sign-box { margin-top:40px;border:2px solid #e5e7eb;border-radius:8px;padding:24px; }
  .sign-box-title { font-size:10pt;font-weight:700;margin-bottom:20px; }
  .sign-row { display:flex;gap:40px; }
  .sign-field { flex:1; }
  .sign-label { font-size:8pt;color:#6b7280;margin-bottom:6px; }
  .sign-line { height:40px;border-bottom:1.5px solid #374151; }
  .sign-name { font-size:8pt;color:#6b7280;margin-top:4px; }
  .footer { margin-top:36px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:8pt;color:#9ca3af;display:flex;justify-content:space-between; }
  @media print { body { -webkit-print-color-adjust:exact;print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="company-name">${companyName}</div>
    <div class="company-sub">${legalName} · Company Reg: ${companyReg}</div>
    <div class="doc-type">Terms of Engagement</div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Client</div>
      ${quote ? `
        <div class="party-name">${quote.client.fullName}</div>
        ${quote.client.companyName ? `<div class="party-sub">${quote.client.companyName}</div>` : ""}
        <div class="party-sub">${quote.client.address.replace(/\n/g, "<br>")}</div>
      ` : `
        <div class="party-name">_____________________________</div>
        <div class="party-sub">Address: _____________________________</div>
      `}
    </div>
    <div class="party">
      <div class="party-label">Contractor</div>
      <div class="party-name">${companyName}</div>
      <div class="party-sub">${legalName}</div>
      <div class="party-sub">Company Reg: ${companyReg}</div>
    </div>
  </div>

  ${quote ? `
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Quote Reference</div>
      <div class="info-value" style="font-family:'Courier New',monospace">${quote.ref}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Quote Date</div>
      <div class="info-value">${fmtDate(quote.date)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Works Address</div>
      <div class="info-value">${quote.address}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Quoted Amount</div>
      <div class="info-value">£${Number(quote.total).toFixed(2)}</div>
    </div>
  </div>` : ""}

  <div class="section">
    <div class="section-title">Payment Schedule</div>
    <div class="section-body">${defaultPaymentTerms || "As agreed between parties."}</div>
  </div>

  <div class="section">
    <div class="section-title">Terms &amp; Conditions</div>
    <div class="section-body">${quote?.terms || defaultTerms || "Standard terms apply."}</div>
  </div>

  <div class="section">
    <div class="section-title">Agreement</div>
    <div class="section-body">By signing below, both parties agree to the terms of this engagement as set out above.</div>
  </div>

  <div class="sign-box">
    <div class="sign-box-title">Signatures</div>
    <div class="sign-row">
      <div class="sign-field">
        <div class="sign-label">Client Signature</div>
        <div class="sign-line"></div>
        <div class="sign-name">${quote ? quote.client.fullName : "Client Name"}</div>
        <div class="sign-label" style="margin-top:12px">Date</div>
        <div class="sign-line"></div>
      </div>
      <div class="sign-field">
        <div class="sign-label">Contractor Representative</div>
        <div class="sign-line"></div>
        <div class="sign-name">${companyName}</div>
        <div class="sign-label" style="margin-top:12px">Date</div>
        <div class="sign-line"></div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>${legalName} · Reg. ${companyReg}</span>
    <span>Terms of Engagement · ${fmtDate(new Date())}</span>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
