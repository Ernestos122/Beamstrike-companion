import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoints(pts: number): string {
  return `${pts}pts`
}

export function generateId(): string {
  return crypto.randomUUID()
}
