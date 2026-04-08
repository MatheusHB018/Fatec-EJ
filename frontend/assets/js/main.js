const page = document.body.dataset.page;

function getProjectRoot() {
  if (window.location.protocol === 'file:') {
    return 'http://localhost/Fatec-EJ';
  }

  const path = window.location.pathname;
  const frontendIndex = path.indexOf('/frontend/');
  const backendIndex = path.indexOf('/backend/');

  if (frontendIndex !== -1) {
    return `${window.location.origin}${path.slice(0, frontendIndex)}`;
  }

  if (backendIndex !== -1) {
    return `${window.location.origin}${path.slice(0, backendIndex)}`;
  }

  return window.location.origin;
}

const PROJECT_ROOT = getProjectRoot();
const API_BASE = `${PROJECT_ROOT}/backend/public/api`;

// Resolve media URLs returned by the API to a URL reachable from the frontend.
// If backend returns paths like "/storage/...", prepend the project root + backend/public
function resolveMediaUrl(url) {
  if (!url) return '';
  // already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // API might return '/storage/...' (Laravel public storage). Build full path relative to project root.
  if (url.startsWith('/storage/')) {
    return `${PROJECT_ROOT}/backend/public${url}`;
  }
  // fallback: if url is already prefixed with backend/public, ensure project root present
  if (url.startsWith('/backend/public/')) return `${PROJECT_ROOT}${url}`;
  return url;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function formatCpf(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  let masked = digits;
  masked = masked.replace(/(\d{3})(\d)/, '$1.$2');
  masked = masked.replace(/(\d{3})(\d)/, '$1.$2');
  masked = masked.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return masked;
}

function extractEventSchedules(eventItem) {
  if (!eventItem || typeof eventItem !== 'object') {
    return [];
  }

  if (Array.isArray(eventItem.schedules) && eventItem.schedules.length > 0) {
    return eventItem.schedules
      .map((schedule) => ({
        start_date: schedule?.start_date || '',
        end_date: schedule?.end_date || '',
      }))
      .filter((schedule) => schedule.start_date);
  }

  if (Array.isArray(eventItem.start_dates) && eventItem.start_dates.length > 0) {
    return eventItem.start_dates.map((startDate, index) => ({
      start_date: startDate,
      end_date: Array.isArray(eventItem.end_dates) ? (eventItem.end_dates[index] || startDate) : startDate,
    }));
  }

  if (eventItem.start_date) {
    return [{
      start_date: eventItem.start_date,
      end_date: eventItem.end_date || eventItem.start_date,
    }];
  }

  return [];
}

function formatScheduleLabel(schedule) {
  const start = parseDateTime(schedule?.start_date || '');
  const end = parseDateTime(schedule?.end_date || '');

  if (!start) {
    return '-';
  }

  const dateLabel = start.toLocaleDateString('pt-BR');
  const startHour = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const endHour = end
    ? end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : startHour;

  return `${dateLabel} das ${startHour} as ${endHour}`;
}

function formatCardFirstSchedule(schedule) {
  const start = parseDateTime(schedule?.start_date || '');

  if (!start) {
    return 'Data a confirmar';
  }

  return `${start.toLocaleDateString('pt-BR')} - ${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function isValidCpf(cpf) {
  const stripped = String(cpf || '').replace(/\D/g, '');
  if (stripped.length !== 11) return false;
  if (/^(\d)\1+$/.test(stripped)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(stripped.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== Number(stripped.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(stripped.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === Number(stripped.charAt(10));
}
function initEventRegistrationForm() {
  const form = document.getElementById('event-registration-form');
  const statusEl = document.getElementById('event-registration-status');
  const cpfEl = document.getElementById('registration-cpf');
  const eventIdInput = document.getElementById('registration-event-id');
  const eventTitleEl = document.getElementById('event-details-title');
  const eventSchedulesEl = document.getElementById('event-details-schedules');
  const eventLocationEl = document.getElementById('event-details-location');
  const eventDescriptionEl = document.getElementById('event-details-description');
  const eventPriceEl = document.getElementById('event-details-price');
  const eventPixEl = document.getElementById('event-details-pix');
  const eventPixSectionEl = document.getElementById('event-pix-section');
  const eventPaymentTitleEl = document.getElementById('event-payment-title');
  const eventStartDateTimeSelectEl = document.getElementById('event-start-datetime-select');

  let selectedDateTime = '';

  function formatDateTimeOption(value) {
    if (!value) return '-';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function formatCourseScheduleLabel(s) {
    const start = parseDateTime(s?.start || '');
    const end   = parseDateTime(s?.end   || '');
    if (!start) return s?.start || '-';
    const dateStr  = start.toLocaleDateString('pt-BR');
    const startHr  = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const endHr    = end ? end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
    return endHr ? `${dateStr} - ${startHr} até ${endHr}` : `${dateStr} - ${startHr}`;
  }

  function setDateTimeOptions(eventItem) {
    const courseSchedules = Array.isArray(eventItem?.course_schedules) ? eventItem.course_schedules : [];

    // Populate <ul> with all course dates
    if (eventSchedulesEl) {
      if (courseSchedules.length === 0) {
        eventSchedulesEl.innerHTML = '<li>Data da aula a confirmar</li>';
      } else {
        eventSchedulesEl.innerHTML = courseSchedules
          .map((s) => `<li>${escapeHtml(formatCourseScheduleLabel(s))}</li>`)
          .join('');
      }
    }

    if (!eventStartDateTimeSelectEl) return;

    eventStartDateTimeSelectEl.innerHTML = '';

    if (!courseSchedules.length) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'Sem horários disponíveis';
      eventStartDateTimeSelectEl.appendChild(emptyOption);
      selectedDateTime = '';
      return;
    }

    courseSchedules.forEach((s, index) => {
      const optionEl = document.createElement('option');
      optionEl.value = s?.start || String(index);
      optionEl.textContent = formatCourseScheduleLabel(s);
      if (index === 0) optionEl.selected = true;
      eventStartDateTimeSelectEl.appendChild(optionEl);
    });

    selectedDateTime = courseSchedules[0]?.start || '';
  }

  if (eventStartDateTimeSelectEl) {
    eventStartDateTimeSelectEl.addEventListener('change', (event) => {
      selectedDateTime = event.target.value;
    });
  }

  const eventIdFromQuery = new URLSearchParams(window.location.search).get('event_id');

  const loadAndShowEvent = () => {
    return fetchJson('/events')
      .then((payload) => {
        const events = Array.isArray(payload) ? payload : (payload.events || []);
        const eventItem = events.find((ev) => String(ev.id) === String(eventIdFromQuery));
        if (!eventItem) {
          if (eventTitleEl) eventTitleEl.textContent = 'Evento não encontrado';
          if (eventDescriptionEl) eventDescriptionEl.textContent = 'Nenhum evento disponível para inscrição com os dados fornecidos.';
          if (form) form.querySelector('button[type="submit"]').disabled = true;
          return;
        }

        if (eventTitleEl) eventTitleEl.textContent = `Inscrição: ${eventItem.title}`;
        if (eventLocationEl) eventLocationEl.textContent = eventItem.location || '-';
        if (eventDescriptionEl) eventDescriptionEl.textContent = eventItem.description || '-';
        const priceNum = Number(String(eventItem?.price || '0').replace(',', '.'));
        const formattedPrice = priceNum > 0
          ? priceNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : 'Gratuito';
        if (eventPriceEl) eventPriceEl.textContent = formattedPrice;

        if (eventItem?.pix_key) {
          if (eventPixEl) eventPixEl.textContent = eventItem.pix_key;

          if (eventPixSectionEl) eventPixSectionEl.classList.remove('hidden');
          if (eventPaymentTitleEl) eventPaymentTitleEl.classList.remove('hidden');
        } else {
          if (eventPixSectionEl) eventPixSectionEl.classList.add('hidden');
          if (eventPaymentTitleEl) eventPaymentTitleEl.classList.add('hidden');
        }

        setDateTimeOptions(eventItem);
        if (eventIdInput) eventIdInput.value = eventItem.id;
      })
      .catch((err) => {
        console.error('Erro ao carregar evento para inscrição:', err);
        if (eventTitleEl) eventTitleEl.textContent = 'Erro ao carregar evento';
        if (form) form.querySelector('button[type="submit"]').disabled = true;
      });
  };

  if (page === 'event-registration') {
    if (!eventIdFromQuery) {
      if (eventTitleEl) eventTitleEl.textContent = 'Nenhum evento selecionado';
      if (eventDescriptionEl) eventDescriptionEl.textContent = 'Informe o evento via URL.';
      if (form) form.querySelector('button[type="submit"]').disabled = true;
    } else {
      loadAndShowEvent();
    }
  }

  if (!form) return;

  if (cpfEl) {
    cpfEl.addEventListener('input', () => {
      cpfEl.value = formatCpf(cpfEl.value);
    });
  }

  // ViaCEP isolado para evitar conflito com outros listeners.
  const cepInput = document.getElementById('cep');
  const streetInput = document.getElementById('street');
  const numberInput = document.getElementById('number');
  const neighborhoodInput = document.getElementById('neighborhood');
  const cityInput = document.getElementById('city');
  const stateInput = document.getElementById('state');
  const fatecCourseInput = document.getElementById('fatec_course');

  const resolveCep = async () => {
    if (!cepInput) return;

    const cepValue = String(cepInput.value || '').replace(/\D/g, '');
    if (cepValue.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await response.json();

      if (data && !data.erro) {
        cepInput.value = cepValue.replace(/(\d{5})(\d{3})/, '$1-$2');
        if (streetInput) streetInput.value = data.logradouro || '';
        if (neighborhoodInput) neighborhoodInput.value = data.bairro || '';
        if (cityInput) cityInput.value = data.localidade || '';
        if (stateInput) stateInput.value = data.uf || '';
      }
    } catch (error) {
      console.error('Erro ao buscar o CEP:', error);
    }
  };

  const attachViaCep = () => {
    if (!cepInput || cepInput.dataset.viaCepBound === '1') return;

    cepInput.addEventListener('input', resolveCep);
    cepInput.addEventListener('blur', resolveCep);
    cepInput.dataset.viaCepBound = '1';
  };

  attachViaCep();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    await resolveCep();

    const formData = new FormData(form);
    const cepValue = cepInput ? String(cepInput.value || '').trim() : '';
    const streetValue = streetInput ? String(streetInput.value || '').trim() : '';
    const numberValue = numberInput ? String(numberInput.value || '').trim() : '';
    const neighborhoodValue = neighborhoodInput ? String(neighborhoodInput.value || '').trim() : '';
    const cityValue = cityInput ? String(cityInput.value || '').trim() : '';
    const stateValue = stateInput ? String(stateInput.value || '').trim() : '';
    const fatecCourseValue = fatecCourseInput ? String(fatecCourseInput.value || '').trim() : '';

    formData.set('cep', cepValue);
    formData.set('street', streetValue);
    formData.set('number', numberValue);
    formData.set('neighborhood', neighborhoodValue);
    formData.set('city', cityValue);
    formData.set('state', stateValue);
    formData.set('fatec_course', fatecCourseValue);

    const cpf = formData.get('cpf') ? String(formData.get('cpf')).trim() : '';

    if (!isValidCpf(cpf)) {
      if (statusEl) {
        statusEl.textContent = 'CPF inválido. Verifique os dígitos e tente novamente.';
        statusEl.className = 'mt-3 text-sm text-rose-600';
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/event-registrations`, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Erro ao enviar inscrição.');
      }

      form.reset();
      if (statusEl) {
        statusEl.textContent = payload.message || 'Inscrição enviada com sucesso!';
        statusEl.className = 'mt-3 text-sm text-emerald-700';
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || 'Falha no envio.';
        statusEl.className = 'mt-3 text-sm text-rose-600';
      }
    }
  });
}

