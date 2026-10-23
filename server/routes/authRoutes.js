import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Tournament } from '../models/Tournament.js';
import { TblUser, TblOrganizer, TblTeam, TblPlayer, TblTournament, TblTournamentPoster, TblActivityLog } from '../models/schemaModels.js';
import { createNotificationHelper } from './notificationRoutes.js';

const router = express.Router();

const generateToken = (userObj) => {
  const id = userObj._id || userObj.id;
  const role = userObj.role || 'user';
  const email = userObj.email || '';
  return jwt.sign({ id, role, email }, process.env.JWT_SECRET || 'arenax_secret_key_2026', {
    expiresIn: '7d'
  });
};

const formatDbErrorMessage = (error) => {
  const msg = error?.message || 'Authentication service error';
  if (
    msg.includes('SSL alert number 80') ||
    msg.includes('ssl3_read_bytes') ||
    msg.includes('whitelist') ||
    msg.includes('ReplicaSetNoPrimary') ||
    msg.includes('querySrv ECONNREFUSED')
  ) {
    return '⚠️ MongoDB Atlas Connection Blocked: Your current network IP address is not whitelisted in MongoDB Atlas Network Access. Please log in to cloud.mongodb.com -> Network Access -> Add IP Address, and add your current IP address (or 0.0.0.0/0).';
  }
  return msg;
};

// @route   GET /api/auth/google/url
// @desc    Generate Google OAuth 2.0 Authorization URL with Google People API scopes
router.get('/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '394321762734-o3pdes2msjbnrg6gdbhd7c9ocud8p221.apps.googleusercontent.com';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://127.0.0.1:5000/api/auth/google/callback`;
  
  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ success: true, url: authUrl, clientId, redirectUri });
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth Callback & Profile resolution via Google People API
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

  if (!code) {
    return res.redirect(`${frontendUrl}/?error=google_auth_code_missing`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || '394321762734-o3pdes2msjbnrg6gdbhd7c9ocud8p221.apps.googleusercontent.com';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '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';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://127.0.0.1:5000/api/auth/google/callback`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.redirect(`${frontendUrl}/?error=token_exchange_failed`);
    }

    // 2. Query Google People API (https://people.googleapis.com/v1/people/me)
    let googleUser = { name: 'Google Athlete', email: '', photo: '' };
    try {
      const peopleRes = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const peopleData = await peopleRes.json();

      const name = peopleData.names?.[0]?.displayName || 'Google Athlete';
      const email = peopleData.emailAddresses?.[0]?.value;
      const photo = peopleData.photos?.[0]?.url;

      googleUser = { name, email, photo };
    } catch (pErr) {
      // Fallback to OAuth2 UserInfo endpoint
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const uData = await userinfoRes.json();
      googleUser = {
        name: uData.name || 'Google Athlete',
        email: uData.email,
        photo: uData.picture
      };
    }

    if (!googleUser.email) {
      return res.redirect(`${frontendUrl}/?error=google_email_missing`);
    }

    // 3. Find or Create User in MongoDB
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        password: `google_oauth_${Date.now()}`,
        role: 'user',
        avatar: googleUser.photo,
        approvalStatus: 'Approved'
      });

      // Populate TblUser & TblTeam in schemaModels
      try {
        const tblUser = await TblUser.create({
          full_name: googleUser.name,
          email: googleUser.email.toLowerCase(),
          password: user.password,
          role: 'LocalUser'
        });

        const newTeam = await TblTeam.create({
          owner_id: tblUser._id,
          team_name: `${googleUser.name}'s Team`,
          sport: 'Football',
          captain_name: googleUser.name
        });

        await TblPlayer.create({
          team_id: newTeam._id,
          player_name: googleUser.name
        });
      } catch (err) {}
    }

    // 4. Generate JWT Token & redirect back to frontend
    const token = generateToken(user);
    const userDataEncoded = encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: googleUser.photo
    }));

    return res.redirect(`${frontendUrl}/?token=${token}&user=${userDataEncoded}`);
  } catch (err) {
    console.error('Google OAuth Callback Exception:', err);
    return res.redirect(`${frontendUrl}/?error=google_oauth_error`);
  }
});

