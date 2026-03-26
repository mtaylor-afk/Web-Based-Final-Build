"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAutocomplete } from "@/components/shared/client-autocomplete";
import { ClientForm } from "@/components/forms/client-form";
import { AttachmentUploader } from "@/components/shared/attachment-uploader";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Download, Plus, X, User } from "lucide-react";
import { formatDateInput } from "@/lib/utils";

interface Client {
  id: string;
  fullName: string;
  companyName?: string | null;
  address: string;
  email?: string | null;
  phone?: string | null;
}

interface SignOffEditorProps {
  initialSignOff?: {
    id: string;
    ref: string;
    address: string;
    summary?: string | null;
    notes?: string | null;
    completionDate?: Date | null;
    client: Client;
    relatedQuote?: { id: string; ref: string } | null;
    relatedInvoice?: { id: string; ref: string } | null;
    attachments: { id: string; fileName: string; mimeType: string; fileUrl: string }[];
  };
  preselectedClient?: Client | null;
  availableQuotes?: { id: string; ref: string }[];
  availableInvoices?: { id: string; ref: string }[];
}

export function SignOffEditor({
  initialSignOff,
  preselectedClient,
  availableQuotes = [],
  availableInvoices = [],
}: SignOffEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initialSignOff;

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    initialSignOff?.client || preselectedClient || null
  );
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [savedId, setSavedId] = useState(initialSignOff?.id || "");

  const [form, setForm] = useState({
    address: initialSignOff?.address || preselectedClient?.address || "",
    summary: initialSignOff?.summary || "",
    notes: initialSignOff?.notes || "",
    completionDate: initialSignOff?.completionDate ? formatDateInput(initialSignOff.completionDate) : formatDateInput(new Date()),
    relatedQuoteId: initialSignOff?.relatedQuote?.id || "",
    relatedInvoiceId: initialSignOff?.relatedInvoice?.id || "",
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedClient) {
      toast({ title: "No client selected", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clientId: selectedClient.id,
        address: form.address,
        summary: form.summary,
        notes: form.notes,
        completionDate: form.completionDate,
        relatedQuoteId: form.relatedQuoteId || undefined,
        relatedInvoiceId: form.relatedInvoiceId || undefined,
      };

      const url = isEdit ? `/api/signoff/${initialSignOff!.id}` : "/api/signoff";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      const saved = await res.json();
      setSavedId(saved.id);

      toast({ title: isEdit ? "Sign-off updated" : "Sign-off saved", description: `${saved.ref} saved.` });

      if (!isEdit) {
        router.push(`/signoff/${saved.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save sign-off", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Client */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Client</CardTitle>
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
              <div className="flex justify-between mb-4">
                <p className="text-sm font-semibold">New Client</p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewClientForm(false)}><X className="h-4 w-4" /></Button>
              </div>
              <ClientForm mode="inline" onSuccess={(client) => { setSelectedClient(client as Client); setShowNewClientForm(false); }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sign-Off Details */}
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base">Sign-Off Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Works Address <span className="text-destructive">*</span></Label>
            <Textarea {...field("address")} className="mt-1" rows={2} placeholder="Address of completed works" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Completion Date</Label>
              <Input type="date" {...field("completionDate")} className="mt-1" />
            </div>
            <div>
              <Label>Linked Quote (optional)</Label>
              <select
                value={form.relatedQuoteId}
                onChange={(e) => setForm((f) => ({ ...f, relatedQuoteId: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {availableQuotes.map((q) => <option key={q.id} value={q.id}>{q.ref}</option>)}
              </select>
            </div>
            <div>
              <Label>Linked Invoice (optional)</Label>
              <select
                value={form.relatedInvoiceId}
                onChange={(e) => setForm((f) => ({ ...f, relatedInvoiceId: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {availableInvoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.ref}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Work Summary</Label>
            <Textarea {...field("summary")} className="mt-1" rows={4} placeholder="Summary of all works completed..." />
          </div>
          <div>
            <Label>Additional Notes</Label>
            <Textarea {...field("notes")} className="mt-1" rows={3} placeholder="Any additional notes or observations..." />
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {savedId && (
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base">Image Attachments</CardTitle></CardHeader>
          <CardContent>
            <AttachmentUploader parentType="signoff" parentId={savedId} initialAttachments={initialSignOff?.attachments} />
          </CardContent>
        </Card>
      )}
      {!savedId && <p className="text-xs text-muted-foreground italic text-center">Save the sign-off first to attach images.</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-6">
        <Button onClick={handleSave} disabled={saving} className="bg-navy-900 hover:bg-navy-800">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Saving..." : isEdit ? "Update Sign-Off" : "Save Sign-Off"}
        </Button>
        {savedId && (
          <Button variant="outline" asChild>
            <Link href={`/signoff/${savedId}/pdf`} target="_blank">
              <Download className="h-4 w-4 mr-2" />Export PDF
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/signoff")}>Back to Sign-Offs</Button>
      </div>
    </div>
  );
}
