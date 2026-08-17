import mongoose from 'mongoose';

const DEFAULT_FALLBACK_URI =
  'mongodb+srv://rok4ktr_db_user:4TRDCRWcsIJZyMfD@cluster0.v9totu2.mongodb.net/tufail_portfolio?appName=Cluster0';

const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_FALLBACK_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  // If already connected and ready, return existing connection
  if (cached?.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached!.promise || mongoose.connection.readyState === 0) {
    const opts = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    cached!.conn = null;
    console.error('[MONGODB_CONNECT_ERROR]', e);
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
