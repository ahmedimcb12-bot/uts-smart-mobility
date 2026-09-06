import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { COMPANY } from "@/lib/uts-data";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — United Transport Service Pakistan" },
      {
        name: "description",
        content:
          "Terms of service and passenger operating guidelines for United Transport Service.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Operating Guidelines"
        title="Terms of Service."
        description="Standard contractual guidelines and passenger operating terms for UTS transport services."
      />

      <section className="container-page py-16">
        <div className="card-elevated mx-auto max-w-3xl p-8 sm:p-12 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              1. Route Timings & Passenger Conduct
            </h2>
            <p className="mt-2">
              Passengers are requested to be present at their assigned pickup stops at least 5
              minutes before scheduled departure. Drivers adhere to fixed time manifests to ensure
              punctual arrival for all commuters.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">2. Monthly Fees & Billing Periods</h2>
            <p className="mt-2">
              Transport fees for contracted daily routes are billed on a monthly basis with specific
              due dates. Overdue balances receive automated reminders from the operations dispatch
              system.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">3. Vehicle Cleanliness & Safety</h2>
            <p className="mt-2">
              Passengers and drivers are required to uphold vehicle hygiene and safety standards.
              Smoking, hazardous items, and unauthorized diversions are strictly prohibited.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">
              4. Operations & Dispute Resolution
            </h2>
            <p className="mt-2">
              Any dispute, breakdown inquiry, or service feedback is handled through the UTS
              complaint resolution framework. Direct inquiries may be routed to our 24/7 helpline at
              03124567891.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
