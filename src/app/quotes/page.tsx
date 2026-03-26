import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuotesTable } from "./quotes-table";

async function getQuotes() {
  return prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true, companyName: true } },
    },
  });
}

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div className="space-y-6">
      <PageHeader title="Quotes" description={`${quotes.length} quote${quotes.length !== 1 ? "s" : ""} total`}>
        <Button asChild className="bg-navy-900 hover:bg-navy-800">
          <Link href="/quotes/new">
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Link>
        </Button>
      </PageHeader>
      <QuotesTable quotes={quotes} />
    </div>
  );
}
