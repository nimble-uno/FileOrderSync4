import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { uploadOrderSchema } from "@shared/schema";
import { put } from '@vercel/blob';
import { randomUUID } from "crypto";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.post("/api/upload", async (req, res) => {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.files.file;
      const blob = await put(randomUUID(), file, {
        access: 'public',
      });

      res.json({ url: blob.url });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    const { id } = req.body;
    const existing = await storage.getOrder(id);
    if (existing) {
      return res.status(400).json({ message: "Order ID already exists" });
    }
    const order = await storage.createOrder(id);
    res.status(201).json(order);
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const orders = await storage.getAllOrders();
    res.json(orders);
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const order = await storage.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.post("/api/orders/:id/upload", async (req, res) => {
    const order = await storage.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.hasUploaded) {
      return res.status(400).json({ message: "Order already has uploads" });
    }

    const result = uploadOrderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid upload data" });
    }

    const updated = await storage.updateOrder(req.params.id, {
      files: {
        videos: result.data.videos,
        images: result.data.images
      },
      songRequest: result.data.songRequest,
      hasUploaded: true
    });

    res.json(updated);
  });

  app.delete("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteOrder(req.params.id);
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}