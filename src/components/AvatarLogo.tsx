import { type JSX, useMemo, useRef, useLayoutEffect, useState } from "react";
import { Avatar } from "primereact/avatar";
import type { UserDTO } from "../services/userService";

export interface AvatarLogoProps {
    user?: UserDTO;
    id?: string;
    name?: string;
    surname?: string;
    size?: number;
    className?: string;
    title?: string;
    fitParent?: boolean;
    minSize?: number;
}

const PALETTE: readonly string[] = [
    "#2563EB",
    "#16A34A",
    "#DC2626",
    "#9333EA",
    "#EA580C",
    "#0891B2",
    "#4F46E5",
    "#D97706"
] as const;

function hashToUint(seed: string): number {
    let hash: number = 2166136261 >>> 0;
    for (let i: number = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

export function avatarColorIndexFromSeed(seed: string): number {
    const h: number = hashToUint(seed);
    return h % PALETTE.length;
}

export function avatarInitials(nameInput?: string, surnameInput?: string): string {
    const name: string = (nameInput ?? "").trim();
    const surname: string = (surnameInput ?? "").trim();

    if (name.length === 0 && surname.length === 0) return "?";

    const first: string = name.split(/[ \-]+/).filter(Boolean)[0]?.[0] ?? "";
    const second: string = surname.split(/[ \-]+/).filter(Boolean)[0]?.[0] ?? (first ? "" : "?");

    return `${first}${second}`.toUpperCase();
}

export default function AvatarLogo(props: AvatarLogoProps): JSX.Element {
    const desiredSize: number = props.size ?? 40;
    const minSize: number = props.minSize ?? 16;
    const fitParent: boolean = props.fitParent ?? true;

    // Measure the wrapper to compute a safe square size
    const wrapperRef = useRef<HTMLSpanElement | null>(null);
    const [measuredSize, setMeasuredSize] = useState<number>(desiredSize);

    useLayoutEffect(() => {
        if (!fitParent) {
            setMeasuredSize(desiredSize);
            return;
        }
        const el: HTMLSpanElement | null = wrapperRef.current;
        if (!el) {
            setMeasuredSize(desiredSize);
            return;
        }

        // Compute & apply the size once (for mount) and on each resize
        const computeSize = (): void => {
            const rect: DOMRect = el.getBoundingClientRect();
            // Available square side is the min of wrapper width/height
            const available: number = Math.max(
                0,
                Math.min(rect.width, rect.height || rect.width)
            );
            const nextSize: number = Math.max(minSize, Math.min(desiredSize, Math.floor(available)));
            setMeasuredSize(nextSize > 0 ? nextSize : Math.max(minSize, Math.min(desiredSize, 0)));
        };

        // Initial compute
        computeSize();

        // Observe changes
        const Obs: typeof ResizeObserver | undefined = (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
        if (Obs) {
            const ro: ResizeObserver = new Obs(() => computeSize());
            ro.observe(el);
            // Also observe parent, which often drives constraints
            if (el.parentElement) ro.observe(el.parentElement);
            return () => ro.disconnect();
        } else {
            // Fallback: recompute on window resize
            window.addEventListener("resize", computeSize);
            return () => window.removeEventListener("resize", computeSize);
        }
    }, [desiredSize, fitParent, minSize]);

    const meta = useMemo(() => {
        const u: UserDTO | undefined = props.user;

        const id: string =
            (u?.id && u.id.trim()) ||
            (props.id && props.id.trim()) ||
            `${(u?.email ?? "").trim()}|${(u?.name ?? props.name ?? "").trim()}|${(u?.surname ?? props.surname ?? "").trim()}` ||
            "seed";

        const name: string = (u?.name ?? props.name ?? "").trim();
        const surname: string = (u?.surname ?? props.surname ?? "").trim();

        const initials: string = avatarInitials(name, surname);
        const idx: number = avatarColorIndexFromSeed(id);
        const bg: string = PALETTE[idx];

        const title: string =
            props.title ??
            (name || surname ? `${name} ${surname}`.trim() : `User ${id}`);

        return { initials, bg, title };
    }, [props.user, props.id, props.name, props.surname, props.title]);

    // Final size: if fitting parent, use measured; else stick to desired
    const finalSize: number = fitParent ? measuredSize : desiredSize;

    return (
        <span
            ref={wrapperRef}
            style={{
                display: "inline-flex",
                maxWidth: "100%",
                maxHeight: "100%",
                alignItems: "center",
                justifyContent: "center",
            }}
            className={props.className ?? ""}
        >
            <Avatar
                label={meta.initials}
                shape="circle"
                style={{
                    width: `${finalSize}px`,
                    height: `${finalSize}px`,
                    aspectRatio: "1 / 1",
                    backgroundColor: meta.bg,
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: `${Math.max(10, Math.round(finalSize * 0.42))}px`,
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    userSelect: "none",
                    flex: "0 0 auto",
                }}
                title={meta.title}
                aria-label={meta.title}
            />
        </span>
    );
}
