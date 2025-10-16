"use client";
import { useRef, useState } from "react";
import type { Course } from "@/lib/types";
import { generateCourseFromText } from "@/app/actions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { LoadingBar } from "../ui/loading-bar";

type Props = {
  onCourseGenerated?: (course: Course) => void;
};

export default function PdfUploadClient({ onCourseGenerated }: Props) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    setUploadProgress(0);

    const fd = new FormData(e.currentTarget);

    try {
      setUploadProgress(10);
      setPhase("Uploading and extracting PDF text...");
      // 1) Parse via /api/upload quickly with a timeout
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), 25_000);

      setUploadProgress(25);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      }).finally(() => clearTimeout(to));

      setUploadProgress(40);
      if (!res.ok) {
        let msg = `Failed to upload/parse PDF (status ${res.status}).`;
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
        } catch {}
        throw new Error(msg);
      }

      const parsed = await res.json();
      let text: string = parsed?.text || "";
      if (!text || text.trim().length < 100) {
        throw new Error(
          "The PDF content is too short or could not be extracted. Please try a different PDF."
        );
      }
      // 2) Cap long text to speed up AI
      const MAX_CHARS = 16000; // ~16k chars cap
      if (text.length > MAX_CHARS) {
        text = text.slice(0, MAX_CHARS);
      }

      setUploadProgress(50);
      setPhase("Analyzing with AI...");
      slowTimer.current = setTimeout(() => {
        setPhase("Still analyzing... larger PDFs can take up to a minute.");
        setUploadProgress(75);
      }, 20_000);

      setUploadProgress(70);
      const courseResult = await generateCourseFromText(text);
      if (slowTimer.current) {
        clearTimeout(slowTimer.current);
        slowTimer.current = null;
      }

      setUploadProgress(90);
      if (courseResult && "error" in courseResult) {
        throw new Error(courseResult.error);
      }
      if (courseResult && onCourseGenerated) {
        onCourseGenerated(courseResult as Course);
      }

      setUploadProgress(100);
      setResult("PDF processed and course generated successfully.");
      setPhase("Course generated successfully!");
      // Brief delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPhase(null);
    } catch (err: any) {
      setError(err.message || "Unknown error during upload.");
      setPhase(null);
      setUploadProgress(0);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  return (
    <Card className="elevation-1">
      <CardHeader>
        <CardTitle className="font-headline">Upload a PDF</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="file"
            name="file"
            accept="application/pdf"
            required
            disabled={loading}
            className="cursor-pointer"
          />
          <Button
            type="submit"
            disabled={loading}
            className="btn-gradient shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload and Parse
          </Button>
        </form>
        {loading && (
          <div className="mt-6">
            <LoadingBar
              progress={uploadProgress}
              status={phase || "Processing..."}
              visible={loading}
              variant="inline"
            />
          </div>
        )}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && (
          <Alert className="mt-6 border-success/50 bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle className="text-success-foreground">
              Success!
            </AlertTitle>
            <AlertDescription className="text-success-foreground/90">
              {result}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
