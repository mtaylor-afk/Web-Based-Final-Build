"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CameraIconIndicator } from "@/components/shared/camera-icon-indicator";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Edit,
  FileText,
  Copy,
  Receipt,
  Download,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Quote {
  id: string;
  ref: string;
  date: Date;
  address: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  total: any;
  hasImages: boolean;
  client: { id: string; fullName: string; companyName?: string | null };
}

export function QuotesTable({ quotes }: { quotes: Quote[] }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const filtered = quotes.filter((q) => {
    const s = search.toLowerCase();
    return (
      q.ref.toLowerCase().includes(s) ||
      q.client.fullName.toLowerCase().includes(s) ||
      q.address.toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id: string, ref: string) => {
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Quote deleted", description: `${ref} has been deleted.` });
      router.refresh();
    } else {
      toast({ title: "Error", description: "Failed to delete quote.", variant: "destructive" });
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`/api/quotes/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const dupe = await res.json();
      toast({ title: "Quote duplicated", description: `New quote ${dupe.ref} created.` });
      router.refresh();
      router.push(`/quotes/${dupe.id}`);
    } else {
      toast({ title: "Error", description: "Failed to duplicate quote.", variant: "destructive" });
    }
  };

  const handleGenerateInvoice = async (id: string, ref: string) => {
    const res = await fetch(`/api/quotes/${id}/generate-invoice`, { method: "POST" });
    if (res.ok) {
      const invoice = await res.json();
      toast({
        title: "Invoice created",
        description: `Invoice ${invoice.ref} generated from quote ${ref}. Original quote unchanged.`,
      });
      router.push(`/invoices/${invoice.id}`);
    } else {
      toast({ title: "Error", description: "Failed to generate invoice.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quotes by reference, client or address..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {search ? `No quotes found for "${search}"` : "No quotes yet. Create your first quote!"}
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
              <th className="text-right px-4 py-3 font-semibold text-navy-900">Total</th>
              <th className="text-center px-4 py-3 font-semibold text-navy-900 hidden sm:table-cell">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-navy-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((quote) => (
              <tr key={quote.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/quotes/${quote.id}`} className="flex items-center gap-1.5 group">
                    <span className="font-mono text-xs font-bold text-navy-900 group-hover:text-amber-600 transition-colors">
                      {quote.ref}
                    </span>
                    <CameraIconIndicator hasImages={quote.hasImages} />
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy-900 text-xs">{quote.client.fullName}</p>
                  {quote.client.companyName && (
                    <p className="text-[10px] text-muted-foreground">{quote.client.companyName}</p>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{quote.address}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <p className="text-xs text-muted-foreground">{formatDate(quote.date)}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="text-xs font-bold text-navy-900">{formatCurrency(Number(quote.total))}</p>
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <Badge variant={quote.status as never} className="text-[10px]">{quote.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="sm" asChild title="Edit">
                      <Link href={`/quotes/${quote.id}`}><Edit className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild title="Export PDF">
                      <Link href={`/quotes/${quote.id}/pdf`} target="_blank"><Download className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Duplicate"
                      onClick={() => handleDuplicate(quote.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Generate Invoice from this quote"
                      className="text-amber-600 hover:text-amber-700"
                      onClick={() => handleGenerateInvoice(quote.id, quote.ref)}
                    >
                      <Receipt className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDeleteDialog
                      title={`Delete quote ${quote.ref}?`}
                      description="This will permanently delete this quote and all its line items."
                      onConfirm={() => handleDelete(quote.id, quote.ref)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          <Receipt className="h-3 w-3 inline mr-1 text-amber-600" />
          Click the invoice icon on any quote to generate an invoice. Original quote will remain unchanged.
        </p>
      )}
    </div>
  );
}
