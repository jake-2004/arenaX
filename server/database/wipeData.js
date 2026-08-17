import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { Tournament } from '../models/Tournament.js';
import * as Schemas from '../models/schemaModels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

const wipeData = async () => {
  try {
    console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to MongoDB Database: "${mongoose.connection.name}"`);

    console.log('🧹 Clearing all tournaments, teams, players, and registrations from MongoDB...');

    await Tournament.deleteMany({});
    console.log('   ✔ Deleted all records from "tournaments"');

    await Schemas.TblTournament.deleteMany({});
    console.log('   ✔ Deleted all records from "tbl_tournaments"');

    await Schemas.TblTeam.deleteMany({});
    console.log('   ✔ Deleted all records from "tbl_teams"');

    await Schemas.TblPlayer.deleteMany({});
    console.log('   ✔ Deleted all records from "tbl_players"');

    await Schemas.TblTeamRegistration.deleteMany({});
    console.log('   ✔ Deleted all records from "tbl_team_registrations"');

    await Schemas.TblTournamentPoster.deleteMany({});
    console.log('   ✔ Deleted all records from "tbl_tournament_posters"');

    await Schemas.TblMatch.deleteMany({});
    console.log('   ✔ Deleted all records from "tbl_matches"');

    await Schemas.TblLiveScore.deleteMany({});
    console.log('   ✔ Deleted all records from "tbl_live_scores"');

    await Schemas.TblFixture.deleteMany({});
    console.log('   ✔ Deleted all records from "tbl_fixtures"');

    console.log('\n🎉 ALL TOURNAMENTS, TEAMS, PLAYERS & REGISTRATIONS WIPED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to wipe database data:', error.message);
    process.exit(1);
  }
};

wipeData();
