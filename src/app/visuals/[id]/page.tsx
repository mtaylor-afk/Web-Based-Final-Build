import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function VisualDetailPage({ params }: { params: { id: string } }) {
  const visual = await prisma.savedVisual.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, fullName: true } },
      quote: { select: { id: true, ref: true } },
    },
  });

  if (!visual) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={visual.title || "Saved Visual"}
        description={visual.type === "inspiration_board" ? "Inspiration Board" : "Visualisation"}
      >
        <Button variant="outline" asChild>
          <Link href="/visuals">
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Badge className={visual.type === "inspiration_board" ? "bg-amber-500 text-white" : "bg-navy-700 text-white"}>
            {visual.type === "inspiration_board" ? "Inspiration Board" : "Visualisation"}
          </Badge>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={visual.imageUrl}
            alt={visual.title || "Visual"}
            className="w-full rounded-lg border"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-visual.svg"; }}
          />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Saved</p>
              <p>{formatDate(visual.createdAt)}</p>
            </div>
            {visual.client && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Client</p>
                <Link href={`/clients/${visual.client.id}`} className="text-amber-600 hover:underline">
                  {visual.client.fullName}
                </Link>
              </div>
            )}
            {visual.quote && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Linked Quote</p>
                <Link href={`/quotes/${visual.quote.id}`} className="font-mono text-amber-600 hover:underline">
                  {visual.quote.ref}
                </Link>
              </div>
            )}
            {visual.address && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Address</p>
                <p>{visual.address}</p>
              </div>
            )}
          </div>

          {visual.prompt && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Prompt Used</p>
              <p className="text-sm italic text-muted-foreground">"{visual.prompt}"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
