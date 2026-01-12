import 'dotenv/config';
import { db } from './index';
import { businesses, users } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        const businessId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash('GuruAdmin2026!', 10);

        // 1. Create Business
        await db.insert(businesses).values({
            id: businessId,
            name: 'La Muzza',
            slug: 'la-muzza',
        });

        console.log('✅ Business created');

        // 2. Create Admin User
        await db.insert(users).values({
            id: userId,
            email: 'luciomartinvita@gmail.com',
            name: 'Lucio Admin',
            passwordHash: hashedPassword,
            role: 'business_admin',
            businessId: businessId,
        });

        console.log('✅ Admin user created');
        console.log('-------------------------');
        console.log('Email: luciomartinvita@gmail.com');
        console.log('Password: GuruAdmin2026!');
        console.log('-------------------------');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        process.exit();
    }
}

seed();
