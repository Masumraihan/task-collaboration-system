"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetProjectStatsQuery } from "@/features/projects/projectApi";
import { useGetTaskStatsQuery } from "@/features/tasks/taskApi";
import { useGetRecentActivitiesQuery } from "@/features/projects/projectApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Users,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

const PRIORITY_COLORS = { high: "#ef4444", medium: "#f97316", low: "#22c55e" };
const STATUS_COLORS = ["#6366f1", "#f97316", "#22c55e", "#ef4444"];

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: projectStats, isLoading: loadingProjects } = useGetProjectStatsQuery();
  const { data: taskStats, isLoading: loadingTasks } = useGetTaskStatsQuery();
  const { data: activitiesData, isLoading: loadingActivities } = useGetRecentActivitiesQuery();

  const ps = projectStats?.data;
  const ts = taskStats?.data;
  const activities = activitiesData?.data || [];

  const priorityChartData = ts
    ? [
        { name: "High", value: ts.byPriority.high, fill: PRIORITY_COLORS.high },
        { name: "Medium", value: ts.byPriority.medium, fill: PRIORITY_COLORS.medium },
        { name: "Low", value: ts.byPriority.low, fill: PRIORITY_COLORS.low },
      ]
    : [];

  const statusChartData = ts
    ? [
        { name: "Todo", value: ts.todo },
        { name: "In Progress", value: ts.inProgress },
        { name: "Completed", value: ts.completed },
        { name: "Overdue", value: ts.overdue },
      ]
    : [];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>
          Good morning, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className='text-muted-foreground'>
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          title='Total Projects'
          value={ps?.total}
          icon={<FolderKanban className='h-4 w-4' />}
          sub={`${ps?.active ?? 0} active`}
          loading={loadingProjects}
          color='text-blue-500'
        />
        <StatCard
          title='Total Tasks'
          value={ts?.total}
          icon={<CheckSquare className='h-4 w-4' />}
          sub={`${ts?.completed ?? 0} completed`}
          loading={loadingTasks}
          color='text-green-500'
        />
        <StatCard
          title='Pending Tasks'
          value={ts ? ts.todo + ts.inProgress : undefined}
          icon={<Clock className='h-4 w-4' />}
          sub={`${ts?.inProgress ?? 0} in progress`}
          loading={loadingTasks}
          color='text-orange-500'
        />
        <StatCard
          title='Overdue Tasks'
          value={ts?.overdue}
          icon={<AlertTriangle className='h-4 w-4' />}
          sub='needs attention'
          loading={loadingTasks}
          color='text-red-500'
        />
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <Skeleton className='h-48 w-full' />
            ) : (
              <ResponsiveContainer width='100%' height={200}>
                <BarChart data={priorityChartData} barSize={40}>
                  <XAxis dataKey='name' axisLine={false} tickLine={false} className='text-xs' />
                  <YAxis axisLine={false} tickLine={false} className='text-xs' />
                  <Tooltip />
                  <Bar dataKey='value' radius={[4, 4, 0, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <Skeleton className='h-48 w-full' />
            ) : (
              <ResponsiveContainer width='100%' height={200}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx='50%'
                    cy='50%'
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey='value'
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' /> Project Progress
            </CardTitle>
            <CardDescription>Active projects completion rate</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {loadingProjects ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)
            ) : ps?.projectSummaries.length ? (
              ps.projectSummaries.map((project) => (
                <div key={project.id} className='space-y-1'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='font-medium truncate max-w-[60%]'>{project.name}</span>
                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground text-xs'>
                        {project.daysUntilDeadline > 0
                          ? `${project.daysUntilDeadline}d left`
                          : "Overdue"}
                      </span>
                      <span className='font-semibold'>{project.completionPercentage}%</span>
                    </div>
                  </div>
                  <Progress value={project.completionPercentage} className='h-2' />
                  <p className='text-xs text-muted-foreground'>
                    {project.completedTasks}/{project.totalTasks} tasks completed
                  </p>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground text-center py-4'>No active projects</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <Activity className='h-4 w-4' /> Recent Activities
            </CardTitle>
            <CardDescription>Latest 10 system events</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full mb-2' />
              ))
            ) : activities.length ? (
              <div className='space-y-3 max-h-64 overflow-y-auto pr-1'>
                {activities.map((activity) => (
                  <div key={activity.id} className='flex items-start gap-3'>
                    <div className='w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5'>
                      <Zap className='w-3 h-3 text-muted-foreground' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm leading-snug'>{activity.description}</p>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {formatDistanceToNow(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground text-center py-4'>No recent activities</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines + High Priority Tasks */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <Clock className='h-4 w-4' /> Upcoming Deadlines
            </CardTitle>
            <CardDescription>Tasks due within 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <Skeleton className='h-32 w-full' />
            ) : ts?.upcomingDeadlines.length ? (
              <div className='space-y-2'>
                {ts.upcomingDeadlines.map((task: any) => (
                  <div
                    key={task.id}
                    className='flex items-center justify-between py-2 border-b last:border-0'
                  >
                    <div>
                      <p className='text-sm font-medium'>{task.title}</p>
                      <p className='text-xs text-muted-foreground'>{task.project?.name}</p>
                    </div>
                    <div className='text-right'>
                      <Badge
                        variant={task.priority === "HIGH" ? "destructive" : "secondary"}
                        className='text-xs'
                      >
                        {task.priority}
                      </Badge>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground text-center py-4'>
                No upcoming deadlines
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4 text-red-500' /> High Priority Tasks
            </CardTitle>
            <CardDescription>Urgent tasks needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <Skeleton className='h-32 w-full' />
            ) : ts?.highPriorityTasks.length ? (
              <div className='space-y-2'>
                {ts.highPriorityTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className='flex items-center justify-between py-2 border-b last:border-0'
                  >
                    <div>
                      <p className='text-sm font-medium'>{task.title}</p>
                      <p className='text-xs text-muted-foreground'>{task.project?.name}</p>
                    </div>
                    <Badge
                      variant={task.status === "TODO" ? "outline" : "secondary"}
                      className='text-xs'
                    >
                      {task.status?.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground text-center py-4'>
                No high priority tasks
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  sub,
  loading,
  color,
}: {
  title: string;
  value?: number;
  icon: React.ReactNode;
  sub: string;
  loading: boolean;
  color: string;
}) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between mb-2'>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <div className={cn("p-2 rounded-md bg-muted", color)}>{icon}</div>
        </div>
        {loading ? (
          <Skeleton className='h-8 w-16' />
        ) : (
          <p className='text-3xl font-bold'>{value ?? 0}</p>
        )}
        <p className='text-xs text-muted-foreground mt-1'>{sub}</p>
      </CardContent>
    </Card>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
