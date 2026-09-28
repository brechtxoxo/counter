import type { CounterState } from "./types.js";

export class CounterStore {
  private state: CounterState = {
    value: 0,
    version: 0,
    updatedAt: new Date().toISOString()
  };

  getState(): CounterState {
    return { ...this.state };
  }

  applyDelta(delta: number): CounterState {
    this.state = {
      value: this.state.value + delta,
      version: this.state.version + 1,
      updatedAt: new Date().toISOString()
    };

    return this.getState();
  }
}