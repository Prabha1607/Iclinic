import api from "../../../lib/axios";
import type { Patient } from "../../../common/DataModels/Patient";

export interface PatientProfileUpdatePayload {
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

export const getMyProfile = (user_id: number): Promise<Patient> =>
  api.get<Patient[]>(`/api/v1/users/list`, { params: { page: 1, page_size: 100 } })
    .then((res) => {
      const me = res.data.find((u) => u.id === user_id);
      if (!me) throw new Error("Profile not found");
      return me;
    });

export const updateMyProfile = (
  user_id: number,
  data: PatientProfileUpdatePayload
): Promise<Patient> =>
  api.put<Patient>(`/api/v1/users/update/${user_id}`, data).then((res) => res.data);
