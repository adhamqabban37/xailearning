import { cn } from "@/lib/utils";
import { BookMarked } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary/20 text-primary rounded-lg p-1.5">
        <BookMarked className="h-5 w-5" />
      </div>
      <span className="text-lg font-bold text-foreground">
        Course Crafter
      </span>
    </div>
  );
}
