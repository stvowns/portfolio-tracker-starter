import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple hash ID generator for SQLite
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
