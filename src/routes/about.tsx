import { createFileRoute } from "@tanstack/react-router";
import { Building2, Compass, Handshake, ShieldCheck } from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { COMPANY, OFFICE_LOCATIONS } from "@/lib/uts-data";

const TITLE = "About United Transport Service (UTS) Pakistan";
const DESCRIPTION =
  "United Transport Service is a Pakistani transportation company providing corporate, institutional and personal transport, with offices across Pakistan and Saudi Arabia.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Safety first",
    description:
      "Driver conduct, vehicle condition and route discipline are treated as operating requirements, not extras.",
  },
  {
    icon: Handshake,
    title: "Reliability",
    description:
      "Contracted movement depends on consistency — the same vehicle, the same driver, the same timings.",
  },
  {
    icon: Compass,
    title: "Coverage",
    description:
      "UTS lists offices in nine locations, supporting inter-city and multi-site transport requirements.",
  },
  {
    icon: Building2,
    title: "Accountability",
    description:
      "Feedback and complaints are recorded and tracked to resolution rather than left unanswered.",
  },
];

function AboutPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="About UTS"
        title="A transportation company built for organisations that cannot afford disruption."
        description={COMPANY.tagline}
      />

      <section className="container-page py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              United Transport Service (UTS) provides transportation services in Pakistan
              for corporate clients, institutions and individuals. Its publicly listed
              services include corporate booking, tourism booking, pick &amp; drop,
              rent a car, group transfer, personal booking and NUST pick &amp; drop.
            </p>
            <p>
              The corporate office is located at {COMPANY.address.join(", ")}, with
              additional listed locations across Pakistan and in Saudi Arabia.
            </p>
            <p>
              Alongside these services, UTS is introducing a Smart Transport Platform — a
              new digital layer covering passenger attendance, absence notifications,
              fee management and an operations dashboard. These are new capabilities and
              are presented separately from existing services throughout this site.
            </p>
            <p className="rounded-lg border border-border bg-secondary/60 p-4 text-sm">
              Company statistics such as fleet size, passenger numbers and satisfaction
              percentages are intentionally not shown here. Only verified information is
              published.
            </p>
          </div>

          <aside className="card-elevated h-fit p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Listed locations
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/80">
              {OFFICE_LOCATIONS.map((city) => (
                <li key={city} className="border-b border-border/70 pb-2 last:border-0">
                  {city}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/50 py-20">
        <div className="container-page">
          <SectionHeading eyebrow="How we operate" title="Principles behind the service." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {VALUES.map((value) => (
              <article key={value.title} className="card-elevated p-7">
                <value.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
