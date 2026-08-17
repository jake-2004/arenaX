import express from 'express';
import mongoose from 'mongoose';
import { TblTeam, TblTeamRegistration, TblPlayer, TblTournament } from '../models/schemaModels.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @route   GET /api/teams/registrations/pending
// @desc    Get pending tournament registrations for tournaments owned by the logged-in organizer
router.get('/registrations/pending', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const rawRegistrations = await TblTeamRegistration.find({ registration_status: 'Pending' })
      .populate('user_id')
      .lean();

    const registrations = await Promise.all(rawRegistrations.map(async (reg) => {
      const teamId = reg.team_id?._id || reg.team_id;
      let teamObj = null;
      if (teamId) {
        teamObj = await TblTeam.collection.findOne({
          $or: [{ _id: teamId }, { _id: teamId.toString() }]
        });
        if (!teamObj) {
          try {
            teamObj = await TblTeam.collection.findOne({ _id: new mongoose.Types.ObjectId(teamId) });
          } catch (e) {}
        }
      }

      if (teamObj) {
        if (!teamObj.players || teamObj.players.length === 0) {
          try {
            teamObj.players = await TblPlayer.find({
              $or: [{ team_id: teamObj._id }, { team_id: teamObj._id?.toString() }]
            }).lean();
          } catch (e) {}
        }
        reg.team_id = teamObj;
      }
      return reg;
    }));

    res.json({ success: true, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/teams/registrations/tournament/:tournId
// @desc    Get all registered teams and player rosters for a specific tournament
router.get('/registrations/tournament/:tournId', authMiddleware, async (req, res) => {
  try {
    const tournId = req.params.tournId;
    const rawRegistrations = await TblTeamRegistration.find({
      $or: [
        { tournament_id: tournId },
        { tournament_id: tournId.toString() }
      ]
    }).populate('user_id').lean();

    const registrations = await Promise.all(rawRegistrations.map(async (reg) => {
      let teamObj = null;
      if (reg.team_id) {
        teamObj = await TblTeam.findById(reg.team_id).lean();
      }
      reg.team = teamObj || { team_name: reg.team_name || 'Registered Team' };
      reg.playersList = reg.players && reg.players.length > 0 ? reg.players : (teamObj?.players || []);
      return reg;
    }));

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/register-tournament
// @desc    User requests to register for a tournament with team name & full player roster ID proofs
router.post('/register-tournament', authMiddleware, requireRole(['user', 'admin']), async (req, res) => {
  try {
    const { tournament_id, team_name, sport, players = [] } = req.body;
    
    // Parse and sanitize players roster list
    const sanitizedPlayers = Array.isArray(players) ? players.map(p => ({
      player_name: p.player_name || 'Player',
      jersey_number: p.jersey_number || '',
      position: p.position || 'Player',
      id_proof_type: p.id_proof_type || 'Govt Photo ID',
      id_proof_number: p.id_proof_number || '',
      id_proof_doc: p.id_proof_doc || ''
    })) : [];

    const captainName = sanitizedPlayers[0]?.player_name || req.user.name || 'Captain';

    // Create team record with full roster embedded
    const newTeam = await TblTeam.create({
      owner_id: req.user.id,
      team_name: team_name || `${captainName}'s Team`,
      sport: sport || 'General Sport',
      captain_name: captainName,
      players: sanitizedPlayers,
      verification_status: 'Pending'
    });

    // Ensure players array is persisted to MongoDB document
    await TblTeam.collection.updateOne(
      { _id: newTeam._id },
      { $set: { players: sanitizedPlayers } }
    );

    // Also create individual TblPlayer records for queryable roster tracking
    if (sanitizedPlayers.length > 0) {
      const playerDocs = sanitizedPlayers.map(p => ({
        team_id: newTeam._id,
        player_name: p.player_name,
        jersey_number: p.jersey_number,
        position: p.position,
        id_proof_type: p.id_proof_type,
        id_proof_number: p.id_proof_number,
        id_proof_doc: p.id_proof_doc,
        verification_status: 'Pending'
      }));
      await TblPlayer.insertMany(playerDocs);
    }

    const registration = await TblTeamRegistration.create({
      tournament_id,
      team_id: newTeam._id,
      user_id: req.user.id,
      players: sanitizedPlayers,
      registration_status: 'Pending'
    });

    // Increment registered teams count on tournament models
    if (tournament_id) {
      try {
        await Tournament.findByIdAndUpdate(tournament_id, { $inc: { registeredTeamsCount: 1 } });
      } catch (e) {}
      try {
        await Schemas.TblTournament.findByIdAndUpdate(tournament_id, { $inc: { registeredTeamsCount: 1 } });
      } catch (e) {}
    }

    res.status(201).json({ 
      success: true, 
      message: `Tournament registration submitted with ${sanitizedPlayers.length} player ID proof(s). Pending Organizer approval.`, 
      registration 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/upload-proof/:teamId
// @desc    Upload team proof (allowed only if tournament registration is Approved)
router.post('/upload-proof/:teamId', authMiddleware, upload.single('team_proof'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    
    // Check if registration is approved
    const registration = await TblTeamRegistration.findOne({ team_id: req.params.teamId });
    if (!registration || registration.registration_status !== 'Approved') {
      return res.status(403).json({ success: false, message: 'You can only upload team proof after tournament registration is approved by the organizer.' });
    }

    const team = await TblTeam.findByIdAndUpdate(req.params.teamId, {
      team_proof_doc: req.file.path,
      team_proof_type: req.body.proof_type || 'General Registration Doc',
      verification_status: 'Pending' // Requires Organizer verification now
    }, { new: true });

    res.json({ success: true, message: 'Team proof uploaded. Awaiting verification.', team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/:teamId/players
// @desc    Add a player with ID proof to a team (User only)
router.post('/:teamId/players', authMiddleware, upload.single('id_proof'), async (req, res) => {
  try {
    const { player_name, date_of_birth, gender, jersey_number, position, id_proof_type, id_proof_number } = req.body;
    
    if (!req.file) return res.status(400).json({ success: false, message: 'ID Proof file is required.' });

    let team = null;
    if (mongoose.Types.ObjectId.isValid(req.params.teamId)) {
      team = await TblTeam.findOne({ _id: req.params.teamId });
    }

    if (!team) {
      team = await TblTeam.findOne({ owner_id: req.user.id });
    }

    if (!team) {
      team = await TblTeam.create({
        owner_id: req.user.id,
        team_name: `${req.user.name || 'User'}'s Team`,
        sport: 'Football',
        captain_name: req.user.name || 'Captain',
        players: []
      });
    }

    const player = await TblPlayer.create({
      team_id: team._id,
      player_name: player_name || 'Player',
      date_of_birth,
      gender: gender || 'Male',
      jersey_number: jersey_number || '',
      position: position || 'Player',
      id_proof_type: id_proof_type || 'Aadhaar',
      id_proof_number: id_proof_number || '',
      id_proof_doc: req.file.path,
      verification_status: 'Pending'
    });

    // Also push player into team's embedded roster array
    await TblTeam.findByIdAndUpdate(team._id, {
      $push: {
        players: {
          player_name: player.player_name,
          id_proof_type: player.id_proof_type,
          id_proof_doc: player.id_proof_doc,
          verification_status: 'Pending'
        }
      }
    });

    res.status(201).json({ success: true, message: 'Player added with ID proof. Awaiting organizer verification.', player, teamId: team._id });
  } catch (error) {
    console.error('Error adding player ID proof:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/verify/:teamId
// @desc    Organizer verifies team proof
router.post('/verify/:teamId', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    const team = await TblTeam.findByIdAndUpdate(req.params.teamId, { verification_status: status }, { new: true });
    res.json({ success: true, message: `Team verification status updated to ${status}.`, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/players/verify/:playerId
// @desc    Organizer verifies player ID proof
router.post('/players/verify/:playerId', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected' or 'Correction Required'
    const player = await TblPlayer.findByIdAndUpdate(req.params.playerId, { verification_status: status }, { new: true });
    res.json({ success: true, message: `Player verification status updated to ${status}.`, player });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/registrations/:regId/approve
// @desc    Organizer approves Local User's tournament registration
router.post('/registrations/:regId/approve', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const registration = await TblTeamRegistration.findByIdAndUpdate(req.params.regId, { registration_status: 'Approved' }, { new: true });
    res.json({ success: true, message: `Registration Approved. Local User can now upload team proof.`, registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/registrations/:regId/reject
// @desc    Organizer rejects Local User's tournament registration
router.post('/registrations/:regId/reject', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const registration = await TblTeamRegistration.findByIdAndUpdate(req.params.regId, { registration_status: 'Rejected' }, { new: true });
    res.json({ success: true, message: `Registration Rejected.`, registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/registrations/:regId/verify-roster
// @desc    Organizer accepts/declines individual players (Tick/Cross) & sends feedback back to Local User
router.post('/registrations/:regId/verify-roster', authMiddleware, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { playerDecisions = [] } = req.body;
    const registration = await TblTeamRegistration.findById(req.params.regId);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const decisionMap = {};
    playerDecisions.forEach(d => {
      decisionMap[d.player_name] = d.status;
    });

    let targetPlayers = registration.players || [];
    if (targetPlayers.length === 0 && registration.team_id) {
      try {
        const teamObj = await TblTeam.findById(registration.team_id);
        if (teamObj && teamObj.players) {
          targetPlayers = teamObj.players;
        }
      } catch (e) {}
    }

    let hasDeclined = false;
    let hasApproved = false;

    const updatedPlayers = targetPlayers.map(p => {
      const newStatus = decisionMap[p.player_name] || p.verification_status || 'Approved';
      if (newStatus === 'Declined') hasDeclined = true;
      if (newStatus === 'Approved') hasApproved = true;
      return {
        ...p,
        verification_status: newStatus
      };
    });

    registration.players = updatedPlayers;

    // Determine overall registration status
    if (hasDeclined && !hasApproved) {
      registration.registration_status = 'Rejected';
    } else if (hasDeclined && hasApproved) {
      registration.registration_status = 'Partial Approval';
    } else {
      registration.registration_status = 'Approved';
    }

    await registration.save();

    // Sync with TblTeam if exists
    if (registration.team_id) {
      try {
        const team = await TblTeam.findById(registration.team_id);
        if (team && team.players) {
          team.players = team.players.map(p => ({
            ...p,
            verification_status: decisionMap[p.player_name] || p.verification_status || 'Approved'
          }));
          await team.save();
        }
      } catch (err) {}
    }

    res.json({
      success: true,
      message: `Roster decisions updated and sent back to local user. Status: ${registration.registration_status}`,
      registration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/teams/my-registrations
// @desc    Get user's registered tournaments with team names and player roster approval statuses
router.get('/my-registrations', authMiddleware, async (req, res) => {
  try {
    const rawRegistrations = await TblTeamRegistration.find({
      $or: [
        { user_id: req.user.id },
        { user_id: req.user._id },
        { user_id: req.user.id.toString() }
      ]
    }).lean();

    const registrations = await Promise.all(rawRegistrations.map(async (reg) => {
      // Populate tournament
      let tournObj = null;
      if (reg.tournament_id) {
        tournObj = await TblTournament.findById(reg.tournament_id).lean();
        if (!tournObj) {
          tournObj = await Tournament.findById(reg.tournament_id).lean();
        }
      }
      reg.tournament = tournObj || { title: reg.tournament_title || 'Tournament Event', sport: 'Sports' };

      // Populate team
      let teamObj = null;
      if (reg.team_id) {
        teamObj = await TblTeam.findById(reg.team_id).lean();
      }
      reg.team = teamObj || { team_name: reg.team_name || 'My Team', players: reg.players || [] };
      
      // Merge players array (prefer registration.players if non-empty as it contains organizer verification decisions)
      reg.playersList = reg.players && reg.players.length > 0 ? reg.players : (teamObj?.players || []);

      return reg;
    }));

    res.json({ success: true, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/teams/registrations/:regId/update-player
// @desc    Local User re-submits/updates details & ID proof for a declined player
router.post('/registrations/:regId/update-player', authMiddleware, upload.single('id_proof'), async (req, res) => {
  try {
    const { target_player_name, player_name, date_of_birth, gender, id_proof_type, id_proof_number } = req.body;
    const registration = await TblTeamRegistration.findById(req.params.regId);

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const newProofDoc = req.file ? req.file.path : null;

    // Update player inside registration
    if (registration.players && registration.players.length > 0) {
      registration.players = registration.players.map(p => {
        if (p.player_name === target_player_name || p.player_name === player_name) {
          return {
            ...p,
            player_name: player_name || p.player_name,
            date_of_birth: date_of_birth || p.date_of_birth,
            gender: gender || p.gender || 'Male',
            id_proof_type: id_proof_type || p.id_proof_type,
            id_proof_number: id_proof_number || p.id_proof_number,
            id_proof_doc: newProofDoc || p.id_proof_doc,
            verification_status: 'Pending' // Resets to Pending for Organizer re-review!
          };
        }
        return p;
      });
    }

    // Reset overall registration_status to Pending so Organizer sees it in pending queue!
    registration.registration_status = 'Pending';
    await registration.save();

    // Also update TblTeam if exists
    if (registration.team_id) {
      try {
        const team = await TblTeam.findById(registration.team_id);
        if (team && team.players) {
          team.players = team.players.map(p => {
            if (p.player_name === target_player_name || p.player_name === player_name) {
              return {
                ...p,
                player_name: player_name || p.player_name,
                id_proof_type: id_proof_type || p.id_proof_type,
                id_proof_doc: newProofDoc || p.id_proof_doc,
                verification_status: 'Pending'
              };
            }
            return p;
          });
          await team.save();
        }
      } catch (err) {}
    }

    res.json({
      success: true,
      message: `Player details for "${player_name || target_player_name}" updated and re-submitted to organizer!`,
      registration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
