import { useState } from "react";
import {
  Bell,
  Send,
  Users,
  Route as RouteIcon,
  ShieldAlert,
  Car,
  CheckCircle2,
  Clock,
  Filter,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RouteItem, BusItem } from "@/lib/admin-operations-store";
import { toast } from "sonner";

interface NotificationsTabProps {
  notifications: any[];
  routes: RouteItem[];
  onSendBroadcast: (notif: {
    category: string;
    target_audience: string;
    subject: string;
    body: string;
  }) => Promise<void>;
}

export function NotificationsTab({
  notifications,
  routes,
  onSendBroadcast,
}: NotificationsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState("ANNOUNCEMENT");
  const [targetAudience, setTargetAudience] = useState("ALL_USERS");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in notification subject and message body.");
      return;
    }

    setSubmitting(true);
    try {
      await onSendBroadcast({
        category,
        target_audience: targetAudience,
        subject: subject.trim(),
        body: body.trim(),
      });

      setIsComposeModalOpen(false);
      setSubject("");
      setBody("");
      toast.success("Broadcast notification dispatched successfully to intended recipients!");
    } catch (err) {
      toast.error("Failed to dispatch broadcast notice.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    return (
      (n.subject && n.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.recipient_name && n.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.category && n.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notification Center & Targeted Broadcast Engine
            </h2>
            <p className="text-xs text-muted-foreground">
              Dispatch route change alerts, trip cancellations, schedule updates, and emergency notices to specific recipient groups.
            </p>
          </div>

          <Button onClick={() => setIsComposeModalOpen(true)} className="bg-primary text-primary-foreground text-xs h-9">
            <Send className="mr-1.5 h-4 w-4" /> Compose Targeted Broadcast
          </Button>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications log by subject, recipient, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Dispatched Notifications Log Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Category & Subject</th>
                <th className="px-6 py-3.5">Recipient Target</th>
                <th className="px-6 py-3.5">Delivery Status</th>
                <th className="px-6 py-3.5">Sent Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredNotifs.map((n) => (
                <tr key={n.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">{n.category || "GENERAL"}</Badge>
                      <strong className="text-xs text-foreground">{n.subject}</strong>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{n.body}</p>
                  </td>

                  <td className="px-6 py-4 text-xs font-semibold text-foreground">
                    {n.recipient_name || "All Enrolled Users"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        n.status === "SENT"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-blue-500/15 text-blue-600"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {n.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                    {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Targeted Broadcast Dialog */}
      <Dialog open={isComposeModalOpen} onOpenChange={setIsComposeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Compose Broadcast Notification
            </DialogTitle>
            <DialogDescription>
              Select targeted audience group to avoid unnecessary mass spam.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSend} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Notification Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNOUNCEMENT">General Announcement</SelectItem>
                    <SelectItem value="ROUTE_UPDATE">Route Itinerary Update</SelectItem>
                    <SelectItem value="SCHEDULE_CHANGE">Schedule Shift Adjustment</SelectItem>
                    <SelectItem value="BUS_CANCELLATION">Emergency Bus Cancellation</SelectItem>
                    <SelectItem value="MAINTENANCE">Fleet Maintenance Alert</SelectItem>
                    <SelectItem value="FEE_OVERDUE">Transport Fee Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Target Audience *</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_USERS">All Transport Users</SelectItem>
                    <SelectItem value="DRIVERS_ONLY">Drivers Only</SelectItem>
                    <SelectItem value="STUDENTS_ONLY">Students / Passengers Only</SelectItem>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={`ROUTE_${r.id}`}>
                        Route: {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Subject Line *</Label>
              <Input
                placeholder="e.g. Schedule Change: NUST Route 01 departure shifted to 07:20 AM"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Message Content *</Label>
              <Textarea
                placeholder="Write detailed notification message for passengers and drivers..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                required
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsComposeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Dispatching..." : "Dispatch Broadcast"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
