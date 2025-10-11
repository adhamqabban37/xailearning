
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, AlertCircle, UploadCloud, Link as LinkIcon } from "lucide-react";
import { generateCourseFromText, generateCourseFromPdf, generateCourseFromUrl } from "@/app/actions";
import type { Course } from "@/lib/types";
import { Card } from "../ui/card";

const formSchema = z.object({
  text: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL." }).optional(),
});

interface ContentFormProps {
  onCourseGenerated: (course: Course) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function ContentForm({ onCourseGenerated, setIsLoading, isLoading }: ContentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      url: ""
    },
  });

  const textValue = form.watch('text');

  async function onTextSubmit() {
    const textToSubmit = form.getValues("text");
    if (!textToSubmit || textToSubmit.length < 100) {
      form.setError("text", { message: "Please enter at least 100 characters." });
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await generateCourseFromText(textToSubmit);
    setIsLoading(false);
    setIsPasting(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      onCourseGenerated(result);
    }
  }

  async function onUrlSubmit() {
    const url = form.getValues("url");
    if (!url) {
      form.setError("url", { message: "Please enter a URL." });
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await generateCourseFromUrl(url);
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
      onPdfSubmit(file);
    }
  };

  const onPdfSubmit = async (file: File) => {
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const fileBuffer = e.target?.result as ArrayBuffer;
      if (fileBuffer) {
        setIsLoading(true);
        setError(null);
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
    <Card className="w-full max-w-3xl mx-auto bg-card/50 border-primary/20 shadow-primary/10 shadow-lg p-6 rounded-xl">
      <Form {...form}>
        <div className="space-y-4 text-center">
            <h3 className="text-xl font-semibold">Create Your Course</h3>
            <p className="text-muted-foreground">Upload a document or paste text to get started.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div 
                    className="relative border-2 border-dashed border-muted/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors flex flex-col justify-center items-center h-40"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud className="mx-auto h-8 w-8 text-primary" />
                    <p className="mt-2 font-semibold text-foreground">
                        {fileName || 'Upload a PDF'}
                    </p>
                    <p className="text-xs text-muted-foreground">The AI will read the file and build a course</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                    <FormItem className='h-40'>
                        {!isPasting ? (
                            <div 
                                className="relative border-2 border-dashed border-muted/30 rounded-lg p-6 text-center cursor-text hover:border-primary hover:bg-muted/50 transition-colors h-full flex flex-col justify-center"
                                onClick={() => setIsPasting(true)}
                            >
                                <FileText className="mx-auto h-8 w-8 text-primary" />
                                <p className="mt-2 font-semibold text-foreground">Paste Text</p>
                                <p className="text-xs text-muted-foreground">Paste any text to get started</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 h-full">
                                <FormControl>
                                    <Textarea
                                        id="paste-text-area"
                                        placeholder="Paste your messy course notes, lesson plans, or document text here..."
                                        className="min-h-[100px] text-base flex-1"
                                        {...field}
                                        autoFocus
                                    />
                                </FormControl>
                                {textValue && textValue.length > 100 && (
                                     <Button type="button" onClick={onTextSubmit} disabled={isLoading} size="sm">
                                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Analyzing...</> : 'Generate from Text'}
                                    </Button>
                                )}
                            </div>
                        )}
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <div className="relative flex items-center text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border before:mr-4 after:ml-4">Or</div>
            <form onSubmit={form.handleSubmit(onUrlSubmit)} className="space-y-2 pt-2">
              <div className="flex gap-2">
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <div className="relative flex items-center">
                                    <LinkIcon className="absolute left-3 w-5 h-5 text-muted-foreground" />
                                    <Input placeholder="Paste a link to an article or blog post" {...field} className="pl-10 text-base py-6 bg-background" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="py-6" disabled={isLoading || !form.watch('url')}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze'}
                </Button>
              </div>
            </form>
        </div>
      </Form>


      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Oops! Something went wrong.</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
