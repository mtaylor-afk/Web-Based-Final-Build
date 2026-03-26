import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor, className }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {Icon && (
            <div className={cn("p-2 rounded-lg", iconColor || "bg-amber-50")}>
              <Icon className={cn("h-5 w-5", iconColor ? "text-white" : "text-amber-600")} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
