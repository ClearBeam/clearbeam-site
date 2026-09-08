#!/usr/bin/env node
/**
 * Generate the value for the OWNER_PASSWORD_HASH environment variable.
 *
 *   node scripts/hash-password.mjs
 *
 * Prompts for a password (input is hidden), prints a bcrypt hash. Paste the
 * hash into the Netlify project's OWNER_PASSWORD_HASH variable. The plaintext
 * password is never written anywhere.
 */
import process from "node:process";
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";

const COST = 12;
const MIN_LENGTH = 12;

function prompt(question) {
  return new Promise((resolve) => {
    const input = process.stdin;
    const output = process.stdout;
    const rl = createInterface({ input, output, terminal: true });

    // Repaint the prompt (without the typed characters) on every keystroke.
    const redact = () => {
      output.clearLine(0);
      output.cursorTo(0);
      output.write(question);
    };
    input.on("data", redact);

    rl.question(question, (answer) => {
      input.off("data", redact);
      rl.close();
      output.write("\n");
      resolve(answer);
    });
  });
}

const password = await prompt("New owner password: ");
const confirm = await prompt("Confirm password:   ");

if (password !== confirm) {
  console.error("\nPasswords do not match.");
  process.exit(1);
}
if (password.length < MIN_LENGTH) {
  console.error(`\nToo short — use at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}

const hash = await bcrypt.hash(password, COST);

console.log("\nSet this as OWNER_PASSWORD_HASH in the Netlify project:\n");
console.log(hash);
console.log("\nVerify:", (await bcrypt.compare(password, hash)) ? "ok" : "FAILED");
