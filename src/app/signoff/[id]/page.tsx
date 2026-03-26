import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { SignOffEditor } from "../signoff-editor";

export default async function SignOffDetailPage({ params }: { params: { id: string } }) {
  const [signOff, quotes, invoices] = await Promise.all([
    prisma.projectSignOff.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        relatedQuote: { select: { id: true, ref: true } },
        relatedInvoice: { select: { id: true, ref: true } },
        attachments: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.quote.findMany({ select: { id: true, ref: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.invoice.findMany({ select: { id: true, ref: true }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  if (!signOff) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Sign-Off ${signOff.ref}`} description={`${signOff.client.fullName} · ${signOff.address}`} />
      <SignOffEditor
        initialSignOff={{
          id: signOff.id,
          ref: signOff.ref,
          address: signOff.address,
          summary: signOff.summary,
          notes: signOff.notes,
          completionDate: signOff.completionDate,
          client: signOff.client,
          relatedQuote: signOff.relatedQuote,
          relatedInvoice: signOff.relatedInvoice,
          attachments: signOff.attachments,
        }}
        availableQuotes={quotes}
        availableInvoices={invoices}
      />
    </div>
  );
}
