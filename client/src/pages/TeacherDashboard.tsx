import { Layout } from "@/components/Layout";
import { useDashboardStats, useStudentStats } from "@/hooks/use-teacher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, AlertCircle, Trophy, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function TeacherDashboard() {
  const { data: dashboard, isLoading: isLoadingDashboard } = useDashboardStats();
  const { data: students, isLoading: isLoadingStudents } = useStudentStats();

  const isLoading = isLoadingDashboard || isLoadingStudents;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Classroom Insights</h1>
          <p className="text-muted-foreground mt-1">Overview of student performance and vocabulary mastery.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Attempts" 
          value={dashboard?.systemStats.totalAttempts || 0} 
          icon={BookOpen} 
          className="bg-blue-500/10 text-blue-500"
        />
        <StatCard 
          title="Words Mastered" 
          value={dashboard?.systemStats.masteredCount || 0} 
          icon={Trophy} 
          className="bg-green-500/10 text-green-500"
        />
        <StatCard 
          title="Active Students" 
          value={students?.length || 0} 
          icon={Users} 
          className="bg-purple-500/10 text-purple-500"
        />
        <StatCard 
          title="Gatekeeper Words" 
          value={dashboard?.gatekeepers.length || 0} 
          icon={AlertCircle} 
          className="bg-red-500/10 text-red-500"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Roster</TabsTrigger>
          <TabsTrigger value="vocabulary">Problem Words</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Students with highest accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.leaderboard.slice(0, 5).map((student, i) => (
                    <div key={student.email} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${i === 0 ? "bg-yellow-500 text-black" : 
                            i === 1 ? "bg-gray-300 text-black" : 
                            i === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"}
                        `}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.email.split('@')[0]}</p>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-bold">{student.accuracy}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Class Mastery Distribution</CardTitle>
                <CardDescription>Learning vs Mastered Words</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Learning', value: dashboard?.systemStats.learningCount, color: '#3b82f6' },
                        { name: 'Mastered', value: dashboard?.systemStats.masteredCount, color: '#22c55e' },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'Learning', value: dashboard?.systemStats.learningCount, color: '#3b82f6' },
                          { name: 'Mastered', value: dashboard?.systemStats.masteredCount, color: '#22c55e' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Total Attempts</th>
                    <th className="px-6 py-4">Accuracy</th>
                    <th className="px-6 py-4">Mastered</th>
                    <th className="px-6 py-4">Learning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students?.map((student) => (
                    <tr key={student.userId} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{student.firstName || student.email}</td>
                      <td className="px-6 py-4">{student.totalAttempts}</td>
                      <td className="px-6 py-4">
                        <span className={`
                          font-bold
                          ${student.accuracy >= 80 ? 'text-green-500' : 
                            student.accuracy >= 60 ? 'text-yellow-500' : 'text-red-500'}
                        `}>
                          {student.accuracy}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-green-500">{student.masteredCount}</td>
                      <td className="px-6 py-4 text-blue-500">{student.learningCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vocabulary">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Gatekeeper Words
              </CardTitle>
              <CardDescription>
                Words with the lowest accuracy across all students. Consider reviewing these in class.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {dashboard?.gatekeepers.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                    <span className="font-bold text-lg">{item.word}</span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Accuracy</span>
                        <span className="text-red-500 font-bold">{item.accuracy}%</span>
                      </div>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${item.accuracy}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, className }: { title: string, value: number, icon: any, className: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${className}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
