"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartyPopper } from "lucide-react";

interface CompletionCardProps {
    onNextSession: () => void;
    onFinish: () => void;
    isCourseComplete: boolean;
}

export function CompletionCard({ onNextSession, onFinish, isCourseComplete }: CompletionCardProps) {
    return (
        <Card className="bg-secondary/50 border-secondary shadow-sm text-center">
            <CardHeader>
                <div className="mx-auto text-primary rounded-full p-3 bg-primary/10 w-fit">
                    <PartyPopper className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4">{isCourseComplete ? 'Course Complete!' : 'Session Complete!'}</CardTitle>
                <CardDescription>{isCourseComplete ? "Congratulations! You've completed the entire course." : "Great job! You've finished this study session."}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
                {isCourseComplete ? (
                    <Button onClick={onFinish} size="lg">Back to Home</Button>
                ) : (
                    <>
                        <Button onClick={onNextSession} size="lg">Start Next Session</Button>
                        <Button onClick={onFinish} variant="outline">Finish for Now</Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
