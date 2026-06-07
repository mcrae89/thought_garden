import * as Crypto from 'expo-crypto';

export function generateId(): string {
  return Crypto.randomUUID();
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
