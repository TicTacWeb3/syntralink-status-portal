const STORAGE_KEY = 'syntralink_jobs_v2';
const ADMIN_KEY = 'syntralink_admin_auth';
const ADMIN_PASSWORD = 'demo123';
const API_ROOT = '/api';

const demoJobs = [
  {
    id: 'MR-204',
    client: 'Marco Rossi',
    email: 'marco.rossi@email.it',
    work: 'Boiler repair',
    status: 'Needs update',
    currentStep: 'Replacement part ordered',
    nextUpdate: 'Today by 5:30 PM',
    publicNote: 'The replacement part has been ordered. As soon as it arrives, the technician will complete installation and testing.',
    views: 8,
    steps: ['Request received', 'Diagnosis complete', 'Replacement part ordered', 'Installation and testing', 'Closure with photos']
  },
  {
    id: 'LB-118',
    client: 'Laura Bianchi',
    email: 'laura.bianchi@email.it',
    work: 'Bathroom renovation',
    status: 'In progress',
    currentStep: 'Final photo missing',
    nextUpdate: 'Today by 6:00 PM',
    publicNote: 'The main work is complete. Only the final quality check and photo proof are still pending.',
    views: 3,
    steps: ['Site inspection', 'Work in progress', 'Area cleanup', 'Final photo', 'Handover']
  },
  {
    id: 'SV-077',
    client: 'Studio Verde',
    email: 'admin@studioverde.it',
    work: 'System maintenance',
    status: 'Ready',
    currentStep: 'Ready for delivery',
    nextUpdate: 'Now',
    publicNote: 'The service is complete. The portal includes the summary and pickup instructions.',
    views: 11,
    steps: ['Received', 'Technician assigned', 'Service completed', 'Ready for delivery']
  },
  {
    id: 'ON-442',
    client: 'Officina Nord',
    email: 'office@officinanord.it',
    work: 'Urgent estimate',
    status: 'Waiting on customer',
    currentStep: 'Variant approval',
    nextUpdate: 'Tomorrow at 9:00 AM',
    publicNote: 'The variant needs customer approval before work can continue.',
    views: 5,
    steps: ['Request received', 'Estimate sent', 'Waiting for approval', 'Execution']
  }
];

let jobs = loadJobs();
let selectedId = jobs[0]?.id;

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function loadJobs() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(demoJobs);
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? normalizeJobs(parsed) : structuredClone(demoJobs);
  } catch {
    return structuredClone(demoJobs);
  }
}

function normalizeJobs(items) {
  return items.map((job) => ({
    ...job,
    status: translateStatus(job.status),
    currentStep: translateText(job.currentStep),
    nextUpdate: translateText(job.nextUpdate),
    publicNote: translateText(job.publicNote),
    steps: Array.isArray(job.steps) ? job.steps.map(translateText) : ['Request received', 'In progress', 'Ready']
  }));
}

function translateStatus(status) {
  return {
    'Da aggiornare': 'Needs update',
    'In corso': 'In progress',
    'In attesa cliente': 'Waiting on customer',
    'In attesa fornitore': 'Waiting on supplier',
    Pronto: 'Ready',
    Completato: 'Completed'
  }[status] || status || 'Needs update';
}

function translateText(value = '') {
  const dictionary = {
    'Ricambio ordinato': 'Replacement part ordered',
    'Oggi entro le 17:30': 'Today by 5:30 PM',
    'Oggi entro le 18:00': 'Today by 6:00 PM',
    'Domani alle 09:00': 'Tomorrow at 9:00 AM',
    'Richiesta ricevuta': 'Request received',
    'Diagnosi completata': 'Diagnosis complete',
    'Montaggio e test': 'Installation and testing',
    'Chiusura con foto': 'Closure with photos',
    Sopralluogo: 'Site inspection',
    Lavorazione: 'Work in progress',
    'Pulizia area': 'Area cleanup',
    'Foto finale': 'Final photo',
    Consegna: 'Handover',
    Ricevuto: 'Received',
    'Tecnico assegnato': 'Technician assigned',
    'Intervento completato': 'Service completed',
    'Pronto per consegna': 'Ready for delivery',
    'Preventivo inviato': 'Estimate sent',
    'In attesa approvazione': 'Waiting for approval',
    Esecuzione: 'Execution'
  };
  return dictionary[value] || value;
}

