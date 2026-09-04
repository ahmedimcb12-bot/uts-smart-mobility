
-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN','ADMIN','DRIVER','STUDENT','PARENT');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('ADMIN','SUPER_ADMIN'));
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- ===== Fleet & people =====
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  license_no text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers read" ON public.drivers FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR profile_id = auth.uid());
CREATE POLICY "drivers manage" ON public.drivers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_code text NOT NULL UNIQUE,
  category text NOT NULL,
  capacity integer,
  status text NOT NULL DEFAULT 'ACTIVE',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles read" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles manage" ON public.vehicles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  shift text NOT NULL DEFAULT 'MORNING',
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routes TO authenticated;
GRANT ALL ON public.routes TO service_role;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routes read" ON public.routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "routes manage" ON public.routes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  sequence integer NOT NULL DEFAULT 1,
  pickup_time text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_stops TO authenticated;
GRANT ALL ON public.route_stops TO service_role;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stops read" ON public.route_stops FOR SELECT TO authenticated USING (true);
CREATE POLICY "stops manage" ON public.route_stops FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parents TO authenticated;
GRANT ALL ON public.parents TO service_role;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents read" ON public.parents FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR profile_id = auth.uid());
CREATE POLICY "parents manage" ON public.parents FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES public.parents(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  institution text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.route_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES public.route_stops(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_students TO authenticated;
GRANT ALL ON public.route_students TO service_role;
ALTER TABLE public.route_students ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.drives_route(_user_id uuid, _route_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.routes r
    JOIN public.drivers d ON d.id = r.driver_id
    WHERE r.id = _route_id AND d.profile_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_student(_user_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff(_user_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = _student_id AND s.profile_id = _user_id)
    OR EXISTS (
      SELECT 1 FROM public.students s JOIN public.parents p ON p.id = s.parent_id
      WHERE s.id = _student_id AND p.profile_id = _user_id)
    OR EXISTS (
      SELECT 1 FROM public.route_students rs WHERE rs.student_id = _student_id
        AND public.drives_route(_user_id, rs.route_id));
$$;

CREATE POLICY "students read" ON public.students FOR SELECT TO authenticated
  USING (public.can_view_student(auth.uid(), id));
CREATE POLICY "students manage" ON public.students FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "route_students read" ON public.route_students FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id) OR public.can_view_student(auth.uid(), student_id));
CREATE POLICY "route_students manage" ON public.route_students FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ===== Operations =====
CREATE TABLE public.route_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  service_date date NOT NULL DEFAULT current_date,
  started_at timestamptz,
  ended_at timestamptz,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, service_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_runs TO authenticated;
GRANT ALL ON public.route_runs TO service_role;
ALTER TABLE public.route_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "runs read" ON public.route_runs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id));
CREATE POLICY "runs write" ON public.route_runs FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id));
CREATE POLICY "runs update" ON public.route_runs FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id))
  WITH CHECK (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id));

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  service_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'PRESENT',
  source text NOT NULL DEFAULT 'DRIVER',
  marked_by uuid,
  marked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, student_id, service_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id) OR public.can_view_student(auth.uid(), student_id));
CREATE POLICY "attendance insert" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id));
CREATE POLICY "attendance update" ON public.attendance FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id))
  WITH CHECK (public.is_staff(auth.uid()) OR public.drives_route(auth.uid(), route_id));

-- ===== Fees =====
CREATE TABLE public.fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  billing_period text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PKR',
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, billing_period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_records TO authenticated;
GRANT ALL ON public.fee_records TO service_role;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fees read" ON public.fee_records FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.can_view_student(auth.uid(), student_id));
CREATE POLICY "fees manage" ON public.fee_records FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_record_id uuid NOT NULL REFERENCES public.fee_records(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  method text,
  reference text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments manage" ON public.payments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ===== Notifications =====
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  channel text NOT NULL DEFAULT 'EMAIL',
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates read" ON public.notification_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates manage" ON public.notification_templates FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

INSERT INTO public.notification_templates (key, subject, body) VALUES
  ('ABSENCE_NOTICE','Absence recorded on {{route_name}}','Dear {{recipient_name}}, {{student_name}} was not marked present on {{route_name}} for {{service_date}}.'),
  ('FEE_OVERDUE','Transport fee overdue — {{billing_period}}','Dear {{recipient_name}}, the transport fee of {{amount}} for {{billing_period}} was due on {{due_date}} and is still outstanding.'),
  ('ROUTE_UPDATE','Update for {{route_name}}','Dear {{recipient_name}}, there is an update for {{route_name}}: {{message}}'),
  ('ANNOUNCEMENT','{{subject}}','{{message}}');

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text REFERENCES public.notification_templates(key) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'GENERAL',
  channel text NOT NULL DEFAULT 'EMAIL',
  recipient_name text,
  recipient_email text,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED',
  dedupe_key text UNIQUE,
  related_type text,
  related_id uuid,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications staff" ON public.notifications FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "notifications driver insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'DRIVER'));

-- ===== Reviews, complaints, requests =====
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name text,
  reviewer_email text,
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  route_label text,
  overall_rating integer NOT NULL,
  driver_rating integer,
  comfort_rating integer,
  punctuality_rating integer,
  cleanliness_rating integer,
  ac_rating integer,
  pickup_dropoff_rating integer,
  communication_rating integer,
  feedback text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "reviews public insert" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "reviews staff manage" ON public.reviews FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE SEQUENCE public.complaint_seq START 1000;
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('UTS-C-' || nextval('public.complaint_seq')),
  customer_name text,
  customer_email text,
  customer_phone text,
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  review_id uuid REFERENCES public.reviews(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'Other',
  priority text NOT NULL DEFAULT 'MEDIUM',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT USAGE ON SEQUENCE public.complaint_seq TO anon, authenticated, service_role;
GRANT INSERT ON public.complaints TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "complaints public insert" ON public.complaints FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "complaints staff manage" ON public.complaints FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.transport_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  organization text,
  service_type text NOT NULL,
  pickup_location text,
  dropoff_location text,
  city text,
  start_date date,
  passengers integer,
  notes text,
  status text NOT NULL DEFAULT 'NEW',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.transport_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_requests TO authenticated;
GRANT ALL ON public.transport_requests TO service_role;
ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests public insert" ON public.transport_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "requests staff manage" ON public.transport_requests FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER parents_updated_at BEFORE UPDATE ON public.parents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER fees_updated_at BEFORE UPDATE ON public.fee_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER requests_updated_at BEFORE UPDATE ON public.transport_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
