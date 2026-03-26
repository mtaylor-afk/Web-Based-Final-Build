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

const quoteSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  date: z.string(),
  title: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  status: z.string().default("draft"),
  notes: z.string().optional(),
  exclusions: z.string().optional(),
  assumptions: z.string().optional(),
  terms: z.string().optional(),
  subtotal: z.number().default(0),
  total: z.number().default(0),
  lineItems: z.array(lineItemSchema).default([]),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const clientId = searchParams.get("clientId") || "";

  const quotes = await prisma.quote.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(search
        ? {
            OR: [
              { ref: { contains: search } },
              { address: { contains: search } },
              { client: { fullName: { contains: search } } },
              { client: { companyName: { contains: search } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      _count: { select: { attachments: true, lineItems: true } },
    },
  });

  return NextResponse.json(quotes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const ref = await getNextRef("quote");

  const quote = await prisma.quote.create({
    data: {
      ref,
      clientId: data.clientId,
      date: new Date(data.date),
      title: data.title || null,
      address: data.address,
      status: data.status,
      notes: data.notes || null,
      exclusions: data.exclusions || null,
      assumptions: data.assumptions || null,
      terms: data.terms || null,
      subtotal: data.subtotal,
      total: data.total,
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
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(quote, { status: 201 });
}
