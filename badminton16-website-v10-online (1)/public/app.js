const defaultTeams = [
  { slot: 'A1', id: 'A1', name: 'Falcon Smash', city: 'Hà Nội', group: 'A', member1: '', member2: '' },
  { slot: 'A2', id: 'A2', name: 'Thunder Shuttle', city: 'Hải Phòng', group: 'A', member1: '', member2: '' },
  { slot: 'A3', id: 'A3', name: 'Red Dragon BC', city: 'Bắc Ninh', group: 'A', member1: '', member2: '' },
  { slot: 'A4', id: 'A4', name: 'Capital Wings', city: 'Hà Nội', group: 'A', member1: '', member2: '' },
  { slot: 'B1', id: 'B1', name: 'Saigon Rackets', city: 'TP. Hồ Chí Minh', group: 'B', member1: '', member2: '' },
  { slot: 'B2', id: 'B2', name: 'Lotus Smashers', city: 'Bình Dương', group: 'B', member1: '', member2: '' },
  { slot: 'B3', id: 'B3', name: 'Southern Stars', city: 'Đồng Nai', group: 'B', member1: '', member2: '' },
  { slot: 'B4', id: 'B4', name: 'Firebird BC', city: 'TP. Hồ Chí Minh', group: 'B', member1: '', member2: '' },
  { slot: 'C1', id: 'C1', name: 'Danang Waves', city: 'Đà Nẵng', group: 'C', member1: '', member2: '' },
  { slot: 'C2', id: 'C2', name: 'Hue Imperial', city: 'Huế', group: 'C', member1: '', member2: '' },
  { slot: 'C3', id: 'C3', name: 'Central Force', city: 'Quảng Nam', group: 'C', member1: '', member2: '' },
  { slot: 'C4', id: 'C4', name: 'Coastal Eagles', city: 'Quảng Ngãi', group: 'C', member1: '', member2: '' },
  { slot: 'D1', id: 'D1', name: 'Mekong Warriors', city: 'Cần Thơ', group: 'D', member1: '', member2: '' },
  { slot: 'D2', id: 'D2', name: 'Westside Smash', city: 'An Giang', group: 'D', member1: '', member2: '' },
  { slot: 'D3', id: 'D3', name: 'Delta Power', city: 'Vĩnh Long', group: 'D', member1: '', member2: '' },
  { slot: 'D4', id: 'D4', name: 'River Hawks', city: 'Đồng Tháp', group: 'D', member1: '', member2: '' }
];

function normalizeTeam(team = {}, fallback = {}) {
  return {
    slot: team.slot || fallback.slot || '',
    id: team.id || fallback.id || '',
    name: team.name || fallback.name || '',
    city: team.city || fallback.city || '',
    group: team.group || fallback.group || '',
    member1: team.member1 || '',
    member2: team.member2 || ''
  };
}

const TEAM_STORAGE_KEY = 'ktv_badmiton_teams_v1';
let teams = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(TEAM_STORAGE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length === 16) {
      return defaultTeams.map((team) => normalizeTeam(saved.find((item) => item.slot === team.slot) || {}, team));
    }
  } catch (_) {}
  return defaultTeams.map((team) => normalizeTeam(team));
})();

function saveTeams() {
  try { localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teams)); } catch (_) {}
  queueSharedStateSave();
}

const SLOT_STORAGE_KEY = 'ktv_badminton_bracket_slots_v1';
const SLOT_GROUPS = [
  { title: 'Nhánh Thắng A • Tứ kết', codes: ['A1','A2','A3','A4','A5','A6','A7','A8'] },
  { title: 'Nhánh Thua B • Tứ kết', codes: ['B1','B2','B3','B4','B5','B6','B7','B8'] },
  { title: 'Nhánh A • Bán kết', codes: ['BK_A1','BK_A2','BK_A3','BK_A4'] },
  { title: 'Nhánh B • Bán kết', codes: ['BK_B1','BK_B2','BK_B3','BK_B4'] },
  { title: 'Chung kết nhánh', codes: ['CK_A1','CK_A2','CK_B1','CK_B2'] },
  { title: 'Vô địch', codes: ['CHAMP_A','CHAMP_B','GRAND_CHAMP'] }
];
const EDITABLE_SLOT_CODES = new Set(SLOT_GROUPS.flatMap((group) => group.codes));
const SLOT_LABELS = {
  CHAMP_A: 'Vô địch Nhánh A',
  CHAMP_B: 'Vô địch Nhánh B',
  GRAND_CHAMP: 'Nhà vô địch giải'
};

let slotAssignments = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(SLOT_STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch (_) {
    return {};
  }
})();

function saveSlotAssignments() {
  try { localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(slotAssignments)); } catch (_) {}
  queueSharedStateSave();
}

function slotLabel(code) {
  return SLOT_LABELS[code] || code;
}

function normalizeCompetitionToken(token) {
  if (token === 'VÔ ĐỊCH NHÁNH A') return 'CHAMP_A';
  if (token === 'VÔ ĐỊCH NHÁNH B') return 'CHAMP_B';
  if (token === '🏆 NHÀ VÔ ĐỊCH GIẢI') return 'GRAND_CHAMP';
  return token;
}

function getSlotAssignment(code) {
  return slotAssignments[code] || {};
}

function slotInfo(code) {
  const assignment = getSlotAssignment(code);
  const linkedTeam = assignment.teamSlot ? teamBySlot(assignment.teamSlot) : null;
  const customName = String(assignment.customName || '').trim();
  const name = customName || linkedTeam?.name || '';
  const member1 = String(assignment.member1 || '').trim() || linkedTeam?.member1 || '';
  const member2 = String(assignment.member2 || '').trim() || linkedTeam?.member2 || '';
  const note = String(assignment.note || '').trim();
  return {
    code,
    label: slotLabel(code),
    assigned: Boolean(name || assignment.teamSlot || member1 || member2 || note),
    teamSlot: assignment.teamSlot || '',
    name,
    member1,
    member2,
    note
  };
}

function slotParticipantHtml(code, mode = 'inline') {
  const info = slotInfo(code);
  const members = [info.member1, info.member2].filter(Boolean).join(' • ');
  const name = info.name || 'Chưa xác định';
  const detail = [members, info.note].filter(Boolean).join(' — ');
  return `<button type="button" class="editable-participant ${info.assigned ? 'assigned' : ''} ${mode}" data-edit-slot="${escapeHtml(code)}" title="Bấm để chỉnh ${escapeHtml(slotLabel(code))}"><span class="participant-code">${escapeHtml(slotLabel(code))}</span><strong>${escapeHtml(name)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}<i>✎</i></button>`;
}

function teamParticipantHtml(position, mode = 'inline') {
  const team = teamAt(position);
  const members = [team.member1, team.member2].filter(Boolean).join(' • ');
  return `<button type="button" class="editable-participant team-source ${mode}" data-edit-team-direct="${escapeHtml(team.slot)}" title="Bấm để chỉnh đội"><span class="participant-code">${escapeHtml(team.id)}</span><strong>${escapeHtml(team.name)}</strong>${members ? `<small>${escapeHtml(members)}</small>` : ''}<i>✎</i></button>`;
}

function participantHtml(token, mode = 'inline') {
  if (!token) return '';
  if (token.startsWith('team:')) {
    return teamParticipantHtml(Number(token.split(':')[1]), mode);
  }
  const normalized = normalizeCompetitionToken(token);
  if (EDITABLE_SLOT_CODES.has(normalized)) return slotParticipantHtml(normalized, mode);
  return `<span class="plain-participant">${escapeHtml(token)}</span>`;
}

function teamBySlot(slot) {
  return teams.find((team) => team.slot === slot) || normalizeTeam(defaultTeams.find((team) => team.slot === slot));
}

function teamAt(position) {
  return teams[position - 1] || { id: `Đ${position}`, name: `Đội ${position}`, city: '', member1: '', member2: '' };
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}


