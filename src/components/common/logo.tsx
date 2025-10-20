import { cn } from "@/lib/utils";
import Image from "next/image";

type LogoProps = {
  className?: string;
  alt?: string;
};

export function Logo({ className, alt }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Image
          src="/logo.svg"
          alt={alt ?? "AI Course Crafter Logo"}
          width={40}
          height={40}
          className="w-10 h-10 rounded-md object-cover"
          priority
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-bold text-foreground">AI Learn</span>
        <span className="text-xs text-muted-foreground font-medium">
          AI Course Crafter
        </span>
      </div>
    </div>
  );
}
