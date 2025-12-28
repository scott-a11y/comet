import fs from 'fs';
import pg from 'pg';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const { Client } = pg;

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL is missing from .env');
        process.exit(1);
    }

    // Connection setup
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for cloud DBs
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();

        // Read the SQL file
        const sqlPath = path.join(process.cwd(), 'database-indexes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Run the query
        console.log('⏳ Applying indexes...');
        await client.query(sql);

        console.log('✅ SUCCESS: Database indexes applied!');
        console.log('ℹ️  Prefer Prisma migrations for deploys: `npx prisma migrate deploy`');
    } catch (err) {
        console.error('❌ FAILED:', err);
    } finally {
        await client.end();
    }
}

run();