
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lesson } from "@/lib/types";
import { LightbulbIcon } from "../ui/icons";
import { Clock } from "lucide-react";

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
                        <CardDescription className="flex items-center gap-1.5 pt-1">
                            <Clock className="w-4 h-4"/>
                            Estimated time: {lesson.timeEstimateMinutes} minutes
                        </CardDescription>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{lesson.content_summary || "No content available for this step."}</p>
                     {lesson.key_points && lesson.key_points.length > 0 &&
                        <ul className='text-sm mt-4'>
                          {lesson.key_points.map((point, pIndex) => <li key={pIndex}>{point}</li>)}
                        </ul>
                      }
                </div>
            </CardContent>
        </Card>
    )
}
