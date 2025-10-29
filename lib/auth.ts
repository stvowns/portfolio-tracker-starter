import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { account, session, user, verification } from "@/db/schema/auth";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite", // changed from "pg" to "sqlite" to match the database
        schema: {
            user: user,
            account: account,
            session: session,
            verification: verification,
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});