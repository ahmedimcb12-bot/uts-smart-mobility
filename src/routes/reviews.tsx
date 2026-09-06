import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Star,
  MessageSquarePlus,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  ThumbsUp,
} from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { REVIEW_CRITERIA } from "@/lib/uts-data";
import { toast } from "sonner";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Passenger Reviews & Feedback — UTS Pakistan" },
      {
        name: "description",
        content:
          "Read real passenger reviews and share your transportation experience with United Transport Service.",
      },
    ],
  }),
  component: ReviewsPage,
});

interface ReviewItem {
  id: string;
  reviewer_name: string | null;
  route_label: string | null;
  overall_rating: number;
  driver_rating: number | null;
  comfort_rating: number | null;
  punctuality_rating: number | null;
  cleanliness_rating: number | null;
  feedback: string | null;
  created_at: string;
}

function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [routeLabel, setRouteLabel] = useState("");
  const [overallRating, setOverallRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [comfortRating, setComfortRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchReviews() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, reviewer_name, route_label, overall_rating, driver_rating, comfort_rating, punctuality_rating, cleanliness_rating, feedback, created_at",
        )
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.warn("Could not fetch live reviews from Supabase:", err);
      // If table empty or network error, set empty
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Insert review into Supabase
      const { data: newReview, error } = await supabase
        .from("reviews")
        .insert({
          reviewer_name: name.trim() || "Anonymous Passenger",
          reviewer_email: email.trim() || null,
          route_label: routeLabel.trim() || "UTS General Route",
          overall_rating: overallRating,
          driver_rating: driverRating,
          comfort_rating: comfortRating,
          punctuality_rating: punctualityRating,
          feedback: feedback.trim() || null,
          published: true,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. If rating is low (<= 2), auto-escalate into complaints table for admin follow-up
      if (overallRating <= 2 && newReview) {
        await supabase.from("complaints").insert({
          customer_name: name.trim() || "Passenger",
          customer_email: email.trim() || null,
          review_id: newReview.id,
          category: overallRating === 1 ? "Driver Behaviour" : "Route Issue",
          priority: overallRating === 1 ? "HIGH" : "MEDIUM",
          description: `Auto-escalated from low review (${overallRating}/5): ${feedback.trim() || "No feedback text provided."}`,
          status: "OPEN",
        });
      }

      toast.success("Thank you! Your feedback has been published.");
      setOpenModal(false);
      setName("");
      setEmail("");
      setRouteLabel("");
      setFeedback("");
      setOverallRating(5);
      fetchReviews();
    } catch (err) {
      toast.error((err as Error).message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.overall_rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Passenger Feedback & Reputation"
        title="Passenger Experiences."
        description="Authentic feedback from corporate staff, university students, and daily commuters across Pakistan."
      />

      <section className="container-page py-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-border pb-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-6 w-6 fill-current" />
                ))}
              </div>
              <span className="text-2xl font-bold">{avgRating} / 5.0</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Based on {reviews.length} authentic passenger{" "}
              {reviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-sm">
                <MessageSquarePlus className="mr-2 h-5 w-5" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Share Your UTS Travel Experience</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rev-name">Your Name</Label>
                  <Input
                    id="rev-name"
                    placeholder="e.g. Hamza Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rev-email">Email (Optional)</Label>
                  <Input
                    id="rev-email"
                    type="email"
                    placeholder="e.g. hamza@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rev-route">Route / Service</Label>
                  <Input
                    id="rev-route"
                    placeholder="e.g. NUST Morning Route, Corporate Pick & Drop"
                    value={routeLabel}
                    onChange={(e) => setRouteLabel(e.target.value)}
                  />
                </div>

                {/* Rating Selectors */}
                <div className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Rating</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setOverallRating(star)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-5 w-5 ${star <= overallRating ? "fill-current" : "text-muted-foreground"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Driver Conduct</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setDriverRating(star)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-4 w-4 ${star <= driverRating ? "fill-current" : "text-muted-foreground"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Punctuality</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setPunctualityRating(star)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-4 w-4 ${star <= punctualityRating ? "fill-current" : "text-muted-foreground"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Vehicle Comfort & AC</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setComfortRating(star)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-4 w-4 ${star <= comfortRating ? "fill-current" : "text-muted-foreground"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rev-feedback">Written Feedback</Label>
                  <Textarea
                    id="rev-feedback"
                    placeholder="Describe your pickup experience, vehicle comfort, and overall punctuality..."
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting Review..." : "Publish Review"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reviews List */}
        <div className="mt-12">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="card-elevated p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ThumbsUp className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-bold">Be the first to share your experience.</h3>
              <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
                We take all feedback seriously to continuously improve our fleet, punctuality, and
                route satisfaction.
              </p>
              <Button className="mt-6" onClick={() => setOpenModal(true)}>
                <MessageSquarePlus className="mr-2 h-4 w-4" /> Share Your Review
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((rev, i) => (
                <Reveal key={rev.id} delay={i * 50}>
                  <article className="card-elevated flex h-full flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${s <= rev.overall_rating ? "fill-current" : "text-muted-foreground/40"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                        "{rev.feedback || "Good transport service."}"
                      </p>
                    </div>

                    <div className="mt-6 border-t border-border pt-4">
                      <p className="text-sm font-semibold text-foreground">{rev.reviewer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rev.route_label || "UTS Passenger"}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
