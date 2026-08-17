import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  sport: {
    type: String,
    required: true
  },
  format: {
    type: String,
    default: 'Knockout Tournament'
  },
  location: {
    type: String,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  entryFee: {
    type: Number,
    default: 50
  },
  prizePool: {
    type: String,
    default: '$1,000'
  },
  maxTeams: {
    type: Number,
    default: 16
  },
  registeredTeamsCount: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['registration_open', 'live_now', 'completed'],
    default: 'registration_open'
  },
  posterUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
  },
  aiMatchScore: {
    type: Number,
    default: 90
  },
  recommendationReason: {
    type: String,
    default: 'Matches location & sports preferences'
  },
  organizer: {
    type: String,
    default: 'ArenaX Sports Org'
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const Tournament = mongoose.model('Tournament', tournamentSchema);
