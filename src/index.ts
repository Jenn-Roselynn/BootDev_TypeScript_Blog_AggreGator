import { readConfig, setUser } from "./config.js";
import { CommandsRegistry, registerCommand, runCommand, CommandHandler } from "./commands.js";
import { users, feeds } from "./db/schema.js";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./db/users.js";
import { createFeed, getFeeds, getFeedByUrl, markFeedFetched, getNextFeedToFetch } from "./db/feeds.js";
import { createFeedFollow, getFeedFollowsForUser, deleteFeedFollow } from "./db/feedFollows.js";
import { createPost, getPostsForUser } from "./db/queries.js";
import { fetchFeed } from "./rss.js";

type User = typeof users.$inferSelect;
type Feed = typeof feeds.$inferSelect;

type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]) => Promise<void>;

type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

const middlewareLoggedIn: middlewareLoggedIn = (handler) => {
  return async (cmdName, ...args) => {
    const currentConfig = readConfig();
    const currentUsername = currentConfig.currentUserName;

    if (!currentUsername) {
      throw new Error("No user currently logged in. Run 'login' or 'register' first.");
    }

    const currentUser = await getUserByName(currentUsername);
    if (!currentUser) {
      throw new Error(`The currently configured user '${currentUsername}' was not found in the database.`);
    }

    await handler(cmdName, currentUser, ...args);
  };
};

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);
  if (!match) {
    throw new Error("Invalid duration format. Use e.g., 1s, 1m, 1h.");
  }
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "ms": return val;
    case "s": return val * 1000;
    case "m": return val * 60 * 1000;
    case "h": return val * 60 * 60 * 1000;
    default: return val;
  }
}

async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();
  if (!feed) {
    console.log("No feeds found to fetch.");
    return;
  }

  console.log(`Fetching feed: ${feed.name}`);
  const feedData = await fetchFeed(feed.url);

  await markFeedFetched(feed.id);

  for (const item of feedData.channel.item) {
    await createPost({
      title: item.title ?? "Untitled",
      url: item.link ?? "",
      description: item.description ?? null,
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
      feedId: feed.id,
    });
  }
}

function printFeed(feed: Feed, user: User): void {
  console.log("Feed successfully added!");
  console.log(JSON.stringify({
    id: feed.id,
    createdAt: feed.createdAt,
    updatedAt: feed.updatedAt,
    name: feed.name,
    url: feed.url,
    userId: feed.userId,
    user_name: user.name
  }, null, 2));
}

async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("The login command requires a username.");
  }

  const username = args[0];
  
  const existingUser = await getUserByName(username);
  if (!existingUser) {
    throw new Error(`User account '${username}' does not exist.`);
  }

  setUser(username);
  console.log(`User has been set to: ${username}`);
}

async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("The register command requires a username.");
  }

  const username = args[0];

  const existingUser = await getUserByName(username);
  if (existingUser) {
    throw new Error(`The username '${username}' is already taken.`);
  }

  const newUser = await createUser(username);
  setUser(username);
  
  console.log(`User was successfully created!`);
  console.log(JSON.stringify(newUser, null, 2));
}

async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
  await deleteAllUsers();
  console.log("Database has been successfully reset to a blank state.");
}

async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
  const allUsers = await getUsers();
  const currentConfig = readConfig();
  const currentUsername = currentConfig.currentUserName;

  for (const user of allUsers) {
    if (user.name === currentUsername) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}

async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("The agg command requires a time_between_reqs duration (e.g., 1m).");
  }

  const durationStr = args[0];
  const timeBetweenRequests = parseDuration(durationStr);
  console.log(`Collecting feeds every ${durationStr}`);

  const handleError = (err: any) => console.error(`Error scraping feed: ${err.message}`);

  scrapeFeeds().catch(handleError);
  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

async function handlerAddFeed(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length < 2 || !args[0] || !args[1]) {
    throw new Error("The addfeed command requires both a name and a url parameter.");
  }

  const feedName = args[0];
  const feedURL = args[1];

  const newFeed = await createFeed(feedName, feedURL, user.id);
  await createFeedFollow(user.id, newFeed.id);
  printFeed(newFeed, user);
}

async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
  const allFeeds = await getFeeds();

  for (const feed of allFeeds) {
    console.log(`* ${feed.name} (${feed.url}) [created by: ${feed.userName}]`);
  }
}

async function handlerFollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("The follow command requires a feed URL.");
  }

  const url = args[0];
  const feed = await getFeedByUrl(url);

  if (!feed) {
    throw new Error("Feed not found.");
  }

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`User '${follow.userName}' is now following feed '${follow.feedName}'`);
}

async function handlerUnfollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("The unfollow command requires a feed URL.");
  }

  const url = args[0];
  await deleteFeedFollow(user.id, url);
  console.log(`User '${user.name}' has unfollowed the feed at '${url}'`);
}

async function handlerFollowing(cmdName: string, user: User, ...args: string[]): Promise<void> {
  const follows = await getFeedFollowsForUser(user.id);
  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
}

async function handlerBrowse(cmdName: string, user: User, ...args: string[]): Promise<void> {
  const limit = args.length > 0 ? parseInt(args[0], 10) : 2;
  const posts = await getPostsForUser(user.id, limit);

  for (const post of posts) {
    console.log(`--- ${post.title} ---`);
    console.log(`Source: ${post.feedName}`);
    console.log(`URL: ${post.url}`);
    console.log("");
  }
}

async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0) {
    console.error("Error: Not enough arguments provided.");
    process.exit(1);
  }

  const cmdName = rawArgs[0];
  const cmdArgs = rawArgs.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred.");
    }
    process.exit(1);
  }
}

main();