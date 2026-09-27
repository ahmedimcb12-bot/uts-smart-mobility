import { useState, useEffect } from "react";
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
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getSecurityLogs, type SecurityEventLog } from "@/lib/security-service";

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
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>(() => getSecurityLogs());

  const refreshCombinedLogs = () => {
    setSecurityLogs(getSecurityLogs());
    onRefresh();
  };

  useEffect(() => {
    const handleSecLog = () => {
      setSecurityLogs(getSecurityLogs());
    };
    window.addEventListener("uts_security_log_created", handleSecLog);
    return () => window.removeEventListener("uts_security_log_created", handleSecLog);
  }, []);

  // Merge database audit logs and security service logs
  const combinedLogs: AuditLogItem[] = [
    ...securityLogs.map((s) => ({
      id: s.id,
      actor_id: s.userId || null,
      actor_role: s.role || (s.eventType.includes("LOGIN") ? "AUTH" : "SECURITY"),
      action: s.eventType,
      entity_type: "SECURITY_AUDIT",
      entity_id: s.userEmail || s.userId || "system",
      details: {
        severity: s.severity,
        route: s.route,
        userEmail: s.userEmail,
        ...s.details,
      },
      ip_address: s.ip || "127.0.0.1",
      created_at: s.timestamp,
    })),
    ...logs,
  ];

  const filtered = combinedLogs.filter((l) => {
    const detailsStr =
      typeof l.details === "object" ? JSON.stringify(l.details) : String(l.details || "");
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_id && l.entity_id.toLowerCase().includes(search.toLowerCase())) ||
      detailsStr.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = actionFilter === "ALL" || l.action === actionFilter;
    return matchesSearch && matchesFilter;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN_FAILED":
        return (
          <Badge className="bg-red-500/15 text-red-600 border-red-500/30 flex items-center gap-1">
            <Lock className="h-3 w-3" /> FAILED LOGIN
          </Badge>
        );
      case "RATE_LIMIT_LOCKOUT":
        return (
          <Badge className="bg-destructive text-destructive-foreground flex items-center gap-1 font-bold">
            <ShieldAlert className="h-3 w-3" /> BRUTE-FORCE LOCKOUT
          </Badge>
        );
      case "UNAUTHORIZED_ROUTE_ACCESS":
      case "ROLE_MISMATCH_BLOCKED":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> ACCESS BLOCKED
          </Badge>
        );
      case "SESSION_TIMEOUT":
        return (
          <Badge className="bg-muted text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> IDLE TIMEOUT
          </Badge>
        );
      case "LOGIN_SUCCESS":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> LOGIN SUCCESS
          </Badge>
        );
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
              <h3 className="text-lg font-bold text-foreground">Centralized Security & Operational Audit Log</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive tamper-evident audit record of failed authentication attempts, rate-limiting lockouts, unauthorized route access, driver vetting, and fleet operations.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={refreshCombinedLogs}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh Logs
          </Button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit trail by action, actor email, or details..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              "ALL",
              "LOGIN_FAILED",
              "RATE_LIMIT_LOCKOUT",
              "ROLE_MISMATCH_BLOCKED",
              "SESSION_TIMEOUT",
              "APPROVE_DRIVER",
              "SUSPEND_DRIVER",
            ].map((act) => (
              <Button
                key={act}
                variant={actionFilter === act ? "default" : "outline"}
                size="sm"
                onClick={() => setActionFilter(act)}
                className="text-xs shrink-0"
              >
                {act === "ALL" ? "All Events" : act.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Role / Actor</th>
                <th className="px-6 py-3">Action / Event</th>
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
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-semibold text-foreground">
                      <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="px-6 py-3">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-3 font-medium text-foreground">
                      {log.entity_id || log.entity_type}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground max-w-xs truncate">
                      {typeof log.details === "object"
                        ? JSON.stringify(log.details)
                        : String(log.details || "-")}
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
