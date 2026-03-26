import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextRef } from "@/lib/refs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const source = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });

  if (!source) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const ref = await getNextRef("quote");

  const duplicate = await prisma.quote.create({
    data: {
      ref,
      clientId: source.clientId,
      date: new Date(),
      title: source.title ? `Copy of ${source.title}` : null,
      address: source.address,
      status: "draft",
      notes: source.notes,
      exclusions: source.exclusions,
      assumptions: source.assumptions,
      terms: source.terms,
      subtotal: source.subtotal,
      total: source.total,
      lineItems: {
        create: source.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
