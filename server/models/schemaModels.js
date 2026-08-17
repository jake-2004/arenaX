import mongoose from 'mongoose';

// 1. Tbl_users
export const TblUserSchema = new mongoose.Schema({
  user_id: { type: Number },
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Organizer', 'LocalUser'], default: 'LocalUser' },
  phone: { type: String },
  profile_image: { type: String },
  district: { type: String },
  address: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
}, { collection: 'tbl_users', timestamps: true });

// 2. Tbl_organizers
export const TblOrganizerSchema = new mongoose.Schema({
  organizer_id: { type: Number },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblUser', required: true },
  organization_name: { type: String, required: true },
  description: { type: String },
  verification_document: { type: String },
  approval_status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { collection: 'tbl_organizers', timestamps: true });

// 3. Tbl_teams
export const TblTeamSchema = new mongoose.Schema({
  team_id: { type: Number },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblUser', required: true },
  team_name: { type: String, required: true },
  logo: { type: String },
  sport: { type: String, required: true },
  district: { type: String },
  captain_name: { type: String, required: true },
  captain_phone: { type: String },
  team_description: { type: String },
  team_proof_doc: { type: String }, // Path to uploaded proof
  team_proof_type: { type: String }, // e.g., 'Address Proof', 'Registration Doc'
  players: [{
    player_name: { type: String },
    jersey_number: { type: String },
    position: { type: String },
    id_proof_type: { type: String },
    id_proof_number: { type: String },
    id_proof_doc: { type: String }
  }],
  verification_status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
}, { collection: 'tbl_teams', timestamps: true });

// 4. Tbl_players
export const TblPlayerSchema = new mongoose.Schema({
  player_id: { type: Number },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTeam', required: true },
  player_name: { type: String, required: true },
  date_of_birth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String },
  address: { type: String },
  jersey_number: { type: String },
  position: { type: String },
  photo: { type: String },
  phone: { type: String },
  id_proof_doc: { type: String },
  id_proof_type: { type: String },
  id_proof_number: { type: String },
  verification_status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Correction Required'], default: 'Pending' }
}, { collection: 'tbl_players', timestamps: true });

// 5. Tbl_tournaments
export const TblTournamentSchema = new mongoose.Schema({
  tournament_id: { type: Number },
  organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblOrganizer', required: true },
  tournament_name: { type: String, required: true },
  sport: { type: String, required: true },
  format: { type: String, default: 'Knockout 5v5' },
  location: { type: String, required: true },
  district: { type: String },
  start_date: { type: Date, required: true, default: Date.now },
  end_date: { type: Date, default: Date.now },
  registration_deadline: { type: Date },
  entry_fee: { type: Number, default: 0.0 },
  prize_amount: { type: Number, default: 0.0 },
  max_teams: { type: Number, default: 16 },
  poster_url: { type: String },
  rules: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' }
}, { collection: 'tbl_tournaments', timestamps: true });