const tournamentStages = [
  { key: 'round1', number: '01', title: 'Vòng 1', subtitle: 'Loại trực tiếp tổng', matches: 8, courts: 3, time: '07:30 – 08:00', note: 'Thắng → Nhánh A • Thua → Nhánh B' },
  { key: 'round2', number: '02', title: 'Vòng 2', subtitle: 'Tứ kết Nhánh A & B', matches: 8, courts: 3, time: '08:15 – 09:30', note: '4 trận Nhánh A + 4 trận Nhánh B' },
  { key: 'round3', number: '03', title: 'Vòng 3', subtitle: 'Bán kết & Chung kết nhánh', matches: 6, courts: 3, time: '09:45 – 11:30', note: '4 bán kết + 2 chung kết nhánh' },
  { key: 'round4', number: '04', title: 'Vòng 4', subtitle: 'Chung kết tổng', matches: 1, courts: 1, time: '13:30 – 14:00', note: 'Vô địch Nhánh A vs Vô địch Nhánh B' }
];

const fixtures = [
  { round:'round1', phase:'Lượt 1', court:'Sân 1', home:'team:1', away:'team:2', outcome:'A1 / B1' },
  { round:'round1', phase:'Lượt 1', court:'Sân 2', home:'team:3', away:'team:4', outcome:'A2 / B2' },
  { round:'round1', phase:'Lượt 1', court:'Sân 3', home:'team:5', away:'team:6', outcome:'A3 / B3' },
  { round:'round1', phase:'Lượt 2', court:'Sân 1', home:'team:7', away:'team:8', outcome:'A4 / B4' },
  { round:'round1', phase:'Lượt 2', court:'Sân 2', home:'team:9', away:'team:10', outcome:'A5 / B5' },
  { round:'round1', phase:'Lượt 2', court:'Sân 3', home:'team:11', away:'team:12', outcome:'A6 / B6' },
  { round:'round1', phase:'Lượt 3', court:'Sân 1', home:'team:13', away:'team:14', outcome:'A7 / B7' },
  { round:'round1', phase:'Lượt 3', court:'Sân 2', home:'team:15', away:'team:16', outcome:'A8 / B8' },
  { round:'round1', phase:'Lượt 3', court:'Sân 3', home:'NGHỈ', away:'', outcome:'' },

  { round:'round2', phase:'Lượt 1', court:'Sân 1', home:'A1', away:'A2', outcome:'BK_A1' },
  { round:'round2', phase:'Lượt 1', court:'Sân 2', home:'A3', away:'A4', outcome:'BK_A2' },
  { round:'round2', phase:'Lượt 1', court:'Sân 3', home:'A5', away:'A6', outcome:'BK_A3' },
  { round:'round2', phase:'Lượt 2', court:'Sân 1', home:'A7', away:'A8', outcome:'BK_A4' },
  { round:'round2', phase:'Lượt 2', court:'Sân 2', home:'B1', away:'B2', outcome:'BK_B1' },
  { round:'round2', phase:'Lượt 2', court:'Sân 3', home:'B3', away:'B4', outcome:'BK_B2' },
  { round:'round2', phase:'Lượt 3', court:'Sân 1', home:'B5', away:'B6', outcome:'BK_B3' },
  { round:'round2', phase:'Lượt 3', court:'Sân 2', home:'B7', away:'B8', outcome:'BK_B4' },
  { round:'round2', phase:'Lượt 3', court:'Sân 3', home:'NGHỈ', away:'', outcome:'' },

  { round:'round3', phase:'Đợt 1 • Lượt 1', court:'Sân 1', home:'BK_A1', away:'BK_A2', outcome:'CK_A1' },
  { round:'round3', phase:'Đợt 1 • Lượt 1', court:'Sân 2', home:'BK_A3', away:'BK_A4', outcome:'CK_A2' },
  { round:'round3', phase:'Đợt 1 • Lượt 1', court:'Sân 3', home:'BK_B1', away:'BK_B2', outcome:'CK_B1' },
  { round:'round3', phase:'Đợt 1 • Lượt 2', court:'Sân 1', home:'BK_B3', away:'BK_B4', outcome:'CK_B2' },
  { round:'round3', phase:'Đợt 1 • Lượt 2', court:'Sân 2', home:'NGHỈ', away:'', outcome:'' },
  { round:'round3', phase:'Đợt 1 • Lượt 2', court:'Sân 3', home:'NGHỈ', away:'', outcome:'' },
  { round:'round3', phase:'Đợt 2 • Chung kết nhánh', court:'Sân 1', home:'CK_A1', away:'CK_A2', outcome:'VÔ ĐỊCH NHÁNH A' },
  { round:'round3', phase:'Đợt 2 • Chung kết nhánh', court:'Sân 2', home:'CK_B1', away:'CK_B2', outcome:'VÔ ĐỊCH NHÁNH B' },
  { round:'round3', phase:'Đợt 2 • Chung kết nhánh', court:'Sân 3', home:'NGHỈ', away:'', outcome:'' },

  { round:'round4', phase:'Chung kết tổng', court:'Sân 1', home:'VÔ ĐỊCH NHÁNH A', away:'VÔ ĐỊCH NHÁNH B', outcome:'🏆 NHÀ VÔ ĐỊCH GIẢI' }
];

const colors = ['#c9ff3b', '#8c6cff', '#ffb23d', '#43d6c5', '#ff6978', '#77a6ff'];

function badge(name, i = 0) {
  const safeName = String(name || 'Đội');
  const initials = safeName.split(' ').filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  return `<span class="badge" style="background:${colors[i % colors.length]}22;color:${colors[i % colors.length]}">${escapeHtml(initials || 'Đ')}</span>`;
}

function memberDisplay(team) {
  const members = [team.member1, team.member2].map((item) => String(item || '').trim()).filter(Boolean);
  if (!members.length) return '<span class="team-members-empty">Chưa cập nhật thành viên</span>';
  return members.map((member) => `<span class="member-chip">${escapeHtml(member)}</span>`).join('');
}

function renderTeams(q = '') {
  const keyword = q.toLowerCase().trim();
  document.getElementById('teamsGrid').innerHTML = teams
    .map((t, sourceIndex) => ({ t, sourceIndex }))
    .filter(({ t }) => `${t.name} ${t.city} ${t.id} ${t.member1 || ''} ${t.member2 || ''}`.toLowerCase().includes(keyword))
    .map(({ t, sourceIndex }) => `
      <article class="team-card">
        <div class="team-card-head">
          <div class="team-logo">${escapeHtml(t.id)}</div>
          <div class="team-card-actions"><span class="group-label">VỊ TRÍ ${String(sourceIndex + 1).padStart(2, '0')}</span><button class="team-edit-btn" data-edit-team="${escapeHtml(t.slot)}">✎ Chỉnh sửa</button></div>
        </div>
        <h4>${escapeHtml(t.name)}</h4>
        <p>📍 ${escapeHtml(t.city)}</p>
        <div class="team-members"><span class="team-members-label">THÀNH VIÊN</span><div class="team-members-list">${memberDisplay(t)}</div></div>
      </article>`)
    .join('');

  document.querySelectorAll('[data-edit-team]').forEach((button) => {
    button.addEventListener('click', () => openTeamEditor(button.dataset.editTeam));
  });
}

function renderPreview() {
  document.getElementById('groupPreview').innerHTML = tournamentStages.map((stage) => `
    <article class="stage-card ${stage.key}">
      <div class="stage-number">${stage.number}</div>
      <span>${escapeHtml(stage.time)}</span>
      <h4>${escapeHtml(stage.title)}</h4>
      <b>${escapeHtml(stage.subtitle)}</b>
      <p>${stage.matches} trận • ${stage.courts} sân</p>
      <small>${escapeHtml(stage.note)}</small>
    </article>`).join('');
}

