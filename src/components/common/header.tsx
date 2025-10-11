import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "../ui/button";
import { Sparkles } from "../ui/icons";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end">
            <Button variant="ghost">
                <Sparkles className="h-5 w-5 mr-2 text-accent"/>
                Try a Demo
            </Button>
        </div>
      </div>
    </header>
  );
}
