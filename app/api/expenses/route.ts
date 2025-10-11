import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  db,
  expenses,
  type NewExpense,
  type Expense
} from "@/db";
import { eq, and, desc, asc, gte, lte, ilike, sql } from "drizzle-orm";

// Query parameters schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sort: z.enum(["date", "amount", "category", "createdAt"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Create/Update expense schema
const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required").max(100),
  description: z.string().optional(),
  date: z.string().datetime("Invalid date format"),
});

// GET /api/expenses - Fetch user's expenses
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const offset = (query.page - 1) * query.limit;

    // Build query conditions
    const conditions = [eq(expenses.userId, session.user.id)];

    if (query.search) {
      conditions.push(
        ilike(expenses.description, `%${query.search}%`)
      );
    }

    if (query.category) {
      conditions.push(
        eq(expenses.category, query.category)
      );
    }

    if (query.minAmount !== undefined) {
      conditions.push(
        sql`${expenses.amount} >= ${query.minAmount}`
      );
    }

    if (query.maxAmount !== undefined) {
      conditions.push(
        sql`${expenses.amount} <= ${query.maxAmount}`
      );
    }

    if (query.startDate) {
      conditions.push(
        gte(expenses.date, new Date(query.startDate))
      );
    }

    if (query.endDate) {
      conditions.push(
        lte(expenses.date, new Date(query.endDate))
      );
    }

    // Build query
    let dbQuery = db.select().from(expenses)
      .where(and(...conditions));

    // Apply sorting
    const sortColumn = {
      date: expenses.date,
      amount: expenses.amount,
      category: expenses.category,
      createdAt: expenses.createdAt,
    }[query.sort];

    const sortOrder = query.order === "asc" ? asc : desc;
    dbQuery = dbQuery.orderBy(sortOrder(sortColumn));

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: expenses.id })
      .from(expenses)
      .where(and(...conditions));

    // Fetch paginated results
    const expenseList = await dbQuery.limit(query.limit).offset(offset);

    // Convert amount from string to number
    const expensesWithAmount = expenseList.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount),
    }));

    return NextResponse.json({
      expenses: expensesWithAmount,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    });

  } catch (error) {
    console.error("Expenses GET error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    // Create expense
    const expenseData: NewExpense = {
      userId: session.user.id,
      amount: validatedData.amount.toString(),
      category: validatedData.category,
      description: validatedData.description || null,
      date: new Date(validatedData.date),
    };

    const [expense] = await db.insert(expenses)
      .values(expenseData)
      .returning();

    // Convert amount from string to number for response
    const expenseWithAmount = {
      ...expense,
      amount: parseFloat(expense.amount),
    };

    return NextResponse.json({ expense: expenseWithAmount }, { status: 201 });

  } catch (error) {
    console.error("Expenses POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}