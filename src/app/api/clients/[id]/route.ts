import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const clientSchema = z.object({
  fullName: z.string().min(1),
  companyName: z.string().optional(),
  address: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      quotes: { orderBy: { createdAt: "desc" }, take: 20 },
      invoices: { orderBy: { createdAt: "desc" }, take: 20 },
      signOffs: { orderBy: { createdAt: "desc" }, take: 20 },
      visuals: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { quotes: true, invoices: true, signOffs: true, visuals: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      fullName: data.fullName,
      companyName: data.companyName || null,
      address: data.address,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(client);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
