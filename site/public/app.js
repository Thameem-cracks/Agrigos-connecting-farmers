const $ = (id) => document.getElementById(id);
const tabRegister = $('tab-register');
const tabLogin = $('tab-login');
const registerPanel = $('register-panel');
const loginPanel = $('login-panel');
const accountStep = $('step-account');
const profileStep = $('step-profile');
const statusPanel = $('status-panel');
const countryInput = $('country');
const countryOptions = $('country-options');
const countryMenu = $('country-menu');
const countrySearch = $('country-search');
const countryToggle = $('country-toggle');
const stateInput = $('state');
const stateOptions = $('state-options');
const stateMenu = $('state-menu');
const stateSearch = $('state-search');
const stateToggle = $('state-toggle');
const districtInput = $('district');
const districtOptions = $('district-options');
const DATA_BASE = 'https://unpkg.com/@countrystatecity/countries-browser@1.0.4/dist/data';
const DATA_BACKUP = 'https://cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@1.0.4/dist/data';
let countries = [];
let states = [];
let selectedMode = 'register';

$('year').textContent = new Date().getFullYear();

function showError(id, message) {
  const input = $(id);
  const error = $(`${id}-error`);
  if (!input || !error) return;
  error.textContent = message;
  error.classList.toggle('visible', Boolean(message));
  input.closest('.input-wrap')?.classList.toggle('invalid', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  if (message) input.setAttribute('aria-describedby', error.id);
  else input.removeAttribute('aria-describedby');
}

function setMode(mode) {
  selectedMode = mode;
  statusPanel.classList.add('hidden');
  registerPanel.classList.toggle('hidden', mode !== 'register');
  loginPanel.classList.toggle('hidden', mode !== 'login');
  tabRegister.classList.toggle('active', mode === 'register');
  tabLogin.classList.toggle('active', mode === 'login');
  tabRegister.setAttribute('aria-selected', String(mode === 'register'));
  tabLogin.setAttribute('aria-selected', String(mode === 'login'));
  if (mode === 'login') $('login-email').focus();
  else if (profileStep.classList.contains('hidden')) $('email').focus();
  else $('full-name').focus();
}

tabRegister.addEventListener('click', () => setMode('register'));
tabLogin.addEventListener('click', () => setMode('login'));
$('switch-register').addEventListener('click', () => setMode('register'));

document.querySelectorAll('[data-reveal]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = $(button.dataset.reveal);
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.textContent = visible ? 'Hide' : 'Show';
    button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} ${input.id.replaceAll('-', ' ')}`);
  });
});

function isGmail(value) { return /^[^\s@]+@gmail\.com$/i.test(value.trim()); }
function passwordScore(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  return score;
}

$('password').addEventListener('input', (event) => {
  const value = event.target.value;
  document.querySelector('.password-meter').dataset.score = value ? passwordScore(value) : 0;
  $('password-hint').textContent = value && passwordScore(value) >= 3 ? 'Looking good — your password is strong.' : 'Use 8+ characters, including a number and a symbol.';
  showError('password', '');
});

$('account-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = $('email').value.trim();
  const password = $('password').value;
  const repeat = $('repeat-password').value;
  showError('email', isGmail(email) ? '' : 'Please enter a valid Gmail address.');
  showError('password', password.length >= 8 && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? '' : 'Use at least 8 characters, a number, and a symbol.');
  showError('repeat-password', repeat === password && repeat ? '' : 'The passwords do not match.');
  const invalid = ['email', 'password', 'repeat-password'].find((id) => $(`${id}-error`).classList.contains('visible'));
  if (invalid) { $(invalid).focus(); return; }
  accountStep.classList.add('hidden');
  profileStep.classList.remove('hidden');
  $('full-name').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('back-to-account').addEventListener('click', () => {
  profileStep.classList.add('hidden');
  accountStep.classList.remove('hidden');
  $('email').focus();
});

async function getData(path) {
  let lastError;
  for (const base of [DATA_BASE, DATA_BACKUP]) {
    try {
      const response = await fetch(`${base}/${path}`, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Location data returned ${response.status}`);
      return await response.json();
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

function closePicker(menu, input, toggle) {
  menu.classList.add('hidden');
  input.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-expanded', 'false');
}