function parseDateTime(value) {
  if (!value) return null;

  try {
    // Verifica se o valor inclui horário (formato YYYY-MM-DDTHH:mm) ou se é apenas data
    const isDateTime = value.includes('T');
    const [datePart, timePart] = isDateTime ? value.split('T') : [value, '00:00'];

    // Extrai os valores numéricos
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

    // O mês no JavaScript começa em 0 (Janeiro = 0, Março = 2, etc.), por isso month - 1
    const date = new Date(year, month - 1, day, hour, minute || 0);

    return Number.isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

function getEventTimingState(event) {
  const now = new Date();
  const start = parseDateTime(event.start_date);
  const end = parseDateTime(event.end_date);

  const isUpcoming = start && now < start;
  const isEnded = end && now > end;
  const isOngoing = start && end && now >= start && now <= end;

  return { start, end, isUpcoming, isOngoing, isEnded };
}

function iconClass(icon) {
  const map = {
    globe: 'fa-solid fa-globe',
    mobile: 'fa-solid fa-mobile-screen-button',
    palette: 'fa-solid fa-palette',
    display: 'fa-solid fa-display',
    chart: 'fa-solid fa-chart-column',
    database: 'fa-solid fa-database',
    briefcase: 'fa-solid fa-briefcase',
    social: 'fa-solid fa-hand-holding-heart',
    'graduation-cap': 'fa-solid fa-graduation-cap',
  };

  return map[icon] || 'fa-solid fa-circle';
}

function inferProductCategory(productName) {
  const name = (productName || '').toLowerCase();

  if (name.includes('moletom') || name.includes('camiseta')) {
    return 'Vestuário';
  }

  if (name.includes('caneca')) {
    return 'Acessórios';
  }


  return 'Produtos';
}

// Normalize category labels for comparison (remove accents, lowercase, trim)
function normalizeCategoryLabel(label) {
  if (!label) return '';
  return String(label)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '')
    .replace('categoria', '')
  // normalize plural vs singular (remove trailing 's') and trim
  .trim();
}

// Return pretty category name for display using product.category when available
function prettyCategoryFromProduct(product) {
  if (!product) return 'Produtos';
  if (product.category) {
    const cat = String(product.category).toLowerCase();
    if (cat === 'vetuario' || cat === 'vestuario' || cat === 'vestuário') return 'Vestuário';
    if (cat === 'acessorio' || cat === 'acessório') return 'Acessórios';
    return String(product.category);
  }
  return inferProductCategory(product.name);
}

function canonicalCategory(norm) {
  if (!norm) return '';
  const n = String(norm).toLowerCase();
  if (n === 'vetuario') return 'vestuario'; // tolerate typo in DB
  if (n === 'vestuario') return 'vestuario';
  if (n === 'acessorio' || n === 'acessorios') return 'acessorio';
  if (n === 'todos' || n === 'todo') return 'todos';
  return n;
}

function renderMenu(menuItems) {
  const menu = document.getElementById('main-menu');

  if (!menu || !Array.isArray(menuItems) || menuItems.length === 0) {
    return;
  }

  // Ensure the public menu contains an "Eventos" item so the page anchor remains
  // available even if the backend DB doesn't include it yet. Insert before
  // the 'editais' item when possible to keep a sensible order.
  try {
    const hasEventos = menuItems.some((m) => String(m.slug).toLowerCase() === 'eventos');
    if (!hasEventos) {
      const editaisIndex = menuItems.findIndex((m) => String(m.slug).toLowerCase() === 'editais');
      const insertIndex = editaisIndex === -1 ? menuItems.length : editaisIndex;
      const eventosItem = { label: 'Eventos', slug: 'eventos', position: insertIndex, is_active: true };
      // create a new array so we don't unexpectedly mutate upstream state
      menuItems = [...menuItems.slice(0, insertIndex), eventosItem, ...menuItems.slice(insertIndex)];
    }
  } catch (err) {
    // If anything goes wrong, don't block rendering the rest of the menu
    console.debug('menu fallback for eventos failed', err);
  }

  const homeHrefPrefix = page === 'products' ? '../index.html#' : '#';
  const productsHref = page === 'products' ? 'produtos.html' : 'pages/produtos.html';

  menu.innerHTML = menuItems
    .filter((item) => item.slug !== 'loja')
    .map((item) => {
    const isStore = item.slug === 'loja';
    const href = isStore ? productsHref : `${homeHrefPrefix}${item.slug}`;
    const activeClass = (page === 'products' && isStore) ? 'text-pink-700' : 'hover:text-pink-700 transition-colors';

    return `<a href="${href}" class="${activeClass}">${escapeHtml(item.label)}</a>`;
  }).join('');
}

function renderFooter(site, menuItems, services, settings) {
  const quickLinks = document.getElementById('footer-quick-links');
  const servicesList = document.getElementById('footer-services');
  const managementName = document.getElementById('management-name');
  const copyrightText = document.getElementById('copyright-text');

  if (quickLinks && Array.isArray(menuItems) && menuItems.length > 0) {
    const footerItems = menuItems.filter((item) => item.slug !== 'loja').slice(0, 5);
    const hrefPrefix = page === 'products' ? '../index.html#' : '#';

    quickLinks.innerHTML = footerItems.map((item) => (
      `<li><a href="${hrefPrefix}${item.slug}" class="hover:text-red-300">${escapeHtml(item.label)}</a></li>`
    )).join('');
  }

  if (servicesList && Array.isArray(services) && services.length > 0) {
    servicesList.innerHTML = services.slice(0, 4)
      .map((service) => `<li>${escapeHtml(service.title)}</li>`)
      .join('');
  }

  if (managementName && settings?.management_name) {
    managementName.textContent = settings.management_name;
  }

  if (copyrightText && site?.copyright_text) {
    copyrightText.textContent = site.copyright_text;
  }
}

async function fetchJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Falha ao carregar dados da API.';

    try {
      const payload = await response.json();
      message = payload.message || payload.error || message;
    } catch (error) {
      message = `${message} (${response.status})`;
    }

    throw new Error(message);
  }

  return response.json();
}

