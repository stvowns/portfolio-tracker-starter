"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle, AlertCircle, DollarSign } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface DashboardStats {
  upcomingEvents: number;
  pendingTasks: number;
  overdueTasks: number;
  monthlyExpenses: number;
}

export function SectionCards() {
  const [stats, setStats] = useState<DashboardStats>({
    upcomingEvents: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    monthlyExpenses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/summary");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                --
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Upcoming Events</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.upcomingEvents}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Calendar className="size-4" />
              Next 7 days
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Events scheduled <Calendar className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Your upcoming calendar events
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pendingTasks}
          </CardTitle>
          <CardAction>
            <Badge variant={stats.pendingTasks > 5 ? "destructive" : "outline"}>
              <AlertCircle className="size-4" />
              {stats.pendingTasks > 5 ? "High" : "Normal"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tasks to complete <AlertCircle className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.overdueTasks > 0 && `${stats.overdueTasks} overdue • `}
            Active tasks
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Overdue Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.overdueTasks}
          </CardTitle>
          <CardAction>
            <Badge variant={stats.overdueTasks > 0 ? "destructive" : "outline"}>
              <AlertCircle className="size-4" />
              {stats.overdueTasks > 0 ? "Action needed" : "Clear"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.overdueTasks > 0 ? "Requires attention" : "All caught up"}
            {stats.overdueTasks > 0 ? <AlertCircle className="size-4" /> : <CheckCircle className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Tasks past their due date
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Monthly Expenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.monthlyExpenses)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <DollarSign className="size-4" />
              This month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total spending <DollarSign className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Current month expenses
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
