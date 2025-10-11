import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  db,
  expenses,
} from "@/db";
import { eq, and } from "drizzle-orm";

// Update expense schema
const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  date: z.string().datetime().optional(),
});

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const expenseId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateExpenseSchema.parse(body);

    // Update expense
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (validatedData.amount !== undefined) {
      updateData.amount = validatedData.amount.toString();
    }

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date);
    }

    const [expense] = await db
      .update(expenses)
      .set(updateData)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.userId, session.user.id)
        )
      )
      .returning();

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    // Convert amount from string to number for response
    const expenseWithAmount = {
      ...expense,
      amount: parseFloat(expense.amount),
    };

    return NextResponse.json({ expense: expenseWithAmount });

  } catch (error) {
    console.error("Expense PUT error:", error);

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

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const expenseId = params.id;

    // Delete expense
    const [expense] = await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.userId, session.user.id)
        )
      )
      .returning();

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Expense DELETE error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}