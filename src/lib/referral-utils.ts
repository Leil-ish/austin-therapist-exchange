export function getThisMonthCount(items: Array<{ createdAtLabel: string }>) {
  // createdAtLabel is relative ("2 days ago", "3 months ago"). Instead we track
  // the raw created_at timestamp but it isn't exposed yet — use the label heuristic:
  // items whose label contains "day", "hour", "minute", "just now", or "1 month" = this month.
  return items.filter((item) => {
    const label = item.createdAtLabel.toLowerCase();
    return (
      label.includes("just now") ||
      label.includes("minute") ||
      label.includes("hour") ||
      label.includes("day") ||
      label === "1 month ago"
    );
  }).length;
}
