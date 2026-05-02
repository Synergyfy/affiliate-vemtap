import { Client } from 'pg';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the main .env to get the connection details, but we will connect to 'postgres' db
dotenv.config({ path: path.join(__dirname, '../.env.test') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env.test');
  process.exit(1);
}

// Parse the DB URL
const urlObj = new URL(dbUrl);
const dbName = urlObj.pathname.split('/')[1];

// Create connection URL to the default 'postgres' database
urlObj.pathname = '/postgres';
const adminUrl = urlObj.toString();

async function createDatabase() {
  const client = new Client({ connectionString: adminUrl });
  try {
    await client.connect();
    console.log(`Connected to PostgreSQL server at ${urlObj.hostname}:${urlObj.port}`);
    
    // Check if database exists
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists. Dropping and recreating...`);
      // Terminate existing connections
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${dbName}'
          AND pid <> pg_backend_pid();
      `);
      await client.query(`DROP DATABASE "${dbName}"`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" recreated successfully.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function run() {
  await createDatabase();
  console.log('Running Prisma DB push to setup schema...');
  try {
    // DATABASE_URL is already set in process.env from dotenv.config above
    execSync('pnpm exec prisma db push --accept-data-loss', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }, // forward the loaded .env.test vars
    });
    console.log('Database schema pushed successfully!');
  } catch (err) {
    console.error('Failed to push Prisma schema.');
    process.exit(1);
  }
}

run();
