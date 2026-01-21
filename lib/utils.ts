'use client';

type ClassValue = string | number | null | undefined | false;

// Minimal className combiner to avoid extra deps
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}
