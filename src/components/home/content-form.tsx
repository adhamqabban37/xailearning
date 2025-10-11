"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, AlertCircle, UploadCloud } from "lucide-react";
import { generateCourseFromText } from "@/app/actions";
import type { Course } from "@/lib/types";

const formSchema = z.object({
  text: z.string().min(100, {
    message: "Please enter at least 100 characters.",
  }),
});

interface ContentFormProps {
  onCourseGenerated: (course: Course) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function ContentForm({ onCourseGenerated, setIsLoading, isLoading }: ContentFormProps) {
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Paste Text</TabsTrigger>
          <TabsTrigger value="pdf" disabled><UploadCloud className="mr-2 h-4 w-4" />Upload PDF</TabsTrigger>
        </TabsList>
        <TabsContent value="text">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
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
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Crafting Your Course...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="pdf">
            <div className="mt-4 text-center text-muted-foreground p-8 border-dashed border-2 rounded-lg">
                <p>PDF upload functionality is coming soon!</p>
                <p className="text-sm">For now, please copy and paste the text from your PDF into the 'Paste Text' tab.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
