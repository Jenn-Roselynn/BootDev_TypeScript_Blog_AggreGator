import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  // 1. Fetch raw payload with customized user agent agent header
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed from URL. Status: ${response.status}`);
  }

  const xmlText = await response.text();

  // 2. Initialize fast-xml-parser with processEntities disabled
  const parser = new XMLParser({
    processEntities: false,
  });

  const parsedData = parser.parse(xmlText);

  // 3. Structural validation checks
  if (!parsedData?.rss?.channel) {
    throw new Error("Invalid XML structure: Missing RSS channel specifications.");
  }

  const channelData = parsedData.rss.channel;

  const title = channelData.title;
  const link = channelData.link;
  const description = channelData.description;

  if (!title || !link || !description) {
    throw new Error("Missing critical channel metadata fields (title, link, description).");
  }

  // 4. Extract and normalize item data array variations
  let rawItems = channelData.item;
  const validatedItems: RSSItem[] = [];

  if (rawItems) {
    // If there's exactly 1 item element, fast-xml-parser treats it as an object instead of an array
    if (!Array.isArray(rawItems)) {
      rawItems = [rawItems];
    }

    for (const item of rawItems) {
      const itemTitle = item.title;
      const itemLink = item.link;
      const itemDescription = item.description;
      const itemPubDate = item.pubDate;

      // Skip item records that do not contain complete tracking contexts
      if (!itemTitle || !itemLink || !itemDescription || !itemPubDate) {
        continue;
      }

      validatedItems.push({
        title: itemTitle,
        link: itemLink,
        description: itemDescription,
        pubDate: itemPubDate,
      });
    }
  }

  // 5. Assemble final normalized outcome
  return {
    channel: {
      title,
      link,
      description,
      item: validatedItems,
    },
  };
}