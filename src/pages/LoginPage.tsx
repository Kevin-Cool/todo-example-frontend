import { useRef, useState, type FormEvent, type JSX } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { login, type LoginRequest, type JwtToken, ApiError } from "../services/loginService";
import { useAuth } from "../auth/AuthContext";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "../styles/LoginPage.css";

export default function LoginPage(): JSX.Element {
    const toastRef = useRef<Toast | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { setToken, isAuthenticated } = useAuth();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        const payload: LoginRequest = { email, password };

        try {
            const jwt: JwtToken = await login(payload);
            setToken(jwt);


            toastRef.current?.show({
                severity: "success",
                summary: "Logged in",
                detail: `JWT received (${jwt.substring(0, 16)}...)`
            });


            const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/";
            navigate(from, { replace: true });
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                const detail: string = typeof err.details === "string"
                    ? err.details
                    : (typeof err.details === "object" && err.details !== null && "message" in err.details)
                        ? String((err.details as Record<string, unknown>).message ?? err.message)
                        : err.message;
                toastRef.current?.show({ severity: "error", summary: "Login failed", detail });
            } else {
                toastRef.current?.show({ severity: "error", summary: "Unexpected error", detail: "Something went wrong. Please try again." });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const isDisabled: boolean = submitting || email.trim().length === 0 || password.trim().length === 0;

    return (
        <div className="login-page">
            <Toast ref={toastRef} />
            <Card className="login-card">
                {!isAuthenticated && (
                    <form onSubmit={handleSubmit} className="form-content">
                        <h1 className="login-title">Sign in</h1>

                        <span className="p-float-label">
                            <InputText
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="full-width"
                            />
                            <label htmlFor="email">Email</label>
                        </span>

                        <span className="p-float-label">
                            <Password
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value ?? "")}
                                inputClassName="full-width"
                                toggleMask
                                feedback={false}
                                className="full-width"
                            />
                            <label htmlFor="password">Password</label>
                        </span>

                        <Button
                            type="submit"
                            label={submitting ? "Signing in..." : "Sign in"}
                            icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
                            disabled={isDisabled}
                            className="full-width"
                        />
                    </form>
                )}
            </Card>
        </div>
    );


}