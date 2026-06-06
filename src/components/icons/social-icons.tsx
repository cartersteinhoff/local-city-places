import type { SVGProps } from "react";

export function Instagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Facebook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 8.25V6.8c0-.7.46-1.05 1.15-1.05H17V2.6A24 24 0 0 0 14.3 2C11.62 2 9.8 3.63 9.8 6.58v1.67H6.75V12h3.05v9.35h3.75V12h3.05l.48-3.75H14Z" />
    </svg>
  );
}
