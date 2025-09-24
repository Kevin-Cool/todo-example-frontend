import { type JSX, useMemo } from "react";
import AvatarLogo from "../components/AvatarLogo";
import type { ToDoDTO } from "../services/todoService";
import "../styles/TaggedUsersRow.css";

type TaggedUser = ToDoDTO["taggedUsers"][number];

interface TaggedUsersRowProps {
    users: ReadonlyArray<TaggedUser>;
    size?: number;
    cap?: number;
}

function TaggedUsersRow({ users, size = 18, cap = 6 }: TaggedUsersRowProps): JSX.Element | null {
    const total: number = users.length;
    if (total === 0) return null;

    const showOverflow: boolean = total > cap;
    const visibleCount: number = showOverflow ? Math.max(0, cap - 1) : total; // 5 when cap=6
    const visible: TaggedUser[] = useMemo<TaggedUser[]>(
        () => users.slice(0, visibleCount),
        [users, visibleCount]
    );
    const overflow: number = showOverflow ? total - visibleCount : 0;

    const overflowTitle: string = useMemo<string>(() =>
        showOverflow
            ? users
                .slice(visibleCount)
                .map((u: TaggedUser): string => `${u.name} ${u.surname}`.trim())
                .join(", ")
            : "",
        [showOverflow, users, visibleCount]
    );

    return (
        <div className="taggedUsersRow">
            {visible.map((u: TaggedUser) => (
                <AvatarLogo
                    key={u.id}
                    id={u.id}
                    name={u.name}
                    surname={u.surname}
                    size={size}
                />
            ))}
            {showOverflow && (
                <span
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        fontSize: `${Math.max(9, Math.round(size * 0.45))}px`,
                        fontWeight: 600,
                        lineHeight: 1
                    }}
                    title={overflowTitle}
                    aria-label={`+${overflow} more`}
                >
                    +{overflow}
                </span>
            )}
        </div>
    );
}

export default TaggedUsersRow;
