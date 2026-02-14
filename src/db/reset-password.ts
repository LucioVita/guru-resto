import 'dotenv/config';
import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function resetPassword() {
    console.log('🔑 Resetting password for luciomartinvita@gmail.com...');

    try {
        const newPassword = 'GuruAdmin2026!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await db
            .update(users)
            .set({ passwordHash: hashedPassword })
            .where(eq(users.email, 'luciomartinvita@gmail.com'));

        console.log('✅ Password updated successfully!');
        console.log('-------------------------');
        console.log('Email: luciomartinvita@gmail.com');
        console.log('Password: GuruAdmin2026!');
        console.log('-------------------------');
        console.log('Hash:', hashedPassword);
    } catch (error) {
        console.error('❌ Error updating password:', error);
    } finally {
        process.exit();
    }
}

resetPassword();
