-- Migration: 20260906000000_driver_applications_and_audit.sql
-- Description: Driver application lifecycle, audit logging, vehicle maintenance records, vehicle issues, and security RPCs

-- 1. Create Driver Application Status Enum if not exists
DO $$ BEGIN
  CREATE TYPE public.driver_application_status AS ENUM (
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'SUSPENDED',
    'ACTIVE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Driver Applications Table
CREATE TABLE IF NOT EXISTS public.driver_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  applicant_phone text NOT NULL,
  cnic_no text NOT NULL,
  license_no text NOT NULL,
  license_expiry date,
  experience_years integer DEFAULT 1,
  vehicle_preference text,
  status public.driver_application_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  rejection_reason text,
  suspension_reason text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.driver_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_applications TO authenticated;
GRANT ALL ON public.driver_applications TO service_role;

ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_apps public insert" ON public.driver_applications;
CREATE POLICY "driver_apps public insert" ON public.driver_applications FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "driver_apps applicant read" ON public.driver_applications;
CREATE POLICY "driver_apps applicant read" ON public.driver_applications FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR applicant_email = auth.jwt()->>'email' OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "driver_apps staff manage" ON public.driver_applications;
CREATE POLICY "driver_apps staff manage" ON public.driver_applications FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text NOT NULL DEFAULT 'ADMIN',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT INSERT ON public.audit_logs TO authenticated;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs staff read" ON public.audit_logs;
CREATE POLICY "audit_logs staff read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "audit_logs insert" ON public.audit_logs;
CREATE POLICY "audit_logs insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

-- 4. Create Vehicle Issues Table
CREATE TABLE IF NOT EXISTS public.vehicle_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  issue_category text NOT NULL,
  priority text NOT NULL DEFAULT 'MEDIUM',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_issues TO authenticated;
GRANT ALL ON public.vehicle_issues TO service_role;

ALTER TABLE public.vehicle_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issues staff manage" ON public.vehicle_issues;
CREATE POLICY "issues staff manage" ON public.vehicle_issues FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "issues driver view insert" ON public.vehicle_issues;
CREATE POLICY "issues driver view insert" ON public.vehicle_issues FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'DRIVER') OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "issues driver insert" ON public.vehicle_issues;
CREATE POLICY "issues driver insert" ON public.vehicle_issues FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'DRIVER') OR public.is_staff(auth.uid()));

-- 5. Create Maintenance Records Table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  odometer_reading integer,
  service_date date NOT NULL DEFAULT current_date,
  next_service_due date,
  performed_by text,
  notes text,
  invoice_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_records TO authenticated;
