import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rateSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  defaultUnit: z.string().optional(),
  defaultCost: z.number().default(0),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const rates = await prisma.ratesLibrary.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { category: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(rates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = rateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const rate = await prisma.ratesLibrary.create({ data: parsed.data });
  return NextResponse.json(rate, { status: 201 });
}
