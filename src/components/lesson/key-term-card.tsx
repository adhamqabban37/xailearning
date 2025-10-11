"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from '../ui/icons';

interface KeyTermCardProps {
    term: string;
    definition: string;
}

export function KeyTermCard({ term, definition }: KeyTermCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div 
            className="perspective-1000 w-full h-48 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <AnimatePresence>
                <motion.div
                    className="relative w-full h-full"
                    key={isFlipped ? 'back' : 'front'}
                    initial={{ rotateY: isFlipped ? -180 : 0 }}
                    animate={{ rotateY: 0 }}
                    exit={{ rotateY: 180 }}
                    transition={{ duration: 0.5 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {!isFlipped ? (
                        <Card className="absolute w-full h-full flex flex-col items-center justify-center backface-hidden bg-secondary shadow-md">
                            <CardHeader className="text-center">
                                <CardDescription className="text-secondary-foreground/80">Key Term</CardDescription>
                                <CardTitle className="text-2xl text-secondary-foreground">{term}</CardTitle>
                            </CardHeader>
                        </Card>
                    ) : (
                        <Card className="absolute w-full h-full flex flex-col items-center justify-center backface-hidden bg-card shadow-md [transform:rotateY(180deg)]">
                            <CardContent className="text-center p-6">
                                <p className="text-muted-foreground">{definition}</p>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Add this to your globals.css to make the flip animation work
/*
.perspective-1000 {
  perspective: 1000px;
}
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
*/
