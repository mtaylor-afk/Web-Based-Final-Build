import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const visual = await prisma.savedVisual.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, fullName: true } },
      quote: { select: { id: true, ref: true } },
    },
  });
  if (!visual) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(visual);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.savedVisual.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
