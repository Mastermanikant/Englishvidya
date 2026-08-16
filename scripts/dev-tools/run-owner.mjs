import crypto from 'crypto';
import { execSync } from 'child_process';

const password = process.argv[2];

if (!password) {
    console.error("❌ Password was not provided!");
    process.exit(1);
}

// User predefined data
const username = "iamkingofev";
const email = "owner@englishvidya.com";

console.log(`\n⚙️  Generating secure hash for username: ${username}...`);

const salt = crypto.randomBytes(16);
crypto.pbkdf2(password, salt, 100000, 64, 'sha256', (err, derivedKey) => {
    if (err) throw err;
    
    const saltHex = salt.toString('hex');
    const hashHex = derivedKey.toString('hex');
    const finalHash = `${saltHex}:${hashHex}`;
    
    const sql = `UPDATE users SET username = '${username}', password_hash = '${finalHash}' WHERE email = '${email}';`;
    
    console.log("🚀 Saving to Cloudflare D1 Database (Please wait 10-15 seconds)...");
    try {
        execSync(`npx wrangler d1 execute englishvidya-db --remote --command="${sql}"`, { stdio: 'inherit' });
        console.log("\n=========================================");
        console.log("✅ SUCCESS! Owner account created.");
        console.log("🔗 You can now login at: https://englishvidya.com/iamkingofev/");
        console.log("👤 Username: iamkingofev");
        console.log("=========================================\n");
    } catch (e) {
        console.error("\n❌ ERROR: Cloudflare D1 Command failed.");
        console.error("Make sure you are logged in to Cloudflare (`npx wrangler login`).");
    }
});
