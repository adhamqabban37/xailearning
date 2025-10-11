import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary/10 text-primary rounded-lg p-2">
        <GraduationCap className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold text-foreground">
        Course Crafter
      </span>
    </div>
  );
}
