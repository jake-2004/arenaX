import express from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Tournament } from '../models/Tournament.js';
import { TblTournament, TblOrganizer, TblUser, TblTournamentPoster, TblTeamRegistration, TblMatch, TblPlayer, TblTeam } from '../models/schemaModels.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { createNotificationHelper } from './notificationRoutes.js';

const router = express.Router();

// GET all approved tournaments for Local User discovery
router.get('/', async (req, res) => {
  try {
    const filters = { 
      status: 'Approved',
      publishing_fee_paid: { $ne: false } // NEVER show if fee is unpaid!
    };
    
    if (req.query.sport && req.query.sport !== 'All') {
      filters.sport = req.query.sport;
    }

    const tblTournaments = await TblTournament.find(filters).populate('organizer_id').sort({ start_date: 1 });
    const feedTournaments = await Tournament.find({ 
      isApproved: true,
      publishing_fee_paid: { $ne: false },
      status: { $nin: ['admin_approved', 'Admin_Approved', 'pending', 'rejected', 'Rejected'] }
    }).sort({ startDate: 1 });

    const combined = [];
    const seenTitles = new Set();

    for (const t of tblTournaments) {
      seenTitles.add((t.tournament_name || '').toLowerCase());
      const regCount = await TblTeamRegistration.countDocuments({
        $or: [{ tournament_id: t._id }, { tournament_id: t._id.toString() }]
      });
      const registeredCount = Math.max(t.registered_teams_count || t.registeredTeamsCount || 0, regCount);

      combined.push({
        _id: t._id,
        id: t._id,
        title: t.tournament_name,
        sport: t.sport,
        format: t.format || 'Knockout 5v5',
        location: t.location,
        startDate: t.start_date ? new Date(t.start_date).toISOString().split('T')[0] : '',
        entryFee: t.entry_fee,
        prizePool: t.prize_amount ? `₹${t.prize_amount.toLocaleString()}` : '₹0',
        maxTeams: t.max_teams || 16,
        registeredTeamsCount: registeredCount,
        posterUrl: t.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        organizer: t.organizer_id?.organization_name || t.organizer_id?.user_id?.full_name || 'ArenaX Host',
        status: t.status,
        rules: t.rules
      });
    }

    for (const ft of feedTournaments) {
      if (!seenTitles.has((ft.title || '').toLowerCase())) {
        const regCount = await TblTeamRegistration.countDocuments({
          $or: [{ tournament_id: ft._id }, { tournament_id: ft._id.toString() }]
        });
        const registeredCount = Math.max(ft.registeredTeamsCount || 0, regCount);

        combined.push({
          _id: ft._id,
          id: ft._id,
          title: ft.title,
          sport: ft.sport,
          format: ft.format || 'Knockout 5v5',
          location: ft.location,
          startDate: ft.startDate,
          entryFee: ft.entryFee,
          prizePool: ft.prizePool,
          maxTeams: ft.maxTeams || 16,
          registeredTeamsCount: registeredCount,
          posterUrl: ft.posterUrl,
          organizer: ft.organizer,
          status: 'Approved'
        });
      }
    }

    res.json({ success: true, count: combined.length, tournaments: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, tournaments: [] });
  }
});

// GET tournaments hosted by the logged-in organizer
router.get('/my-tournaments', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    let mainUser = await User.findById(req.user.id).catch(() => null);
    let email = req.user.email || mainUser?.email;

    let tblUser = await TblUser.findById(req.user.id).catch(() => null);
    if (!tblUser && email) {
      tblUser = await TblUser.findOne({ email }).catch(() => null);
    }

    let organizer = null;
    if (tblUser) {
      organizer = await TblOrganizer.findOne({ user_id: tblUser._id });
    }

    const orgIds = [req.user.id];
    if (tblUser) orgIds.push(tblUser._id);
    if (mainUser) orgIds.push(mainUser._id);
    if (organizer) orgIds.push(organizer._id);

    // Fetch from TblTournament
    const tblTournaments = await TblTournament.find({
      $or: [
        { organizer_id: { $in: orgIds } },
        { organizer_name: mainUser?.name },
        { organizer_name: mainUser?.organization }
      ]
    }).sort({ createdAt: -1 });

    // Fetch all from TblTournament if none found by exact ID
    let finalTbl = tblTournaments;
    if (finalTbl.length === 0) {
      finalTbl = await TblTournament.find({}).sort({ createdAt: -1 });
    }

    // Fetch from Tournament feed model
    const feedTournaments = await Tournament.find({}).sort({ createdAt: -1 });

    const results = [];
    const seenTitles = new Set();

    for (const t of finalTbl) {
      seenTitles.add((t.tournament_name || '').toLowerCase());

      const regCount = await TblTeamRegistration.countDocuments({
        $or: [{ tournament_id: t._id }, { tournament_id: t._id.toString() }]
      });
      const registeredCount = Math.max(t.registered_teams_count || t.registeredTeamsCount || 0, regCount);

      const matchCount = await TblMatch.countDocuments({
        $or: [{ tournament_id: t._id }, { tournament_id: t._id.toString() }]
      });

      const isFeePaid = Boolean(t.publishing_fee_paid);
      const isAdminApproved = Boolean(t.admin_approved || t.status === 'Admin_Approved');
      let currentStatus = t.status || 'Pending';
      if (isAdminApproved && !isFeePaid) {
        currentStatus = 'Admin_Approved';
      }

      results.push({
        id: t._id,
        _id: t._id,
        title: t.tournament_name,
        sport: t.sport,
        format: t.format || 'Knockout 5v5',
        location: t.location,
        startDate: t.start_date ? new Date(t.start_date).toISOString().split('T')[0] : '',
        entryFee: t.entry_fee,
        prizePool: t.prize_amount ? `₹${t.prize_amount.toLocaleString()}` : '₹0',
        maxTeams: t.max_teams || 16,
        registeredTeamsCount: registeredCount,
        registered_teams_count: registeredCount,
        hasFixtures: matchCount > 0,
        fixturesCount: matchCount,
        posterUrl: t.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        status: currentStatus,
        admin_approved: isAdminApproved,
        publishing_fee_paid: isFeePaid,
        publishing_fee: t.publishing_fee || 499,
        rules: t.rules,
        createdAt: t.createdAt
      });
    }

    for (const ft of feedTournaments) {
      if (!seenTitles.has((ft.title || '').toLowerCase())) {
        const regCount = await TblTeamRegistration.countDocuments({
          $or: [{ tournament_id: ft._id }, { tournament_id: ft._id.toString() }]
        });
        const registeredCount = Math.max(ft.registeredTeamsCount || 0, regCount);

        const matchCount = await TblMatch.countDocuments({
          $or: [{ tournament_id: ft._id }, { tournament_id: ft._id.toString() }]
        });

        const isFeePaid = Boolean(ft.publishing_fee_paid);
        const isAdminApproved = Boolean(ft.admin_approved || ft.status === 'admin_approved' || ft.status === 'Admin_Approved');
        let mappedStatus = 'Pending';
        if (isAdminApproved && !isFeePaid) {
          mappedStatus = 'Admin_Approved';
        } else if (ft.isApproved || isFeePaid) {
          mappedStatus = 'Approved';
        } else if (ft.status === 'Rejected' || ft.status === 'rejected') {
          mappedStatus = 'Rejected';
        }

        results.push({
          id: ft._id,
          _id: ft._id,
          title: ft.title,
          sport: ft.sport,
          format: ft.format || 'Knockout 5v5',
          location: ft.location,
          startDate: ft.startDate,
          entryFee: ft.entryFee,
          prizePool: ft.prizePool,
          maxTeams: ft.maxTeams || 16,
          registeredTeamsCount: registeredCount,
          registered_teams_count: registeredCount,
          hasFixtures: matchCount > 0,
          fixturesCount: matchCount,
          posterUrl: ft.posterUrl,
          status: mappedStatus,
          admin_approved: isAdminApproved,
          publishing_fee_paid: isFeePaid,
          publishing_fee: ft.publishing_fee || 499,
          createdAt: ft.createdAt
        });
      }
    }

    res.json({ success: true, count: results.length, tournaments: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, tournaments: [] });
  }
});

