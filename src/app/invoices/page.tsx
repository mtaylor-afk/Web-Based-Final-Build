import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InvoicesTable } from "./invoices-table";

async function getInvoices() {
  return prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true, companyName: true } },
      sourceQuote: { select: { id: true, ref: true } },
    },
  });
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} total`}>
        <Button asChild className="bg-navy-900 hover:bg-navy-800">
          <Link href="/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </Button>
      </PageHeader>
      <InvoicesTable invoices={invoices} />
    </div>
  );
}
