import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "EUR") {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(amount)
}
