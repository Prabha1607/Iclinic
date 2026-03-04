export interface LoginRequest {
    identifier : string;
    password : string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  country_code: string;
  role_id: number;
  phone_no: string;
  email: string;
  password: string;
}


export interface AuthResponse {
    access_token : string;
    msg : string;
}

export interface AuthState {
    token : string | null;
    isAuthenticated : boolean;
}

export interface Role {
    id: number;
    name: string;
}