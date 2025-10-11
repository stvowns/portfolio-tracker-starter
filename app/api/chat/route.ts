import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  db,
  calendarEvents,
  tasks,
  expenses,
  type NewCalendarEvent,
  type NewTask,
  type NewExpense
} from "@/db";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  aiResponseSchema,
  chatRequestSchema,
  type AIResponse,
  type CreateAction,
  type UpdateAction,
  type DeleteAction,
  type ListAction
} from "@/lib/validations/chat";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the AI
const getSystemPrompt = () => {
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const currentDateTime = new Date().toISOString(); // Full ISO format

  return `You are an AI assistant for a personal planning application that helps users manage their calendar events, tasks, and expenses.

Current date: ${currentDate}
Current datetime: ${currentDateTime}

When users ask for help, you should:
1. Understand their natural language request
2. Extract the relevant information (dates, titles, amounts, etc.)
3. Use the current date (${currentDate}) as reference for relative dates like "today", "tomorrow", "next week", etc.
4. Return a structured JSON response with the actions to perform

You can perform these actions:
- Create calendar events, tasks, or expenses
- Update existing items
- Delete items
- List items with optional filters

IMPORTANT: Your response must be EXACTLY valid JSON with these specifications:

1. For calendar events, use "type": "calendar_event"
2. For tasks, use "type": "task"
3. For expenses, use "type": "expense"
4. For dates, use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
5. For priorities, use: "low", "medium", or "high" (strings, not numbers)
6. For task completion, use boolean values

Response format:
{
  "message": "A friendly message explaining what you understood and what actions you're taking",
  "actions": [
    {
      "action": "create|update|delete|list",
      "type": "calendar_event|task|expense",
      "data": { ... } // for create/update
      "id": "uuid" // for update/delete
    }
  ]
}

Examples:
User: "Add a meeting with John tomorrow at 2pm"
Response: {
  "message": "I'll create a calendar event for your meeting with John tomorrow at 2pm.",
  "actions": [{
    "action": "create",
    "type": "calendar_event",
    "data": {
      "type": "calendar_event",
      "title": "Meeting with John",
      "startDate": "2025-10-12T14:00:00Z",
      "endDate": "2025-10-12T15:00:00Z"
    }
  }]
}

User: "Show me my upcoming tasks"
Response: {
  "message": "Here are your upcoming tasks:",
  "actions": [{
    "action": "list",
    "type": "task",
    "filters": { "completed": false }
  }]
}

CRITICAL: Always return valid JSON. Never return anything outside the JSON structure. Always be helpful, clear, and confirm what actions you're taking.`;
};

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

    // Parse and validate request
    const body = await request.json();
    const validatedData = chatRequestSchema.parse(body);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: validatedData.message }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const aiResponseContent = completion.choices[0]?.message?.content;
    if (!aiResponseContent) {
      throw new Error("No response from OpenAI");
    }

    // Parse and validate AI response
    let aiResponse: AIResponse;
    let parsedResponse: any;

    try {
      parsedResponse = JSON.parse(aiResponseContent);
      console.log("AI Response:", JSON.stringify(parsedResponse, null, 2));
      aiResponse = aiResponseSchema.parse(parsedResponse);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      console.error("Raw AI response:", aiResponseContent);

      // Try to extract just the message if validation fails
      const fallbackResponse = {
        message: parsedResponse?.message || "I had trouble understanding your request. Could you please rephrase it?",
        actions: []
      };

      return NextResponse.json({
        message: fallbackResponse.message,
        actions: fallbackResponse.actions,
        parseError: true
      });
    }

    // Execute actions
    const results = [];
    for (const action of aiResponse.actions) {
      try {
        const result = await executeAction(action, session.user.id);
        results.push(result);
      } catch (error) {
        console.error("Failed to execute action:", error);
        results.push({
          action,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      message: aiResponse.message,
      actions: results,
    });

  } catch (error) {
    console.error("Chat API error:", error);

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

async function executeAction(action: any, userId: string) {
  switch (action.action) {
    case "create":
      return await executeCreateAction(action as CreateAction, userId);
    case "update":
      return await executeUpdateAction(action as UpdateAction, userId);
    case "delete":
      return await executeDeleteAction(action as DeleteAction, userId);
    case "list":
      return await executeListAction(action as ListAction, userId);
    default:
      throw new Error(`Unknown action: ${action.action}`);
  }
}

async function executeCreateAction(action: CreateAction, userId: string) {
  switch (action.data.type) {
    case "calendar_event": {
      const eventData: NewCalendarEvent = {
        userId,
        title: action.data.title,
        description: action.data.description || null,
        startDate: new Date(action.data.startDate),
        endDate: new Date(action.data.endDate),
        location: action.data.location || null,
      };

      const [result] = await db.insert(calendarEvents)
        .values(eventData)
        .returning();

      return { action: "created", type: "calendar_event", data: result };
    }

    case "task": {
      const priorityMap = { low: 1, medium: 2, high: 3 };
      const taskData: NewTask = {
        userId,
        title: action.data.title,
        description: action.data.description || null,
        priority: priorityMap[action.data.priority as keyof typeof priorityMap],
        dueDate: action.data.dueDate ? new Date(action.data.dueDate) : null,
        completed: false,
      };

      const [result] = await db.insert(tasks)
        .values(taskData)
        .returning();

      return { action: "created", type: "task", data: result };
    }

    case "expense": {
      const expenseData: NewExpense = {
        userId,
        amount: action.data.amount.toString(),
        category: action.data.category,
        description: action.data.description || null,
        date: new Date(action.data.date),
      };

      const [result] = await db.insert(expenses)
        .values(expenseData)
        .returning();

      return { action: "created", type: "expense", data: result };
    }

    default:
      throw new Error(`Unknown create type: ${action.data.type}`);
  }
}

async function executeUpdateAction(action: UpdateAction, userId: string) {
  switch (action.type) {
    case "calendar_event": {
      const [result] = await db.update(calendarEvents)
        .set({ ...action.data, updatedAt: new Date() })
        .where(and(
          eq(calendarEvents.id, action.id),
          eq(calendarEvents.userId, userId)
        ))
        .returning();

      if (!result) {
        throw new Error("Calendar event not found");
      }

      return { action: "updated", type: "calendar_event", data: result };
    }

    case "task": {
      const updateData = { ...action.data };
      if (updateData.priority && typeof updateData.priority === 'string') {
        const priorityMap = { low: 1, medium: 2, high: 3 };
        updateData.priority = priorityMap[updateData.priority as keyof typeof priorityMap];
      }

      const [result] = await db.update(tasks)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(
          eq(tasks.id, action.id),
          eq(tasks.userId, userId)
        ))
        .returning();

      if (!result) {
        throw new Error("Task not found");
      }

      return { action: "updated", type: "task", data: result };
    }

    case "expense": {
      const [result] = await db.update(expenses)
        .set({ ...action.data, updatedAt: new Date() })
        .where(and(
          eq(expenses.id, action.id),
          eq(expenses.userId, userId)
        ))
        .returning();

      if (!result) {
        throw new Error("Expense not found");
      }

      return { action: "updated", type: "expense", data: result };
    }

    default:
      throw new Error(`Unknown update type: ${action.type}`);
  }
}

async function executeDeleteAction(action: DeleteAction, userId: string) {
  switch (action.type) {
    case "calendar_event": {
      const [result] = await db.delete(calendarEvents)
        .where(and(
          eq(calendarEvents.id, action.id),
          eq(calendarEvents.userId, userId)
        ))
        .returning();

      if (!result) {
        throw new Error("Calendar event not found");
      }

      return { action: "deleted", type: "calendar_event", id: action.id };
    }

    case "task": {
      const [result] = await db.delete(tasks)
        .where(and(
          eq(tasks.id, action.id),
          eq(tasks.userId, userId)
        ))
        .returning();

      if (!result) {
        throw new Error("Task not found");
      }

      return { action: "deleted", type: "task", id: action.id };
    }

    case "expense": {
      const [result] = await db.delete(expenses)
        .where(and(
          eq(expenses.id, action.id),
          eq(expenses.userId, userId)
        ))
        .returning();

      if (!result) {
        throw new Error("Expense not found");
      }

      return { action: "deleted", type: "expense", id: action.id };
    }

    default:
      throw new Error(`Unknown delete type: ${action.type}`);
  }
}

async function executeListAction(action: ListAction, userId: string) {
  const now = new Date();

  switch (action.type) {
    case "calendar_event": {
      let query = db.select().from(calendarEvents)
        .where(eq(calendarEvents.userId, userId))
        .orderBy(asc(calendarEvents.startDate));

      // Apply filters
      if (action.filters) {
        if (action.filters.upcoming === true) {
          query = db.select().from(calendarEvents)
            .where(and(
              eq(calendarEvents.userId, userId),
              // Note: This would need proper date comparison
            ))
            .orderBy(asc(calendarEvents.startDate));
        }
      }

      const results = await query.limit(50);
      return { action: "listed", type: "calendar_event", data: results };
    }

    case "task": {
      let query = db.select().from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));

      // Apply filters
      if (action.filters) {
        if (action.filters.completed !== undefined) {
          query = db.select().from(tasks)
            .where(and(
              eq(tasks.userId, userId),
              eq(tasks.completed, action.filters.completed)
            ))
            .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));
        }
      }

      const results = await query.limit(50);
      return { action: "listed", type: "task", data: results };
    }

    case "expense": {
      let query = db.select().from(expenses)
        .where(eq(expenses.userId, userId))
        .orderBy(desc(expenses.date));

      // Apply filters
      if (action.filters) {
        if (action.filters.category) {
          query = db.select().from(expenses)
            .where(and(
              eq(expenses.userId, userId),
              eq(expenses.category, action.filters.category)
            ))
            .orderBy(desc(expenses.date));
        }
      }

      const results = await query.limit(50);
      return { action: "listed", type: "expense", data: results };
    }

    default:
      // If no type specified, return all types
      const [events, taskList, expenseList] = await Promise.all([
        db.select().from(calendarEvents)
          .where(eq(calendarEvents.userId, userId))
          .orderBy(asc(calendarEvents.startDate))
          .limit(20),
        db.select().from(tasks)
          .where(eq(tasks.userId, userId))
          .orderBy(asc(tasks.dueDate), desc(tasks.createdAt))
          .limit(20),
        db.select().from(expenses)
          .where(eq(expenses.userId, userId))
          .orderBy(desc(expenses.date))
          .limit(20),
      ]);

      return {
        action: "listed",
        type: "all",
        data: {
          calendarEvents: events,
          tasks: taskList,
          expenses: expenseList
        }
      };
  }
}