import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  db,
  tasks,
  type NewTask,
  type Task
} from "@/db";
import { eq, and, desc, asc, gte, lte, ilike, isNull } from "drizzle-orm";

// Query parameters schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  completed: z.coerce.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().datetime().optional(),
  overdue: z.coerce.boolean().optional(),
  sort: z.enum(["dueDate", "priority", "title", "createdAt"]).default("dueDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// Create/Update task schema
const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().default(false),
});

// GET /api/tasks - Fetch user's tasks
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
    const now = new Date();

    // Build query conditions
    const conditions = [eq(tasks.userId, session.user.id)];

    if (query.search) {
      conditions.push(
        ilike(tasks.title, `%${query.search}%`)
      );
    }

    if (query.completed !== undefined) {
      conditions.push(eq(tasks.completed, query.completed));
    }

    if (query.priority) {
      const priorityMap = { low: 1, medium: 2, high: 3 };
      conditions.push(
        eq(tasks.priority, priorityMap[query.priority])
      );
    }

    if (query.dueDate) {
      conditions.push(
        gte(tasks.dueDate, new Date(query.dueDate))
      );
    }

    if (query.overdue) {
      conditions.push(
        and(
          lte(tasks.dueDate, now),
          eq(tasks.completed, false)
        )
      );
    }

    // Build query
    let dbQuery = db.select().from(tasks)
      .where(and(...conditions));

    // Apply sorting
    const sortColumn = {
      dueDate: tasks.dueDate,
      priority: tasks.priority,
      title: tasks.title,
      createdAt: tasks.createdAt,
    }[query.sort];

    // Handle null values in sorting
    const sortOrder = query.order === "asc" ? asc : desc;
    if (query.sort === "dueDate") {
      dbQuery = dbQuery.orderBy(
        sortOrder(sortColumn),
        isNull(sortColumn) // Put null values last
      );
    } else {
      dbQuery = dbQuery.orderBy(sortOrder(sortColumn));
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: tasks.id })
      .from(tasks)
      .where(and(...conditions));

    // Fetch paginated results
    const taskList = await dbQuery.limit(query.limit).offset(offset);

    // Convert priority numbers back to strings
    const priorityReverseMap = { 1: "low", 2: "medium", 3: "high" };
    const tasksWithPriority = taskList.map(task => ({
      ...task,
      priority: priorityReverseMap[task.priority as keyof typeof priorityReverseMap],
    }));

    return NextResponse.json({
      tasks: tasksWithPriority,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    });

  } catch (error) {
    console.error("Tasks GET error:", error);

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

// POST /api/tasks - Create new task
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
    const validatedData = taskSchema.parse(body);

    // Convert priority to number
    const priorityMap = { low: 1, medium: 2, high: 3 };

    // Create task
    const taskData: NewTask = {
      userId: session.user.id,
      title: validatedData.title,
      description: validatedData.description || null,
      priority: priorityMap[validatedData.priority],
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      completed: validatedData.completed,
    };

    const [task] = await db.insert(tasks)
      .values(taskData)
      .returning();

    // Convert priority back to string for response
    const priorityReverseMap = { 1: "low", 2: "medium", 3: "high" };
    const taskWithPriority = {
      ...task,
      priority: priorityReverseMap[task.priority as keyof typeof priorityReverseMap],
    };

    return NextResponse.json({ task: taskWithPriority }, { status: 201 });

  } catch (error) {
    console.error("Tasks POST error:", error);

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