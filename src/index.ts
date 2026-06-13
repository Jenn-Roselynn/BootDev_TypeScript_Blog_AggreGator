import { readConfig, setUser } from "./config.js";
import { CommandsRegistry, registerCommand, runCommand } from "./commands.js";
import { users, feeds } from "./db/schema.js";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./db/users.js";
import { createFeed } from "./db/feeds.js";
import { fetchFeed } from "./rss.js";

type User = typeof users.$inferSelect;
type Feed = typeof feeds.$inferSelect;

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
  const targetURL = "https://www.wagslane.dev/index.xml";
  const feedData = await fetchFeed(targetURL);
  console.log(JSON.stringify(feedData, null, 2));
}

async function handlerAddFeed(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length < 2 || !args[0] || !args[1]) {
    throw new Error("The addfeed command requires both a name and a url parameter.");
  }

  const feedName = args[0];
  const feedURL = args[1];

  const currentConfig = readConfig();
  const currentUsername = currentConfig.currentUserName;

  if (!currentUsername) {
    throw new Error("No user currently logged in. Run 'login' or 'register' first.");
  }

  const currentUser = await getUserByName(currentUsername);
  if (!currentUser) {
    throw new Error(`The currently configured user '${currentUsername}' was not found in the database.`);
  }

  const newFeed = await createFeed(feedName, feedURL, currentUser.id);
  printFeed(newFeed, currentUser);
}

async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", handlerAddFeed);

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