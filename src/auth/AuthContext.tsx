import { createContext, useContext, useEffect, useMemo, useState, type JSX, type ReactNode } from "react";
import type { AuthSnapshot, JwtToken, DecodedJwtPayload } from "./AuthTypes";
import { AuthService } from "./AuthService";

export interface AuthContextValue {
    token: JwtToken | null;
    payload: DecodedJwtPayload | null;
    isAuthenticated: boolean;
    isExpired: boolean;
    setToken: (token: JwtToken) => void;
    clear: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const service: AuthService = useMemo<AuthService>(() => AuthService.getInstance(), []);
    const [snap, setSnap] = useState<AuthSnapshot>(service.snapshot());

    useEffect((): (() => void) => {
        const unsubscribe: () => void = service.subscribe((s: AuthSnapshot): void => setSnap(s));
        return unsubscribe;
    }, [service]);

    const value: AuthContextValue = useMemo<AuthContextValue>(() => ({
        token: snap.token,
        payload: snap.payload,
        isAuthenticated: snap.isAuthenticated,
        isExpired: snap.isExpired,
        setToken: (t: JwtToken): void => service.setToken(t),
        clear: (): void => service.clearToken(),
    }), [snap, service]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx: AuthContextValue | null = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}