import { pgTable, text, serial, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  hasUploaded: boolean("has_uploaded").default(false).notNull(),
  files: json("files").$type<{
    videos: { name: string, data: string }[],
    images: { name: string, data: string }[]
  }>(),
  songRequest: text("song_request"),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  id: true,
});

export const uploadOrderSchema = z.object({
  videos: z.array(z.object({
    name: z.string(),
    data: z.string()
  })),
  images: z.array(z.object({
    name: z.string(),
    data: z.string()
  })),
  songRequest: z.string().min(1, "Song request is required")
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type UploadOrder = z.infer<typeof uploadOrderSchema>;
