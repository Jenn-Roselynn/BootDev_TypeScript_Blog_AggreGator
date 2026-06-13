import { setUser } from "./config.js";
import { CommandsRegistry, registerCommand, runCommand } from "./commands.js";

function handlerLogin(cmdName: string, ...args: string[]): void {
  if (args.length === 0 || !args[0]) {
    throw new Error("The login command requires a username.");
  }

  const username = args[0];
  setUser(username);
  console.log(`User has been set to: ${username}`);
}

function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);

  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0) {
    console.error("Error: Not enough arguments provided.");
    process.exit(1);
  }

  const cmdName = rawArgs[0];
  const cmdArgs = rawArgs.slice(1);

  try {
    runCommand(registry, cmdName, ...cmdArgs);
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