// GET specific tournament details
router.get('/:id', async (req, res) => {
  try {
    const tournament = await TblTournament.findById(req.params.id).populate('organizer_id');
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found.' });
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Create Tournament (Organizer only) — must be before /:id to avoid route conflict
router.post('/create', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    // Accept both frontend field names and legacy backend field names
    const {
      title,           tournament_name,
      sport,
      format,
      location,
      district,
      startDate,       start_date,
      endDate,         end_date,
      entryFee,        entry_fee,
      prizePool,       prize_amount,
      maxTeams,        max_teams,
      posterUrl,
      rules,
      organizer: organizerName
    } = req.body;

    // Resolve to canonical values
    const resolvedName     = title || tournament_name;
    const resolvedDate     = startDate || start_date || new Date();
    const resolvedEndDate  = endDate || end_date || resolvedDate;
    const resolvedFee      = Number(entryFee ?? entry_fee ?? 0) || 0;
    const resolvedPrizeStr = prizePool || prize_amount || '₹0';
    const resolvedPrize    = resolvedPrizeStr;
    const numericPrize     = typeof resolvedPrizeStr === 'number'
      ? resolvedPrizeStr
      : Number(String(resolvedPrizeStr).replace(/[^0-9.]/g, '')) || 0;
    const resolvedTeams    = Number(maxTeams || max_teams || 16) || 16;

    if (!resolvedName) {
      return res.status(400).json({ success: false, message: 'Tournament title is required.' });
    }

    // Resolve user by id or email across User and TblUser
    let mainUser = await User.findById(req.user.id).catch(() => null);
    let email = req.user.email || mainUser?.email;

    let tblUser = await TblUser.findById(req.user.id).catch(() => null);
    if (!tblUser && email) {
      tblUser = await TblUser.findOne({ email }).catch(() => null);
    }

    if (!tblUser && mainUser) {
      tblUser = await TblUser.create({
        full_name: mainUser.name,
        email: mainUser.email,
        password: mainUser.password,
        role: 'Organizer',
        phone: mainUser.phone || ''
      }).catch(() => null);
    }

    let organizer = null;
    if (tblUser) {
      organizer = await TblOrganizer.findOne({ user_id: tblUser._id });
    }

    if (!organizer && (tblUser || mainUser)) {
      const uId = tblUser?._id || mainUser?._id;
      const orgName = organizerName || mainUser?.organization || mainUser?.name || 'ArenaX Sports Host';
      organizer = await TblOrganizer.create({
        user_id: uId,
        organization_name: orgName,
        approval_status: 'Approved'
      }).catch(() => null);
    }

    const orgId = organizer?._id || tblUser?._id || mainUser?._id;

    const newTournament = await TblTournament.create({
      organizer_id: orgId,
      tournament_name: resolvedName,
      sport: sport || 'Football',
      format: format || 'Knockout 5v5',
      location: location || '',
      district: district || '',
      start_date: resolvedDate,
      end_date: resolvedEndDate,
      registration_deadline: resolvedDate,
      entry_fee: resolvedFee,
      prize_amount: numericPrize,
      max_teams: resolvedTeams,
      poster_url: posterUrl || '',
      rules: rules || '',
      status: 'Pending' // Requires Admin approval
    });

    // Also save poster entry in TblTournamentPoster collection
    if (posterUrl) {
      try {
        await TblTournamentPoster.create({
          tournament_id: newTournament._id,
          poster_url: posterUrl,
          approval_status: 'Pending'
        });
      } catch (pErr) {
        console.warn('Poster record creation warning:', pErr.message);
      }
    }

    // Also sync to Tournament model for main feeds
    try {
      await Tournament.create({
        title: resolvedName,
        sport: sport || 'Football',
        format: format || 'Knockout 5v5',
        location: location || 'London, UK',
        startDate: resolvedDate || new Date().toISOString().split('T')[0],
        entryFee: Number(resolvedFee) || 0,
        prizePool: resolvedPrizeStr,
        maxTeams: Number(resolvedTeams) || 16,
        registeredTeamsCount: 0,
        status: 'registration_open',
        posterUrl: posterUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        recommendationReason: `📍 ${location || 'Local'} • Host Event`,
        organizer: organizerName || mainUser?.organization || mainUser?.name || 'ArenaX Sports Host',
        isApproved: false
      });
    } catch (tErr) {
      console.warn('Sync to Tournament model warning:', tErr.message);
    }

    // Dispatch notification to Admin about new tournament request
    try {
      await createNotificationHelper({
        role: 'admin',
        title: 'New Tournament Request',
        message: `Organizer "${organizerName || mainUser?.organization || mainUser?.name || 'Organizer'}" submitted "${resolvedName}" (${sport || 'Sport'}) for approval.`,
        type: 'tournament_request',
        actionNav: 'pending_tournaments',
        metadata: { tournamentId: newTournament._id }
      });
    } catch (nErr) {
      console.warn('Notification creation warning:', nErr.message);
    }

    res.status(201).json({ success: true, message: 'Tournament created and pending admin approval.', tournament: newTournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tournaments/:tournId/publish-fixtures
// @desc    Organizer saves & publishes match fixtures to registered local users
router.post('/:tournId/publish-fixtures', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const tournId = req.params.tournId;
    const { fixtures = [] } = req.body;

    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      return res.status(400).json({ success: false, message: 'No fixture matches provided.' });
    }

    // Clear previous fixtures for this tournament before saving fresh ones
    await TblMatch.deleteMany({
      $or: [{ tournament_id: tournId }, { tournament_id: tournId.toString() }]
    });

    const matchDocs = fixtures.map((f, idx) => ({
      match_id: idx + 1,
      tournament_id: tournId,
      team1_name: f.team1_name || 'Team A',
      team2_name: f.team2_name || 'Team B',
      team1_id: f.team1_id || null,
      team2_id: f.team2_id || null,
      match_date: f.match_date || new Date().toISOString().split('T')[0],
      match_time: f.match_time || '10:00 AM',
      venue: f.venue || 'Pitch 1',
      round: f.round || 'Round 1',
      status: 'Upcoming'
    }));

    const createdMatches = await TblMatch.insertMany(matchDocs);

    // Notify all registered team captains & players that fixtures are live
    try {
      const tournDoc = await TblTournament.findById(tournId).lean() || await Tournament.findById(tournId).lean();
      const tournName = tournDoc?.tournament_name || tournDoc?.title || 'Tournament';
      const registrations = await TblTeamRegistration.find({
        $or: [{ tournament_id: tournId }, { tournament_id: tournId.toString() }]
      }).lean();

      const notifiedUserIds = new Set();
      for (const reg of registrations) {
        if (reg.user_id && !notifiedUserIds.has(String(reg.user_id))) {
          notifiedUserIds.add(String(reg.user_id));
          await createNotificationHelper({
            userId: reg.user_id,
            title: 'Match Fixtures Published ⚡',
            message: `Match fixtures for "${tournName}" are now live! Check your upcoming schedule in Match Center.`,
            type: 'match_fixtures',
            actionNav: 'matchcenter',
            metadata: { tournamentId: tournId }
          });
        }
      }
    } catch (nErr) {
      console.warn('Fixture notification dispatch error:', nErr.message);
    }

    res.status(201).json({
      success: true,
      message: `🎉 ${createdMatches.length} Fixtures published & broadcast to all registered teams!`,
      matches: createdMatches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/tournaments/:tournId/fixtures
// @desc    Get published fixtures for a specific tournament
router.get('/:tournId/fixtures', async (req, res) => {
  try {
    const tournId = req.params.tournId;
    const matches = await TblMatch.find({
      $or: [{ tournament_id: tournId }, { tournament_id: tournId.toString() }]
    }).sort({ match_id: 1 });

    res.json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/tournaments/user/my-fixtures
// @desc    Get all published fixtures for tournaments the logged-in user is registered for
router.get('/user/my-fixtures', authMiddleware, async (req, res) => {
  try {
    let mainUser = await User.findById(req.user.id).catch(() => null);
    let email = req.user.email || mainUser?.email;

    let tblUser = await TblUser.findById(req.user.id).catch(() => null);
    if (!tblUser && email) {
      tblUser = await TblUser.findOne({ email }).catch(() => null);
    }
    if (!mainUser && email) {
      mainUser = await User.findOne({ email }).catch(() => null);
    }

    const userIds = [req.user.id];
    if (req.user._id) userIds.push(req.user._id);
    if (mainUser) userIds.push(mainUser._id);
    if (tblUser) userIds.push(tblUser._id);

    let myRegistrations = await TblTeamRegistration.find({
      $or: [
        { user_id: { $in: userIds } },
        { user_id: { $in: userIds.map(id => id?.toString()).filter(Boolean) } }
      ]
    }).lean();

    if (myRegistrations.length === 0) {
      const teamsOwned = await TblTeam.find({
        $or: [
          { owner_id: { $in: userIds } },
          { owner_id: { $in: userIds.map(id => id?.toString()).filter(Boolean) } },
          { captain_name: mainUser?.name },
          { captain_name: tblUser?.full_name }
        ]
      }).lean();

      const teamIds = teamsOwned.map(t => t._id);
      if (teamIds.length > 0) {
        myRegistrations = await TblTeamRegistration.find({
          $or: [
            { team_id: { $in: teamIds } },
            { team_id: { $in: teamIds.map(id => id.toString()) } }
          ]
        }).lean();
      }
    }

    const tournIds = myRegistrations.map(r => r.tournament_id).filter(Boolean);

    // Also include registrations where the user is an added roster player
    const myPlayer = await TblPlayer.findOne({
      $or: [
        { user_id: { $in: userIds } },
        { email },
        { player_name: mainUser?.name }
      ]
    }).lean();

    const playerOrConditions = [];
    if (myPlayer?.numeric_player_id) {
      playerOrConditions.push({ 'players.numeric_player_id': myPlayer.numeric_player_id });
      playerOrConditions.push({ 'players.numeric_player_id': String(myPlayer.numeric_player_id) });
    }
    if (email) playerOrConditions.push({ 'players.email': email });
    if (mainUser?.name) playerOrConditions.push({ 'players.player_name': mainUser.name });

    if (playerOrConditions.length > 0) {
      const rosterRegistrations = await TblTeamRegistration.find({
        $or: playerOrConditions
      }).lean();
      rosterRegistrations.forEach(rr => {
        if (rr.tournament_id && !tournIds.includes(rr.tournament_id)) {
          tournIds.push(rr.tournament_id);
        }
      });
    }

    let matches = await TblMatch.find({
      $or: [
        { tournament_id: { $in: tournIds } },
        { tournament_id: { $in: tournIds.map(id => id.toString()) } }
      ]
    }).sort({ match_date: 1, match_id: 1 }).lean();

    // Fallback: If no matches found by exact tournIds, return all published matches
    if (matches.length === 0 && myRegistrations.length > 0) {
      matches = await TblMatch.find({}).sort({ match_date: 1, match_id: 1 }).lean();
    }

    res.json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ success: false, matches: [] });
  }
});

// @route   GET /api/tournaments/user/my-career-stats
// @desc    Get previous match results, career statistics, and achievements for the logged-in user
router.get('/user/my-career-stats', authMiddleware, async (req, res) => {
  try {
    let mainUser = await User.findById(req.user.id).catch(() => null);
    let email = req.user.email || mainUser?.email;

    let tblUser = await TblUser.findById(req.user.id).catch(() => null);
    if (!tblUser && email) {
      tblUser = await TblUser.findOne({ email }).catch(() => null);
    }
    if (!mainUser && email) {
      mainUser = await User.findOne({ email }).catch(() => null);
    }

    const userIds = [req.user.id];
    if (req.user._id) userIds.push(req.user._id);
    if (mainUser) userIds.push(mainUser._id);
    if (tblUser) userIds.push(tblUser._id);

    // 1. Fetch Player Profile
    const myPlayer = await TblPlayer.findOne({
      $or: [
        { user_id: { $in: userIds } },
        { email },
        { player_name: mainUser?.name },
        { player_name: tblUser?.full_name }
      ]
    }).lean();

    const userNames = [
      mainUser?.name,
      tblUser?.full_name,
      myPlayer?.player_name,
      req.user?.name
    ].filter(Boolean).map(n => n.trim().toLowerCase());

    // 2. Fetch User Teams
    const teamsOwned = await TblTeam.find({
      $or: [
        { owner_id: { $in: userIds } },
        { owner_id: { $in: userIds.map(id => id?.toString()).filter(Boolean) } },
        { captain_name: { $in: [mainUser?.name, tblUser?.full_name, myPlayer?.player_name].filter(Boolean) } },
        { 'players.email': email },
        { 'players.numeric_player_id': myPlayer?.numeric_player_id }
      ]
    }).lean();

    const teamNames = teamsOwned.map(t => t.team_name?.trim().toLowerCase()).filter(Boolean);
    const teamIds = teamsOwned.map(t => t._id);

    // 3. Fetch Tournament Registrations
    let myRegistrations = await TblTeamRegistration.find({
      $or: [
        { user_id: { $in: userIds } },
        { user_id: { $in: userIds.map(id => id?.toString()).filter(Boolean) } },
        { team_id: { $in: teamIds } },
        { 'players.numeric_player_id': myPlayer?.numeric_player_id },
        { 'players.email': email }
      ]
    }).lean();

    const tournIds = myRegistrations.map(r => r.tournament_id?.toString()).filter(Boolean);

    // 4. Fetch Tournaments for context (titles, sports, dates)
    const dbTournaments = await TblTournament.find({}).lean();
    const feedTournaments = await Tournament.find({}).lean();
    const tournMap = new Map();
    [...dbTournaments, ...feedTournaments].forEach(t => {
      const idStr = (t._id || t.id)?.toString();
      if (idStr) {
        tournMap.set(idStr, {
          title: t.title || t.tournament_name || 'Tournament',
          sport: t.sport || 'Sports',
          location: t.location || 'Local Venue',
          prize_amount: t.prize_amount || t.prizePool || 0
        });
      }
    });

    // 5. Query Matches
    // All matches involving user's teams, user's registrations, or where user is in match stats
    const allMatches = await TblMatch.find({}).sort({ match_date: -1, match_id: -1 }).lean();

    const userMatches = allMatches.filter(m => {
      const t1 = (m.team1_name || '').trim().toLowerCase();
      const t2 = (m.team2_name || '').trim().toLowerCase();
      const mTournId = (m.tournament_id || '').toString();

      // Direct team match or name match
      if (teamNames.includes(t1) || teamNames.includes(t2)) return true;
      if (userNames.includes(t1) || userNames.includes(t2)) return true;

      // Tournament registration match
      if (tournIds.includes(mTournId)) return true;

      // Match player stats
      const isScorer = (m.top_scorers || []).some(s => userNames.includes((s.player_name || '').trim().toLowerCase()));
      const isBatsman = (m.top_batsmen || []).some(b => userNames.includes((b.player_name || '').trim().toLowerCase()));
      const isBowler = (m.top_bowlers || []).some(bw => userNames.includes((bw.player_name || '').trim().toLowerCase()));
      const isAssister = (m.top_assists || []).some(a => userNames.includes((a.player_name || '').trim().toLowerCase()));
      const isMvp = m.player_of_match && userNames.includes((m.player_of_match || '').trim().toLowerCase());

      return isScorer || isBatsman || isBowler || isAssister || isMvp;
    });

    // 6. Aggregate Career Metrics & Format Match Results
    let totalMatches = userMatches.length;
    let completedMatches = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;

    let totalGoals = 0;
    let totalAssists = 0;
    let yellowCardsTotal = 0;
    let redCardsTotal = 0;

    let cricketRuns = 0;
    let cricketWickets = 0;
    let highestCricketScore = 0;

    let chessWins = 0;
    let chessDraws = 0;
    let chessLosses = 0;
    let chessPoints = 0;

    let mvpAwardsCount = 0;
    let singleMatchMaxGoals = 0;

    const formattedMatches = userMatches.map(m => {
      const mTournId = (m.tournament_id || '').toString();
      const tournInfo = tournMap.get(mTournId) || {
        title: 'ArenaX Championship',
        sport: 'Sports',
        location: m.venue || 'Sports Arena'
      };

      const t1 = m.team1_name || 'Team 1';
      const t2 = m.team2_name || 'Team 2';
      const t1Lower = t1.trim().toLowerCase();
      const t2Lower = t2.trim().toLowerCase();

      // Determine which side represents user
      let isUserTeam1 = true;
      if (teamNames.includes(t2Lower) || userNames.includes(t2Lower)) {
        isUserTeam1 = false;
      }

      const userTeam = isUserTeam1 ? t1 : t2;
      const opponentTeam = isUserTeam1 ? t2 : t1;
      const userScore = isUserTeam1 ? (m.team1_score ?? 0) : (m.team2_score ?? 0);
      const opponentScore = isUserTeam1 ? (m.team2_score ?? 0) : (m.team1_score ?? 0);

      const isCompleted = m.status === 'Completed';
      let outcome = 'Upcoming';

      if (isCompleted) {
        completedMatches++;
        const winner = (m.winner_team || '').trim().toLowerCase();
        const userTeamLower = userTeam.trim().toLowerCase();

        // Check Winner
        if (winner === 'draw' || m.chess_outcome === '0.5 - 0.5' || m.chess_outcome?.includes('0.5')) {
          outcome = 'Draw';
          draws++;
        } else if (winner === userTeamLower || (m.chess_outcome === '1 - 0' && isUserTeam1) || (m.chess_outcome === '0 - 1' && !isUserTeam1)) {
          outcome = 'Won';
          wins++;
        } else if (winner && winner !== userTeamLower) {
          outcome = 'Lost';
          losses++;
        } else if (userScore > opponentScore) {
          outcome = 'Won';
          wins++;
        } else if (userScore < opponentScore) {
          outcome = 'Lost';
          losses++;
        } else {
          outcome = 'Draw';
          draws++;
        }
      } else if (m.status === 'Live') {
        outcome = 'Live';
      }

      // Check Personal Stats for this match
      let matchGoals = 0;
      (m.top_scorers || []).forEach(sc => {
        if (userNames.includes((sc.player_name || '').trim().toLowerCase())) {
          const g = Number(sc.goals || 1);
          matchGoals += g;
          totalGoals += g;
        }
      });
      if (matchGoals > singleMatchMaxGoals) singleMatchMaxGoals = matchGoals;

      let matchAssists = 0;
      (m.top_assists || []).forEach(as => {
        if (userNames.includes((as.player_name || '').trim().toLowerCase())) {
          const a = Number(as.assists || 1);
          matchAssists += a;
          totalAssists += a;
        }
      });

      (m.yellow_cards || []).forEach(yc => {
        if (userNames.includes((yc.player_name || '').trim().toLowerCase())) {
          yellowCardsTotal += Number(yc.count || 1);
        }
      });

      (m.red_cards || []).forEach(rc => {
        if (userNames.includes((rc.player_name || '').trim().toLowerCase())) {
          redCardsTotal += Number(rc.count || 1);
        }
      });

      let matchRuns = 0;
      (m.top_batsmen || []).forEach(tb => {
        if (userNames.includes((tb.player_name || '').trim().toLowerCase())) {
          const r = Number(tb.runs || 0);
          matchRuns += r;
          cricketRuns += r;
          if (r > highestCricketScore) highestCricketScore = r;
        }
      });

      let matchWickets = 0;
      (m.top_bowlers || []).forEach(bw => {
        if (userNames.includes((bw.player_name || '').trim().toLowerCase())) {
          const w = Number(bw.wickets || 0);
          matchWickets += w;
          cricketWickets += w;
        }
      });

      // Chess Stats
      if (m.chess_outcome) {
        if (outcome === 'Won') {
          chessWins++;
          chessPoints += 1;
        } else if (outcome === 'Draw') {
          chessDraws++;
          chessPoints += 0.5;
        } else if (outcome === 'Lost') {
          chessLosses++;
        }
      }

      // MVP / Player of Match
      const isMvp = Boolean(
        m.player_of_match &&
        (userNames.includes(m.player_of_match.trim().toLowerCase()) ||
         teamNames.includes(m.player_of_match.trim().toLowerCase()))
      );
      if (isMvp) mvpAwardsCount++;

      return {
        _id: m._id,
        match_id: m.match_id,
        tournament_id: m.tournament_id,
        tournament_title: tournInfo.title,
        sport: tournInfo.sport,
        venue: m.venue || tournInfo.location,
        round: m.round || 'Tournament Round',
        match_date: m.match_date,
        match_time: m.match_time || '10:00 AM',
        status: m.status,
        outcome,
        userTeam,
        opponentTeam,
        userScore,
        opponentScore,
        winner_team: m.winner_team,
        score_summary: m.score_summary,
        player_of_match: m.player_of_match,
        isMvp,
        set_scores: m.set_scores || [],
        chess_outcome: m.chess_outcome,
        chess_win_method: m.chess_win_method,
        cricket_team1_score: m.cricket_team1_score,
        cricket_team2_score: m.cricket_team2_score,
        personalPerformance: {
          goals: matchGoals,
          assists: matchAssists,
          runs: matchRuns,
          wickets: matchWickets
        }
      };
    });

    const winRate = completedMatches > 0 ? Math.round((wins / completedMatches) * 100) : 0;

    // 7. Dynamic Achievements System
    const achievements = [
      {
        id: 'arena_debut',
        title: 'Arena Debut',
        category: 'Matches',
        description: 'Stepped onto the official stage by competing in your first tournament match.',
        tier: 'bronze',
        icon: 'Trophy',
        unlocked: totalMatches >= 1,
        progress: totalMatches >= 1 ? 100 : 0,
        progressLabel: totalMatches >= 1 ? 'Completed (1/1)' : '0 / 1 Match',
        unlockedAt: totalMatches >= 1 ? 'Arena Season 2026' : null
      },
      {
        id: 'first_victory',
        title: 'Taste of Victory',
        category: 'Victories',
        description: 'Clenched your first competitive match win across any official sport.',
        tier: 'silver',
        icon: 'Award',
        unlocked: wins >= 1,
        progress: wins >= 1 ? 100 : (draws > 0 ? 50 : 0),
        progressLabel: wins >= 1 ? 'Completed (1/1 Win)' : `${wins}/1 Wins`,
        unlockedAt: wins >= 1 ? 'Arena Season 2026' : null
      },
      {
        id: 'mvp_star',
        title: 'MVP Phenom',
        category: 'Accolades',
        description: 'Awarded official Player of the Match honors for exceptional individual brilliance.',
        tier: 'gold',
        icon: 'Sparkles',
        unlocked: mvpAwardsCount >= 1,
        progress: mvpAwardsCount >= 1 ? 100 : 0,
        progressLabel: `${mvpAwardsCount} MVP Honors`,
        unlockedAt: mvpAwardsCount >= 1 ? 'Arena Season 2026' : null
      },
      {
        id: 'sharpshooter',
        title: 'Apex Marksman',
        category: 'Scoring',
        description: 'Slotted goals in competitive tournament matches.',
        tier: 'silver',
        icon: 'Flame',
        unlocked: totalGoals >= 1,
        progress: Math.min(100, Math.round((totalGoals / 3) * 100)),
        progressLabel: `${totalGoals} / 3 Goals`,
        unlockedAt: totalGoals >= 1 ? 'Arena Season 2026' : null
      },
      {
        id: 'hat_trick',
        title: 'Hat-trick Master',
        category: 'Scoring',
        description: 'Scored 3+ goals in a single fixture or amassed a 3-match winning streak.',
        tier: 'platinum',
        icon: 'Zap',
        unlocked: singleMatchMaxGoals >= 3 || wins >= 3,
        progress: Math.min(100, Math.round((Math.max(singleMatchMaxGoals, wins) / 3) * 100)),
        progressLabel: `${Math.max(singleMatchMaxGoals, wins)} / 3 Milestone`,
        unlockedAt: (singleMatchMaxGoals >= 3 || wins >= 3) ? 'Arena Season 2026' : null
      },
      {
        id: 'cricket_glory',
        title: 'Master Blaster',
        category: 'Cricket',
        description: 'Scored 25+ runs or smashed boundaries in competitive cricket tournaments.',
        tier: 'gold',
        icon: 'Star',
        unlocked: cricketRuns >= 25,
        progress: Math.min(100, Math.round((cricketRuns / 25) * 100)),
        progressLabel: `${cricketRuns} / 25 Runs`,
        unlockedAt: cricketRuns >= 25 ? 'Arena Season 2026' : null
      },
      {
        id: 'wicket_hunter',
        title: 'Timber Crusher',
        category: 'Cricket',
        description: 'Captured critical wickets with the ball in sanctioned cricket tournaments.',
        tier: 'silver',
        icon: 'Target',
        unlocked: cricketWickets >= 1,
        progress: Math.min(100, Math.round((cricketWickets / 2) * 100)),
        progressLabel: `${cricketWickets} / 2 Wickets`,
        unlockedAt: cricketWickets >= 1 ? 'Arena Season 2026' : null
      },
      {
        id: 'grandmaster_mind',
        title: 'Grandmaster Tactics',
        category: 'Chess',
        description: 'Calculated chess strategies and competed in official rated board play.',
        tier: 'platinum',
        icon: 'Shield',
        unlocked: (chessWins + chessDraws + chessLosses) >= 1,
        progress: (chessWins + chessDraws + chessLosses) >= 1 ? 100 : 0,
        progressLabel: `${chessWins + chessDraws + chessLosses} / 1 Boards Played`,
        unlockedAt: (chessWins + chessDraws + chessLosses) >= 1 ? 'Arena Season 2026' : null
      },
      {
        id: 'verified_athlete',
        title: 'ArenaX Verified Athlete',
        category: 'Status',
        description: 'Completed strict biometric & ID proof authentication with Superadmin review.',
        tier: 'emerald',
        icon: 'BadgeCheck',
        unlocked: myPlayer?.verification_status === 'Approved',
        progress: myPlayer?.verification_status === 'Approved' ? 100 : 50,
        progressLabel: myPlayer?.verification_status === 'Approved' ? 'ID Authenticated' : 'ID Pending',
        unlockedAt: myPlayer?.verification_status === 'Approved' ? 'Verified Member' : null
      },
      {
        id: 'captain_commander',
        title: 'Roster Commander',
        category: 'Leadership',
        description: 'Formed and registered an official squad roster in sanctioned competitions.',
        tier: 'gold',
        icon: 'Users',
        unlocked: teamsOwned.length >= 1 || myRegistrations.length >= 1,
        progress: (teamsOwned.length >= 1 || myRegistrations.length >= 1) ? 100 : 0,
        progressLabel: `${teamsOwned.length + myRegistrations.length} Squads/Registrations`,
        unlockedAt: (teamsOwned.length >= 1 || myRegistrations.length >= 1) ? 'Arena Season 2026' : null
      },
      {
        id: 'fair_play',
        title: 'Fair Play Vanguard',
        category: 'Sportsmanship',
        description: 'Maintained strict sportsmanship with zero red card disciplinary ejections.',
        tier: 'emerald',
        icon: 'CheckCircle2',
        unlocked: totalMatches >= 1 && redCardsTotal === 0,
        progress: totalMatches >= 1 && redCardsTotal === 0 ? 100 : (totalMatches === 0 ? 0 : 50),
        progressLabel: redCardsTotal === 0 ? 'Flawless Record' : `${redCardsTotal} Cards`,
        unlockedAt: totalMatches >= 1 && redCardsTotal === 0 ? 'Exemplary Honor' : null
      },
      {
        id: 'tournament_challenger',
        title: 'Circuit Veteran',
        category: 'Participation',
        description: 'Entered and contended across 2 or more championship tournaments.',
        tier: 'silver',
        icon: 'Calendar',
        unlocked: tournIds.length >= 2,
        progress: Math.min(100, Math.round((tournIds.length / 2) * 100)),
        progressLabel: `${tournIds.length} / 2 Tournaments`,
        unlockedAt: tournIds.length >= 2 ? 'Arena Season 2026' : null
      }
    ];

    res.json({
      success: true,
      player: myPlayer || {
        player_name: mainUser?.name || 'Local Player',
        email: email || '',
        numeric_player_id: myPlayer?.numeric_player_id || 100003,
        verification_status: myPlayer?.verification_status || 'Pending'
      },
      stats: {
        totalMatches,
        completedMatches,
        wins,
        losses,
        draws,
        winRate,
        mvpAwardsCount,
        tournamentsCount: tournIds.length,
        football: {
          goals: totalGoals,
          assists: totalAssists,
          yellowCards: yellowCardsTotal,
          redCards: redCardsTotal
        },
        cricket: {
          runs: cricketRuns,
          wickets: cricketWickets,
          highestScore: highestCricketScore
        },
        chess: {
          wins: chessWins,
          draws: chessDraws,
          losses: chessLosses,
          points: chessPoints
        }
      },
      matches: formattedMatches,
      achievements,
      teams: teamsOwned
    });
  } catch (error) {
    console.error('Error fetching career stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tournaments/:tournId/start-tournament
// @desc    Organizer officially starts the tournament (unlocks live match scoring and results entry)
router.post('/:tournId/start-tournament', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { tournId } = req.params;

    let tourn = await TblTournament.findById(tournId);
    if (!tourn) {
      tourn = await Tournament.findById(tournId);
    }

    if (!tourn) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    tourn.is_started = true;
    tourn.started_at = new Date();
    await tourn.save();

    res.json({
      success: true,
      message: `🚀 Tournament "${tourn.title || tourn.tournament_name}" has officially STARTED! Live match scoring is now unlocked.`,
      tournament: tourn
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tournaments/matches/:matchId/update-result
// @desc    Organizer updates match scores, status, winner, and sport-specific statistics
router.post('/matches/:matchId/update-result', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      status,
      team1_score,
      team2_score,
      winner_team,
      score_summary,
      player_of_match,
      // Football
      top_scorers = [],
      top_assists = [],
      yellow_cards = [],
      red_cards = [],
      // Cricket
      cricket_team1_score = '',
      cricket_team2_score = '',
      top_batsmen = [],
      top_bowlers = [],
      // Chess
      chess_outcome = '',
      chess_win_method = '',
      chess_moves_count = 0,
      // Badminton / Tennis
      set_scores = [],
      events = []
    } = req.body;

    let match = null;
    if (mongoose.Types.ObjectId.isValid(matchId)) {
      match = await TblMatch.findById(matchId);
    }
    if (!match && !isNaN(Number(matchId))) {
      match = await TblMatch.findOne({ match_id: Number(matchId) });
    }
    if (!match) {
      match = await TblMatch.findOne({ _id: matchId }).catch(() => null);
    }

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match fixture not found.' });
    }

    if (status) match.status = status;
    if (team1_score !== undefined) match.team1_score = Number(team1_score);
    if (team2_score !== undefined) match.team2_score = Number(team2_score);
    if (winner_team !== undefined) match.winner_team = winner_team;
    if (score_summary !== undefined) match.score_summary = score_summary;
    if (player_of_match !== undefined) match.player_of_match = player_of_match;

    // Football
    if (Array.isArray(top_scorers)) match.top_scorers = top_scorers;
    if (Array.isArray(top_assists)) match.top_assists = top_assists;
    if (Array.isArray(yellow_cards)) match.yellow_cards = yellow_cards;
    if (Array.isArray(red_cards)) match.red_cards = red_cards;

    // Cricket
    if (cricket_team1_score !== undefined) match.cricket_team1_score = cricket_team1_score;
    if (cricket_team2_score !== undefined) match.cricket_team2_score = cricket_team2_score;
    if (Array.isArray(top_batsmen)) match.top_batsmen = top_batsmen;
    if (Array.isArray(top_bowlers)) match.top_bowlers = top_bowlers;

    // Chess
    if (chess_outcome !== undefined) match.chess_outcome = chess_outcome;
    if (chess_win_method !== undefined) match.chess_win_method = chess_win_method;
    if (chess_moves_count !== undefined) match.chess_moves_count = Number(chess_moves_count);

    // Badminton / Tennis
    if (Array.isArray(set_scores)) match.set_scores = set_scores;

    if (Array.isArray(events)) match.events = events;

    await match.save();

    res.json({
      success: true,
      message: `Match #${match.match_id || ''} result & statistics updated successfully!`,
      match
    });
  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/tournaments/:tournId/match-center
// @desc    Get complete match center data (fixtures, live scores, results, multi-sport leaderboards)
router.get('/:tournId/match-center', async (req, res) => {
  try {
    const { tournId } = req.params;

    let tournament = await TblTournament.findById(tournId).lean();
    if (!tournament) {
      tournament = await Tournament.findById(tournId).lean();
    }

    const matches = await TblMatch.find({
      $or: [{ tournament_id: tournId }, { tournament_id: tournId.toString() }]
    }).sort({ match_id: 1, match_date: 1 });

    const registrations = await TblTeamRegistration.find({
      $or: [{ tournament_id: tournId }, { tournament_id: tournId.toString() }],
      registration_status: { $ne: 'Rejected' }
    }).lean();

    // 1. Football Leaderboards
    const scorerMap = new Map();
    const assistMap = new Map();
    const yellowCardMap = new Map();
    const redCardMap = new Map();

    // 2. Cricket Leaderboards
    const batsmanMap = new Map();
    const bowlerMap = new Map();

    // 3. Chess Standings
    const chessPlayerMap = new Map();

    matches.forEach(m => {
      // Football Scorers & Assists
      (m.top_scorers || []).forEach(sc => {
        if (sc.player_name) {
          const key = sc.player_name.trim();
          const curr = scorerMap.get(key) || { player_name: key, team_name: sc.team_name || '', goals: 0 };
          curr.goals += Number(sc.goals || 1);
          if (sc.team_name) curr.team_name = sc.team_name;
          scorerMap.set(key, curr);
        }
      });

      (m.top_assists || []).forEach(as => {
        if (as.player_name) {
          const key = as.player_name.trim();
          const curr = assistMap.get(key) || { player_name: key, team_name: as.team_name || '', assists: 0 };
          curr.assists += Number(as.assists || 1);
          if (as.team_name) curr.team_name = as.team_name;
          assistMap.set(key, curr);
        }
      });

      // Cards
      (m.yellow_cards || []).forEach(yc => {
        if (yc.player_name) {
          const key = yc.player_name.trim();
          const curr = yellowCardMap.get(key) || { player_name: key, team_name: yc.team_name || '', cards: 0 };
          curr.cards += Number(yc.count || 1);
          if (yc.team_name) curr.team_name = yc.team_name;
          yellowCardMap.set(key, curr);
        }
      });

      (m.red_cards || []).forEach(rc => {
        if (rc.player_name) {
          const key = rc.player_name.trim();
          const curr = redCardMap.get(key) || { player_name: key, team_name: rc.team_name || '', cards: 0 };
          curr.cards += Number(rc.count || 1);
          if (rc.team_name) curr.team_name = rc.team_name;
          redCardMap.set(key, curr);
        }
      });

      // Cricket Batsmen & Bowlers
      (m.top_batsmen || []).forEach(tb => {
        if (tb.player_name) {
          const key = tb.player_name.trim();
          const curr = batsmanMap.get(key) || { player_name: key, team_name: tb.team_name || '', runs: 0, balls: 0, fours: 0, sixes: 0 };
          curr.runs += Number(tb.runs || 0);
          curr.balls += Number(tb.balls || 0);
          curr.fours += Number(tb.fours || 0);
          curr.sixes += Number(tb.sixes || 0);
          if (tb.team_name) curr.team_name = tb.team_name;
          batsmanMap.set(key, curr);
        }
      });

      (m.top_bowlers || []).forEach(bw => {
        if (bw.player_name) {
          const key = bw.player_name.trim();
          const curr = bowlerMap.get(key) || { player_name: key, team_name: bw.team_name || '', wickets: 0, runs_conceded: 0, overs: '0' };
          curr.wickets += Number(bw.wickets || 0);
          curr.runs_conceded += Number(bw.runs_conceded || 0);
          if (bw.team_name) curr.team_name = bw.team_name;
          bowlerMap.set(key, curr);
        }
      });

      // Chess points calculation
      if (m.chess_outcome) {
        const p1 = m.team1_name;
        const p2 = m.team2_name;
        const curr1 = chessPlayerMap.get(p1) || { player_name: p1, wins: 0, draws: 0, losses: 0, points: 0 };
        const curr2 = chessPlayerMap.get(p2) || { player_name: p2, wins: 0, draws: 0, losses: 0, points: 0 };

        if (m.chess_outcome === '1 - 0') {
          curr1.wins += 1;
          curr1.points += 1;
          curr2.losses += 1;
        } else if (m.chess_outcome === '0 - 1') {
          curr2.wins += 1;
          curr2.points += 1;
          curr1.losses += 1;
        } else if (m.chess_outcome === '0.5 - 0.5' || m.chess_outcome.includes('0.5')) {
          curr1.draws += 1;
          curr1.points += 0.5;
          curr2.draws += 1;
          curr2.points += 0.5;
        }
        chessPlayerMap.set(p1, curr1);
        chessPlayerMap.set(p2, curr2);
      }
    });

    const topScorers = Array.from(scorerMap.values()).sort((a, b) => b.goals - a.goals);
    const topAssists = Array.from(assistMap.values()).sort((a, b) => b.assists - a.assists);
    const yellowCards = Array.from(yellowCardMap.values()).sort((a, b) => b.cards - a.cards);
    const redCards = Array.from(redCardMap.values()).sort((a, b) => b.cards - a.cards);

    const topBatsmen = Array.from(batsmanMap.values()).sort((a, b) => b.runs - a.runs);
    const topBowlers = Array.from(bowlerMap.values()).sort((a, b) => b.wickets - a.wickets);

    const chessStandings = Array.from(chessPlayerMap.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);

    res.json({
      success: true,
      tournament: tournament || { title: 'Tournament Event' },
      matches,
      registrations,
      stats: {
        topScorers,
        topAssists,
        yellowCards,
        redCards,
        topBatsmen,
        topBowlers,
        chessStandings
      }
    });
  } catch (error) {
    console.error('Error fetching tournament match center:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

