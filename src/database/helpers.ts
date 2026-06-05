export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function now(): number {
  return Date.now();
}

export function toDate(ms: number | null): Date | null {
  return ms === null ? null : new Date(ms);
}

export function fromDate(d: Date): number {
  return d.getTime();
}
