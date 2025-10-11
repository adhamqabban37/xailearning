import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Step } from "@/lib/types";
import { LightbulbIcon } from "../ui/icons";

interface ConceptCardProps {
    step: Step;
}

export function ConceptCard({ step }: ConceptCardProps) {
    return (
        <Card className="bg-background shadow-sm">
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="text-accent">
                    <LightbulbIcon className="w-8 h-8"/>
                </div>
                <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    {step.timeEstimateMinutes && (
                        <CardDescription>
                            Estimated time: {step.timeEstimateMinutes} minutes
                        </CardDescription>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    {step.content || "No content available for this step."}
                </div>
            </CardContent>
        </Card>
    )
}
