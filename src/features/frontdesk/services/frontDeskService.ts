import api from "../../../lib/axios";
import type { Appointment } from "../../../common/DataModels/Appointments";
import type { Patient } from "../../../common/DataModels/Patient";

export interface AppointmentFilters {
  page?: number;
  page_size?: number;
  status?: "SCHEDULED" | "CANCELLED" | "COMPLETED" | null;
  provider_id?: number | null;
  user_id?: number | null;
  scheduled_date_from?: string | null;
  scheduled_date_to?: string | null;
  is_active?: boolean | null;
}

export const getAppointments = (
  filters: AppointmentFilters = {}
): Promise<Appointment[]> => {
  const params: Record<string, string | number | boolean> = {};
  if (filters.page) params.page = filters.page;
  if (filters.page_size) params.page_size = filters.page_size;
  if (filters.status) params.status = filters.status;
  if (filters.provider_id != null) params.provider_id = filters.provider_id;
  if (filters.user_id != null) params.user_id = filters.user_id;
  if (filters.scheduled_date_from) params.scheduled_date_from = filters.scheduled_date_from;
  if (filters.scheduled_date_to) params.scheduled_date_to = filters.scheduled_date_to;
  if (filters.is_active != null) params.is_active = filters.is_active;

  return api
    .get<Appointment[]>("/api/v1/booking/list", { params })
    .then((res) => res.data);
};

export const cancelAppointment = (
  appointment_id: number,
  cancellation_reason: string
): Promise<{ message: string }> =>
  api
    .patch<{ message: string }>(
      `/api/v1/booking/cancel/${appointment_id}`,
      cancellation_reason,
      { headers: { "Content-Type": "application/json" } }
    )
    .then((res) => res.data);

export interface PatientFilters {
  page?: number;
  page_size?: number;
  is_active?: boolean | null;
}

export const getPatients = (
  filters: PatientFilters = {}
): Promise<Patient[]> => {
  const params: Record<string, string | number | boolean> = {};
  if (filters.page) params.page = filters.page;
  if (filters.page_size) params.page_size = filters.page_size;
  if (filters.is_active != null) params.is_active = filters.is_active;

  return api
    .get<Patient[]>("/api/v1/users/list", { params })
    .then((res) => res.data);
};

export interface PatientUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  patient_profile?: {
    date_of_birth?: string;
    gender?: string;
    address?: string;
    preferred_language?: string;
  };
}

export const updatePatient = (
  user_id: number,
  data: PatientUpdatePayload
): Promise<Patient> =>
  api
    .put<Patient>(`/api/v1/users/update/${user_id}`, data)
    .then((res) => res.data);
