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

const invoiceUpdateSchema = z.object({
  clientId: z.string().optional(),
  date: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
      sourceQuote: { select: { id: true, ref: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = invoiceUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const invoice = await prisma.$transaction(async (tx) => {
    if (data.lineItems !== undefined) {
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: params.id } });
    }

    return tx.invoice.update({
      where: { id: params.id },
      data: {
        ...(data.clientId ? { clientId: data.clientId } : {}),
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.address ? { address: data.address } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.paymentTerms !== undefined ? { paymentTerms: data.paymentTerms || null } : {}),
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
      include: { client: true, lineItems: { orderBy: { sortOrder: "asc" } }, attachments: true },
    });
  });

  return NextResponse.json(invoice);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.invoice.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
