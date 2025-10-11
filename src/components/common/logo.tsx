import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 2H20v15H6.5C5.83696 17 5.20107 16.7366 4.73223 16.2678C4.26339 15.7989 4 15.163 4 14.5V3.5C4 2.83696 4.26339 2.20107 4.73223 1.73223C5.20107 1.26339 5.83696 1 6.5 1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
         <path d="M12 6L13.5 9L16 10L13.5 11L12 14L10.5 11L8 10L10.5 9L12 6Z" fill="currentColor" />
      </svg>
      <span className="font-headline text-lg font-bold text-foreground">
        AI Course Crafter
      </span>
    </div>
  );
}
