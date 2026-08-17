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

const seedJakeTournaments = async () => {
  try {
    console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to MongoDB Database: "${mongoose.connection.name}"`);

    const email = 'jake@gmail.com';
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'Jake Organizer',
        email: email,
        password: 'Password123!',
        role: 'organizer',
        organization: "Jake's Sports Academy",
        location: 'Kottayam, Kerala',
        approvalStatus: 'Approved'
      });
      console.log(`   ✔ Created User account: ${email}`);
    } else {
      user.role = 'organizer';
      user.organization = user.organization || "Jake's Sports Academy";
      user.approvalStatus = 'Approved';
      await user.save();
      console.log(`   ✔ Updated User account to Organizer role: ${email}`);
    }

    let tblUser = await Schemas.TblUser.findOne({ email });
    if (!tblUser) {
      tblUser = await Schemas.TblUser.create({
        full_name: user.name,
        email: email,
        password: 'Password123!',
        role: 'Organizer',
        district: 'Kottayam'
      });
    }

    let tblOrganizer = await Schemas.TblOrganizer.findOne({ user_id: tblUser._id });
    if (!tblOrganizer) {
      tblOrganizer = await Schemas.TblOrganizer.create({
        user_id: tblUser._id,
        organization_name: "Jake's Sports Academy",
        description: 'Official sports tournament organizer',
        approval_status: 'Approved'
      });
    }

    // Define 3 tournaments to add for jake@gmail.com
    const tournamentsToCreate = [
      {
        title: 'Kerala Premier Football Championship 2026',
        sport: 'Football',
        format: 'Knockout 7v7',
        location: 'Nehru Stadium, Kottayam, Kerala',
        startDate: '2026-09-10',
        entryFee: 500,
        prizePool: '₹10,000',
        prizeAmount: 10000,
        maxTeams: 16,
        posterUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        rules: '7 Players per team + 3 substitutes. Standard FIFA rules apply.'
      },
      {
        title: 'Kottayam Super League Cricket T20',
        sport: 'Cricket',
        format: 'T20 League',
        location: 'Kottayam Sports Complex Ground, Kerala',
        startDate: '2026-09-18',
        entryFee: 750,
        prizePool: '₹15,000',
        prizeAmount: 15000,
        maxTeams: 12,
        posterUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
        rules: '11 Players per team. White leather ball, T20 format.'
      },
      {
        title: 'Highland Smash Badminton Doubles',
        sport: 'Badminton',
        format: 'Doubles Open',
        location: 'YMCA Indoor Badminton Court, Kottayam, Kerala',
        startDate: '2026-09-25',
        entryFee: 250,
        prizePool: '₹5,000',
        prizeAmount: 5000,
        maxTeams: 32,
        posterUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
        rules: 'Doubles event. Best of 3 sets of 21 points each.'
      }
    ];

    for (const t of tournamentsToCreate) {
      // 1. Insert into TblTournament
      await Schemas.TblTournament.create({
        organizer_id: tblOrganizer._id,
        tournament_name: t.title,
        sport: t.sport,
        format: t.format,
        location: t.location,
        district: 'Kottayam',
        start_date: new Date(t.startDate),
        entry_fee: t.entryFee,
        prize_amount: t.prizeAmount,
        max_teams: t.maxTeams,
        poster_url: t.posterUrl,
        rules: t.rules,
        status: 'Approved'
      });

      // 2. Insert into Tournament model
      await Tournament.create({
        title: t.title,
        sport: t.sport,
        format: t.format,
        location: t.location,
        startDate: t.startDate,
        entryFee: t.entryFee,
        prizePool: t.prizePool,
        maxTeams: t.maxTeams,
        registeredTeamsCount: 0,
        status: 'registration_open',
        posterUrl: t.posterUrl,
        organizer: "Jake's Sports Academy",
        isApproved: true
      });

      console.log(`   ✔ Created Tournament: "${t.title}" (${t.sport}) for ${email}`);
    }

    console.log(`\n🎉 SUCCESSFULLY ADDED 3 TOURNAMENTS FOR ${email}!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Jake tournaments:', error.message);
    process.exit(1);
  }
};

seedJakeTournaments();
