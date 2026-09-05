import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="surface-navy">
      <div className="container-page py-16 sm:py-20">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-3 max-w-3xl text-4xl font-bold text-navy-foreground sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-foreground/75">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
