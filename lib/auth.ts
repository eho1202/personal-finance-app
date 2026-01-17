import { betterAuth } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { admin } from "better-auth/plugins/admin";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getClient, getDatabase } from "./mongodb";
import type { Collection } from "mongodb";

// Get the shared MongoDB client and database
const client = await getClient();
const db = await getDatabase();

export const auth = betterAuth({
    database: mongodbAdapter(db, {
        client,
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [admin()],
});

// Session client for regular user authentication operations
export const sessionClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

// Admin client for Better Auth admin API operations (user management, impersonation, etc.)
export const adminClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    plugins: [admin()],
});

// Keep authClient as an alias for backward compatibility
export const authClient = sessionClient;