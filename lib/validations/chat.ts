import { z } from "zod";

// Base schemas for different data types
const calendarEventSchema = z.object({
  type: z.union([z.literal("calendar_event"), z.literal("Calendar Event"), z.literal("event")]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
  location: z.string().optional(),
});

const taskSchema = z.object({
  type: z.union([z.literal("task"), z.literal("Task")]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.union([z.enum(["low", "medium", "high"]), z.number().int().min(1).max(3)]).default("medium"),
  dueDate: z.string().datetime("Invalid due date format").optional(),
});

const expenseSchema = z.object({
  type: z.union([z.literal("expense"), z.literal("Expense")]),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().datetime("Invalid date format"),
});

// Action schemas
const createActionSchema = z.object({
  action: z.literal("create"),
  data: z.discriminatedUnion("type", [
    calendarEventSchema,
    taskSchema,
    expenseSchema,
  ]),
});

const updateActionSchema = z.object({
  action: z.literal("update"),
  type: z.enum(["calendar_event", "task", "expense", "Calendar Event", "Task", "Expense", "event"]),
  id: z.string().uuid("Invalid ID format"),
  data: z.record(z.any()),
});

const deleteActionSchema = z.object({
  action: z.literal("delete"),
  type: z.enum(["calendar_event", "task", "expense", "Calendar Event", "Task", "Expense", "event"]),
  id: z.string().uuid("Invalid ID format"),
});

const listActionSchema = z.object({
  action: z.literal("list"),
  type: z.enum(["calendar_event", "task", "expense", "Calendar Event", "Task", "Expense", "event"]).optional(),
  filters: z.record(z.any()).optional(),
});

// Main response schema from AI
export const aiResponseSchema = z.object({
  message: z.string(),
  actions: z.array(z.discriminatedUnion("action", [
    createActionSchema,
    updateActionSchema,
    deleteActionSchema,
    listActionSchema,
  ])),
});

// Chat request schema
export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

// Type exports
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CreateAction = z.infer<typeof createActionSchema>;
export type UpdateAction = z.infer<typeof updateActionSchema>;
export type DeleteAction = z.infer<typeof deleteActionSchema>;
export type ListAction = z.infer<typeof listActionSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;