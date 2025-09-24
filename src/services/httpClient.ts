import { API_BASE_URL } from "../config/apiConfig";
import { ApiError } from "./loginService";
import { AuthService } from "../auth/AuthService";

export interface RequestOptions {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    body?: unknown;
    requireAuth?: boolean;
    contentType?: "json" | "text";
}

export function buildHeaders(requireAuth: boolean, contentType: "json" | "text"): Headers {
    const headers: Headers = new Headers();

    if (contentType === "json") {
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
    }

    if (requireAuth) {
        const { token }: { token: string | null } = AuthService.getInstance().snapshot();
        if (token) {
            const withoutPrefix: string = token.startsWith("Bearer ") ? token.slice(7) : token;
            const cleaned: string = withoutPrefix.replace(/^"+|"+$/g, "");
            headers.set("Authorization", `Bearer ${cleaned}`);
        }
    }

    return headers;
}

/** Core fetch wrapper that returns parsed JSON or void on 204 */
export async function httpRequestJson<TResponse>(options: RequestOptions): Promise<TResponse> {
    const method: "GET" | "POST" | "PUT" | "DELETE" = options.method;
    const path: string = options.path;
    const requireAuth: boolean = options.requireAuth ?? true;
    const contentType: "json" | "text" = options.contentType ?? "json";

    const url: string = `${API_BASE_URL}${path}`;
    const init: RequestInit = {
        method,
        headers: buildHeaders(requireAuth, contentType)
    };

    if (options.body !== undefined) {
        init.body = contentType === "json" ? JSON.stringify(options.body) : String(options.body);
    }

    const response: Response = await fetch(url, init);

    if (!response.ok) {
        let payload: unknown = null;
        try {
            const ct: string | null = response.headers.get("content-type");
            if (ct !== null && ct.includes("application/json")) {
                payload = await response.json();
            } else {
                payload = await response.text();
            }
        } catch {
            // ignore parse errors
        }

        // Optional: auto-logout on 401/419
        if (response.status === 401 || response.status === 419) {
            try { AuthService.getInstance().clearToken(); } catch { }
        }

        const message: string = `Request failed (${response.status})`;
        throw new ApiError(message, response.status, payload);
    }

    if (response.status === 204) {
        // @ts-expect-error caller should type as Promise<void>
        return undefined;
    }

    const data: TResponse = await response.json() as TResponse;
    return data;
}