function formatMatchRow(label, home, away, outcome, branch = '') {
  return `<div class="format-match-row ${branch}"><span class="format-code">${escapeHtml(label)}</span><div class="format-player">${participantHtml(home, 'format')}</div><i>vs</i><div class="format-player">${participantHtml(away, 'format')}</div><span class="format-arrow">→ ${escapeHtml(outcome)}</span></div>`;
}

function renderStandings() {
  const round1Rows = Array.from({ length: 8 }, (_, i) => {
    return formatMatchRow(`Trận ${i + 1}`, `team:${i * 2 + 1}`, `team:${i * 2 + 2}`, `A${i + 1} / B${i + 1}`);
  }).join('');

  const round2A = [1, 2, 3, 4].map((n, i) => formatMatchRow(`A_TK${n}`, `A${i * 2 + 1}`, `A${i * 2 + 2}`, `BK_A${n}`, 'branch-a-row')).join('');
  const round2B = [1, 2, 3, 4].map((n, i) => formatMatchRow(`B_TK${n}`, `B${i * 2 + 1}`, `B${i * 2 + 2}`, `BK_B${n}`, 'branch-b-row')).join('');

  document.getElementById('standingsGrid').innerHTML = `
    <article class="format-card round-one-card">
      <div class="format-card-head green"><span>VÒNG 1</span><b>LOẠI TRỰC TIẾP TỔNG • 8 TRẬN</b></div>
      <div class="format-card-body">${round1Rows}</div>
      <div class="format-branches"><span class="branch-a-pill">A • 8 đội thắng</span><span class="branch-b-pill">B • 8 đội thua</span></div>
    </article>
    <article class="format-card">
      <div class="format-card-head blue"><span>VÒNG 2</span><b>TỨ KẾT NHÁNH • 8 TRẬN</b></div>
      <div class="format-subhead branch-a-title">NHÁNH THẮNG A</div>
      <div class="format-card-body">${round2A}</div>
      <div class="format-subhead branch-b-title">NHÁNH THUA B</div>
      <div class="format-card-body">${round2B}</div>
    </article>
    <article class="format-card">
      <div class="format-card-head purple"><span>VÒNG 3</span><b>BÁN KẾT & CHUNG KẾT NHÁNH • 6 TRẬN</b></div>
      <div class="format-subhead">ĐỢT 1 • BÁN KẾT NHÁNH</div>
      <div class="format-card-body">
        ${formatMatchRow('BK A1', 'BK_A1', 'BK_A2', 'CK_A1', 'branch-a-row')}
        ${formatMatchRow('BK A2', 'BK_A3', 'BK_A4', 'CK_A2', 'branch-a-row')}
        ${formatMatchRow('BK B1', 'BK_B1', 'BK_B2', 'CK_B1', 'branch-b-row')}
        ${formatMatchRow('BK B2', 'BK_B3', 'BK_B4', 'CK_B2', 'branch-b-row')}
      </div>
      <div class="format-subhead">ĐỢT 2 • CHUNG KẾT NHÁNH</div>
      <div class="format-card-body">
        ${formatMatchRow('CK A', 'CK_A1', 'CK_A2', 'Vô địch Nhánh A', 'branch-a-row')}
        ${formatMatchRow('CK B', 'CK_B1', 'CK_B2', 'Vô địch Nhánh B', 'branch-b-row')}
      </div>
    </article>
    <article class="format-card final-format-card">
      <div class="format-card-head orange"><span>VÒNG 4</span><b>CHUNG KẾT TỔNG • 1 TRẬN</b></div>
      <div class="grand-final-format editable-final-format"><div class="final-slot-a">${slotParticipantHtml('CHAMP_A','final')}</div><strong>VS</strong><div class="final-slot-b">${slotParticipantHtml('CHAMP_B','final')}</div><div>↓</div><div class="final-slot-champion">${slotParticipantHtml('GRAND_CHAMP','champion')}</div></div>
    </article>`;
}

function resolveEntrant(token) {
  if (!token) return '';
  if (token.startsWith('team:')) {
    const position = Number(token.split(':')[1]);
    const team = teamAt(position);
    return `${team.id} • ${team.name}`;
  }
  const normalized = normalizeCompetitionToken(token);
  if (EDITABLE_SLOT_CODES.has(normalized)) {
    const info = slotInfo(normalized);
    return info.name ? `${slotLabel(normalized)} • ${info.name}` : slotLabel(normalized);
  }
  return token;
}

function renderScheduleTimeline() {
  const el = document.getElementById('scheduleTimeline');
  if (!el) return;
  el.innerHTML = tournamentStages.map((stage) => `<article class="timeline-stage ${stage.key}"><span>${escapeHtml(stage.time)}</span><b>${escapeHtml(stage.title)}</b><small>${stage.matches} trận • ${stage.courts} sân</small></article>`).join('');
}

function renderSchedule(filter = 'all') {
  const rounds = filter === 'all' ? tournamentStages : tournamentStages.filter((stage) => stage.key === filter);
  document.getElementById('scheduleList').innerHTML = rounds.map((stage) => {
    const matches = fixtures.filter((item) => item.round === stage.key);
    const phases = [...new Set(matches.map((item) => item.phase))];
    return `<section class="round-schedule-block">
      <div class="round-schedule-head"><div><span>${escapeHtml(stage.time)}</span><h4>${escapeHtml(stage.title)} • ${escapeHtml(stage.subtitle)}</h4></div><b>${stage.matches} TRẬN</b></div>
      ${phases.map((phase) => `<div class="schedule-phase"><h5>${escapeHtml(phase)}</h5><div class="court-grid">${matches.filter((item) => item.phase === phase).map((m) => {
        const isRest = m.home === 'NGHỈ';
        return `<article class="court-match ${isRest ? 'rest-match' : ''}"><span class="court-label">🏸 ${escapeHtml(m.court)}</span>${isRest ? '<strong>NGHỈ</strong>' : `<div class="court-versus"><div>${participantHtml(m.home, 'schedule')}</div><i>VS</i><div>${participantHtml(m.away, 'schedule')}</div></div><small>→ ${escapeHtml(m.outcome)}</small>`}</article>`;
      }).join('')}</div></div>`).join('')}
    </section>`;
  }).join('');
}

function branchMatch(home, away, outcome, tone = 'a') {
  return `<div class="branch-match ${tone}"><div><div>${participantHtml(home, 'branch')}</div><b>VS</b><div>${participantHtml(away, 'branch')}</div></div><small>→ ${escapeHtml(outcome)}</small></div>`;
}

