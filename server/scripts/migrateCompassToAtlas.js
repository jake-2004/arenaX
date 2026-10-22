import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const LOCAL_URI = 'mongodb://127.0.0.1:27017/arenax';
const ATLAS_RAW_URI = process.env.MONGODB_URI || 'mongodb+srv://jakejimmyxib_db_user:jake123@cluster0.3dmpngu.mongodb.net/';

// Ensure Atlas URI targets 'arenax' database
let ATLAS_URI = ATLAS_RAW_URI.trim();
if (!ATLAS_URI.includes('.mongodb.net/arenax')) {
  if (ATLAS_URI.endsWith('/')) {
    ATLAS_URI = `${ATLAS_URI}arenax?retryWrites=true&w=majority`;
  } else if (ATLAS_URI.includes('.mongodb.net/?')) {
    ATLAS_URI = ATLAS_URI.replace('.mongodb.net/?', '.mongodb.net/arenax?');
  } else if (!ATLAS_URI.includes('?')) {
    ATLAS_URI = `${ATLAS_URI}/arenax?retryWrites=true&w=majority`;
  }
}

async function migrateData() {
  console.log('=====================================================');
  console.log('   🚀 ARENAX MONGODB COMPASS -> ATLAS MIGRATION      ');
  console.log('=====================================================');
  console.log(`Source (Compass / Local): ${LOCAL_URI}`);
  console.log(`Target (MongoDB Atlas):   ${ATLAS_URI.replace(/:([^@]+)@/, ':****@')}\n`);

  let localClient;
  let atlasClient;

  try {
    console.log('Connecting to local MongoDB (Compass)...');
    localClient = new MongoClient(LOCAL_URI, { directConnection: true, serverSelectionTimeoutMS: 5000 });
    await localClient.connect();
    console.log('✅ Connected to Local MongoDB.');

    console.log('Connecting to MongoDB Atlas Cluster...');
    atlasClient = new MongoClient(ATLAS_URI, { serverSelectionTimeoutMS: 15000 });
    await atlasClient.connect();
    console.log('✅ Connected to MongoDB Atlas.\n');

    const localDb = localClient.db('arenax');
    const atlasDb = atlasClient.db('arenax');

    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in local database "arenax".\n`);

    const summary = [];

    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (collName.startsWith('system.')) continue;

      const localColl = localDb.collection(collName);
      const atlasColl = atlasDb.collection(collName);

      const localCount = await localColl.countDocuments();

      if (localCount === 0) {
        // Ensure empty collection exists on Atlas
        await atlasDb.createCollection(collName).catch(() => {});
        summary.push({
          Collection: collName,
          'Local Docs': 0,
          'Atlas Docs': 0,
          Status: 'Empty Collection Created'
        });
        continue;
      }

      console.log(`Migrating "${collName}" (${localCount} documents)...`);
      const docs = await localColl.find({}).toArray();

      // Clear target collection first for clean idempotent migration
      await atlasColl.deleteMany({});

      // Insert all documents in batches to avoid BSON document limit
      const batchSize = 500;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        await atlasColl.insertMany(batch, { ordered: true });
      }

      // Copy indexes (except _id_ which is automatic)
      try {
        const indexes = await localColl.indexes();
        for (const idx of indexes) {
          if (idx.name !== '_id_') {
            const keys = idx.key;
            const options = { name: idx.name };
            if (idx.unique) options.unique = true;
            if (idx.sparse) options.sparse = true;
            await atlasColl.createIndex(keys, options).catch(err => {
              // Ignore non-critical index creation warning
            });
          }
        }
      } catch (idxErr) {
        // Non-fatal
      }

      const atlasCount = await atlasColl.countDocuments();
      summary.push({
        Collection: collName,
        'Local Docs': localCount,
        'Atlas Docs': atlasCount,
        Status: localCount === atlasCount ? '✅ Migrated' : '⚠️ Count Mismatch'
      });
    }

    console.log('\n=====================================================');
    console.log('              MIGRATION SUMMARY TABLE                ');
    console.log('=====================================================');
    console.table(summary);

    const totalLocal = summary.reduce((acc, row) => acc + (row['Local Docs'] || 0), 0);
    const totalAtlas = summary.reduce((acc, row) => acc + (row['Atlas Docs'] || 0), 0);

    console.log(`\n🎉 Total Documents Migrated: ${totalAtlas} / ${totalLocal}`);

    if (totalLocal === totalAtlas && totalLocal > 0) {
      console.log('✨ All collections and records successfully migrated to MongoDB Atlas!');
    }
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
    process.exitCode = 1;
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
    console.log('\nDatabase connections closed.');
  }
}

migrateData();
