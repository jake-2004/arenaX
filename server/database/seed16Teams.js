import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { User } from '../models/User.js';
import { Tournament } from '../models/Tournament.js';
import * as Schemas from '../models/schemaModels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

const teamNames = [
  'Kottayam Strikers FC',
  'Malabar Warriors',
  'Cochin Dragons',
  'Highland United',
  'Trivandrum Titans',
  'Calicut Blasters',
  'Wayanku Thunder',
  'Thrissur Eagles FC',
  'Kannur Sharks',
  'Alleppey Wave FC',
  'Palakkad Panthers',
  'Idukki Express',
  'Kollam Knights',
  'Kasargod Bulls',
  'Pathanamthitta Lions',
  'Munroe Island FC'
];

const seed16Teams = async () => {
  try {
    console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to MongoDB Database: "${mongoose.connection.name}"`);

    // 1. Find Football Tournament "Kerala Premier Football Championship 2026"
    let footballTourn = await Schemas.TblTournament.findOne({ tournament_name: /Kerala Premier Football/i });
    let feedFootballTourn = await Tournament.findOne({ title: /Kerala Premier Football/i });

    if (!footballTourn && !feedFootballTourn) {
      console.error('❌ Football tournament not found. Please ensure seedJakeTournaments has run.');
      process.exit(1);
    }

    const tournId = footballTourn?._id || feedFootballTourn?._id;

    console.log(`⚽ Registering 16 Teams for Tournament: "${footballTourn?.tournament_name || feedFootballTourn?.title}"...`);

    const createdUsers = [];

    for (let i = 1; i <= 16; i++) {
      const email = `player${i}@arenax.io`;
      const password = 'Password123!';
      const captainName = `Captain ${i}`;
      const teamName = teamNames[i - 1];

      // Create or update User
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: captainName,
          email,
          password,
          role: 'user',
          location: 'Kottayam, Kerala',
          approvalStatus: 'Approved',
          favoriteSports: ['Football']
        });
      } else {
        user.password = password;
        user.role = 'user';
        user.approvalStatus = 'Approved';
        await user.save();
      }

      let tblUser = await Schemas.TblUser.findOne({ email });
      if (!tblUser) {
        tblUser = await Schemas.TblUser.create({
          full_name: captainName,
          email,
          password,
          role: 'LocalUser',
          district: 'Kottayam'
        });
      }

      // Create 5 players roster
      const playersList = [
        { player_name: `${captainName}`, jersey_number: '10', position: 'Forward / Captain', id_proof_type: 'Aadhaar', id_proof_number: `AAD-100${i}`, verification_status: 'Approved' },
        { player_name: `Midfielder ${i}A`, jersey_number: '7', position: 'Midfielder', id_proof_type: 'Aadhaar', id_proof_number: `AAD-200${i}`, verification_status: 'Approved' },
        { player_name: `Defender ${i}B`, jersey_number: '4', position: 'Defender', id_proof_type: 'Aadhaar', id_proof_number: `AAD-300${i}`, verification_status: 'Approved' },
        { player_name: `Defender ${i}C`, jersey_number: '3', position: 'Defender', id_proof_type: 'Aadhaar', id_proof_number: `AAD-400${i}`, verification_status: 'Approved' },
        { player_name: `Goalkeeper ${i}`, jersey_number: '1', position: 'Goalkeeper', id_proof_type: 'Aadhaar', id_proof_number: `AAD-500${i}`, verification_status: 'Approved' }
      ];

      // Create TblTeam
      const teamObj = await Schemas.TblTeam.create({
        owner_id: tblUser._id,
        team_name: teamName,
        sport: 'Football',
        captain_name: captainName,
        district: 'Kottayam',
        players: playersList,
        verification_status: 'Approved'
      });

      // Create TblTeamRegistration
      await Schemas.TblTeamRegistration.create({
        tournament_id: tournId,
        team_id: teamObj._id,
        user_id: tblUser._id,
        players: playersList,
        registration_status: 'Approved',
        payment_status: 'Paid'
      });

      createdUsers.push({
        Index: i,
        TeamName: teamName,
        Captain: captainName,
        Email: email,
        Password: password,
        RosterCount: 5,
        Status: 'Approved (✓)'
      });
    }

    // Update registeredTeamsCount on tournaments
    if (footballTourn) {
      footballTourn.registered_teams_count = 16;
      await footballTourn.save();
    }
    if (feedFootballTourn) {
      feedFootballTourn.registeredTeamsCount = 16;
      await feedFootballTourn.save();
    }

    console.log('\n🎉 ALL 16 TEAMS & USERS SUCCESSFULLY REGISTERED AND APPROVED!');
    console.table(createdUsers);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding 16 teams:', error.message);
    process.exit(1);
  }
};

seed16Teams();
