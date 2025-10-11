import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  db,
  tasks,
} from "@/db";
import { eq, and } from "drizzle-orm";

// Update task schema
const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completed: z.boolean().optional(),
});

// PUT /api/tasks/[id] - Update task
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

    const taskId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Update task
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (validatedData.priority) {
      const priorityMap = { low: 1, medium: 2, high: 3 };
      updateData.priority = priorityMap[validatedData.priority];
    }

    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }

    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, session.user.id)
        )
      )
      .returning();

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Convert priority back to string for response
    const priorityReverseMap = { 1: "low", 2: "medium", 3: "high" };
    const taskWithPriority = {
      ...task,
      priority: priorityReverseMap[task.priority as keyof typeof priorityReverseMap],
    };

    return NextResponse.json({ task: taskWithPriority });

  } catch (error) {
    console.error("Task PUT error:", error);

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

// DELETE /api/tasks/[id] - Delete task
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

    const taskId = params.id;

    // Delete task
    const [task] = await db
      .delete(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, session.user.id)
        )
      )
      .returning();

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Task DELETE error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}