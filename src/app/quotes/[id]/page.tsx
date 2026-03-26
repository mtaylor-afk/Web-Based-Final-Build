import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteEditor } from "../quote-editor";

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const [quote, settings] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        attachments: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Quote ${quote.ref}`} description={`${quote.client.fullName} · ${quote.address}`} />
      <QuoteEditor
        initialQuote={{
          id: quote.id,
          ref: quote.ref,
          date: quote.date,
          title: quote.title,
          address: quote.address,
          status: quote.status,
          notes: quote.notes,
          exclusions: quote.exclusions,
          assumptions: quote.assumptions,
          terms: quote.terms,
          subtotal: quote.subtotal.toString(),
          total: quote.total.toString(),
          client: quote.client,
          lineItems: quote.lineItems.map((li) => ({
            id: li.id,
            description: li.description,
            quantity: Number(li.quantity),
            unit: li.unit || "",
            unitPrice: Number(li.unitPrice),
            total: Number(li.total),
            sortOrder: li.sortOrder,
          })),
          attachments: quote.attachments,
        }}
        defaultTerms={settings?.defaultTerms || ""}
      />
    </div>
  );
}
