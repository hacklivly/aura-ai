import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || `mongodb+srv://harsh0009111_db_user:7qQsOcK0mdp1Khil@cluster0.8rzwoca.mongodb.net/?appName=Cluster0`;
let client: MongoClient | null = null;

export async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db('aura');
}
