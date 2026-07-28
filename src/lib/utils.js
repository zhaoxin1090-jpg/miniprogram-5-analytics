import { clsx } from 'clsx';

// Minimal cn utility - no tailwind-merge needed for this setup
export function cn(...inputs) {
  return clsx(inputs);
}
