export interface Appointment {
  id: number;

  user_id: number;
  provider_id: number;
  appointment_type_id: number;
  availability_slot_id: number;

  patient_name: string;

  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;

  status: "SCHEDULED" | "CANCELLED" | "COMPLETED";

  reason_for_visit?: string;
  notes?: string;

  booking_channel?: "VOICE" | "WEB";
  instructions?: string;

  created_at: string;
  updated_at?: string;
}