function renderChoices(list, rows, query, onSelect, allowCustom = false) {
  const needle = query.trim().toLocaleLowerCase();
  const matches = rows.filter((row) => row.name.toLocaleLowerCase().includes(needle));
  const options = matches.map((row) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'picker-option';
    button.setAttribute('role', 'option');
    button.textContent = row.name;
    button.addEventListener('click', () => onSelect(row.name, row));
    return button;
  });
  if (allowCustom && needle && !matches.some((row) => row.name.toLocaleLowerCase() === needle)) {
    const custom = document.createElement('button');
    custom.type = 'button';
    custom.className = 'picker-option custom-option';
    custom.setAttribute('role', 'option');
    custom.textContent = `Use “${query.trim()}”`;
    custom.addEventListener('click', () => onSelect(query.trim(), null));
    options.push(custom);
  }
  if (!options.length) {
    const empty = document.createElement('p');
    empty.className = 'picker-empty';
    empty.textContent = rows.length ? 'No matches. Try another search.' : 'No choices available.';
    options.push(empty);
  }
  list.replaceChildren(...options);
}

function openPicker(menu, input, toggle, search) {
  if (toggle.disabled) return;
  menu.classList.remove('hidden');
  input.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-expanded', 'true');
  search.value = '';
  search.dispatchEvent(new Event('input'));
  search.focus();
}

countryToggle.addEventListener('click', () => openPicker(countryMenu, countryInput, countryToggle, countrySearch));
countryInput.addEventListener('click', () => openPicker(countryMenu, countryInput, countryToggle, countrySearch));
stateToggle.addEventListener('click', () => openPicker(stateMenu, stateInput, stateToggle, stateSearch));
stateInput.addEventListener('click', () => openPicker(stateMenu, stateInput, stateToggle, stateSearch));
countrySearch.addEventListener('input', () => renderChoices(countryOptions, countries, countrySearch.value, (name) => {
  countryInput.value = name;
  closePicker(countryMenu, countryInput, countryToggle);
  countryInput.dispatchEvent(new Event('change'));
}));
stateSearch.addEventListener('input', () => renderChoices(stateOptions, states, stateSearch.value, (name) => {
  stateInput.value = name;
  closePicker(stateMenu, stateInput, stateToggle);
  stateInput.dispatchEvent(new Event('change'));
}, true));

document.addEventListener('pointerdown', (event) => {
  if (!$('country-picker').contains(event.target)) closePicker(countryMenu, countryInput, countryToggle);
  if (!$('state-picker').contains(event.target)) closePicker(stateMenu, stateInput, stateToggle);
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!countryMenu.classList.contains('hidden')) { closePicker(countryMenu, countryInput, countryToggle); countryToggle.focus(); }
  if (!stateMenu.classList.contains('hidden')) { closePicker(stateMenu, stateInput, stateToggle); stateToggle.focus(); }
});

async function loadCountries() {
  try {
    countries = await getData('countries.json');
    countries.sort((a, b) => a.name.localeCompare(b.name));
    renderChoices(countryOptions, countries, countrySearch.value, (name) => {
      countryInput.value = name;
      closePicker(countryMenu, countryInput, countryToggle);
      countryInput.dispatchEvent(new Event('change'));
    });
  } catch {
    countryOptions.textContent = 'Could not load countries. Open this list to retry.';
    countryToggle.addEventListener('click', loadCountries, { once: true });
  }
}

countryInput.addEventListener('change', async () => {
  const countryName = countryInput.value.trim();
  const countryRecord = countries.find((row) => row.name.toLocaleLowerCase() === countryName.toLocaleLowerCase());
  districtInput.value = '';
  districtOptions.replaceChildren();
  stateInput.value = '';
  stateInput.disabled = !countryRecord;
  stateToggle.disabled = !countryRecord;
  states = [];
  stateOptions.replaceChildren();
  stateInput.placeholder = countryRecord ? 'Choose a state / province' : 'Choose a country first';
  stateToggle.setAttribute('aria-expanded', 'false');
  showError('country', '');
  showError('state', '');
  if (!countryRecord) {
    if (countryName) showError('country', 'Choose a country from the search suggestions.');
    return;
  }
  try {
    const loadedStates = await getData(`states/${countryRecord.iso2}.json`);
    if (countryInput.value.trim().toLocaleLowerCase() !== countryRecord.name.toLocaleLowerCase()) return;
    states = loadedStates;
    states.sort((a, b) => a.name.localeCompare(b.name));
    renderChoices(stateOptions, states, stateSearch.value, (name) => {
      stateInput.value = name;
      closePicker(stateMenu, stateInput, stateToggle);
      stateInput.dispatchEvent(new Event('change'));
    }, true);
    stateInput.placeholder = states.length ? 'Choose a state / province' : 'Choose or type your state / province';
  } catch {
    stateInput.placeholder = 'Could not load regions';
    stateOptions.textContent = 'Could not load regions. You can still enter a state.';
  }
});

