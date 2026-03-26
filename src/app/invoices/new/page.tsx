import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceEditor } from "../invoice-editor";

interface Props {
  searchParams: { clientId?: string };
}

export default async function NewInvoicePage({ searchParams }: Props) {
  const settings = await prisma.settings.findFirst();
  let preselectedClient = null;

  if (searchParams.clientId) {
    preselectedClient = await prisma.client.findUnique({
      where: { id: searchParams.clientId },
      select: { id: true, fullName: true, companyName: true, address: true, email: true, phone: true },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Invoice" description="Create a standalone invoice" />
      <InvoiceEditor defaultPaymentTerms={settings?.defaultPaymentTerms || ""} preselectedClient={preselectedClient} />
    </div>
  );
}
