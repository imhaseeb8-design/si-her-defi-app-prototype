// Date/time helpers. Live sessions are shown in the viewer's time zone, like the live app.
import { now } from './mock/server';

export const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** "Oct 15" */
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** "Thu, Oct 15, 5:00 PM" */
export const dayTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** "5:00 PM" */
export const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** "Thu, Oct 15 · 5:00 PM – 6:00 PM" */
export const sessionRange = (start: string, end: string) =>
  `${new Date(start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${time(start)} – ${time(end)}`;

/** "in 3 days", "in 5 hours" relative to the prototype clock. */
export function timeUntil(iso: string): string | null {
  const ms = new Date(iso).getTime() - now().getTime();
  if (ms <= 0) return null;
  const h = Math.round(ms / 3600e3);
  if (h < 1) return 'in under an hour';
  if (h < 48) return `in ${h} hour${h === 1 ? '' : 's'}`;
  const d = Math.round(h / 24);
  return `in ${d} days`;
}

export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const firstName = (name?: string | null) => (name || '').trim().split(/\s+/)[0] || 'there';
