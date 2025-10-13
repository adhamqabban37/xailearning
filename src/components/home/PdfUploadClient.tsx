
'use client';
import { useState } from 'react';
import { generateCourseFromPdf } from '@/app/actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export default function PdfUploadClient() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      // Using Server Action
      const courseResult = await generateCourseFromPdf(fd);
      if (courseResult && 'error' in courseResult) {
        throw new Error(courseResult.error);
      }
      setResult('PDF processed and course generated successfully. This component only displays a success message.');

    } catch (err: any) {
      setError(err.message || 'Unknown error during upload.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Upload a PDF</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input type="file" name="file" accept="application/pdf" required disabled={loading} />
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload and Parse
              </Button>
            </form>
            {error && (
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {result && (
                <Alert className="mt-4">
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                        <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-slate-50">{result.slice(0, 500)}...</pre>
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
    </Card>
  );
}
