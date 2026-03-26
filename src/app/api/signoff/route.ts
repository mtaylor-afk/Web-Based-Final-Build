import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextRef } from "@/lib/refs";
import { z } from "zod";

const signOffSchema = z.object({
  clientId: z.string().min(1),
  address: z.string().min(1),
  summary: z.string().optional(),
  notes: z.string().optional(),
  completionDate: z.string().optional(),
  relatedQuoteId: z.string().optional(),
  relatedInvoiceId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const clientId = searchParams.get("clientId") || "";

  const signOffs = await prisma.projectSignOff.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(search
        ? {
            OR: [
              { ref: { contains: search } },
              { address: { contains: search } },
              { client: { fullName: { contains: search } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      relatedQuote: { select: { id: true, ref: true } },
      relatedInvoice: { select: { id: true, ref: true } },
      _count: { select: { attachments: true } },
    },
  });

  return NextResponse.json(signOffs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = signOffSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const ref = await getNextRef("signoff");

  const signOff = await prisma.projectSignOff.create({
    data: {
      ref,
      clientId: data.clientId,
      address: data.address,
      summary: data.summary || null,
      notes: data.notes || null,
      completionDate: data.completionDate ? new Date(data.completionDate) : null,
      relatedQuoteId: data.relatedQuoteId || null,
      relatedInvoiceId: data.relatedInvoiceId || null,
    },
    include: { client: true },
  });

  return NextResponse.json(signOff, { status: 201 });
}
