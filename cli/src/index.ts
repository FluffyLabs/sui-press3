import {logStep} from "./logger";
import {run} from "./run";

run().catch((err) => {
  logStep('CLI failed', err);
  process.exit(1);
});
