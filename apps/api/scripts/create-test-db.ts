import { Client } from 'pg';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load the main .env to get the connection details, but we will connect to 'postgres' db
const envTestPath = path.join(__dirname, '../.env.test');
dotenv.config({ path: envTestPath });

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
  
  const envPath = path.join(__dirname, '../.env');
  const envBackupPath = path.join(__dirname, '../.env.backup');
  const hasEnv = fs.existsSync(envPath);

  try {
    // Temporarily rename .env to prevent Prisma from loading it
    if (hasEnv) {
      fs.renameSync(envPath, envBackupPath);
    }

    // DATABASE_URL is already set in process.env from dotenv.config above
    execSync('pnpm exec prisma db push --accept-data-loss', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }, 
    });
    console.log('Database schema pushed successfully!');
  } catch (err) {
    console.error('Failed to push Prisma schema.');
    throw err; // Rethrow so it can be handled or just exit naturally after finally
  } finally {
    // Restore .env
    if (hasEnv && fs.existsSync(envBackupPath)) {
      console.log('Restoring .env file...');
      fs.renameSync(envBackupPath, envPath);
    }
  }
}

run();
