"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  sortOrder?: number;
}

interface LineItemsTableProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
}

function emptyItem(index: number): LineItem {
  return {
    description: "",
    quantity: 1,
    unit: "",
    unitPrice: 0,
    total: 0,
    sortOrder: index,
  };
}

export function LineItemsTable({ items, onChange, disabled }: LineItemsTableProps) {
  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      // Auto-calculate total when qty or price changes
      if (field === "quantity" || field === "unitPrice") {
        const qty = field === "quantity" ? Number(value) : Number(item.quantity);
        const price = field === "unitPrice" ? Number(value) : Number(item.unitPrice);
        newItem.total = Math.round(qty * price * 100) / 100;
      }
      return newItem;
    });
    onChange(updated);
  };

  const addItem = () => {
    onChange([...items, emptyItem(items.length)]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);

  return (
    <div className="space-y-3">
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold text-navy-900 w-8"></th>
              <th className="text-left px-3 py-2.5 font-semibold text-navy-900">Description</th>
              <th className="text-right px-3 py-2.5 font-semibold text-navy-900 w-20">Qty</th>
              <th className="text-left px-3 py-2.5 font-semibold text-navy-900 w-20">Unit</th>
              <th className="text-right px-3 py-2.5 font-semibold text-navy-900 w-28">Unit Price</th>
              <th className="text-right px-3 py-2.5 font-semibold text-navy-900 w-28">Total</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => (
              <tr key={idx} className="group">
                <td className="px-3 py-2 text-muted-foreground">
                  <GripVertical className="h-4 w-4 opacity-40" />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Description of work..."
                    className="border-0 shadow-none focus-visible:ring-1 h-8 px-2"
                    disabled={disabled}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                    className="border-0 shadow-none focus-visible:ring-1 h-8 px-2 text-right"
                    disabled={disabled}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(idx, "unit", e.target.value)}
                    placeholder="m², hr..."
                    className="border-0 shadow-none focus-visible:ring-1 h-8 px-2"
                    disabled={disabled}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="border-0 shadow-none focus-visible:ring-1 h-8 px-2 text-right"
                    disabled={disabled}
                  />
                </td>
                <td className="px-3 py-2 text-right font-semibold text-navy-900">
                  {formatCurrency(item.total)}
                </td>
                <td className="px-3 py-2">
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/30 border-t">
            <tr>
              <td colSpan={4} className="px-3 py-2">
                {!disabled && (
                  <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-amber-600 hover:text-amber-700">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add line item
                  </Button>
                )}
              </td>
              <td className="px-3 py-2.5 text-right text-sm font-semibold text-navy-900">Subtotal</td>
              <td className="px-3 py-2.5 text-right text-sm font-bold text-navy-900">
                {formatCurrency(subtotal)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile stacked view */}
      <div className="md:hidden space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-muted-foreground">Item {idx + 1}</span>
              {!disabled && (
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(idx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Input
              value={item.description}
              onChange={(e) => updateItem(idx, "description", e.target.value)}
              placeholder="Description..."
              disabled={disabled}
            />
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} placeholder="Qty" disabled={disabled} />
              <Input value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} placeholder="Unit" disabled={disabled} />
              <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} placeholder="£/unit" disabled={disabled} />
            </div>
            <div className="text-right font-semibold text-sm">{formatCurrency(item.total)}</div>
          </div>
        ))}
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add line item
          </Button>
        )}
        <div className="flex justify-end text-sm font-bold py-2 border-t">
          <span className="mr-4">Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
