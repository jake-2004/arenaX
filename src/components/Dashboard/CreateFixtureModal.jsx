import React, { useState, useEffect } from 'react';
import { X, Shuffle, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Send, Trophy, Sparkles, RefreshCw } from 'lucide-react';
import { getTournamentRegistrationsAPI, publishFixturesAPI, getTournamentFixturesAPI } from '../../services/api';

export default function CreateFixtureModal({ tournament, onClose, onSuccess }) {
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState('');
  const [defaultDate, setDefaultDate] = useState(
    tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [defaultVenue, setDefaultVenue] = useState(tournament.location || 'Main Pitch');

  // Fetch registered teams and existing fixtures for tournament
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const tournId = tournament._id || tournament.id || tournament.tournament_id;

      const regsRes = await getTournamentRegistrationsAPI(tournId);
      let extractedTeams = [];
      if (regsRes && regsRes.success) {
        const regs = regsRes.registrations || [];
        extractedTeams = regs.map((r, i) => {
          const captainOrSoloPlayer = r.players?.[0]?.player_name;
          const displayTeamName = (r.team?.team_name && r.team.team_name !== 'Registered Team')
            ? r.team.team_name
            : (r.team_name && r.team_name !== 'Registered Team')
              ? r.team_name
              : (captainOrSoloPlayer || `Participant ${i + 1}`);
          return {
            id: r.team_id?._id || r.team_id || r._id || displayTeamName,
            name: displayTeamName
          };
        });
        setTeams(extractedTeams);
      }

      // Check if fixtures already exist in MongoDB
      const fixRes = await getTournamentFixturesAPI(tournId);
      if (fixRes && fixRes.success && fixRes.matches && fixRes.matches.length > 0) {
        setIsEditMode(true);
        const existingMatches = fixRes.matches.map((m, idx) => ({
          match_no: m.match_id || idx + 1,
          team1_name: m.team1_name,
          team1_id: m.team1_id,
          team2_name: m.team2_name,
          team2_id: m.team2_id,
          match_date: m.match_date || defaultDate,
          match_time: m.match_time || '10:00 AM',
          venue: m.venue || defaultVenue,
          round: m.round || 'Round 1 (Knockout)',
          ampm: m.match_time?.includes('PM') ? 'PM' : 'AM',
          time_val: m.match_time?.replace(/(AM|PM)/i, '').trim() || '10:00'
        }));
        setFixtures(existingMatches);
      } else {
        setIsEditMode(false);
        generateRandomFixtures(extractedTeams);
      }
      setLoading(false);
    };
    fetchData();
  }, [tournament]);

  // Fisher-Yates Random Shuffle & Pairing Algorithm
  const generateRandomFixtures = (teamsList = teams) => {
    if (teamsList.length < 2) {
      setFixtures([]);
      return;
    }

    const shuffled = [...teamsList].sort(() => Math.random() - 0.5);
    const generated = [];
    const numMatches = Math.floor(shuffled.length / 2);

    const times = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM', '08:00 PM'];
    const isChess = (tournament.sport || '').toLowerCase().includes('chess');
    const isBadminton = (tournament.sport || '').toLowerCase().includes('badminton') || (tournament.sport || '').toLowerCase().includes('tennis');

    for (let i = 0; i < numMatches; i++) {
      const team1 = shuffled[i * 2];
      const team2 = shuffled[i * 2 + 1];
      const assignedTime = times[i % times.length];
      const pitchNo = (i % 4) + 1;
      const venueLabel = isChess ? `Board ${pitchNo}` : isBadminton ? `Court ${pitchNo}` : `Pitch ${pitchNo}`;

      generated.push({
        match_no: i + 1,
        team1_name: team1.name,
        team1_id: team1.id,
        team2_name: team2.name,
        team2_id: team2.id,
        match_date: defaultDate,
        match_time: assignedTime,
        venue: `${defaultVenue} (${venueLabel})`,
        round: isChess ? 'Round 1 (Matchplay)' : 'Round 1 (Knockout)'
      });
    }

    setFixtures(generated);
  };

  const handleFixtureChange = (index, field, value) => {
    const updated = [...fixtures];
    updated[index][field] = value;
    setFixtures(updated);
  };

  const handleTimeValChange = (index, val) => {
    const updated = [...fixtures];
    const ampm = updated[index].ampm || (updated[index].match_time?.includes('PM') ? 'PM' : 'AM');
    updated[index].time_val = val;
    updated[index].ampm = ampm;
    updated[index].match_time = `${val.trim()} ${ampm}`;
    setFixtures(updated);
  };

  const handleAmPmChange = (index, newAmPm) => {
    const updated = [...fixtures];
    const timeVal = updated[index].time_val || updated[index].match_time?.replace(/(AM|PM)/i, '').trim() || '10:00';
    updated[index].time_val = timeVal;
    updated[index].ampm = newAmPm;
    updated[index].match_time = `${timeVal} ${newAmPm}`;
    setFixtures(updated);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (fixtures.length === 0) {
      setError('Please ensure at least 2 teams are registered to create fixtures.');
      return;
    }

    setPublishing(true);
    setError('');

    const tournId = tournament._id || tournament.id || tournament.tournament_id;
    const res = await publishFixturesAPI(tournId, fixtures);
    setPublishing(false);

    if (res && res.success) {
      if (onSuccess) onSuccess(res.matches);
      if (onClose) onClose();
    } else {
      setError(res?.message || 'Failed to publish tournament fixtures.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative border border-[#E5E7EB] my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#8B0000] via-[#700000] to-[#8B0000] p-6 text-white text-left relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-1.5 pr-10">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 w-fit">
              <Sparkles className="w-3 h-3" />
              <span>OFFICIAL FIXTURE CREATOR • {tournament.sport || 'Sports'}</span>
            </span>
            <h3 className="text-xl font-black text-white">{tournament.title || tournament.tournament_name}</h3>
            <p className="text-xs text-white/80">
              Randomly assign team pairings, manually set match dates, times, and venues, then publish to all registered local users.
            </p>
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1F2937]">
            <Trophy className="w-4 h-4 text-[#8B0000]" />
            <span>Registered Capacity: <span className="text-[#8B0000] font-black">{teams.length} Teams</span> ({fixtures.length} Matches)</span>
          </div>

          <button
            type="button"
            onClick={() => generateRandomFixtures()}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white text-xs font-black transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Re-shuffle Opponents Randomly</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePublish} className="p-6 overflow-y-auto space-y-4 flex-1 text-left custom-scrollbar">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#1F2937]">Preparing random team matchups...</p>
            </div>
          ) : fixtures.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-[#1F2937]">Insufficient Registered Teams</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                At least 2 registered teams are required to generate match fixtures. Currently registered: {teams.length} team(s).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-[#1F2937] uppercase tracking-wider">
                Randomized Match Pairings & Manual Schedule Editor ({fixtures.length} Round 1 Matches)
              </h4>

              <div className="space-y-3">
                {fixtures.map((f, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-md space-y-3 hover:border-[#8B0000]/40 transition-all">
                    
                    {/* Match Card Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#8B0000] text-white text-[10px] font-black uppercase tracking-wider">
                        Match #{f.match_no} • {f.round}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-400">Random Draw Pairing</span>
                    </div>

                    {/* Opponent Pairing Banner */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 border border-slate-200 flex items-center justify-between text-center">
                      <div className="w-2/5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Team A</span>
                        <h5 className="text-sm font-black text-[#1F2937] truncate">{f.team1_name}</h5>
                      </div>

                      <div className="w-1/5 text-xs font-black text-[#8B0000] bg-white px-2 py-1 rounded-lg border border-[#8B0000]/30 shadow-sm">
                        VS
                      </div>

                      <div className="w-2/5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Team B</span>
                        <h5 className="text-sm font-black text-[#1F2937] truncate">{f.team2_name}</h5>
                      </div>
                    </div>

                    {/* Manual Time, Date & Venue Input Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-extrabold text-[#1F2937] uppercase mb-1">Match Date *</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={f.match_date}
                            onChange={(e) => handleFixtureChange(idx, 'match_date', e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#8B0000]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-[#1F2937] uppercase mb-1">Match Time & Period *</label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            value={f.time_val !== undefined ? f.time_val : (f.match_time?.replace(/(AM|PM)/i, '').trim() || '10:00')}
                            onChange={(e) => handleTimeValChange(idx, e.target.value)}
                            placeholder="10:00"
                            required
                            className="w-2/3 px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#8B0000]"
                          />
                          <select
                            value={f.ampm || (f.match_time?.includes('PM') ? 'PM' : 'AM')}
                            onChange={(e) => handleAmPmChange(idx, e.target.value)}
                            className="w-1/3 px-2 py-2 rounded-xl bg-white border border-[#8B0000]/40 text-xs font-black text-[#8B0000] focus:outline-none focus:border-[#8B0000] cursor-pointer shadow-sm"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-[#1F2937] uppercase mb-1">Venue / Pitch *</label>
                        <input
                          type="text"
                          value={f.venue}
                          onChange={(e) => handleFixtureChange(idx, 'venue', e.target.value)}
                          placeholder="Pitch Name / Stadium"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#8B0000]"
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit / Publish Button */}
          {fixtures.length > 0 && (
            <div className="pt-4 border-t border-[#E5E7EB]">
              <button
                type="submit"
                disabled={publishing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B0000] via-[#700000] to-[#8B0000] text-white text-xs font-black hover:brightness-110 shadow-lg shadow-[#8B0000]/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {publishing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish Fixtures to Registered Teams & Local Users</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}