function saveJobs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  persistJobsToServer();
}

async function persistJobsToServer() {
  try {
    await fetch(`${API_ROOT}/jobs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs })
    });
  } catch {
    // Static file fallback: localStorage remains the source of truth.
  }
}

async function loadJobsFromServer() {
  try {
    const response = await fetch(`${API_ROOT}/jobs`);
    if (!response.ok) return;
    const payload = await response.json();
    if (!Array.isArray(payload.jobs) || !payload.jobs.length) return;
    jobs = normalizeJobs(payload.jobs);
    selectedId = jobs.find((job) => job.id === selectedId)?.id || jobs[0].id;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    renderAll();
  } catch {
    // Running from file:// or a plain static server: keep localStorage mode.
  }
}

function toast(message) {
  const el = qs('#toast');
  el.textContent = message;
  el.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove('show'), 2300);
}

function copyText(text, message) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast(message));
    return;
  }
  toast(message);
}

function openView(id) {
  qsa('.nav, .view').forEach((el) => el.classList.remove('active'));
  qs(`[data-view="${id}"]`)?.classList.add('active');
  qs(`#${id}`)?.classList.add('active');
}

function requireAuth() {
  if (sessionStorage.getItem(ADMIN_KEY) === 'true') {
    qs('#loginScreen').classList.add('hidden');
    qs('#adminApp').classList.remove('hidden');
    return;
  }
  qs('#loginScreen').classList.remove('hidden');
  qs('#adminApp').classList.add('hidden');
}

function statusClass(status) {
  if (status === 'Ready' || status === 'Completed') return 'ready';
  if (status === 'Needs update') return 'needs-update';
  if (status === 'Waiting on customer' || status === 'Waiting on supplier') return 'waiting';
  return 'on-track';
}

function renderMetrics() {
  qs('#metricJobs').textContent = jobs.length;
  qs('#metricUpdates').textContent = jobs.filter((job) => !['Completed', 'Ready'].includes(job.status)).length;
  qs('#metricAtRisk').textContent = jobs.filter((job) => job.status === 'Needs update').length;
  qs('#metricViews').textContent = jobs.reduce((sum, job) => sum + Number(job.views || 0), 0);
}

function renderPriorities() {
  const urgent = jobs.filter((job) => job.status !== 'Completed').slice(0, 5);
  qs('#priorityList').innerHTML = urgent.map((job) => `
    <li>
      <div>
        <strong>${job.client}</strong>
        <span>${job.work} - ${job.currentStep} - update: ${job.nextUpdate}</span>
      </div>
      <button class="small-button" data-open-job="${job.id}">Open</button>
    </li>
  `).join('');

  qsa('[data-open-job]').forEach((button) => {
    button.addEventListener('click', () => {
      selectJob(button.dataset.openJob);
      openView('jobs');
    });
  });
}

function renderJobs() {
  const query = (qs('#search')?.value || '').toLowerCase();
  const filter = qs('#statusFilter')?.value || 'all';
  const rows = jobs.filter((job) => {
    const haystack = `${job.client} ${job.email} ${job.work} ${job.status}`.toLowerCase();
    return haystack.includes(query) && (filter === 'all' || job.status === filter);
  });

  qs('#jobsBody').innerHTML = rows.map((job) => `
    <tr class="${job.id === selectedId ? 'selected-row' : ''}">
      <td><button class="link-button" data-select="${job.id}">${job.client}</button></td>
      <td>${job.email}</td>
      <td>${job.work}</td>
      <td><span class="pill ${statusClass(job.status)}">${job.status}</span></td>
      <td>${job.nextUpdate}</td>
      <td><button class="small-button" data-share="${job.email}">Customer link</button></td>
    </tr>
  `).join('');

  qsa('[data-select]').forEach((button) => {
    button.addEventListener('click', () => selectJob(button.dataset.select));
  });

  qsa('[data-share]').forEach((button) => {
    const url = `${location.origin}${location.pathname.replace('index.html', '')}customer.html?email=${encodeURIComponent(button.dataset.share)}`;
    button.addEventListener('click', () => copyText(url, 'Customer URL copied.'));
  });
}

function selectJob(id) {
  selectedId = id;
  const job = jobs.find((item) => item.id === selectedId) || jobs[0];
  if (!job) return;
  selectedId = job.id;
  qs('#editorTitle').textContent = `${job.client} - ${job.id}`;
  qs('#clientName').value = job.client;
  qs('#clientEmail').value = job.email;
  qs('#jobTitle').value = job.work;
  qs('#jobStatus').value = job.status;
  qs('#currentStep').value = job.currentStep;
  qs('#nextUpdate').value = job.nextUpdate;
  qs('#publicNote').value = job.publicNote;
  qs('#stepsInput').value = job.steps.join(', ');
  renderJobs();
}

function readFormJob(existing = {}) {
  return {
    id: existing.id || createId(qs('#clientName').value),
    client: qs('#clientName').value.trim(),
    email: qs('#clientEmail').value.trim().toLowerCase(),
    work: qs('#jobTitle').value.trim(),
    status: qs('#jobStatus').value,
    currentStep: qs('#currentStep').value.trim(),
    nextUpdate: qs('#nextUpdate').value.trim(),
    publicNote: qs('#publicNote').value.trim(),
    views: existing.views || 0,
    steps: qs('#stepsInput').value.split(',').map((step) => step.trim()).filter(Boolean)
  };
}

function createId(value) {
  const initials = value.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CL';
  return `${initials}-${Math.floor(100 + Math.random() * 900)}`;
}

function renderAll() {
  renderMetrics();
  renderPriorities();
  renderJobs();
  selectJob(selectedId);
}

function parseRows(rows) {
  return rows.map((row) => {
    const get = (...keys) => {
      const key = keys.find((candidate) => row[candidate] !== undefined && row[candidate] !== '');
      return key ? String(row[key]).trim() : '';
    };
    const client = get('Customer', 'Cliente', 'client', 'Name', 'Nome', 'name');
    const email = get('Email', 'email', 'E-mail');
    const work = get('Job', 'Lavoro', 'work', 'Service', 'Servizio', 'job');
    if (!client || !email || !work) return null;
    return {
      id: createId(client),
      client,
      email: email.toLowerCase(),
      work,
      status: translateStatus(get('Status', 'Stato', 'status') || 'Needs update'),
      currentStep: translateText(get('Current step', 'Step corrente', 'currentStep', 'Step') || 'Request received'),
      nextUpdate: translateText(get('Next update', 'Prossimo update', 'nextUpdate') || 'Within 24 hours'),
      publicNote: translateText(get('Note', 'Nota', 'publicNote') || 'Update being prepared.'),
      views: Number(get('Views', 'Visite', 'views')) || 0,
      steps: (get('Process steps', 'Step processo', 'steps') || 'Request received, In progress, Ready').split(',').map((step) => translateText(step.trim())).filter(Boolean)
    };
  }).filter(Boolean);
}

function parseCsvLine(line) {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  cells.push(value.trim());
  return cells;
}

function renderImportPreview(imported) {
  qs('#importCount').textContent = `${imported.length} rows ready`;
  qs('#importPreview').innerHTML = imported.slice(0, 8).map((job) => `
    <article>
      <strong>${job.client}</strong>
      <span>${job.email} - ${job.work} - ${job.status}</span>
    </article>
  `).join('');
}

function importFile(file) {
  qs('#fileName').textContent = file.name;
  const reader = new FileReader();
  reader.onload = (event) => {
    let imported = [];
    if (file.name.endsWith('.csv') || !window.XLSX) {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const headers = parseCsvLine(lines.shift()).map((cell) => cell.trim());
      const rows = lines.map((line) => {
        const values = parseCsvLine(line);
        return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
      });
      imported = parseRows(rows);
    } else {
      const workbook = XLSX.read(event.target.result, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      imported = parseRows(XLSX.utils.sheet_to_json(sheet));
    }

    if (!imported.length) {
      toast('No valid rows found.');
      return;
    }

    jobs = imported;
    selectedId = jobs[0].id;
    saveJobs();
    renderAll();
    renderImportPreview(imported);
    toast('Customers imported and dashboard updated.');
  };

  if (file.name.endsWith('.csv') || !window.XLSX) reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
}

qsa('.nav[data-view]').forEach((button) => button.addEventListener('click', () => openView(button.dataset.view)));

qs('#loginForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (qs('#password').value === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
    requireAuth();
    toast('Admin access granted.');
  } else {
    toast('Incorrect password.');
  }
});

qs('#logout')?.addEventListener('click', () => {
  sessionStorage.removeItem(ADMIN_KEY);
  requireAuth();
});

qs('#search')?.addEventListener('input', renderJobs);
qs('#statusFilter')?.addEventListener('change', renderJobs);
qs('#newJob')?.addEventListener('click', () => {
  const fresh = {
    id: createId('New Customer'),
    client: 'New Customer',
    email: 'customer@email.com',
    work: 'New job',
    status: 'Needs update',
    currentStep: 'Request received',
    nextUpdate: 'Within 24 hours',
    publicNote: 'Update being prepared.',
    views: 0,
    steps: ['Request received', 'In progress', 'Ready']
  };
  jobs.unshift(fresh);
  selectedId = fresh.id;
  saveJobs();
  renderAll();
});

qs('#jobForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const index = jobs.findIndex((job) => job.id === selectedId);
  const updated = readFormJob(jobs[index]);
  jobs[index] = updated;
  selectedId = updated.id;
  saveJobs();
  renderAll();
  toast('Status saved and published to the customer portal.');
});

