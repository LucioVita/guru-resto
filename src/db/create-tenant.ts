import 'dotenv/config';
import { db } from './index';
import { businesses, users } from './schema';
import bcrypt from 'bcryptjs';

async function createTenant(businessName: string, adminEmail: string, pass: string) {
    console.log(`🚀 Creating tenant: ${businessName}`);

    try {
        const businessId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(pass, 10);
        const slug = businessName.toLowerCase().replace(/\s+/g, '-');

        // 1. Create Business
        await db.insert(businesses).values({
            id: businessId,
            name: businessName,
            slug: slug,
        });

        console.log('✅ Business created:', businessId);

        // 2. Create Admin User
        await db.insert(users).values({
            id: userId,
            email: adminEmail,
            name: `${businessName} Admin`,
            passwordHash: hashedPassword,
            role: 'business_admin',
            businessId: businessId,
        });

        console.log('✅ Admin user created:', userId);
        console.log('-------------------------');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${pass}`);
        console.log(`Link: /login`);
        console.log('-------------------------');

    } catch (error) {
        console.error('❌ Error creating tenant:', error);
    } finally {
        process.exit();
    }
}

// Example usage from command line: npx tsx src/db/create-tenant.ts "My Restaurant" "admin@example.com" "mypass123"
const [, , name, email, pass] = process.argv;
if (!name || !email || !pass) {
    console.log('Usage: npx tsx src/db/create-tenant.ts "Name" "email" "pass"');
    process.exit(1);
}

createTenant(name, email, pass);
