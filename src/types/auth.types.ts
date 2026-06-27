export interface JwtAccessPayload {
  sub: string;
  email: string;
}

export interface JwtRefreshPayload {
  sub: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  _id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}
