import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export interface HandleProps {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  style: CSSProperties;
  className: string;
  "aria-label": string;
  type: "button";
}

export function DragHandle(props: HandleProps) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 w-8 shrink-0 cursor-grab items-center justify-center text-neutral-600 hover:text-neutral-300 active:cursor-grabbing ${props.className}`}
    >
      <span className="grid grid-cols-2 gap-[3px]" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="size-1 rounded-full bg-current" />
        ))}
      </span>
    </button>
  );
}

/**
 * Pointer-based reorder. Drag starts only from the handle so page scroll is
 * unaffected. The list updates as the pointer crosses another item; persistence
 * happens on release and rolls back if the write fails.
 */
export function SortableList<T>({
  items,
  getId,
  onCommit,
  onError,
  renderItem,
  className,
  disabled,
}: {
  items: T[];
  getId: (item: T) => string;
  onCommit: (orderedIds: string[]) => Promise<string | null>;
  onError?: (message: string) => void;
  renderItem: (
    item: T,
    ctx: { handleProps: HandleProps; dragging: boolean; index: number }
  ) => ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const [order, setOrder] = useState(items);
  const orderRef = useRef(order);
  const snapshot = useRef(items);
  const draggingId = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (draggingId.current) return;
    setOrder(items);
    orderRef.current = items;
  }, [items]);

  const persist = useCallback(
    async (next: T[]) => {
      const before = snapshot.current;
      const ids = next.map(getId);
      const unchanged =
        before.length === next.length && before.every((item, i) => getId(item) === ids[i]);
      if (unchanged) return null;
      const error = await onCommit(ids);
      if (error) {
        setOrder(before);
        orderRef.current = before;
      }
      return error;
    },
    [getId, onCommit]
  );

  function handlePropsFor(id: string): HandleProps {
    return {
      type: "button",
      "aria-label": "Drag to reorder",
      className: "",
      style: { touchAction: "none" },
      onPointerDown: (event) => {
        if (disabled || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        snapshot.current = orderRef.current;
        draggingId.current = id;
        setActiveId(id);
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.addEventListener("pointermove", onMove);
        event.currentTarget.addEventListener("pointerup", onUp);
        event.currentTarget.addEventListener("pointercancel", onUp);
      },
    };
  }

  function indexFromPoint(clientX: number, clientY: number): number {
    const root = listRef.current;
    if (!root) return -1;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-sortable-id]")];
    if (nodes.length === 0) return -1;

    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    nodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = (clientX - cx) ** 2 + (clientY - cy) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  }

  function onMove(event: PointerEvent) {
    const id = draggingId.current;
    if (!id) return;
    const current = orderRef.current;
    const from = current.findIndex((item) => getId(item) === id);
    const to = indexFromPoint(event.clientX, event.clientY);
    if (from < 0 || to < 0 || from === to) return;
    const next = moveItem(current, from, to);
    orderRef.current = next;
    setOrder(next);
  }

  async function onUp(event: PointerEvent) {
    const target = event.currentTarget as HTMLElement | null;
    target?.removeEventListener("pointermove", onMove);
    target?.removeEventListener("pointerup", onUp);
    target?.removeEventListener("pointercancel", onUp);
    draggingId.current = null;
    setActiveId(null);
    const error = await persist(orderRef.current);
    if (error) onError?.(error);
  }

  return (
    <div ref={listRef} className={className} data-reordering={activeId ? "true" : "false"}>
      {order.map((item, index) => {
        const id = getId(item);
        return (
          <div key={id} data-sortable-id={id}>
            {renderItem(item, {
              handleProps: handlePropsFor(id),
              dragging: activeId === id,
              index,
            })}
          </div>
        );
      })}
    </div>
  );
}
