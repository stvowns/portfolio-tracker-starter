"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ExpenseData {
  month: string;
  total: number;
}

interface CategoryExpense {
  category: string;
  total: number;
  count: number;
}

interface DashboardData {
  monthlyExpenseTrend: ExpenseData[];
  categoryExpenses: CategoryExpense[];
}

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig;

export function ExpenseChart() {
  const [data, setData] = useState<DashboardData>({
    monthlyExpenseTrend: [],
    categoryExpenses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        const response = await fetch("/api/dashboard/summary");
        if (response.ok) {
          const dashboardData = await response.json();
          setData({
            monthlyExpenseTrend: dashboardData.monthlyExpenseTrend || [],
            categoryExpenses: dashboardData.categoryExpenses || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch expense data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Expense Trends</CardTitle>
          <CardDescription>Loading expense data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.monthlyExpenseTrend.map((item) => ({
    month: formatMonth(item.month),
    amount: item.total,
  }));

  const topCategories = data.categoryExpenses
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Monthly Expense Trends</CardTitle>
          <CardDescription>Your spending over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Expenses"
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="amount"
                  fill="var(--color-expenses)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] w-full flex items-center justify-center">
              <div className="text-muted-foreground">No expense data available</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
          <CardDescription>Your highest spending categories this month</CardDescription>
        </CardHeader>
        <CardContent>
          {topCategories.length > 0 ? (
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{category.category}</span>
                    <span className="text-xs text-muted-foreground">
                      ({category.count} items)
                    </span>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(category.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] w-full flex items-center justify-center">
              <div className="text-muted-foreground">No category data available</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}