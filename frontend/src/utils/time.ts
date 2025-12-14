/**
 * Formats a timestamp (in milliseconds) into a human-readable string.
 *
 * For recent times (< 7 days): Shows relative time (e.g., "2 hours ago")
 * For older times: Shows absolute date (e.g., "Dec 14, 2025")
 *
 * @param timestampMs - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatTimestamp(timestampMs: number): string {
  const now = Date.now();
  const diffMs = now - timestampMs;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // For times within the last 7 days, show relative time
  if (diffDays < 7) {
    if (diffSeconds < 60) {
      return "just now";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    }
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }

  // For older times, show absolute date
  const date = new Date(timestampMs);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a timestamp into a full date and time string.
 * Used for tooltips and detailed displays.
 *
 * @param timestampMs - Unix timestamp in milliseconds
 * @returns Full formatted date and time string
 */
export function formatFullTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
