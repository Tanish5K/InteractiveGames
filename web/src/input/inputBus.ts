import type { InputEvent } from "./types";

type Listener = (event: InputEvent) => void;

class EventBus {
  private listeners = new Set<Listener>();

  //Subscribe to Fortnite Battle Bus
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: InputEvent) {
    for (const listener of this.listeners) listener(event);
  }
}

//Return input bus
export const inputBus = new EventBus();
