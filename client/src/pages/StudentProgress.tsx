import { Layout } from "@/components/Layout";
import { useStudentProgress } from "@/hooks/use-student";
import { Loader2, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function StudentProgress() {
  const { data: progressList, isLoading } = useStudentProgress();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const totalWords = progressList?.length || 0;
  const masteredWords = progressList?.filter(p => (p.progress.level || 0) > 5).length || 0;
  const learningWords = totalWords - masteredWords;
  const masteryRate = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Your Progress</h1>
        <p className="text-muted-foreground mt-1">Track your retention and mastery over time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mastery Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{masteryRate}%</div>
            <Progress value={masteryRate} className="mt-3 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Words Mastered</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{masteredWords}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {totalWords} words</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Learning</CardTitle>
            <Loader2 className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{learningWords}</div>
            <p className="text-xs text-muted-foreground mt-1">currently in rotation</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Word</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Next Review</th>
                <th className="px-6 py-4 text-right">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {progressList?.map(({ word, progress }) => {
                const isMastered = (progress.level || 0) > 5;
                const nextReview = progress.nextReviewDate ? new Date(progress.nextReviewDate) : null;
                const isDue = nextReview && nextReview < new Date();

                return (
                  <tr key={word.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{word.term}</td>
                    <td className="px-6 py-4">
                      {isMastered ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          Mastered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          Learning
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${Math.min((progress.level || 1) * 10, 100)}%` }} 
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">Lvl {progress.level}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {isDue ? (
                          <span className="text-red-400 font-medium">Review Now</span>
                        ) : nextReview ? (
                          format(nextReview, "MMM d, h:mm a")
                        ) : (
                          "New"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                      {progress.totalCorrect}/{progress.totalAttempts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
