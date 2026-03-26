import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const visualSchema = z.object({
  type: z.enum(["inspiration_board", "visualisation"]),
  title: z.string().optional(),
  prompt: z.string().optional(),
  imageUrl: z.string().min(1, "Image URL is required"),
  address: z.string().optional(),
  clientId: z.string().optional(),
  quoteId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "";
  const clientId = searchParams.get("clientId") || "";

  const visuals = await prisma.savedVisual.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(clientId ? { clientId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true } },
      quote: { select: { id: true, ref: true } },
    },
  });

  return NextResponse.json(visuals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = visualSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  // Persist visual record immediately — this resolves the "visual appeared to save but didn't" bug
  const visual = await prisma.savedVisual.create({
    data: {
      type: data.type,
      title: data.title || null,
      prompt: data.prompt || null,
      imageUrl: data.imageUrl,
      address: data.address || null,
      clientId: data.clientId || null,
      quoteId: data.quoteId || null,
    },
    include: {
      client: { select: { id: true, fullName: true } },
      quote: { select: { id: true, ref: true } },
    },
  });

  return NextResponse.json(visual, { status: 201 });
}
