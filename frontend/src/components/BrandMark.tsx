import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)} aria-hidden="true">
      <svg
        className="h-full w-full"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="3" y="3" width="58" height="58" rx="17" fill="url(#ta-bg)" />
        <rect x="3.75" y="3.75" width="56.5" height="56.5" rx="16.25" stroke="url(#ta-stroke)" strokeWidth="1.5" />
        <path
          d="M15 43C21.5 31.5 28 37.5 32.5 27C36.5 17.8 44.5 18.4 49 23"
          stroke="#5EA2FF"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="15" cy="43" r="4.25" fill="#F8FAFC" stroke="#93C5FD" strokeWidth="2" />
        <circle cx="49" cy="23" r="4.25" fill="#F8FAFC" stroke="#93C5FD" strokeWidth="2" />
        <path
          d="M29.5 48L35.5 16L44 43L35.5 38.5L29.5 48Z"
          fill="url(#ta-needle)"
          stroke="#E5E7EB"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M35.5 16L35.5 38.5L29.5 48" stroke="#0F172A" strokeOpacity="0.18" strokeWidth="1.2" strokeLinecap="round" />
        <defs>
          <linearGradient id="ta-bg" x1="8" y1="5" x2="55" y2="61" gradientUnits="userSpaceOnUse">
            <stop stopColor="#414141" />
            <stop offset="0.48" stopColor="#111111" />
            <stop offset="1" stopColor="#030303" />
          </linearGradient>
          <linearGradient id="ta-stroke" x1="9" y1="5" x2="56" y2="59" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757" />
            <stop offset="0.35" stopColor="#313131" />
            <stop offset="1" stopColor="#1C1C1C" />
          </linearGradient>
          <linearGradient id="ta-needle" x1="34" y1="16" x2="40" y2="47" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#DDEBFF" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
