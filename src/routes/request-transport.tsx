import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Send,
  MapPin,
  Building2,
  Users,
  Car,
  Sparkles,
  Phone,
  ArrowRight,
} from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICES, OFFICE_LOCATIONS } from "@/lib/uts-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequestSearchParams {
  service?: string | undefined;
}

export const Route = createFileRoute("/request-transport")({
  validateSearch: (search: Record<string, unknown>): RequestSearchParams => {
    return {
      service: typeof search["service"] === "string" ? search["service"] : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Request Transport Quote & Booking — UTS Pakistan" },
      {
        name: "description",
        content:
          "Submit your corporate, student, or private transport request. Get a tailored route quote from United Transport Service.",
      },
    ],
  }),
  component: RequestTransportPage,
});

function RequestTransportPage() {
  const search = useSearch({ from: "/request-transport" });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [serviceType, setServiceType] = useState<string>(
    search.service || (SERVICES[0]?.title ?? "Corporate Booking"),
  );
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [city, setCity] = useState("Islamabad");
  const [startDate, setStartDate] = useState("");
  const [passengers, setPassengers] = useState<string>("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("transport_requests")
        .insert({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          organization: organization.trim() || null,
          service_type: serviceType,
          pickup_location: pickupLocation.trim() || null,
          dropoff_location: dropoffLocation.trim() || null,
          city: city,
          start_date: startDate || null,
          passengers: parseInt(passengers) || 1,
          notes: notes.trim() || null,
          status: "NEW",
        })
        .select("id")
        .single();

      if (error) throw error;

      const refId = data?.id
        ? `UTS-REQ-${data.id.substring(0, 8).toUpperCase()}`
        : "UTS-REQ-RECEIVED";
      setBookingRef(refId);
      toast.success("Transport request submitted successfully!");
    } catch (err) {
      toast.error((err as Error).message || "Failed to submit transport request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Transport Booking & Inquiries"
        title="Request Transport Solutions."
        description="Share your route requirements, timeline, and passenger capacity. Our operations dispatch will review and provide a customized quote."
      />

      <section className="container-page py-16">
        <div className="mx-auto max-w-3xl">
          {bookingRef ? (
            <div className="card-elevated p-8 sm:p-12 text-center animate-fade-in">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">
                Request Received Successfully
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your reference ID is{" "}
                <strong className="text-primary font-mono text-base">{bookingRef}</strong>
              </p>
              <p className="mt-4 max-w-lg mx-auto text-sm leading-relaxed text-muted-foreground">
                Our dispatch supervisor is reviewing your requirements and will contact you via
                phone (<strong className="text-foreground">{phone}</strong>) or email shortly with
                availability and pricing.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-6 text-left text-xs text-muted-foreground space-y-2">
                <p>
                  <strong>Service Requested:</strong> {serviceType}
                </p>
                <p>
                  <strong>City / Route:</strong> {city} ({pickupLocation} → {dropoffLocation})
                </p>
                <p>
                  <strong>Passengers:</strong> {passengers} person(s)
                </p>
                {startDate && (
                  <p>
                    <strong>Estimated Start:</strong> {startDate}
                  </p>
                )}
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link to="/">Return to Homepage</Link>
                </Button>
                <Button asChild variant="outline">
                  <a href="tel:03124567891">
                    <Phone className="mr-1.5 h-4 w-4" /> Call 03124567891
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="card-elevated p-8 sm:p-10">
              <div className="border-b border-border pb-6">
                <h2 className="text-xl font-bold text-foreground">Transport Request Form</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  All requests are processed by our central Islamabad operations center.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* Contact Person Details */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
                    1. Contact Information
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="req-name">Full Name *</Label>
                      <Input
                        id="req-name"
                        placeholder="Ahmed Hussain"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="req-phone">Phone / WhatsApp Number *</Label>
                      <Input
                        id="req-phone"
                        type="tel"
                        placeholder="03124567891"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="req-email">Email Address</Label>
                      <Input
                        id="req-email"
                        type="email"
                        placeholder="ahmed@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="req-org">Organization / Institution</Label>
                      <Input
                        id="req-org"
                        placeholder="e.g. NUST, Company Name, Private"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Service & Route Details */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
                    2. Service & Journey Details
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="req-service">Service Category</Label>
                      <Select value={serviceType} onValueChange={setServiceType}>
                        <SelectTrigger id="req-service">
                          <SelectValue placeholder="Select Service" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICES.map((s) => (
                            <SelectItem key={s.slug} value={s.title}>
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="req-city">Operating City</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger id="req-city">
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {OFFICE_LOCATIONS.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="req-pickup">Pickup Point / Area</Label>
                      <Input
                        id="req-pickup"
                        placeholder="e.g. G-10/4 Islamabad, Airport, Site A"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="req-dropoff">Drop-off Destination</Label>
                      <Input
                        id="req-dropoff"
                        placeholder="e.g. NUST H-12 Campus, Blue Area, Site B"
                        value={dropoffLocation}
                        onChange={(e) => setDropoffLocation(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="req-passengers">Passenger Count</Label>
                      <Input
                        id="req-passengers"
                        type="number"
                        min={1}
                        max={500}
                        value={passengers}
                        onChange={(e) => setPassengers(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="req-date">Expected Start Date</Label>
                      <Input
                        id="req-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="border-t border-border pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="req-notes">Additional Route Specifications or Timings</Label>
                    <Textarea
                      id="req-notes"
                      rows={3}
                      placeholder="Specify shift timings, vehicle preference (Sedan, Van, Coaster), or specific pickup stops..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Submitting Transport Request..." : "Submit Transport Request"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
