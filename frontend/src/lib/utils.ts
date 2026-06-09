import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    ON_HOLD: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    IN_PROGRESS: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  };
  return map[status] || "bg-muted text-muted-foreground";
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    MEDIUM: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    LOW: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };
  return map[priority] || "bg-muted text-muted-foreground";
}
