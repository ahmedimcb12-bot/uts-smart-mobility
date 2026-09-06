import { cn } from "@/lib/utils";

interface UtsLogoProps {
  className?: string;
  variant?: "dark" | "light";
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Official United Transport Service (UTS) Brand Logo.
 * Designed exactly matching the official brand identity:
 * - 'U' in Deep Indigo/Navy Blue (#1C1565) with 'UNITED' text
 * - 'T' in UTS Sky Blue (#0094DD) with 'TRANSPORT' header bar
 * - 'S' in Vibrant Orange (#E77A18) with 'SERVICE' text
 */
export function UtsLogo({
  className,
  variant = "dark",
  showWordmark = true,
  size = "md",
}: UtsLogoProps) {
  const isLight = variant === "light";

  const heightClass = size === "sm" ? "h-7" : size === "lg" ? "h-12" : "h-9";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 360 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-auto shrink-0 select-none", heightClass)}
        role="img"
        aria-label="United Transport Service Official Logo"
      >
        {/* TOP 'TRANSPORT' BADGE ON T */}
        <rect x="78" y="10" width="158" height="24" rx="4" fill="#0094DD" />
        <text
          x="157"
          y="27"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14"
          fontWeight="800"
          letterSpacing="3.5"
          textAnchor="middle"
        >
          TRANSPORT
        </text>

        {/* 'U' - DEEP NAVY / INDIGO SECTION */}
        <path
          d="M 28 12 L 58 12 L 58 64 C 58 78 68 88 82 88 L 98 88 L 98 114 L 68 114 C 36 114 28 92 28 66 Z"
          fill="#1C1565"
        />
        {/* UNITED TEXT EMBEDDED IN BOTTOM OF U */}
        <text
          x="63"
          y="107"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fontWeight="800"
          letterSpacing="2"
          textAnchor="middle"
        >
          UNITED
        </text>

        {/* 'T' - UTS SKY BLUE SECTION */}
        <path
          d="M 134 38 L 168 38 L 168 76 C 168 88 178 98 190 98 L 214 98 L 214 114 L 182 114 C 150 114 134 94 134 72 Z"
          fill="#0094DD"
        />

        {/* 'S' - VIBRANT ORANGE SECTION */}
        <path
          d="M 276 10 C 298 10 326 22 334 46 L 306 58 C 300 46 288 38 274 38 C 258 38 248 46 248 58 C 248 76 294 76 312 90 C 326 100 330 114 316 114 L 226 114 L 226 88 L 294 88 C 298 88 302 84 300 80 C 294 72 264 68 244 58 C 226 48 226 26 246 16 C 254 12 264 10 276 10 Z"
          fill="#E77A18"
        />

        {/* 'SERVICE' TEXT EMBEDDED IN BOTTOM ORANGE BAR */}
        <rect x="226" y="88" width="90" height="26" rx="3" fill="#E77A18" />
        <text
          x="271"
          y="106"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fontWeight="800"
          letterSpacing="2.5"
          textAnchor="middle"
        >
          SERVICE
        </text>
      </svg>

      {showWordmark && (
        <div className="hidden sm:flex flex-col justify-center leading-none">
          <div
            className={cn(
              "font-display font-extrabold tracking-tight text-sm",
              isLight ? "text-white" : "text-[#1C1565]",
            )}
          >
            United Transport Service
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                "text-[10px] font-bold tracking-[0.2em] uppercase",
                isLight ? "text-[#0094DD]" : "text-[#0094DD]",
              )}
            >
              Smart Mobility
            </span>
            <span className="text-[10px] text-muted-foreground">• Pakistan</span>
          </div>
        </div>
      )}
    </div>
  );
}
