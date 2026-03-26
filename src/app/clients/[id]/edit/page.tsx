import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/forms/client-form";

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });

  if (!client) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Edit Client" description={client.fullName} />
      <Card>
        <CardContent className="pt-6">
          <ClientForm
            initialData={{
              id: client.id,
              fullName: client.fullName,
              companyName: client.companyName || undefined,
              address: client.address,
              email: client.email || undefined,
              phone: client.phone || undefined,
              notes: client.notes || undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
