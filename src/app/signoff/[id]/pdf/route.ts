import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const [signOff, settings] = await Promise.all([
    prisma.projectSignOff.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        relatedQuote: { select: { ref: true } },
        relatedInvoice: { select: { ref: true } },
      },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!signOff) return new NextResponse("Not found", { status: 404 });

  const companyName = settings?.companyDisplayName || "WV Construction";
  const legalName = settings?.companyLegalName || "ACOR Building and Property Solutions Ltd";
  const companyReg = settings?.companyReg || "9287377";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Sign-Off ${signOff.ref} — ${companyName}</title>
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10.5pt;color:#1a2744;background:#fff; }
  .page { max-width:210mm;margin:0 auto;padding:20mm 18mm; }
  .header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #1a2744; }
  .company-name { font-size:22pt;font-weight:800;color:#1a2744; }
  .company-sub { font-size:8pt;color:#6b7280;margin-top:4px; }
  .doc-type { font-size:16pt;font-weight:800;color:#c4860a;letter-spacing:1px; }
  .doc-ref { font-size:11pt;font-weight:700;font-family:'Courier New',monospace;margin-top:4px; }
  .doc-date { font-size:9pt;color:#6b7280;margin-top:3px; }
  .completion-box { background:#e8f5e9;border-left:4px solid #2e7d32;padding:14px 18px;margin:20px 0;border-radius:0 4px 4px 0; }
  .completion-label { font-size:9pt;font-weight:700;color:#2e7d32;text-transform:uppercase;margin-bottom:6px; }
  .completion-date { font-size:13pt;font-weight:800;color:#1b5e20; }
  .parties { display:flex;gap:40px;margin-bottom:24px; }
  .party { flex:1; }
  .party-label { font-size:7.5pt;font-weight:700;color:#c4860a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px; }
  .party-name { font-size:11pt;font-weight:700; }
  .party-sub { font-size:9pt;color:#374151;margin-top:2px;line-height:1.4; }
  .section { margin-top:20px;page-break-inside:avoid; }
  .section-title { font-size:9pt;font-weight:700;color:#c4860a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e5e7eb; }
  .section-body { font-size:10pt;color:#374151;line-height:1.6;white-space:pre-wrap; }
  .linked-docs { display:flex;gap:20px;margin-top:16px; }
  .linked-doc { background:#f9fafb;border:1px solid #e5e7eb;padding:8px 14px;border-radius:6px;font-size:9pt; }
  .linked-doc-label { font-size:7.5pt;color:#6b7280;text-transform:uppercase;font-weight:700; }
  .linked-doc-ref { font-family:'Courier New',monospace;font-weight:700;color:#1a2744; }
  .sign-box { margin-top:36px;border:2px dashed #e5e7eb;border-radius:8px;padding:24px; }
  .sign-box-title { font-size:10pt;font-weight:700;color:#1a2744;margin-bottom:16px; }
  .sign-row { display:flex;gap:40px;margin-top:12px; }
  .sign-field { flex:1; }
  .sign-label { font-size:8pt;color:#6b7280;margin-bottom:4px; }
  .sign-line { height:40px;border-bottom:1px solid #374151; }
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
      <div class="doc-type">PROJECT SIGN-OFF</div>
      <div class="doc-ref">${signOff.ref}</div>
      <div class="doc-date">${fmtDate(signOff.createdAt)}</div>
    </div>
  </div>

  ${signOff.completionDate ? `
  <div class="completion-box">
    <div class="completion-label">Date of Practical Completion</div>
    <div class="completion-date">${fmtDate(signOff.completionDate)}</div>
  </div>` : ""}

  <div class="parties">
    <div class="party">
      <div class="party-label">Client</div>
      <div class="party-name">${signOff.client.fullName}</div>
      ${signOff.client.companyName ? `<div class="party-sub">${signOff.client.companyName}</div>` : ""}
      <div class="party-sub">${signOff.client.address.replace(/\n/g, "<br>")}</div>
    </div>
    <div class="party">
      <div class="party-label">Contractor</div>
      <div class="party-name">${companyName}</div>
      <div class="party-sub">${legalName}</div>
      <div class="party-sub">Company Reg: ${companyReg}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Works Address</div>
    <div class="section-body">${signOff.address.replace(/\n/g, "\n")}</div>
  </div>

  ${signOff.summary ? `
  <div class="section">
    <div class="section-title">Summary of Works Completed</div>
    <div class="section-body">${signOff.summary}</div>
  </div>` : ""}

  ${signOff.notes ? `
  <div class="section">
    <div class="section-title">Notes &amp; Observations</div>
    <div class="section-body">${signOff.notes}</div>
  </div>` : ""}

  ${(signOff.relatedQuote || signOff.relatedInvoice) ? `
  <div class="section">
    <div class="section-title">Linked Documents</div>
    <div class="linked-docs">
      ${signOff.relatedQuote ? `<div class="linked-doc"><div class="linked-doc-label">Quote</div><div class="linked-doc-ref">${signOff.relatedQuote.ref}</div></div>` : ""}
      ${signOff.relatedInvoice ? `<div class="linked-doc"><div class="linked-doc-label">Invoice</div><div class="linked-doc-ref">${signOff.relatedInvoice.ref}</div></div>` : ""}
    </div>
  </div>` : ""}

  <!-- Sign-off box -->
  <div class="sign-box">
    <div class="sign-box-title">Completion Acknowledgement</div>
    <p style="font-size:9.5pt;color:#374151;line-height:1.6">We confirm that the above works have been completed to our satisfaction in accordance with the agreed specification.</p>
    <div class="sign-row">
      <div class="sign-field">
        <div class="sign-label">Client Signature</div>
        <div class="sign-line"></div>
        <div style="font-size:8pt;color:#6b7280;margin-top:4px">${signOff.client.fullName}</div>
      </div>
      <div class="sign-field">
        <div class="sign-label">Date</div>
        <div class="sign-line"></div>
      </div>
      <div class="sign-field">
        <div class="sign-label">Contractor Representative</div>
        <div class="sign-line"></div>
        <div style="font-size:8pt;color:#6b7280;margin-top:4px">${companyName}</div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <div>${legalName} · Reg. ${companyReg}</div>
    <div>Sign-Off Ref: ${signOff.ref}</div>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
