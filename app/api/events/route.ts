import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  db,
  calendarEvents,
  type NewCalendarEvent,
  type CalendarEvent
} from "@/db";
import { eq, and, desc, asc, gte, lte, ilike } from "drizzle-orm";

// Query parameters schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  upcoming: z.coerce.boolean().optional(),
  sort: z.enum(["startDate", "title", "createdAt"]).default("startDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// Create/Update event schema
const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  location: z.string().max(500).optional(),
});

// GET /api/events - Fetch user's calendar events
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

    // Build query
    let dbQuery = db.select().from(calendarEvents)
      .where(eq(calendarEvents.userId, session.user.id));

    // Apply filters
    const conditions = [eq(calendarEvents.userId, session.user.id)];

    if (query.search) {
      conditions.push(
        ilike(calendarEvents.title, `%${query.search}%`)
      );
    }

    if (query.startDate) {
      conditions.push(
        gte(calendarEvents.startDate, new Date(query.startDate))
      );
    }

    if (query.endDate) {
      conditions.push(
        lte(calendarEvents.startDate, new Date(query.endDate))
      );
    }

    if (query.upcoming) {
      conditions.push(
        gte(calendarEvents.startDate, now)
      );
    }

    dbQuery = db.select().from(calendarEvents)
      .where(and(...conditions));

    // Apply sorting
    const sortColumn = {
      startDate: calendarEvents.startDate,
      title: calendarEvents.title,
      createdAt: calendarEvents.createdAt,
    }[query.sort];

    const sortOrder = query.order === "asc" ? asc : desc;
    dbQuery = dbQuery.orderBy(sortOrder(sortColumn));

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: calendarEvents.id })
      .from(calendarEvents)
      .where(and(...conditions));

    // Fetch paginated results
    const events = await dbQuery.limit(query.limit).offset(offset);

    return NextResponse.json({
      events,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    });

  } catch (error) {
    console.error("Events GET error:", error);

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

// POST /api/events - Create new calendar event
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
    const validatedData = eventSchema.parse(body);

    // Create event
    const eventData: NewCalendarEvent = {
      userId: session.user.id,
      title: validatedData.title,
      description: validatedData.description || null,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      location: validatedData.location || null,
    };

    const [event] = await db.insert(calendarEvents)
      .values(eventData)
      .returning();

    return NextResponse.json({ event }, { status: 201 });

  } catch (error) {
    console.error("Events POST error:", error);

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