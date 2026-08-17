export const MOCK_USER_PROFILES = {
  user: {
    id: "u_101",
    name: "Alex Mercer",
    email: "user@arenax.io",
    role: "user", // Local User
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    location: "London, UK",
    rank: "#12 Regional",
    xpPoints: 2480,
    favoriteSports: ["Football", "Cricket", "Basketball"],
    team: {
      name: "East End Eagles FC",
      role: "Captain",
      division: "Div 2 League",
      membersCount: 14,
      logo: "⚽"
    }
  },
  organizer: {
    id: "u_202",
    name: "Pro Sports League Admin",
    email: "organizer@arenax.io",
    role: "organizer", // Organizer
    organization: "London Elite Sports Org",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    hostedTournamentsCount: 18,
    activeTournamentsCount: 3,
    totalPrizeDistributed: "₹45,000",
    verificationStatus: "Verified Partner"
  },
  admin: {
    id: "u_303",
    name: "Platform SuperAdmin",
    email: "admin@arenax.io",
    role: "admin", // Admin
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
    permissions: ["Full Management", "Payment Approvals", "Poster Approvals", "User Moderation"]
  }
};

export const MOCK_TOURNAMENTS = [];

export const MOCK_LIVE_MATCHES = [];

export const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Live Match Alert",
    message: "East End Eagles need 8 runs in 16 balls to win!",
    time: "2 mins ago",
    unread: true,
    type: "match"
  },
  {
    id: "n2",
    title: "AI Location Recommendation",
    message: "New Football tournament 'London Elite Open 5v5' is 1.2 miles from your location!",
    time: "1 hour ago",
    unread: true,
    type: "ai"
  }
];
