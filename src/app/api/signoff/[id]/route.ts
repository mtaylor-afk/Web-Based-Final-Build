import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const signOffUpdateSchema = z.object({
  clientId: z.string().optional(),
  address: z.string().optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
  completionDate: z.string().optional(),
  relatedQuoteId: z.string().optional(),
  relatedInvoiceId: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const signOff = await prisma.projectSignOff.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      relatedQuote: { select: { id: true, ref: true } },
      relatedInvoice: { select: { id: true, ref: true } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!signOff) {
    return NextResponse.json({ error: "Sign-off not found" }, { status: 404 });
  }

  return NextResponse.json(signOff);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = signOffUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const data = parsed.data;

  const signOff = await prisma.projectSignOff.update({
    where: { id: params.id },
    data: {
      ...(data.clientId ? { clientId: data.clientId } : {}),
      ...(data.address ? { address: data.address } : {}),
      ...(data.summary !== undefined ? { summary: data.summary || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.completionDate !== undefined ? { completionDate: data.completionDate ? new Date(data.completionDate) : null } : {}),
      ...(data.relatedQuoteId !== undefined ? { relatedQuoteId: data.relatedQuoteId || null } : {}),
      ...(data.relatedInvoiceId !== undefined ? { relatedInvoiceId: data.relatedInvoiceId || null } : {}),
    },
    include: {
      client: true,
      relatedQuote: { select: { id: true, ref: true } },
      relatedInvoice: { select: { id: true, ref: true } },
      attachments: true,
    },
  });

  return NextResponse.json(signOff);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.projectSignOff.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
