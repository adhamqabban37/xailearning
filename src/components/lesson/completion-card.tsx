"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartyPopper, Trophy, Star, Award } from "lucide-react";
import { useEffect } from "react";

interface CompletionCardProps {
    onNextSession: () => void;
    onFinish: () => void;
    isCourseComplete: boolean;
    courseTitle?: string;
}

export function CompletionCard({ onNextSession, onFinish, isCourseComplete, courseTitle }: CompletionCardProps) {
    
    // Track achievement when course is completed
    useEffect(() => {
        if (isCourseComplete) {
            // Record achievement in localStorage
            const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
            const newAchievement = {
                id: `course-${Date.now()}`,
                type: 'course_completion',
                title: courseTitle || 'Course',
                completedAt: new Date().toISOString(),
                icon: '🏆'
            };
            achievements.push(newAchievement);
            localStorage.setItem('achievements', JSON.stringify(achievements));
            
            // Show celebration toast
            const event = new CustomEvent('show-toast', {
                detail: {
                    title: '🎉 Achievement Unlocked!',
                    description: `You've completed "${courseTitle || 'the course'}" - Added to your achievements!`
                }
            });
            window.dispatchEvent(event);
        }
    }, [isCourseComplete, courseTitle]);

    if (isCourseComplete) {
        return (
            <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 border-amber-400 dark:border-amber-600 shadow-2xl text-center completion-card animate-in fade-in-50 zoom-in-95 duration-700 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_50%)]" />
                <div className="absolute top-4 left-4 animate-pulse">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div className="absolute top-4 right-4 animate-pulse delay-100">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div className="absolute bottom-4 left-8 animate-pulse delay-200">
                    <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                </div>
                <div className="absolute bottom-4 right-8 animate-pulse delay-300">
                    <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                </div>

                <CardHeader className="pb-6 pt-8 relative z-10">
                    <div className="mx-auto relative mb-4">
                        <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" />
                        <div className="relative text-amber-600 dark:text-amber-400 rounded-full p-5 bg-amber-100 dark:bg-amber-900/50 w-fit mx-auto border-4 border-amber-300 dark:border-amber-700">
                            <Trophy className="w-16 h-16" />
                        </div>
                    </div>
                    
                    <CardTitle className="text-3xl md:text-4xl font-bold mt-4 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                        🎉 Congratulations! 🎉
                    </CardTitle>
                    
                    <div className="mt-4 space-y-3">
                        <p className="text-lg font-semibold text-foreground">
                            You've completed the entire course!
                        </p>
                        <CardDescription className="text-base leading-relaxed max-w-lg mx-auto">
                            <strong>Thank you for your dedication and commitment!</strong><br />
                            Your hard work and perseverance have paid off. You've mastered new skills, expanded your knowledge, and shown incredible determination.
                        </CardDescription>
                        
                        {/* Achievement Badge */}
                        <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 rounded-full px-6 py-3 mt-4">
                            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <span className="font-bold text-amber-800 dark:text-amber-300">Achievement Unlocked!</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground italic mt-3">
                            "The beautiful thing about learning is that no one can take it away from you."
                        </p>
                    </div>
                </CardHeader>
                
                <CardContent className="flex flex-col sm:flex-row justify-center gap-3 pt-2 pb-8 relative z-10">
                    <Button onClick={onFinish} size="lg" className="btn-gradient shadow-lg hover:shadow-xl transition-shadow">
                        🏠 Back to Home
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Session complete (not full course)
    return (
        <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 border-primary/30 shadow-lg text-center completion-card animate-in fade-in-50 zoom-in-95 duration-500">
            <CardHeader className="pb-4">
                <div className="mx-auto text-primary rounded-full p-4 bg-primary/20 w-fit mb-2 animate-bounce">
                    <PartyPopper className="w-12 h-12" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold mt-2">
                    ✨ Session Complete!
                </CardTitle>
                <CardDescription className="text-base mt-2">
                    Great job! You've finished all lessons in this session. Ready for the next one?
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Button onClick={onNextSession} size="lg" className="btn-gradient">
                    ▶️ Start Next Session
                </Button>
                <Button onClick={onFinish} variant="outline" size="lg">
                    ⏸️ Finish for Now
                </Button>
            </CardContent>
        </Card>
    );
}
