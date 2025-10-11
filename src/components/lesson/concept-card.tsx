import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lesson } from "@/lib/types";
import { LightbulbIcon } from "../ui/icons";

interface ConceptCardProps {
    lesson: Lesson;
}

export function ConceptCard({ lesson }: ConceptCardProps) {
    return (
        <Card className="bg-background shadow-sm">
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="text-accent">
                    <LightbulbIcon className="w-8 h-8"/>
                </div>
                <div>
                    <CardTitle className="text-lg">{lesson.lesson_title}</CardTitle>
                    {lesson.timeEstimateMinutes && (
                        <CardDescription>
                            Estimated time: {lesson.timeEstimateMinutes} minutes
                        </CardDescription>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    {lesson.content_summary || "No content available for this step."}
                </div>
            </CardContent>
        </Card>
    )
}
