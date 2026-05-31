const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const people = [
  { name: 'Robin', color: '#147d64' },
  { name: 'Ellie', color: '#315fd8' },
  { name: 'Glinda', color: '#b87500' },
  { name: 'Rose', color: '#b42318' },
  { name: 'Rue', color: '#6d4aff' }
];

const sampleEntries = [
  ['Thursday', 10, 'Robin', 'Gym', 'Strength class'],
  ['Thursday', 10, 'Ellie', 'Work', 'Front desk shift'],
  ['Thursday', 10, 'Glinda', 'School', 'Math block'],
  ['Thursday', 10, 'Rose', 'Friends', 'Cafe on 3rd'],
  ['Thursday', 10, 'Rue', 'Dog walk', 'Park loop'],
  ['Monday', 8, 'Ellie', 'Work', 'Morning shift'],
  ['Monday', 8, 'Glinda', 'School', 'Drop-off 7:45'],
  ['Monday', 17, 'Robin', 'Pickup', 'Bring sports bag'],
  ['Tuesday', 15, 'Rose', 'Study group', 'Library'],
  ['Wednesday', 12, 'Rue', 'Vet', 'Annual check'],
  ['Friday', 18, 'Robin', 'Dinner prep', 'Groceries first'],
  ['Saturday', 11, 'Everyone', 'Family planning', 'Review next week']
].map(([day, hour, person, activity, details]) => ({ day, hour, person, activity, details }));

let entries = JSON.parse(localStorage.getItem('hourlyCalendar.entries') || 'null') || sampleEntries;
let mode = 'compact';

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function save() {
  localStorage.setItem('hourlyCalendar.entries', JSON.stringify(entries));
}

