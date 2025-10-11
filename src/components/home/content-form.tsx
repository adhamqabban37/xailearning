"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, AlertCircle, UploadCloud, WandSparkles } from "lucide-react";
import { generateCourseFromText, generateCourseFromPdf } from "@/app/actions";
import type { Course } from "@/lib/types";

const formSchema = z.object({
  text: z.string().optional(),
});

interface ContentFormProps {
  onCourseGenerated: (course: Course) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function ContentForm({ onCourseGenerated, setIsLoading, isLoading }: ContentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  async function onTextSubmit(values: z.infer<typeof formSchema>) {
    if (!values.text || values.text.length < 100) {
      form.setError("text", { message: "Please enter at least 100 characters." });
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await generateCourseFromText(values.text);
    setIsLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      onCourseGenerated(result);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
    }
  };

  const onPdfSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      setError("Please select a PDF file to upload.");
      return;
    }

    const file = fileInputRef.current.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const fileBuffer = e.target?.result as ArrayBuffer;
      if (fileBuffer) {
        setIsLoading(true);
        setError(null);
        // Convert ArrayBuffer to Base64 string
        const base64 = Buffer.from(fileBuffer).toString('base64');
        const result = await generateCourseFromPdf(base64);
        setIsLoading(false);
        if ("error" in result) {
          setError(result.error);
        } else {
          onCourseGenerated(result);
        }
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read the file.");
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card p-6 rounded-xl border shadow-sm">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Paste Text</TabsTrigger>
          <TabsTrigger value="pdf"><UploadCloud className="mr-2 h-4 w-4" />Upload PDF</TabsTrigger>
        </TabsList>
        <TabsContent value="text">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onTextSubmit)} className="space-y-6 mt-4">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Course Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your messy course notes, lesson plans, or document text here..."
                        className="min-h-[250px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Crafting Your Course...
                  </>
                ) : (
                  <>
                    <WandSparkles className="mr-2 h-5 w-5" />
                    Create with AI
                  </>
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="pdf">
            <form onSubmit={onPdfSubmit} className="space-y-6 mt-4">
              <div 
                className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 font-semibold text-foreground">
                    {fileName || 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-sm text-muted-foreground">PDF (up to 5MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
              </div>

              <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || !fileName}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Crafting from PDF...
                  </>
                ) : (
                   <>
                    <WandSparkles className="mr-2 h-5 w-5" />
                    Create with AI
                  </>
                )}
              </Button>
            </form>
        </TabsContent>
      </Tabs>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Oops! Something went wrong.</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
