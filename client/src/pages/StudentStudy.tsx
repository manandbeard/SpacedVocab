import { Layout } from "@/components/Layout";
import { useReviewQueue, useRecordAttempt } from "@/hooks/use-student";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, RotateCw } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentStudy() {
  const { data: queue, isLoading, refetch } = useReviewQueue();
  const { mutate: recordAttempt, isPending } = useRecordAttempt();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Reset state when queue changes
  useEffect(() => {
    if (queue && queue.length > 0) {
      setCurrentIndex(0);
      setSessionComplete(false);
      setIsFlipped(false);
    } else if (queue && queue.length === 0) {
      setSessionComplete(true);
    }
  }, [queue]);

  const currentItem = queue?.[currentIndex];

  const handleConfidence = (confidence: number) => {
    if (!currentItem) return;

    recordAttempt({
      wordId: currentItem.word.id,
      questionType: "flashcard",
      isCorrect: confidence >= 3,
      confidence,
      responseTimeSec: 0, // In a real app we'd track time
    });

    if (currentIndex < (queue?.length || 0) - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    } else {
      setSessionComplete(true);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!queue || queue.length === 0 || sessionComplete) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center mt-20">
          <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">All Caught Up!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            You've reviewed all your due cards for now. Great job keeping your streak alive.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => window.location.href = "/progress"} variant="outline">
              View Progress
            </Button>
            <Button onClick={() => refetch()} className="gap-2">
              <RotateCw className="w-4 h-4" /> Check for New Cards
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-display font-bold">Study Session</h1>
          <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>

        <div className="relative h-[400px] [perspective:1000px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.word.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full relative [transform-style:preserve-3d] cursor-pointer"
              onClick={() => !isFlipped && setIsFlipped(true)}
            >
              <motion.div 
                className="absolute inset-0 [backface-visibility:hidden]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              >
                {/* FRONT OF CARD */}
                <Card className="h-full flex flex-col items-center justify-center p-8 bg-card border-2 border-border shadow-xl hover:border-primary/50 transition-colors">
                  <p className="text-sm text-muted-foreground uppercase tracking-widest mb-4">Term</p>
                  <h2 className="text-5xl font-bold text-center break-words">{currentItem.word.term}</h2>
                  <p className="mt-8 text-sm text-muted-foreground animate-pulse">Click to reveal definition</p>
                </Card>
              </motion.div>

              <motion.div 
                className="absolute inset-0 [backface-visibility:hidden]"
                initial={{ rotateY: 180 }}
                animate={{ rotateY: isFlipped ? 0 : 180 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ rotateY: 180 }}
              >
                {/* BACK OF CARD */}
                <Card className="h-full flex flex-col items-center justify-center p-8 bg-card border-2 border-primary/20 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                  <p className="text-sm text-primary uppercase tracking-widest mb-4">Definition</p>
                  <p className="text-2xl text-center leading-relaxed mb-6">{currentItem.word.definition}</p>
                  
                  {currentItem.word.partOfSpeech && (
                    <span className="px-3 py-1 bg-muted rounded text-xs text-muted-foreground mb-4">
                      {currentItem.word.partOfSpeech}
                    </span>
                  )}
                  
                  {currentItem.word.exampleSentence && (
                    <div className="bg-muted/50 p-4 rounded-lg w-full mt-auto">
                      <p className="text-sm italic text-muted-foreground text-center">"{currentItem.word.exampleSentence}"</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CONTROLS */}
        <div className="mt-8 h-24 flex items-center justify-center">
          {!isFlipped ? (
            <Button size="lg" className="w-full max-w-xs text-lg" onClick={() => setIsFlipped(true)}>
              Show Answer
            </Button>
          ) : (
            <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">How well did you know this?</p>
              <div className="grid grid-cols-5 gap-2 sm:gap-4 w-full">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    disabled={isPending}
                    onClick={() => handleConfidence(level)}
                    className={`
                      h-14 font-bold text-lg transition-all hover:-translate-y-1
                      ${level === 1 && "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20"}
                      ${level === 2 && "bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border-orange-500/20"}
                      ${level === 3 && "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black border-yellow-500/20"}
                      ${level === 4 && "bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border-blue-500/20"}
                      ${level === 5 && "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border-green-500/20"}
                    `}
                    variant="outline"
                  >
                    {level}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between w-full px-2 mt-2 text-xs text-muted-foreground">
                <span>Forgot</span>
                <span>Perfect</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
