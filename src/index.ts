import { setUser, readConfig } from "./config.js";

function main() {
  setUser("Jennifer");

  const config = readConfig();
  console.log(config);
}

main();