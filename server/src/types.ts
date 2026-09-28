export type CounterState = {
  value: number;
  version: number;
  updatedAt: string;
};

export type CounterChangePayload = {
  delta: number;
};

type SuccessResponse = {
  ok: true;
  state: CounterState;
};

type FailureResponse = {
  ok: false;
  error: string;
};

export type CounterChangeResponse = SuccessResponse | FailureResponse;

export interface ServerToClientEvents {
  "counter:state": (state: CounterState) => void;
}

export interface ClientToServerEvents {
  "counter:change": (
    payload: CounterChangePayload,
    acknowledge: (response: CounterChangeResponse) => void
  ) => void;
}