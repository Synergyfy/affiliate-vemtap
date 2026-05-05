const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:Nov52002%23@localhost:5432/vemtap_affiliate"
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT "referralCode", "fullName" FROM "AffiliateProfile" LIMIT 5');
  console.log('Affiliate Profiles:');
  res.rows.forEach(row => console.log(`- ${row.fullName}: ${row.referralCode}`));
  await client.end();
}

main().catch(console.error);
