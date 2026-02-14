import 'dotenv/config';
import { db } from '../src/db/index';
import { businesses, users } from '../src/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function fixAdmin() {
    console.log('🔍 Iniciando reparación de usuario administrador...');

    try {
        const email = 'luciomartinvita@gmail.com';
        const password = 'GuruAdmin2026!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Buscar o crear negocio
        let businessId = crypto.randomUUID();
        const existingBusiness = await db.select().from(businesses).limit(1);

        if (existingBusiness.length > 0) {
            businessId = existingBusiness[0].id;
            console.log(`✅ Usando negocio existente: ${existingBusiness[0].name}`);
        } else {
            await db.insert(businesses).values({
                id: businessId,
                name: 'Guru Resto Admin',
                slug: 'admin',
            });
            console.log('✅ Nuevo negocio de administración creado');
        }

        // 2. Buscar o crear usuario
        const existingUser = await db.select().from(users).where(eq(users.email, email));

        if (existingUser.length > 0) {
            // Actualizar contraseña por si acaso
            await db.update(users)
                .set({ passwordHash: hashedPassword, businessId: businessId })
                .where(eq(users.email, email));
            console.log(`✅ Usuario ${email} actualizado con la nueva contraseña.`);
        } else {
            await db.insert(users).values({
                id: crypto.randomUUID(),
                email: email,
                name: 'Lucio Admin',
                passwordHash: hashedPassword,
                role: 'business_admin',
                businessId: businessId,
            });
            console.log(`✅ Usuario ${email} creado exitosamente.`);
        }

        console.log('\n-------------------------');
        console.log('DATOS DE ACCESO ACTUALIZADOS:');
        console.log(`URL: https://gururesto.guruweb.com.ar`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('-------------------------\n');

    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        process.exit();
    }
}

fixAdmin();