function renderHomeContent(payload) {
  const settings = payload.settings || {};
  const sections = payload.sections || {};
  const about = payload.about || {};
  const site = payload.site || {};

  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const aboutSubtitle = document.getElementById('about-subtitle');
  const aboutTitle = document.getElementById('about-title');
  const aboutSummary = document.getElementById('about-summary');
  const aboutMission = document.getElementById('about-mission');
  const aboutVision = document.getElementById('about-vision');
  const aboutValues = document.getElementById('about-values');
  const aboutProfessor = document.getElementById('about-professor');
  const aboutMandate = document.getElementById('about-mandate');
  const aboutImage = document.getElementById('about-image');
  const aboutImagePlaceholder = document.getElementById('about-image-placeholder');
  const teamGrid = document.getElementById('team-grid');
  const servicesGrid = document.getElementById('services-grid');
  const pillarsGrid = document.getElementById('pillars-grid');
  const projectsGrid = document.getElementById('projects-grid');
  const editalsGrid = document.getElementById('editals-grid');

  if (heroTitle) {
    heroTitle.innerHTML = escapeHtml(settings.hero_title || sections.inicio?.title || 'Empresa Júnior FATEC');
  }

  if (heroSubtitle) {
    heroSubtitle.textContent = settings.hero_subtitle || sections.inicio?.content || '';
  }

  if (aboutSubtitle) {
    aboutSubtitle.textContent = about.subtitle || sections.sobre?.subtitle || aboutSubtitle.textContent;
  }

  if (aboutTitle) {
    aboutTitle.textContent = about.title || sections.sobre?.title || aboutTitle.textContent;
  }

  if (aboutSummary) {
    aboutSummary.textContent = about.summary || sections.sobre?.content || aboutSummary.textContent;
  }

  if (aboutMission) {
    aboutMission.textContent = about.mission || aboutMission.textContent;
  }

  if (aboutVision) {
    aboutVision.textContent = about.vision || aboutVision.textContent;
  }

  if (aboutValues && Array.isArray(about.values) && about.values.length > 0) {
    aboutValues.innerHTML = about.values
      .map((value) => `<li>${escapeHtml(value)}</li>`)
      .join('');
  }

  if (aboutProfessor && about.professor) {
    aboutProfessor.textContent = `Professor responsável: ${about.professor}.`;
  }

  if (aboutMandate && about.mandate) {
    aboutMandate.textContent = about.mandate;
  }

  if (aboutImage && aboutImagePlaceholder) {
    if (about.image_url) {
      aboutImage.src = resolveMediaUrl(about.image_url);
      aboutImage.classList.remove('hidden');
      aboutImagePlaceholder.classList.add('hidden');
    } else {
      aboutImage.src = '';
      aboutImage.classList.add('hidden');
      aboutImagePlaceholder.classList.remove('hidden');
    }
  }

  if (teamGrid && Array.isArray(payload.team) && payload.team.length > 0) {
    teamGrid.innerHTML = payload.team.map((member) => `
      <article class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 text-center">
        ${member.photo_url
          ? `<img src="${escapeHtml(resolveMediaUrl(member.photo_url))}" alt="${escapeHtml(member.name)}" class="mx-auto h-16 w-16 rounded-full object-cover border border-slate-200" />`
          : `<div class="mx-auto h-16 w-16 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-xl font-bold">${escapeHtml(member.initials || member.name.split(' ').map((piece) => piece[0]).slice(0, 2).join(''))}</div>`}
        <p class="mt-4 font-semibold text-red-800">${escapeHtml(member.role)}</p>
        <p class="text-slate-600">${escapeHtml(member.name)}</p>
      </article>
    `).join('');
  }

  if (servicesGrid && Array.isArray(payload.services) && payload.services.length > 0) {
    servicesGrid.innerHTML = payload.services.map((service) => `
      <article class="rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-800 text-xl"><i class="fa-solid fa-briefcase"></i></span>
        <h3 class="mt-5 text-3xl font-bold">${escapeHtml(service.title)}</h3>
        <p class="mt-3 text-slate-500">${escapeHtml(service.description)}</p>
        <a href="#contato" class="mt-5 inline-flex items-center gap-2 text-red-800 font-semibold">Saiba mais <i class="fa-solid fa-arrow-right"></i></a>
      </article>
    `).join('');
  }

  if (pillarsGrid && Array.isArray(payload.pillars) && payload.pillars.length > 0) {
    pillarsGrid.innerHTML = payload.pillars.map((pillar) => `
      <article class="bg-white rounded-xl border border-slate-200 shadow-sm p-7 text-center">
        <span class="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-red-50 text-red-800 text-3xl">
          <i class="${iconClass(pillar.icon)}"></i>
        </span>
        <h3 class="mt-5 text-2xl font-bold">${escapeHtml(pillar.title)}</h3>
        <p class="mt-3 text-slate-500">${escapeHtml(pillar.description)}</p>
      </article>
    `).join('');
  }

  if (projectsGrid && Array.isArray(payload.projects) && payload.projects.length > 0) {
    projectsGrid.innerHTML = payload.projects.map((project) => {
      const techList = String(project.technologies || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `<span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">${escapeHtml(item)}</span>`)
        .join('');

      const projectImage = project.image_url
        ? `<img src="${escapeHtml(resolveMediaUrl(project.image_url))}" alt="${escapeHtml(project.title)}" class="h-40 w-full object-cover" />`
        : `<div class="h-40 bg-rose-50 flex items-center justify-center">
            <span class="h-10 w-10 rounded-xl bg-rose-100 text-red-800 flex items-center justify-center"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
          </div>`;

      return `
        <article class="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          ${projectImage}
          <div class="p-5">
            <h3 class="text-xl font-bold">${escapeHtml(project.title)}</h3>
            <p class="mt-2 text-slate-500">${escapeHtml(project.description)}</p>
            <div class="mt-4 flex flex-wrap gap-2 text-xs">${techList}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  if (editalsGrid && Array.isArray(payload.editals) && payload.editals.length > 0) {
    editalsGrid.innerHTML = payload.editals.map((edital) => `
      <article class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <span class="h-11 w-11 rounded-xl bg-rose-100 text-red-800 flex items-center justify-center"><i class="fa-regular fa-file-lines"></i></span>
          <span class="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-500">${escapeHtml(edital.status)}</span>
        </div>
        <h3 class="mt-5 text-xl font-bold">${escapeHtml(edital.title)}</h3>
        <p class="mt-2 text-slate-500">${escapeHtml(edital.description)}</p>
        <p class="mt-5 text-sm text-slate-500 flex items-center gap-2"><i class="fa-regular fa-calendar"></i> ${escapeHtml(edital.enrollment_period || '')}</p>
        ${edital.file_url
          ? `<a href="${escapeHtml(edital.file_url)}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-800">Ver edital oficial <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i></a>`
          : ''}
      </article>
    `).join('');
  }

  renderMenu(payload.menu);
  renderFooter(site, payload.menu, payload.services, settings);
}

// Public events loader and renderer
async function loadPublicEvents() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  console.log("Teste");
  try {
    const url = `${API_BASE}/events`;
    console.debug('[events] fetching public events from', url);

    
    // use fetchJson for consistent error handling but log URL for debugging
    const payload = await fetchJson('/events');
    const events = Array.isArray(payload) ? payload : (payload?.events || []);

    if (!events.length) {
      grid.innerHTML = `<article class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"><h3 class="mt-2 text-xl font-bold">Nenhum evento disponível</h3><p class="mt-2 text-slate-500">Ainda não há eventos públicos cadastrados. Volte em breve.</p></article>`;
      return;
    }

    grid.innerHTML = events.map((ev) => {
      try {
        // --- Datas do cronograma do curso (course_schedules) ---
        const courseSchedules = Array.isArray(ev?.course_schedules) ? ev.course_schedules : [];
        const primeiraAula = courseSchedules.length > 0 ? courseSchedules[0] : null;

        let courseLabel = 'Data da aula a definir';
        if (primeiraAula) {
          const aulaStart = parseDateTime(primeiraAula?.start || '');
          const aulaEnd   = parseDateTime(primeiraAula?.end   || '');
          if (aulaStart) {
            const dateStr = aulaStart.toLocaleDateString('pt-BR');
            const startHr = aulaStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const endHr   = aulaEnd
              ? aulaEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : null;
            courseLabel = endHr ? `${dateStr} - ${startHr} até ${endHr}` : `${dateStr} - ${startHr}`;
          }
        }
        const extraDaysCount = courseSchedules.length > 1 ? courseSchedules.length - 1 : 0;

        // --- Período de inscrições (usado apenas para o botão de ação) ---
        const parsedPrice = Number(String(ev?.price ?? '0').replace(',', '.'));
        const formattedPrice = (ev?.price && parsedPrice > 0)
          ? parsedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : 'Gratuito';
        const timing = getEventTimingState(ev || {});
        const inscStart = timing.start;

        let actionEl = '';
        if (timing.isEnded) {
          actionEl = `<span class="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-rose-600">Encerrado</span>`;
        } else if (timing.isUpcoming) {
          actionEl = `<span class="rounded-xl bg-yellow-50 px-3 py-1 text-xs font-semibold text-amber-700">Inscrições abrem em ${inscStart ? inscStart.toLocaleString('pt-BR') : 'em breve'}</span>`;
        } else if (timing.isOngoing) {
          const encodedTitle = encodeURIComponent(ev?.title || 'Evento');
          actionEl = `<a href="pages/inscricao.html?event_id=${encodeURIComponent(ev?.id || '')}&event_title=${encodedTitle}" class="inline-flex items-center gap-2 text-red-800 font-semibold">Inscrever-se <i class="fa-solid fa-arrow-right"></i></a>`;
        } else {
          actionEl = `<span class="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Verifique datas do evento</span>`;
        }

        return `
          <article class="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full p-6">
            <h3 class="text-xl font-bold text-slate-900">${escapeHtml(ev?.title || 'Evento')}</h3>
            <p class="mt-2 text-slate-600 text-sm leading-relaxed">${escapeHtml((ev?.description || '').slice(0, 160))}</p>

            <div class="mt-4 space-y-2 text-sm text-slate-700">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-location-dot text-red-800"></i>
                <span>${escapeHtml(ev?.location || 'Local a confirmar')}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-regular fa-calendar-days text-red-800"></i>
                <span class="font-medium text-gray-700">${escapeHtml(courseLabel)}</span>
              </div>
            </div>

            ${extraDaysCount > 0
              ? `<span class="mt-2 inline-flex w-fit text-xs text-red-800 font-bold bg-red-50 px-2 rounded">+ ${extraDaysCount} dias de curso</span>`
              : ''}

            <div class="flex justify-between items-center mt-auto pt-4 border-t border-slate-200">
              <div class="text-sm font-semibold text-red-800">${formattedPrice}</div>
              <div>
                ${actionEl}
              </div>
            </div>
          </article>
        `;
      } catch (renderError) {
        console.error('erro ao renderizar card de evento', renderError, ev);
        return '';
      }
    }).join('');
  } catch (err) {
    console.error('failed to load public events', err);
    // show a visible error in the events grid so it's obvious to the site admin/user
    grid.innerHTML = `<article class="bg-white border border-rose-200 rounded-2xl shadow-sm p-6"><h3 class="mt-2 text-xl font-bold">Erro ao carregar eventos</h3><p class="mt-2 text-rose-600">${escapeHtml(err.message || String(err))}</p><p class="mt-2 text-sm text-slate-500">Verifique o console e as rotas do backend.</p></article>`;
  }
}

function setContactStatus(message, variant) {
  const status = document.getElementById('contact-status');

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.remove('hidden', 'bg-red-50', 'text-red-800', 'bg-emerald-50', 'text-emerald-800');

  if (variant === 'success') {
    status.classList.add('bg-emerald-50', 'text-emerald-800');
  } else {
    status.classList.add('bg-red-50', 'text-red-800');
  }
}

function initContactForm() {
  const form = document.getElementById('contact-form');

  if (!form) {
    return;
  }

  const profileButtons = document.querySelectorAll('[data-profile-button]');
  const profileTypeInput = document.getElementById('profile-type');
  const studentFields = document.getElementById('student-fields');
  const submitButton = form.querySelector('button[type="submit"]');

  function updateProfile(profileType) {
    profileTypeInput.value = profileType;

    profileButtons.forEach((button) => {
      const isActive = button.dataset.profileButton === profileType;
      button.className = isActive ? 'tab-active' : 'tab-inactive';
    });

    if (studentFields) {
      studentFields.classList.toggle('hidden', profileType !== 'aluno');
    }
  }

  profileButtons.forEach((button) => {
    button.addEventListener('click', () => updateProfile(button.dataset.profileButton));
  });

  updateProfile('empresa');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    setContactStatus('', 'error');
    document.getElementById('contact-status').classList.add('hidden');

    const payload = {
      profile_type: profileTypeInput.value,
      name: document.getElementById('nome-completo').value.trim(),
      email: document.getElementById('email').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      message: document.getElementById('mensagem').value.trim(),
    };

    if (payload.profile_type === 'aluno') {
      payload.ra = document.getElementById('ra').value.trim();
      payload.course = document.getElementById('curso').value.trim();
      payload.period = document.getElementById('periodo').value.trim();
    }
    try {
      const response = await fetchJson('/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      form.reset();
      updateProfile('empresa');
      setContactStatus(response.message || 'Mensagem enviada com sucesso!', 'success');
    } catch (error) {
      setContactStatus(error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar Mensagem';
    }
  });
}

let allProducts = [];
let selectedProduct = null;

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  const status = document.getElementById('products-status');

  if (!grid) {
    return;
  }

  if (!products.length) {
    grid.innerHTML = '';
    status.textContent = 'Nenhum produto encontrado com os filtros atuais.';
    status.classList.remove('hidden');
    status.classList.add('bg-slate-200', 'text-slate-700');
    return;
  }

  status.classList.add('hidden');
  grid.innerHTML = products.map((product) => {
  const category = prettyCategoryFromProduct(product);

    return `
      <article class="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <button type="button" class="w-full text-left" data-product-id="${product.id}">
          <div class="relative h-52 bg-slate-100 flex items-center justify-center text-slate-400">
            ${product.image_url
              ? `<img src="${escapeHtml(resolveMediaUrl(product.image_url))}" alt="${escapeHtml(product.name)}" class="w-full h-52 object-cover" />`
              : `<i class="fa-solid fa-image text-4xl"></i>`}
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors flex items-center justify-center">
              <span class="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800">
                <i class="fa-regular fa-eye"></i>
                Ver Detalhes
              </span>
            </div>
          </div>
          <div class="p-5">
            <p class="text-xs font-bold uppercase tracking-wider text-red-900">${escapeHtml(category)}</p>
            <h3 class="mt-2 text-lg font-bold">${escapeHtml(product.name)}</h3>
            <p class="mt-2 text-2xl font-extrabold text-red-950">${formatPrice(product.price)}</p>
          </div>
        </button>
        <div class="px-5 pb-5">
          <button type="button" class="w-full rounded-xl bg-pink-700 text-white py-2.5 font-semibold hover:bg-pink-600 transition-colors" data-product-id="${product.id}">Ver Mais</button>
        </div>
      </article>
    `;
  }).join('');
}

