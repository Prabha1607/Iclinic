export interface PatientProfile {
  id: number;
  user_id: number;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  preferred_language?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: number;
  role_id: number;
  appointment_type_id?: number | null;
  first_name: string;
  last_name: string;
  country_code: string;
  phone_no: string;           // backend uses phone_no
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  patient_profile?: PatientProfile | null;
}
