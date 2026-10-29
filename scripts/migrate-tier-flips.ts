import { repository } from "../src/db/repository";

async function run() {
  console.log("Starting Tier Flip history backfill migration...");
  const result = await repository.backfillTierFlipsFromHistory();
  console.log(`Migration complete! Backfilled ${result.backfilled} tier flip records.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });

