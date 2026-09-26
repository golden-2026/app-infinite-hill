// A slot: a child renders content into a place its parent owns, without the parent re-rendering.
// Lessons use it so each step hands its main button to the pinned bottom bar (app review 2026-09-26:
// "next" sat mid-screen on some steps and at the bottom on others).
import { createContext, useContext, useId, useLayoutEffect, useReducer, useRef, type ReactNode } from "react";

type Slot = { nodes: Map<string, ReactNode>; listeners: Set<() => void>; set: (id: string, node: ReactNode | null) => void };

function makeSlot(): Slot {
  const slot: Slot = {
    nodes: new Map(),
    listeners: new Set(),
    set(id, node) {
      if (node == null) slot.nodes.delete(id);
      else slot.nodes.set(id, node);
      slot.listeners.forEach((l) => l());
    },
  };
  return slot;
}

const SlotContext = createContext<Slot | null>(null);

export function SlotProvider({ children }: { children: ReactNode }) {
  const slot = useRef<Slot | null>(null);
  if (!slot.current) slot.current = makeSlot();
  return <SlotContext.Provider value={slot.current}>{children}</SlotContext.Provider>;
}

/** Where the slot's content shows. `render` gets it only when something filled the slot. */
export function SlotHost({ render }: { render: (content: ReactNode) => ReactNode }) {
  const slot = useContext(SlotContext);
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useLayoutEffect(() => {
    if (!slot) return;
    slot.listeners.add(bump);
    // A fill that mounted in the same commit ran its effect before this host subscribed: show it now.
    if (slot.nodes.size) bump();
    return () => { slot.listeners.delete(bump); };
  }, [slot]);
  if (!slot || slot.nodes.size === 0) return null;
  return <>{render([...slot.nodes.values()])}</>;
}

/** Sends its children to the nearest SlotHost. Without one (a step shown on its own), renders in place. */
export function SlotFill({ children }: { children: ReactNode }) {
  const slot = useContext(SlotContext);
  const id = useId();
  useLayoutEffect(() => { slot?.set(id, children); }); // every render: the button's handler sees fresh state
  useLayoutEffect(() => () => { slot?.set(id, null); }, [slot, id]);
  return slot ? null : <>{children}</>;
}
