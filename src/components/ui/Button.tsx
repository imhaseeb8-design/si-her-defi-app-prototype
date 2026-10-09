'use client';
// Primary button — Figma "Button · Primary" (node 1025:32): Default, Hover, Pressed, Focus,
// Disabled and Loading. States are plain CSS (.btn-primary in globals.css) so they can be
// copied into the real codebase as they are.
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const Spinner = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="btn-primary__spinner" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
    <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  /** Shows the spinner and the loading label; the button stops reacting. */
  loading?: boolean;
  loadingLabel?: ReactNode;
  /** The trailing arrow (Figma "Show icon"). */
  showIcon?: boolean;
};

export function Button({ children, loading = false, loadingLabel, showIcon = true, className = '', onClick, type = 'button', ...rest }: Props) {
  return (
    <button
      {...rest}
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || rest.disabled || undefined}
      onClick={(e) => { if (loading) { e.preventDefault(); return; } onClick?.(e); }}
      className={`btn-primary ${className}`}
    >
      {loading ? (
        <><Spinner /><span>{loadingLabel ?? children}</span></>
      ) : (
        <><span>{children}</span>{showIcon && <span aria-hidden="true" className="btn-primary__icon" />}</>
      )}
    </button>
  );
}

/** Same look, for navigation (e.g. "Continue"). */
export function ButtonLink({ href, children, showIcon = true, className = '' }: { href: string; children: ReactNode; showIcon?: boolean; className?: string }) {
  return (
    <Link href={href} className={`btn-primary ${className}`}>
      <span>{children}</span>
      {showIcon && <span aria-hidden="true" className="btn-primary__icon" />}
    </Link>
  );
}
