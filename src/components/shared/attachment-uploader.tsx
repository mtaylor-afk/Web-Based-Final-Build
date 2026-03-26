"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import Image from "next/image";

interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileUrl: string;
}

interface AttachmentUploaderProps {
  parentType: "quote" | "invoice" | "signoff";
  parentId: string;
  initialAttachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

export function AttachmentUploader({
  parentType,
  parentId,
  initialAttachments = [],
  onAttachmentsChange,
}: AttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("parentType", parentType);
      formData.append("parentId", parentId);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });

        if (!res.ok) {
          const err = await res.json();
          toast({ title: "Upload failed", description: err.error || "Unknown error", variant: "destructive" });
          continue;
        }

        const { attachment } = await res.json();
        newAttachments.push(attachment);
      } catch {
        toast({ title: "Upload failed", description: "Network error", variant: "destructive" });
      }
    }

    setUploading(false);

    if (newAttachments.length > 0) {
      const updated = [...attachments, ...newAttachments];
      setAttachments(updated);
      onAttachmentsChange?.(updated);
      toast({
        title: "Images uploaded",
        description: `${newAttachments.length} image${newAttachments.length !== 1 ? "s" : ""} attached successfully.`,
      });
    }
  };

  const handleRemove = async (attachment: Attachment) => {
    const res = await fetch(
      `/api/upload?id=${attachment.id}&parentType=${parentType}&parentId=${parentId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      const updated = attachments.filter((a) => a.id !== attachment.id);
      setAttachments(updated);
      onAttachmentsChange?.(updated);
    } else {
      toast({ title: "Error", description: "Failed to remove attachment", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Image Attachments {attachments.length > 0 && `(${attachments.length})`}
        </span>
      </div>

      {/* Upload button */}
      <div
        className="rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-amber-400 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length > 0) handleUpload(files);
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag &amp; drop images
            </p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 10MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleUpload(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* Thumbnails */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {attachments.map((att) => (
            <div key={att.id} className="group relative rounded-lg overflow-hidden border aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={att.fileUrl}
                alt={att.fileName}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(att)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-white truncate">{att.fileName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
