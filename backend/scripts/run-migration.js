/*
 Simple migration runner for executing a single .sql file using node-postgres.
 Usage:
   node scripts/run-migration.js migrations/066_validate_constraints.sql

 Requires a DATABASE_URL or PG* env vars in .env (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).
*/
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  if (PGHOST && PGUSER && PGDATABASE) {
    const port = PGPORT || '5432';
    const password = encodeURIComponent(PGPASSWORD || '');
    const user = encodeURIComponent(PGUSER);
    const host = PGHOST;
    const db = PGDATABASE;
    return `postgresql://${user}:${password}@${host}:${port}/${db}`;
  }
  throw new Error('Missing DATABASE_URL or PG* environment variables for Postgres connection.');
}

async function run() {
  const relFile = process.argv[2];
  if (!relFile) {
    console.error('Usage: node scripts/run-migration.js <relative-sql-path>');
    process.exit(1);
  }
  const sqlPath = path.resolve(__dirname, '..', relFile);
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: getConnectionString(), ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined });
  const start = Date.now();
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Running migration:', relFile);
    await client.query(sql);
    console.log(`Migration completed successfully in ${Date.now() - start}ms.`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
}

run();
