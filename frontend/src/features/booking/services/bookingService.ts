import api from "../../../lib/axios";
import type { Appointment } from "../../../common/DataModels/Appointments";

export const initiateCall = (to_number: string): Promise<{ status: string; call_sid?: string }> =>
    api.post("/api/v1/voice/make-call", null, {
        params: { to_number }
    }).then(res => res.data);


export const getUserAppointments = (
  user_id: number
): Promise<Appointment[]> =>
  api
    .get<Appointment[]>(`/api/v1/booking/user/${user_id}`)
    .then((res) => res.data);

export default api;


