import { db } from "./index.js";
import { feeds } from "./schema.js";

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