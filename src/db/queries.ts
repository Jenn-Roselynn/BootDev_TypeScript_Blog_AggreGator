import { db } from "./index";
import { posts, feedFollows, feeds } from "./schema";
import { eq, desc } from "drizzle-orm";

export async function createPost(post: {
  title: string;
  url: string;
  description?: string | null;
  publishedAt?: Date | null;
  feedId: string;
}) {
  try {
    await db.insert(posts).values({
      title: post.title,
      url: post.url,
      description: post.description,
      publishedAt: post.publishedAt,
      feedId: post.feedId,
    });
  } catch (error) {
    console.error(`Failed to insert post: ${post.title}`);
  }
}

export async function getPostsForUser(userId: string, limit: number = 2) {
  return await db
    .select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      publishedAt: posts.publishedAt,
      feedName: feeds.name, // Now we're grabbin' the actual name!
    })
    .from(posts)
    .innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
    .innerJoin(feeds, eq(posts.feedId, feeds.id)) // Joined the feeds table
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}