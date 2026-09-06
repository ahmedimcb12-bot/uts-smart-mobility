-- Comprehensive Indexes, Extended Auth Triggers & Absence Helpers
-- Roles supported: 'SUPER_ADMIN', 'ADMIN', 'DRIVER', 'STUDENT'

-- 1. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_attendance_route_date ON public.attendance(route_id, service_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_due_status ON public.fee_records(due_date, status);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON public.fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_dedupe ON public.notifications(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_complaints_status_priority ON public.complaints(status, priority);
CREATE INDEX IF NOT EXISTS idx_route_students_route ON public.route_students(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_seq ON public.route_stops(route_id, sequence);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON public.reviews(published);
CREATE INDEX IF NOT EXISTS idx_transport_requests_status ON public.transport_requests(status);
CREATE INDEX IF NOT EXISTS idx_routes_active ON public.routes(active);

-- 2. Enhanced User Profile & Role Synchronization Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _assigned_role public.app_role;
  _role_str text;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

  -- Extract role from user metadata (default to STUDENT if not specified or valid)
  _role_str := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT'));
  IF _role_str NOT IN ('SUPER_ADMIN', 'ADMIN', 'DRIVER', 'STUDENT') THEN
    _role_str := 'STUDENT';
  END IF;
  _assigned_role := _role_str::public.app_role;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If Student, ensure record in students table
  IF _assigned_role = 'STUDENT' THEN
    INSERT INTO public.students (profile_id, full_name, email, phone, institution)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'institution'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- If Driver, ensure record in drivers table
  IF _assigned_role = 'DRIVER' THEN
    INSERT INTO public.drivers (profile_id, full_name, phone, license_no)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'license_no'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure auth trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. End Route & Automated Student Absence Function
CREATE OR REPLACE FUNCTION public.complete_route_run(
  _route_id uuid,
  _service_date date DEFAULT current_date
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _unmarked_count integer := 0;
  _notif_count integer := 0;
  _route_record record;
  _student_record record;
  _dedupe text;
BEGIN
  -- Verify route exists
  SELECT name INTO _route_record FROM public.routes WHERE id = _route_id;
  IF _route_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Route not found');
  END IF;

  -- Mark or complete the route run
  INSERT INTO public.route_runs (route_id, service_date, started_at, ended_at, completed)
  VALUES (_route_id, _service_date, now(), now(), true)
  ON CONFLICT (route_id, service_date)
  DO UPDATE SET ended_at = now(), completed = true;

  -- Find all enrolled students on this route who don't have attendance recorded for this date
  FOR _student_record IN
    SELECT s.id AS student_id, s.full_name, s.email, s.phone
    FROM public.route_students rs
    JOIN public.students s ON s.id = rs.student_id
    WHERE rs.route_id = _route_id
      AND NOT EXISTS (
        SELECT 1 FROM public.attendance a
        WHERE a.route_id = _route_id
          AND a.student_id = s.id
          AND a.service_date = _service_date
      )
  LOOP
    -- Insert absent attendance record
    INSERT INTO public.attendance (route_id, student_id, service_date, status, source, marked_by)
    VALUES (_route_id, _student_record.student_id, _service_date, 'ABSENT', 'AUTO', auth.uid())
    ON CONFLICT (route_id, student_id, service_date) DO NOTHING;

    _unmarked_count := _unmarked_count + 1;

    -- Create ABSENCE notification for the student (and visible to Admin/Super Admin)
    _dedupe := 'ABSENCE_' || _route_id::text || '_' || _student_record.student_id::text || '_' || _service_date::text;
    
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
      'ABSENCE_NOTICE',
      'ATTENDANCE',
      'EMAIL',
      _student_record.full_name,
      _student_record.email,
      'Absence recorded on ' || COALESCE(_route_record.name, 'Route'),
      'Dear ' || _student_record.full_name || ', you were marked absent on ' || COALESCE(_route_record.name, 'your route') || ' for ' || _service_date::text || '.',
      'QUEUED',
      _dedupe,
      'student',
      _student_record.student_id
    )
    ON CONFLICT (dedupe_key) DO NOTHING;

    _notif_count := _notif_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'route_id', _route_id,
    'service_date', _service_date,
    'marked_absent_count', _unmarked_count,
    'notifications_queued', _notif_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_route_run(uuid, date) TO authenticated;
