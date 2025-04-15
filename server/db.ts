import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Set up the WebSocket constructor for Neon database
neonConfig.webSocketConstructor = ws;

// Add better error handling for database connection
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connection options with more robust settings
const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
};

console.log("Connecting to PostgreSQL database...");

// Create the connection pool
const pool = new Pool(connectionOptions);

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Create the Drizzle ORM instance
const db = drizzle({ client: pool, schema });

console.log("Successfully connected to PostgreSQL database");

// Export the pool and db
export { pool, db };
