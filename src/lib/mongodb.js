import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  connectTimeoutMS: 5000,
  socketTimeoutMS: 5000,
};

let client;
let clientPromise;

if (!uri || uri.includes('your_firebase_api_key_here')) {
  console.warn("MongoDB URI is missing or contains placeholder. The application will run in Mock/Demo Mode.");
} else {
  try {
    if (process.env.NODE_ENV === 'development') {
      // In development mode, use a global variable so that the value
      // is preserved across module reloads caused by HMR.
      if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      // In production mode, it's best to not use a global variable.
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
  } catch (error) {
    console.error("Error setting up MongoDB client:", error);
  }
}

export default clientPromise;
