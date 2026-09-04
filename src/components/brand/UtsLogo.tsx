import { cn } from "@/lib/utils";

/**
 * UTS brand mark.
 *
 * NOTE: The official UTS logo file was not available in the project when this
 * was built. This is a neutral stand-in that uses the brand palette only.
 * To use the official artwork, drop the file at `src/assets/uts-logo.png`
 * and replace the <svg> below with an <img src={logo} alt="United Transport Service" />.
 */
export function UtsLogo({
  className,
  variant = "dark",
  showWordmark = true,
}: {
  className?: string;
  variant?: "dark" | "light";
  showWordmark?: boolean;
}) {
  const wordColor = variant === "light" ? "text-navy-foreground" : "text-navy";
  const subColor = variant === "light" ? "text-navy-foreground/70" : "text-muted-foreground";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 48 48"
        className="h-9 w-9 shrink-0"
        role="img"
        aria-label="United Transport Service logo"
      >
        <rect width="48" height="48" rx="12" className="fill-navy" />
        <path
          d="M10 33c8-11 20-11 28 0"
          className="stroke-accent"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <text
          x="24"
          y="25"
          textAnchor="middle"
          className="fill-navy-foreground"
          fontFamily="Sora, sans-serif"
          fontSize="15"
          fontWeight="700"
          letterSpacing="0.5"
        >
          UTS
        </text>
      </svg>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-[0.95rem] font-bold tracking-tight", wordColor)}>
            United Transport Service
          </span>
          <span className={cn("mt-1 text-[0.66rem] font-medium uppercase tracking-[0.18em]", subColor)}>
            Pakistan
          </span>
        </span>
      )}
    </span>
  );
}
