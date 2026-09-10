export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string;
          driver_id: string | null;
          id: string;
          marked_at: string;
          marked_by: string | null;
          route_id: string;
          service_date: string;
          shift_id: string;
          source: string;
          status: string;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          driver_id?: string | null;
          id?: string;
          marked_at?: string;
          marked_by?: string | null;
          route_id: string;
          service_date?: string;
          shift_id?: string;
          source?: string;
          status?: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          driver_id?: string | null;
          id?: string;
          marked_at?: string;
          marked_by?: string | null;
          route_id?: string;
          service_date?: string;
          shift_id?: string;
          source?: string;
          status?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      complaints: {
        Row: {
          category: string;
          created_at: string;
          customer_email: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          description: string;
          driver_id: string | null;
          id: string;
          priority: string;
          reference: string;
          resolution_notes: string | null;
          resolved_at: string | null;
          review_id: string | null;
          route_id: string | null;
          status: string;
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          category?: string;
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          description: string;
          driver_id?: string | null;
          id?: string;
          priority?: string;
          reference?: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          review_id?: string | null;
          route_id?: string | null;
          status?: string;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          description?: string;
          driver_id?: string | null;
          id?: string;
          priority?: string;
          reference?: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          review_id?: string | null;
          route_id?: string | null;
          status?: string;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "complaints_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      drivers: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          license_no: string | null;
          phone: string | null;
          profile_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          license_no?: string | null;
          phone?: string | null;
          profile_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          license_no?: string | null;
          phone?: string | null;
          profile_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fee_records: {
        Row: {
          amount: number;
          billing_period: string;
          created_at: string;
          currency: string;
          due_date: string;
          id: string;
          paid_at: string | null;
          route_id: string | null;
          status: string;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          amount?: number;
          billing_period: string;
          created_at?: string;
          currency?: string;
          due_date: string;
          id?: string;
          paid_at?: string | null;
          route_id?: string | null;
          status?: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          billing_period?: string;
          created_at?: string;
          currency?: string;
          due_date?: string;
          id?: string;
          paid_at?: string | null;
          route_id?: string | null;
          status?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fee_records_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fee_records_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_templates: {
        Row: {
          body: string;
          channel: string;
          created_at: string;
          id: string;
          key: string;
          subject: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          channel?: string;
          created_at?: string;
          id?: string;
          key: string;
          subject: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          channel?: string;
          created_at?: string;
          id?: string;
          key?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          category: string;
          channel: string;
          created_at: string;
          dedupe_key: string | null;
          error: string | null;
          id: string;
          recipient_email: string | null;
          recipient_name: string | null;
          related_id: string | null;
          related_type: string | null;
          sent_at: string | null;
          status: string;
          subject: string;
          template_key: string | null;
          updated_at: string;
        };
        Insert: {
          body: string;
          category?: string;
          channel?: string;
          created_at?: string;
          dedupe_key?: string | null;
          error?: string | null;
          id?: string;
          recipient_email?: string | null;
          recipient_name?: string | null;
          related_id?: string | null;
          related_type?: string | null;
          sent_at?: string | null;
          status?: string;
          subject: string;
          template_key?: string | null;
          updated_at?: string;
        };
        Update: {
          body?: string;
          category?: string;
          channel?: string;
          created_at?: string;
          dedupe_key?: string | null;
          error?: string | null;
          id?: string;
          recipient_email?: string | null;
          recipient_name?: string | null;
          related_id?: string | null;
          related_type?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          template_key?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_template_key_fkey";
            columns: ["template_key"];
            isOneToOne: false;
            referencedRelation: "notification_templates";
            referencedColumns: ["key"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          fee_record_id: string;
          id: string;
          method: string | null;
          paid_at: string;
          reference: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          fee_record_id: string;
          id?: string;
          method?: string | null;
          paid_at?: string;
          reference?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          fee_record_id?: string;
          id?: string;
          method?: string | null;
          paid_at?: string;
          reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_fee_record_id_fkey";
            columns: ["fee_record_id"];
            isOneToOne: false;
            referencedRelation: "fee_records";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          ac_rating: number | null;
          cleanliness_rating: number | null;
          comfort_rating: number | null;
          communication_rating: number | null;
          created_at: string;
          driver_rating: number | null;
          feedback: string | null;
          id: string;
          overall_rating: number;
          pickup_dropoff_rating: number | null;
          published: boolean;
          punctuality_rating: number | null;
          reviewer_email: string | null;
          reviewer_name: string | null;
          route_id: string | null;
          route_label: string | null;
        };
        Insert: {
          ac_rating?: number | null;
          cleanliness_rating?: number | null;
          comfort_rating?: number | null;
          communication_rating?: number | null;
          created_at?: string;
          driver_rating?: number | null;
          feedback?: string | null;
          id?: string;
          overall_rating: number;
          pickup_dropoff_rating?: number | null;
          published?: boolean;
          punctuality_rating?: number | null;
          reviewer_email?: string | null;
          reviewer_name?: string | null;
          route_id?: string | null;
          route_label?: string | null;
        };
        Update: {
          ac_rating?: number | null;
          cleanliness_rating?: number | null;
          comfort_rating?: number | null;
          communication_rating?: number | null;
          created_at?: string;
          driver_rating?: number | null;
          feedback?: string | null;
          id?: string;
          overall_rating?: number;
          pickup_dropoff_rating?: number | null;
          published?: boolean;
          punctuality_rating?: number | null;
          reviewer_email?: string | null;
          reviewer_name?: string | null;
          route_id?: string | null;
          route_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      route_runs: {
        Row: {
          completed: boolean;
          created_at: string;
          ended_at: string | null;
          id: string;
          route_id: string;
          service_date: string;
          started_at: string | null;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          route_id: string;
          service_date?: string;
          started_at?: string | null;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          route_id?: string;
          service_date?: string;
          started_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "route_runs_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      route_stops: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          pickup_time: string | null;
          route_id: string;
          sequence: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          pickup_time?: string | null;
          route_id: string;
          sequence?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          pickup_time?: string | null;
          route_id?: string;
          sequence?: number;
        };
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      route_students: {
        Row: {
          created_at: string;
          id: string;
          route_id: string;
          stop_id: string | null;
          student_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          route_id: string;
          stop_id?: string | null;
          student_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          route_id?: string;
          stop_id?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_students_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_students_stop_id_fkey";
            columns: ["stop_id"];
            isOneToOne: false;
            referencedRelation: "route_stops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_students_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      routes: {
        Row: {
          active: boolean;
          code: string | null;
          created_at: string;
          driver_id: string | null;
          id: string;
          name: string;
          shift: string;
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          active?: boolean;
          code?: string | null;
          created_at?: string;
          driver_id?: string | null;
          id?: string;
          name: string;
          shift?: string;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          active?: boolean;
          code?: string | null;
          created_at?: string;
          driver_id?: string | null;
          id?: string;
          name?: string;
          shift?: string;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "routes_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routes_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          institution: string | null;
          phone: string | null;
          profile_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          institution?: string | null;
          phone?: string | null;
          profile_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          institution?: string | null;
          phone?: string | null;
          profile_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      transport_requests: {
        Row: {
          city: string | null;
          created_at: string;
          dropoff_location: string | null;
          email: string | null;
          full_name: string;
          id: string;
          notes: string | null;
          organization: string | null;
          passengers: number | null;
          phone: string;
          pickup_location: string | null;
          service_type: string;
          start_date: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          dropoff_location?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          notes?: string | null;
          organization?: string | null;
          passengers?: number | null;
          phone: string;
          pickup_location?: string | null;
          service_type: string;
          start_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          dropoff_location?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          notes?: string | null;
          organization?: string | null;
          passengers?: number | null;
          phone?: string;
          pickup_location?: string | null;
          service_type?: string;
          start_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          capacity: number | null;
          category: string;
          created_at: string;
          id: string;
          notes: string | null;
          status: string;
          updated_at: string;
          vehicle_code: string;
        };
        Insert: {
          capacity?: number | null;
          category: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: string;
          updated_at?: string;
          vehicle_code: string;
        };
        Update: {
          capacity?: number | null;
          category?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: string;
          updated_at?: string;
          vehicle_code?: string;
        };
        Relationships: [];
      };
      driver_applications: {
        Row: {
          applicant_email: string;
          applicant_name: string;
          applicant_phone: string;
          cnic_no: string;
          created_at: string;
          experience_years: number | null;
          id: string;
          license_expiry: string | null;
          license_no: string;
          notes: string | null;
          profile_id: string | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["driver_application_status"];
          suspension_reason: string | null;
          updated_at: string;
          vehicle_preference: string | null;
        };
        Insert: {
          applicant_email: string;
          applicant_name: string;
          applicant_phone: string;
          cnic_no: string;
          created_at?: string;
          experience_years?: number | null;
          id?: string;
          license_expiry?: string | null;
          license_no: string;
          notes?: string | null;
          profile_id?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["driver_application_status"];
          suspension_reason?: string | null;
          updated_at?: string;
          vehicle_preference?: string | null;
        };
        Update: {
          applicant_email?: string;
          applicant_name?: string;
          applicant_phone?: string;
          cnic_no?: string;
          created_at?: string;
          experience_years?: number | null;
          id?: string;
          license_expiry?: string | null;
          license_no?: string;
          notes?: string | null;
          profile_id?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["driver_application_status"];
          suspension_reason?: string | null;
          updated_at?: string;
          vehicle_preference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_applications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: string;
          created_at: string;
          details: Json;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_address: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: string;
          created_at?: string;
          details?: Json;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip_address?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: string;
          created_at?: string;
          details?: Json;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip_address?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_issues: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          issue_category: string;
          priority: string;
          reported_by: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          status: string;
          updated_at: string;
          vehicle_id: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          issue_category: string;
          priority?: string;
          reported_by?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          status?: string;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          issue_category?: string;
          priority?: string;
          reported_by?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          status?: string;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_issues_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_records: {
        Row: {
          cost: number;
          created_at: string;
          created_by: string | null;
          id: string;
          invoice_url: string | null;
          next_service_due: string | null;
          notes: string | null;
          odometer_reading: number | null;
          performed_by: string | null;
          service_date: string;
          service_type: string;
          updated_at: string;
          vehicle_id: string;
        };
        Insert: {
          cost?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_url?: string | null;
          next_service_due?: string | null;
          notes?: string | null;
          odometer_reading?: number | null;
          performed_by?: string | null;
          service_date?: string;
          service_type: string;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          cost?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_url?: string | null;
          next_service_due?: string | null;
          notes?: string | null;
          odometer_reading?: number | null;
          performed_by?: string | null;
          service_date?: string;
          service_type?: string;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_driver_application: {
        Args: { _application_id: string; _notes?: string };
        Returns: Json;
      };
      can_view_student: {
        Args: { _student_id: string; _user_id: string };
        Returns: boolean;
      };
      complete_route_run: {
        Args: { _route_id: string; _service_date?: string };
        Returns: Json;
      };
      drives_route: {
        Args: { _route_id: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      mark_student_attendance: {
        Args: {
          _student_id: string;
          _route_id: string;
          _shift_id?: string;
          _status?: string;
          _service_date?: string;
        };
        Returns: Json;
      };
      reactivate_driver: {
        Args: { _driver_id: string };
        Returns: Json;
      };
      reject_driver_application: {
        Args: { _application_id: string; _rejection_reason: string };
        Returns: Json;
      };
      scan_and_queue_overdue_fee_reminders: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      suspend_driver: {
        Args: { _driver_id: string; _reason: string };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "SUPER_ADMIN" | "ADMIN" | "DRIVER" | "STUDENT";
      driver_application_status:
        "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ACTIVE";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["SUPER_ADMIN", "ADMIN", "DRIVER", "STUDENT"],
    },
  },
} as const;
