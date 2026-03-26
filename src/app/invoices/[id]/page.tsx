import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceEditor } from "../invoice-editor";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        attachments: { orderBy: { createdAt: "asc" } },
        sourceQuote: { select: { id: true, ref: true } },
      },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Invoice ${invoice.ref}`} description={`${invoice.client.fullName} · ${invoice.address}`} />
      <InvoiceEditor
        initialInvoice={{
          id: invoice.id,
          ref: invoice.ref,
          date: invoice.date,
          address: invoice.address,
          notes: invoice.notes,
          paymentTerms: invoice.paymentTerms,
          subtotal: invoice.subtotal.toString(),
          total: invoice.total.toString(),
          client: invoice.client,
          lineItems: invoice.lineItems.map((li) => ({
            id: li.id,
            description: li.description,
            quantity: Number(li.quantity),
            unit: li.unit || "",
            unitPrice: Number(li.unitPrice),
            total: Number(li.total),
            sortOrder: li.sortOrder,
          })),
          attachments: invoice.attachments,
          sourceQuote: invoice.sourceQuote,
        }}
        defaultPaymentTerms={settings?.defaultPaymentTerms || ""}
      />
    </div>
  );
}
