import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            businessId: string;
        } & DefaultSession["user"];
    }

    interface User {
        role: string;
        businessId: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string;
        businessId: string | null;
    }
}
