import type { AuthSnapshot, AuthState, DecodedJwtPayload, JwtToken } from "./AuthTypes";
import { decodeJwt, isExpired } from "./jwt";

export class AuthService {
    private static instance: AuthService | null = null;

    private readonly storageKey: string;
    private state: AuthState;
    private listeners: Set<(s: AuthSnapshot) => void>;
    private expiryTimerId: number | null = null;

    private constructor(storageKey: string) {
        this.storageKey = storageKey;
        this.listeners = new Set();
        this.state = { token: null, payload: null };
        this.hydrateFromStorage();
        this.scheduleExpiryCheck();          
        this.setupStorageSync();              
    }

    public static getInstance(): AuthService {
        const envKey: string | undefined = import.meta.env.VITE_AUTH_STORAGE_KEY as string | undefined;
        const key: string = envKey && envKey.trim().length > 0 ? envKey : "todo_auth_token";
        if (!AuthService.instance) AuthService.instance = new AuthService(key);
        return AuthService.instance;
    }

    public subscribe(listener: (s: AuthSnapshot) => void): () => void {
        this.listeners.add(listener);
        listener(this.snapshot());
        return (): void => { this.listeners.delete(listener); };
    }

    public snapshot(): AuthSnapshot {
        const payload: DecodedJwtPayload | null = this.state.payload;
        const expired: boolean = isExpired(payload);
        return {
            token: this.state.token,
            payload,
            isAuthenticated: Boolean(this.state.token) && !expired,
            isExpired: expired,
        };
    }

    public setToken(token: JwtToken | null): void {
        let payload: DecodedJwtPayload | null = null;

        if (token) {
            payload = decodeJwt(token);
            if (!payload || isExpired(payload)) {
                console.log("token failed", payload)
                // Invalid or already expired → purge immediately
                this.clearToken();
                return;
            }
        }

        this.state = { token, payload };

        if (token) {
            window.localStorage.setItem(this.storageKey, token);
        } else {
            window.localStorage.removeItem(this.storageKey);
        }

        this.emit();
        this.scheduleExpiryCheck();          
    }

    public clearToken(): void {
        console.log("clear token was called")
        this.state = { token: null, payload: null };
        window.localStorage.removeItem(this.storageKey);
        this.emit();
        this.cancelExpiryCheck();
    }

    public hydrateFromStorage(): void {
        const stored: string | null = window.localStorage.getItem(this.storageKey);
        if (!stored) { this.state = { token: null, payload: null }; return; }

        const payload: DecodedJwtPayload | null = decodeJwt(stored);
        if (!payload || isExpired(payload)) {
            // Handle invalid structure OR expired token at startup
            this.state = { token: null, payload: null };
            window.localStorage.removeItem(this.storageKey);
            return;
        }

        this.state = { token: stored, payload };
    }

    private scheduleExpiryCheck(): void {
        this.cancelExpiryCheck();

        const payload: DecodedJwtPayload | null = this.state.payload;
        if (!payload) return;

        const nowMs: number = Date.now();
        const expMs: number = payload.exp * 1000;
        const delayMs: number = Math.max(0, expMs - nowMs);

        // If the token expires in the future, schedule an exact clear
        if (delayMs > 0) {
            this.expiryTimerId = window.setTimeout((): void => {
                console.log("skedualed delete")
                this.clearToken();
            }, delayMs);
        } else {
            // Safety: already expired
                console.log("safty delete delete")
            this.clearToken();
        }
    }

    private cancelExpiryCheck(): void {
        if (this.expiryTimerId !== null) {
            window.clearTimeout(this.expiryTimerId);
            this.expiryTimerId = null;
        }
    }

    private setupStorageSync(): void {
        window.addEventListener("storage", (ev: StorageEvent): void => {
            if (ev.key !== this.storageKey) return;
            this.hydrateFromStorage();
            this.emit();
            this.scheduleExpiryCheck();
        });
    }

    private emit(): void {
        const snap: AuthSnapshot = this.snapshot();
        this.listeners.forEach((fn: (s: AuthSnapshot) => void): void => fn(snap));
    }
}