function renderBracket() {
  document.getElementById('bracketWrap').innerHTML = `
    <div class="round1-qualification">
      <div><span>VÒNG 1</span><b>8 trận phân nhánh</b><small>Thắng → A • Thua → B</small></div>
      <div class="qualification-slots">${Array.from({ length: 8 }, (_, i) => `<button type="button" data-edit-slot="A${i + 1}" title="Chỉnh A${i + 1}">A${i + 1}</button><button type="button" class="bslot" data-edit-slot="B${i + 1}" title="Chỉnh B${i + 1}">B${i + 1}</button>`).join('')}</div>
    </div>
    <div class="dual-branch-grid">
      <section class="branch-panel branch-a-panel">
        <div class="branch-panel-head"><span>A</span><div><b>NHÁNH THẮNG</b><small>8 đội thắng Vòng 1</small></div></div>
        <div class="branch-round-title">TỨ KẾT</div>
        <div class="branch-match-grid">
          ${branchMatch('A1','A2','BK_A1','a')}${branchMatch('A3','A4','BK_A2','a')}${branchMatch('A5','A6','BK_A3','a')}${branchMatch('A7','A8','BK_A4','a')}
        </div>
        <div class="branch-round-title">BÁN KẾT</div>
        <div class="branch-match-grid two">${branchMatch('BK_A1','BK_A2','CK_A1','a')}${branchMatch('BK_A3','BK_A4','CK_A2','a')}</div>
        <div class="branch-round-title">CHUNG KẾT NHÁNH A</div>
        ${branchMatch('CK_A1','CK_A2','🏆 VÔ ĐỊCH NHÁNH A','a')}
      </section>
      <section class="branch-panel branch-b-panel">
        <div class="branch-panel-head"><span>B</span><div><b>NHÁNH THUA</b><small>8 đội thua Vòng 1</small></div></div>
        <div class="branch-round-title">TỨ KẾT</div>
        <div class="branch-match-grid">
          ${branchMatch('B1','B2','BK_B1','b')}${branchMatch('B3','B4','BK_B2','b')}${branchMatch('B5','B6','BK_B3','b')}${branchMatch('B7','B8','BK_B4','b')}
        </div>
        <div class="branch-round-title">BÁN KẾT</div>
        <div class="branch-match-grid two">${branchMatch('BK_B1','BK_B2','CK_B1','b')}${branchMatch('BK_B3','BK_B4','CK_B2','b')}</div>
        <div class="branch-round-title">CHUNG KẾT NHÁNH B</div>
        ${branchMatch('CK_B1','CK_B2','🏆 VÔ ĐỊCH NHÁNH B','b')}
      </section>
    </div>
    <section class="grand-final-panel"><span>VÒNG 4 • SÂN 1</span><h3>CHUNG KẾT TỔNG</h3><div class="grand-final-versus"><div class="final-a">${slotParticipantHtml('CHAMP_A','final')}</div><strong>VS</strong><div class="final-b">${slotParticipantHtml('CHAMP_B','final')}</div></div><div class="final-trophy">🏆<div>${slotParticipantHtml('GRAND_CHAMP','champion')}</div></div></section>`;
}

function renderHeroTeamNames() {
  const team1 = teamAt(1);
  const team2 = teamAt(2);
  const a1El = document.getElementById('heroTeamA1');
  const b1El = document.getElementById('heroTeamB1');
  if (a1El) a1El.textContent = team1.name;
  if (b1El) b1El.textContent = team2.name;
}

function renderAllTeamViews() {
  const searchValue = document.getElementById('teamSearch')?.value || '';
  renderTeams(searchValue);
  renderPreview();
  renderStandings();
  renderSchedule(document.querySelector('.filter.active')?.dataset.filter || 'all');
  renderScheduleTimeline();
  renderBracket();
  renderHeroTeamNames();
  renderSlotManager();
  if (document.getElementById('inputLt1')) {
    fillDrawInputs(getDefaultLt1Items(), getDefaultLt2Items(), getDefaultPositionItems());
  }
}

function populateSlotTeamSelect(selected = '') {
  const select = document.getElementById('editSlotTeam');
  if (!select) return;
  select.innerHTML = '<option value="">— Chưa xác định / nhập thủ công —</option>' + teams.map((team, index) => `<option value="${escapeHtml(team.slot)}" ${team.slot === selected ? 'selected' : ''}>Vị trí ${String(index + 1).padStart(2, '0')} • ${escapeHtml(team.id)} • ${escapeHtml(team.name)}</option>`).join('');
}

function updateSlotEditPreview() {
  const code = document.getElementById('editSlotCode')?.value || '';
  if (!code) return;
  const teamSlot = document.getElementById('editSlotTeam').value;
  const linkedTeam = teamSlot ? teamBySlot(teamSlot) : null;
  const customName = document.getElementById('editSlotCustomName').value.trim();
  const member1 = document.getElementById('editSlotMember1').value.trim() || linkedTeam?.member1 || '';
  const member2 = document.getElementById('editSlotMember2').value.trim() || linkedTeam?.member2 || '';
  const note = document.getElementById('editSlotNote').value.trim();
  const displayName = customName || linkedTeam?.name || 'Chưa xác định';
  const preview = document.getElementById('slotEditPreview');
  preview.innerHTML = `<span>${escapeHtml(slotLabel(code))}</span><strong>${escapeHtml(displayName)}</strong><small>${escapeHtml([member1, member2].filter(Boolean).join(' • ') || 'Chưa có thành viên')}</small>${note ? `<em>${escapeHtml(note)}</em>` : ''}`;
}

