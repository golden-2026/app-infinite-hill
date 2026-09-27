// A slot: a child renders content into a place its parent owns, without the parent re-rendering.
// Lessons use it so each step hands its main button to the pinned bottom bar (app review 2026-09-26:
// "next" sat mid-screen on some steps and at the bottom on others).
//
// The host reads an immutable snapshot through useSyncExternalStore. It used to render from a Map mutated in
// place, which React Compiler (app.json experiments.reactCompiler) memoized on that same Map, so the bar kept
// showing the previous step's button: CHECK stayed disabled on tap-what-you-hear and every lesson from day 2 on
// could not be finished (walk 2026-09-27). A new snapshot object per change makes every update visible.
import { createContext, useCallback, useContext, useId, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

type Slot = { subscribe: (l: () => void) => () => void; get: () => ReactNode[]; set: (id: string, node: ReactNode | null) => void };

function makeSlot(): Slot {
  const nodes = new Map<string, ReactNode>();
  const listeners = new Set<() => void>();
  let snapshot: ReactNode[] = [];
  return {
    subscribe(l) { listeners.add(l); return () => { listeners.delete(l); }; },
    get: () => snapshot,
    set(id, node) {
      if (node == null) { if (!nodes.delete(id)) return; } else nodes.set(id, node);
      snapshot = [...nodes.values()];
      listeners.forEach((l) => l());
    },
  };
}

const EMPTY: ReactNode[] = [];
const noopSubscribe = () => () => {};
const SlotContext = createContext<Slot | null>(null);

export function SlotProvider({ children }: { children: ReactNode }) {
  const slot = useRef<Slot | null>(null);
  if (!slot.current) slot.current = makeSlot();
  return <SlotContext.Provider value={slot.current}>{children}</SlotContext.Provider>;
}

/** Where the slot's content shows. `render` gets it only when something filled the slot. */
export function SlotHost({ render }: { render: (content: ReactNode) => ReactNode }) {
  const slot = useContext(SlotContext);
  const get = useCallback(() => (slot ? slot.get() : EMPTY), [slot]);
  const nodes = useSyncExternalStore(slot ? slot.subscribe : noopSubscribe, get, get);
  if (nodes.length === 0) return null;
  return <>{render(nodes)}</>;
}

/** Sends its children to the nearest SlotHost. Without one (a step shown on its own), renders in place. */
export function SlotFill({ children }: { children: ReactNode }) {
  const slot = useContext(SlotContext);
  const id = useId();
  useLayoutEffect(() => { slot?.set(id, children); }); // every render: the button's handler sees fresh state
  useLayoutEffect(() => () => { slot?.set(id, null); }, [slot, id]);
  return slot ? null : <>{children}</>;
}
