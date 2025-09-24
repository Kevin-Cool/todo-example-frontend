
const raw: string = import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7091";
const trimmed: string = raw.trim().replace(/\/+$/, ""); 

if (trimmed.length === 0) {
    console.warn("VITE_API_BASE_URL not set. Falling back to https://localhost:7091");
}
export const API_BASE_URL: string = trimmed.length > 0 ? trimmed : "https://localhost:7091";
