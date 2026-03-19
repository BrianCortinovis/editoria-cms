let counter = 0;

export function generateId(): string {
  counter++;
  return `blk_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
