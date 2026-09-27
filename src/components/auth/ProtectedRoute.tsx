import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { logSecurityEvent } from "@/lib/security-service";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requiredStatus?: string;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredStatus,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, profile, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  useEffect(() => {
    if (isLoading) return;

    // 1. Unauthenticated Check: Strict Login Enforcement
    if (!user || !profile) {
      logSecurityEvent({
        eventType: "UNAUTHORIZED_ROUTE_ACCESS",
        route: currentPath,
        severity: "WARNING",
        details: { attemptedPath: currentPath },
      });

      toast.error("Authentication Required: Please sign in to access this portal.");
      navigate({
        to: "/login",
        search: { redirect: currentPath } as any,
      });
      return;
    }

    // 2. Role-Based Access Control (RBAC) Check
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = role || profile.role;
      const hasPermission = userRole && allowedRoles.includes(userRole);

      if (!hasPermission) {
        logSecurityEvent({
          eventType: "ROLE_MISMATCH_BLOCKED",
          userId: user.id,
          userEmail: user.email,
          role: userRole,
          route: currentPath,
          severity: "HIGH",
          details: {
            requiredRoles: allowedRoles,
            userRole,
            attemptedPath: currentPath,
          },
        });

        toast.error(`Access Denied: ${allowedRoles.join(" / ")} privileges required.`);

        // Redirect to their own authorized dashboard
        if (userRole === "ADMIN") {
          navigate({ to: "/admin" });
        } else if (userRole === "DRIVER") {
          navigate({ to: "/driver/dashboard" });
        } else {
          navigate({ to: "/student/dashboard" });
        }
      }
    }
  }, [user, profile, role, isLoading, allowedRoles, currentPath, navigate]);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 card-elevated p-8 max-w-sm w-full text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <h3 className="font-bold text-foreground text-sm">Verifying Security Credentials</h3>
          <p className="text-xs text-muted-foreground">
            Validating active session token and RBAC role permissions...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated or permission check failed
  if (!user || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 card-elevated p-8 max-w-sm w-full text-center border-destructive/30">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <h3 className="font-bold text-foreground text-sm">Access Restricted</h3>
          <p className="text-xs text-muted-foreground">
            Redirecting to secure login authentication window...
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = role || profile.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 card-elevated p-8 max-w-sm w-full text-center border-amber-500/30">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
            <h3 className="font-bold text-foreground text-sm">Insufficient Permissions</h3>
            <p className="text-xs text-muted-foreground">
              Your account ({userRole || "User"}) does not possess {allowedRoles.join("/")} clearance.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
