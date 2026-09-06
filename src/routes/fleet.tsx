import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Users, Briefcase, CheckCircle2, Shield, Fuel } from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { FLEET_CATEGORIES } from "@/lib/uts-data";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet Categories & Specifications — UTS Pakistan" },
      {
        name: "description",
        content:
          "Explore the United Transport Service fleet: Sedans, SUVs, Vans, Coasters, and Luxury Coaches for corporate and personal mobility.",
      },
    ],
  }),
  component: FleetPage,
});

const FLEET_DETAILS = [
  {
    title: "Sedans",
    passengers: "1 – 4 Seats",
    luggage: "2 – 3 Bags",
    bestFor: "Executive movement, corporate meetings, airport pick & drop",
    features: ["Climate Control AC", "Professional Chauffeur", "Well-Maintained Interior"],
  },
  {
    title: "SUVs",
    passengers: "4 – 6 Seats",
    luggage: "4 – 5 Bags",
    bestFor: "Inter-city travel, family journeys, rough-terrain site visits",
    features: ["All-Wheel Drive / 4x4", "High Ground Clearance", "Spacious Cabin"],
  },
  {
    title: "Vans",
    passengers: "8 – 14 Seats",
    luggage: "6 – 8 Bags",
    bestFor: "Employee daily pick & drop, project teams, small group tours",
    features: ["Dual AC System", "High-Roof Seating", "Touchpoint Sanitation"],
  },
  {
    title: "Coasters",
    passengers: "22 – 29 Seats",
    luggage: "12 – 15 Bags",
    bestFor: "NUST student routes, university transport, conference delegates",
    features: ["Reclining Passenger Seats", "PA System / Mic", "Dedicated Luggage Compartment"],
  },
  {
    title: "Buses",
    passengers: "35 – 50 Seats",
    luggage: "30+ Bags",
    bestFor: "Large institutional contracts, factory staff, long-distance tourism",
    features: ["Air Suspension", "Heavy-Duty Climate Control", "Emergency Safety Exits"],
  },
  {
    title: "Luxury Vehicles",
    passengers: "1 – 4 Seats",
    luggage: "2 – 3 Bags",
    bestFor: "VIP protocol, state guests, embassy and diplomatic transport",
    features: ["Premium Leather Seating", "Silent Cabin", "Trained Protocol Drivers"],
  },
  {
    title: "Special Purpose Vehicles",
    passengers: "Custom Capacity",
    luggage: "Project Configured",
    bestFor: "Field survey teams, emergency standby, customized site requirements",
    features: ["Customized Tooling", "Verified Fleet Safety", "24/7 Operations Support"],
  },
];

function FleetPage() {
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  return (
    <PublicLayout>
      <PageHero
        eyebrow="UTS Fleet Standards"
        title="Modern Fleet for Every Journey."
        description="Every vehicle in the UTS fleet undergoes scheduled safety inspections, sanitation protocols, and is operated by vetted professional drivers."
      />

      <section className="container-page py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FLEET_CATEGORIES.map((cat, i) => {
            const detail = FLEET_DETAILS.find((d) => d.title === cat.title) ?? FLEET_DETAILS[0]!;
            return (
              <Reveal key={cat.title} delay={i * 60}>
                <article className="card-elevated card-elevated-hover flex h-full flex-col justify-between p-7">
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <h2 className="text-xl font-bold tracking-tight text-foreground">
                        {cat.title}
                      </h2>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {detail.passengers}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>

                    <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          <strong>Luggage:</strong> {detail.luggage}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>
                          <strong>Ideal For:</strong> {detail.bestFor}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-6 space-y-2 border-t border-border pt-4">
                      {detail.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-foreground/85">
                          <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-border">
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/request-transport" search={{ service: cat.title }}>
                        Request {cat.title} <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Fleet Standards Banner */}
        <div className="mt-16 rounded-3xl border border-navy-foreground/15 surface-navy p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex gap-4">
              <Shield className="h-8 w-8 text-accent shrink-0" />
              <div>
                <h3 className="font-semibold text-navy-foreground">Safety Certified</h3>
                <p className="mt-1 text-xs text-navy-foreground/70">
                  Routine multi-point mechanical inspections and fitness certifications.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Fuel className="h-8 w-8 text-accent shrink-0" />
              <div>
                <h3 className="font-semibold text-navy-foreground">Verified Maintenance</h3>
                <p className="mt-1 text-xs text-navy-foreground/70">
                  Tires, brakes, engine oils and AC cooling systems serviced on strict mileage
                  intervals.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Users className="h-8 w-8 text-accent shrink-0" />
              <div>
                <h3 className="font-semibold text-navy-foreground">Vetted Drivers</h3>
                <p className="mt-1 text-xs text-navy-foreground/70">
                  Background checked, medically tested and route trained personnel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
