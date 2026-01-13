import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

async function fixUser() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('New hash for password123:', hash);

    await db.update(users)
        .set({ passwordHash: hash })
        .where(eq(users.email, 'negocio@test.com'));

    console.log('✅ User negocio@test.com updated with correct hash if it existed.');
    process.exit();
}

fixUser();
