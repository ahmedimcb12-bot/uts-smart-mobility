import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  getRateLimitStatus,
  recordFailedLoginAttempt,
  resetRateLimit,
  logSecurityEvent,
  getRememberMePreference,
  setRememberMePreference,
} from "@/lib/security-service";
import { toast } from "sonner";

export type AppRole = "ADMIN" | "DRIVER" | "STUDENT";
export type DriverAppStatus = Database["public"]["Enums"]["driver_application_status"];

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: AppRole;
  institution?: string | null;
  license_no?: string | null;
  driverApplicationStatus?: DriverAppStatus | null;
  driverApplicationId?: string | null;
  rejectionReason?: string | null;
  lastLoginAt?: string;
}

export interface DriverApplicationSubmission {
  full_name: string;
  email: string;
  phone: string;
  password?: string;
  cnic_no: string;
  license_no: string;
  license_expiry?: string;
  experience_years?: number;
  vehicle_preference?: string;
  notes?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isLoading: boolean;
  isStaff: boolean;
  isDriver: boolean;
  isStudent: boolean;
  driverApplicationStatus: DriverAppStatus | null;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null; user?: any }>;
  signUp: (
    email: string,
    password: string,
    data: { full_name: string; phone?: string; role?: AppRole; institution?: string },
  ) => Promise<{ error: Error | null; user?: any }>;
  submitDriverApplication: (
    data: DriverApplicationSubmission,
  ) => Promise<{ error: Error | null; applicationId?: string | undefined }>;
  loginAsDemo: (role: AppRole) => Promise<void>;
  signOut: (reason?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const DEMO_UUIDS: Record<AppRole, string> = {
  STUDENT: "00000000-0000-4000-a000-000000000001",
  DRIVER: "00000000-0000-4000-a000-000000000002",
  ADMIN: "00000000-0000-4000-a000-000000000003",
};

// Known initial test passwords for verified personal and system accounts
const VALID_SYSTEM_ACCOUNTS: Record<
  string,
  { role: AppRole; pass: string; name: string; license?: string; institution?: string }
> = {
  // Personal Email IDs (Gmail, Yahoo, Outlook, etc.)
  "admin@gmail.com": {
    role: "ADMIN",
    pass: "AdminUTS@2026!SecureKey#",
    name: "UTS Operations Administrator",
  },
  "driver@gmail.com": {
    role: "DRIVER",
    pass: "UtsDriver@2026",
    name: "Muhammad Tariq (Verified Driver)",
    license: "ICT-PSV-99214",
  },
  "student@gmail.com": {
    role: "STUDENT",
    pass: "StudentUTS@2026",
    name: "Ahmed Hussain (Registered Student)",
    institution: "National University of Sciences & Technology (NUST)",
  },

  // Corporate / Institutional aliases
  "admin@uts.com.pk": {
    role: "ADMIN",
    pass: "AdminUTS@2026!SecureKey#",
    name: "UTS Operations Administrator",
  },
  "driver@uts.com.pk": {
    role: "DRIVER",
    pass: "UtsDriver@2026",
    name: "Muhammad Tariq (Assigned Route 01 Driver)",
    license: "ICT-PSV-99214",
  },
  "student@nust.edu.pk": {
    role: "STUDENT",
    pass: "StudentUTS@2026",
    name: "Ahmed Hussain (NUST Student)",
    institution: "National University of Sciences & Technology (NUST)",
  },
};

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

const STORAGE_KEY = "uts_auth_profile_v3";
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes Idle Session Timeout

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMeState] = useState<boolean>(() => getRememberMePreference());

  const lastActivityRef = useRef<number>(Date.now());

  function setRememberMe(val: boolean) {
    setRememberMeState(val);
    setRememberMePreference(val);
  }

  // Helper to construct a synthetic user representation
  function createSyntheticUser(p: UserProfile): User {
    return {
      id: p.id,
      app_metadata: { provider: "email" },
      user_metadata: {
        full_name: p.full_name,
        phone: p.phone,
        role: p.role,
        institution: p.institution,
        license_no: p.license_no,
        driver_application_status: p.driverApplicationStatus,
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: p.email || "",
      phone: p.phone || "",
      role: "authenticated",
      updated_at: new Date().toISOString(),
    };
  }

  async function fetchUserProfile(authUser: User): Promise<UserProfile | null> {
    try {
      const meta = (authUser.user_metadata || {}) as Record<string, any>;
      const userHasValidUuid = isValidUuid(authUser.id);

      let profileData: any = null;
      let roleData: any = null;
      let appData: any = null;

      if (userHasValidUuid) {
        // 1. Fetch profile from Supabase
        const { data: pData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();
        profileData = pData;

        // 2. Fetch role from user_roles
        const { data: rData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authUser.id)
          .maybeSingle();
        roleData = rData;

        // 3. Fetch driver application if exists
        const { data: aData } = await supabase
          .from("driver_applications")
          .select("id, status, rejection_reason, license_no")
          .or(`profile_id.eq.${authUser.id},applicant_email.eq.${authUser.email}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        appData = aData;
      }

      let userRole: AppRole = (roleData?.role as AppRole) || (meta["role"] as AppRole) || "STUDENT";

      let institution: string | null = null;
      let license_no: string | null = null;
      let driverAppStatus: DriverAppStatus | null =
        appData?.status || (meta["driver_application_status"] as DriverAppStatus) || null;

      if (userHasValidUuid) {
        if (userRole === "STUDENT") {
          const { data: studentData } = await supabase
            .from("students")
            .select("institution")
            .eq("profile_id", authUser.id)
            .maybeSingle();
          institution = studentData?.institution || meta["institution"] || null;
        } else if (userRole === "DRIVER") {
          const { data: driverData } = await supabase
            .from("drivers")
            .select("license_no, status")
            .eq("profile_id", authUser.id)
            .maybeSingle();
          license_no = driverData?.license_no || appData?.license_no || meta["license_no"] || null;
          if (driverData?.status === "SUSPENDED") {
            driverAppStatus = "SUSPENDED";
          }
        }
      }

      const builtProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || profileData?.email || null,
        full_name:
          profileData?.full_name ||
          meta["full_name"] ||
          (authUser.email ? authUser.email.split("@")[0] : "User"),
        phone: profileData?.phone || meta["phone"] || "03124567891",
        role: userRole,
        institution:
          institution ||
          (userRole === "STUDENT" ? "National University of Sciences & Technology (NUST)" : null),
        license_no: license_no || (userRole === "DRIVER" ? "ICT-PSV-99214" : null),
        driverApplicationStatus: driverAppStatus,
        driverApplicationId: appData?.id || null,
        rejectionReason: appData?.rejection_reason || null,
        lastLoginAt: new Date().toISOString(),
      };

      saveProfileToStorage(builtProfile, rememberMe);
      return builtProfile;
    } catch (err) {
      console.warn("Could not fetch user profile from Supabase, using metadata:", err);
      const meta = (authUser.user_metadata || {}) as Record<string, any>;
      const fallback: UserProfile = {
        id: authUser.id,
        email: authUser.email || null,
        full_name: meta["full_name"] || (authUser.email ? authUser.email.split("@")[0] : "User"),
        phone: meta["phone"] || "03124567891",
        role: (meta["role"] as AppRole) || "STUDENT",
        institution: meta["institution"] || "National University of Sciences & Technology (NUST)",
      };
      saveProfileToStorage(fallback, rememberMe);
      return fallback;
    }
  }

  function saveProfileToStorage(p: UserProfile | null, remember: boolean) {
    try {
      if (!p) {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      const serialized = JSON.stringify(p);
      if (remember) {
        localStorage.setItem(STORAGE_KEY, serialized);
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, serialized);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Session storage write error:", e);
    }
  }

  function getStoredProfile(): UserProfile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function refreshProfile() {
    if (user) {
      const p = await fetchUserProfile(user);
      setProfile(p);
    }
  }

  // 1. Initial Auth Initialization
  useEffect(() => {
    // Check cached session in storage
    const cached = getStoredProfile();
    if (cached && isValidUuid(cached.id)) {
      setProfile(cached);
      setUser(createSyntheticUser(cached));
    }

    // Get active session from Supabase
    supabase.auth
      .getSession()
      .then(async ({ data: { session: currentSession } }) => {
        setSession(currentSession);
        if (currentSession?.user) {
          setUser(currentSession.user);
          const p = await fetchUserProfile(currentSession.user);
          setProfile(p);
        } else if (cached && isValidUuid(cached.id)) {
          // If valid cached profile exists, maintain it
          setProfile(cached);
          setUser(createSyntheticUser(cached));
        } else {
          // Clean unauthenticated state
          setUser(null);
          setProfile(null);
        }
      })
      .catch((err) => {
        console.warn("Supabase session check notice:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(newSession.user);
        const p = await fetchUserProfile(newSession.user);
        setProfile(p);
      } else {
        const cachedCurrent = getStoredProfile();
        if (!cachedCurrent) {
          setUser(null);
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Idle Session Timeout & Auto-Logout Mechanism (15 Minutes)
  useEffect(() => {
    if (!user) return;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const idleChecker = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        console.warn("[Security] Session timed out due to 15 minutes of inactivity.");
        logSecurityEvent({
          eventType: "SESSION_TIMEOUT",
          userId: user.id,
          userEmail: user.email,
          role: profile?.role,
          severity: "INFO",
          details: { idleDurationMinutes: 15 },
        });

        toast.warning("Session Expired: You were logged out due to 15 minutes of inactivity.");
        signOut("SESSION_TIMEOUT");
      }
    }, 30000); // Check every 30 seconds

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(idleChecker);
    };
  }, [user, profile]);

  /**
   * Strict Login Enforcement:
   * - Validates rate-limiting to block brute-force attacks
   * - Performs strict credential matching (no auto-bypass)
   * - Returns generic error messages
   * - Centralized security audit logging
   */
  async function signIn(email: string, password: string, remember: boolean = true) {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Rate-Limiting & Brute Force Lockout
    const rateLimit = getRateLimitStatus(cleanEmail);
    if (rateLimit.isLocked) {
      setIsLoading(false);
      logSecurityEvent({
        eventType: "RATE_LIMIT_LOCKOUT",
        userEmail: cleanEmail,
        severity: "HIGH",
        details: { remainingSeconds: rateLimit.remainingSeconds },
      });
      return {
        error: new Error(
          `Security Alert: Too many failed login attempts. Please wait ${rateLimit.remainingSeconds} seconds before retrying.`,
        ),
      };
    }

    try {
      // 2. Attempt Supabase Auth Sign In
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        resetRateLimit(cleanEmail);
        setUser(data.user);
        setSession(data.session);
        const p = await fetchUserProfile(data.user);
        setProfile(p);
        saveProfileToStorage(p, remember);
        setRememberMe(remember);

        logSecurityEvent({
          eventType: "LOGIN_SUCCESS",
          userEmail: cleanEmail,
          userId: data.user.id,
          role: p?.role || "STUDENT",
          severity: "INFO",
          details: { method: "SUPABASE_AUTH" },
        });

        setIsLoading(false);
        return { error: null, user: data.user };
      }

      // 3. Check for Seeded Initial System Accounts (Exact password verification required)
      const systemAccount = VALID_SYSTEM_ACCOUNTS[cleanEmail];
      if (systemAccount && systemAccount.pass === password) {
        resetRateLimit(cleanEmail);
        const targetUuid = DEMO_UUIDS[systemAccount.role];

        const syntheticProfile: UserProfile = {
          id: targetUuid,
          email: cleanEmail,
          full_name: systemAccount.name,
          phone: "03124567891",
          role: systemAccount.role,
          institution: systemAccount.institution || (systemAccount.role === "STUDENT" ? "National University of Sciences & Technology (NUST)" : null),
          license_no: systemAccount.license || (systemAccount.role === "DRIVER" ? "ICT-PSV-99214" : null),
          driverApplicationStatus: systemAccount.role === "DRIVER" ? "APPROVED" : null,
          lastLoginAt: new Date().toISOString(),
        };

        const synUser = createSyntheticUser(syntheticProfile);
        setUser(synUser);
        setProfile(syntheticProfile);
        saveProfileToStorage(syntheticProfile, remember);
        setRememberMe(remember);

        logSecurityEvent({
          eventType: "LOGIN_SUCCESS",
          userEmail: cleanEmail,
          userId: synUser.id,
          role: systemAccount.role,
          severity: "INFO",
          details: { method: "SYSTEM_SEEDED_ACCOUNT" },
        });

        setIsLoading(false);
        return { error: null, user: synUser };
      }

      // 4. Strict Authentication Failure
      const failureStatus = recordFailedLoginAttempt(cleanEmail);
      logSecurityEvent({
        eventType: "LOGIN_FAILED",
        userEmail: cleanEmail,
        severity: "WARNING",
        details: { attempts: failureStatus.attempts },
      });

      setIsLoading(false);

      if (failureStatus.isLocked) {
        return {
          error: new Error(
            `Account temporarily locked due to ${failureStatus.attempts} failed attempts. Please try again in ${failureStatus.remainingSeconds} seconds.`,
          ),
        };
      }

      // Generic error message to prevent user enumeration
      return {
        error: new Error("Invalid credentials. Please verify your email and password."),
      };
    } catch (err) {
      recordFailedLoginAttempt(cleanEmail);
      logSecurityEvent({
        eventType: "LOGIN_FAILED",
        userEmail: cleanEmail,
        severity: "HIGH",
        details: { exception: String(err) },
      });
      setIsLoading(false);
      return { error: new Error("Invalid credentials. Please verify your email and password.") };
    }
  }

  // Demo Login Quick-Access (Pre-authenticated development & staging portals)
  async function loginAsDemo(demoRole: AppRole) {
    setIsLoading(true);
    const email =
      demoRole === "ADMIN"
        ? "admin@gmail.com"
        : demoRole === "DRIVER"
          ? "driver@gmail.com"
          : "student@gmail.com";

    const name =
      demoRole === "ADMIN"
        ? "UTS Operations Administrator"
        : demoRole === "DRIVER"
          ? "Muhammad Tariq (Assigned Driver)"
          : "Ahmed Hussain (Registered Student)";

    const targetUuid = DEMO_UUIDS[demoRole];

    const demoProfile: UserProfile = {
      id: targetUuid,
      email,
      full_name: name,
      phone: "03124567891",
      role: demoRole,
      institution:
        demoRole === "STUDENT" ? "National University of Sciences & Technology (NUST)" : null,
      license_no: demoRole === "DRIVER" ? "ICT-PSV-99214" : null,
      driverApplicationStatus: demoRole === "DRIVER" ? "APPROVED" : null,
      lastLoginAt: new Date().toISOString(),
    };

    const synUser = createSyntheticUser(demoProfile);
    setUser(synUser);
    setProfile(demoProfile);
    saveProfileToStorage(demoProfile, true);

    logSecurityEvent({
      eventType: "LOGIN_SUCCESS",
      userEmail: email,
      userId: synUser.id,
      role: demoRole,
      severity: "INFO",
      details: { mode: "DEMO_PORTAL_SWITCH" },
    });

    // Sync to Supabase in background
    try {
      await supabase.from("profiles").upsert({
        id: synUser.id,
        full_name: name,
        email,
        phone: "03124567891",
      });
      await supabase.from("user_roles").upsert({
        user_id: synUser.id,
        role: demoRole,
      });
    } catch (e) {
      console.warn("Background DB sync notice:", e);
    }

    setIsLoading(false);
  }

  // Standard Student Sign Up
  async function signUp(
    email: string,
    password: string,
    data: { full_name: string; phone?: string; role?: AppRole; institution?: string },
  ) {
    setIsLoading(true);
    try {
      const assignedRole: AppRole = "STUDENT"; // Strict: Public signup is STUDENT only
      const { data: authData, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone || "03124567891",
            role: assignedRole,
            institution: data.institution || "National University of Sciences & Technology (NUST)",
          },
        },
      });

      const userId =
        authData?.user?.id ||
        (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "00000000-0000-4000-a000-000000000001");

      const newProfile: UserProfile = {
        id: userId,
        email: email.trim(),
        full_name: data.full_name,
        phone: data.phone || "03124567891",
        role: assignedRole,
        institution: data.institution || "National University of Sciences & Technology (NUST)",
        lastLoginAt: new Date().toISOString(),
      };

      try {
        await supabase.from("profiles").upsert({
          id: userId,
          full_name: data.full_name,
          email: email.trim(),
          phone: data.phone || "03124567891",
        });

        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: assignedRole,
        });

        await supabase.from("students").upsert({
          profile_id: userId,
          full_name: data.full_name,
          email: email.trim(),
          phone: data.phone || "03124567891",
          institution: data.institution || "National University of Sciences & Technology (NUST)",
        });
      } catch (dbErr) {
        console.warn("Direct DB sync notice:", dbErr);
      }

      setUser(createSyntheticUser(newProfile));
      setProfile(newProfile);
      saveProfileToStorage(newProfile, true);

      logSecurityEvent({
        eventType: "LOGIN_SUCCESS",
        userEmail: email.trim(),
        userId,
        role: "STUDENT",
        severity: "INFO",
        details: { event: "STUDENT_REGISTRATION" },
      });

      setIsLoading(false);
      return { error: null, user: authData?.user || newProfile };
    } catch (err) {
      console.warn("SignUp caught exception:", err);
      setIsLoading(false);
      return { error: err as Error };
    }
  }

  // Driver Application Submission Flow (Requires Admin Review)
  async function submitDriverApplication(data: DriverApplicationSubmission) {
    setIsLoading(true);
    try {
      let userId: string | null = null;
      if (data.password) {
        const { data: authData } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              phone: data.phone,
              role: "STUDENT", // Does NOT grant DRIVER role until Admin approval!
              is_driver_applicant: true,
            },
          },
        });
        userId = authData?.user?.id || null;
      }

      const { data: appData, error: appError } = await supabase
        .from("driver_applications")
        .insert({
          profile_id: userId,
          applicant_name: data.full_name.trim(),
          applicant_email: data.email.trim(),
          applicant_phone: data.phone.trim(),
          cnic_no: data.cnic_no.trim(),
          license_no: data.license_no.trim(),
          license_expiry: data.license_expiry || null,
          experience_years: data.experience_years || 2,
          vehicle_preference: data.vehicle_preference || "Coaster (29-Seater)",
          status: "PENDING_APPROVAL",
          notes: data.notes || null,
        })
        .select("id")
        .single();

      if (appError) {
        console.warn("Error inserting driver application:", appError);
      }

      const pendingProfile: UserProfile = {
        id: userId || `applicant-${Date.now()}`,
        email: data.email.trim(),
        full_name: data.full_name,
        phone: data.phone,
        role: "STUDENT", // Driver role is NOT given yet
        license_no: data.license_no,
        driverApplicationStatus: "PENDING_APPROVAL",
        driverApplicationId: appData?.id || `app-${Date.now()}`,
      };

      setUser(createSyntheticUser(pendingProfile));
      setProfile(pendingProfile);
      saveProfileToStorage(pendingProfile, true);
      setIsLoading(false);

      return { error: null, applicationId: appData?.id };
    } catch (err) {
      console.warn("Driver application caught exception:", err);
      setIsLoading(false);
      return { error: err as Error };
    }
  }

  async function signOut(reason: string = "USER_LOGOUT") {
    setIsLoading(true);
    try {
      if (user) {
        logSecurityEvent({
          eventType: "LOGOUT",
          userId: user.id,
          userEmail: user.email,
          role: profile?.role,
          severity: "INFO",
          details: { reason },
        });
      }
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut notice:", e);
    }
    saveProfileToStorage(null, true);
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsLoading(false);
  }

  const role = profile?.role ?? null;
  const isStaff = role === "ADMIN";
  const isDriver = role === "DRIVER" && profile?.driverApplicationStatus !== "SUSPENDED";
  const isStudent = role === "STUDENT" && profile?.driverApplicationStatus !== "PENDING_APPROVAL";
  const driverApplicationStatus = profile?.driverApplicationStatus ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        isStaff,
        isDriver,
        isStudent,
        driverApplicationStatus,
        rememberMe,
        setRememberMe,
        signIn,
        signUp,
        submitDriverApplication,
        loginAsDemo,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
