import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  MapPinned,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import heroImage from "@/assets/hero-fleet.jpg";
import { PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { SERVICES, SMART_FEATURES, FLEET_CATEGORIES } from "@/lib/uts-data";

const TITLE = "United Transport Service (UTS) Pakistan — Safe. Reliable. Smarter Transportation.";
const DESCRIPTION =
  "Corporate, employee and student transportation across Pakistan, with a new Smart Transport Platform for digital attendance, notifications and fee management.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "United Transport Service Pakistan, UTS Pakistan, transport service Pakistan, corporate transportation Pakistan, employee transportation Pakistan, pick and drop Pakistan, vehicle rental Pakistan, NUST pick and drop, smart transport management Pakistan",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "United Transport Service",
          alternateName: "UTS Pakistan",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Office No. 2, Block 20-B, Kashif Blair Plaza, G-8 Markaz",
            addressLocality: "Islamabad",
            addressCountry: "PK",
          },
          telephone: ["051-2251642", "051-2260727"],
        }),
      },
    ],
  }),
  component: HomePage,
});

const SMART_ICONS = [ClipboardCheck, BellRing, Receipt, LayoutDashboard];

function HomePage() {
  return (
    <PublicLayout>
      <Hero />
      <TrustStrip />
      <ServicesPreview />
      <SmartTransportSection />
      <ExistingVsNew />
      <FleetPreview />
      <ClosingCta />
    </PublicLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden surface-navy">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-navy-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Smart Transport Platform — New Digital Experience
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.08] text-navy-foreground sm:text-5xl lg:text-6xl">
            Safe. Reliable. <span className="text-accent">Smarter</span> Transportation.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-foreground/75">
            Professional transportation solutions enhanced by modern technology, better
            communication, and smarter operations.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/request-transport">
                Request Transport
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
            >
              <Link to="/smart-transport">Explore Smart Transport</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-navy-foreground/15 shadow-[var(--shadow-elevated)]">
            <img
              src={heroImage}
              alt="United Transport Service coach and passenger van on a highway near Islamabad"
              width={1600}
              height={1008}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-navy-foreground/15 bg-card/95 p-4 shadow-[var(--shadow-elevated)] backdrop-blur sm:left-8 sm:right-8">
            <div className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Smart Transport Platform Preview
                </p>
                <p className="text-xs text-muted-foreground">
                  Interface preview only. Live tracking integration coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-8" />
    </section>
  );
}

const TRUST_POINTS = [
  { icon: Building2, label: "Corporate & institutional contracts" },
  { icon: ShieldCheck, label: "Safety-led operating standards" },
  { icon: MapPinned, label: "Offices across Pakistan & Saudi Arabia" },
  { icon: Sparkles, label: "New digital operations layer" },
];

function TrustStrip() {
  return (
    <section className="border-b border-border bg-secondary/60">
      <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_POINTS.map((point) => (
          <div key={point.label} className="flex items-center gap-3">
            <point.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground/80">{point.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesPreview() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="Existing UTS Services"
        title="Transportation built around how organisations actually move."
        description="Publicly listed UTS services, delivered by professional drivers and a maintained fleet."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => (
          <Reveal key={service.slug} delay={i * 60}>
            <article className="card-elevated card-elevated-hover h-full p-6">
              <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
      <div className="mt-10">
        <Button asChild variant="outline">
          <Link to="/services">
            View all services
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function SmartTransportSection() {
  return (
    <section className="surface-navy py-20">
      <div className="container-page">
        <SectionHeading
          tone="light"
          eyebrow="Smart Transport Platform — New Digital Experience"
          title="Transportation, Now Smarter."
          description="These are new digital capabilities being introduced alongside existing UTS services."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {SMART_FEATURES.map((feature, i) => {
            const Icon = SMART_ICONS[i] ?? Sparkles;
            return (
              <Reveal key={feature.key} delay={i * 70}>
                <article className="h-full rounded-2xl border border-navy-foreground/15 bg-navy-foreground/5 p-7 transition-colors hover:border-accent/50">
                  <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-semibold uppercase tracking-wide text-navy-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-navy-foreground/75">
                    {feature.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/smart-transport">Explore Smart Transport</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
          >
            <Link to="/driver/dashboard">See the driver interface</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ExistingVsNew() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="Clear separation"
        title="What UTS provides today, and what is being introduced."
        description="Nothing on this page claims capabilities that are not yet in place."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-7">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Existing UTS services
          </span>
          <ul className="mt-5 space-y-3">
            {[
              "Corporate, tourism and personal bookings",
              "Daily pick & drop arrangements",
              "Rent a car and group transfers",
              "NUST pick & drop routes",
              "Professional drivers and maintained fleet",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm text-foreground/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent/8 p-7">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground/70">
            Smart Transport Platform — new
          </span>
          <ul className="mt-5 space-y-3">
            {[
              "Introducing digital passenger attendance",
              "Introducing automatic absence notifications",
              "Introducing fee records with overdue reminders",
              "Introducing an operations dashboard",
              "Live tracking integration coming soon",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm text-foreground/80">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FleetPreview() {
  return (
    <section className="border-y border-border bg-secondary/50 py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Fleet"
          title="Vehicle categories for every movement profile."
          description="Vehicle availability and specifications are confirmed per booking."
        />
        <div className="mt-10 flex flex-wrap gap-3">
          {FLEET_CATEGORIES.map((category) => (
            <span
              key={category.title}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/80"
            >
              {category.title}
            </span>
          ))}
        </div>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link to="/fleet">
              Explore the fleet
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="container-page py-20">
      <div className="surface-brand rounded-3xl px-8 py-14 text-center sm:px-14">
        <h2 className="text-3xl font-bold text-brand-foreground sm:text-4xl">
          Plan your transport with UTS.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-brand-foreground/85">
          Tell us your route, timings and passenger count. Our operations team will respond with the
          right vehicle and arrangement.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/request-transport">Request Transport</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-brand-foreground/40 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
          >
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
