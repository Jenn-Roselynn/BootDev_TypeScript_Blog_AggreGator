import { setUser } from "./config.js";
import { CommandsRegistry, registerCommand, runCommand } from "./commands.js";
import { createUser, getUserByName, deleteAllUsers } from "./db/users.js";

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

async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);

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