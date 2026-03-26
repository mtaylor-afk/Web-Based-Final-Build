"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

interface ClientFormProps {
  initialData?: {
    id?: string;
    fullName?: string;
    companyName?: string;
    address?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
  onSuccess?: (client: { id: string; fullName: string; address: string }) => void;
  mode?: "page" | "inline";
}

export function ClientForm({ initialData, onSuccess, mode = "page" }: ClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState({
    fullName: initialData?.fullName || "",
    companyName: initialData?.companyName || "",
    address: initialData?.address || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    notes: initialData?.notes || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.address.trim()) errs.address = "Address is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email address";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const url = isEdit ? `/api/clients/${initialData!.id}` : "/api/clients";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save client");
      }

      const client = await res.json();

      toast({
        title: isEdit ? "Client updated" : "Client saved",
        description: `${client.fullName} has been ${isEdit ? "updated" : "saved"} successfully.`,
        variant: "success" as never,
      });

      if (onSuccess) {
        onSuccess(client);
      } else {
        router.push(`/clients/${client.id}`);
        router.refresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Error",
        description: error.message || "Failed to save client",
        variant: "destructive",
      });
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input id="fullName" {...field("fullName")} className="mt-1" placeholder="e.g. John Smith" />
          {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
        </div>
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" {...field("companyName")} className="mt-1" placeholder="Optional" />
        </div>
      </div>

      <div>
        <Label htmlFor="address">
          Address <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="address"
          {...field("address")}
          className="mt-1"
          rows={3}
          placeholder="Full postal address"
        />
        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...field("email")} className="mt-1" placeholder="email@example.com" />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" {...field("phone")} className="mt-1" placeholder="07700 000000" />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...field("notes")}
          className="mt-1"
          rows={3}
          placeholder="Any additional notes about this client..."
        />
      </div>

      <div className={mode === "inline" ? "flex justify-end" : "flex gap-3"}>
        {mode === "page" && (
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving} className="bg-navy-900 hover:bg-navy-800">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Update Client" : "Save Client"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
