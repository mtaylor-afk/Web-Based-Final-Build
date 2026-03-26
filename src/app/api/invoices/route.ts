import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextRef } from "@/lib/refs";
import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().default(1),
  unit: z.string().optional(),
  unitPrice: z.number().default(0),
  total: z.number().default(0),
  sortOrder: z.number().optional().default(0),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1),
  date: z.string(),
  address: z.string().min(1),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  subtotal: z.number().default(0),
  total: z.number().default(0),
  sourceQuoteId: z.string().optional(),
  lineItems: z.array(lineItemSchema).default([]),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const clientId = searchParams.get("clientId") || "";

  const invoices = await prisma.invoice.findMany({
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
      sourceQuote: { select: { id: true, ref: true } },
      _count: { select: { attachments: true } },
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = invoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const ref = await getNextRef("invoice");

  const invoice = await prisma.invoice.create({
    data: {
      ref,
      clientId: data.clientId,
      date: new Date(data.date),
      address: data.address,
      notes: data.notes || null,
      paymentTerms: data.paymentTerms || null,
      subtotal: data.subtotal,
      total: data.total,
      sourceQuoteId: data.sourceQuoteId || null,
      lineItems: {
        create: data.lineItems.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || null,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
    include: { client: true, lineItems: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(invoice, { status: 201 });
}
