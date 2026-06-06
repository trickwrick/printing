import dns from 'dns';
import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

if (typeof window === 'undefined') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    dns.setDefaultResultOrder('ipv4first');
  } catch {
    /* ignore */
  }
}

const MONGO_URI = process.env.MONGO_URI;

function resolveMongoUri(uri: string) {
  if (!uri) return uri;
  if (/@[^/?]+(\/[^/?]+)/.test(uri)) return uri;
  const queryIndex = uri.indexOf('?');
  if (queryIndex === -1) return `${uri.replace(/\/$/, '')}/printing_crm`;
  return `${uri.slice(0, queryIndex).replace(/\/$/, '')}/printing_crm${uri.slice(queryIndex)}`;
}

if (!global.mongooseConn) {
  global.mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI not configured');
  }

  const { readyState } = mongoose.connection;

  if (readyState === mongoose.ConnectionStates.connected) {
    global.mongooseConn.conn = mongoose;
    return mongoose;
  }

  if (global.mongooseConn.promise && readyState === mongoose.ConnectionStates.connecting) {
    global.mongooseConn.conn = await global.mongooseConn.promise;
    return global.mongooseConn.conn;
  }

  if (global.mongooseConn.conn) {
    global.mongooseConn.conn = null;
    global.mongooseConn.promise = null;
  }

  if (!global.mongooseConn.promise) {
    global.mongooseConn.promise = mongoose
      .connect(resolveMongoUri(MONGO_URI), {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 5,
        family: 4,
        retryWrites: true,
        retryReads: true,
      })
      .catch((err) => {
        global.mongooseConn.promise = null;
        throw err;
      });
  }

  global.mongooseConn.conn = await global.mongooseConn.promise;
  return global.mongooseConn.conn;
}

export function isDbConfigured() {
  return !!MONGO_URI;
}

export function getDbStatus() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected
    ? 'Connected'
    : 'Disconnected';
}
