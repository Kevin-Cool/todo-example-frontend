import { type JSX, useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect, type MultiSelectChangeEvent } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { updateToDo, type ToDoDTO, type ToDoUpdateDTO } from "../services/todoService";
import { getAllUsers, type UserDTO } from "../services/userService";
import { ApiError } from "../services/loginService";
import AvatarLogo from "./AvatarLogo";
import { useAuth } from "../auth/AuthContext";
import "../styles/EditToDoDialog.css";

export interface EditToDoDialogProps {
    todo: ToDoDTO;
    visible: boolean;
    onHide: () => void;
    onSaved: (updated: ToDoDTO) => void;
}

export default function EditToDoDialog(props: EditToDoDialogProps): JSX.Element {
    const [title, setTitle] = useState<string>(props.todo.title ?? "");
    const [description, setDescription] = useState<string>(props.todo.description ?? "");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
        props.todo.taggedUsers.map((u: UserDTO): string => u.id)
    );

    const [users, setUsers] = useState<UserDTO[]>([]);
    const [saving, setSaving] = useState<boolean>(false);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Load all users when dialog opens
    useEffect((): void => {
        if (!props.visible) return;
        setError(null);
        setLoadingUsers(true);

        let cancelled: boolean = false;
        async function loadUsers(): Promise<void> {
            try {
                const data: UserDTO[] = await getAllUsers();
                if (!cancelled) setUsers(data);
            } catch (e: unknown) {
                if (!cancelled) {
                    const msg: string =
                        e instanceof ApiError ? `${e.message} (status: ${e.status})`
                            : e instanceof Error ? e.message
                                : "Failed to load users";
                    setError(msg);
                }
            } finally {
                if (!cancelled) setLoadingUsers(false);
            }
        }
        void loadUsers();

    }, [props.visible]);

    const { payload } = useAuth();
    const currentUserId: string | undefined = payload?.userId;

    // Reset form each time the todo changes or dialog reopens
    useEffect((): void => {
        const initialIds: string[] = props.todo.taggedUsers.map((u: UserDTO): string => u.id);
        const ensured: string[] = currentUserId
            ? Array.from(new Set<string>([...initialIds, currentUserId]))
            : initialIds;
        setSelectedUserIds(ensured);
        setTitle(props.todo.title ?? "");
        setDescription(props.todo.description ?? "");
        setError(null);
    }, [props.todo, props.visible, currentUserId]);

    type UserOption = { label: string; value: string; entity: UserDTO };

    const userOptions: UserOption[] = useMemo<UserOption[]>(
        () => users.map((u: UserDTO): UserOption => ({
            label: `${u.name} ${u.surname}`.trim(),
            value: u.id,
            entity: u
        })),
        [users]
    );

    async function onSubmit(): Promise<void> {
        setSaving(true);
        setError(null);
        try {
            const payloadUpdate: ToDoUpdateDTO = {
                title: title.trim().length > 0 ? title.trim() : "",
                description: description.trim().length > 0 ? description.trim() : "",
                taggedUsers: selectedUserIds
            };
            const updated: ToDoDTO = await updateToDo(props.todo.id, payloadUpdate);
            props.onSaved(updated);
            props.onHide();
        } catch (e: unknown) {
            const msg: string =
                e instanceof ApiError ? `${e.message} (status: ${e.status})`
                    : e instanceof Error ? e.message
                        : "Update failed";
            setError(msg);
        } finally {
            setSaving(false);
        }
    }

    const footer: JSX.Element = (
        <div className="editTodoFooter">
            <Button
                label="Cancel"
                className="p-button-text"
                onClick={(): void => props.onHide()}
                disabled={saving}
            />
            <Button
                label="Save"
                icon="pi pi-check"
                onClick={(): void => { void onSubmit(); }}
                loading={saving}
            />
        </div>
    );

    return (
        <Dialog
            header="Edit To-Do"
            visible={props.visible}
            style={{ width: "34rem", maxWidth: "96vw" }}
            modal
            dismissableMask
            closeOnEscape
            draggable={false}
            resizable={false}
            onHide={props.onHide}
            footer={footer}
        >
            <div className="editTodoForm">
                {error !== null && <Message severity="error" text={error} />}

                <div className="editTodoField">
                    <label htmlFor="todo-title" className="editTodoLabel">Title</label>
                    <InputText
                        id="todo-title"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setTitle(e.target.value)}
                        placeholder="Title"
                    />
                </div>

                <div className="editTodoField">
                    <label htmlFor="todo-desc" className="editTodoLabel">Description</label>
                    <InputTextarea
                        id="todo-desc"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => setDescription(e.target.value)}
                        placeholder="Description"
                        rows={5}
                        autoResize
                    />
                </div>

                <div className="editTodoField">
                    <label className="editTodoLabel">Tagged users</label>
                    <MultiSelect
                        value={selectedUserIds}
                        onChange={(e: MultiSelectChangeEvent): void => {
                            const raw: unknown = e.value;
                            let next: string[] = Array.isArray(raw) ? raw.map((x: unknown): string => String(x)) : [];

                            // Re-add current user if someone tried to remove it (chip or panel)
                            if (currentUserId !== undefined && currentUserId.length > 0 && !next.includes(currentUserId)) {
                                next = [currentUserId, ...next];
                            }

                            // Deduplicate, preserve order
                            const deduped: string[] = Array.from(new Set<string>(next));
                            setSelectedUserIds(deduped);
                        }}
                        options={userOptions}
                        optionLabel="label"
                        optionValue="value"
                        // Disable toggling the current user inside the panel
                        optionDisabled={(opt: UserOption): boolean =>
                            currentUserId !== undefined && opt.value === currentUserId
                        }
                        placeholder={loadingUsers ? "Loading users…" : "Select users"}
                        filter
                        display="chip"
                        showClear={false}
                        itemTemplate={(opt: UserOption): JSX.Element => (
                            <div className="editTodoUserOption">
                                <AvatarLogo user={opt.entity} size={20} />
                                <span>{opt.label}</span>
                            </div>
                        )}
                        selectedItemTemplate={(value: string): JSX.Element => {
                            const found: UserOption | undefined = userOptions.find((o: UserOption): boolean => o.value === value);
                            return (
                                <div className="editTodoSelectedChip">
                                    {found && <AvatarLogo user={found.entity} size={16} />}
                                    <span>{found?.label ?? value}</span>
                                    {/* PrimeReact still shows the chip 'x' for all items.
                                        The onChange guard above re-adds the current user if removed. */}
                                </div>
                            );
                        }}
                        className="editTodoMultiSelect"
                        disabled={loadingUsers}
                    />
                </div>
            </div>
        </Dialog>
    );
}
