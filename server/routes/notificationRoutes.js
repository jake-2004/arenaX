import express from 'express';
import mongoose from 'mongoose';
import { TblNotification, TblTournament, TblPlayer } from '../models/schemaModels.js';
import { User } from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Helper to create a notification from any route
 */
export const createNotificationHelper = async ({
  userId = null,
  role = null,
  title,
  message,
  type = 'system',
  actionNav = 'dashboard',
  metadata = {}
}) => {
  try {
    const highest = await TblNotification.findOne({ notification_id: { $exists: true, $ne: null } })
      .sort({ notification_id: -1 })
      .lean();
    const nextId = highest?.notification_id ? highest.notification_id + 1 : 1;

    const notification = await TblNotification.create({
      notification_id: nextId,
      user_id: userId || null,
      role: role || null,
      title,
      message,
      type,
      action_nav: actionNav,
      metadata,
      is_read: false,
      read_by: [],
      created_at: new Date()
    });

    return notification;
  } catch (err) {
    console.warn('⚠️ Error creating notification:', err.message);
    return null;
  }
};

/**
 * Ensure baseline notifications exist for existing pending DB items (Tournaments, Players, Organizers)
 */
const autoSeedPendingNotifications = async () => {
  try {
    const notifCount = await TblNotification.countDocuments();
    if (notifCount > 0) return; // already has notifications

    // 1. Pending tournaments
    const pendingTournaments = await TblTournament.find({ status: 'Pending' }).lean();
    for (const t of pendingTournaments) {
      await createNotificationHelper({
        role: 'admin',
        title: 'New Tournament Request',
        message: `Organizer submitted "${t.tournament_name || 'Tournament'}" (${t.sport || 'Sports'}) for verification.`,
        type: 'tournament_request',
        actionNav: 'pending_tournaments',
        metadata: { tournamentId: t._id }
      });
    }

    // 2. Pending player ID proofs
    const pendingPlayers = await TblPlayer.find({ verification_status: 'Pending' }).lean();
    for (const p of pendingPlayers) {
      await createNotificationHelper({
        role: 'admin',
        title: 'Player ID Verification Request',
        message: `Athlete "${p.player_name || 'Player'}" (#${p.numeric_player_id || '100001'}) submitted ID proof for verification.`,
        type: 'player_request',
        actionNav: 'player_verification',
        metadata: { playerId: p._id }
      });
    }

    // 3. Pending organizer admission
    const pendingOrgs = await User.find({ role: 'organizer', approvalStatus: 'Pending' }).lean();
    for (const org of pendingOrgs) {
      await createNotificationHelper({
        role: 'admin',
        title: 'New Organizer Admission Request',
        message: `Organizer "${org.name}" (${org.organization || 'Independent Host'}) is waiting for account approval.`,
        type: 'organizer_request',
        actionNav: 'organizers',
        metadata: { userId: org._id }
      });
    }
  } catch (err) {
    console.warn('Auto-seed notifications warning:', err.message);
  }
};

// @route   GET /api/notifications
// @desc    Get notifications for logged-in user / role with unread count
router.get('/', authMiddleware, async (req, res) => {
  try {
    await autoSeedPendingNotifications();

    const userId = req.user.id || req.user._id;
    const userRole = (req.user.role || 'user').toLowerCase();

    // Query condition based on user role and ID
    const orConditions = [
      { user_id: userId },
      { role: 'all' }
    ];

    if (userRole === 'admin') {
      orConditions.push({ role: 'admin' });
    } else if (userRole === 'organizer') {
      orConditions.push({ role: 'organizer' });
    } else {
      orConditions.push({ role: 'user' });
    }

    const rawNotifications = await TblNotification.find({
      $or: orConditions
    }).sort({ created_at: -1, createdAt: -1 }).limit(50).lean();

    const notifications = rawNotifications.map(n => {
      const isReadByMe = n.is_read || (Array.isArray(n.read_by) && n.read_by.includes(String(userId)));
      return {
        id: n._id,
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type || 'system',
        actionNav: n.action_nav || 'dashboard',
        unread: !isReadByMe,
        createdAt: n.created_at || n.createdAt || new Date(),
        metadata: n.metadata || {}
      };
    });

    const unreadCount = notifications.filter(n => n.unread).length;

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({ success: false, message: error.message, notifications: [], unreadCount: 0 });
  }
});

// @route   POST /api/notifications/:id/read
// @desc    Mark a notification as read
router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.id || req.user._id);
    const notifId = req.params.id;

    const notif = await TblNotification.findById(notifId);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // If notification belongs directly to this user, set is_read
    if (notif.user_id && String(notif.user_id) === userId) {
      notif.is_read = true;
    }

    // Always append user ID to read_by array
    if (!notif.read_by) notif.read_by = [];
    if (!notif.read_by.includes(userId)) {
      notif.read_by.push(userId);
    }
    await notif.save();

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all notifications for user as read
router.post('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.id || req.user._id);
    const userRole = (req.user.role || 'user').toLowerCase();

    // 1. Mark personal notifications
    await TblNotification.updateMany(
      { user_id: userId },
      { $set: { is_read: true }, $addToSet: { read_by: userId } }
    );

    // 2. Mark role-based notifications by adding user ID to read_by
    await TblNotification.updateMany(
      { $or: [{ role: userRole }, { role: 'all' }] },
      { $addToSet: { read_by: userId } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Clear / delete all read notifications for user
router.delete('/clear-all', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.id || req.user._id);
    // Delete personal notifications that are read
    await TblNotification.deleteMany({
      user_id: userId,
      $or: [{ is_read: true }, { read_by: userId }]
    });

    res.json({ success: true, message: 'Notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete single notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await TblNotification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
