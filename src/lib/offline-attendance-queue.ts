/**
 * Offline Attendance Queue Manager
 * Provides reliable, duplicate-safe offline persistence and automatic background
 * synchronization with Supabase PostgreSQL attendance table.
 */

import { supabase } from "@/integrations/supabase/client";

export interface QueuedAttendanceRecord {
  id: string;
  routeId: string;
  studentId: string;
  serviceDate: string;
  status: "PRESENT" | "ABSENT";
  source: string;
  markedBy?: string | null;
  markedAt: string;
  synced: boolean;
  retryCount: number;
}

const STORAGE_KEY = "uts_offline_attendance_queue_v3";

export class OfflineAttendanceQueue {
  /**
   * Retrieves all queued records from local storage
   */
  static getQueue(): QueuedAttendanceRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Failed to parse offline attendance queue:", e);
      return [];
    }
  }

  /**
   * Saves records to local storage
   */
  static saveQueue(records: QueuedAttendanceRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error("Failed to save offline attendance queue:", e);
    }
  }

  /**
   * Enqueues an attendance toggle action
   */
  static recordAttendance(
    routeId: string,
    studentId: string,
    status: "PRESENT" | "ABSENT",
    markedBy?: string | null,
  ): QueuedAttendanceRecord {
    const queue = this.getQueue();
    const serviceDate = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    // Check if record already exists in local queue for today
    const existingIndex = queue.findIndex(
      (r) => r.routeId === routeId && r.studentId === studentId && r.serviceDate === serviceDate,
    );

    const existingId = existingIndex >= 0 ? queue[existingIndex]?.id : undefined;

    const record: QueuedAttendanceRecord = {
      id: existingId || `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      routeId,
      studentId,
      serviceDate,
      status,
      source: "DRIVER",
      markedBy: markedBy || null,
      markedAt: nowIso,
      synced: false,
      retryCount: 0,
    };

    if (existingIndex >= 0) {
      queue[existingIndex] = record;
    } else {
      queue.push(record);
    }

    this.saveQueue(queue);
    return record;
  }

  /**
   * Count of records waiting to sync
   */
  static getPendingCount(): number {
    return this.getQueue().filter((r) => !r.synced).length;
  }

  /**
   * Synchronizes all unsynced attendance marks with Supabase
   */
  static async syncWithCloud(): Promise<{ success: boolean; syncedCount: number; error?: any }> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { success: false, syncedCount: 0, error: "Device is offline" };
    }

    const queue = this.getQueue();
    const unsynced = queue.filter((r) => !r.synced);

    if (unsynced.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    try {
      const payload = unsynced.map((r) => ({
        route_id: r.routeId,
        student_id: r.studentId,
        service_date: r.serviceDate,
        status: r.status,
        source: r.source,
        marked_by: r.markedBy,
        marked_at: r.markedAt,
      }));

      // Duplicate-safe upsert on composite unique key (route_id, student_id, service_date)
      const { error } = await supabase.from("attendance").upsert(payload as any, {
        onConflict: "route_id,student_id,service_date",
      });

      if (error) {
        console.warn("Supabase attendance sync notice:", error);
        // Mark retry count
        const updatedQueue = queue.map((r) =>
          !r.synced ? { ...r, retryCount: r.retryCount + 1 } : r,
        );
        this.saveQueue(updatedQueue);
        return { success: false, syncedCount: 0, error };
      }

      // Mark all as synced
      const updatedQueue = queue.map((r) => ({ ...r, synced: true }));
      this.saveQueue(updatedQueue);

      return { success: true, syncedCount: unsynced.length };
    } catch (err) {
      console.warn("Sync exception:", err);
      return { success: false, syncedCount: 0, error: err };
    }
  }

  /**
   * Clears old synced items older than 7 days to preserve storage
   */
  static pruneOldRecords(): void {
    const queue = this.getQueue();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thresholdIso = sevenDaysAgo.toISOString().slice(0, 10);

    const pruned = queue.filter((r) => !r.synced || r.serviceDate >= thresholdIso);
    this.saveQueue(pruned);
  }
}
