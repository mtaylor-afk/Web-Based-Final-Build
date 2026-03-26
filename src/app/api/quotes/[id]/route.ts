import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  quantity: z.number().default(1),
  unit: z.string().optional(),
  unitPrice: z.number().default(0),
  total: z.number().default(0),
  sortOrder: z.number().optional().default(0),
});

const quoteUpdateSchema = z.object({
  clientId: z.string().optional(),
  date: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  exclusions: z.string().optional(),
  assumptions: z.string().optional(),
  terms: z.string().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
      invoices: { select: { id: true, ref: true } },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json(quote);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = quoteUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  // Replace line items atomically
  const quote = await prisma.$transaction(async (tx) => {
    if (data.lineItems !== undefined) {
      await tx.quoteLineItem.deleteMany({ where: { quoteId: params.id } });
    }

    return tx.quote.update({
      where: { id: params.id },
      data: {
        ...(data.clientId ? { clientId: data.clientId } : {}),
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.title !== undefined ? { title: data.title || null } : {}),
        ...(data.address ? { address: data.address } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.exclusions !== undefined ? { exclusions: data.exclusions || null } : {}),
        ...(data.assumptions !== undefined ? { assumptions: data.assumptions || null } : {}),
        ...(data.terms !== undefined ? { terms: data.terms || null } : {}),
        ...(data.subtotal !== undefined ? { subtotal: data.subtotal } : {}),
        ...(data.total !== undefined ? { total: data.total } : {}),
        ...(data.lineItems !== undefined
          ? {
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
            }
          : {}),
      },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        attachments: true,
      },
    });
  });

  return NextResponse.json(quote);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.quote.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
