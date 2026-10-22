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

export const initializeCollectionsAndSeed = async () => {
  try {
    console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ Connected to MongoDB Database: "${mongoose.connection.name}"`);

    // All models list
    const modelsList = [
      { name: 'User', model: User },
      { name: 'Tournament', model: Tournament },
      { name: 'TblUser', model: Schemas.TblUser },
      { name: 'TblOrganizer', model: Schemas.TblOrganizer },
      { name: 'TblTeam', model: Schemas.TblTeam },
      { name: 'TblPlayer', model: Schemas.TblPlayer },
      { name: 'TblTournament', model: Schemas.TblTournament },
      { name: 'TblTournamentPoster', model: Schemas.TblTournamentPoster },
      { name: 'TblTeamRegistration', model: Schemas.TblTeamRegistration },
      { name: 'TblMatch', model: Schemas.TblMatch },
      { name: 'TblLiveScore', model: Schemas.TblLiveScore },
      { name: 'TblFixture', model: Schemas.TblFixture },
      { name: 'TblPayment', model: Schemas.TblPayment },
      { name: 'TblNotification', model: Schemas.TblNotification },
      { name: 'TblSport', model: Schemas.TblSport },
      { name: 'TblUserFavoriteSport', model: Schemas.TblUserFavoriteSport },
      { name: 'TblAiRecommendation', model: Schemas.TblAiRecommendation },
      { name: 'TblPosterTemplate', model: Schemas.TblPosterTemplate },
      { name: 'TblTournamentResult', model: Schemas.TblTournamentResult },
      { name: 'TblActivityLog', model: Schemas.TblActivityLog }
    ];

    console.log(`\n📦 Initializing and creating all ${modelsList.length} MongoDB collections/tables...`);
    const createdSummary = [];

    for (const item of modelsList) {
      try {
        await item.model.createCollection();
        const collectionName = item.model.collection.name;
        const count = await item.model.countDocuments();
        createdSummary.push({
          Model: item.name,
          Collection: collectionName,
          Documents: count,
          Status: 'Active / Created'
        });
      } catch (err) {
        const collectionName = item.model.collection.name;
        const count = await item.model.countDocuments().catch(() => 0);
        createdSummary.push({
          Model: item.name,
          Collection: collectionName,
          Documents: count,
          Status: 'Active'
        });
      }
    }

    // Seed Data Setup
    console.log('\n🌱 Seeding initial database records...');

    // 1. Seed Sports in TblSport
    const sportsCount = await Schemas.TblSport.countDocuments();
    if (sportsCount === 0) {
      await Schemas.TblSport.insertMany([
        { sport_id: 1, sport_name: 'Football', icon: '⚽' },
        { sport_id: 2, sport_name: 'Cricket', icon: '🏏' },
        { sport_id: 3, sport_name: 'Basketball', icon: '🏀' },
        { sport_id: 4, sport_name: 'Tennis', icon: '🎾' },
        { sport_id: 5, sport_name: 'Badminton', icon: '🏸' }
      ]);
      console.log('   ✔ Seeded 5 Sports into "tbl_sports"');
    }

    // 2. Refresh/Seed Default Credentials in User model
    const requiredUsers = [
      {
        name: 'Platform SuperAdmin',
        email: 'admin@arenax.io',
        password: 'Password123!',
        role: 'admin',
        location: 'London, UK',
        favoriteSports: ['Football', 'Cricket', 'Basketball']
      },
      {
        name: 'Sports League Host',
        email: 'organizer@arenax.io',
        password: 'Password123!',
        role: 'organizer',
        location: 'London, UK',
        organization: 'London Elite Sports Org'
      },
      {
        name: 'London Elite Sports Org (Alias)',
        email: 'organizer@proleague.com',
        password: 'Password123!',
        role: 'organizer',
        location: 'London, UK',
        organization: 'London Elite Sports Org'
      },
      {
        name: 'Rahul (Player ID #100001)',
        email: 'user@arenax.io',
        password: 'Password123!',
        role: 'user',
        location: 'London, UK',
        favoriteSports: ['Chess', 'Football', 'Cricket']
      },
      {
        name: 'JOHN',
        email: 'john@gmail.com',
        password: 'Password123!',
        role: 'user',
        location: 'London, UK',
        favoriteSports: ['Football', 'Cricket']
      },
      {
        name: 'deric',
        email: 'deric@gmail.com',
        password: 'Password123!',
        role: 'user',
        location: 'London, UK',
        favoriteSports: ['Football', 'Cricket']
      },
      {
        name: 'Ben',
        email: 'player1@arenax.io',
        password: 'Password123!',
        role: 'user',
        location: 'London, UK',
        favoriteSports: ['Football', 'Cricket']
      },
      {
        name: 'Alex Mercer (Alias)',
        email: 'alex.player@arenax.io',
        password: 'Password123!',
        role: 'user',
        location: 'London, UK',
        favoriteSports: ['Football', 'Cricket'],
        teamName: 'East End Eagles FC'
      }
    ];

    for (const uData of requiredUsers) {
      const existing = await User.findOne({ email: uData.email });
      if (!existing) {
        await User.create({ ...uData, approvalStatus: 'Approved' });
      } else {
        // Update password & role to guarantee valid credentials
        existing.password = uData.password; // Triggers bcrypt pre-save hash
        existing.role = uData.role;
        existing.name = uData.name;
        existing.approvalStatus = 'Approved';
        await existing.save();
      }
    }
    console.log(`   ✔ Guaranteed standard credentials for Admin, Organizer, and LocalUser in MongoDB`);

    // 3. Tournaments start empty so Organizer can create new tournaments cleanly

    // 4. Seed Poster Templates in TblPosterTemplate
    const posterTemplatesCount = await Schemas.TblPosterTemplate.countDocuments();
    if (posterTemplatesCount === 0) {
      await Schemas.TblPosterTemplate.insertMany([
        { template_id: 1, template_name: 'Cyberpunk Neon Clash', preview_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', category: 'Neon / Gaming' },
        { template_id: 2, template_name: 'Minimalist Champion White', preview_image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80', category: 'Clean / Modern' },
        { template_id: 3, template_name: 'Gold League Royale', preview_image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80', category: 'Premium / Gold' }
      ]);
      console.log('   ✔ Seeded 3 Poster Templates into "tbl_poster_templates"');
    }

    console.log('\n📊 Final MongoDB Database Summary Table:');
    console.table(createdSummary);

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize MongoDB collections:', error.message);
    throw error;
  }
};

// If executed directly from command line
if (process.argv[1] && process.argv[1].includes('initDb.js')) {
  initializeCollectionsAndSeed()
    .then(() => {
      console.log('\n🎉 MongoDB Initialization Completed Successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Initialization Error:', err);
      process.exit(1);
    });
}