function toast(message) {
  const el = qs('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function fillSelect(select, values, formatter = (value) => value) {
  select.innerHTML = values.map((value) => `<option value="${value}">${formatter(value)}</option>`).join('');
}

function activityFor(day, hour, person) {
  return entries.find((entry) => entry.day === day && Number(entry.hour) === Number(hour) && entry.person === person);
}

function entriesFor(day, hour) {
  const filter = qs('#personFilter').value;
  return entries.filter((entry) => entry.day === day && Number(entry.hour) === Number(hour) && (filter === 'all' || entry.person === filter || entry.person === 'Everyone'));
}

function visibleHours() {
  const start = Number(qs('#startHour').value);
  const end = Number(qs('#endHour').value);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function renderCompact() {
  const hours = visibleHours();
  qs('#calendarGrid').className = 'calendar-grid compact-grid';
  qs('#calendarGrid').innerHTML = `
    <div class="corner">Time</div>
    ${days.map((day) => `<div class="day-head">${day}</div>`).join('')}
    ${hours.map((hour) => `
      <div class="time-cell">${formatHour(hour)}</div>
      ${days.map((day) => {
        const rows = entriesFor(day, hour);
        return `<div class="hour-cell">${renderRoster(rows)}</div>`;
      }).join('')}
    `).join('')}
  `;
}

function renderPeopleColumns() {
  const hours = visibleHours();
  const filter = qs('#personFilter').value;
  const visiblePeople = filter === 'all' ? people : people.filter((person) => person.name === filter);
  qs('#calendarGrid').className = 'calendar-grid people-mode-grid';
  qs('#calendarGrid').innerHTML = days.map((day) => `
    <section class="day-card">
      <h3>${day}</h3>
      <div class="people-table" style="--people:${visiblePeople.length}">
        <div class="time-head">Time</div>
        ${visiblePeople.map((person) => `<div class="person-head" style="--color:${person.color}">${person.name}</div>`).join('')}
        ${hours.map((hour) => `
          <div class="time-cell">${formatHour(hour)}</div>
          ${visiblePeople.map((person) => {
            const entry = activityFor(day, hour, person.name);
            return `<div class="person-hour">${entry ? renderEntry(entry) : '<span class="empty">Free</span>'}</div>`;
          }).join('')}
        `).join('')}
      </div>
    </section>
  `).join('');
}

function renderRoster(rows) {
  const hideEmpty = qs('#hideEmpty')?.checked;
  const rosterPeople = people.filter((person) => qs('#personFilter').value === 'all' || qs('#personFilter').value === person.name);
  const peopleRows = rosterPeople.map((person) => {
    const entry = rows.find((row) => row.person === person.name);
    if (!entry && hideEmpty) return '';
    return `<div class="roster-row" style="--color:${person.color}">
      <span>${person.name}</span>
      <strong>${entry ? entry.activity : 'Free'}</strong>
      ${entry && qs('#includeNotes')?.checked !== false ? `<small>${entry.details || ''}</small>` : ''}
    </div>`;
  }).join('');
  const everyone = rows.filter((row) => row.person === 'Everyone').map(renderEntry).join('');
  return peopleRows + everyone;
}

function renderEntry(entry) {
  return `<div class="entry"><strong>${entry.activity}</strong><small>${entry.details || ''}</small></div>`;
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function renderPeople() {
  qs('#peopleGrid').innerHTML = people.map((person) => {
    const count = entries.filter((entry) => entry.person === person.name).length;
    return `<article style="--color:${person.color}">
      <span></span>
      <strong>${person.name}</strong>
      <p>${count} scheduled blocks this week</p>
    </article>`;
  }).join('');
}

function renderCalendar() {
  qs('#boardTitle').textContent = mode === 'compact' ? 'Compact multi-person view' : 'People columns view';
  qs('#entryCount').textContent = `${entries.length} entries`;
  document.body.classList.toggle('large-print', qs('#largePrint')?.checked ?? true);
  if (mode === 'compact') renderCompact();
  else renderPeopleColumns();
  renderPeople();
}

function openView(id) {
  qsa('.nav, .view').forEach((el) => el.classList.remove('active'));
  qs(`[data-view="${id}"]`)?.classList.add('active');
  qs(`#${id}`)?.classList.add('active');
}

function setup() {
  fillSelect(qs('#startHour'), Array.from({ length: 18 }, (_, index) => index + 5), formatHour);
  fillSelect(qs('#endHour'), Array.from({ length: 18 }, (_, index) => index + 6), formatHour);
  qs('#startHour').value = 7;
  qs('#endHour').value = 20;
  fillSelect(qs('#personFilter'), ['all', ...people.map((person) => person.name)], (value) => value === 'all' ? 'All people' : value);
  fillSelect(qs('#entryPerson'), [...people.map((person) => person.name), 'Everyone']);
  fillSelect(qs('#entryDay'), days);
  fillSelect(qs('#entryHour'), Array.from({ length: 18 }, (_, index) => index + 5), formatHour);
}

qsa('.nav').forEach((button) => button.addEventListener('click', () => openView(button.dataset.view)));
qsa('.mode').forEach((button) => button.addEventListener('click', () => {
  qsa('.mode').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  mode = button.dataset.mode;
  renderCalendar();
}));
['startHour', 'endHour', 'personFilter', 'hideEmpty', 'largePrint', 'includeNotes'].forEach((id) => {
  document.addEventListener('change', (event) => {
    if (event.target.id === id) renderCalendar();
  });
});
qs('#entryForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const entry = {
    person: qs('#entryPerson').value,
    day: qs('#entryDay').value,
    hour: Number(qs('#entryHour').value),
    activity: qs('#entryActivity').value.trim(),
    details: qs('#entryDetails').value.trim()
  };
  entries = entries.filter((item) => !(item.person === entry.person && item.day === entry.day && Number(item.hour) === entry.hour));
  entries.push(entry);
  save();
  renderCalendar();
  toast('Activity saved.');
});
qs('#clearHour').addEventListener('click', () => {
  const person = qs('#entryPerson').value;
  const day = qs('#entryDay').value;
  const hour = Number(qs('#entryHour').value);
  entries = entries.filter((item) => !(item.person === person && item.day === day && Number(item.hour) === hour));
  save();
  renderCalendar();
  toast('Selected slot cleared.');
});
qs('#sampleBtn').addEventListener('click', () => {
  entries = sampleEntries;
  save();
  renderCalendar();
  toast('Sample week loaded.');
});
qs('#printBtn').addEventListener('click', () => window.print());
qs('#printBtn2').addEventListener('click', () => window.print());
qs('#exportCsv').addEventListener('click', () => {
  const csv = ['day,hour,person,activity,details', ...entries.map((entry) => `${entry.day},${entry.hour},${entry.person},${entry.activity},${entry.details}`)].join('\n');
  navigator.clipboard?.writeText(csv);
  toast('CSV copied.');
});

setup();
renderCalendar();
