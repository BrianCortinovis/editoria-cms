// Simple className utility (replaces clsx + tailwind-merge for lighter bundle)
type ClassValue = string | number | boolean | undefined | null;

export function cn(...args: ClassValue[]): string {
  return args.filter((x) => typeof x === 'string' && x).join(' ');
}

export default cn;
