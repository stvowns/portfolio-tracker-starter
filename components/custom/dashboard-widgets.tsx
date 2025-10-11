"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Clock, DollarSign, AlertCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
}

interface DashboardWidgetsData {
  upcomingEvents: Event[];
  recentTasks: Task[];
  recentExpenses: Expense[];
}

export function DashboardWidgets() {
  const [data, setData] = useState<DashboardWidgetsData>({
    upcomingEvents: [],
    recentTasks: [],
    recentExpenses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard/summary");
        if (response.ok) {
          const dashboardData = await response.json();
          setData({
            upcomingEvents: dashboardData.upcomingEvents || [],
            recentTasks: dashboardData.recentTasks || [],
            recentExpenses: dashboardData.recentExpenses || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
            <CardDescription>Your next scheduled events</CardDescription>
          </div>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.startDate)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground truncate">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {data.upcomingEvents.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{data.upcomingEvents.length - 3} more events
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming events</p>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="mt-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Event
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Recent Tasks</CardTitle>
            <CardDescription>Your latest tasks</CardDescription>
          </div>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.recentTasks.length > 0 ? (
            <div className="space-y-3">
              {data.recentTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className={`h-2 w-2 rounded-full ${
                        isOverdue(task.dueDate)
                          ? "bg-red-500"
                          : task.priority === "high"
                            ? "bg-orange-500"
                            : "bg-blue-500"
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${task.completed ? "line-through text-muted-foreground" : "font-medium"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className={`text-xs ${isOverdue(task.dueDate) ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {formatDate(task.dueDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {data.recentTasks.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{data.recentTasks.length - 3} more tasks
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tasks yet</p>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="mt-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Task
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Recent Expenses</CardTitle>
            <CardDescription>Your latest spending</CardDescription>
          </div>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {data.recentExpenses.slice(0, 3).map((expense) => (
                <div key={expense.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {expense.category}
                      </p>
                      <p className="text-sm font-semibold">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                    {expense.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {expense.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>
              ))}
              {data.recentExpenses.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{data.recentExpenses.length - 3} more expenses
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No expenses recorded</p>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="mt-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Expense
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}