"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Building, FileText, Sparkles } from "lucide-react";

interface Settings {
  id: string;
  companyDisplayName: string;
  companyLegalName: string;
  companyReg: string;
  tradingAs: string;
  defaultTerms: string;
  defaultPaymentTerms: string;
  aiProvider: string;
  aiModel: string;
}

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...initialSettings });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Settings saved", description: "Company details and defaults updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
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
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Display Name</Label>
              <Input {...field("companyDisplayName")} className="mt-1" placeholder="e.g. WV Construction" />
            </div>
            <div>
              <Label>Trading As</Label>
              <Input {...field("tradingAs")} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Legal Name</Label>
            <Input {...field("companyLegalName")} className="mt-1" placeholder="Registered company name" />
          </div>
          <div>
            <Label>Company Registration Number</Label>
            <Input {...field("companyReg")} className="mt-1" placeholder="e.g. 9287377" />
          </div>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Default Terms & Conditions</Label>
            <Textarea {...field("defaultTerms")} className="mt-1" rows={5} placeholder="Default terms for quotes..." />
          </div>
          <div>
            <Label>Default Payment Terms</Label>
            <Textarea {...field("defaultPaymentTerms")} className="mt-1" rows={3} placeholder="Default payment terms for invoices..." />
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Set your OpenAI API key in the <code className="font-mono bg-amber-100 px-1 rounded">.env</code> file as{" "}
            <code className="font-mono bg-amber-100 px-1 rounded">OPENAI_API_KEY</code>. The app uses GPT-4o for quote assist and DALL-E 3 for image generation.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>AI Provider</Label>
              <Input {...field("aiProvider")} className="mt-1" placeholder="openai" />
            </div>
            <div>
              <Label>AI Model</Label>
              <Input {...field("aiModel")} className="mt-1" placeholder="gpt-4o" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-navy-900 hover:bg-navy-800">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
