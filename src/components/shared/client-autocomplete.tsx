"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  fullName: string;
  companyName?: string | null;
  address: string;
  email?: string | null;
  phone?: string | null;
}

interface ClientAutocompleteProps {
  value?: Client | null;
  onChange: (client: Client | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ClientAutocomplete({
  value,
  onChange,
  onCreateNew,
  placeholder = "Search clients by name, email or phone...",
  disabled,
}: ClientAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (client: Client) => {
    onChange(client);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy-900 truncate">{value.fullName}</p>
          {value.companyName && (
            <p className="text-xs text-muted-foreground truncate">{value.companyName}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">{value.address}</p>
        </div>
        {!disabled && (
          <Button variant="ghost" size="icon" onClick={handleClear} className="h-6 w-6 flex-shrink-0">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          disabled={disabled}
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3">
              <p className="text-sm text-muted-foreground mb-2">No clients found for &quot;{query}&quot;</p>
              {onCreateNew && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-700 p-0"
                  onClick={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create new client
                </Button>
              )}
            </div>
          )}
          {results.map((client) => (
            <button
              key={client.id}
              type="button"
              className={cn(
                "w-full text-left px-4 py-2.5 hover:bg-muted transition-colors",
                "border-b last:border-b-0"
              )}
              onClick={() => handleSelect(client)}
            >
              <p className="text-sm font-semibold text-navy-900">{client.fullName}</p>
              {client.companyName && (
                <p className="text-xs text-muted-foreground">{client.companyName}</p>
              )}
              <p className="text-xs text-muted-foreground truncate">{client.address}</p>
            </button>
          ))}
          {!loading && results.length > 0 && onCreateNew && (
            <div className="px-4 py-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-600 hover:text-amber-700 p-0 text-xs"
                onClick={() => {
                  setOpen(false);
                  onCreateNew();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Create new client instead
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
