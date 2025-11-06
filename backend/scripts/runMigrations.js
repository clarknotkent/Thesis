import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const full = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(full, 'utf8');
      console.log('Applying', file);
      try {
        await client.query(sql);
        console.log('Applied', file);
      } catch (err) {
        console.error('Failed to apply', file, err.message);
        throw err;
      }
    }
    console.log('All migrations applied');
  } catch (err) {
    console.error('Migration run failed', err);
  } finally {
    await client.end();
  }
})();
