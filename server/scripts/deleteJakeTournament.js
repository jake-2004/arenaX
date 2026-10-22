import mongoose from 'mongoose';
import { Tournament } from '../models/Tournament.js';
import { User } from '../models/User.js';
import { 
  TblTournament, TblTeamRegistration, TblTeam, TblPlayer, TblMatch, TblFixture 
} from '../models/schemaModels.js';

const MONGODB_URI = 'mongodb://localhost:27017/arenax';

async function removeJakeFootballTournament() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for tournament cleanup:', MONGODB_URI);

    // 1. Find Jake user account
    const jakeUser = await User.findOne({ 
      $or: [
        { email: 'jake@gmail.com' },
        { name: /jake/i }
      ]
    }).lean();

    console.log('Jake User Record:', jakeUser ? `${jakeUser.name} (${jakeUser.email}) ID: ${jakeUser._id}` : 'Not found by exact email');

    // 2. Search for Football tournaments associated with jake@gmail.com or Jake
    const feedTournaments = await Tournament.find({
      $or: [
        { organizerEmail: 'jake@gmail.com' },
        { organizerId: jakeUser?._id },
        { organizer: /jake/i }
      ]
    }).lean();

    const tblTournaments = await TblTournament.find({
      $or: [
        { organizer_email: 'jake@gmail.com' },
        { organizer_id: jakeUser?._id }
      ]
    }).lean();

    console.log(`Found ${feedTournaments.length} Feed Tournaments & ${tblTournaments.length} Schema Tournaments for Jake.`);

    const targetTournamentIds = new Set();
    
    feedTournaments.forEach(t => {
      console.log(` - Feed Tournament: "${t.title}" (${t.sport}) ID: ${t._id}`);
      targetTournamentIds.add(t._id.toString());
    });

    tblTournaments.forEach(t => {
      console.log(` - Schema Tournament: "${t.tournament_name}" (${t.sport}) ID: ${t._id}`);
      targetTournamentIds.add(t._id.toString());
    });

    if (targetTournamentIds.size === 0) {
      console.log('No tournament found for jake@gmail.com. Checking all Football tournaments in DB...');
      const allFootballFeed = await Tournament.find({ sport: /football/i }).lean();
      const allFootballTbl = await TblTournament.find({ sport: /football/i }).lean();
      
      allFootballFeed.forEach(t => {
        console.log(` - Football Feed: "${t.title}" Organizer: ${t.organizer} / ${t.organizerEmail} ID: ${t._id}`);
        targetTournamentIds.add(t._id.toString());
      });
      allFootballTbl.forEach(t => {
        console.log(` - Football Schema: "${t.tournament_name}" Organizer ID: ${t.organizer_id} ID: ${t._id}`);
        targetTournamentIds.add(t._id.toString());
      });
    }

    const tournamentIdArray = Array.from(targetTournamentIds);
    console.log('\nTarget Tournament IDs to purge:', tournamentIdArray);

    if (tournamentIdArray.length > 0) {
      // 3. Delete Team Registrations associated with these tournaments
      const regDel = await TblTeamRegistration.deleteMany({
        $or: [
          { tournament_id: { $in: tournamentIdArray } },
          { tournament_id: { $in: tournamentIdArray.map(id => new mongoose.Types.ObjectId(id)) } }
        ]
      });
      console.log(`✔ Deleted ${regDel.deletedCount} team registration records.`);

      // 4. Delete Matches/Fixtures associated with these tournaments
      const matchDel = await TblMatch.deleteMany({
        $or: [
          { tournament_id: { $in: tournamentIdArray } },
          { tournament_id: { $in: tournamentIdArray.map(id => new mongoose.Types.ObjectId(id)) } }
        ]
      });
      console.log(`✔ Deleted ${matchDel.deletedCount} match records.`);

      const fixtureDel = await TblFixture.deleteMany({
        $or: [
          { tournament_id: { $in: tournamentIdArray } },
          { tournament_id: { $in: tournamentIdArray.map(id => new mongoose.Types.ObjectId(id)) } }
        ]
      });
      console.log(`✔ Deleted ${fixtureDel.deletedCount} fixture records.`);

      // 5. Delete Tournaments from both collections
      const feedDel = await Tournament.deleteMany({
        _id: { $in: tournamentIdArray.map(id => new mongoose.Types.ObjectId(id)) }
      });
      console.log(`✔ Deleted ${feedDel.deletedCount} tournaments from feed collection.`);

      const tblDel = await TblTournament.deleteMany({
        _id: { $in: tournamentIdArray.map(id => new mongoose.Types.ObjectId(id)) }
      });
      console.log(`✔ Deleted ${tblDel.deletedCount} tournaments from tbl_tournaments collection.`);
    }

    console.log('\n🎉 Football tournament by jake@gmail.com and all associated team registration details have been completely removed!');

  } catch (error) {
    console.error('Error removing tournament:', error);
  } finally {
    await mongoose.disconnect();
  }
}

removeJakeFootballTournament();
