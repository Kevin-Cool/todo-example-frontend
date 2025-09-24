export type JwtToken = string;

export interface DecodedJwtPayload {
    userId: string; 
    email: string; 
    surname: string;
    name: string; 
    permissions: number; 
    exp: number; 
    iat?: number; 
    [key: string]: unknown; // allow extra claims without losing type-safety
}

export interface AuthState {
    token: JwtToken | null;
    payload: DecodedJwtPayload | null;
}

export interface AuthSnapshot extends AuthState {
    isAuthenticated: boolean;
    isExpired: boolean;
}