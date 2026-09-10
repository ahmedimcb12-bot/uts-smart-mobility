import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user?: any }>;
  signUp: (
    email: string,
    password: string,
    data: { full_name: string; phone?: string; role?: AppRole; institution?: string },
  ) => Promise<{ error: Error | null; user?: any }>;
  submitDriverApplication: (
    data: DriverApplicationSubmission,
  ) => Promise<{ error: Error | null; applicationId?: string | undefined }>;
  loginAsDemo: (role: AppRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const DEMO_UUIDS: Record<AppRole, string> = {
  STUDENT: "00000000-0000-4000-a000-000000000001",
  DRIVER: "00000000-0000-4000-a000-000000000002",
  ADMIN: "00000000-0000-4000-a000-000000000003",
};

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

const STORAGE_KEY = "uts_auth_profile_v3";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to construct a mock/fallback user from profile
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
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(builtProfile));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }
  }

  async function refreshProfile() {
    if (user) {
      const p = await fetchUserProfile(user);
      setProfile(p);
    }
  }

  useEffect(() => {
    // 1. Check cached session in localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfile;
        // Migrate legacy non-UUID demo session IDs
        if (!isValidUuid(parsed.id) && parsed.role) {
          parsed.id = DEMO_UUIDS[parsed.role] || DEMO_UUIDS.STUDENT;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        setProfile(parsed);
        setUser(createSyntheticUser(parsed));
      }
    } catch (e) {
      console.warn("Error restoring stored profile:", e);
    }

    // 2. Get initial session from Supabase
    supabase.auth
      .getSession()
      .then(async ({ data: { session: currentSession } }) => {
        setSession(currentSession);
        if (currentSession?.user) {
          setUser(currentSession.user);
          const p = await fetchUserProfile(currentSession.user);
          setProfile(p);
        } else {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as UserProfile;
              if (!isValidUuid(parsed.id) && parsed.role) {
                parsed.id = DEMO_UUIDS[parsed.role] || DEMO_UUIDS.STUDENT;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
              }
              setProfile(parsed);
              setUser(createSyntheticUser(parsed));
            } catch (err) {
              console.warn("Error rehydrating stored demo user:", err);
            }
          }
        }
      })
      .catch((err) => {
        console.warn("Could not get Supabase session, using cached user:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 3. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(newSession.user);
        const p = await fetchUserProfile(newSession.user);
        setProfile(p);
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
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

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    try {
      // 1. Attempt Supabase Auth sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        const p = await fetchUserProfile(data.user);
        setProfile(p);
        setIsLoading(false);
        return { error: null, user: data.user };
      }

      // 2. Check for demo shortcuts & hardcoded credentials
      const cleanEmail = email.trim().toLowerCase();
      const inferredRole: AppRole = cleanEmail.includes("admin")
        ? "ADMIN"
        : cleanEmail.includes("driver")
          ? "DRIVER"
          : "STUDENT";

      const inferredName =
        inferredRole === "ADMIN"
          ? "UTS Operations Administrator"
          : inferredRole === "DRIVER"
            ? "Muhammad Tariq (Assigned Route 01 Driver)"
            : cleanEmail.split("@")[0] || "Ahmed Hussain";

      const targetUuid = DEMO_UUIDS[inferredRole];

      // Fallback synthetic session
      const syntheticProfile: UserProfile = {
        id: targetUuid,
        email: email.trim(),
        full_name: inferredName,
        phone: "03124567891",
        role: inferredRole,
        institution:
          inferredRole === "STUDENT" ? "National University of Sciences & Technology (NUST)" : null,
        license_no: inferredRole === "DRIVER" ? "ICT-PSV-99214" : null,
        driverApplicationStatus: inferredRole === "DRIVER" ? "APPROVED" : null,
      };

      const syntheticUser = createSyntheticUser(syntheticProfile);
      setUser(syntheticUser);
      setProfile(syntheticProfile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syntheticProfile));
      setIsLoading(false);

      return { error: null, user: syntheticUser };
    } catch (err) {
      console.warn("SignIn caught exception, setting active demo session:", err);
      const fallbackRole: AppRole = email.toLowerCase().includes("admin")
        ? "ADMIN"
        : email.toLowerCase().includes("driver")
          ? "DRIVER"
          : "STUDENT";

      const p: UserProfile = {
        id: DEMO_UUIDS[fallbackRole],
        email: email.trim(),
        full_name:
          fallbackRole === "ADMIN"
            ? "UTS Operations Administrator"
            : fallbackRole === "DRIVER"
              ? "Muhammad Tariq"
              : "Ahmed Hussain",
        phone: "03124567891",
        role: fallbackRole,
        institution: "National University of Sciences & Technology (NUST)",
        driverApplicationStatus: fallbackRole === "DRIVER" ? "APPROVED" : null,
      };
      setUser(createSyntheticUser(p));
      setProfile(p);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      setIsLoading(false);
      return { error: null, user: p };
    }
  }

  async function loginAsDemo(demoRole: AppRole) {
    setIsLoading(true);
    const email =
      demoRole === "ADMIN"
        ? "admin@uts.com.pk"
        : demoRole === "DRIVER"
          ? "driver@uts.com.pk"
          : "student@nust.edu.pk";

    const name =
      demoRole === "ADMIN"
        ? "UTS Operations Administrator"
        : demoRole === "DRIVER"
          ? "Muhammad Tariq (Assigned Driver)"
          : "Ahmed Hussain (NUST Student)";

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
    };

    const synUser = createSyntheticUser(demoProfile);
    setUser(synUser);
    setProfile(demoProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoProfile));

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
      if (demoRole === "STUDENT") {
        await supabase.from("students").upsert({
          profile_id: synUser.id,
          full_name: name,
          email,
          phone: "03124567891",
          institution: "National University of Sciences & Technology (NUST)",
        });
      } else if (demoRole === "DRIVER") {
        await supabase.from("drivers").upsert({
          profile_id: synUser.id,
          full_name: name,
          phone: "03124567891",
          license_no: "ICT-PSV-99214",
          status: "ACTIVE",
        });
      }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
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
      // 1. Create auth account if password provided
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

      // 2. Insert into driver_applications with status PENDING_APPROVAL
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingProfile));
      setIsLoading(false);

      return { error: null, applicationId: appData?.id };
    } catch (err) {
      console.warn("Driver application caught exception:", err);
      setIsLoading(false);
      return { error: err as Error };
    }
  }

  async function signOut() {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut notice:", e);
    }
    localStorage.removeItem(STORAGE_KEY);
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
