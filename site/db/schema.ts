import { integer, real, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  displayName: text("display_name").notNull(),
  username: text("username").notNull().unique(),
  farmerType: text("farmer_type").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  city: text("city").notNull(),
  bio: text("bio").notNull().default(""),
  crops: text("crops").notNull().default(""),
  experience: text("experience").notNull().default(""),
  avatarKey: text("avatar_key"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  mapVisible: integer("map_visible", { mode: "boolean" }).notNull().default(false),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caption: text("caption").notNull().default(""),
  category: text("category").notNull().default("Other"),
  location: text("location").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => [index("posts_created_idx").on(t.createdAt)]);

export const postImages = sqliteTable("post_images", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const likes = sqliteTable("likes", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
}, (t) => [uniqueIndex("likes_unique").on(t.userId, t.postId)]);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [index("comments_post_idx").on(t.postId)]);

export const follows = sqliteTable("follows", {
  followerId: text("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: text("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
}, (t) => [uniqueIndex("follows_unique").on(t.followerId, t.followingId)]);

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  userA: text("user_a").notNull().references(() => users.id, { onDelete: "cascade" }),
  userB: text("user_b").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => [uniqueIndex("conversations_pair").on(t.userA, t.userB)]);

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull().default(""),
  languageCode: text("language_code").notNull().default("en"),
  imageKey: text("image_key"),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at"),
}, (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)]);

export const messageTranslations = sqliteTable("message_translations", {
  messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  targetLanguage: text("target_language").notNull(),
  translatedText: text("translated_text").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [uniqueIndex("message_translations_pair").on(t.messageId, t.targetLanguage)]);

export const alyMessages = sqliteTable("aly_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  body: text("body").notNull(),
  imageKey: text("image_key"),
  createdAt: text("created_at").notNull(),
}, (t) => [index("aly_messages_user_date").on(t.userId, t.createdAt)]);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  targetId: text("target_id"),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at"),
}, (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)]);
