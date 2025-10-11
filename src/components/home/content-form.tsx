
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, AlertCircle, UploadCloud, WandSparkles, Clipboard, ClipboardCheck, Edit, Link as LinkIcon } from "lucide-react";
import { generateCourseFromText, generateCourseFromPdf, generateCourseFromUrl } from "@/app/actions";
import type { Course } from "@/lib/types";
import { promptTemplate } from "@/lib/prompt-template";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  text: z.string().optional(),
  promptTopic: z.string().optional(),
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
  const [isCopied, setIsCopied] = useState(false);
  const [promptValue, setPromptValue] = useState(promptTemplate.replace('[ENTER YOUR TOPIC HERE]', ''));

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      promptTopic: "Beginner's guide to React",
      url: ""
    },
  });

  const topic = form.watch('promptTopic');

  useEffect(() => {
    const newPrompt = promptTemplate.replace('[ENTER YOUR TOPIC HERE]', topic || '');
    setPromptValue(newPrompt);
  }, [topic]);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

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
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(promptValue);
    setIsCopied(true);
  };
  
  async function onPromptSubmit() {
    if (!topic) {
        form.setError("promptTopic", { message: "Please enter a topic for the prompt." });
        return;
    }
    setIsLoading(true);
    setError(null);
    const result = await generateCourseFromText(promptValue);
    setIsLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      onCourseGenerated(result);
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/50 border-primary/20 shadow-primary/10 shadow-lg p-6 rounded-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onPromptSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="promptTopic"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-lg font-semibold flex items-center gap-2"><Edit className="w-5 h-5 text-primary" /> Craft with a prompt</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 'A beginner's guide to quantum computing'" {...field} className="text-base py-6 bg-background" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <div className="relative group">
                <Textarea
                    value={promptValue}
                    readOnly
                    className="min-h-[150px] text-sm bg-muted/50 border-dashed opacity-50 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleCopyToClipboard}
                        title="Copy to clipboard"
                    >
                        {isCopied ? <ClipboardCheck className="text-green-500" /> : <Clipboard />}
                    </Button>
                </div>
            </div>
            
            <Button type="submit" className="w-full text-lg py-7" disabled={isLoading}>
            {isLoading ? (
                <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Crafting Your Course...
                </>
            ) : (
                <>
                <WandSparkles className="mr-2 h-5 w-5" />
                Generate with AI
                </>
            )}
            </Button>
        </form>
      
        <Separator className="my-8" />

        <div className="space-y-4 text-center">
            <h3 className="text-muted-foreground font-medium">Or use other sources:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    className="relative border-2 border-dashed border-muted/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors flex flex-col justify-center items-center"
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
                    />
                </div>
                <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                    <FormItem className='h-full'>
                        <div 
                            className="relative border-2 border-dashed border-muted/30 rounded-lg p-6 text-center cursor-text hover:border-primary hover:bg-muted/50 transition-colors h-full flex flex-col justify-center"
                            onClick={() => document.getElementById('paste-text-area')?.focus()}
                        >
                            <FileText className="mx-auto h-8 w-8 text-primary" />
                            <p className="mt-2 font-semibold text-foreground">Paste Text</p>
                            <p className="text-xs text-muted-foreground">Paste any text to get started</p>
                        </div>
                        <FormControl>
                            <Textarea
                                id="paste-text-area"
                                placeholder="Paste your messy course notes, lesson plans, or document text here..."
                                className="min-h-[250px] text-base sr-only"
                                {...field}
                                onBlur={onTextSubmit}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <form onSubmit={form.handleSubmit(onUrlSubmit)} className="space-y-2 pt-4">
              <div className="flex gap-2">
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <div className="relative flex items-center">
                                    <LinkIcon className="absolute left-3 w-5 h-5 text-muted-foreground" />
                                    <Input placeholder="Or paste a link to an article" {...field} className="pl-10 text-base py-6 bg-background" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="py-6" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Go'}
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

    