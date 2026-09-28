export type CounterState = {
  value: number;
  version: number;
  updatedAt: string;
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