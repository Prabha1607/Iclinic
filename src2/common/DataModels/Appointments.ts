export interface ProviderProfile {
  specialization?: string;
  qualification?: string;
  experience?: number;
  bio?: string;
}

export interface UserDetail {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
}

export interface ProviderDetail {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  provider_profile?: ProviderProfile;
}

export interface AppointmentTypeDetail {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  instructions?: string;
}

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

  cancelled_at?: string;
  cancellation_reason?: string;

  created_at: string;
  updated_at?: string;

  user?: UserDetail;
  provider?: ProviderDetail;
  appointment_type?: AppointmentTypeDetail;
}
