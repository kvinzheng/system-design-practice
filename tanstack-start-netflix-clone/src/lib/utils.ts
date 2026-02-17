import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff retry for network requests
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && i < retries - 1) {
        // Retry on 5xx errors
        if (response.status >= 500) {
          await sleep(1000 * Math.pow(2, i)); // 1s, 2s, 4s
          continue;
        }
      }
      return response;
    } catch {
      if (i === retries - 1) throw new Error('Network failed after retries');
      await sleep(1000 * Math.pow(2, i)); // 1s, 2s, 4s
    }
  }
  throw new Error('Network failed after retries');
}
