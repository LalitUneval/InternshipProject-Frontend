interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    string;
  expiresIn:    number;
  user: {
    id:    number;
    email: string;
    role:  string;
  };
}