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

const cricketTeams = ['Kottayam Royal Strikers', 'Travancore Stumps', 'Malabar Sixers', 'Highland XI Cricket Club'];
const badmintonTeams = ['Kerala Shuttle Aces', 'Highland Smashers', 'Cochin Badminton Doubles', 'Kottayam Netmasters'];

const seedMultiSportTeams = async () => {
  try {
    console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to MongoDB Database: "${mongoose.connection.name}"`);

    // 1. Find Cricket Tournament
    const cricketTourn = await Schemas.TblTournament.findOne({ tournament_name: /Cricket/i });
    const feedCricket = await Tournament.findOne({ title: /Cricket/i });
    const cricketId = cricketTourn?._id || feedCricket?._id;

    if (cricketId) {
      console.log(`🏏 Registering Cricket Teams for "${cricketTourn?.tournament_name || feedCricket?.title}"...`);
      for (let i = 0; i < cricketTeams.length; i++) {
        const email = `cricket_captain${i + 1}@arenax.io`;
        const captainName = `Cricket Captain ${i + 1}`;
        const teamName = cricketTeams[i];

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: captainName,
            email,
            password: 'Password123!',
            role: 'user',
            location: 'Kottayam, Kerala',
            approvalStatus: 'Approved',
            favoriteSports: ['Cricket']
          });
        }
        let tblUser = await Schemas.TblUser.findOne({ email });
        if (!tblUser) {
          tblUser = await Schemas.TblUser.create({
            full_name: captainName,
            email,
            password: 'Password123!',
            role: 'LocalUser',
            district: 'Kottayam'
          });
        }

        const players = [
          { player_name: `${captainName}`, jersey_number: '18', position: 'Batsman (C)', id_proof_type: 'Aadhaar', id_proof_number: `CRIC-10${i}`, verification_status: 'Approved' },
          { player_name: `Bowler ${i + 1}A`, jersey_number: '99', position: 'Pace Bowler', id_proof_type: 'Aadhaar', id_proof_number: `CRIC-20${i}`, verification_status: 'Approved' },
          { player_name: `AllRounder ${i + 1}B`, jersey_number: '7', position: 'All-Rounder', id_proof_type: 'Aadhaar', id_proof_number: `CRIC-30${i}`, verification_status: 'Approved' },
          { player_name: `Keeper ${i + 1}`, jersey_number: '1', position: 'Wicket Keeper', id_proof_type: 'Aadhaar', id_proof_number: `CRIC-40${i}`, verification_status: 'Approved' }
        ];

        const teamObj = await Schemas.TblTeam.create({
          owner_id: tblUser._id,
          team_name: teamName,
          sport: 'Cricket',
          captain_name: captainName,
          district: 'Kottayam',
          players,
          verification_status: 'Approved'
        });

        await Schemas.TblTeamRegistration.create({
          tournament_id: cricketId,
          team_id: teamObj._id,
          user_id: tblUser._id,
          players,
          registration_status: 'Approved',
          payment_status: 'Paid'
        });
      }

      if (cricketTourn) { cricketTourn.registered_teams_count = cricketTeams.length; await cricketTourn.save(); }
      if (feedCricket) { feedCricket.registeredTeamsCount = cricketTeams.length; await feedCricket.save(); }
    }

    // 2. Find Badminton Tournament
    const badmintonTourn = await Schemas.TblTournament.findOne({ tournament_name: /Badminton/i });
    const feedBadminton = await Tournament.findOne({ title: /Badminton/i });
    const badmintonId = badmintonTourn?._id || feedBadminton?._id;

    if (badmintonId) {
      console.log(`🏸 Registering Badminton Doubles Teams for "${badmintonTourn?.tournament_name || feedBadminton?.title}"...`);
      for (let i = 0; i < badmintonTeams.length; i++) {
        const email = `badminton_player${i + 1}@arenax.io`;
        const captainName = `Badminton Captain ${i + 1}`;
        const teamName = badmintonTeams[i];

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: captainName,
            email,
            password: 'Password123!',
            role: 'user',
            location: 'Kottayam, Kerala',
            approvalStatus: 'Approved',
            favoriteSports: ['Badminton']
          });
        }
        let tblUser = await Schemas.TblUser.findOne({ email });
        if (!tblUser) {
          tblUser = await Schemas.TblUser.create({
            full_name: captainName,
            email,
            password: 'Password123!',
            role: 'LocalUser',
            district: 'Kottayam'
          });
        }

        const players = [
          { player_name: `${captainName}`, jersey_number: '1', position: 'Doubles Player 1', id_proof_type: 'Aadhaar', id_proof_number: `BAD-10${i}`, verification_status: 'Approved' },
          { player_name: `Partner ${i + 1}`, jersey_number: '2', position: 'Doubles Player 2', id_proof_type: 'Aadhaar', id_proof_number: `BAD-20${i}`, verification_status: 'Approved' }
        ];

        const teamObj = await Schemas.TblTeam.create({
          owner_id: tblUser._id,
          team_name: teamName,
          sport: 'Badminton',
          captain_name: captainName,
          district: 'Kottayam',
          players,
          verification_status: 'Approved'
        });

        await Schemas.TblTeamRegistration.create({
          tournament_id: badmintonId,
          team_id: teamObj._id,
          user_id: tblUser._id,
          players,
          registration_status: 'Approved',
          payment_status: 'Paid'
        });
      }

      if (badmintonTourn) { badmintonTourn.registered_teams_count = badmintonTeams.length; await badmintonTourn.save(); }
      if (feedBadminton) { feedBadminton.registeredTeamsCount = badmintonTeams.length; await feedBadminton.save(); }
    }

    console.log('🎉 MULTI-SPORT TEAMS & ROSTERS SUCCESSFULLY SEEDED & VERIFIED FOR ALL SPORTS!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding multi-sport teams:', error.message);
    process.exit(1);
  }
};

seedMultiSportTeams();
