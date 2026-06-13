// Inside your scraping loop, where you have access to the feed's ID
for (const item of feedData.channel.item) {
  // 1. Parse the date safely
  const publishedAt = item.pubDate ? new Date(item.pubDate) : null;
  
  // 2. Map and save to the database
  await createPost({
    title: item.title ?? "Untitled",
    url: item.link ?? "",
    description: item.description ?? null,
    publishedAt: publishedAt,
    feedId: feed.id, 
  });
}