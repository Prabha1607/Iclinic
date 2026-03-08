export interface AppointmentType {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailableSlot {
  id: number;
  provider_id: number;
  availability_date: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
  created_by?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
