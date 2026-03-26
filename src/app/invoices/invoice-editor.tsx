"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClientAutocomplete } from "@/components/shared/client-autocomplete";
import { ClientForm } from "@/components/forms/client-form";
import { LineItemsTable, type LineItem } from "@/components/forms/line-items-table";
import { AttachmentUploader } from "@/components/shared/attachment-uploader";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Download, Plus, X, User, Receipt } from "lucide-react";
import { formatCurrency, formatDateInput } from "@/lib/utils";

interface Client {
  id: string;
  fullName: string;
  companyName?: string | null;
  address: string;
  email?: string | null;
  phone?: string | null;
}

interface InvoiceEditorProps {
  initialInvoice?: {
    id: string;
    ref: string;
    date: Date;
    address: string;
    notes?: string | null;
    paymentTerms?: string | null;
    subtotal: number | string;
    total: number | string;
    client: Client;
    lineItems: LineItem[];
    attachments: { id: string; fileName: string; mimeType: string; fileUrl: string }[];
    sourceQuote?: { id: string; ref: string } | null;
  };
  defaultPaymentTerms?: string;
  preselectedClient?: Client | null;
}

export function InvoiceEditor({ initialInvoice, defaultPaymentTerms = "", preselectedClient }: InvoiceEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initialInvoice;

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    initialInvoice?.client || preselectedClient || null
  );
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState(initialInvoice?.id || "");

  const [form, setForm] = useState({
    date: initialInvoice ? formatDateInput(initialInvoice.date) : formatDateInput(new Date()),
    address: initialInvoice?.address || preselectedClient?.address || "",
    notes: initialInvoice?.notes || "",
    paymentTerms: initialInvoice?.paymentTerms || defaultPaymentTerms,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(initialInvoice?.lineItems || []);
  const [saving, setSaving] = useState(false);

  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.total), 0);
  const total = subtotal;

  const handleSave = async () => {
    if (!selectedClient) {
      toast({ title: "No client selected", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clientId: selectedClient.id,
        date: form.date,
        address: form.address,
        notes: form.notes,
        paymentTerms: form.paymentTerms,
        subtotal,
        total,
        lineItems: lineItems.map((item, idx) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          sortOrder: idx,
        })),
      };

      const url = isEdit ? `/api/invoices/${initialInvoice!.id}` : "/api/invoices";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save invoice");

      const saved = await res.json();
      setSavedInvoiceId(saved.id);

      toast({ title: isEdit ? "Invoice updated" : "Invoice saved", description: `${saved.ref} saved successfully.` });

      if (!isEdit) {
        router.push(`/invoices/${saved.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save invoice", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {initialInvoice?.sourceQuote && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <Receipt className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-800">
            Generated from quote{" "}
            <Link href={`/quotes/${initialInvoice.sourceQuote.id}`} className="font-mono font-bold hover:underline">
              {initialInvoice.sourceQuote.ref}
            </Link>
            . Edit freely — the original quote is unchanged.
          </p>
        </div>
      )}

      {/* Client */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showNewClientForm ? (
            <>
              <ClientAutocomplete value={selectedClient} onChange={setSelectedClient} onCreateNew={() => setShowNewClientForm(true)} />
              {!selectedClient && (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewClientForm(true)} className="text-amber-600 border-amber-300">
                  <Plus className="h-3.5 w-3.5 mr-1" />Create new client
                </Button>
              )}
            </>
          ) : (
            <div className="rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">New Client</p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewClientForm(false)}><X className="h-4 w-4" /></Button>
              </div>
              <ClientForm mode="inline" onSuccess={(client) => { setSelectedClient(client as Client); setShowNewClientForm(false); }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Invoice Date</Label>
              <Input type="date" {...field("date")} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Works Address <span className="text-destructive">*</span></Label>
            <Textarea {...field("address")} className="mt-1" rows={2} placeholder="Full address of the works location" />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent>
          <LineItemsTable items={lineItems} onChange={setLineItems} />
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-8 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold w-32 text-right">{formatCurrency(subtotal)}</span>
            </div>
            <Separator className="w-48" />
            <div className="flex gap-8 text-base">
              <span className="font-bold text-navy-900">Total</span>
              <span className="font-bold text-navy-900 w-32 text-right">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Payment Terms */}
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base">Notes & Payment Terms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Notes</Label>
            <Textarea {...field("notes")} className="mt-1" rows={3} placeholder="Additional notes for this invoice..." />
          </div>
          <div>
            <Label>Payment Terms</Label>
            <Textarea {...field("paymentTerms")} className="mt-1" rows={3} placeholder="Payment terms and instructions..." />
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {savedInvoiceId && (
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base">Image Attachments</CardTitle></CardHeader>
          <CardContent>
            <AttachmentUploader parentType="invoice" parentId={savedInvoiceId} initialAttachments={initialInvoice?.attachments} />
          </CardContent>
        </Card>
      )}
      {!savedInvoiceId && <p className="text-xs text-muted-foreground italic text-center">Save the invoice first to attach images.</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-6">
        <Button onClick={handleSave} disabled={saving} className="bg-navy-900 hover:bg-navy-800">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Saving..." : isEdit ? "Update Invoice" : "Save Invoice"}
        </Button>
        {savedInvoiceId && (
          <Button variant="outline" asChild>
            <Link href={`/invoices/${savedInvoiceId}/pdf`} target="_blank">
              <Download className="h-4 w-4 mr-2" />Export PDF
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/invoices")}>Back to Invoices</Button>
      </div>
    </div>
  );
}