function fillProductModal(product) {
  const modalName = document.getElementById('modal-product-name');
  const modalCategory = document.getElementById('modal-product-category');
  const modalPrice = document.getElementById('modal-product-price');
  const modalDescription = document.getElementById('modal-product-description');
  const modalAvailability = document.getElementById('modal-availability');

  const modalSizeSelect = document.getElementById('tamanho');

  if (!product) {
    return;
  }

  selectedProduct = product;
  modalName.textContent = product.name;
  modalCategory.textContent = `Categoria: ${prettyCategoryFromProduct(product)}`;
  // Show price with coupon discount if present
  const coupon = product.coupon_discount ? Number(product.coupon_discount) : 0;
  if (coupon && !isNaN(coupon) && coupon > 0) {
    const original = formatPrice(product.price);
    const discounted = formatPrice(Number(product.price) - coupon);
    modalPrice.innerHTML = `<span class="line-through text-base text-slate-500 mr-3">${original}</span><span class="text-3xl font-extrabold text-pink-700">${discounted}</span>`;
  } else {
    modalPrice.textContent = formatPrice(product.price);
  }
  modalDescription.textContent = product.description || 'Produto exclusivo da EJ FATEC.';
  modalAvailability.textContent = product.is_active ? 'Disponível' : 'Indisponível';

  // Populate size select based on product.sizes if available.
  // Expected shape: product.sizes = { PP: 1, P: 2, M: 0, G: 3, GG: 0, XG: 0 }
  // Support a few possible shapes (object, JSON string, or array).
  try {
    const sizesOrder = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
    let sizesObj = {};

    if (!modalSizeSelect) {
      // nothing to do
    } else {
      // Build sizesObj from new backend shape (sizes map) or available_sizes + stock_xx
      if (product.sizes && typeof product.sizes === 'object' && !Array.isArray(product.sizes)) {
        sizesObj = product.sizes;
      } else if (Array.isArray(product.available_sizes) && product.available_sizes.length > 0) {
        product.available_sizes.forEach((s) => {
          const key = String(s).toUpperCase();
          const qtyField = `stock_${key.toLowerCase()}`;
          const qty = product.hasOwnProperty(qtyField) ? Number(product[qtyField] || 0) : 0;
          sizesObj[key] = qty;
        });
        sizesOrder.forEach((s) => { if (!sizesObj.hasOwnProperty(s)) sizesObj[s] = 0; });
      } else if (product.sizes) {
        // legacy handling: string/array/object
        if (typeof product.sizes === 'string') {
          try { sizesObj = JSON.parse(product.sizes); } catch (e) { sizesObj = {}; }
        } else if (Array.isArray(product.sizes)) {
          product.sizes.forEach((entry) => {
            if (typeof entry === 'string') sizesObj[entry] = sizesObj[entry] ? sizesObj[entry] + 1 : 1;
            else if (entry && typeof entry === 'object') {
              if (entry.size) sizesObj[entry.size] = Number(entry.qty || 1);
              else Object.keys(entry).forEach((k) => sizesObj[k] = Number(entry[k] || 0));
            }
          });
        } else if (typeof product.sizes === 'object') {
          sizesObj = product.sizes || {};
        }
      } else {
        // fallback: no sizes info -> zero quantities
        sizesOrder.forEach((s) => { sizesObj[s] = 0; });
      }

      // clear existing options and build UI
      modalSizeSelect.innerHTML = '';
      const modalSizeButtons = document.getElementById('modal-size-buttons');
      if (modalSizeButtons) modalSizeButtons.innerHTML = '';
  const modalSizesQuantities = document.getElementById('modal-sizes-quantities');
  if (modalSizesQuantities) modalSizesQuantities.innerHTML = '';

      let firstAvailable = null;
      sizesOrder.forEach((s) => {
        const qty = Number(sizesObj[s] || 0);
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = qty > 0 ? `${s} (${qty} disponíveis)` : `${s} (indisponível)`;
        if (qty <= 0) opt.disabled = true;
        else if (firstAvailable === null) firstAvailable = s;
        modalSizeSelect.appendChild(opt);

        if (modalSizeButtons) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium bg-white text-slate-700';
          btn.dataset.size = s;
          btn.textContent = s;
          if (qty <= 0) { btn.disabled = true; btn.classList.add('opacity-40', 'cursor-not-allowed'); }
          btn.addEventListener('click', () => {
            if (btn.disabled) return;
            modalSizeSelect.value = s;
            Array.from(modalSizeButtons.querySelectorAll('button')).forEach((b) => b.classList.remove('ring-2', 'ring-pink-700', 'bg-pink-700', 'text-white'));
            btn.classList.add('ring-2', 'ring-pink-700', 'bg-pink-700', 'text-white');
          });
          modalSizeButtons.appendChild(btn);
        }

        // also render a small quantity tile for desktop / summary
        if (modalSizesQuantities) {
          const tile = document.createElement('div');
          tile.className = 'flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2';
          const lbl = document.createElement('div');
          lbl.className = 'font-medium text-sm text-slate-700';
          lbl.textContent = s;
          const q = document.createElement('div');
          q.className = `text-sm font-semibold ${qty > 0 ? 'text-emerald-700' : 'text-rose-600'}`;
          q.textContent = qty > 0 ? `${qty} em estoque` : 'indisponível';
          tile.appendChild(lbl);
          tile.appendChild(q);
          modalSizesQuantities.appendChild(tile);
        }
      });

      if (firstAvailable) {
        modalSizeSelect.value = firstAvailable;
        const modalSizeButtonsEl = document.getElementById('modal-size-buttons');
        if (modalSizeButtonsEl) {
          Array.from(modalSizeButtonsEl.querySelectorAll('button')).forEach((b) => { if (b.dataset.size === firstAvailable) b.classList.add('ring-2', 'ring-pink-700', 'bg-pink-700', 'text-white'); });
        }
      }

      modalSizeSelect.addEventListener('change', () => {
        const val = modalSizeSelect.value;
        const btns = document.getElementById('modal-size-buttons');
        if (btns) {
          Array.from(btns.querySelectorAll('button')).forEach((b) => {
            b.classList.toggle('ring-2', b.dataset.size === val);
            b.classList.toggle('ring-pink-700', b.dataset.size === val);
            b.classList.toggle('bg-pink-700', b.dataset.size === val);
            b.classList.toggle('text-white', b.dataset.size === val);
          });
        }
      });
      // enable/disable add-to-cart based on selected size qty or accessory stock
      const addToCartBtn = document.getElementById('add-to-cart-btn');
      const updateAddToCartState = () => {
        if (!addToCartBtn) return;
        if (product.category && product.category.toLowerCase() === 'acessorio') {
          const sq = Number(product.stock_quantity || 0);
          addToCartBtn.disabled = sq <= 0;
          addToCartBtn.classList.toggle('opacity-50', sq <= 0);
        } else {
          const sel = modalSizeSelect ? modalSizeSelect.value : null;
          const qty = sel ? Number(sizesObj[sel] || 0) : 0;
          addToCartBtn.disabled = qty <= 0;
          addToCartBtn.classList.toggle('opacity-50', qty <= 0);
        }
      };

      // initial state
      updateAddToCartState();
      // update when size selection changes
      if (modalSizeSelect) modalSizeSelect.addEventListener('change', updateAddToCartState);
    }
  } catch (err) {
    console.debug('fillProductModal size population error', err);
  }

  // Populate images (main + thumbnails) if product.images exists or fallback to image_url
  try {
    const mainImgEl = document.getElementById('modal-main-image');
    const mainPlaceholder = document.getElementById('modal-main-image-placeholder');
    const thumbs = document.getElementById('modal-thumbs');

    // determine images array: prefer `images`, fallback to `image_url` or `product.image_url`
    let imgs = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) imgs = product.images;
    else if (product.image_url) imgs = [product.image_url];
    else if (product.image) imgs = [product.image];

    // clear thumbnails
    if (thumbs) thumbs.innerHTML = '';

    if (imgs.length > 0) {
      const resolvedMain = resolveMediaUrl(imgs[0]);
      if (mainImgEl) {
        mainImgEl.src = resolvedMain;
        mainImgEl.classList.remove('hidden');
      }
      if (mainPlaceholder) mainPlaceholder.classList.add('hidden');

      imgs.forEach((img, idx) => {
        const url = resolveMediaUrl(img);
        if (!thumbs) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rounded-xl overflow-hidden border border-slate-200 h-20';
        btn.title = `Imagem ${idx + 1}`;
        const imgel = document.createElement('img');
        imgel.src = url;
        imgel.alt = `${product.name} ${idx + 1}`;
        imgel.className = 'w-full h-full object-cover';
        btn.appendChild(imgel);
        btn.addEventListener('click', () => {
          if (mainImgEl) mainImgEl.src = url;
        });
        thumbs.appendChild(btn);
      });
    } else {
      // no images
      if (mainImgEl) {
        mainImgEl.src = '';
        mainImgEl.classList.add('hidden');
      }
      if (mainPlaceholder) mainPlaceholder.classList.remove('hidden');
    }
  } catch (err) {
    console.debug('fillProductModal image population error', err);
  }
}

