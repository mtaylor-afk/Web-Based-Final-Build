import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { VisualGenerator } from "../visual-generator";

interface Props {
  searchParams: { clientId?: string; quoteId?: string };
}

export default async function NewVisualPage({ searchParams }: Props) {
  const [clients, quotes] = await Promise.all([
    prisma.client.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
    prisma.quote.findMany({ select: { id: true, ref: true }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Generate Visual" description="Create an AI-generated inspiration board or project visualisation" />
      <VisualGenerator
        clients={clients}
        quotes={quotes}
        preselectedClientId={searchParams.clientId}
        preselectedQuoteId={searchParams.quoteId}
      />
    </div>
  );
}
