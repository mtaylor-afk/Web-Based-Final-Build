import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteEditor } from "../quote-editor";

interface NewQuotePageProps {
  searchParams: { clientId?: string };
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
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
      <PageHeader title="New Quote" description="Create a quote for a client" />
      <QuoteEditor
        defaultTerms={settings?.defaultTerms || ""}
        preselectedClient={preselectedClient}
      />
    </div>
  );
}
