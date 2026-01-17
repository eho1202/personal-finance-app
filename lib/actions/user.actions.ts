'use server'
import { auth, sessionClient } from "../auth";
import { cookies, headers } from "next/headers";
import { parseStringify } from "../utils";
import { getDatabase } from "../mongodb";

interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
}

export const signIn = async ({email, password}: signInProps) => {
    try {
        const cookieStore = await cookies();
        const requestHeaders = await headers();
        
        // Create a Headers object with existing cookies
        const authHeaders = new Headers();
        cookieStore.getAll().forEach(cookie => {
            authHeaders.append('cookie', `${cookie.name}=${cookie.value}`);
        });
        // Forward other important headers
        if (requestHeaders.get('user-agent')) {
            authHeaders.set('user-agent', requestHeaders.get('user-agent')!);
        }

        const response = await auth.api.signInEmail({
            body: {
                email: email,
                password: password,
            },
            headers: authHeaders,
        });

        // Better Auth automatically creates a session and returns a token
        // Set the session cookie - Better Auth uses 'better-auth.session_token' by default
        if (response?.token) {
            const cookieOptions: CookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            };
            
            cookieStore.set('better-auth.session_token', response.token, cookieOptions);
        }

        return parseStringify(response);
    } catch (error) {
        console.error("Error", error);
        throw error;
    }
}

export const signUp = async (userData: SignUpParams) => {
    const { email, password, firstName, lastName, address1, city, state, postalCode, dateOfBirth, ssn } = userData;
    try {
        const cookieStore = await cookies();
        const requestHeaders = await headers();
        
        // Create a Headers object with existing cookies
        const authHeaders = new Headers();
        cookieStore.getAll().forEach(cookie => {
            authHeaders.append('cookie', `${cookie.name}=${cookie.value}`);
        });
        // Forward other important headers
        if (requestHeaders.get('user-agent')) {
            authHeaders.set('user-agent', requestHeaders.get('user-agent')!);
        }

        // Create user account - Better Auth automatically creates a session
        const response = await auth.api.signUpEmail({
            body: {
                name: `${firstName} ${lastName}`,
                email: email,
                password: password,
            },
            headers: authHeaders,
        });

        // Create session and set cookies
        // Better Auth returns a token that we need to set as a cookie
        if (response?.token) {
            const cookieOptions: CookieOptions = {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            };
            
            cookieStore.set('better-auth.session_token', response.token, cookieOptions);
        }

        // Save user data to MongoDB users collection in horizonBank database
        if (response?.user) {
            const db = await getDatabase();
            const usersCollection = db.collection('users');

            // Check if user already exists (in case of duplicate sign-up attempts)
            const existingUser = await usersCollection.findOne({ userId: response.user.id });
            
            if (!existingUser) {
                // Create user document for MongoDB
                const userDocument = {
                    $id: response.user.id, // Use Better Auth user ID
                    userId: response.user.id,
                    email: response.user.email,
                    firstName: firstName || '',
                    lastName: lastName || '',
                    address1: address1 || '',
                    city: city || '',
                    state: state || '',
                    postalCode: postalCode || '',
                    dateOfBirth: dateOfBirth || '',
                    ssn: ssn || '',
                    dwollaCustomerUrl: '', // Will be set when linking bank account
                    dwollaCustomerId: '', // Will be set when linking bank account
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                // Insert user into MongoDB users collection
                await usersCollection.insertOne(userDocument);
            } else {
                // Update existing user with new information if needed
                await usersCollection.updateOne(
                    { userId: response.user.id },
                    {
                        $set: {
                            email: response.user.email,
                            firstName: firstName || existingUser.firstName,
                            lastName: lastName || existingUser.lastName,
                            address1: address1 || existingUser.address1,
                            city: city || existingUser.city,
                            state: state || existingUser.state,
                            postalCode: postalCode || existingUser.postalCode,
                            dateOfBirth: dateOfBirth || existingUser.dateOfBirth,
                            ssn: ssn || existingUser.ssn,
                            updatedAt: new Date(),
                        }
                    }
                );
            }

            // Return user data in the format expected by the app
            const user = {
                $id: response.user.id,
                userId: response.user.id,
                email: response.user.email,
                firstName: firstName || '',
                lastName: lastName || '',
                address1: address1 || '',
                city: city || '',
                state: state || '',
                postalCode: postalCode || '',
                dateOfBirth: dateOfBirth || '',
                ssn: ssn || '',
                dwollaCustomerUrl: '',
                dwollaCustomerId: '',
            };

            return parseStringify(user);
        }

        throw new Error('Failed to create user account');
    } catch (error) {
        console.error("Error during sign up:", error);
        throw error;
    }
}

export async function getLoggedInUser() {
    try {
        // Get the session token from cookies
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('better-auth.session_token')?.value;

        if (!sessionToken) {
            return null;
        }

        // Get MongoDB instance
        const db = await getDatabase();
        
        // Query the session collection (Better Auth stores sessions here)
        const sessionsCollection = db.collection('session');
        const session = await sessionsCollection.findOne({ token: sessionToken });

        if (!session || !session.userId) {
            console.log("No session found or no userId in session");
            return null;
        }

        // Query for the user using the _id field (which is the ObjectId from the session)
        const usersCollection = db.collection('users');
        const userProfile = await usersCollection.findOne({ userId: session.userId.toString() });
        
        if (!userProfile) {
            console.log("Custom user profile not found in MongoDB");
            return null;
        }

        // Return parsed user profile data
        return parseStringify(userProfile);
    } catch (error) {
        console.error("Error fetching logged in user:", error);
        return null;
    }
}

export const logoutAccount = async () => {
    try {
        // Create session client to get the current session
        const { data: session, error } = await sessionClient.getSession();

        if (error) {
            console.error("Error getting session:", error);
            return null;
        }

        // Delete the session on the server side using Better Auth
        if (session) {
            await auth.api.signOut({
                headers: {
                    cookie: `better-auth.session_token=${session}`,
                },
            });
        }

        // Delete cookies associated with the user
        const cookieStore = await cookies();
        cookieStore.delete('better-auth.session_token');

        // Delete the current session from MongoDB
        if (session && session.user) {
            const db = await getDatabase();
            const sessionsCollection = db.collection('session');
            
            // Delete the session document from MongoDB
            await sessionsCollection.deleteOne({ userId: session.user.id });
        }

        console.log("User logged out successfully");
        return true;
    } catch (error) {
        console.error("Error logging out:", error);
        return null;
    }
}