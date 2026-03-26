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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const rate = await prisma.ratesLibrary.findUnique({ where: { id: params.id } });
  if (!rate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rate);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = rateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const rate = await prisma.ratesLibrary.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(rate);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.ratesLibrary.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
