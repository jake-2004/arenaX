import express from 'express';
import { User } from '../models/User.js';
import { Tournament } from '../models/Tournament.js';
import { TblTournament, TblOrganizer, TblUser, TblTournamentPoster, TblTeamRegistration } from '../models/schemaModels.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all approved tournaments for Local User discovery
router.get('/', async (req, res) => {
  try {
    const filters = { status: 'Approved' };
    
    if (req.query.sport && req.query.sport !== 'All') {
      filters.sport = req.query.sport;
    }

    const tblTournaments = await TblTournament.find(filters).populate('organizer_id').sort({ start_date: 1 });
    const feedTournaments = await Tournament.find({ isApproved: true }).sort({ startDate: 1 });

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
        maxTeams: t.max_teams,
        posterUrl: t.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        status: t.status || 'Pending',
        rules: t.rules,
        createdAt: t.createdAt
      });
    }

    for (const ft of feedTournaments) {
      if (!seenTitles.has((ft.title || '').toLowerCase())) {
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
          maxTeams: ft.maxTeams,
          posterUrl: ft.posterUrl,
          status: ft.isApproved ? 'Approved' : (ft.status === 'Rejected' ? 'Rejected' : 'Pending'),
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

    res.status(201).json({ success: true, message: 'Tournament created and pending admin approval.', tournament: newTournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