async function openProductModal(productId) {
  const productModal = document.getElementById('produto-modal');

  if (!productModal || !productId) return;

  // fetch product details from backend (uses publicShow route)
  try {
    const detail = await fetchJson(`/products/${productId}`);
    // fill modal with fresh detail
    fillProductModal(detail);
    productModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    console.error('failed to load product detail', err);
    // fallback: try to find in allProducts and show that minimal info
    const fallback = allProducts.find((item) => String(item.id) === String(productId));
    if (fallback) {
      fillProductModal(fallback);
      productModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }
}

function closeProductModal() {
  const productModal = document.getElementById('produto-modal');

  if (!productModal) {
    return;
  }

  productModal.classList.add('hidden');
  document.body.style.overflow = '';
}

function applyProductFilters() {
  const search = (document.getElementById('product-search').value || '').trim().toLowerCase();
  // remove common prefixes like "Categoria: " (case-insensitive) to get the real label
  const rawCategory = (document.getElementById('product-category').value || '').replace(/^(categoria:\s*)/i, '');
  const selectedNorm = canonicalCategory(normalizeCategoryLabel(rawCategory));
  // remove prefix like "Ordenar por: " to normalize the sort value
  const rawSort = (document.getElementById('product-sort').value || '').replace(/^(ordenar por:\s*)/i, '');
  const sort = rawSort.trim();

  // Debugging: log selected category and encountered product categories to help diagnose mismatches
  try {
    console.debug('[products] applyProductFilters start', { search, rawCategory, selectedNorm, sort, totalProducts: (allProducts || []).length });
    const encountered = Array.from(new Set((allProducts || []).map((p) => canonicalCategory(normalizeCategoryLabel(p && p.category ? String(p.category) : inferProductCategory(p && p.name ? p.name : ''))))));
    console.debug('[products] encountered canonical categories', encountered.slice(0, 20));
    if (Array.isArray(allProducts) && allProducts.length > 0) console.debug('[products] sample product', allProducts[0]);
  } catch (err) {
    console.debug('[products] debug error', err);
  }

  const filtered = [...allProducts].filter((product) => {
    const name = String(product.name || '');
    const desc = String(product.description || '');
    const matchesSearch = name.toLowerCase().includes(search) || desc.toLowerCase().includes(search);

    // prefer explicit product.category from backend, fallback to name inference
    const prodCatSource = product && product.category ? String(product.category) : inferProductCategory(name);
    const prodCatNorm = canonicalCategory(normalizeCategoryLabel(prodCatSource));
    const matchesCategory = selectedNorm === 'todos' || prodCatNorm === selectedNorm;

    return matchesSearch && matchesCategory;
  });

  if (/^menor/i.test(sort)) {
    filtered.sort((left, right) => Number(left.price || 0) - Number(right.price || 0));
  } else if (/^maior/i.test(sort)) {
    filtered.sort((left, right) => Number(right.price || 0) - Number(left.price || 0));
  } else {
    // default: Novidades -> newest first by id
    filtered.sort((left, right) => Number(right.id || 0) - Number(left.id || 0));
  }

  renderProducts(filtered);
}

function initProductsPage(contentPayload) {
  const storeTitle = document.getElementById('store-title');
  const storeSubtitle = document.getElementById('store-subtitle');
  const grid = document.getElementById('products-grid');
  const closeModalButton = document.getElementById('close-modal');
  const productModal = document.getElementById('produto-modal');

  if (storeTitle && contentPayload.sections?.loja?.title) {
    storeTitle.textContent = contentPayload.sections.loja.title;
  }

  if (storeSubtitle && contentPayload.sections?.loja?.content) {
    storeSubtitle.textContent = contentPayload.sections.loja.content;
  }

  renderMenu(contentPayload.menu);
  renderFooter(contentPayload.site, contentPayload.menu, contentPayload.services, contentPayload.settings);

  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-product-id]');

    if (trigger) {
      openProductModal(trigger.dataset.productId);
    }
  });

  document.getElementById('product-filter-button').addEventListener('click', applyProductFilters);
  document.getElementById('product-search').addEventListener('input', applyProductFilters);
  document.getElementById('product-category').addEventListener('change', applyProductFilters);
  document.getElementById('product-sort').addEventListener('change', applyProductFilters);

  closeModalButton.addEventListener('click', closeProductModal);
  productModal.addEventListener('click', (event) => {
    if (event.target === productModal) {
      closeProductModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeProductModal();
    }
  });
}

async function bootstrapHome() {
  const content = await fetchJson('/content');
  renderHomeContent(content);
  initContactForm();
  // try to load public events into the newly added #events-grid
  loadPublicEvents();
  initEventRegistrationForm();
}

async function bootstrapProducts() {
  const [content, productsPayload] = await Promise.all([
    fetchJson('/content'),
    fetchJson('/products'),
  ]);

  // API may return an array or an object with a `data` property (Resource/Envelope).
  if (Array.isArray(productsPayload)) {
    allProducts = productsPayload;
  } else if (productsPayload && Array.isArray(productsPayload.data)) {
    allProducts = productsPayload.data;
  } else {
    // fallback: try to convert to an array if possible
    allProducts = [];
    console.warn('unexpected /products payload, expected array or { data: [...] }', productsPayload);
  }

  initProductsPage(content);
  applyProductFilters();
}

async function bootstrapPage() {
  try {
    if (page === 'home') {
      await bootstrapHome();
      return;
    }

    if (page === 'products') {
      await bootstrapProducts();
      return;
    }

    if (page === 'event-registration') {
      initEventRegistrationForm();
      return;
    }
  } catch (error) {
    console.error(error);
  }
}

bootstrapPage();