function openSlotEditor(code) {
  const normalized = normalizeCompetitionToken(code);
  if (!EDITABLE_SLOT_CODES.has(normalized)) return;
  const assignment = getSlotAssignment(normalized);
  document.getElementById('editSlotCode').value = normalized;
  document.getElementById('slotEditTitle').textContent = `Vị trí ${slotLabel(normalized)}`;
  populateSlotTeamSelect(assignment.teamSlot || '');
  document.getElementById('editSlotCustomName').value = assignment.customName || '';
  document.getElementById('editSlotMember1').value = assignment.member1 || '';
  document.getElementById('editSlotMember2').value = assignment.member2 || '';
  document.getElementById('editSlotNote').value = assignment.note || '';
  updateSlotEditPreview();
  const modal = document.getElementById('slotEditModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeSlotEditor() {
  const modal = document.getElementById('slotEditModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function saveSlotEdit(event) {
  event.preventDefault();
  const code = document.getElementById('editSlotCode').value;
  if (!EDITABLE_SLOT_CODES.has(code)) return;
  const next = {
    teamSlot: document.getElementById('editSlotTeam').value,
    customName: document.getElementById('editSlotCustomName').value.trim(),
    member1: document.getElementById('editSlotMember1').value.trim(),
    member2: document.getElementById('editSlotMember2').value.trim(),
    note: document.getElementById('editSlotNote').value.trim()
  };
  if (!Object.values(next).some(Boolean)) delete slotAssignments[code];
  else slotAssignments[code] = next;
  saveSlotAssignments();
  renderAllTeamViews();
  closeSlotEditor();
}

function clearCurrentSlotAssignment() {
  const code = document.getElementById('editSlotCode').value;
  if (!code) return;
  delete slotAssignments[code];
  saveSlotAssignments();
  renderAllTeamViews();
  closeSlotEditor();
}

function renderSlotManager() {
  const container = document.getElementById('slotManagerGroups');
  if (!container) return;
  container.innerHTML = SLOT_GROUPS.map((group) => `<section class="slot-manager-group"><h4>${escapeHtml(group.title)}</h4><div class="slot-manager-grid">${group.codes.map((code) => {
    const info = slotInfo(code);
    const members = [info.member1, info.member2].filter(Boolean).join(' • ');
    return `<button type="button" class="slot-manager-item ${info.assigned ? 'assigned' : ''}" data-edit-slot="${escapeHtml(code)}"><span>${escapeHtml(slotLabel(code))}</span><b>${escapeHtml(info.name || 'Chưa xác định')}</b><small>${escapeHtml(members || info.note || 'Bấm để thêm đội')}</small></button>`;
  }).join('')}</div></section>`).join('');
  const assignedCount = Object.keys(slotAssignments).filter((code) => EDITABLE_SLOT_CODES.has(code) && slotInfo(code).assigned).length;
  const status = document.getElementById('slotManagerStatus');
  if (status) status.textContent = `${assignedCount}/${EDITABLE_SLOT_CODES.size} vị trí đã có dữ liệu`;
}

function openSlotManager() {
  renderSlotManager();
  const modal = document.getElementById('slotManagerModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeSlotManager() {
  const modal = document.getElementById('slotManagerModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function resetAllSlotAssignments() {
  if (!confirm('Xóa toàn bộ đội đã gán trong Nhánh A/B, bán kết, chung kết và vô địch? Danh sách 16 đội ban đầu không bị xóa.')) return;
  slotAssignments = {};
  saveSlotAssignments();
  renderAllTeamViews();
  renderSlotManager();
}

function openTeamEditor(slot) {
  const team = teamBySlot(slot);
  if (!team) return;
  document.getElementById('editTeamOriginalId').value = slot;
  document.getElementById('editTeamId').value = team.id;
  document.getElementById('editTeamName').value = team.name;
  document.getElementById('editTeamCity').value = team.city;
  document.getElementById('editTeamGroup').value = `Vị trí ${String(teams.findIndex((item) => item.slot === slot) + 1).padStart(2, '0')}`;
  document.getElementById('editMember1').value = team.member1 || '';
  document.getElementById('editMember2').value = team.member2 || '';
  document.getElementById('teamEditTitle').textContent = `Chỉnh sửa ${team.id} • ${team.name}`;
  const modal = document.getElementById('teamEditModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('editTeamName').focus(), 30);
}

function closeTeamEditor() {
  const modal = document.getElementById('teamEditModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function saveTeamEdit(event) {
  event.preventDefault();
  const slot = document.getElementById('editTeamOriginalId').value;
  const teamIndex = teams.findIndex((team) => team.slot === slot);
  if (teamIndex < 0) return;

  const id = document.getElementById('editTeamId').value.trim().toUpperCase();
  const name = document.getElementById('editTeamName').value.trim();
  const city = document.getElementById('editTeamCity').value.trim();
  const group = teams[teamIndex].group;
  const member1 = document.getElementById('editMember1').value.trim();
  const member2 = document.getElementById('editMember2').value.trim();

  if (!id || !name || !city) {
    alert('Vui lòng nhập đầy đủ mã đội, tên đội và khu vực/đơn vị.');
    return;
  }

  const duplicate = teams.some((team, index) => index !== teamIndex && team.id.toUpperCase() === id);
  if (duplicate) {
    alert('Mã đội này đang được sử dụng. Hãy chọn mã khác.');
    return;
  }

  teams[teamIndex] = { ...teams[teamIndex], id, name, city, group, member1, member2 };
  saveTeams();
  renderAllTeamViews();
  closeTeamEditor();
}

function resetTeamsToDefault() {
  if (!confirm('Khôi phục toàn bộ 16 đội về dữ liệu mẫu ban đầu?')) return;
  teams = defaultTeams.map((team) => normalizeTeam(team));
  saveTeams();
  renderAllTeamViews();
}


class SpinWheel {
  constructor({ canvasId, resultId, countId, buttonId, centerLabel, items, accent = '#c9ff3b', countSuffix = 'tên' }) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.resultEl = document.getElementById(resultId);
    this.countEl = document.getElementById(countId);
    this.button = document.getElementById(buttonId);
    this.centerLabel = centerLabel;
    this.baseItems = [...items];
    this.items = [...items];
    this.rotation = 0;
    this.accent = accent;
    this.countSuffix = countSuffix;
    this.isSpinning = false;

    this.palette = ['#173465', '#f37615', '#7b5cff', '#1fb9aa', '#f34a6a', '#7dbf30', '#3257a8', '#ff9a3d'];
    this.button?.addEventListener('click', () => this.spin());
    this.updateCount();
    this.draw();
  }

  updateCount() {
    this.countEl.textContent = `${this.items.length} ${this.countSuffix}`;
  }

  reset() {
    this.items = [...this.baseItems];
    this.rotation = 0;
    this.isSpinning = false;
    this.resultEl.textContent = 'Đang chờ';
    this.updateCount();
    this.draw();
  }

  setItems(newItems) {
    this.baseItems = [...newItems];
    this.items = [...newItems];
    this.rotation = 0;
    this.isSpinning = false;
    this.resultEl.textContent = 'Đang chờ';
    this.updateCount();
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const size = this.canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 14;

    ctx.clearRect(0, 0, size, size);

    if (!this.items.length) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f3f7';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 62, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = this.accent;
      ctx.stroke();

      ctx.fillStyle = '#7c8799';
      ctx.font = '700 20px "Be Vietnam Pro"';
      ctx.textAlign = 'center';
      ctx.fillText('HẾT DỮ LIỆU', cx, cy + 7);
      return;
    }

    const sliceAngle = (Math.PI * 2) / this.items.length;
    for (let i = 0; i < this.items.length; i += 1) {
      const start = this.rotation + (i * sliceAngle) - Math.PI / 2;
      const end = start + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = this.palette[i % this.palette.length];
      ctx.fill();
      ctx.strokeStyle = '#f4f6f8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(10, Math.min(13, 190 / this.items.length))}px "Be Vietnam Pro"`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const text = this.items[i].length > 18 ? `${this.items[i].slice(0, 18)}…` : this.items[i];
      ctx.fillText(text, radius - 18, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = this.accent;
    ctx.stroke();

    ctx.fillStyle = '#1a2b4c';
    ctx.font = '800 20px Oswald';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.centerLabel, cx, cy);
  }

  spin(forcedItem = null) {
    if (this.isSpinning) return Promise.resolve(null);
    if (!this.items.length) {
      this.resultEl.textContent = 'Đã hết dữ liệu để quay';
      return Promise.resolve(null);
    }

    let selectedIndex = forcedItem == null ? Math.floor(Math.random() * this.items.length) : this.items.indexOf(forcedItem);
    if (selectedIndex < 0) {
      this.resultEl.textContent = 'Không tìm thấy mục cần quay';
      return Promise.resolve(null);
    }

    this.isSpinning = true;
    this.button?.setAttribute('disabled', 'disabled');
    this.resultEl.textContent = 'Đang quay...';

    const selectedItem = this.items[selectedIndex];
    const sliceAngle = (Math.PI * 2) / this.items.length;
    const currentRotation = this.rotation;
    const desiredRotation = -(selectedIndex + 0.5) * sliceAngle;
    const currentNormalized = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const desiredNormalized = ((desiredRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = desiredNormalized - currentNormalized;
    if (delta < 0) delta += Math.PI * 2;
    const targetRotation = currentRotation + delta + Math.PI * 2 * (5 + Math.random() * 2);
    const duration = 3800 + Math.random() * 1000;
    const start = performance.now();

    return new Promise((resolve) => {
      const animate = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        this.rotation = currentRotation + (targetRotation - currentRotation) * eased;
        this.draw();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.rotation = desiredRotation;
          this.draw();
          this.items.splice(selectedIndex, 1);
          this.updateCount();
          this.resultEl.textContent = `Kết quả: ${selectedItem}`;
          this.rotation = 0;
          this.draw();
          this.isSpinning = false;
          this.button?.removeAttribute('disabled');
          resolve(selectedItem);
        }
      };

      requestAnimationFrame(animate);
    });
  }
}

const getDefaultLt1Items = () => teams.map((team) => team.member1?.trim() || `${team.name} • LT1`);
const getDefaultLt2Items = () => teams.map((team) => team.member2?.trim() || `${team.name} • LT2`);
const getDefaultPositionItems = () => Array.from({ length: 16 }, (_, i) => `Vị trí ${String(i + 1).padStart(2, '0')}`);

const DRAW_STORAGE_KEY = 'ktv_badminton_draw_v10';
let pendingDrawState = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAW_STORAGE_KEY) || 'null');
    return saved && typeof saved === 'object' ? saved : null;
  } catch (_) {
    return null;
  }
})();
const drawHistory = Array.isArray(pendingDrawState?.history) ? [...pendingDrawState.history] : [];
let wheel1;
let wheel2;
let wheel3;

function currentDrawState() {
  const fallback = pendingDrawState || {};
  return {
    history: [...drawHistory],
    lt1Base: wheel1?.baseItems ? [...wheel1.baseItems] : (fallback.lt1Base || getDefaultLt1Items()),
    lt2Base: wheel2?.baseItems ? [...wheel2.baseItems] : (fallback.lt2Base || getDefaultLt2Items()),
    posBase: wheel3?.baseItems ? [...wheel3.baseItems] : (fallback.posBase || getDefaultPositionItems()),
    lt1Remaining: wheel1?.items ? [...wheel1.items] : (fallback.lt1Remaining || fallback.lt1Base || getDefaultLt1Items()),
    lt2Remaining: wheel2?.items ? [...wheel2.items] : (fallback.lt2Remaining || fallback.lt2Base || getDefaultLt2Items()),
    posRemaining: wheel3?.items ? [...wheel3.items] : (fallback.posRemaining || fallback.posBase || getDefaultPositionItems())
  };
}

