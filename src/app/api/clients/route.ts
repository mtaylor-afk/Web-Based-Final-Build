import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const clientSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  companyName: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "100");

  const clients = await prisma.client.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search } },
            { companyName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { address: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { fullName: "asc" },
    take: limit,
    include: {
      _count: {
        select: { quotes: true, invoices: true, signOffs: true },
      },
    },
  });

  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Immediately persist the client record — single click, no second commit needed
  const client = await prisma.client.create({
    data: {
      fullName: data.fullName,
      companyName: data.companyName || null,
      address: data.address,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
