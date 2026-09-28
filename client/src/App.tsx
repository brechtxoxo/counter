import { useEffect, useState } from "react";
import { socket } from "./socket";
import type { CounterChangeResponse, CounterState } from "./types";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export default function App() {
  const [counter, setCounter] = useState<CounterState | null>(null);
  const [connected, setConnected] = useState(socket.connected);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      try {
        const response = await fetch(`${apiUrl}/api/counter`);
        if (!response.ok) throw new Error("Counter kon niet worden geladen.");
        const state = (await response.json()) as CounterState;
        if (active) setCounter(state);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Onbekende fout.");
        }
      }
    }

    function onConnect() {
      setConnected(true);
      setError(null);
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onCounterState(state: CounterState) {
      setCounter((current) => {
        if (current && current.version > state.version) return current;
        return state;
      });
    }

    function onConnectError() {
      setError("Realtime verbinding kon niet worden opgezet.");
    }

    void loadSnapshot();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("counter:state", onCounterState);
    socket.connect();

    return () => {
      active = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("counter:state", onCounterState);
      socket.disconnect();
    };
  }, []);

  function changeCounter(delta: 1 | -1) {
    if (!socket.connected || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    socket.timeout(5000).emit(
      "counter:change",
      { delta },
      (timeoutError: Error | null, response?: CounterChangeResponse) => {
        setIsSubmitting(false);

        if (timeoutError) {
          setError("De server reageerde niet op tijd. Probeer opnieuw.");
          return;
        }

        if (!response || !response.ok) {
          setError(response?.error ?? "Counter kon niet worden aangepast.");
        }
      }
    );
  }

  return (
    <main>
      <h1>Gedeelde counter</h1>
      <p aria-live="polite">
        Verbinding: {connected ? "online" : "offline"}
      </p>

      <output aria-live="polite">{counter?.value ?? "…"}</output>

      <div>
        <button
          type="button"
          onClick={() => changeCounter(-1)}
          disabled={!connected || isSubmitting}
        >
          Omlaag
        </button>
        <button
          type="button"
          onClick={() => changeCounter(1)}
          disabled={!connected || isSubmitting}
        >
          Omhoog
        </button>
      </div>

      {counter && <small>Versie {counter.version}</small>}
      {error && <p role="alert">{error}</p>}
    </main>
  );
}