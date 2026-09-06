import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Wrench,
  PhoneCall,
  HeartHandshake,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety & Operating Standards — UTS Pakistan" },
      {
        name: "description",
        content:
          "Learn about the safety protocols, vehicle fitness routines, and driver vetting standards at United Transport Service.",
      },
    ],
  }),
  component: SafetyPage,
});

const PILLARS = [
  {
    icon: UserCheck,
    title: "Driver Screening & Vetting",
    points: [
      "Mandatory police character verification and NADRA identity checks",
      "Valid commercial driving licenses with minimum 5+ years passenger experience",
      "Annual medical fitness, eyesight, and drug screening exams",
      "Defensive driving and customer sensitivity training modules",
    ],
  },
  {
    icon: Wrench,
    title: "Fleet Fitness & Maintenance",
    points: [
      "Pre-trip 15-point mechanical inspection before daily dispatch",
      "Certified brake, tire pressure, and suspension diagnostics every 5,000 km",
      "Dual AC and heating system maintenance for seasonal weather changes",
      "Valid fitness certificates from provincial transport authorities",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Passenger Route Security",
    points: [
      "Strict zero-tolerance policy for unauthorized route diversions",
      "Fixed pickup and drop-off points with verified student/passenger manifests",
      "Driver attendance logging with automatic absence tracking for passengers",
      "Clear identification badges worn by drivers on all institutional routes",
    ],
  },
  {
    icon: PhoneCall,
    title: "24/7 Operations & Emergency Support",
    points: [
      "Direct operations hotline reachable at 03124567891 and 051-2251642",
      "Immediate vehicle replacement protocol in case of breakdown",
      "Comprehensive roadside assistance network across Islamabad and nationwide offices",
      "Transparent incident escalation and resolution workflow within 24 hours",
    ],
  },
];

function SafetyPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Safety & Reliability"
        title="Zero Compromise on Passenger Safety."
        description="Safety at UTS is not a marketing promise — it is an enforced daily protocol from vehicle maintenance to driver conduct."
      />

      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Core Pillars"
          title="How we keep every passenger secure"
          description="Institutional clients, universities, and corporate partners trust UTS because of our strict operating compliance."
        />

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.title} delay={i * 70}>
                <article className="card-elevated h-full p-8">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-foreground">{pillar.title}</h3>
                  <ul className="mt-5 space-y-3">
                    {pillar.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Emergency Notice */}
        <div className="mt-16 rounded-3xl border border-destructive/20 bg-destructive/5 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Need Immediate Operations Assistance?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our operations desk is active during all route hours for urgent support or
                  passenger inquiries.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <a href="tel:03124567891">Call 03124567891</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contact">Contact Office</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
