import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Mail, Phone, FileText, Receipt } from "lucide-react";
import { ClientsTable } from "./clients-table";

async function getClients() {
  return prisma.client.findMany({
    orderBy: { fullName: "asc" },
    include: {
      _count: { select: { quotes: true, invoices: true, signOffs: true } },
    },
  });
}

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <PageHeader title="Client Directory" description={`${clients.length} client${clients.length !== 1 ? "s" : ""} on file`}>
        <Button asChild className="bg-navy-900 hover:bg-navy-800">
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Link>
        </Button>
      </PageHeader>

      <ClientsTable clients={clients} />
    </div>
  );
}
