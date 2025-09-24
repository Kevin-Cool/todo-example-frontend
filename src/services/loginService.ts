import { API_BASE_URL } from "../config/apiConfig";

export interface LoginRequest {
    email: string;
    password: string;
}

export type JwtToken = string;

export class ApiError extends Error {
    public readonly status: number;
    public readonly details: unknown;

    constructor(message: string, status: number, details: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

export async function login(request: LoginRequest): Promise<JwtToken> {
    const endpoint: string = `${API_BASE_URL}/api/login`;

    const response: Response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: request.email,
            password: request.password
        })
    });

    if (!response.ok) {
        let payload: unknown = null;
        try {
            const contentType: string | null = response.headers.get("content-type");
            if (contentType !== null && contentType.includes("application/json")) {
                payload = await response.json();
            } else {
                payload = await response.text();
            }
        } catch {
            // Ignore parse issues
        }
        const message: string = `Login failed (${response.status})`;
        throw new ApiError(message, response.status, payload);
    }

    // JWT is returned as raw string
    const token: string = await response.text();
    if (token.trim().length === 0) {
        throw new ApiError("Empty token received from server", response.status, token);
    }
    return token;
}
