import { closeDatabaseForTests, initDatabase } from "../api/_db.js";

try {
  const { mode } = await initDatabase();
  console.log(`Golden account-state schema initialized (${mode}; schema v1).`);
} catch {
  console.error("Could not initialize the Golden state database. Check the database URL and server environment configuration.");
  process.exitCode = 1;
} finally {
  await closeDatabaseForTests();
}
