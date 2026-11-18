import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type SalonflowLogoProps = {
  variant: "sidebar-expanded" | "sidebar-collapsed" | "lockup" | "symbol";
  /** Pass `null` to render a non-link mark (e.g. login lockup). */
  href?: string | null;
  className?: string;
  priority?: boolean;
};

const altSymbol = "SalonFlow Symbol";
const altWordmark = "SalonFlow";
const altLockup = "SalonFlow";

export function SalonflowLogo({
  variant,
  href = "/kalender",
  className,
  priority = false,
}: SalonflowLogoProps) {
  const linkHref = href;
  const content =
    variant === "sidebar-collapsed" || variant === "symbol" ? (
      <Image
        src="/branding/salonflow-symbol.png"
        alt={altSymbol}
        width={36}
        height={40}
        className="h-9 w-auto"
        priority={priority}
      />
    ) : variant === "lockup" ? (
      <Image
        src="/branding/salonflow-lockup.png"
        alt={altLockup}
        width={280}
        height={69}
        className="h-12 w-auto max-w-full sm:h-14"
        priority={priority}
      />
    ) : (
      <span className="flex min-w-0 items-center gap-2.5">
        <Image
          src="/branding/salonflow-symbol.png"
          alt=""
          width={32}
          height={36}
          className="h-8 w-auto shrink-0"
          priority={priority}
          aria-hidden
        />
        <Image
          src="/branding/salonflow-wordmark-on-dark.png"
          alt={altWordmark}
          width={128}
          height={24}
          className="h-5 w-auto max-w-[132px]"
          priority={priority}
        />
      </span>
    );

  if (linkHref === null) {
    return (
      <span className={cn("inline-flex items-center", className)} data-testid="brand-logo">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={linkHref}
      className={cn(
        "inline-flex items-center rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        className,
      )}
      aria-label="SalonFlow Startseite"
      data-testid="brand-logo"
    >
      {content}
    </Link>
  );
}
