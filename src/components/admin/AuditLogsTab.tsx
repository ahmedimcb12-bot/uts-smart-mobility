import { useState } from "react";
import {
  History,
  ShieldCheck,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  ShieldAlert,
  Clock,
  FileText,
  AlertTriangle,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface AuditLogItem {
  id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

interface AuditLogsTabProps {
  logs: AuditLogItem[];
  onRefresh: () => void;
}

export function AuditLogsTab({ logs, onRefresh }: AuditLogsTabProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const filtered = logs.filter((l) => {
    const detailsStr =
      typeof l.details === "object" ? JSON.stringify(l.details) : String(l.details || "");
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      detailsStr.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = actionFilter === "ALL" || l.action === actionFilter;
    return matchesSearch && matchesFilter;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "APPROVE_DRIVER":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
            APPROVE DRIVER
          </Badge>
        );
      case "REJECT_DRIVER":
        return <Badge variant="destructive">REJECT DRIVER</Badge>;
      case "SUSPEND_DRIVER":
        return (
          <Badge className="bg-red-500/15 text-red-600 border-red-500/30">SUSPEND DRIVER</Badge>
        );
      case "REACTIVATE_DRIVER":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30">
            REACTIVATE DRIVER
          </Badge>
        );
      case "RESOLVE_COMPLAINT":
        return <Badge className="bg-emerald-500/15 text-emerald-600">RESOLVE COMPLAINT</Badge>;
      case "OVERDUE_FEE_SCAN":
        return <Badge className="bg-amber-500/15 text-amber-600">OVERDUE FEE SCAN</Badge>;
      case "ROUTE_END":
        return <Badge className="bg-purple-500/15 text-purple-600">ROUTE END</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Operational Audit Log Trail</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Immutable record of high-privilege administrative actions, driver onboarding
              approvals, suspensions, and fee adjustments.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh Logs
          </Button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit trail by action, actor, or details..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["ALL", "APPROVE_DRIVER", "REJECT_DRIVER", "SUSPEND_DRIVER", "RESOLVE_COMPLAINT"].map(
              (act) => (
                <Button
                  key={act}
                  variant={actionFilter === act ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActionFilter(act)}
                  className="text-xs shrink-0"
                >
                  {act === "ALL" ? "All Actions" : act.replace("_", " ")}
                </Button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Actor Role</th>
                <th className="px-6 py-3">Action Performed</th>
                <th className="px-6 py-3">Entity Target</th>
                <th className="px-6 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground text-sm font-sans"
                  >
                    No audit records matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-sans text-[10px]">
                        {log.actor_role || "ADMIN"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4 text-foreground font-semibold">{log.entity_type}</td>
                    <td className="px-6 py-4 font-sans text-xs text-muted-foreground max-w-md truncate">
                      {typeof log.details === "object"
                        ? JSON.stringify(log.details)
                        : String(log.details || "—")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
