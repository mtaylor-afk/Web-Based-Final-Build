"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Visual {
  id: string;
  type: string;
  title?: string | null;
  prompt?: string | null;
  imageUrl: string;
  address?: string | null;
  createdAt: Date;
  client?: { id: string; fullName: string } | null;
  quote?: { id: string; ref: string } | null;
}

export function VisualsGallery({ visuals }: { visuals: Visual[] }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const router = useRouter();
  const { toast } = useToast();

  const filtered = visuals.filter((v) => typeFilter === "all" || v.type === typeFilter);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/visuals/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Visual deleted" });
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["all", "inspiration_board", "visualisation"].map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(t)}
            className={typeFilter === t ? "bg-navy-900" : ""}
          >
            {t === "all" ? "All" : t === "inspiration_board" ? "Inspiration Boards" : "Visualisations"}
          </Button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No visuals yet. Click &quot;Generate Visual&quot; to create your first one.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((visual) => (
          <div key={visual.id} className="group rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative aspect-video overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visual.imageUrl}
                alt={visual.title || visual.type}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-visual.svg";
                }}
              />
              <div className="absolute top-2 left-2">
                <Badge className={visual.type === "inspiration_board" ? "bg-amber-500 text-white text-[10px]" : "bg-navy-700 text-white text-[10px]"}>
                  {visual.type === "inspiration_board" ? "Inspiration" : "Visualisation"}
                </Badge>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              <p className="font-semibold text-sm text-navy-900 truncate">{visual.title || "Untitled Visual"}</p>
              {visual.client && (
                <p className="text-xs text-muted-foreground truncate">
                  <Link href={`/clients/${visual.client.id}`} className="hover:underline">{visual.client.fullName}</Link>
                </p>
              )}
              {visual.prompt && (
                <p className="text-[10px] text-muted-foreground line-clamp-2 italic">"{visual.prompt}"</p>
              )}
              <p className="text-[10px] text-muted-foreground">{formatDate(visual.createdAt)}</p>
              <div className="flex justify-between items-center pt-1">
                <Button variant="ghost" size="sm" asChild className="text-xs">
                  <Link href={`/visuals/${visual.id}`}>
                    <Eye className="h-3.5 w-3.5 mr-1" />View
                  </Link>
                </Button>
                <ConfirmDeleteDialog
                  title="Delete visual?"
                  description="This will permanently delete this visual."
                  onConfirm={() => handleDelete(visual.id)}
                >
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </ConfirmDeleteDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
