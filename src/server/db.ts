import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
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

  if (global.mongooseConn.conn) {
    return global.mongooseConn.conn;
  }

  if (!global.mongooseConn.promise) {
    global.mongooseConn.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });
  }

  global.mongooseConn.conn = await global.mongooseConn.promise;
  return global.mongooseConn.conn;
}

export function isDbConfigured() {
  return !!MONGO_URI;
}

export function getDbStatus() {
  return mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
}
