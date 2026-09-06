import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, HelpCircle, ArrowRight, MessageCircleQuestion } from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "@/lib/uts-data";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions (FAQ) — UTS Pakistan" },
      {
        name: "description",
        content:
          "Find answers regarding UTS transportation services, routes, digital attendance, fees, and safety policies.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = FAQS.filter(
    (item) =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Help & Knowledge Base"
        title="Frequently Asked Questions."
        description="Clear answers about our services, booking process, digital attendance, and vehicle operations."
      />

      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search questions (e.g. GPS, attendance, booking, cities)..."
              className="h-12 pl-11 text-base shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Accordion */}
          <div className="mt-10">
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="card-elevated rounded-2xl border border-border px-6 py-1"
                  >
                    <AccordionTrigger className="text-left font-semibold text-base hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground pt-2 pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="card-elevated p-12 text-center">
                <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No questions match your search</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try searching with different terms or contact our support desk directly.
                </p>
                <Button className="mt-6" onClick={() => setSearchTerm("")}>
                  View all FAQs
                </Button>
              </div>
            )}
          </div>

          {/* Need more help */}
          <div className="mt-16 rounded-2xl border border-border bg-secondary/50 p-8 text-center">
            <MessageCircleQuestion className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-3 text-lg font-bold text-foreground">Have a specific question?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Our operations representatives are ready to assist you with custom corporate
              requirements, routes, and fleet queries.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link to="/contact">
                  Contact Support <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
