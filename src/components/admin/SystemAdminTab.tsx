import { useState } from "react";
import {
  ShieldCheck,
  Users,
  Plus,
  Search,
  Lock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  KeyRound,
  Eye,
  Edit,
  UserCheck,
  UserX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { AdminUserItem } from "@/lib/admin-operations-store";
import { toast } from "sonner";

interface SystemAdminTabProps {
  adminUsers: AdminUserItem[];
  isSuperAdmin: boolean;
  onAddAdminUser: (admin: Omit<AdminUserItem, "id" | "created_at">) => Promise<void>;
  onToggleAdminStatus: (adminId: string, active: boolean) => Promise<void>;
}

export function SystemAdminTab({
  adminUsers,
  isSuperAdmin,
  onAddAdminUser,
  onToggleAdminStatus,
}: SystemAdminTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN">("ADMIN");
  const [submitting, setSubmitting] = useState(false);

  const filteredAdmins = adminUsers.filter((a) => {
    return (
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Please enter full name and email address.");
      return;
    }

    setSubmitting(true);
    try {
      await onAddAdminUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || "03124567891",
        role,
        status: "ACTIVE",
        last_login: "Never",
      });

      setIsAddModalOpen(false);
      setFullName("");
      setEmail("");
      toast.success(`Administrative account created for ${fullName}!`);
    } catch (err) {
      toast.error("Failed to create admin user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> System Administration & RBAC Security
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage executive administrative accounts, assign operational roles, and audit security permissions.
            </p>
          </div>

          {isSuperAdmin && (
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground text-xs h-9">
              <Plus className="mr-1.5 h-4 w-4" /> Add Admin User
            </Button>
          )}
        </div>
      </div>

      {/* Role & Permissions Matrix */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-elevated p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Super Administrator Privileges
            </h3>
            <Badge className="bg-primary text-primary-foreground text-[10px]">Unrestricted</Badge>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Full governance & security administrative control
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Manage admin accounts & assign roles
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Permanent student disciplinary expulsion authority
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Complete system configuration & database sync
            </li>
          </ul>
        </div>

        <div className="card-elevated p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Operations Administrator Privileges
            </h3>
            <Badge variant="secondary" className="text-[10px]">Operational Scope</Badge>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Driver applications verification & route dispatch
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Bus registry, scheduling conflict validation & maintenance
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Passenger assignments, fee collection & complaints triage
            </li>
            <li className="flex items-center gap-2 text-muted-foreground/70">
              <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Cannot create or delete Super Admin accounts
            </li>
          </ul>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Registered System Administrators</h3>
            <p className="text-xs text-muted-foreground">Accounts authorized to access the central transport operations console.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Administrator</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5">Last Login</th>
                {isSuperAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground text-sm">{admin.full_name}</div>
                    <div className="text-xs text-muted-foreground">{admin.email} • {admin.phone}</div>
                  </td>

                  <td className="px-6 py-4">
                    <Badge
                      className={
                        admin.role === "SUPER_ADMIN"
                          ? "bg-primary text-primary-foreground text-[10px]"
                          : "bg-secondary text-secondary-foreground text-[10px]"
                      }
                    >
                      {admin.role}
                    </Badge>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        admin.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {admin.status === "ACTIVE" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {admin.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                    {admin.last_login || "Recent"}
                  </td>

                  {isSuperAdmin && (
                    <td className="px-6 py-4 text-right">
                      {admin.role !== "SUPER_ADMIN" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => onToggleAdminStatus(admin.id, admin.status !== "ACTIVE")}
                        >
                          {admin.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin User Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Create Administrator Account
            </DialogTitle>
            <DialogDescription>
              Assign role privileges and invite an operations administrator.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAdmin} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Full Name *</Label>
              <Input
                placeholder="e.g. Tariq Mehmood"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Email Address *</Label>
                <Input
                  type="email"
                  placeholder="admin.ops@uts.com.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Contact Phone</Label>
                <Input
                  placeholder="03124567891"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Role Assignment *</Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Operations Administrator</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Administrator (Executive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Creating..." : "Create Admin Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
