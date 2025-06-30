import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatScore(score: number) {
  return score.toFixed(1);
}

export function getDecisionColor(decision: string) {
  switch (decision?.toLowerCase()) {
    case "yes":
      return "success";
    case "maybe":
      return "warning";
    case "no":
      return "error";
    default:
      return "gray";
  }
}

export function calculateAverageScore(scores: Record<string, number>) {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return values.reduce((sum, score) => sum + score, 0) / values.length;
}
