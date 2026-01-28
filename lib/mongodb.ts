import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Skip database connection during build
    console.log('Skipping MongoDB connection during build');
    // Create a mock promise that won't actually connect
    clientPromise = Promise.resolve({} as MongoClient);
} else if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to get the database instance
// Uses 'horizonBank' database as specified
export async function getDatabase(): Promise<Db> {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        // Return a mock database during build
        return {} as Db;
    }
    const client = await clientPromise;
    return client.db('horizonBank');
}

// Helper function to get the client instance
export async function getClient(): Promise<MongoClient> {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        // Return a mock client during build
        return {} as MongoClient;
    }
    return clientPromise;
}