import { db } from "./index.js";
import { feeds, users } from "./schema.js";
import { eq } from "drizzle-orm";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({
      name: name,
      url: url,
      userId: userId,
    })
    .returning();
  return result;
}

export async function getFeeds() {
  return await db
    .select({
      id: feeds.id,
      createdAt: feeds.createdAt,
      updatedAt: feeds.updatedAt,
      name: feeds.name,
      url: feeds.url,
      userId: feeds.userId,
      userName: users.name,
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
}

export async function getFeedByUrl(url: string) {
  const [result] = await db
    .select()
    .from(feeds)
    .where(eq(feeds.url, url));
  return result;
}