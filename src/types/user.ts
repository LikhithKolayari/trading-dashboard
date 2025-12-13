export interface User {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
}

export interface LoginResponse {
  user: User;
}

export interface SessionResponse {
  user: User;
}
