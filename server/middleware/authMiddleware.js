import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { TblUser } from '../models/schemaModels.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'arenax_secret_key_2026';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (e) {
      decoded = jwt.verify(token, 'fallback_secret_for_dev_only');
    }
    
    req.user = decoded; // Contains id, role, email

    // If role is missing from legacy token payload, resolve role dynamically from DB
    if (!req.user.role && req.user.id) {
      const dbUser = (await User.findById(req.user.id).catch(() => null)) || (await TblUser.findById(req.user.id).catch(() => null));
      if (dbUser) {
        req.user.role = dbUser.role || 'organizer';
        req.user.email = dbUser.email;
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

export const requireRole = (...roles) => {
  const flatRoles = roles.flat().map(r => (typeof r === 'string' ? r.toLowerCase() : ''));
  return (req, res, next) => {
    const rawRole = (req.user?.role || '').toLowerCase();
    const isAllowed = flatRoles.some(r => 
      rawRole === r || 
      (r === 'organizer' && rawRole.includes('organizer')) ||
      (r === 'admin' && rawRole.includes('admin')) ||
      (r === 'user' && rawRole.includes('user'))
    );
    
    if (!req.user || !rawRole || !isAllowed) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
};


