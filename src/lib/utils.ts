import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat().format(num);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
  }).format(new Date(date));
}
