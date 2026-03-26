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
import { formatCurrency, formatDate } from "@/lib/utils";

interface Invoice {
  id: string;
  ref: string;
  date: Date;
  address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  total: any;
  hasImages: boolean;
  client: { id: string; fullName: string; companyName?: string | null };
  sourceQuote?: { id: string; ref: string } | null;
}

export function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const filtered = invoices.filter((inv) => {
    const s = search.toLowerCase();
    return (
      inv.ref.toLowerCase().includes(s) ||
      inv.client.fullName.toLowerCase().includes(s) ||
      inv.address.toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id: string, ref: string) => {
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Invoice deleted", description: `${ref} deleted.` });
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." className="pl-9" />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {search ? `No invoices found for "${search}"` : 'No invoices yet. Generate one from a saved quote or click "New Invoice".'}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-navy-900">Reference</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900">Client</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900 hidden md:table-cell">Address</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900 hidden sm:table-cell">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900 hidden lg:table-cell">Source Quote</th>
              <th className="text-right px-4 py-3 font-semibold text-navy-900">Total</th>
              <th className="text-right px-4 py-3 font-semibold text-navy-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/invoices/${inv.id}`} className="flex items-center gap-1.5 group">
                    <span className="font-mono text-xs font-bold text-navy-900 group-hover:text-amber-600 transition-colors">{inv.ref}</span>
                    <CameraIconIndicator hasImages={inv.hasImages} />
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy-900 text-xs">{inv.client.fullName}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{inv.address}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <p className="text-xs text-muted-foreground">{formatDate(inv.date)}</p>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {inv.sourceQuote ? (
                    <Link href={`/quotes/${inv.sourceQuote.id}`} className="text-xs text-amber-600 hover:underline font-mono">
                      {inv.sourceQuote.ref}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="text-xs font-bold text-navy-900">{formatCurrency(Number(inv.total))}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="sm" asChild title="Edit"><Link href={`/invoices/${inv.id}`}><Edit className="h-3.5 w-3.5" /></Link></Button>
                    <Button variant="ghost" size="sm" asChild title="PDF"><Link href={`/invoices/${inv.id}/pdf`} target="_blank"><Download className="h-3.5 w-3.5" /></Link></Button>
                    <ConfirmDeleteDialog
                      title={`Delete invoice ${inv.ref}?`}
                      description="This will permanently delete this invoice."
                      onConfirm={() => handleDelete(inv.id, inv.ref)}
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
