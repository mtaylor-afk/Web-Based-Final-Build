"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Eye, FileText, Receipt } from "lucide-react";

interface Client {
  id: string;
  fullName: string;
  companyName?: string | null;
  address: string;
  email?: string | null;
  phone?: string | null;
  createdAt: Date;
  _count: { quotes: number; invoices: number; signOffs: number };
}

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      (c.companyName?.toLowerCase().includes(q) ?? false) ||
      c.address.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.includes(q) ?? false)
    );
  });

  const handleDelete = async (id: string, name: string) => {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Client deleted", description: `${name} has been removed.` });
      router.refresh();
    } else {
      toast({ title: "Error", description: "Failed to delete client.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients by name, company, email or phone..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {search ? `No clients found for "${search}"` : "No clients yet. Add your first client!"}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-navy-900">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900 hidden md:table-cell">Address</th>
              <th className="text-left px-4 py-3 font-semibold text-navy-900 hidden lg:table-cell">Contact</th>
              <th className="text-center px-4 py-3 font-semibold text-navy-900 hidden sm:table-cell">Docs</th>
              <th className="text-right px-4 py-3 font-semibold text-navy-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((client) => (
              <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-navy-900">{client.fullName}</p>
                    {client.companyName && (
                      <p className="text-xs text-muted-foreground">{client.companyName}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-muted-foreground text-xs max-w-[200px] truncate">{client.address}</p>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="space-y-0.5">
                    {client.email && <p className="text-xs text-muted-foreground truncate">{client.email}</p>}
                    {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    {client._count.quotes > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0.5">
                        <FileText className="h-2.5 w-2.5" />
                        {client._count.quotes}Q
                      </Badge>
                    )}
                    {client._count.invoices > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0.5">
                        <Receipt className="h-2.5 w-2.5" />
                        {client._count.invoices}I
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/clients/${client.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/clients/${client.id}/edit`}>
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <ConfirmDeleteDialog
                      title="Delete client?"
                      description={`Are you sure you want to delete ${client.fullName}? All associated quotes and invoices will also be deleted.`}
                      onConfirm={() => handleDelete(client.id, client.fullName)}
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
