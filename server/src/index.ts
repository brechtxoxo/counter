import "dotenv/config";
import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { CounterStore } from "./counterStore.js";
import type {
  ClientToServerEvents,
  CounterChangePayload,
  CounterChangeResponse,
  ServerToClientEvents
} from "./types.js";

const port = Number(process.env.PORT ?? 3001);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
const httpServer = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"]
  }
});

const counterStore = new CounterStore();

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/counter", (_request, response) => {
  response.json(counterStore.getState());
});

io.on("connection", (socket) => {
  socket.emit("counter:state", counterStore.getState());

  socket.on("counter:change", (payload: CounterChangePayload, acknowledge) => {
    const isAllowedDelta = payload && (payload.delta === 1 || payload.delta === -1);

    if (!isAllowedDelta) {
      const result: CounterChangeResponse = {
        ok: false,
        error: "Alleen een wijziging van +1 of -1 is toegestaan."
      };
      acknowledge(result);
      return;
    }

    const nextState = counterStore.applyDelta(payload.delta);
    io.emit("counter:state", nextState);
    acknowledge({ ok: true, state: nextState });
  });
});

httpServer.listen(port, () => {
  console.info(`API en Socket.IO draaien op http://localhost:${port}`);
});