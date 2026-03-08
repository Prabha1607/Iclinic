import api from "../../../lib/axios";
import type { Patient } from "../../../common/DataModels/Patient";
import type { AppointmentType, AvailableSlot } from "../../../common/DataModels/Booking";
import type { ProviderDetail } from "../../../common/DataModels/Appointments";

export interface CreatePatientPayload {
  first_name: string;
  last_name: string;
  role_id: number;
  country_code: string;
  email: string;
  phone_no: string;
  password: string;
  patient_profile: {
    date_of_birth: string;      // mandatory per backend
    gender: string;             // mandatory per backend
    address?: string;
    preferred_language?: string;
  };
}

export interface BookAppointmentPayload {
  user_id: number;
  provider_id: number;
  appointment_type_id: number;
  availability_slot_id: number;
  patient_name: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  reason_for_visit?: string;
  notes?: string;
  booking_channel?: "VOICE" | "WEB";
  instructions?: string;
}

export const initiateCall = (to_number: string): Promise<{ status: string; call_sid?: string }> =>
  api.post("/api/v1/voice/make-call", null, { params: { to_number } }).then((res) => res.data);

export const searchPatients = (query: string): Promise<Patient[]> =>
  api
    .get<Patient[]>("/api/v1/users/list", { params: { page: 1, page_size: 100 } })
    .then((res) =>
      res.data.filter(
        (p) =>
          p.first_name.toLowerCase().includes(query.toLowerCase()) ||
          p.last_name.toLowerCase().includes(query.toLowerCase()) ||
          p.email.toLowerCase().includes(query.toLowerCase()) ||
          p.phone_no.includes(query)
      )
    );

export const createPatient = (data: CreatePatientPayload): Promise<Patient> =>
  api.post<Patient>("/api/v1/users/patients/create", data).then((res) => res.data);

export const fetchAppointmentTypes = (): Promise<AppointmentType[]> =>
  api.get<AppointmentType[]>("/api/v1/appointment-types").then((res) => res.data);

export const fetchProvidersByType = (appointment_type_id: number): Promise<ProviderDetail[]> =>
  api
    .get<ProviderDetail[]>("/api/v1/users/providers/by-type", {
      params: { appointment_type_id, is_active: true },
    })
    .then((res) => res.data);

export const fetchProviderSlots = (provider_id: number): Promise<AvailableSlot[]> =>
  api
    .get<AvailableSlot[]>(`/api/v1/users/providers/${provider_id}/slots`)
    .then((res) => res.data);

export const bookAppointment = (data: BookAppointmentPayload): Promise<{ message: string }> =>
  api.post<{ message: string }>("/api/v1/booking/create", data).then((res) => res.data);

export const getUserAppointments = (user_id: number) =>
  api
    .get("/api/v1/booking/list", { params: { user_id, page: 1, page_size: 100 } })
    .then((res) => res.data);

export default api;
