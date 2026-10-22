import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Schemas from '../models/schemaModels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

const approveAll16Rosters = async () => {
  try {
    console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to MongoDB Database: "${mongoose.connection.name}"`);

    // 1. Update all TblTeamRegistrations
    const registrations = await Schemas.TblTeamRegistration.find({});
    console.log(`Updating ${registrations.length} team registrations...`);

    for (const reg of registrations) {
      if (reg.players && reg.players.length > 0) {
        const approvedPlayers = reg.players.map(p => ({
          ...p.toObject ? p.toObject() : p,
          verification_status: 'Approved'
        }));

        await Schemas.TblTeamRegistration.collection.updateOne(
          { _id: reg._id },
          { 
            $set: { 
              players: approvedPlayers,
              registration_status: 'Approved'
            } 
          }
        );
      }
    }

    // 2. Update all TblTeams
    const teams = await Schemas.TblTeam.find({});
    console.log(`Updating ${teams.length} teams...`);

    for (const t of teams) {
      if (t.players && t.players.length > 0) {
        const approvedPlayers = t.players.map(p => ({
          ...p.toObject ? p.toObject() : p,
          verification_status: 'Approved'
        }));

        await Schemas.TblTeam.collection.updateOne(
          { _id: t._id },
          { 
            $set: { 
              players: approvedPlayers,
              verification_status: 'Approved'
            } 
          }
        );
      }
    }

    // 3. Update all TblPlayer documents
    await Schemas.TblPlayer.updateMany({}, { $set: { verification_status: 'Approved' } });

    console.log('🎉 ALL 16 TEAMS AND ALL PLAYER ROSTERS ARE NOW FULLY APPROVED!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error approving player rosters:', error.message);
    process.exit(1);
  }
};

approveAll16Rosters();
