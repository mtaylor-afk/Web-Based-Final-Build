// POST /api/seed  — initialises the database with default settings, ref counters
// and rates library. Safe to call multiple times (upsert-only, rates only seeded
// when the library is completely empty). Protected by SEED_SECRET env var.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-seed-secret");
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Settings singleton
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      companyDisplayName: "WV Construction",
      companyLegalName: "ACOR Building and Property Solutions Ltd",
      companyReg: "9287377",
      tradingAs: "WV Construction",
      defaultTerms:
        "Payment is due within 14 days of invoice date. We reserve the right to charge interest on late payments at 8% above the Bank of England base rate. All materials remain the property of WV Construction until payment is received in full.",
      defaultPaymentTerms:
        "30% deposit required before works commence. Further 40% on practical completion. Final 30% on completion and sign-off.",
    },
  });

  // Ref counters
  for (const id of ["quote", "invoice", "signoff"]) {
    await prisma.refCounter.upsert({
      where: { id },
      update: {},
      create: { id, current: 1000 },
    });
  }

  // Rates library — only seed when completely empty to avoid duplicates
  const existing = await prisma.ratesLibrary.count();
  if (existing === 0) {
    const rates = [
      { category: "Labour", name: "General Labourer (day rate)", defaultUnit: "day", defaultCost: 180 },
      { category: "Labour", name: "Skilled Tradesperson (day rate)", defaultUnit: "day", defaultCost: 280 },
      { category: "Labour", name: "Site Supervisor (day rate)", defaultUnit: "day", defaultCost: 320 },
      { category: "Plastering", name: "Skim coat ceiling (per m²)", defaultUnit: "m²", defaultCost: 12 },
      { category: "Plastering", name: "Skim coat walls (per m²)", defaultUnit: "m²", defaultCost: 10 },
      { category: "Plastering", name: "Dot and dab plasterboard (per m²)", defaultUnit: "m²", defaultCost: 25 },
      { category: "Decorating", name: "Emulsion paint walls (per m²)", defaultUnit: "m²", defaultCost: 6 },
      { category: "Decorating", name: "Gloss woodwork (per linear m)", defaultUnit: "lm", defaultCost: 8 },
      { category: "Decorating", name: "Full redecoration room", defaultUnit: "room", defaultCost: 650 },
      { category: "Flooring", name: "Laminate flooring supply & fit (per m²)", defaultUnit: "m²", defaultCost: 35 },
      { category: "Flooring", name: "Carpet supply & fit (per m²)", defaultUnit: "m²", defaultCost: 28 },
      { category: "Flooring", name: "Tile supply & fit (per m²)", defaultUnit: "m²", defaultCost: 55 },
      { category: "Joinery", name: "Fit internal door (supply & fit)", defaultUnit: "each", defaultCost: 280 },
      { category: "Joinery", name: "Skirting board (per linear m)", defaultUnit: "lm", defaultCost: 18 },
      { category: "Joinery", name: "Architrave set (per door)", defaultUnit: "each", defaultCost: 95 },
      { category: "Electrical", name: "Single socket outlet", defaultUnit: "each", defaultCost: 65 },
      { category: "Electrical", name: "Light fitting (standard)", defaultUnit: "each", defaultCost: 85 },
      { category: "Electrical", name: "Consumer unit replacement", defaultUnit: "each", defaultCost: 850 },
      { category: "Plumbing", name: "Radiator supply & fit", defaultUnit: "each", defaultCost: 320 },
      { category: "Plumbing", name: "Basin supply & fit", defaultUnit: "each", defaultCost: 280 },
      { category: "Plumbing", name: "Full bathroom installation", defaultUnit: "room", defaultCost: 3500 },
      { category: "Roofing", name: "Tile replacement (per tile)", defaultUnit: "each", defaultCost: 25 },
      { category: "Roofing", name: "Ridge tile repointing (per lm)", defaultUnit: "lm", defaultCost: 45 },
      { category: "Demolition", name: "Internal non-load-bearing wall removal", defaultUnit: "each", defaultCost: 750 },
      { category: "General", name: "Skip hire (small)", defaultUnit: "each", defaultCost: 220 },
      { category: "General", name: "Skip hire (large)", defaultUnit: "each", defaultCost: 380 },
      { category: "General", name: "Materials contingency (5%)", defaultUnit: "%", defaultCost: 5, notes: "Standard contingency for materials" },
    ];
    await prisma.ratesLibrary.createMany({ data: rates });
  }

  return NextResponse.json({ ok: true, message: "Database seeded successfully" });
}
