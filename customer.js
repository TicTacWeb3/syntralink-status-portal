const STORAGE_KEY = 'syntralink_jobs_v2';

const fallbackJobs = [
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
  }
];

const qs = (selector) => document.querySelector(selector);

function loadJobs() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) && stored.length ? normalizeJobs(stored) : fallbackJobs;
  } catch {
    return fallbackJobs;
  }
}

function saveJobs(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
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

function statusClass(status) {
  if (status === 'Ready' || status === 'Completed') return 'ready';
  if (status === 'Needs update') return 'needs-update';
  if (status === 'Waiting on customer' || status === 'Waiting on supplier') return 'waiting';
  return 'on-track';
}

function showJob(job) {
  qs('#customerPlaceholder').classList.add('hidden');
  qs('#emptyResult').classList.add('hidden');
  qs('#customerResult').classList.remove('hidden');
  qs('#customerTitle').textContent = `${job.client} - ${job.work}`;
  qs('#customerStatusBadge').textContent = job.status;
  qs('#customerStatusBadge').className = `badge ${statusClass(job.status)}`;
  qs('#customerNext').textContent = job.nextUpdate;
  qs('#customerStep').textContent = job.currentStep;
  qs('#customerNote').textContent = job.publicNote;

  const exactIndex = job.steps.findIndex((step) => step.toLowerCase() === String(job.currentStep).toLowerCase());
  const fallbackIndex = exactIndex === -1 ? Math.floor(job.steps.length / 2) : exactIndex;
  qs('#customerSteps').innerHTML = job.steps.map((step, index) => {
    const className = index < fallbackIndex ? 'done' : index === fallbackIndex ? 'current' : '';
    return `<li class="${className}"><span>${index + 1}</span><p>${step}</p></li>`;
  }).join('');
}

function showEmpty() {
  qs('#customerPlaceholder').classList.add('hidden');
  qs('#customerResult').classList.add('hidden');
  qs('#emptyResult').classList.remove('hidden');
}

function lookup(email) {
  const jobs = loadJobs();
  const normalized = email.trim().toLowerCase();
  const job = jobs.find((item) => item.email.toLowerCase() === normalized);
  if (!job) {
    showEmpty();
    return;
  }
  job.views = Number(job.views || 0) + 1;
  saveJobs(jobs);
  showJob(job);
}

qs('#customerLookup').addEventListener('submit', (event) => {
  event.preventDefault();
  lookup(qs('#lookupEmail').value);
});

const params = new URLSearchParams(location.search);
const email = params.get('email');
if (email) {
  qs('#lookupEmail').value = email;
  lookup(email);
}
