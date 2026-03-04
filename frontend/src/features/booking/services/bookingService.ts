import api from "../../../lib/axios";

export const initiateCall = (to_number: string): Promise<{ status: string; call_sid?: string }> =>
    api.post("/api/v1/voice/make-call", null, {
        params: { to_number }
    }).then(res => res.data);