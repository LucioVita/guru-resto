
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
    console.log('Usage: npx tsx src/db/hash-password.ts "your_password"');
    process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('Copy the hash above and paste it into the password_hash column in your database.');
});