// 6. Tbl_tournament_posters
export const TblTournamentPosterSchema = new mongoose.Schema({
  poster_id: { type: Number },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTournament' },
  organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblOrganizer' },
  poster_image: { type: String },
  poster_url: { type: String },
  ai_generated: { type: Boolean, default: true },
  approval_status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { collection: 'tbl_tournament_posters', timestamps: true });

// 7. Tbl_team_registrations
export const TblTeamRegistrationSchema = new mongoose.Schema({
  registration_id: { type: Number },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTournament', required: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTeam', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblUser', required: true }, // Added for tracking who registered
  registration_date: { type: Date, default: Date.now },
  payment_status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  registration_status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' }
}, { collection: 'tbl_team_registrations', timestamps: true });

// 8. Tbl_matches
export const TblMatchSchema = new mongoose.Schema({
  match_id: { type: Number },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTournament', required: true },
  team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTeam', required: true },
  team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTeam', required: true },
  match_date: { type: Date, required: true },
  venue: { type: String, required: true },
  round: { type: String, required: true },
  status: { type: String, enum: ['Upcoming', 'Live', 'Completed'], default: 'Upcoming' }
}, { collection: 'tbl_matches', timestamps: true });

// 9. Tbl_live_scores
export const TblLiveScoreSchema = new mongoose.Schema({
  score_id: { type: Number },
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblMatch', required: true },
  team1_score: { type: Number, default: 0 },
  team2_score: { type: Number, default: 0 },
  winner_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTeam' },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'tbl_live_scores', timestamps: true });

// 10. Tbl_fixtures
export const TblFixtureSchema = new mongoose.Schema({
  fixture_id: { type: Number },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTournament', required: true },
  round_name: { type: String, required: true },
  fixture_order: { type: Number, default: 1 }
}, { collection: 'tbl_fixtures', timestamps: true });

// 11. Tbl_payments
export const TblPaymentSchema = new mongoose.Schema({
  payment_id: { type: Number },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblUser', required: true },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTournament' },
  payment_type: { type: String, enum: ['Hosting', 'Poster', 'Registration'], required: true },
  amount: { type: Number, required: true },
  payment_status: { type: String, enum: ['Pending', 'Success', 'Failed'], default: 'Pending' }
}, { collection: 'tbl_payments', timestamps: true });

// 12. Tbl_notifications
export const TblNotificationSchema = new mongoose.Schema({
  notification_id: { type: Number },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblUser', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
}, { collection: 'tbl_notifications', timestamps: true });

// 13. Tbl_sports
export const TblSportSchema = new mongoose.Schema({
  sport_id: { type: Number },
  sport_name: { type: String, required: true, unique: true },
  icon: { type: String, required: true }
}, { collection: 'tbl_sports', timestamps: true });

// 14. Tbl_user_favorite_sports
export const TblUserFavoriteSportSchema = new mongoose.Schema({
  favorite_id: { type: Number },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblUser', required: true },
  sport_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblSport', required: true }
}, { collection: 'tbl_user_favorite_sports', timestamps: true });

// 15. Tbl_ai_recommendations
export const TblAiRecommendationSchema = new mongoose.Schema({
  recommendation_id: { type: Number },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblUser', required: true },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTournament', required: true },
  recommendation_score: { type: Number, default: 0.0 },
  generated_at: { type: Date, default: Date.now }
}, { collection: 'tbl_ai_recommendations', timestamps: true });

// 16. Tbl_poster_templates
export const TblPosterTemplateSchema = new mongoose.Schema({
  template_id: { type: Number },
  template_name: { type: String, required: true },
  preview_image: { type: String, required: true },
  category: { type: String, required: true }
}, { collection: 'tbl_poster_templates', timestamps: true });

// 17. Tbl_tournament_results
export const TblTournamentResultSchema = new mongoose.Schema({
  result_id: { type: Number },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTournament', required: true },
  champion_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTeam' },
  runnerup_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTeam' },
  third_place_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblTeam' },
  result_date: { type: Date, required: true }
}, { collection: 'tbl_tournament_results', timestamps: true });

// 18. Tbl_activity_logs
export const TblActivityLogSchema = new mongoose.Schema({
  log_id: { type: Number },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TblUser', required: true },
  action: { type: String, required: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now }
}, { collection: 'tbl_activity_logs', timestamps: true });

// Export Mongoose Models
export const TblUser = mongoose.models.TblUser || mongoose.model('TblUser', TblUserSchema);
export const TblOrganizer = mongoose.models.TblOrganizer || mongoose.model('TblOrganizer', TblOrganizerSchema);
export const TblTeam = mongoose.models.TblTeam || mongoose.model('TblTeam', TblTeamSchema);
export const TblPlayer = mongoose.models.TblPlayer || mongoose.model('TblPlayer', TblPlayerSchema);
export const TblTournament = mongoose.models.TblTournament || mongoose.model('TblTournament', TblTournamentSchema);
export const TblTournamentPoster = mongoose.models.TblTournamentPoster || mongoose.model('TblTournamentPoster', TblTournamentPosterSchema);
export const TblTeamRegistration = mongoose.models.TblTeamRegistration || mongoose.model('TblTeamRegistration', TblTeamRegistrationSchema);
export const TblMatch = mongoose.models.TblMatch || mongoose.model('TblMatch', TblMatchSchema);
export const TblLiveScore = mongoose.models.TblLiveScore || mongoose.model('TblLiveScore', TblLiveScoreSchema);
export const TblFixture = mongoose.models.TblFixture || mongoose.model('TblFixture', TblFixtureSchema);
export const TblPayment = mongoose.models.TblPayment || mongoose.model('TblPayment', TblPaymentSchema);
export const TblNotification = mongoose.models.TblNotification || mongoose.model('TblNotification', TblNotificationSchema);
export const TblSport = mongoose.models.TblSport || mongoose.model('TblSport', TblSportSchema);
export const TblUserFavoriteSport = mongoose.models.TblUserFavoriteSport || mongoose.model('TblUserFavoriteSport', TblUserFavoriteSportSchema);
export const TblAiRecommendation = mongoose.models.TblAiRecommendation || mongoose.model('TblAiRecommendation', TblAiRecommendationSchema);
export const TblPosterTemplate = mongoose.models.TblPosterTemplate || mongoose.model('TblPosterTemplate', TblPosterTemplateSchema);
export const TblTournamentResult = mongoose.models.TblTournamentResult || mongoose.model('TblTournamentResult', TblTournamentResultSchema);
export const TblActivityLog = mongoose.models.TblActivityLog || mongoose.model('TblActivityLog', TblActivityLogSchema);
