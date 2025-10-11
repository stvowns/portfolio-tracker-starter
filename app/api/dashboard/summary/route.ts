import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  calendarEvents,
  tasks,
  expenses,
} from "@/db";
import { eq, and, gte, lte, sql, count, sum } from "drizzle-orm";

// GET /api/dashboard/summary - Fetch dashboard summary data
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get upcoming events count (next 7 days)
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const [upcomingEventsCount] = await db
      .select({ count: count() })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, session.user.id),
          gte(calendarEvents.startDate, now),
          lte(calendarEvents.startDate, sevenDaysFromNow)
        )
      );

    // Get pending tasks count
    const [pendingTasksCount] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.completed, false)
        )
      );

    // Get overdue tasks count
    const [overdueTasksCount] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.completed, false),
          lte(tasks.dueDate, now)
        )
      );

    // Get this month's expenses total
    const [monthlyExpensesResult] = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, session.user.id),
          gte(expenses.date, startOfMonth),
          lte(expenses.date, endOfMonth)
        )
      );

    const monthlyExpenses = parseFloat(monthlyExpensesResult?.total || "0");

    // Get expense categories for this month
    const categoryExpenses = await db
      .select({
        category: expenses.category,
        total: sum(expenses.amount),
        count: count(),
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, session.user.id),
          gte(expenses.date, startOfMonth),
          lte(expenses.date, endOfMonth)
        )
      )
      .groupBy(expenses.category)
      .orderBy(sql`sum(expenses.amount) DESC`);

    // Convert amount strings to numbers
    const categoryExpensesWithAmount = categoryExpenses.map(item => ({
      ...item,
      total: parseFloat(item.total),
    }));

    // Get upcoming events (next 5)
    const upcomingEvents = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, session.user.id),
          gte(calendarEvents.startDate, now)
        )
      )
      .orderBy(sql`calendar_events.start_date ASC`)
      .limit(5);

    // Get recent tasks (5 most recent)
    const recentTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id))
      .orderBy(sql`tasks.created_at DESC`)
      .limit(5);

    // Convert priority numbers to strings for tasks
    const priorityReverseMap = { 1: "low", 2: "medium", 3: "high" };
    const tasksWithPriority = recentTasks.map(task => ({
      ...task,
      priority: priorityReverseMap[task.priority as keyof typeof priorityReverseMap],
    }));

    // Get recent expenses (5 most recent)
    const recentExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, session.user.id))
      .orderBy(sql`expenses.date DESC`)
      .limit(5);

    // Convert amount from string to number for expenses
    const expensesWithAmount = recentExpenses.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount),
    }));

    // Get weekly task completion trend
    const weeklyTaskStats = await db
      .select({
        date: sql<string>`DATE(tasks.created_at)`.as("date"),
        completed: count(sql`CASE WHEN tasks.completed = true THEN 1 END`).mapWith(Number),
        pending: count(sql`CASE WHEN tasks.completed = false THEN 1 END`).mapWith(Number),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          gte(sql`tasks.created_at`, startOfWeek)
        )
      )
      .groupBy(sql`DATE(tasks.created_at)`)
      .orderBy(sql`DATE(tasks.created_at)`);

    // Get monthly expense trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const monthlyExpenseTrend = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', expenses.date)::date`.as("month"),
        total: sum(expenses.amount).mapWith(Number),
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, session.user.id),
          gte(expenses.date, sixMonthsAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', expenses.date)`)
      .orderBy(sql`DATE_TRUNC('month', expenses.date)`);

    return NextResponse.json({
      stats: {
        upcomingEvents: upcomingEventsCount?.count || 0,
        pendingTasks: pendingTasksCount?.count || 0,
        overdueTasks: overdueTasksCount?.count || 0,
        monthlyExpenses,
      },
      categoryExpenses: categoryExpensesWithAmount,
      upcomingEvents,
      recentTasks: tasksWithPriority,
      recentExpenses: expensesWithAmount,
      weeklyTaskStats,
      monthlyExpenseTrend,
    });

  } catch (error) {
    console.error("Dashboard summary GET error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}