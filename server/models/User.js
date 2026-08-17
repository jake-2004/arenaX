import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  },
  location: {
    type: String,
    default: 'London, UK'
  },
  favoriteSports: [{
    type: String
  }],
  teamName: {
    type: String,
    default: ''
  },
  organization: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  approvalStatus: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected'],
    default: 'Approved'
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  xpPoints: {
    type: Number,
    default: 100
  },
  rank: {
    type: String,
    default: '#99 Local'
  }
}, {
  timestamps: true
});

// Password Hashing pre-save middleware
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password Compare Method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
