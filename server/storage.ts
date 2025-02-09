import { users, orders, type User, type InsertUser, type Order } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getOrder(id: string): Promise<Order | undefined>;
  createOrder(id: string): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order>;
  getAllOrders(): Promise<Order[]>;
  deleteOrder(id: string): Promise<void>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(id: string): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        id,
        hasUploaded: false,
        files: { videos: [], images: [] },
        songRequest: "",
        createdAt: new Date().toISOString(),
      })
      .returning();
    return order;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    if (!updated) throw new Error("Order not found");
    return updated;
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders);
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }
}

export const storage = new DatabaseStorage();