function saveDrawState() {
  const state = currentDrawState();
  pendingDrawState = state;
  try { localStorage.setItem(DRAW_STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  queueSharedStateSave();
}

const PAIR_LOCK_STORAGE_KEY = 'ktv_badminton_pair_lock_v1';
let pairLockConfig = (() => {
  const defaults = { enabled: true, lt1Index: 2, lt2Index: 3 };
  try {
    const saved = JSON.parse(localStorage.getItem(PAIR_LOCK_STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      return {
        enabled: saved.enabled !== false,
        lt1Index: Math.max(1, Number(saved.lt1Index) || 2),
        lt2Index: Math.max(1, Number(saved.lt2Index) || 3)
      };
    }
  } catch (_) {}
  return defaults;
})();

function savePairLockConfig() {
  try { localStorage.setItem(PAIR_LOCK_STORAGE_KEY, JSON.stringify(pairLockConfig)); } catch (_) {}
  queueSharedStateSave();
}

function getPairLockSourceLists() {
  const input1 = document.getElementById('inputLt1');
  const input2 = document.getElementById('inputLt2');
  const lt1Items = wheel1?.baseItems?.length ? wheel1.baseItems : (input1 ? parseTextareaList(input1.value) : []);
  const lt2Items = wheel2?.baseItems?.length ? wheel2.baseItems : (input2 ? parseTextareaList(input2.value) : []);
  return { lt1Items, lt2Items };
}

function getPairLockItems() {
  const { lt1Items, lt2Items } = getPairLockSourceLists();
  const lt1Index = Math.max(1, Number(pairLockConfig.lt1Index) || 1);
  const lt2Index = Math.max(1, Number(pairLockConfig.lt2Index) || 1);
  return {
    lt1Index,
    lt2Index,
    lt1: lt1Items[lt1Index - 1] || null,
    lt2: lt2Items[lt2Index - 1] || null,
    lt1Count: lt1Items.length,
    lt2Count: lt2Items.length
  };
}

function syncPairLockConfigFromControls() {
  const enabledEl = document.getElementById('pairLockEnabled');
  const lt1El = document.getElementById('pairLockLt1Index');
  const lt2El = document.getElementById('pairLockLt2Index');
  if (!enabledEl || !lt1El || !lt2El) return;
  pairLockConfig = {
    enabled: enabledEl.checked,
    lt1Index: Math.max(1, Number(lt1El.value) || 1),
    lt2Index: Math.max(1, Number(lt2El.value) || 1)
  };
  savePairLockConfig();
  updatePairLockUI();
}

function updatePairLockUI() {
  const card = document.getElementById('pairLockCard');
  const enabledEl = document.getElementById('pairLockEnabled');
  const lt1El = document.getElementById('pairLockLt1Index');
  const lt2El = document.getElementById('pairLockLt2Index');
  if (!card || !enabledEl || !lt1El || !lt2El) return;

  enabledEl.checked = !!pairLockConfig.enabled;
  lt1El.value = pairLockConfig.lt1Index;
  lt2El.value = pairLockConfig.lt2Index;
  const pair = getPairLockItems();
  lt1El.max = Math.max(1, pair.lt1Count);
  lt2El.max = Math.max(1, pair.lt2Count);
  card.classList.toggle('is-on', pairLockConfig.enabled);

  [wheel1, wheel2, wheel3].forEach((wheel) => {
    if (!wheel?.button) return;
    if (pairLockConfig.enabled) {
      wheel.button.disabled = true;
      wheel.button.classList.add('lock-disabled');
      wheel.button.title = 'Dùng nút Quay cả 3 vòng';
    } else if (!wheel.isSpinning) {
      wheel.button.disabled = false;
      wheel.button.classList.remove('lock-disabled');
      wheel.button.removeAttribute('title');
    }
  });
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function chooseSpinAllPair() {
  if (!pairLockConfig.enabled) {
    return { lt1: randomItem(wheel1.items), lt2: randomItem(wheel2.items), locked: false };
  }

  const pair = getPairLockItems();
  if (!pair.lt1 || !pair.lt2) {
    throw new Error('Cặp khóa chưa hợp lệ. Hãy kiểm tra STT Lông thủ 1 và Lông thủ 2.');
  }

  const hasLt1 = wheel1.items.includes(pair.lt1);
  const hasLt2 = wheel2.items.includes(pair.lt2);

  if (hasLt1 !== hasLt2) {
    throw new Error('Cặp khóa đang lệch trạng thái. Hãy bấm “Khôi phục danh sách” rồi quay lại.');
  }

  if (!hasLt1 && !hasLt2) {
    return { lt1: randomItem(wheel1.items), lt2: randomItem(wheel2.items), locked: false };
  }

  let lt1 = randomItem(wheel1.items);
  let lt2;
  if (lt1 === pair.lt1) {
    lt2 = pair.lt2;
  } else {
    const lt2Candidates = wheel2.items.filter((item) => item !== pair.lt2);
    if (!lt2Candidates.length) {
      lt1 = pair.lt1;
      lt2 = pair.lt2;
    } else {
      lt2 = randomItem(lt2Candidates);
    }
  }

  return { lt1, lt2, locked: lt1 === pair.lt1 && lt2 === pair.lt2 };
}

function renderDrawHistory() {
  const listEl = document.getElementById('drawHistoryList');
  const countEl = document.getElementById('drawHistoryCount');
  countEl.textContent = `${drawHistory.length} lượt`;

  if (!drawHistory.length) {
    listEl.innerHTML = '<div class="empty-history">Chưa có dữ liệu bốc thăm.</div>';
    return;
  }

  listEl.innerHTML = drawHistory
    .slice()
    .reverse()
    .map((item, index) => `
      <div class="history-item ${item.locked ? 'locked-pair' : ''}">
        <div class="history-index">#${drawHistory.length - index}</div>
        <div class="history-copy">
          <b>${item.lt1}</b>
          <span>${item.lt2}</span>
          <small>${item.position} • ${item.time}</small>
        </div>
      </div>`)
    .join('');
}

function updateComboResult(lt1, lt2, position, locked = false) {
  const title = document.getElementById('drawComboTitle');
  const text = document.getElementById('drawComboText');

  if (!lt1 || !lt2 || !position) {
    title.textContent = 'Chưa có lượt bốc thăm nào';
    text.textContent = 'Hãy bấm “Quay cả 3 vòng” để hệ thống chọn ngẫu nhiên Lông Thủ 1, Lông Thủ 2 và vị trí cặp đấu.';
    return;
  }

  title.textContent = `${lt1} ghép với ${lt2}`;
  text.textContent = `Vị trí cặp đấu được chỉ định: ${position}. Kết quả này đã được thêm vào lịch sử bốc thăm ở khung bên phải.`;
}

async function spinAllWheels() {
  const button = document.getElementById('spinAllBtn');
  if (button.disabled) return;
  if (!wheel1.items.length || !wheel2.items.length || !wheel3.items.length) {
    updateComboResult();
    alert('Một trong các vòng quay đã hết dữ liệu. Hãy bấm “Khôi phục danh sách” để quay lại từ đầu.');
    return;
  }

  let pairChoice;
  try {
    pairChoice = chooseSpinAllPair();
  } catch (error) {
    alert(error.message || 'Không thể thực hiện cặp khóa.');
    updatePairLockUI();
    return;
  }

  button.disabled = true;
  const positionChoice = randomItem(wheel3.items);
  const [lt1, lt2, position] = await Promise.all([
    wheel1.spin(pairChoice.lt1),
    wheel2.spin(pairChoice.lt2),
    wheel3.spin(positionChoice)
  ]);
  button.disabled = false;
  updatePairLockUI();

  if (lt1 && lt2 && position) {
    drawHistory.push({
      lt1,
      lt2,
      position,
      locked: !!pairChoice.locked,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    updateComboResult(lt1, lt2, position, !!pairChoice.locked);
    renderDrawHistory();
    saveDrawState();
  }
}

function parseTextareaList(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function fillDrawInputs(lt1Items = getDefaultLt1Items(), lt2Items = getDefaultLt2Items(), positionItems = getDefaultPositionItems()) {
  document.getElementById('inputLt1').value = lt1Items.join('\n');
  document.getElementById('inputLt2').value = lt2Items.join('\n');
  document.getElementById('inputPositions').value = positionItems.join('\n');
}

function applyCustomDrawData(useAlert = true) {
  const lt1Items = parseTextareaList(document.getElementById('inputLt1').value);
  const lt2Items = parseTextareaList(document.getElementById('inputLt2').value);
  const positionItems = parseTextareaList(document.getElementById('inputPositions').value);

  if (!lt1Items.length || !lt2Items.length || !positionItems.length) {
    alert('Bạn cần nhập ít nhất 1 dòng cho cả 3 ô: Lông thủ 1, Lông thủ 2 và Vị trí cặp đấu.');
    return;
  }

  drawHistory.length = 0;
  wheel1.setItems(lt1Items);
  wheel2.setItems(lt2Items);
  wheel3.setItems(positionItems);
  updateComboResult();
  renderDrawHistory();
  updatePairLockUI();
  saveDrawState();

  if (useAlert) {
    alert('Đã cập nhật dữ liệu vòng quay thành công.');
  }
}

function initWheels() {
  wheel1 = new SpinWheel({
    canvasId: 'wheel1',
    resultId: 'wheelResult1',
    countId: 'drawCount1',
    buttonId: 'spinWheel1',
    centerLabel: 'LT1',
    items: getDefaultLt1Items(),
    accent: '#173465',
    countSuffix: 'tên'
  });

  wheel2 = new SpinWheel({
    canvasId: 'wheel2',
    resultId: 'wheelResult2',
    countId: 'drawCount2',
    buttonId: 'spinWheel2',
    centerLabel: 'LT2',
    items: getDefaultLt2Items(),
    accent: '#e56100',
    countSuffix: 'tên'
  });

  wheel3 = new SpinWheel({
    canvasId: 'wheel3',
    resultId: 'wheelResult3',
    countId: 'drawCount3',
    buttonId: 'spinWheel3',
    centerLabel: 'VỊ TRÍ',
    items: getDefaultPositionItems(),
    accent: '#173465',
    countSuffix: 'vị trí'
  });

  if (pendingDrawState) {
    const d = pendingDrawState;
    if (Array.isArray(d.lt1Base) && d.lt1Base.length) wheel1.baseItems = [...d.lt1Base];
    if (Array.isArray(d.lt2Base) && d.lt2Base.length) wheel2.baseItems = [...d.lt2Base];
    if (Array.isArray(d.posBase) && d.posBase.length) wheel3.baseItems = [...d.posBase];
    wheel1.items = Array.isArray(d.lt1Remaining) ? [...d.lt1Remaining] : [...wheel1.baseItems];
    wheel2.items = Array.isArray(d.lt2Remaining) ? [...d.lt2Remaining] : [...wheel2.baseItems];
    wheel3.items = Array.isArray(d.posRemaining) ? [...d.posRemaining] : [...wheel3.baseItems];
    drawHistory.splice(0, drawHistory.length, ...(Array.isArray(d.history) ? d.history : []));
    wheel1.updateCount(); wheel2.updateCount(); wheel3.updateCount();
    wheel1.draw(); wheel2.draw(); wheel3.draw();
    fillDrawInputs(wheel1.baseItems, wheel2.baseItems, wheel3.baseItems);
  } else {
    fillDrawInputs();
  }

  const pairEnabled = document.getElementById('pairLockEnabled');
  const pairLt1Index = document.getElementById('pairLockLt1Index');
  const pairLt2Index = document.getElementById('pairLockLt2Index');
  if (pairEnabled) pairEnabled.checked = !!pairLockConfig.enabled;
  if (pairLt1Index) pairLt1Index.value = pairLockConfig.lt1Index;
  if (pairLt2Index) pairLt2Index.value = pairLockConfig.lt2Index;
  pairEnabled?.addEventListener('change', syncPairLockConfigFromControls);
  pairLt1Index?.addEventListener('input', syncPairLockConfigFromControls);
  pairLt2Index?.addEventListener('input', syncPairLockConfigFromControls);
  document.getElementById('inputLt1')?.addEventListener('input', updatePairLockUI);
  document.getElementById('inputLt2')?.addEventListener('input', updatePairLockUI);
  updatePairLockUI();

  document.getElementById('spinAllBtn').addEventListener('click', spinAllWheels);
  document.getElementById('resetDrawBtn').addEventListener('click', () => {
    drawHistory.length = 0;
    wheel1.reset();
    wheel2.reset();
    wheel3.reset();
    fillDrawInputs(wheel1.baseItems, wheel2.baseItems, wheel3.baseItems);
    updateComboResult();
    renderDrawHistory();
    updatePairLockUI();
    saveDrawState();
  });

  document.getElementById('applyDrawDataBtn').addEventListener('click', () => applyCustomDrawData(true));
  document.getElementById('loadSampleBtn').addEventListener('click', () => {
    fillDrawInputs(getDefaultLt1Items(), getDefaultLt2Items(), getDefaultPositionItems());
    applyCustomDrawData(false);
  });
}


const SHARED_STATE_API = '/api/state';
let sharedSyncReady = false;
let suppressSharedSave = false;
let sharedSaveTimer = null;
let sharedSaveInFlight = false;
let lastRemoteUpdatedAt = 0;

function setSharedSyncStatus(message) {
  const el = document.getElementById('sharedSyncStatus');
  if (el) el.textContent = message;
}

function teamsDifferFromDefaults() {
  return teams.some((team, index) => {
    const base = defaultTeams[index] || {};
    return ['id','name','city','member1','member2'].some((key) => String(team?.[key] || '') !== String(base?.[key] || ''));
  });
}

function hasMeaningfulLocalData() {
  return teamsDifferFromDefaults()
    || Object.keys(slotAssignments || {}).length > 0
    || drawHistory.length > 0
    || Boolean(localStorage.getItem(DRAW_STORAGE_KEY));
}

function collectSharedState() {
  return {
    teams: teams.map((team) => ({ ...team })),
    slotAssignments: { ...slotAssignments },
    pairLockConfig: { ...pairLockConfig },
    draw: currentDrawState(),
    meta: { version: 10, clientSavedAt: Date.now() }
  };
}

function applySharedStateCore(state) {
  if (!state || typeof state !== 'object') return;
  suppressSharedSave = true;
  try {
    if (Array.isArray(state.teams) && state.teams.length === 16) {
      teams = defaultTeams.map((base) => normalizeTeam(state.teams.find((item) => item.slot === base.slot) || {}, base));
      try { localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teams)); } catch (_) {}
    }
    if (state.slotAssignments && typeof state.slotAssignments === 'object' && !Array.isArray(state.slotAssignments)) {
      slotAssignments = { ...state.slotAssignments };
      try { localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(slotAssignments)); } catch (_) {}
    }
    if (state.pairLockConfig && typeof state.pairLockConfig === 'object') {
      pairLockConfig = {
        enabled: state.pairLockConfig.enabled !== false,
        lt1Index: Math.max(1, Number(state.pairLockConfig.lt1Index) || 2),
        lt2Index: Math.max(1, Number(state.pairLockConfig.lt2Index) || 3)
      };
      try { localStorage.setItem(PAIR_LOCK_STORAGE_KEY, JSON.stringify(pairLockConfig)); } catch (_) {}
    }
    if (state.draw && typeof state.draw === 'object') {
      pendingDrawState = state.draw;
      drawHistory.splice(0, drawHistory.length, ...(Array.isArray(state.draw.history) ? state.draw.history : []));
      try { localStorage.setItem(DRAW_STORAGE_KEY, JSON.stringify(state.draw)); } catch (_) {}
    }
    lastRemoteUpdatedAt = Number(state.meta?.updatedAt) || lastRemoteUpdatedAt;
  } finally {
    suppressSharedSave = false;
  }
}

function applySharedStateToUI(state) {
  const wheelsBusy = [wheel1, wheel2, wheel3].some((wheel) => wheel?.isSpinning);
  if (wheelsBusy) return;
  applySharedStateCore(state);
  renderAllTeamViews();
  if (wheel1 && pendingDrawState) {
    const d = pendingDrawState;
    if (Array.isArray(d.lt1Base) && d.lt1Base.length) wheel1.baseItems = [...d.lt1Base];
    if (Array.isArray(d.lt2Base) && d.lt2Base.length) wheel2.baseItems = [...d.lt2Base];
    if (Array.isArray(d.posBase) && d.posBase.length) wheel3.baseItems = [...d.posBase];
    wheel1.items = Array.isArray(d.lt1Remaining) ? [...d.lt1Remaining] : [...wheel1.baseItems];
    wheel2.items = Array.isArray(d.lt2Remaining) ? [...d.lt2Remaining] : [...wheel2.baseItems];
    wheel3.items = Array.isArray(d.posRemaining) ? [...d.posRemaining] : [...wheel3.baseItems];
    wheel1.updateCount(); wheel2.updateCount(); wheel3.updateCount();
    wheel1.draw(); wheel2.draw(); wheel3.draw();
    fillDrawInputs(wheel1.baseItems, wheel2.baseItems, wheel3.baseItems);
    renderDrawHistory();
    updatePairLockUI();
  }
}

async function fetchSharedState() {
  const response = await fetch(SHARED_STATE_API, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function pushSharedState() {
  if (suppressSharedSave || !sharedSyncReady || sharedSaveInFlight) return;
  sharedSaveInFlight = true;
  setSharedSyncStatus('☁ Đang lưu dữ liệu chung…');
  try {
    const response = await fetch(SHARED_STATE_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ state: collectSharedState() })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`);
    lastRemoteUpdatedAt = Number(result.state?.meta?.updatedAt) || Date.now();
    setSharedSyncStatus('☁ Đã đồng bộ online');
  } catch (error) {
    console.warn('Shared save failed', error);
    setSharedSyncStatus('⚠ Chưa đồng bộ • vẫn lưu trên máy này');
  } finally {
    sharedSaveInFlight = false;
  }
}

function queueSharedStateSave() {
  if (suppressSharedSave || !sharedSyncReady) return;
  clearTimeout(sharedSaveTimer);
  sharedSaveTimer = setTimeout(pushSharedState, 450);
}

async function initializeSharedState() {
  setSharedSyncStatus('☁ Đang tải dữ liệu chung…');
  try {
    const result = await fetchSharedState();
    if (result.exists && result.state) {
      applySharedStateCore(result.state);
      setSharedSyncStatus('☁ Đã tải dữ liệu chung');
      return;
    }

    // Migration v9 -> v10: only the browser that already has edited/saved data
    // initializes the shared store. A new viewer with default data does not overwrite it.
    if (hasMeaningfulLocalData()) {
      sharedSyncReady = true;
      await pushSharedState();
      sharedSyncReady = false;
      setSharedSyncStatus('☁ Đã đưa dữ liệu đã lưu lên online');
    } else {
      setSharedSyncStatus('☁ Chưa có dữ liệu chung');
    }
  } catch (error) {
    console.warn('Shared bootstrap failed', error);
    setSharedSyncStatus('⚠ Đang dùng dữ liệu lưu trên máy');
  }
}

function startSharedPolling() {
  setInterval(async () => {
    if (sharedSaveInFlight || document.hidden) return;
    if (document.querySelector('.modal-backdrop.open')) return;
    try {
      const result = await fetchSharedState();
      const remoteTime = Number(result.state?.meta?.updatedAt) || 0;
      if (result.exists && result.state && remoteTime > lastRemoteUpdatedAt) {
        applySharedStateToUI(result.state);
        setSharedSyncStatus('☁ Đã cập nhật dữ liệu mới');
      }
    } catch (_) {}
  }, 8000);
}

function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.page').forEach((x) => x.classList.remove('active'));
      document.getElementById(btn.dataset.target).classList.add('active');
      document.getElementById('sidebar').classList.remove('open');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function setupFilters() {
  document.querySelectorAll('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
      renderSchedule(btn.dataset.filter);
    });
  });
}

async function boot() {
  await initializeSharedState();
  setupNavigation();
  setupFilters();
  document.getElementById('teamSearch').addEventListener('input', (e) => renderTeams(e.target.value));
  document.getElementById('menuBtn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

  document.getElementById('teamEditForm').addEventListener('submit', saveTeamEdit);
  document.getElementById('closeTeamModal').addEventListener('click', closeTeamEditor);
  document.getElementById('cancelTeamEdit').addEventListener('click', closeTeamEditor);
  document.getElementById('resetTeamsBtn').addEventListener('click', resetTeamsToDefault);
  document.getElementById('teamEditModal').addEventListener('click', (event) => {
    if (event.target.id === 'teamEditModal') closeTeamEditor();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTeamEditor();
      closeSlotEditor();
      closeSlotManager();
    }
  });

  document.getElementById('slotEditForm').addEventListener('submit', saveSlotEdit);
  document.getElementById('closeSlotModal').addEventListener('click', closeSlotEditor);
  document.getElementById('cancelSlotEdit').addEventListener('click', closeSlotEditor);
  document.getElementById('clearSlotAssignment').addEventListener('click', clearCurrentSlotAssignment);
  document.getElementById('slotEditModal').addEventListener('click', (event) => {
    if (event.target.id === 'slotEditModal') closeSlotEditor();
  });
  ['editSlotTeam','editSlotCustomName','editSlotMember1','editSlotMember2','editSlotNote'].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', updateSlotEditPreview);
  });
  document.getElementById('closeSlotManager').addEventListener('click', closeSlotManager);
  document.getElementById('resetSlotAssignments').addEventListener('click', resetAllSlotAssignments);
  document.getElementById('slotManagerModal').addEventListener('click', (event) => {
    if (event.target.id === 'slotManagerModal') closeSlotManager();
  });
  document.addEventListener('click', (event) => {
    const slotButton = event.target.closest('[data-edit-slot]');
    if (slotButton) {
      event.preventDefault();
      openSlotEditor(slotButton.dataset.editSlot);
      return;
    }
    const teamButton = event.target.closest('[data-edit-team-direct]');
    if (teamButton) {
      event.preventDefault();
      openTeamEditor(teamButton.dataset.editTeamDirect);
      return;
    }
    const managerButton = event.target.closest('[data-open-slot-manager]');
    if (managerButton) {
      event.preventDefault();
      openSlotManager();
    }
  });

  renderAllTeamViews();
  initWheels();
  renderDrawHistory();
  if (drawHistory.length) {
    const last = drawHistory[drawHistory.length - 1];
    updateComboResult(last.lt1, last.lt2, last.position, !!last.locked);
  } else {
    updateComboResult();
  }
  sharedSyncReady = true;
  setSharedSyncStatus('☁ Đã đồng bộ online');
  startSharedPolling();
}

boot();
