import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { VisualsGallery } from "./visuals-gallery";
import { Plus } from "lucide-react";

async function getVisuals() {
  return prisma.savedVisual.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true } },
      quote: { select: { id: true, ref: true } },
    },
  });
}

export default async function VisualsPage() {
  const visuals = await getVisuals();

  return (
    <div className="space-y-6">
      <PageHeader title="Visuals" description="Inspiration boards and project visualisations">
        <Button asChild className="bg-navy-900 hover:bg-navy-800">
          <Link href="/visuals/new">
            <Plus className="h-4 w-4 mr-2" />
            Generate Visual
          </Link>
        </Button>
      </PageHeader>
      <VisualsGallery visuals={visuals} />
    </div>
  );
}
