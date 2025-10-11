
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, AlertCircle, UploadCloud, Sparkles, Copy, Wand2, Clock } from "lucide-react";
import { generateCourseFromText, generateCourseFromPdf } from "@/app/actions";
import type { Course } from "@/lib/types";
import { Card } from "../ui/card";
import { useToast } from "@/hooks/use-toast";
import { promptTemplate } from "@/lib/prompt-template";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";


const formSchema = z.object({
  topic: z.string().optional(),
  duration: z.string().optional(),
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
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      duration: "medium",
      text: "",
      url: ""
    },
  });

  const topic = form.watch("topic");
  const duration = form.watch("duration");
  const textValue = form.watch('text');
  
  const finalPrompt = promptTemplate
    .replace('[TEXT_TO_ANALYZE_WILL_BE_INSERTED_HERE]', topic || 'your topic of choice')
    .replace('[COURSE_LENGTH_HERE]', duration || 'medium');


  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(finalPrompt);
    toast({
      title: "Prompt Copied!",
      description: "You can now paste this into your favorite AI tool.",
    });
  };

  async function onTextSubmit() {
    const values = form.getValues();
    if (!values.text || values.text.length < 100) {
      form.setError("text", { message: "Please enter at least 100 characters." });
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await generateCourseFromText(values.text, values.duration);
    setIsLoading(false);
    setIsPasting(false);

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
    
    setIsLoading(true);
    setError(null);
    
    try {
        const formData = new FormData();
        formData.append('pdfFile', file);
        const durationValue = form.getValues('duration');
        if (durationValue) {
          formData.append('duration', durationValue);
        }
        
        const result = await generateCourseFromPdf(formData);

        setIsLoading(false);
        if ("error" in result) {
            setError(result.error);
        } else {
            onCourseGenerated(result);
        }
    } catch (e) {
        setError("Failed to read the file.");
        setIsLoading(false);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // This is necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      onPdfSubmit(file);
    } else {
      setError("Please drop a valid PDF file.");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card/50 border-primary/20 shadow-primary/10 shadow-lg p-6 rounded-xl">
      <Form {...form}>
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-2xl font-bold flex items-center justify-center gap-2"><Wand2 className="text-primary"/> Craft with a prompt</h3>
                <p className="text-muted-foreground mt-1">Generate course material with this powerful prompt, then bring it back here.</p>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 space-y-4">
                     <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                     <div className="relative flex items-center">
                                        <Sparkles className="absolute left-3 w-5 h-5 text-muted-foreground" />
                                        <Input placeholder="Enter your course topic..." {...field} className="pl-10 text-base py-6 bg-background" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                       <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem className="space-y-3 bg-background rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                               <Clock className="text-muted-foreground"/>
                               <Label className="font-bold">How long should the course be?</Label>
                            </div>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex justify-between"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="short" />
                                  </FormControl>
                                  <Label className="font-normal">Short</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="medium" />
                                  </FormControl>
                                  <Label className="font-normal">Medium</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="long" />
                                  </FormControl>
                                  <Label className="font-normal">Long</Label>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    
                    <Button onClick={handleCopyToClipboard} className="w-full" size="lg">
                        <Copy />
                        Copy Prompt
                    </Button>
                </div>
                <div className="md:col-span-3">
                    <div className="h-full max-h-56 overflow-y-auto bg-background rounded-md p-4 border relative">
                         <p className="text-sm text-muted-foreground whitespace-pre-wrap font-code">
                            {finalPrompt}
                         </p>
                    </div>
                </div>
            </div>

            <div className="relative flex items-center text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border before:mr-4 after:ml-4">Or upload your own content</div>

            <div className="space-y-4 text-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div 
                        className="relative border-2 border-dashed border-muted/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors flex flex-col justify-center items-center h-40 data-[dragging-over=true]:border-primary data-[dragging-over=true]:bg-primary/10"
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        data-dragging-over={isDraggingOver}
                    >
                        <UploadCloud className="mx-auto h-8 w-8 text-primary" />
                        <p className="mt-2 font-semibold text-foreground">
                            {fileName || (isDraggingOver ? 'Drop the PDF here!' : 'Upload or Drag & Drop a PDF')}
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
                                            onBlur={onTextSubmit}
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
            </div>
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
