import express from 'express';
import { TblUser, TblOrganizer, TblTournament, TblTeam, TblPlayer } from '../models/schemaModels.js';
import { User } from '../models/User.js';

const router = express.Router();

// GET /api/admin/stats - get real counts from MongoDB (no auth required for dashboard stats)
router.get('/stats', async (req, res) => {
  try {
    // --- Organizer Count ---
    // Collect all unique organizer emails from User model (role: 'organizer')
    const organizersFromUser = await User.find(
      { role: { $in: ['organizer', 'Organizer'] } },
      { email: 1 }
    ).lean();

    // Collect all unique organizer emails from TblUser model (role: 'Organizer')
    const organizersFromTblUser = await TblUser.find(
      { role: { $in: ['Organizer', 'organizer'] } },
      { email: 1 }
    ).lean();

    // Deduplicate by email to get true unique organizer count
    const allOrganizerEmails = new Set([
      ...organizersFromUser.map(u => u.email?.toLowerCase()),
      ...organizersFromTblUser.map(u => u.email?.toLowerCase())
    ]);
    const finalOrganizerCount = allOrganizerEmails.size;

    // --- User Count ---
    // Collect all unique user emails from User model (role: 'user')
    const usersFromUser = await User.find(
      { role: { $in: ['user', 'User'] } },
      { email: 1 }
    ).lean();

    // Collect all unique user emails from TblUser model (role: 'LocalUser')
    const usersFromTblUser = await TblUser.find(
      { role: { $in: ['LocalUser', 'user', 'User'] } },
      { email: 1 }
    ).lean();

    // Deduplicate by email to get true unique user count
    const allUserEmails = new Set([
      ...usersFromUser.map(u => u.email?.toLowerCase()),
      ...usersFromTblUser.map(u => u.email?.toLowerCase())
    ]);
    const finalUserCount = allUserEmails.size;

    // --- Other Counts ---
    const tournamentCount = await TblTournament.countDocuments();
    const teamCount = await TblTeam.countDocuments();
    const playerCount = await TblPlayer.countDocuments();

    res.json({
      success: true,
      userCount: finalUserCount,
      organizerCount: finalOrganizerCount,
      tournamentCount,
      teamCount,
      playerCount,
      posterCount: 0
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
