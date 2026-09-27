/**
 * Centralized Security, RBAC, Rate-Limiting, Session Timeout & Audit Logging Service
 * Built for UTS Smart Transport Web Application
 */

import { supabase } from "@/integrations/supabase/client";

export type SecuritySeverity = "INFO" | "WARNING" | "HIGH" | "CRITICAL";

export interface SecurityEventLog {
  id: string;
  timestamp: string;
  eventType:
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "RATE_LIMIT_LOCKOUT"
    | "UNAUTHORIZED_ROUTE_ACCESS"
    | "ROLE_MISMATCH_BLOCKED"
    | "SESSION_TIMEOUT"
    | "LOGOUT"
    | "PASSWORD_RESET"
    | "GPS_BROADCAST_START"
    | "GPS_BROADCAST_STOP";
  userEmail?: string | null;
  userId?: string | null;
  role?: string | null;
  route?: string;
  details?: Record<string, any>;
  ip?: string;
  severity: SecuritySeverity;
}

const STORAGE_SECURITY_LOGS = "uts_security_audit_logs_v1";
const STORAGE_RATE_LIMIT = "uts_auth_ratelimit_v1";
const STORAGE_REMEMBER_ME = "uts_remember_me_pref";

// Rate limiting parameters
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds
const ATTEMPTS_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface RateLimitEntry {
  attempts: number;
  firstFailedAt: number;
  lockedUntil: number | null;
}

/**
 * 1. Rate Limiting & Brute Force Prevention
 */
export function getRateLimitStatus(identifier: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_RATE_LIMIT);
    const store: Record<string, RateLimitEntry> = raw ? JSON.parse(raw) : {};
    const key = identifier.toLowerCase().trim();
    const entry = store[key];

    if (!entry) {
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }

    const now = Date.now();

    // Check if lockout has expired
    if (entry.lockedUntil && entry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attempts: entry.attempts };
    }

    // Window expired, reset
    if (now - entry.firstFailedAt > ATTEMPTS_WINDOW_MS) {
      delete store[key];
      localStorage.setItem(STORAGE_RATE_LIMIT, JSON.stringify(store));
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }

    return { isLocked: false, remainingSeconds: 0, attempts: entry.attempts };
  } catch (err) {
    console.warn("Error checking rate limit status:", err);
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }
}

export function recordFailedLoginAttempt(identifier: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_RATE_LIMIT);
    const store: Record<string, RateLimitEntry> = raw ? JSON.parse(raw) : {};
    const key = identifier.toLowerCase().trim();
    const now = Date.now();

    let entry = store[key];
    if (!entry || now - entry.firstFailedAt > ATTEMPTS_WINDOW_MS) {
      entry = {
        attempts: 1,
        firstFailedAt: now,
        lockedUntil: null,
      };
    } else {
      entry.attempts += 1;
    }

    if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
      entry.lockedUntil = now + LOCKOUT_DURATION_MS;
      logSecurityEvent({
        eventType: "RATE_LIMIT_LOCKOUT",
        userEmail: identifier,
        severity: "HIGH",
        details: {
          attempts: entry.attempts,
          lockoutDurationMs: LOCKOUT_DURATION_MS,
        },
      });
    }

    store[key] = entry;
    localStorage.setItem(STORAGE_RATE_LIMIT, JSON.stringify(store));

    const isLocked = entry.lockedUntil !== null && entry.lockedUntil > now;
    const remainingSeconds = isLocked ? Math.ceil((entry.lockedUntil! - now) / 1000) : 0;

    return { isLocked, remainingSeconds, attempts: entry.attempts };
  } catch (err) {
    console.warn("Error recording rate limit:", err);
    return { isLocked: false, remainingSeconds: 0, attempts: 1 };
  }
}

export function resetRateLimit(identifier: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_RATE_LIMIT);
    if (!raw) return;
    const store: Record<string, RateLimitEntry> = JSON.parse(raw);
    const key = identifier.toLowerCase().trim();
    if (store[key]) {
      delete store[key];
      localStorage.setItem(STORAGE_RATE_LIMIT, JSON.stringify(store));
    }
  } catch (err) {
    console.warn("Error resetting rate limit:", err);
  }
}

/**
 * 2. Centralized Security & Audit Logging Function
 */
export async function logSecurityEvent(
  params: Omit<SecurityEventLog, "id" | "timestamp">,
): Promise<SecurityEventLog> {
  const logEntry: SecurityEventLog = {
    id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...params,
  };

  // 1. Persist to local security audit store
  try {
    const raw = localStorage.getItem(STORAGE_SECURITY_LOGS);
    const logs: SecurityEventLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(logEntry);
    // Keep last 200 logs locally
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_SECURITY_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.warn("Local security log storage notice:", err);
  }

  // 2. Dispatch a custom browser event for reactive UI components (e.g. Admin audit logs)
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("uts_security_log_created", {
        detail: logEntry,
      }),
    );
  }

  // 3. Sync to Supabase audit_logs table if accessible
  try {
    await supabase.from("audit_logs").insert({
      action: params.eventType,
      entity_type: "SECURITY_EVENT",
      entity_id: params.userId || params.userEmail || "anonymous",
      user_id: params.userId || null,
      details: {
        severity: params.severity,
        route: params.route,
        userEmail: params.userEmail,
        ...params.details,
      },
    });
  } catch (err) {
    // Gracefully ignore if offline or table schema not ready
  }

  return logEntry;
}

export function getSecurityLogs(): SecurityEventLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_SECURITY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 3. Remember Me Storage Helpers
 */
export function getRememberMePreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_REMEMBER_ME) === "true";
  } catch {
    return true;
  }
}

export function setRememberMePreference(remember: boolean): void {
  try {
    localStorage.setItem(STORAGE_REMEMBER_ME, remember ? "true" : "false");
  } catch (err) {
    console.warn("Could not save remember me preference:", err);
  }
}
