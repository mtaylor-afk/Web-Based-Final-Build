import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SignOffTable } from "./signoff-table";

async function getSignOffs() {
  return prisma.projectSignOff.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true } },
      relatedQuote: { select: { id: true, ref: true } },
      relatedInvoice: { select: { id: true, ref: true } },
    },
  });
}

export default async function SignOffPage() {
  const signOffs = await getSignOffs();

  return (
    <div className="space-y-6">
      <PageHeader title="Project Sign-Offs" description={`${signOffs.length} sign-off document${signOffs.length !== 1 ? "s" : ""}`}>
        <Button asChild className="bg-navy-900 hover:bg-navy-800">
          <Link href="/signoff/new">
            <Plus className="h-4 w-4 mr-2" />
            New Sign-Off
          </Link>
        </Button>
      </PageHeader>
      <SignOffTable signOffs={signOffs} />
    </div>
  );
}
