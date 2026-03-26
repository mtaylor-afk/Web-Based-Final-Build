import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextRef } from "@/lib/refs";

/**
 * Generate an invoice from a quote.
 * - Creates a new invoice with the quote's line items copied across.
 * - The original quote is NOT modified.
 * - The invoice can be edited independently after creation.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      client: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const settings = await prisma.settings.findFirst();
  const ref = await getNextRef("invoice");

  const invoice = await prisma.invoice.create({
    data: {
      ref,
      clientId: quote.clientId,
      date: new Date(),
      address: quote.address,
      notes: quote.notes,
      paymentTerms: settings?.defaultPaymentTerms || null,
      subtotal: quote.subtotal,
      total: quote.total,
      sourceQuoteId: quote.id,
      lineItems: {
        create: quote.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: item.sortOrder,
        })),
      },
    },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
