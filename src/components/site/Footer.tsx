import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, MapPin, Phone, Youtube } from "lucide-react";
import { UtsLogo } from "@/components/brand/UtsLogo";
import { COMPANY, OFFICE_LOCATIONS, SOCIAL_LINKS } from "@/lib/uts-data";

const SOCIAL_ICONS = {
  LinkedIn: Linkedin,
  Facebook: Facebook,
  Instagram: Instagram,
  YouTube: Youtube,
} as const;

const COMPANY_LINKS = [
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/fleet", label: "Fleet" },
  { to: "/safety", label: "Safety" },
  { to: "/contact", label: "Contact" },
] as const;

const SMART_LINKS = [
  { to: "/smart-transport", label: "Attendance" },
  { to: "/smart-transport", label: "Notifications" },
  { to: "/smart-transport", label: "Fee Management" },
  { to: "/driver/dashboard", label: "Driver Portal" },
  { to: "/admin", label: "Admin Portal" },
] as const;

const RESOURCE_LINKS = [
  { to: "/faq", label: "FAQ" },
  { to: "/reviews", label: "Reviews" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer className="surface-navy mt-24">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <UtsLogo variant="light" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-navy-foreground/70">
            United Transport Service provides corporate, institutional and personal
            transportation across Pakistan — now supported by a new Smart Transport
            Platform for digital attendance, notifications and fee management.
          </p>
          <div className="mt-6 space-y-3 text-sm text-navy-foreground/80">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{COMPANY.address.join(", ")}</span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                {COMPANY.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/-/g, "")}`} className="mr-3 hover:text-accent">
                    {phone}
                  </a>
                ))}
              </span>
            </p>
          </div>
        </div>

        <FooterColumn title="Company">
          {COMPANY_LINKS.map((l) => (
            <FooterLink key={l.label} to={l.to} label={l.label} />
          ))}
          <li>
            <span className="text-sm text-navy-foreground/45">Careers — coming soon</span>
          </li>
        </FooterColumn>

        <FooterColumn title="Smart Transport">
          {SMART_LINKS.map((l) => (
            <FooterLink key={l.label} to={l.to} label={l.label} />
          ))}
        </FooterColumn>

        <FooterColumn title="Resources">
          {RESOURCE_LINKS.map((l) => (
            <FooterLink key={l.label} to={l.to} label={l.label} />
          ))}
        </FooterColumn>
      </div>

      <div className="container-page border-t border-navy-foreground/12 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-foreground/50">
          Offices
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-navy-foreground/70">
          {OFFICE_LOCATIONS.map((city) => (
            <li key={city}>{city}</li>
          ))}
        </ul>
      </div>

      <div className="container-page flex flex-col gap-5 border-t border-navy-foreground/12 py-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-navy-foreground/60">
          © {new Date().getFullYear()} United Transport Service. All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-navy-foreground/50">
            Follow Us
          </span>
          {SOCIAL_LINKS.map((social) => {
            const Icon = SOCIAL_ICONS[social.name as keyof typeof SOCIAL_ICONS];
            if (!social.url) {
              return (
                <span
                  key={social.name}
                  title={`${social.name} — official profile not verified yet (coming soon)`}
                  aria-disabled="true"
                  className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-navy-foreground/15 text-navy-foreground/35"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">{social.name} — coming soon</span>
                </span>
              );
            }
            return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-navy-foreground/25 text-navy-foreground/80 transition-colors hover:border-accent hover:text-accent"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{social.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-navy-foreground">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-navy-foreground/70 transition-colors hover:text-accent"
      >
        {label}
      </Link>
    </li>
  );
}