stateInput.addEventListener('change', async () => {
  const stateName = stateInput.value.trim();
  const stateRecord = states.find((row) => row.name.toLocaleLowerCase() === stateName.toLocaleLowerCase());
  const countryRecord = countries.find((row) => row.name.toLocaleLowerCase() === countryInput.value.trim().toLocaleLowerCase());
  districtInput.value = '';
  districtOptions.replaceChildren();
  showError('state', '');
  if (!stateName || !stateRecord || !countryRecord) return;
  districtInput.placeholder = 'Loading districts and cities…';
  try {
    const rows = await getData(`cities/${countryRecord.iso2}-${stateRecord.iso2}.json`);
    if (countryInput.value.trim().toLocaleLowerCase() !== countryRecord.name.toLocaleLowerCase() || stateInput.value.trim().toLocaleLowerCase() !== stateRecord.name.toLocaleLowerCase()) return;
    rows.sort((a, b) => a.name.localeCompare(b.name));
    districtOptions.replaceChildren(...rows.map((row) => new Option(row.name, row.name)));
  } catch {
    if (countryInput.value.trim().toLocaleLowerCase() !== countryRecord.name.toLocaleLowerCase() || stateInput.value.trim().toLocaleLowerCase() !== stateRecord.name.toLocaleLowerCase()) return;
    districtOptions.replaceChildren();
  }
  districtInput.placeholder = 'Choose or type your district';
});

$('username').addEventListener('input', (event) => {
  const username = event.target.value;
  const valid = /^[a-z0-9._]{1,14}$/.test(username);
  $('username-hint').textContent = username && valid ? `@${username} has the right format. Your username will be checked when you create your account.` : '1–14 lowercase letters, numbers, underscores, or dots.';
  showError('username', username && !valid ? 'Only lowercase letters, numbers, underscores, and dots are allowed.' : '');
});

$('profile-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('full-name').value.trim();
  const username = $('username').value.trim();
  showError('full-name', name ? '' : 'Please enter your name.');
  showError('farmer-type', $('farmer-type').value ? '' : 'Choose your farming focus.');
  const countryRecord = countries.find((row) => row.name.toLocaleLowerCase() === countryInput.value.trim().toLocaleLowerCase());
  showError('country', countryRecord ? '' : 'Search for and choose a country.');
  showError('state', stateInput.value.trim() ? '' : 'Search for or type your state / province.');
  showError('district', districtInput.value.trim() ? '' : 'Enter your district or city.');
  showError('username', /^[a-z0-9._]{1,14}$/.test(username) ? '' : 'Use 1–14 lowercase letters, numbers, underscores, or dots.');
  const invalid = ['full-name', 'farmer-type', 'country', 'state', 'district', 'username'].find((id) => $(`${id}-error`).classList.contains('visible'));
  if (invalid) { $(invalid).focus(); return; }
  await submitAuth('profile-form', '/api/auth/register', {
    email: $('email').value.trim(), password: $('password').value,
    displayName: name, username, farmerType: $('farmer-type').value,
    country: countryInput.value.trim(), region: stateInput.value.trim(), city: districtInput.value.trim(),
  });
});

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  showError('login-email', isGmail($('login-email').value) ? '' : 'Please enter a valid Gmail address.');
  showError('login-password', $('login-password').value ? '' : 'Enter your password.');
  const invalid = ['login-email', 'login-password'].find((id) => $(`${id}-error`).classList.contains('visible'));
  if (invalid) { $(invalid).focus(); return; }
  await submitAuth('login-form', '/api/auth/login', {
    email: $('login-email').value.trim(), password: $('login-password').value,
  });
});

async function submitAuth(formId, endpoint, payload) {
  const form = $(formId);
  const button = form.querySelector('button[type="submit"]');
  let feedback = form.querySelector('.auth-feedback');
  if (!feedback) {
    feedback = document.createElement('p');
    feedback.className = 'auth-feedback';
    feedback.setAttribute('role', 'alert');
    form.append(feedback);
  }
  feedback.textContent = '';
  button.disabled = true;
  try {
    const response = await fetch(endpoint, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Please try again.');
    window.location.assign(result.redirect || '/app');
  } catch (error) {
    feedback.textContent = error.message || 'Could not connect. Please try again.';
    button.disabled = false;
  }
}

function showStatus(title, copy) {
  registerPanel.classList.add('hidden');
  loginPanel.classList.add('hidden');
  statusPanel.classList.remove('hidden');
  $('status-title').textContent = title;
  $('status-copy').textContent = copy;
  $('status-back').focus();
}

$('status-back').addEventListener('click', () => {
  accountStep.classList.remove('hidden');
  profileStep.classList.add('hidden');
  setMode(selectedMode);
});

loadCountries();
