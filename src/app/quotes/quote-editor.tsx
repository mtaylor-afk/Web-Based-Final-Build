"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ClientAutocomplete } from "@/components/shared/client-autocomplete";
import { ClientForm } from "@/components/forms/client-form";
import { LineItemsTable, type LineItem } from "@/components/forms/line-items-table";
import { AttachmentUploader } from "@/components/shared/attachment-uploader";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Loader2,
  Download,
  Sparkles,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import Link from "next/link";

interface Client {
  id: string;
  fullName: string;
  companyName?: string | null;
  address: string;
  email?: string | null;
  phone?: string | null;
}

interface QuoteEditorProps {
  initialQuote?: {
    id: string;
    ref: string;
    date: Date;
    title?: string | null;
    address: string;
    status: string;
    notes?: string | null;
    exclusions?: string | null;
    assumptions?: string | null;
    terms?: string | null;
    subtotal: number | string;
    total: number | string;
    client: Client;
    lineItems: LineItem[];
    attachments: { id: string; fileName: string; mimeType: string; fileUrl: string }[];
  };
  defaultTerms?: string;
  preselectedClient?: Client | null;
}

const STATUS_OPTIONS = ["draft", "final", "sent", "approved", "cancelled"];

export function QuoteEditor({ initialQuote, defaultTerms = "", preselectedClient }: QuoteEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initialQuote;

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    initialQuote?.client || preselectedClient || null
  );
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState(initialQuote?.id || "");

  const [form, setForm] = useState({
    date: initialQuote ? formatDateInput(initialQuote.date) : formatDateInput(new Date()),
    title: initialQuote?.title || "",
    address: initialQuote?.address || preselectedClient?.address || "",
    status: initialQuote?.status || "draft",
    notes: initialQuote?.notes || "",
    exclusions: initialQuote?.exclusions || "",
    assumptions: initialQuote?.assumptions || "",
    terms: initialQuote?.terms || defaultTerms,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialQuote?.lineItems || []
  );

  const [saving, setSaving] = useState(false);
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [showExtras, setShowExtras] = useState(false);

  // Auto-fill address when client is selected
  useEffect(() => {
    if (selectedClient && !form.address) {
      setForm((f) => ({ ...f, address: selectedClient.address }));
    }
  }, [selectedClient]);

  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.total), 0);
  const total = subtotal;

  const handleSave = async () => {
    if (!selectedClient) {
      toast({ title: "No client selected", description: "Please select or create a client.", variant: "destructive" });
      return;
    }
    if (!form.address.trim()) {
      toast({ title: "Address required", description: "Please enter the works address.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clientId: selectedClient.id,
        date: form.date,
        title: form.title,
        address: form.address,
        status: form.status,
        notes: form.notes,
        exclusions: form.exclusions,
        assumptions: form.assumptions,
        terms: form.terms,
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

      const url = isEdit ? `/api/quotes/${initialQuote!.id}` : "/api/quotes";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save quote");

      const saved = await res.json();
      setSavedQuoteId(saved.id);

      toast({
        title: isEdit ? "Quote updated" : "Quote saved",
        description: `${saved.ref} has been saved successfully.`,
      });

      if (!isEdit) {
        router.push(`/quotes/${saved.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save quote", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAiAssist = async () => {
    if (!aiNotes.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/quote-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawNotes: aiNotes,
          clientContext: selectedClient ? `Client: ${selectedClient.fullName}, Address: ${selectedClient.address}` : undefined,
        }),
      });
      const data = await res.json();
      setAiResult(data.wording || data.error || "No result");
    } catch {
      setAiResult("AI service unavailable. Check your OPENAI_API_KEY.");
    } finally {
      setAiLoading(false);
    }
  };

  const insertAiResult = () => {
    if (!aiResult) return;
    // Add as a single line item
    setLineItems((prev) => [
      ...prev,
      {
        description: aiResult,
        quantity: 1,
        unit: "",
        unitPrice: 0,
        total: 0,
        sortOrder: prev.length,
      },
    ]);
    setAiNotes("");
    setAiResult("");
    toast({ title: "AI wording inserted", description: "Added as a new line item." });
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Client Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showNewClientForm ? (
            <>
              <ClientAutocomplete
                value={selectedClient}
                onChange={setSelectedClient}
                onCreateNew={() => setShowNewClientForm(true)}
              />
              {!selectedClient && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewClientForm(true)}
                  className="text-amber-600 border-amber-300"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create new client
                </Button>
              )}
            </>
          ) : (
            <div className="rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">New Client Details</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowNewClientForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ClientForm
                mode="inline"
                onSuccess={(client) => {
                  setSelectedClient(client as Client);
                  setShowNewClientForm(false);
                  if (!form.address) {
                    setForm((f) => ({ ...f, address: client.address }));
                  }
                  toast({ title: "Client saved", description: `${client.fullName} has been added.` });
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Quote Date</Label>
              <Input id="date" type="date" {...field("date")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title / Description (optional)</Label>
              <Input id="title" {...field("title")} className="mt-1" placeholder="e.g. Kitchen Extension" />
            </div>
          </div>

          <div>
            <Label htmlFor="address">
              Works Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="address"
              {...field("address")}
              className="mt-1"
              rows={2}
              placeholder="Full address of the works location"
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemsTable items={lineItems} onChange={setLineItems} />
        </CardContent>
      </Card>

      {/* Totals Summary */}
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

      {/* Notes, Exclusions etc */}
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            className="flex items-center gap-2 text-base font-semibold text-left"
            onClick={() => setShowExtras(!showExtras)}
          >
            Additional Sections
            {showExtras ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {showExtras && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...field("notes")} className="mt-1" rows={3} placeholder="General notes about the quote..." />
            </div>
            <div>
              <Label htmlFor="exclusions">Exclusions</Label>
              <Textarea id="exclusions" {...field("exclusions")} className="mt-1" rows={2} placeholder="List of items not included in this quote..." />
            </div>
            <div>
              <Label htmlFor="assumptions">Assumptions</Label>
              <Textarea id="assumptions" {...field("assumptions")} className="mt-1" rows={2} placeholder="Assumptions made in compiling this quote..." />
            </div>
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea id="terms" {...field("terms")} className="mt-1" rows={4} placeholder="Payment terms and conditions..." />
            </div>
          </CardContent>
        )}
      </Card>

      {/* AI Quote Assist */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Quote Assist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Type rough notes and let AI expand them into professional quote wording.
          </p>
          <Textarea
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            placeholder="e.g. skim kitchen ceiling and paint, supply and fit 2 oak internal doors..."
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiAssist}
              disabled={aiLoading || !aiNotes.trim()}
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />}
              {aiLoading ? "Generating..." : "Expand with AI"}
            </Button>
          </div>
          {aiResult && (
            <div className="rounded-lg border bg-amber-50 p-3 space-y-2">
              <p className="text-sm whitespace-pre-wrap">{aiResult}</p>
              <Button type="button" size="sm" onClick={insertAiResult} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Insert as line item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Attachments — only available after saving */}
      {savedQuoteId && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Image Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <AttachmentUploader
              parentType="quote"
              parentId={savedQuoteId}
              initialAttachments={initialQuote?.attachments}
            />
          </CardContent>
        </Card>
      )}

      {!savedQuoteId && (
        <p className="text-xs text-muted-foreground italic text-center">
          Save the quote first to attach images.
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pb-6">
        <Button onClick={handleSave} disabled={saving} className="bg-navy-900 hover:bg-navy-800">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Saving..." : isEdit ? "Update Quote" : "Save Quote"}
        </Button>

        {savedQuoteId && (
          <Button variant="outline" asChild>
            <Link href={`/quotes/${savedQuoteId}/pdf`} target="_blank">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Link>
          </Button>
        )}

        <Button variant="outline" onClick={() => router.push("/quotes")}>
          Back to Quotes
        </Button>
      </div>
    </div>
  );
}
