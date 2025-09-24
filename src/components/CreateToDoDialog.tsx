import { type JSX, useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect, type MultiSelectChangeEvent } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { createToDo, type ToDoDTO, type ToDoCreateDTO } from "../services/todoService";
import { getAllUsers, type UserDTO } from "../services/userService";
import { ApiError } from "../services/loginService";
import AvatarLogo from "./AvatarLogo";
import { useAuth } from "../auth/AuthContext";
import "../styles/EditToDoDialog.css";

export interface CreateToDoDialogProps {
    visible: boolean;
    onHide: () => void;
    onCreated: (created: ToDoDTO) => void;
}

type UserOption = { label: string; value: string; entity: UserDTO };

export default function CreateToDoDialog(props: CreateToDoDialogProps): JSX.Element {
    // Form state
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // Load users
    const [users, setUsers] = useState<UserDTO[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

    // UX state
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { payload } = useAuth();
    const currentUserId: string | undefined = payload?.userId;

    // Ensure current user is preselected & locked
    useEffect((): void => {
        if (!props.visible) return;

        setError(null);
        setSaving(false);

        const initialSelected: string[] =
            currentUserId !== undefined && currentUserId.length > 0
                ? [currentUserId]
                : [];
        setSelectedUserIds(initialSelected);
        setTitle("");
        setDescription("");

        // Load users list
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
    }, [props.visible, currentUserId]);

    const userOptions: UserOption[] = useMemo<UserOption[]>(
        () => users.map((u: UserDTO): UserOption => ({
            label: `${u.name} ${u.surname}`.trim(),
            value: u.id,
            entity: u
        })), [users]
    );

    async function onSubmit(): Promise<void> {
        setSaving(true);
        setError(null);

        try {
            const payloadCreate: ToDoCreateDTO = {
                title: title.trim().length > 0 ? title.trim() : "",
                description: description.trim().length > 0 ? description.trim() : "",
                taggedUsers: selectedUserIds
            };
            const created: ToDoDTO = await createToDo(payloadCreate);
            props.onCreated(created); 
            props.onHide();           
        } catch (e: unknown) {
            const msg: string =
                e instanceof ApiError ? `${e.message} (status: ${e.status})`
                : e instanceof Error ? e.message
                : "Create failed";
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
                label="Create"
                icon="pi pi-check"
                onClick={(): void => { void onSubmit(); }}
                loading={saving}
            />
        </div>
    );

    return (
        <Dialog
            header="Create To-Do"
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
                    <label htmlFor="create-title" className="editTodoLabel">Title</label>
                    <InputText
                        id="create-title"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setTitle(e.target.value)}
                        placeholder="Title"
                    />
                </div>

                <div className="editTodoField">
                    <label htmlFor="create-desc" className="editTodoLabel">Description</label>
                    <InputTextarea
                        id="create-desc"
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

                            // Lock in the current user: if removed via chip/panel, re-add
                            if (currentUserId !== undefined && currentUserId.length > 0 && !next.includes(currentUserId)) {
                                next = [currentUserId, ...next];
                            }

                            // Deduplicate
                            const deduped: string[] = Array.from(new Set<string>(next));
                            setSelectedUserIds(deduped);
                        }}
                        options={userOptions}
                        optionLabel="label"
                        optionValue="value"
                        // Disable toggling the current user in the dropdown
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
                            const found: UserOption | undefined =
                                userOptions.find((o: UserOption): boolean => o.value === value);
                            return (
                                <div className="editTodoSelectedChip">
                                    {found && <AvatarLogo user={found.entity} size={16} />}
                                    <span>{found?.label ?? value}</span>
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
