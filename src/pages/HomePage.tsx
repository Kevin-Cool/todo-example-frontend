import { type JSX, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { useAuth } from "../auth/AuthContext";
import { getToDosByUser, type ToDoDTO } from "../services/todoService";
import { ApiError } from "../services/loginService";
import ToDoCard from "../components/ToDoCard";
import CreateToDoDialog from "../components/CreateToDoDialog";
import AvatarLogo from "../components/AvatarLogo";
import { createToDoHub, type ToDoHub } from "../realtime/ToDoHub";
import "../styles/HomePage.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function HomePage(): JSX.Element {
    const { payload, clear } = useAuth();
    const uid: string = payload?.userId ?? "unknown";
    const perms: number = payload?.permissions ?? 0;

    const [todos, setTodos] = useState<ToDoDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState<boolean>(false);

    // Keep the hub instance across renders
    const hubRef = useRef<ToDoHub | null>(null);

    // initial load
    useEffect((): void => {
        let cancelled: boolean = false;

        async function load(): Promise<void> {
            setLoading(true);
            setError(null);
            try {
                // Let backend infer current user
                const data: ToDoDTO[] = await getToDosByUser();
                if (!cancelled) setTodos(data);
            } catch (e: unknown) {
                if (!cancelled) {
                    const message: string =
                        e instanceof ApiError ? `${e.message} (status: ${e.status})`
                            : e instanceof Error ? e.message
                                : "Unknown error";
                    setError(message);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
    }, []);

    useEffect((): () => void => {
        if (!uid || uid === "unknown") {
            return (): void => { };
        }

        const hub: ToDoHub = createToDoHub(uid);
        hubRef.current = hub;

        hub.connection.on("TodoCreated", (incoming: ToDoDTO): void => {
            const isTagged: boolean = incoming.taggedUsers.some((u: { id: string }): boolean => u.id === uid);
            if (!isTagged) return;

            setTodos((prev: ToDoDTO[]): ToDoDTO[] => {
                // avoid duplicates if creator also received the event
                const exists: boolean = prev.some((t: ToDoDTO): boolean => t.id === incoming.id);
                const next: ToDoDTO[] = exists ? prev : [incoming, ...prev];
                next.sort((a: ToDoDTO, b: ToDoDTO): number =>
                    new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
                );
                return next;
            });
        });

        void hub.start();

        return (): void => {
            hub.connection.off("TodoCreated");
            void hub.stop();
            hubRef.current = null;
        };
    }, [uid]);

    // newest -> oldest
    const orderedTodos: ToDoDTO[] = useMemo<ToDoDTO[]>(() => {
        const copy: ToDoDTO[] = [...todos];
        copy.sort((a: ToDoDTO, b: ToDoDTO): number =>
            new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
        );
        return copy;
    }, [todos]);

    function handleCreated(newTodo: ToDoDTO): void {
        setTodos((prev: ToDoDTO[]): ToDoDTO[] => {
            const next: ToDoDTO[] = [newTodo, ...prev];
            next.sort((a: ToDoDTO, b: ToDoDTO): number =>
                new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
            );
            return next;
        });
    }

    function handleUpdated(updated: ToDoDTO): void {
        setTodos((prev: ToDoDTO[]): ToDoDTO[] =>
            prev.map((t: ToDoDTO): ToDoDTO => (t.id === updated.id ? updated : t))
        );
    }

    return (
        <div className="page">
            <header className="topbar">
                <div className="topbar-inner">
                    <div className="topbar-left">
                        <AvatarLogo id={uid} name={payload?.name} surname={payload?.surname} size={40} />
                        <div>
                            <h1 className="page-title">My ToDos</h1>
                            <p className="page-subtitle">User: {uid} • Perms: {perms}</p>
                        </div>
                    </div>
                    <Button
                        icon="pi pi-sign-out"
                        className="p-button-outlined p-button-sm"
                        onClick={(): void => clear()}
                    />
                </div>
            </header>

            <main className="main">
                <div
                    className="create-card"
                    role="button"
                    tabIndex={0}
                    onClick={(): void => setCreateOpen(true)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>): void => {
                        if (e.key === "Enter") setCreateOpen(true);
                    }}
                    aria-label="Create a new to-do"
                >
                    <span className="create-icon">+</span>
                    <span className="create-text">Create a new ToDo</span>
                </div>

                {loading && <FeedSkeleton count={4} />}

                {!loading && error !== null && (
                    <div className="error-box">{error}</div>
                )}

                {!loading && error === null && orderedTodos.length === 0 && (
                    <EmptyState />
                )}

                {!loading && error === null && orderedTodos.length > 0 && (
                    <ul className="todo-list">
                        {orderedTodos.map((t: ToDoDTO): JSX.Element => (
                            <li key={t.id}>
                                <ToDoCard todo={t} onUpdated={handleUpdated} />
                            </li>
                        ))}
                    </ul>
                )}
            </main>

            <CreateToDoDialog
                visible={createOpen}
                onHide={(): void => setCreateOpen(false)}
                onCreated={handleCreated}
            />
        </div>
    );
}

function FeedSkeleton({ count }: { count: number }): JSX.Element {
    const items: number[] = Array.from({ length: count }, (_: unknown, i: number): number => i);
    return (
        <ul className="skeleton-list">
            {items.map((i: number): JSX.Element => (
                <li key={i} className="skeleton-card">
                    <div style={{ width: "60%", height: "1rem", background: "var(--border)", borderRadius: 6 }} />
                    <div style={{ marginTop: 8, width: "100%", height: "0.75rem", background: "var(--border)", borderRadius: 6 }} />
                    <div style={{ marginTop: 6, width: "90%", height: "0.75rem", background: "var(--border)", borderRadius: 6 }} />
                </li>
            ))}
        </ul>
    );
}

function EmptyState(): JSX.Element {
    return (
        <div className="empty-state" role="status" aria-live="polite">
            <div className="empty-icon">
                <i className="pi pi-inbox" />
            </div>
            <h3 className="empty-title">No ToDos yet</h3>
            <p className="empty-text">When you create your first ToDo, it will appear here.</p>
        </div>
    );
}
