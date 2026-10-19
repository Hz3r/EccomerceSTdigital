import { describe, it, expect, afterEach } from "vitest";
import http from "http";
import type { AddressInfo } from "net";
import express from "express";
import request from "supertest";
import { emitOnMutation, eventsHandler, listenerCount } from "../events.js";

function buildApp() {
  const app = express();
  app.get("/api/events", eventsHandler);
  app.use(emitOnMutation);
  app.put("/api/settings", (_req, res) => res.json({ ok: true }));
  app.post("/api/plans", (_req, res) => res.status(201).json({ ok: true }));
  app.post("/api/orders", (_req, res) => res.status(400).json({ ok: false }));
  app.get("/api/products", (_req, res) => res.json({ ok: true }));
  return app;
}

// Abre el flujo SSE y junta los temas recibidos.
function listen(server: http.Server) {
  const { port } = server.address() as AddressInfo;
  const topics: string[] = [];
  const actions: string[] = [];
  const req = http.get(`http://127.0.0.1:${port}/api/events`, (res) => {
    res.setEncoding("utf8");
    res.on("data", (chunk: string) => {
      for (const m of chunk.matchAll(/event: change\ndata: (.+)\n/g)) {
        const data = JSON.parse(m[1]);
        topics.push(data.topic);
        actions.push(data.action);
      }
    });
  });
  return { topics, actions, close: () => req.destroy() };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("Eventos en tiempo real", () => {
  let server: http.Server;
  afterEach(() => server?.close());

  it("emite el tema solo en cambios exitosos", async () => {
    const app = buildApp();
    server = app.listen(0);
    const stream = listen(server);
    await wait(50);

    await request(server).put("/api/settings").send({});
    await request(server).post("/api/plans").send({});
    await request(server).post("/api/orders").send({}); // falla: no emite
    await request(server).get("/api/products"); // lectura: no emite
    await wait(50);

    expect(stream.topics).toEqual(["settings", "plans", "products"]);
    expect(stream.actions).toEqual(["updated", "created", "created"]);
    stream.close();
    await wait(50);
    expect(listenerCount()).toBe(0);
  });
});
