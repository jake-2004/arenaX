const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Helper to safely parse JSON or extract HTML error message from server
const parseResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    return data;
  }
  const text = await res.text();
  return {
    success: false,
    message: res.statusText || text.replace(/<[^>]*>?/gm, '').trim().substring(0, 150) || `Server Error (${res.status})`
  };
};

// 1. Auth APIs
export const getGoogleAuthUrlAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/google/url`);
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const verifyGoogleAuthAPI = async (googleProfile) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/google/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleProfile)
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const registerUserAPI = async (userData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const loginUserAPI = async (credentials) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await parseResponse(res);
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 2. Tournament APIs
export const getTournamentsAPI = async (filters = {}) => {
  try {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE_URL}/tournaments?${query}`);
    return await parseResponse(res);
  } catch (error) {
    return { success: false, tournaments: [] };
  }
};

export const createTournamentAPI = async (tournamentData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tournaments/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tournamentData)
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getOrganizerTournamentsAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/tournaments/my-tournaments`, {
      headers: getAuthHeaders()
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, tournaments: [] };
  }
};

// 3. Team & Registration APIs
export const getPendingRegistrationsAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/registrations/pending`, { headers: getAuthHeaders() });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, registrations: [] };
  }
};

export const approveRegistrationAPI = async (regId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/registrations/${regId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const rejectRegistrationAPI = async (regId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/registrations/${regId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const verifyRosterDecisionsAPI = async (regId, playerDecisions) => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/registrations/${regId}/verify-roster`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ playerDecisions })
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getUserRegistrationsAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/my-registrations`, {
      headers: getAuthHeaders()
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, registrations: [] };
  }
};

export const getTournamentRegistrationsAPI = async (tournId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/registrations/tournament/${tournId}`, {
      headers: getAuthHeaders()
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, registrations: [] };
  }
};

export const updateDeclinedPlayerAPI = async (regId, formData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/teams/registrations/${regId}/update-player`, {
      method: 'POST',
      headers,
      body: formData
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const registerForTournamentAPI = async (tournament_id, team_name, sport, players = []) => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/register-tournament`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tournament_id, team_name, sport, players })
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const uploadTeamProofAPI = async (teamId, fileData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/upload-proof/${teamId}`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fileData // FormData
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const addPlayerToTeamAPI = async (teamId, formData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams/${teamId}/players`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData // FormData
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 4. Admin & Health APIs
export const checkHealthAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await parseResponse(res);
  } catch (error) {
    return { status: 'offline', mongodb: { status: 'Disconnected' } };
  }
};

export const getAdminStatsAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders()
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, stats: null };
  }
};

export const getPendingOrganizersAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/organizers/pending`);
    return await parseResponse(res);
  } catch (error) {
    return { success: false, organizers: [] };
  }
};

export const approveOrganizerAPI = async (userId, sendSms = true) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/organizers/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sendSms })
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: 'Network error approving organizer.' };
  }
};

export const getPendingPostersAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/posters/pending`);
    return await parseResponse(res);
  } catch (error) {
    return { success: false, posters: [] };
  }
};

export const getPendingTournamentsAPI = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/tournaments/pending`);
    return await parseResponse(res);
  } catch (error) {
    return { success: false, tournaments: [] };
  }
};

export const approveTournamentAPI = async (tournamentId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/tournaments/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId })
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: 'Network error approving tournament.' };
  }
};

export const rejectTournamentAPI = async (tournamentId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/tournaments/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId })
    });
    return await parseResponse(res);
  } catch (error) {
    return { success: false, message: 'Network error rejecting tournament.' };
  }
};
