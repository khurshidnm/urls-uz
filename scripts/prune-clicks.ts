import { pool } from '../src/db/client';
import { pruneRawClicks } from '../src/lib/clicks/retention';

/** Deletes raw clicks past each plan's retention period. Run daily from cron. */
pruneRawClicks()
  .then((deleted) => console.log('Deleted raw clicks by plan:', deleted))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
