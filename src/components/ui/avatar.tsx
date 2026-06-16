export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const sizeMap = {
  xs: "h-8 w-8 text-xs",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
} as const;

export function Avatar({
  avatarUrl,
  name,
  size = "md",
  fallbackClassName,
}: {
  avatarUrl?: string;
  name: string;
  size?: keyof typeof sizeMap;
  fallbackClassName?: string;
}) {
  const dim = sizeMap[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        className={`${dim} shrink-0 rounded-full object-cover`}
        src={avatarUrl}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-medium ${fallbackClassName ?? "bg-primary/8 text-primary/70"}`}
    >
      {getInitials(name)}
    </span>
  );
}
