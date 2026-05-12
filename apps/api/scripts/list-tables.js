
const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:Nov52002%23@localhost:5432/vemtap"
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Tables in database:');
  res.rows.forEach(row => console.log(`- ${row.table_name}`));
  await client.end();
}

main().catch(console.error);
