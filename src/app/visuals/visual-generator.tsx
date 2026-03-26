"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save, Loader2, RefreshCw, Image, ArrowLeft } from "lucide-react";

interface VisualGeneratorProps {
  clients: { id: string; fullName: string }[];
  quotes: { id: string; ref: string }[];
  preselectedClientId?: string;
  preselectedQuoteId?: string;
}

type VisualType = "inspiration_board" | "visualisation";

export function VisualGenerator({ clients, quotes, preselectedClientId, preselectedQuoteId }: VisualGeneratorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [type, setType] = useState<VisualType>("inspiration_board");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [address, setAddress] = useState("");
  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [quoteId, setQuoteId] = useState(preselectedQuoteId || "");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [aiNote, setAiNote] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt required", description: "Please describe what you want to generate.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setGeneratedImageUrl("");
    setAiNote("");

    try {
      const res = await fetch("/api/ai/generate-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type, address }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      setGeneratedImageUrl(data.imageUrl);
      if (data.note) setAiNote(data.note);

      toast({ title: "Visual generated!", description: "Preview below. Click Save to persist it." });
    } catch {
      toast({ title: "Generation failed", description: "Check your API key or try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Save is a genuine one-click persist to database.
   * This resolves the previous Windows app bug where visuals appeared to save but didn't.
   */
  const handleSave = async () => {
    if (!generatedImageUrl) {
      toast({ title: "Nothing to save", description: "Generate a visual first.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title || prompt.slice(0, 80),
          prompt,
          imageUrl: generatedImageUrl,
          address: address || undefined,
          clientId: clientId || undefined,
          quoteId: quoteId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      const saved = await res.json();

      toast({
        title: "Visual saved!",
        description: "Your visual has been saved to the database and will appear in Visuals history.",
      });

      // Navigate to the saved visual
      router.push(`/visuals/${saved.id}`);
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Visual Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(["inspiration_board", "visualisation"] as VisualType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${
                  type === t
                    ? "border-amber-500 bg-amber-50 text-amber-900"
                    : "border-border hover:border-amber-200"
                }`}
              >
                <p className="font-semibold text-sm">
                  {t === "inspiration_board" ? "🎨 Inspiration Board" : "🏗️ Visualisation"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t === "inspiration_board"
                    ? "Mood board, style references, material palettes"
                    : "Architectural rendering of finished space"}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Generation Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="e.g. Modern Kitchen Inspiration" />
          </div>
          <div>
            <Label>Description / Prompt <span className="text-destructive">*</span></Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1"
              rows={4}
              placeholder={
                type === "inspiration_board"
                  ? "e.g. Contemporary kitchen with handleless units, quartz worktops, warm grey tones, brushed brass fixtures, large format tiles..."
                  : "e.g. Open plan kitchen extension with bi-fold doors to garden, vaulted ceiling, Shaker style units, island with bar stools..."
              }
            />
          </div>
          <div>
            <Label>Address / Location (optional)</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" placeholder="Used to add location context to generation" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Link to Client / Quote (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Client</Label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">— None —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
          <div>
            <Label>Quote</Label>
            <select value={quoteId} onChange={(e) => setQuoteId(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">— None —</option>
              {quotes.map((q) => <option key={q.id} value={q.id}>{q.ref}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Generate button */}
      <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} size="lg" className="w-full bg-amber-500 hover:bg-amber-600">
        {generating ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</>
        ) : (
          <><Sparkles className="h-5 w-5 mr-2" />Generate {type === "inspiration_board" ? "Inspiration Board" : "Visualisation"}</>
        )}
      </Button>

      {/* Preview */}
      {generatedImageUrl && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4 text-amber-500" />
                Generated Preview
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />Regenerate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiNote && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                {aiNote}
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedImageUrl}
              alt="Generated visual"
              className="w-full rounded-lg border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-visual.svg";
              }}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-navy-900 hover:bg-navy-800"
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save to Visuals History</>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Click Save to persist this visual to the database. It will appear in your Visuals history.
            </p>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" asChild>
        <Link href="/visuals">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Visuals
        </Link>
      </Button>
    </div>
  );
}
