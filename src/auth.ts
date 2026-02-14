import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";

async function getUser(email: string) {
    try {
        console.log(`[AUTH] Intentando buscar usuario: ${email}`);
        const result = await db.select().from(users).where(eq(users.email, email));
        if (result.length === 0) {
            console.log(`[AUTH] Usuario no encontrado: ${email}`);
            return null;
        }
        console.log(`[AUTH] Usuario encontrado: ${email}`);
        return result[0];
    } catch (error) {
        console.error('[AUTH] Error en getUser:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    debug: true,
    providers: [
        Credentials({
            async authorize(credentials) {
                try {
                    const parsedCredentials = z
                        .object({ email: z.string().email(), password: z.string().min(6) })
                        .safeParse(credentials);

                    if (parsedCredentials.success) {
                        const { email, password } = parsedCredentials.data;
                        const user = await getUser(email);

                        if (!user) {
                            console.log(`[AUTH] Login fallido: Usuario no encontrado (${email})`);
                            return null;
                        }

                        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
                        if (passwordsMatch) {
                            console.log(`[AUTH] Login exitoso: ${email}`);
                            return user;
                        } else {
                            console.log(`[AUTH] Login fallido: Contraseña incorrecta para ${email}`);
                        }
                    }

                    console.log("[AUTH] Intentó ingresar con credenciales inválidas");
                    return null;
                } catch (error) {
                    console.error("[AUTH] Error CRÍTICO durante authorize:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.businessId = (user as any).businessId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role as any;
                session.user.businessId = token.businessId as any;
            }
            return session;
        },
    },
});
