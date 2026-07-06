import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is missing.');
  process.exit(1);
}

async function verifyIndexes() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected.\n');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ Mongoose connection db is undefined.');
    process.exit(1);
  }
  const collections = await db.listCollections().toArray();
  
  console.log('=== Active MongoDB Indexes ===');
  for (const collectionInfo of collections) {
    const name = collectionInfo.name;
    const collection = db.collection(name);
    const indexes = await collection.indexes();
    
    console.log(`\n📦 Collection: "${name}"`);
    indexes.forEach((index) => {
      const keys = Object.keys(index.key).map(k => `${k}: ${index.key[k]}`).join(', ');
      const flags = [];
      if (index.unique) flags.push('UNIQUE');
      if (index.sparse) flags.push('SPARSE');
      
      const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
      console.log(`  - ${index.name}: { ${keys} }${flagStr}`);
    });
  }

  console.log('\n==============================');
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected.');
}

verifyIndexes().catch((err) => {
  console.error('❌ Error during index verification:', err);
  process.exit(1);
});
