"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CameraIconIndicator } from "@/components/shared/camera-icon-indicator";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SignOff {
  id: string;
  ref: string;
  address: string;
  hasImages: boolean;
  completionDate?: Date | null;
  createdAt: Date;
  client: { id: string; fullName: string };
  relatedQuote?: { id: string; ref: string } | null;
  relatedInvoice?: { id: string; ref: string } | null;
}

export function SignOffTable({ signOffs }: { signOffs: SignOff[] }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const filtered = signOffs.filter((s) => {
    const q = search.toLowerCase();
    return s.ref.toLowerCase().includes(q) || s.client.fullName.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
  });

  const handleDelete = async (id: string, ref: string) => {
    const res = await fetch(`/api/signoff/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Sign-off deleted", description: `${ref} deleted.` });
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sign-offs..." className="pl-9" />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {search ? `No sign-offs found for "${search}"` : "No sign-off documents yet."}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-navy-900">Reference</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900">Client</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900 hidden md:table-cell">Address</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900 hidden sm:table-cell">Completion</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900 hidden lg:table-cell">Linked Docs</th>
              <th className="text-right px-4 py-3 font-semibold text-navy-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/signoff/${s.id}`} className="flex items-center gap-1.5 group">
                    <span className="font-mono text-xs font-bold text-navy-900 group-hover:text-amber-600">{s.ref}</span>
                    <CameraIconIndicator hasImages={s.hasImages} />
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs font-medium text-navy-900">{s.client.fullName}</td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground truncate max-w-[200px]">{s.address}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                  {s.completionDate ? formatDate(s.completionDate) : formatDate(s.createdAt)}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex gap-2 text-xs">
                    {s.relatedQuote && <Link href={`/quotes/${s.relatedQuote.id}`} className="font-mono text-amber-600 hover:underline">{s.relatedQuote.ref}</Link>}
                    {s.relatedInvoice && <Link href={`/invoices/${s.relatedInvoice.id}`} className="font-mono text-amber-600 hover:underline">{s.relatedInvoice.ref}</Link>}
                    {!s.relatedQuote && !s.relatedInvoice && <span className="text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="sm" asChild><Link href={`/signoff/${s.id}`}><Edit className="h-3.5 w-3.5" /></Link></Button>
                    <Button variant="ghost" size="sm" asChild><Link href={`/signoff/${s.id}/pdf`} target="_blank"><Download className="h-3.5 w-3.5" /></Link></Button>
                    <ConfirmDeleteDialog
                      title={`Delete sign-off ${s.ref}?`}
                      description="This will permanently delete this sign-off document."
                      onConfirm={() => handleDelete(s.id, s.ref)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
