"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Search, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Rate {
  id: string;
  category: string;
  name: string;
  defaultUnit?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultCost: any;
  notes?: string | null;
}

const CATEGORIES = [
  "Labour", "Plastering", "Decorating", "Flooring", "Joinery",
  "Electrical", "Plumbing", "Roofing", "Demolition", "General", "Other",
];

function emptyRate(): Omit<Rate, "id"> {
  return { category: "Labour", name: "", defaultUnit: "", defaultCost: 0, notes: "" };
}

export function RatesManager({ initialRates }: { initialRates: Rate[] }) {
  const [rates, setRates] = useState(initialRates);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [newRate, setNewRate] = useState<Omit<Rate, "id"> | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const categories = ["All", ...Array.from(new Set(rates.map((r) => r.category))).sort()];

  const filtered = rates.filter((r) => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || r.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const grouped = filtered.reduce<Record<string, Rate[]>>((acc, rate) => {
    if (!acc[rate.category]) acc[rate.category] = [];
    acc[rate.category].push(rate);
    return acc;
  }, {});

  const handleSaveNew = async () => {
    if (!newRate || !newRate.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newRate, defaultCost: Number(newRate.defaultCost) }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setRates((prev) => [...prev, created].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
      setNewRate(null);
      toast({ title: "Rate added", description: `${created.name} added to ${created.category}.` });
    } catch {
      toast({ title: "Error", description: "Failed to save rate", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rates/${editingRate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingRate, defaultCost: Number(editingRate.defaultCost) }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRates((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      setEditingRate(null);
      toast({ title: "Rate updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update rate", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/rates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRates((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Rate deleted" });
    }
  };

  const RateFormFields = ({
    data,
    setData,
  }: {
    data: Omit<Rate, "id"> | Rate;
    setData: (d: Omit<Rate, "id"> | Rate) => void;
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <select
            value={data.category}
            onChange={(e) => setData({ ...data, category: e.target.value })}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label>Unit</Label>
          <Input value={data.defaultUnit || ""} onChange={(e) => setData({ ...data, defaultUnit: e.target.value })} className="mt-1" placeholder="e.g. m², day, each" />
        </div>
      </div>
      <div>
        <Label>Item Name <span className="text-destructive">*</span></Label>
        <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="mt-1" placeholder="e.g. Skim coat ceiling per m²" />
      </div>
      <div>
        <Label>Default Cost (£)</Label>
        <Input type="number" min="0" step="any" value={Number(data.defaultCost)} onChange={(e) => setData({ ...data, defaultCost: parseFloat(e.target.value) || 0 })} className="mt-1" />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={data.notes || ""} onChange={(e) => setData({ ...data, notes: e.target.value })} className="mt-1" rows={2} placeholder="Any notes about this rate..." />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rates..." className="pl-9" />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Button onClick={() => setNewRate(emptyRate())} className="bg-navy-900 hover:bg-navy-800">
          <Plus className="h-4 w-4 mr-2" />Add Rate
        </Button>
      </div>

      {/* Rates by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search || categoryFilter !== "All" ? "No rates found." : "No rates yet. Click 'Add Rate' to start building your library."}
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryRates]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-amber-700">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left pb-2 font-semibold text-navy-900">Item</th>
                    <th className="text-right pb-2 font-semibold text-navy-900 w-20">Unit</th>
                    <th className="text-right pb-2 font-semibold text-navy-900 w-28">Cost</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categoryRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-muted/30">
                      <td className="py-2">
                        <p className="font-medium">{rate.name}</p>
                        {rate.notes && <p className="text-xs text-muted-foreground">{rate.notes}</p>}
                      </td>
                      <td className="py-2 text-right text-muted-foreground text-xs">{rate.defaultUnit || "—"}</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(Number(rate.defaultCost))}</td>
                      <td className="py-2">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingRate(rate)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <ConfirmDeleteDialog
                            title="Delete rate?"
                            description={`Delete "${rate.name}" from the library?`}
                            onConfirm={() => handleDelete(rate.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add new rate dialog */}
      <Dialog open={!!newRate} onOpenChange={(o) => { if (!o) setNewRate(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Rate</DialogTitle></DialogHeader>
          {newRate && <RateFormFields data={newRate} setData={(d) => setNewRate(d as typeof newRate)} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRate(null)}>Cancel</Button>
            <Button onClick={handleSaveNew} disabled={saving} className="bg-navy-900 hover:bg-navy-800">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit rate dialog */}
      <Dialog open={!!editingRate} onOpenChange={(o) => { if (!o) setEditingRate(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Rate</DialogTitle></DialogHeader>
          {editingRate && <RateFormFields data={editingRate} setData={(d) => setEditingRate(d as Rate)} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRate(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-navy-900 hover:bg-navy-800">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
