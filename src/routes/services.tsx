import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/lib/uts-data";

const TITLE = "Transport Services — Corporate, Pick & Drop, Rent a Car | UTS Pakistan";
const DESCRIPTION =
  "UTS services: corporate booking, tourism booking, pick & drop, rent a car, group transfer, personal booking and NUST pick & drop across Pakistan.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Existing UTS Services"
        title="Transport services for organisations, institutions and individuals."
        description="Professional drivers, maintained vehicles and arrangements matched to your route and schedule."
      />

      <section className="container-page py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal key={service.slug} delay={i * 55}>
              <article className="card-elevated card-elevated-hover flex h-full flex-col p-7">
                <h2 className="text-lg font-semibold text-foreground">{service.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <Link
                  to="/request-transport"
                  search={{ service: service.title }}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  Request this service
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-secondary/60 p-8">
          <h2 className="text-xl font-semibold">Pricing</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pricing depends on route, vehicle category, duration and passenger count, and is quoted
            by the operations team. No rates are published on this site.
          </p>
          <Button asChild className="mt-6">
            <Link to="/request-transport">Request a quote</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
