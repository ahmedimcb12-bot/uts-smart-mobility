import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  ClipboardCheck,
  LayoutDashboard,
  MapPinned,
  Receipt,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { SMART_FEATURES } from "@/lib/uts-data";

const TITLE = "Smart Transport Management Platform — UTS Pakistan";
const DESCRIPTION =
  "A new digital layer for UTS: digital passenger attendance, absence notifications, transport fee management and an operations dashboard.";

export const Route = createFileRoute("/smart-transport")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/smart-transport" },
    ],
    links: [{ rel: "canonical", href: "/smart-transport" }],
  }),
  component: SmartTransportPage,
});

const ICONS = [ClipboardCheck, BellRing, Receipt, LayoutDashboard];

const FLOW = [
  {
    step: "01",
    title: "Driver opens the route",
    body: "The assigned passenger list for today loads on a mobile-first screen.",
  },
  {
    step: "02",
    title: "Attendance is marked",
    body: "Each passenger is marked present or absent at their pickup stop.",
  },
  {
    step: "03",
    title: "Route is ended",
    body: "Unmarked passengers are recorded as absent — once, never twice.",
  },
  {
    step: "04",
    title: "Notifications are queued",
    body: "Absence notices are generated and made available for delivery.",
  },
  {
    step: "05",
    title: "Operations reviews",
    body: "Administrators see attendance, absences, fees and complaints in one dashboard.",
  },
];

function SmartTransportPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Smart Transport Platform — New Digital Experience"
        title="Transportation, Now Smarter."
        description="These are proposed and newly introduced digital capabilities. They extend existing UTS services rather than describe them."
      />

      <section className="container-page py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {SMART_FEATURES.map((feature, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <Reveal key={feature.key} delay={i * 70}>
                <article className="card-elevated card-elevated-hover h-full p-7">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold uppercase tracking-wide">
                    {feature.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="surface-navy py-20">
        <div className="container-page">
          <SectionHeading
            tone="light"
            eyebrow="How a route runs"
            title="One clean operational flow, end to end."
          />
          <ol className="mt-12 grid gap-5 lg:grid-cols-5">
            {FLOW.map((item, i) => (
              <Reveal key={item.step} delay={i * 60}>
                <li className="h-full rounded-2xl border border-navy-foreground/15 bg-navy-foreground/5 p-6">
                  <span className="font-display text-sm font-bold text-accent">{item.step}</span>
                  <h3 className="mt-3 text-base font-semibold text-navy-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-foreground/70">
                    {item.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-elevated p-8">
            <WifiOff className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">Works when the signal does not</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The driver interface is offline-first. If connectivity drops mid-route, an OFFLINE
              MODE banner appears, attendance can still be marked, and every change is stored on the
              device. When the connection returns, pending records sync automatically and the driver
              is told the attendance synced successfully. Attendance is never lost because of a
              temporary internet failure.
            </p>
          </div>
          <div className="card-elevated p-8">
            <MapPinned className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">Smart Transport Platform Preview</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Route and map views shown across this site are interface previews. UTS does not
              currently publish live vehicle positions here — live tracking integration is coming
              soon, and no live GPS data is displayed until a real integration is connected.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/driver/dashboard">Open driver interface</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/admin">Open operations dashboard</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