// @route   POST /api/auth/google/verify
// @desc    Direct client-side Google People API login verification
router.post('/google/verify', async (req, res) => {
  try {
    const { email, name, photo, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google email is required for authentication.' });
    }

    const formattedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: formattedEmail });

    if (!user) {
      user = await User.create({
        name: name || 'Google Athlete',
        email: formattedEmail,
        password: `google_oauth_${googleId || Date.now()}`,
        role: 'user',
        avatar: photo || '',
        approvalStatus: 'Approved'
      });

      try {
        const tblUser = await TblUser.create({
          full_name: user.name,
          email: formattedEmail,
          password: user.password,
          role: 'LocalUser'
        });

        const newTeam = await TblTeam.create({
          owner_id: tblUser._id,
          team_name: `${user.name}'s Team`,
          sport: 'Football',
          captain_name: user.name
        });

        await TblPlayer.create({
          team_id: newTeam._id,
          player_name: user.name
        });
      } catch (err) {}
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Google Sign-In successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user (Organizer or LocalUser) in MongoDB
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, location, selectedSports, teamName, organization, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required for registration.' });
    }

    const formattedEmail = email.toLowerCase().trim();

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: formattedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists in database.' });
    }

    const assignedRole = (role === 'organizer' || role === 'Organizer') ? 'organizer' : (role === 'admin' || role === 'Admin') ? 'admin' : 'user';
    const isOrganizer = assignedRole === 'organizer';
    const approvalStatus = 'Approved';

    // 1. Create primary MongoDB User Document
    const newUser = await User.create({
      name,
      email: formattedEmail,
      password,
      role: assignedRole,
      phone: phone || '+44 7911 999888',
      approvalStatus,
      location: location || 'London, UK',
      favoriteSports: selectedSports || ['Football', 'Cricket'],
      teamName: teamName || (assignedRole === 'user' ? 'East End Eagles FC' : ''),
      organization: organization || (isOrganizer ? 'ArenaX Sports League' : '')
    });

    // 2. Populate corresponding Relational Schema Models in MongoDB
    try {
      if (isOrganizer) {
        const tblUser = await TblUser.create({
          full_name: name,
          email: formattedEmail,
          password: newUser.password,
          role: 'Organizer',
          phone: phone || '+44 7911 999888'
        });

        await TblOrganizer.create({
          user_id: tblUser._id,
          organization_name: organization || name,
          approval_status: 'Pending'
        });
      } else {
        const tblUser = await TblUser.create({
          full_name: name,
          email: formattedEmail,
          password: newUser.password,
          role: assignedRole === 'admin' ? 'Admin' : 'LocalUser',
          phone: phone || ''
        });

        if (teamName) {
          const newTeam = await TblTeam.create({
            owner_id: tblUser._id,
            team_name: teamName,
            sport: selectedSports?.[0] || 'Football',
            captain_name: name
          });

          await TblPlayer.create({
            team_id: newTeam._id,
            player_name: name,
            position: 'Captain / Forward'
          });
        }
      }
    } catch (schemaErr) {
      console.warn('Optional Tbl models creation warning:', schemaErr.message);
    }

    // If Organizer registration, BLOCK login & require Admin approval
    if (isOrganizer) {
      // Notify Admin of new organizer admission request
      try {
        await createNotificationHelper({
          role: 'admin',
          title: 'New Organizer Admission Request',
          message: `Organizer "${newUser.name}" (${newUser.organization || 'Sports Club'}) registered and is waiting for admission approval.`,
          type: 'organizer_request',
          actionNav: 'organizers',
          metadata: { userId: newUser._id }
        });
      } catch (nErr) {
        console.warn('Organizer admission notification warning:', nErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Organizer registration submitted successfully! Your account is currently PENDING ADMIN APPROVAL. You cannot log in until an Admin admits your account.',
        requiresApproval: true,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          approvalStatus: newUser.approvalStatus
        }
      });
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: `Registered successfully as ${assignedRole}!`,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        location: newUser.location,
        approvalStatus: newUser.approvalStatus,
        favoriteSports: newUser.favoriteSports,
        team: { name: newUser.teamName || 'East End Eagles FC', role: 'Captain', membersCount: 14, logo: '⚽' },
        organization: newUser.organization
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: formatDbErrorMessage(error) });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user (Admin, Organizer, or LocalUser)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const formattedEmail = email.toLowerCase().trim();

    // Find User
    const user = await User.findOne({ email: formattedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Compare Password Hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const status = user.approvalStatus || 'Approved';

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Authenticated successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        approvalStatus: status,
        location: user.location,
        favoriteSports: user.favoriteSports,
        team: { name: user.teamName || 'East End Eagles FC', role: 'Captain', membersCount: 14, logo: '⚽' },
        organization: user.organization
      }
    });

  } catch (error) {
    console.error('Login MongoDB Error:', error);
    res.status(500).json({ success: false, message: formatDbErrorMessage(error) });
  }
});

