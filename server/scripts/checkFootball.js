import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/arenax';

async function checkFootball() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log('Collections in arenax:', cols.map(c => c.name));

    for (const c of cols) {
      const col = db.collection(c.name);
      const docs = await col.find({
        $or: [
          { sport: /football/i },
          { title: /football/i },
          { tournament_name: /football/i },
          { name: /football/i },
          { organizer_email: 'jake@gmail.com' },
          { organizerEmail: 'jake@gmail.com' }
        ]
      }).toArray();

      if (docs.length > 0) {
        console.log(`\nFound ${docs.length} records in collection "${c.name}":`);
        docs.forEach(d => console.log(' ->', d._id, d.title || d.tournament_name || d.name || d.player_name || d.team_name, 'Sport:', d.sport));
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

checkFootball();
