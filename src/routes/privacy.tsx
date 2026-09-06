import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { COMPANY } from "@/lib/uts-data";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — United Transport Service Pakistan" },
      {
        name: "description",
        content:
          "Learn how UTS Pakistan handles passenger data, digital attendance information, and contact records.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Legal & Compliance"
        title="Privacy Policy."
        description="Your privacy and operational data security are fundamental to United Transport Service."
      />

      <section className="container-page py-16">
        <div className="card-elevated mx-auto max-w-3xl p-8 sm:p-12 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
            <p className="mt-2">
              We collect information you provide directly to us when you request transport quotes,
              submit route reviews, register for digital attendance manifests, or contact our
              operations office. This includes your name, phone number, email address, institutional
              affiliation, and pickup/dropoff stop preferences.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">
              2. Digital Attendance & Route Data
            </h2>
            <p className="mt-2">
              For contracted student and corporate routes, driver-recorded passenger attendance is
              logged to verify service delivery and generate absence notices. This data is
              accessible strictly to authorized operations administrators, assigned route drivers,
              and the passenger themselves.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">3. Use of Personal Information</h2>
            <p className="mt-2">
              We use collected information to operate scheduled routes, deliver automated absence
              and overdue fee notifications, respond to inquiries, and continuously improve vehicle
              comfort and safety standards.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">4. Contact & Inquiries</h2>
            <p className="mt-2">
              For any questions regarding your data or our privacy practices, contact our central
              corporate office at {COMPANY.address.join(", ")} or via phone at 03124567891.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