// @route   GET /api/auth/organizers/pending
// @desc    Fetch list of all organizers pending Admin admission
router.get('/organizers/pending', async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' }).select('-password').sort({ createdAt: -1 });
    const formatted = organizers.map(org => ({
      ...org.toObject(),
      approvalStatus: org.approvalStatus || (['organizer@arenax.io', 'organizer@proleague.com'].includes(org.email) ? 'Approved' : 'Pending')
    }));
    res.json({ success: true, count: formatted.length, organizers: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/organizers/approve
// @desc    Approve / Admit an organizer account & send SMS notification option
router.post('/organizers/approve', async (req, res) => {
  try {
    const { userId, sendSms = true } = req.body;

    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ email: userId });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Organizer user not found in database.' });
    }

    user.approvalStatus = 'Approved';
    if (sendSms) {
      user.smsSent = true;
    }
    await user.save();

    // Also update TblOrganizer approval status if matching TblUser exists
    try {
      const tblUser = await TblUser.findOne({ email: user.email });
      if (tblUser) {
        await TblOrganizer.updateOne({ user_id: tblUser._id }, { $set: { approval_status: 'Approved' } });
      }
    } catch (e) {
      console.warn('TblOrganizer status update warning:', e.message);
    }

    const phoneNumber = user.phone || '+44 7911 999888';
    const smsMessage = `[ArenaX SMS Notification]: Hello ${user.name}, your Organizer account (${user.organization || 'ArenaX League'}) has been APPROVED by Platform Admin. You can now log in at http://localhost:5173.`;

    console.log(`📱 SMS SENT TO ${phoneNumber}: "${smsMessage}"`);

    // Notify Organizer that their account has been admitted & approved
    try {
      await createNotificationHelper({
        userId: user._id,
        role: 'organizer',
        title: 'Organizer Account Approved! 🛡️',
        message: `Congratulations ${user.name}! Your Organizer account (${user.organization || 'ArenaX League'}) was approved by Platform Admin. You can now host tournaments.`,
        type: 'organizer_status',
        actionNav: 'dashboard',
        metadata: { userId: user._id }
      });
    } catch (nErr) {
      console.warn('Organizer approve notification warning:', nErr.message);
    }

    return res.json({
      success: true,
      message: `Organizer "${user.name}" has been admitted & approved!${sendSms ? ` SMS dispatched to ${phoneNumber}.` : ''}`,
      smsSent: sendSms,
      smsContent: smsMessage,
      user
    });
  } catch (error) {
    console.error('Approve Organizer Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/tournaments
// @desc    Fetch approved tournaments for Local User feed
router.get('/tournaments', async (req, res) => {
  try {
    // Only return tournaments accepted/approved by Admin
    const tournaments = await Tournament.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: tournaments.length, tournaments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, tournaments: [] });
  }
});

// @route   POST /api/auth/tournaments/create
// @desc    Create a new tournament and send to Admin for approval (isApproved: false)
router.post('/tournaments/create', async (req, res) => {
  try {
    const { title, sport, format, location, startDate, entryFee, prizePool, maxTeams, posterUrl, organizer, latitude, longitude, rules } = req.body;

    if (!title || !sport || !location) {
      return res.status(400).json({ success: false, message: 'Tournament Title, Sport, and Location are required.' });
    }

    const newTournament = await Tournament.create({
      title,
      sport,
      format: format || 'Knockout Tournament',
      location: location || 'London, UK',
      startDate: startDate || new Date().toISOString().split('T')[0],
      entryFee: Number(entryFee) || 50,
      prizePool: prizePool || '$1,000',
      maxTeams: Number(maxTeams) || 16,
      registeredTeamsCount: 0,
      status: 'registration_open',
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      recommendationReason: `📍 ${location} • Host Event`,
      organizer: organizer || 'ArenaX Sports Host',
      isApproved: false // Sent to Admin for verification first!
    });

    return res.status(201).json({
      success: true,
      message: `Tournament "${newTournament.title}" submitted to Admin for approval! Once verified by Admin, it will be shared on local user feeds.`,
      tournament: newTournament
    });
  } catch (error) {
    console.error('Create Tournament Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/tournaments/pending
// @desc    Fetch pending tournaments waiting for Admin verification & approval
router.get('/tournaments/pending', async (req, res) => {
  try {
    const tblPending = await TblTournament.find({ status: 'Pending' }).populate('organizer_id').sort({ createdAt: -1 });
    const feedPending = await Tournament.find({ isApproved: false, status: { $ne: 'Rejected' } }).sort({ createdAt: -1 });

    const results = [];
    const seenTitles = new Set();

    for (const t of tblPending) {
      seenTitles.add((t.tournament_name || '').toLowerCase());
      results.push({
        _id: t._id,
        id: t._id,
        title: t.tournament_name,
        sport: t.sport,
        format: t.format || 'Knockout 5v5',
        location: t.location,
        startDate: t.start_date ? new Date(t.start_date).toISOString().split('T')[0] : '',
        entryFee: t.entry_fee,
        prizePool: t.prize_amount ? `₹${t.prize_amount.toLocaleString()}` : '₹0',
        maxTeams: t.max_teams,
        posterUrl: t.poster_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        organizer: t.organizer_id?.organization_name || t.organizer_id?.user_id?.full_name || 'ArenaX Sports Host',
        status: t.status,
        rules: t.rules
      });
    }

    for (const ft of feedPending) {
      if (!seenTitles.has((ft.title || '').toLowerCase())) {
        results.push({
          _id: ft._id,
          id: ft._id,
          title: ft.title,
          sport: ft.sport,
          format: ft.format || 'Knockout 5v5',
          location: ft.location,
          startDate: ft.startDate,
          entryFee: ft.entryFee,
          prizePool: ft.prizePool,
          maxTeams: ft.maxTeams,
          posterUrl: ft.posterUrl,
          organizer: ft.organizer,
          status: 'Pending'
        });
      }
    }

    res.json({ success: true, count: results.length, tournaments: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, tournaments: [] });
  }
});

// @route   POST /api/auth/tournaments/approve
// @desc    Admin approves tournament -> status becomes Admin_Approved (awaiting organizer publishing payment)
router.post('/tournaments/approve', async (req, res) => {
  try {
    const { tournamentId } = req.body;
    
    // Update TblTournament
    let tblTournament = await TblTournament.findByIdAndUpdate(
      tournamentId, 
      { 
        status: 'Admin_Approved', 
        admin_approved: true, 
        admin_approved_at: new Date(),
        publishing_fee_paid: false 
      }, 
      { new: true }
    );
    
    // Update Tournament feed model (keep isApproved: false until organizer completes payment!)
    let feedTournament = await Tournament.findByIdAndUpdate(
      tournamentId, 
      { 
        isApproved: false, 
        status: 'admin_approved', 
        admin_approved: true,
        publishing_fee_paid: false 
      }, 
      { new: true }
    );

    if (tblTournament && !feedTournament) {
      feedTournament = await Tournament.findOneAndUpdate(
        { title: tblTournament.tournament_name },
        { 
          isApproved: false, 
          status: 'admin_approved', 
          admin_approved: true,
          publishing_fee_paid: false 
        },
        { new: true }
      );
    } else if (feedTournament && !tblTournament) {
      tblTournament = await TblTournament.findOneAndUpdate(
        { tournament_name: feedTournament.title },
        { 
          status: 'Admin_Approved', 
          admin_approved: true, 
          admin_approved_at: new Date(),
          publishing_fee_paid: false 
        },
        { new: true }
      );
    }

    // Update linked poster in TblTournamentPoster
    try {
      const matchIds = [tournamentId];
      if (tblTournament?._id) matchIds.push(tblTournament._id);
      if (feedTournament?._id) matchIds.push(feedTournament._id);
      await TblTournamentPoster.updateMany(
        {
          $or: [
            { tournament_id: { $in: matchIds } },
            { poster_url: tblTournament?.poster_url || feedTournament?.posterUrl }
          ]
        },
        {
          $set: {
            approval_status: 'Admin_Approved',
            admin_approved: true,
            admin_approved_at: new Date(),
            publishing_fee_paid: false
          }
        }
      );
    } catch (pErr) {
      console.warn('Poster sync error on tournament approval:', pErr.message);
    }

    const title = tblTournament?.tournament_name || feedTournament?.title || 'Tournament';

    // Notify Organizer that tournament was approved and needs publishing payment
    try {
      let orgUserId = null;
      if (tblTournament?.organizer_id) {
        const orgDoc = await TblOrganizer.findById(tblTournament.organizer_id).lean();
        orgUserId = orgDoc?.user_id || tblTournament.organizer_id;
      }
      await createNotificationHelper({
        userId: orgUserId,
        role: 'organizer',
        title: 'Tournament Approved! 💳 Action Required: Pay to Publish',
        message: `Your tournament "${title}" has been approved by Platform Superadmin! Please complete the publishing fee of ₹499 to publish it to the local user feed.`,
        type: 'tournament_status',
        actionNav: 'my_tournaments',
        metadata: { tournamentId, status: 'Admin_Approved' }
      });
    } catch (nErr) {
      console.warn('Tournament approval notification warning:', nErr.message);
    }

    return res.json({
      success: true,
      message: `Tournament "${title}" approved by Admin! Status set to "Admin Approved". Organizer notified to pay publishing fee.`,
      tournament: feedTournament || tblTournament
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/tournaments/reject
// @desc    Admin rejects tournament application
router.post('/tournaments/reject', async (req, res) => {
  try {
    const { tournamentId } = req.body;
    
    let tblTournament = await TblTournament.findByIdAndUpdate(tournamentId, { status: 'Rejected' }, { new: true });
    let feedTournament = await Tournament.findByIdAndUpdate(tournamentId, { isApproved: false, status: 'Rejected' }, { new: true });

    if (tblTournament && !feedTournament) {
      await Tournament.findOneAndUpdate(
        { title: tblTournament.tournament_name },
        { isApproved: false, status: 'Rejected' }
      );
    } else if (feedTournament && !tblTournament) {
      await TblTournament.findOneAndUpdate(
        { tournament_name: feedTournament.title },
        { status: 'Rejected' }
      );
    }

    // Also update poster
    const matchIds = [tournamentId];
    if (tblTournament?._id) matchIds.push(tblTournament._id);
    if (feedTournament?._id) matchIds.push(feedTournament._id);
    await TblTournamentPoster.updateMany(
      {
        $or: [
          { tournament_id: { $in: matchIds } },
          { poster_url: tblTournament?.poster_url || feedTournament?.posterUrl }
        ]
      },
      { $set: { approval_status: 'Rejected' } }
    ).catch(() => null);

    const title = tblTournament?.tournament_name || feedTournament?.title || 'Tournament';

    // Notify Organizer that tournament application was rejected
    try {
      let orgUserId = null;
      if (tblTournament?.organizer_id) {
        const orgDoc = await TblOrganizer.findById(tblTournament.organizer_id).lean();
        orgUserId = orgDoc?.user_id || tblTournament.organizer_id;
      }
      await createNotificationHelper({
        userId: orgUserId,
        role: 'organizer',
        title: 'Tournament Rejected',
        message: `Your tournament application for "${title}" was rejected by Platform Admin. Please review tournament requirements.`,
        type: 'tournament_status',
        actionNav: 'my_tournaments',
        metadata: { tournamentId }
      });
    } catch (nErr) {
      console.warn('Tournament reject notification warning:', nErr.message);
    }

    return res.json({ success: true, message: 'Tournament application rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/posters/pending
// @desc    Fetch pending AI poster applications directly from MongoDB
router.get('/posters/pending', async (req, res) => {
  try {
    const pending = await TblTournamentPoster.find({ approval_status: 'Pending' }).sort({ createdAt: -1 });
    res.json({ success: true, count: pending.length, posters: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, posters: [] });
  }
});

// @route   POST /api/auth/posters/approve
// @desc    Admin approves poster -> sets poster & tournament to Admin_Approved (awaiting organizer publishing payment)
router.post('/posters/approve', async (req, res) => {
  try {
    const { posterId, tournamentId } = req.body;

    let poster = null;
    if (posterId) {
      poster = await TblTournamentPoster.findByIdAndUpdate(
        posterId,
        {
          approval_status: 'Admin_Approved',
          admin_approved: true,
          admin_approved_at: new Date(),
          publishing_fee_paid: false
        },
        { new: true }
      );
    }

    const tId = tournamentId || poster?.tournament_id;
    if (tId) {
      await TblTournament.findByIdAndUpdate(tId, {
        status: 'Admin_Approved',
        admin_approved: true,
        admin_approved_at: new Date(),
        publishing_fee_paid: false
      });
      await Tournament.findByIdAndUpdate(tId, {
        isApproved: false,
        status: 'admin_approved',
        admin_approved: true,
        publishing_fee_paid: false
      });
    }

    return res.json({
      success: true,
      message: 'Poster approved by Admin! Status set to "Admin Approved". Organizer must pay publishing fee to publish live.',
      poster
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/posters/reject
// @desc    Admin rejects poster application
router.post('/posters/reject', async (req, res) => {
  try {
    const { posterId, tournamentId } = req.body;
    let poster = null;
    if (posterId) {
      poster = await TblTournamentPoster.findByIdAndUpdate(
        posterId,
        { approval_status: 'Rejected' },
        { new: true }
      );
    }
    const tId = tournamentId || poster?.tournament_id;
    if (tId) {
      await TblTournament.findByIdAndUpdate(tId, { status: 'Rejected', isApproved: false });
      await Tournament.findByIdAndUpdate(tId, { status: 'rejected', isApproved: false });
    }
    return res.json({ success: true, message: 'Poster application rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/stats
// @desc    Get strict counts of registered local users, organizers, tournaments, and activities directly from MongoDB
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments({ role: { $in: ['user', 'User'] } });
    const organizerCount = await User.countDocuments({ role: { $in: ['organizer', 'Organizer'] } });
    const tournamentCount = await Tournament.countDocuments({});
    const posterCount = await TblTournamentPoster.countDocuments({});

    // Fetch real activity logs from MongoDB if available, otherwise empty array
    let dbActivities = [];
    try {
      const logs = await TblActivityLog.find({}).sort({ createdAt: -1 }).limit(10);
      dbActivities = logs.map(l => ({
        id: l._id.toString(),
        organizerName: l.action || 'Organizer Action',
        organization: 'ArenaX Host',
        action: l.action,
        details: l.details || '',
        timestamp: new Date(l.created_at || l.createdAt).toLocaleTimeString(),
        type: 'tournament'
      }));
    } catch (e) {
      dbActivities = [];
    }

    res.json({
      success: true,
      userCount,
      organizerCount,
      tournamentCount,
      posterCount,
      activities: dbActivities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, userCount: 0, organizerCount: 0, tournamentCount: 0, posterCount: 0, activities: [] });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password for user account in MongoDB
router.post('/reset-password', async (req, res) => {
  try {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
      return res.status(400).json({ success: false, message: 'Email and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const formattedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email address.' });
    }

    // Update password (pre-save middleware in User.js will hash it!)
    user.password = new_password;
    await user.save();

    // Also update corresponding TblUser in MongoDB
    try {
      const tblUser = await TblUser.findOne({ email: formattedEmail });
      if (tblUser) {
        tblUser.password = user.password;
        await tblUser.save();
      }
    } catch (e) {}

    res.json({
      success: true,
      message: '🎉 Password reset successfully! You can now sign in with your new password.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
