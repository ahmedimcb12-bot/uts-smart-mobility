import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  Truck,
  GraduationCap,
  Sparkles,
  LogOut,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  CreditCard,
  Briefcase,
} from "lucide-react";
import { PageHero, PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Portal Login & Registration — UTS Smart Transport" },
      {
        name: "description",
        content:
          "Access the UTS Smart Transport portal for administrators, approved drivers, and students.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    role,
    isStaff,
    isDriver,
    isStudent,
    driverApplicationStatus,
    signIn,
    signUp,
    submitDriverApplication,
    loginAsDemo,
    signOut,
    isLoading,
  } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Student Signup form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentInstitution, setStudentInstitution] = useState(
    "National University of Sciences & Technology (NUST)",
  );
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Driver Application form state
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverCnic, setDriverCnic] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [driverExperience, setDriverExperience] = useState("3");
  const [driverVehiclePref, setDriverVehiclePref] = useState("Toyota Coaster (29-Seater)");
  const [driverNotes, setDriverNotes] = useState("");
  const [driverLoading, setDriverLoading] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [driverSuccessAppId, setDriverSuccessAppId] = useState<string | null>(null);

  // Active registration subtab
  const [regType, setRegType] = useState<"student" | "driver">("student");

  // Redirect if logged in and has active role
  useEffect(() => {
    if (user && profile) {
      if (isStaff) {
        navigate({ to: "/admin" });
      } else if (isDriver) {
        navigate({ to: "/driver/dashboard" });
      } else if (isStudent && driverApplicationStatus !== "PENDING_APPROVAL") {
        navigate({ to: "/student/dashboard" });
      }
    }
  }, [user, profile, isStaff, isDriver, isStudent, driverApplicationStatus, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);

    if (error) {
      setLoginError(error.message || "Failed to sign in. Please check your credentials.");
      toast.error(error.message || "Sign in failed");
    } else {
      toast.success("Welcome back to UTS Smart Transport!");
    }
  };

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentLoading(true);

    if (!studentName.trim() || !studentEmail.trim() || !studentPassword.trim()) {
      setStudentError("Please fill in all required fields.");
      setStudentLoading(false);
      return;
    }

    const { error } = await signUp(studentEmail, studentPassword, {
      full_name: studentName,
      phone: studentPhone,
      institution: studentInstitution,
    });
    setStudentLoading(false);

    if (error) {
      setStudentError(error.message || "Failed to create student account.");
      toast.error(error.message || "Sign up failed");
    } else {
      toast.success("Student account created successfully! Redirecting to dashboard...");
    }
  };

  const handleDriverApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError(null);
    setDriverLoading(true);

    if (
      !driverName.trim() ||
      !driverEmail.trim() ||
      !driverPhone.trim() ||
      !driverCnic.trim() ||
      !driverLicense.trim()
    ) {
      setDriverError(
        "Please fill in all mandatory application fields including CNIC and License No.",
      );
      setDriverLoading(false);
      return;
    }

    const { error, applicationId } = await submitDriverApplication({
      full_name: driverName,
      email: driverEmail,
      password: driverPassword || "UtsDriver@2026",
      phone: driverPhone,
      cnic_no: driverCnic,
      license_no: driverLicense,
      experience_years: parseInt(driverExperience, 10) || 3,
      vehicle_preference: driverVehiclePref,
      notes: driverNotes,
    });

    setDriverLoading(false);

    if (error) {
      setDriverError(error.message || "Failed to submit driver application.");
      toast.error(error.message || "Application submission failed");
    } else {
      setDriverSuccessAppId(applicationId || "UTS-APP-NEW");
      toast.success("Driver application submitted! Awaiting Operations Admin review.");
    }
  };

  // Demo Login Helper
  const handleDemoLogin = async (demoRole: AppRole) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await loginAsDemo(demoRole);
      toast.success(`Signed in as ${demoRole}! Redirecting...`);
      if (demoRole === "ADMIN") {
        navigate({ to: "/admin" });
      } else if (demoRole === "DRIVER") {
        navigate({ to: "/driver/dashboard" });
      } else {
        navigate({ to: "/student/dashboard" });
      }
    } catch (e) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Unified Access Portal"
        title="UTS Transport Portal"
        description="Secure role-based console for Operations Administrators, Verified Drivers, and Registered Students."
      />

      <section className="container-page py-14">
        <div className="mx-auto max-w-xl">
          {/* USER LOGGED IN STATE / DRIVER APPLICATION STATUS SCREEN */}
          {user ? (
            <div className="card-elevated p-8 text-center space-y-4">
              {driverApplicationStatus === "PENDING_APPROVAL" ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 animate-pulse">
                    <Clock className="h-8 w-8" />
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                    Application Pending Review
                  </Badge>
                  <h2 className="text-2xl font-bold text-foreground">
                    Driver Application Under Review
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thank you,{" "}
                    <strong className="text-foreground">{profile?.full_name || user.email}</strong>.
                    Your driver onboarding application has been submitted and is currently being
                    verified by the UTS Operations Management team.
                  </p>
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 text-xs text-left space-y-1.5 max-w-md mx-auto">
                    <p className="text-muted-foreground">
                      <strong>Account Email:</strong> {user.email}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Driver License:</strong> {profile?.license_no || "Under verification"}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Status:</strong>{" "}
                      <span className="text-amber-600 font-semibold">PENDING_APPROVAL</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-2">
                      *Driver console, route assignments, and passenger attendance tools will be
                      unlocked immediately once an Administrator approves your credentials.
                    </p>
                  </div>
                  <div className="pt-4 flex justify-center gap-3">
                    <Button variant="outline" onClick={() => signOut()}>
                      <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                </>
              ) : driverApplicationStatus === "REJECTED" ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <Badge variant="destructive">Application Not Approved</Badge>
                  <h2 className="text-2xl font-bold text-foreground">Driver Application Status</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Your driver registration could not be approved at this time.
                  </p>
                  {profile?.rejectionReason && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive max-w-md mx-auto text-left">
                      <strong>Admin Feedback:</strong> {profile.rejectionReason}
                    </div>
                  )}
                  <div className="pt-4 flex justify-center gap-3">
                    <Button variant="outline" onClick={() => signOut()}>
                      <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Currently Signed In</h2>
                  <p className="text-sm text-muted-foreground">
                    Signed in as{" "}
                    <strong className="text-foreground">{profile?.full_name || user.email}</strong>{" "}
                    ({role || "Authenticated"})
                  </p>

                  <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {isStaff && (
                      <Button asChild>
                        <Link to="/admin">
                          Operations Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {isDriver && (
                      <Button asChild>
                        <Link to="/driver/dashboard">
                          Driver Console <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {isStudent && (
                      <Button asChild>
                        <Link to="/student/dashboard">
                          Student Portal <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => signOut()}>
                      <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* UNAUTHENTICATED LOGIN & REGISTRATION INTERFACE */
            <div className="card-elevated p-6 sm:p-8">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Register / Apply</TabsTrigger>
                </TabsList>

                {/* SIGN IN TAB */}
                <TabsContent value="signin" className="mt-6 space-y-4">
                  {loginError && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@domain.com"
                          className="pl-9"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-9"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loginLoading}>
                      {loginLoading ? "Signing in..." : "Sign In to Portal"}
                    </Button>
                  </form>

                  {/* 1-Click Instant Demo Portals */}
                  <div className="mt-8 border-t border-border pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Instant 1-Click Demo Portals
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        Pre-configured roles
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDemoLogin("ADMIN")}
                        disabled={loginLoading}
                        className="group flex flex-col items-center rounded-xl border border-border p-3 text-center text-xs transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                      >
                        <ShieldCheck className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                        <span className="mt-1 font-semibold text-foreground">Admin Desk</span>
                        <span className="text-[10px] text-muted-foreground">Operations</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoLogin("DRIVER")}
                        disabled={loginLoading}
                        className="group flex flex-col items-center rounded-xl border border-border p-3 text-center text-xs transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                      >
                        <Truck className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                        <span className="mt-1 font-semibold text-foreground">Driver App</span>
                        <span className="text-[10px] text-muted-foreground">Attendance</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoLogin("STUDENT")}
                        disabled={loginLoading}
                        className="group flex flex-col items-center rounded-xl border border-primary/40 bg-primary/5 p-3 text-center text-xs transition-all hover:border-primary hover:bg-primary/10 active:scale-95"
                      >
                        <GraduationCap className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                        <span className="mt-1 font-bold text-primary">Student Hub</span>
                        <span className="text-[10px] text-muted-foreground">Live Route & Fees</span>
                      </button>
                    </div>
                  </div>
                </TabsContent>

                {/* SIGN UP / DRIVER APPLICATION TAB */}
                <TabsContent value="signup" className="mt-6 space-y-4">
                  {/* Sub-selector: Student vs Driver Application */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRegType("student")}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                        regType === "student"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" /> Student Signup
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegType("driver")}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                        regType === "driver"
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Briefcase className="h-4 w-4" /> Driver Application
                    </button>
                  </div>

                  {/* 1. STUDENT REGISTRATION */}
                  {regType === "student" && (
                    <form onSubmit={handleStudentSignup} className="space-y-4 pt-2">
                      {studentError && (
                        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{studentError}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="student-name">Student Full Name</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="student-name"
                            placeholder="Ahmed Hussain"
                            className="pl-9"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="student-email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="student-email"
                              type="email"
                              placeholder="ahmed@nust.edu.pk"
                              className="pl-9"
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="student-phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="student-phone"
                              type="tel"
                              placeholder="03124567891"
                              className="pl-9"
                              value={studentPhone}
                              onChange={(e) => setStudentPhone(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="student-institution">
                          University / College / Institute
                        </Label>
                        <Input
                          id="student-institution"
                          placeholder="e.g. NUST Islamabad, FAST, Air University"
                          value={studentInstitution}
                          onChange={(e) => setStudentInstitution(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="student-pass">Account Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="student-pass"
                            type="password"
                            placeholder="Minimum 6 characters"
                            className="pl-9"
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={studentLoading}>
                        {studentLoading ? "Creating account..." : "Register Student Account"}
                      </Button>
                    </form>
                  )}

                  {/* 2. DRIVER JOB APPLICATION */}
                  {regType === "driver" && (
                    <form onSubmit={handleDriverApplication} className="space-y-4 pt-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground">
                        <p className="font-semibold text-primary flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" /> Driver Vetting & Screening Policy
                        </p>
                        <p className="mt-1 text-[11px]">
                          Driver accounts require manual verification by UTS Operations Admins. Once
                          your application and driving license are approved, your Driver Console
                          credentials will be activated.
                        </p>
                      </div>

                      {driverError && (
                        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{driverError}</span>
                        </div>
                      )}

                      {driverSuccessAppId && (
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-600">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>
                            Application submitted successfully! Application ID: {driverSuccessAppId}
                            . Awaiting Admin verification.
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="driver-name">Driver Full Name *</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="driver-name"
                            placeholder="Muhammad Tariq"
                            className="pl-9"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="driver-email">Email Address *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="driver-email"
                              type="email"
                              placeholder="tariq@uts.com.pk"
                              className="pl-9"
                              value={driverEmail}
                              onChange={(e) => setDriverEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="driver-phone">Mobile Phone *</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="driver-phone"
                              type="tel"
                              placeholder="03124567891"
                              className="pl-9"
                              value={driverPhone}
                              onChange={(e) => setDriverPhone(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="driver-cnic">CNIC Number *</Label>
                          <Input
                            id="driver-cnic"
                            placeholder="37405-1234567-1"
                            value={driverCnic}
                            onChange={(e) => setDriverCnic(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="driver-license">Driving License No (PSV/LTV) *</Label>
                          <Input
                            id="driver-license"
                            placeholder="ICT-PSV-99214"
                            value={driverLicense}
                            onChange={(e) => setDriverLicense(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="driver-exp">Commercial Driving Experience (Years)</Label>
                          <Input
                            id="driver-exp"
                            type="number"
                            min="1"
                            max="40"
                            placeholder="3"
                            value={driverExperience}
                            onChange={(e) => setDriverExperience(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Preferred Vehicle Type</Label>
                          <Select value={driverVehiclePref} onValueChange={setDriverVehiclePref}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Toyota Coaster (29-Seater)">
                                Toyota Coaster (29-Seater)
                              </SelectItem>
                              <SelectItem value="Toyota Hiace (15-Seater)">
                                Toyota Hiace (15-Seater)
                              </SelectItem>
                              <SelectItem value="Large Transit Bus (50-Seater)">
                                Large Transit Bus (50-Seater)
                              </SelectItem>
                              <SelectItem value="Executive Sedan (VIP)">
                                Executive Sedan (VIP)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="driver-pass">Set Account Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="driver-pass"
                            type="password"
                            placeholder="Minimum 6 characters"
                            className="pl-9"
                            value={driverPassword}
                            onChange={(e) => setDriverPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={driverLoading}>
                        {driverLoading
                          ? "Submitting application..."
                          : "Submit Driver Application for Review"}
                      </Button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
