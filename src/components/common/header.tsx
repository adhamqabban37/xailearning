import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "../ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end">
            <Button variant="ghost">
                About
            </Button>
             <Button variant="ghost">
                Sign In
            </Button>
            <Button>
                Get Started
            </Button>
        </div>
      </div>
    </header>
  );
}
