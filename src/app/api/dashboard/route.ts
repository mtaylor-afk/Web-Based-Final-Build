import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [
    totalClients,
    totalQuotes,
    totalInvoices,
    totalSignOffs,
    recentQuotes,
    recentInvoices,
    recentClients,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.quote.count(),
    prisma.invoice.count(),
    prisma.projectSignOff.count(),
    prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { fullName: true } } },
    }),
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { fullName: true } } },
    }),
    prisma.client.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    stats: { totalClients, totalQuotes, totalInvoices, totalSignOffs },
    recentQuotes,
    recentInvoices,
    recentClients,
  });
}