GRANT ALL ON public.maintenance_records TO service_role;

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "maintenance staff manage" ON public.maintenance_records;
CREATE POLICY "maintenance staff manage" ON public.maintenance_records FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 6. Add Indexes
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON public.driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_driver_applications_email ON public.driver_applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issues_vehicle ON public.vehicle_issues(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issues_status ON public.vehicle_issues(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance_records(service_date);

-- 7. RPC: Approve Driver Application
CREATE OR REPLACE FUNCTION public.approve_driver_application(
  _application_id uuid,
  _notes text DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _app record;
  _target_user_id uuid;
BEGIN
  -- Verify caller is staff
  IF NOT public.is_staff(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
  END IF;

  SELECT * INTO _app FROM public.driver_applications WHERE id = _application_id;
  IF _app IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Driver application not found');
  END IF;

  _target_user_id := _app.profile_id;

  -- 1. Update application status
  UPDATE public.driver_applications
  SET status = 'APPROVED',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      notes = COALESCE(_notes, notes),
      updated_at = now()
  WHERE id = _application_id;

  -- 2. If user profile exists, assign DRIVER role and create/update driver record
  IF _target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, 'DRIVER')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.drivers (profile_id, full_name, phone, license_no, status)
    VALUES (
      _target_user_id,
      _app.applicant_name,
      _app.applicant_phone,
      _app.license_no,
      'ACTIVE'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Log to audit_logs
  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'ADMIN',
    'APPROVE_DRIVER',
    'driver_application',
    _application_id,
    json_build_object(
      'applicant_name', _app.applicant_name,
      'applicant_email', _app.applicant_email,
      'license_no', _app.license_no,
      'profile_id', _target_user_id
    )
  );

  RETURN json_build_object('success', true, 'application_id', _application_id, 'status', 'APPROVED');
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_driver_application(uuid, text) TO authenticated;

-- 8. RPC: Reject Driver Application
CREATE OR REPLACE FUNCTION public.reject_driver_application(
  _application_id uuid,
  _rejection_reason text
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _app record;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
  END IF;

  SELECT * INTO _app FROM public.driver_applications WHERE id = _application_id;
  IF _app IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Driver application not found');
  END IF;

  UPDATE public.driver_applications
  SET status = 'REJECTED',
      rejection_reason = _rejection_reason,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _application_id;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'ADMIN',
    'REJECT_DRIVER',
    'driver_application',
    _application_id,
    json_build_object(
      'applicant_name', _app.applicant_name,
      'applicant_email', _app.applicant_email,
      'rejection_reason', _rejection_reason
    )
  );

  RETURN json_build_object('success', true, 'application_id', _application_id, 'status', 'REJECTED');
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_driver_application(uuid, text) TO authenticated;

-- 9. RPC: Suspend Driver
CREATE OR REPLACE FUNCTION public.suspend_driver(
  _driver_id uuid,
  _reason text
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _driver record;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
  END IF;

  SELECT * INTO _driver FROM public.drivers WHERE id = _driver_id;
  IF _driver IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Driver record not found');
  END IF;

  UPDATE public.drivers
  SET status = 'SUSPENDED',
      updated_at = now()
  WHERE id = _driver_id;

  -- Revoke DRIVER role from user_roles
  IF _driver.profile_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _driver.profile_id AND role = 'DRIVER';
  END IF;

  -- Unassign driver from any active routes
  UPDATE public.routes SET driver_id = NULL WHERE driver_id = _driver_id;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'ADMIN',
    'SUSPEND_DRIVER',
    'drivers',
    _driver_id,
    json_build_object(
      'driver_name', _driver.full_name,
      'profile_id', _driver.profile_id,
      'reason', _reason
    )
  );

  RETURN json_build_object('success', true, 'driver_id', _driver_id, 'status', 'SUSPENDED');
END;
$$;

GRANT EXECUTE ON FUNCTION public.suspend_driver(uuid, text) TO authenticated;

-- 10. RPC: Reactivate Driver
CREATE OR REPLACE FUNCTION public.reactivate_driver(
  _driver_id uuid
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _driver record;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
  END IF;

  SELECT * INTO _driver FROM public.drivers WHERE id = _driver_id;
  IF _driver IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Driver record not found');
  END IF;

  UPDATE public.drivers
  SET status = 'ACTIVE',
      updated_at = now()
  WHERE id = _driver_id;

  IF _driver.profile_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_driver.profile_id, 'DRIVER')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'ADMIN',
    'REACTIVATE_DRIVER',
    'drivers',
    _driver_id,
    json_build_object(
      'driver_name', _driver.full_name,
      'profile_id', _driver.profile_id
    )
  );

  RETURN json_build_object('success', true, 'driver_id', _driver_id, 'status', 'ACTIVE');
END;
$$;

GRANT EXECUTE ON FUNCTION public.reactivate_driver(uuid) TO authenticated;

-- 11. RPC: Scan & Queue Overdue Fee Reminders (Idempotent Backend Automation)
CREATE OR REPLACE FUNCTION public.scan_and_queue_overdue_fee_reminders()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _fee record;
  _student record;
  _notif_count integer := 0;
  _updated_count integer := 0;
  _dedupe text;
BEGIN
  -- 1. Identify pending fees past due date and mark OVERDUE
  FOR _fee IN
    SELECT f.id, f.student_id, f.billing_period, f.amount, f.due_date, f.currency
    FROM public.fee_records f
    WHERE f.status = 'PENDING' AND f.due_date < current_date
  LOOP
    UPDATE public.fee_records SET status = 'OVERDUE', updated_at = now() WHERE id = _fee.id;
    _updated_count := _updated_count + 1;
  END LOOP;

  -- 2. Scan all OVERDUE fee records and generate deduplicated reminder notifications
  FOR _fee IN
    SELECT f.id, f.student_id, f.billing_period, f.amount, f.due_date, f.currency, s.full_name, s.email
    FROM public.fee_records f
    JOIN public.students s ON s.id = f.student_id
    WHERE f.status = 'OVERDUE'
  LOOP
    _dedupe := 'FEE_OVERDUE_' || _fee.student_id::text || '_' || _fee.billing_period;

    INSERT INTO public.notifications (
      template_key,
      category,
      channel,
      recipient_name,
      recipient_email,
      subject,
      body,
      status,
      dedupe_key,
      related_type,
      related_id
    ) VALUES (
      'FEE_OVERDUE',
      'FEES',
      'EMAIL',
      _fee.full_name,
      _fee.email,
      'Transport fee overdue — ' || _fee.billing_period,
      'Dear ' || _fee.full_name || ', your transport fee of ' || _fee.currency || ' ' || _fee.amount::text || ' for ' || _fee.billing_period || ' was due on ' || _fee.due_date::text || ' and remains outstanding. Please clear the balance.',
      'QUEUED',
      _dedupe,
      'student',
      _fee.student_id
    )
    ON CONFLICT (dedupe_key) DO NOTHING;

    _notif_count := _notif_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'fees_marked_overdue', _updated_count,
    'reminders_processed', _notif_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.scan_and_queue_overdue_fee_reminders() TO authenticated;
