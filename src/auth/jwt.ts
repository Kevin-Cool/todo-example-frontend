import type { DecodedJwtPayload } from "./AuthTypes";

function base64UrlDecode(input: string): string {
    const base64: string = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded: string = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary: string = atob(padded);

    let result: string = "";
    for (let i = 0; i < binary.length; i++) {
        result += String.fromCharCode(binary.charCodeAt(i));
    }

    try {
        // Decode UTF-8
        return decodeURIComponent(
            result
                .split("")
                .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
                .join("")
        );
    } catch {
        return result; // fallback for plain ASCII
    }
}

export function decodeJwt(token: string): DecodedJwtPayload | null {
    try {
        const parts: string[] = token.split(".");
        if (parts.length < 2) return null;

        const payloadJson: string = base64UrlDecode(parts[1]);
        const parsed: unknown = JSON.parse(payloadJson);

        if (typeof parsed !== "object" || parsed === null) return null;
        const raw: Record<string, unknown> = parsed as Record<string, unknown>;


        // Normalize case-sensitive keys
        const payload: DecodedJwtPayload = {
            userId: String(raw.userID ?? ""),
            email: String(raw.email ?? ""),
            surname: String(raw.surname ?? ""),
            name: String(raw.name ?? ""),
            permissions: Number(raw.permissions ?? 0),
            exp: Number(raw.exp), // exp must exist
            iat: raw.iat ? Number(raw.iat) : undefined,
            ...raw, // keep all original claims for flexibility
        };

        if (!payload.userId || Number.isNaN(payload.permissions) || Number.isNaN(payload.exp)) {
            return null; // invalid or missing required fields
        }

        return payload;
    } catch {
        return null;
    }
}

export function isExpired(payload: DecodedJwtPayload | null, nowEpochSec?: number): boolean {
    if (!payload) return true;
    const now: number = typeof nowEpochSec === "number" ? nowEpochSec : Math.floor(Date.now() / 1000);
    return payload.exp <= now;
}