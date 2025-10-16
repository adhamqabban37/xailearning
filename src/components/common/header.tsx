"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "../ui/button";
import { BookOpen } from "lucide-react";

export function Header() {
  // Temporarily simplified header without auth dependencies
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link
            href="/"
            className="mr-4 flex items-center lg:mr-6"
            aria-label="Home"
          >
            <Logo alt="AI Course Crafter Home" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Navigation items can go here */}
          </div>

          <nav className="flex items-center space-x-2" aria-label="Primary">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" aria-label="Go to dashboard">
                <BookOpen className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href="/login" aria-label="Sign in">
                Sign In
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