qs('#duplicateJob')?.addEventListener('click', () => {
  const current = jobs.find((job) => job.id === selectedId);
  if (!current) return;
  const copy = { ...current, id: createId(current.client), client: `${current.client} copy`, views: 0 };
  jobs.unshift(copy);
  selectedId = copy.id;
  saveJobs();
  renderAll();
  toast('Record duplicated.');
});

qs('#deleteJob')?.addEventListener('click', () => {
  if (jobs.length <= 1) {
    toast('At least one job record is required.');
    return;
  }
  jobs = jobs.filter((job) => job.id !== selectedId);
  selectedId = jobs[0].id;
  saveJobs();
  renderAll();
  toast('Record deleted.');
});

qs('#quickAdvance')?.addEventListener('click', () => {
  const job = jobs.find((item) => item.id === selectedId);
  if (!job) return;
  job.status = job.status === 'Ready' ? 'Completed' : 'Ready';
  job.currentStep = job.status;
  job.nextUpdate = 'Now';
  job.publicNote = job.status === 'Completed' ? 'Job completed and archived.' : 'The job is ready for pickup or delivery.';
  saveJobs();
  renderAll();
  toast('Job advanced.');
});

qs('#excelFile')?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) importFile(file);
});

qs('#downloadTemplate')?.addEventListener('click', () => {
  const csv = 'Customer,Email,Job,Status,Current step,Next update,Note,Process steps\nMario Verdi,mario@email.it,Auto detailing,In progress,Interior cleaning,Today 4:00 PM,Interior drying in progress,"Received, In progress, Quality check, Ready"';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'syntralink-customer-template.csv';
  link.click();
  URL.revokeObjectURL(url);
});

qs('#clearImported')?.addEventListener('click', () => {
  jobs = structuredClone(demoJobs);
  selectedId = jobs[0].id;
  saveJobs();
  renderAll();
  renderImportPreview([]);
  toast('Demo data restored.');
});

qs('#copyCustomerPage')?.addEventListener('click', () => {
  const url = `${location.origin}${location.pathname.replace('index.html', '')}customer.html`;
  copyText(url, 'Customer portal URL copied.');
});

qs('#copyClause')?.addEventListener('click', () => copyText(qs('#clause').value, 'Clause copied.'));
qs('#saveRules')?.addEventListener('click', () => toast('Rules saved in the local demo.'));

jobs = normalizeJobs(jobs);
localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
requireAuth();
renderAll();
loadJobsFromServer();
