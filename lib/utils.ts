import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple hash ID generator for SQLite
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Para birimi kodu çıkarma (asset name'den)
export function extractCurrencyFromName(name: string): string | null {
  const match = name.match(/Nakit\s*\(?\s*(\w+)\)?/i);
  return match ? match[1].toUpperCase() : null;
}

// Para birimi sembolü
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    'TRY': '₺',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CHF': '₣',
    'RUB': '₽'
  };
  return symbols[currencyCode.toUpperCase()] || currencyCode;
}
