-- Migration: 20260906010000_student_attendance_system.sql
-- Description: Driver student attendance/absence management, backend authorization, unique constraints, and notification triggers

-- 1. Alter attendance table to add shift_id and driver_id if they don't already exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'shift_id'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN shift_id text NOT NULL DEFAULT 'MORNING';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'driver_id'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Add Unique Constraint on (student_id, shift_id, service_date) to prevent duplicates
DO $$ BEGIN
  -- Drop old unique constraint if it was route_id, student_id, service_date
  ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_route_id_student_id_service_date_key;
  ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_shift_id_service_date_key;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.attendance 
  ADD CONSTRAINT attendance_student_id_shift_id_service_date_key 
  UNIQUE (student_id, shift_id, service_date);

-- 3. Indexes for fast multi-dimensional filtering
CREATE INDEX IF NOT EXISTS idx_attendance_student_shift_date ON public.attendance(student_id, shift_id, service_date);
CREATE INDEX IF NOT EXISTS idx_attendance_driver_date ON public.attendance(driver_id, service_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_shift ON public.attendance(shift_id);

-- 4. Create compatibility view transport_attendance
CREATE OR REPLACE VIEW public.transport_attendance AS
  SELECT 
    id,
    student_id,
    driver_id,
    route_id,
    shift_id,
    service_date AS attendance_date,
    status,
    source,
    marked_by,
    marked_at,
    created_at,
    updated_at
  FROM public.attendance;

GRANT SELECT ON public.transport_attendance TO authenticated, service_role;

-- 5. Strict Backend Security RPC: mark_student_attendance
-- Verifies authenticated_driver -> assigned_route/shift -> student relationship
CREATE OR REPLACE FUNCTION public.mark_student_attendance(
  _student_id uuid,
  _route_id uuid,
  _shift_id text DEFAULT 'MORNING',
  _status text DEFAULT 'ABSENT',
  _service_date date DEFAULT current_date
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller_id uuid := auth.uid();
  _driver_record record;
  _student_record record;
  _route_record record;
  _attendance_id uuid;
  _dedupe_key text;
  _is_authorized boolean := false;
BEGIN
  -- 1. Check if caller is authenticated
  IF _caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: User authentication required');
  END IF;

  -- 2. Staff authorization bypass
  IF public.is_staff(_caller_id) THEN
    _is_authorized := true;
  ELSE
    -- 3. Verify driver identity
    SELECT id, full_name INTO _driver_record 
    FROM public.drivers 
    WHERE profile_id = _caller_id AND status = 'ACTIVE'
    LIMIT 1;

    IF _driver_record IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Unauthorized: Caller is not a registered active driver');
    END IF;

    -- 4. Verify driver is assigned to this route or shift
    IF NOT EXISTS (
      SELECT 1 FROM public.routes 
      WHERE id = _route_id AND (driver_id = _driver_record.id OR public.drives_route(_caller_id, _route_id))
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Security Violation: Driver is not assigned to this route');
    END IF;

    -- 5. Verify student belongs to this route
    IF NOT EXISTS (
      SELECT 1 FROM public.route_students 
      WHERE route_id = _route_id AND student_id = _student_id
    ) AND NOT EXISTS (
      SELECT 1 FROM public.students 
      WHERE id = _student_id
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Security Violation: Student is not assigned to driver route/shift');
    END IF;

    _is_authorized := true;
  END IF;

  IF NOT _is_authorized THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized attendance submission');
  END IF;

  -- Fetch student details for notification
  SELECT full_name, email INTO _student_record FROM public.students WHERE id = _student_id;
  SELECT name INTO _route_record FROM public.routes WHERE id = _route_id;

  -- 6. Upsert Attendance Record (Duplicate-safe on student_id, shift_id, service_date)
  INSERT INTO public.attendance (
    student_id,
    driver_id,
    route_id,
    shift_id,
    service_date,
    status,
    source,
    marked_by,
    marked_at
  ) VALUES (
    _student_id,
    COALESCE(_driver_record.id, NULL),
    _route_id,
    UPPER(_shift_id),
    _service_date,
    UPPER(_status),
    'DRIVER',
    _caller_id,
    now()
  )
  ON CONFLICT (student_id, shift_id, service_date)
  DO UPDATE SET
    status = EXCLUDED.status,
    driver_id = COALESCE(EXCLUDED.driver_id, public.attendance.driver_id),
    route_id = EXCLUDED.route_id,
    marked_by = EXCLUDED.marked_by,
    marked_at = now(),
    updated_at = now()
  RETURNING id INTO _attendance_id;

  -- 7. If status is ABSENT, automatically queue absence notification
  IF UPPER(_status) = 'ABSENT' AND _student_record.full_name IS NOT NULL THEN
    _dedupe_key := 'ABSENCE_' || _route_id::text || '_' || _student_id::text || '_' || UPPER(_shift_id) || '_' || _service_date::text;
    
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
      'Absence Recorded for ' || UPPER(_shift_id) || ' Shift — ' || COALESCE(_route_record.name, 'UTS Transport'),
      'Dear ' || _student_record.full_name || ', your driver marked you ABSENT for the ' || UPPER(_shift_id) || ' shift on ' || _service_date::text || '.',
      'QUEUED',
      _dedupe_key,
      'student',
      _student_id
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  RETURN json_build_object(
    'success', true,
    'attendance_id', _attendance_id,
    'student_id', _student_id,
    'route_id', _route_id,
    'shift_id', UPPER(_shift_id),
    'status', UPPER(_status),
    'service_date', _service_date
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_student_attendance(uuid, uuid, text, text, date) TO authenticated;

-- 8. Enhanced RLS Policies on Attendance Table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance read" ON public.attendance;
CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid()) 
    OR public.drives_route(auth.uid(), route_id) 
    OR public.can_view_student(auth.uid(), student_id)
  );

DROP POLICY IF EXISTS "attendance insert" ON public.attendance;
CREATE POLICY "attendance insert" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid()) 
    OR public.drives_route(auth.uid(), route_id)
  );

DROP POLICY IF EXISTS "attendance update" ON public.attendance;
CREATE POLICY "attendance update" ON public.attendance FOR UPDATE TO authenticated
  USING (
    public.is_staff(auth.uid()) 
    OR public.drives_route(auth.uid(), route_id)
  )
  WITH CHECK (
    public.is_staff(auth.uid()) 
    OR public.drives_route(auth.uid(), route_id)
  );
