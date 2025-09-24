import { type JSX, useMemo, useState } from "react";
import TaggedUsersRow from "./TaggedUsersRow";
import { type ToDoDTO } from "../services/todoService";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import EditToDoDialog from "./EditToDoDialog";
import { useAuth } from "../auth/AuthContext";
import "../styles/ToDoCard.css";

export interface ToDoCardProps {
    todo: ToDoDTO;
    onUpdated?: (updated: ToDoDTO) => void;
}

export default function ToDoCard({ todo, onUpdated }: ToDoCardProps): JSX.Element {
    const { payload } = useAuth();
    const [current, setCurrent] = useState<ToDoDTO>(todo);
    const [editing, setEditing] = useState<boolean>(false);

    const created: string = useMemo<string>(() => new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(current.creationDate)), [current.creationDate]);

    const canEdit: boolean = (payload?.userId ?? "") === current.creatingUser.id;

    function handleSaved(updated: ToDoDTO): void {
        setCurrent(updated);
        if (typeof onUpdated === "function") onUpdated(updated);
    }

    return (
        <Card className="todo-card p-card-compact">
            <div className="todo-card-inner">
                {canEdit && (
                    <div className="todo-actions">
                        <Button
                            label="Edit"
                            icon="pi pi-pencil"
                            className="p-button-text p-button-sm"
                            onClick={(): void => setEditing(true)}
                            aria-label="Edit to-do"
                        />
                    </div>
                )}

                <div className="todo-card-content">
                    <div className="todo-head">
                        <TaggedUsersRow users={current.taggedUsers} size={18} cap={6} />
                        <h2 className="todo-title">
                            {current.title ?? "Untitled"}
                        </h2>
                    </div>

                    <div className="todo-body">
                        <p className="todo-desc">
                            {current.description ?? "No description"}
                        </p>

                        <div className="meta-row">
                            <span className="meta-inline">
                                <i className="pi pi-user" />
                                {current.creatingUser.name} {current.creatingUser.surname}
                            </span>
                            <span>•</span>
                            <span className="meta-inline">
                                <i className="pi pi-clock" />
                                {created}
                            </span>
                            {current.archived && (
                                <>
                                    <span>•</span>
                                    <span className="meta-inline archived-label">
                                        <i className="pi pi-box" />
                                        Archived
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <EditToDoDialog
                todo={current}
                visible={editing}
                onHide={(): void => setEditing(false)}
                onSaved={handleSaved}
            />
        </Card>
    );
}
