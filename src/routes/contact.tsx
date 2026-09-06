import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Send,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Linkedin,
  Instagram,
  Youtube,
} from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { COMPANY, OFFICE_LOCATIONS, SOCIAL_LINKS } from "@/lib/uts-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — United Transport Service Pakistan" },
      {
        name: "description",
        content:
          "Get in touch with United Transport Service: Corporate Office Islamabad, helpline 03124567891, and nationwide branch offices.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Store contact inquiry into complaints/inquiries table
      const { error } = await supabase.from("complaints").insert({
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        customer_email: email.trim() || null,
        category: "Other",
        priority: "MEDIUM",
        description: `Website Inquiry: [${subject.trim() || "General Inquiry"}] - ${message.trim()}`,
        status: "OPEN",
      });

      if (error) throw error;

      setSent(true);
      toast.success("Thank you! Your message has been received by UTS Operations.");
      setName("");
      setPhone("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error((err as Error).message || "Failed to send message. Please try calling directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Direct Helpline & Offices"
        title="Get in Touch with UTS."
        description="Connect with our operations desk for corporate bookings, fleet inquiries, institutional transport, and route arrangements."
      />

      <section className="container-page py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Contact Details & Info */}
          <div className="space-y-8 lg:col-span-5">
            <div className="card-elevated p-8">
              <h2 className="text-xl font-bold text-foreground">Corporate Headquarters</h2>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <strong className="text-foreground">Address:</strong>
                    <p className="mt-0.5 leading-relaxed">{COMPANY.address.join(", ")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-border pt-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <strong className="text-foreground">Direct Helplines:</strong>
                    <div className="mt-1 flex flex-col gap-1 text-foreground font-medium">
                      <a href="tel:03124567891" className="text-primary font-bold hover:underline">
                        03124567891 (Mobile & WhatsApp Desk)
                      </a>
                      <a href="tel:0512251642" className="hover:underline">
                        051-2251642 (Landline)
                      </a>
                      <a href="tel:0512260727" className="hover:underline">
                        051-2260727 (Landline)
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-border pt-4">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <strong className="text-foreground">Operating Hours:</strong>
                    <p className="mt-0.5">Monday – Saturday: 8:00 AM – 8:00 PM</p>
                    <p className="text-xs text-muted-foreground">
                      24/7 Dispatch active for contracted routes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nationwide Office Network */}
            <div className="card-elevated p-8">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground">Nationwide & Regional Presence</h3>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {OFFICE_LOCATIONS.map((loc) => (
                  <li
                    key={loc}
                    className="flex items-center gap-1.5 rounded-md bg-secondary/50 p-2 text-foreground/80"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>{loc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verified Social Profiles */}
            <div className="card-elevated p-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Connect on Social Media
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {SOCIAL_LINKS.filter((s) => s.url).map((s) => {
                  let Icon = Linkedin;
                  if (s.name === "Instagram") Icon = Instagram;
                  if (s.name === "YouTube") Icon = Youtube;
                  return (
                    <a
                      key={s.name}
                      href={s.url!}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{s.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="card-elevated p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-foreground">Send an Inquiry or Message</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill out the form below and our operations coordinator will reach out promptly.
              </p>

              {sent ? (
                <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center animate-fade-in">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="mt-4 text-xl font-bold">Message Sent Successfully</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your inquiry has been logged in the UTS operations portal. We will contact you
                    at your provided phone or email shortly.
                  </p>
                  <Button className="mt-6" onClick={() => setSent(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Your Full Name</Label>
                      <Input
                        id="contact-name"
                        placeholder="Ahmed Hussain"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone / Mobile Number</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="03124567891"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email Address</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-subject">Subject</Label>
                      <Input
                        id="contact-subject"
                        placeholder="Corporate contract, NUST route, Rent a Car"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Your Message or Requirements</Label>
                    <Textarea
                      id="contact-message"
                      rows={5}
                      placeholder="Please specify pickup/dropoff points, timing, number of passengers, and expected start date..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Sending Message..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
