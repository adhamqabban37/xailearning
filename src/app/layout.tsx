import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/common/header";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AI Course Crafter",
  description:
    "The enchanted, living document that makes learning an adventure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`font-sans antialiased min-h-screen flex flex-col ${inter.variable}`}
      >
        {/* Skip link for keyboard and screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
        >
          Skip to main content
        </a>
        <AuthProvider>
          {/* Site header (landmark) */}
          <Header />
          {/* Main content landmark with programmatic focus target */}
          <main
            id="main-content"
            tabIndex={-1}
            role="main"
            className="flex-1 focus:outline-none"
          >
            {children}
          </main>
          {/* Global polite live region for announcements (screen reader only) */}
          <div aria-live="polite" aria-atomic="true" className="sr-only" />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
