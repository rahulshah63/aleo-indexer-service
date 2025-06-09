import { createCommand } from "commander";
import { dev } from "./dev.js";

export const program = createCommand("aleo-indexer")
  .description("Indexer for the Aleo blockchain")
  .version("1.0.0");

program
  .command("dev")
  .description("Starts the development server with hot-reloading")
  .action(dev);

program
  .command("start")
  .description("Starts the production server")
  .action(() => {
    console.log("`start` command not yet implemented. Use `dev` for now.");
  });