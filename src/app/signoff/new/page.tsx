import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { SignOffEditor } from "../signoff-editor";

interface Props {
  searchParams: { clientId?: string };
}

export default async function NewSignOffPage({ searchParams }: Props) {
  const [quotes, invoices, preselectedClient] = await Promise.all([
    prisma.quote.findMany({ select: { id: true, ref: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.invoice.findMany({ select: { id: true, ref: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    searchParams.clientId
      ? prisma.client.findUnique({
          where: { id: searchParams.clientId },
          select: { id: true, fullName: true, companyName: true, address: true, email: true, phone: true },
        })
      : null,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New Project Sign-Off" description="Create a completion sign-off document" />
      <SignOffEditor
        preselectedClient={preselectedClient}
        availableQuotes={quotes}
        availableInvoices={invoices}
      />
    </div>
  );
}
