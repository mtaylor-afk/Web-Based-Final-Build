import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraIconIndicatorProps {
  hasImages: boolean;
  className?: string;
}

export function CameraIconIndicator({ hasImages, className }: CameraIconIndicatorProps) {
  if (!hasImages) return null;
  return (
    <span
      title="Has image attachments"
      className={cn("inline-flex items-center text-amber-600", className)}
    >
      <Camera className="h-3.5 w-3.5" />
    </span>
  );
}
