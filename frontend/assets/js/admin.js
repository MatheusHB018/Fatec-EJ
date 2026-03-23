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

const ADMIN_API_BASE = `${getProjectRoot()}/backend/public/api`;
const ADMIN_TOKEN_KEY = 'ej_admin_token';
const ADMIN_USER_KEY = 'ej_admin_user';
const adminPage = document.body.dataset.page;
let contactsChart;
let productsChart;
let teamMembers = [];
let services = [];
let projects = [];
let editals = [];
let contactMessages = [];
let users = [];

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setSession(token, user) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

function setStatus(elementId, message, variant) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove('hidden', 'bg-red-50', 'text-red-800', 'bg-emerald-50', 'text-emerald-800');
  element.classList.add(variant === 'success' ? 'bg-emerald-50' : 'bg-red-50');
  element.classList.add(variant === 'success' ? 'text-emerald-800' : 'text-red-800');
}

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function setActiveAdminSection(sectionName) {
  document.querySelectorAll('.admin-section').forEach((section) => {
    section.classList.toggle('hidden', section.dataset.adminSection !== sectionName);
  });

  document.querySelectorAll('.admin-menu-item').forEach((item) => {
    const isActive = item.dataset.sectionTarget === sectionName;
    item.classList.toggle('bg-red-50', isActive);
    item.classList.toggle('text-red-800', isActive);
    item.classList.toggle('font-semibold', isActive);
    item.classList.toggle('text-slate-600', !isActive);
  });
}

function renderMetricCards(stats) {
  const container = document.getElementById('dashboard-metrics');

  if (!container || !stats) {
    return;
  }

  const cards = [
    ['Produtos', stats.products_total, 'Itens cadastrados'],
    ['Produtos Ativos', stats.products_active, 'Visíveis na loja'],
    ['Contatos', stats.contacts_total, 'Mensagens recebidas'],
    ['Projetos', stats.projects_total, 'Projetos publicados'],
    ['Equipe', stats.team_total, 'Membros cadastrados'],
    ['Serviços', stats.services_total, 'Serviços listados'],
    ['Pilares', stats.pillars_total, 'Pilares ativos'],
    ['Editais', stats.editals_total, 'Editais disponíveis'],
  ];

  container.innerHTML = cards.map(([label, value, helper]) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p class="text-sm font-semibold uppercase tracking-wide text-slate-400">${label}</p>
      <p class="mt-4 text-4xl font-extrabold text-slate-900">${value}</p>
      <p class="mt-2 text-sm text-slate-500">${helper}</p>
    </article>
  `).join('');
}

function renderRecentContacts(contacts) {
  const container = document.getElementById('recent-contacts');

  if (!container) {
    return;
  }

  if (!contacts.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum contato recente encontrado.</p>';
    return;
  }

  container.innerHTML = contacts.map((contact) => `
    <article class="rounded-xl border border-gray-200 p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold text-slate-900">${contact.name}</p>
          <p class="text-sm text-slate-500">${contact.email}</p>
          <p class="mt-1 text-xs uppercase tracking-wide text-slate-400">${contact.profile_type}</p>
        </div>
        <span class="text-xs text-slate-400">${formatDate(contact.created_at)}</span>
      </div>
    </article>
  `).join('');
}

function renderRecentProducts(products) {
  const container = document.getElementById('recent-products');

  if (!container) {
    return;
  }

  if (!products.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum produto recente encontrado.</p>';
    return;
  }

  container.innerHTML = products.map((product) => `
    <article class="rounded-xl border border-gray-200 p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold text-slate-900">${product.name}</p>
          <p class="text-sm text-slate-500">${formatPrice(product.price)}</p>
          <p class="mt-1 text-xs uppercase tracking-wide ${product.is_active ? 'text-emerald-600' : 'text-slate-400'}">${product.is_active ? 'Ativo' : 'Inativo'}</p>
        </div>
        <span class="text-xs text-slate-400">${formatDate(product.created_at)}</span>
      </div>
    </article>
  `).join('');
}

function renderCardsList(elementId, items, renderer) {
  const container = document.getElementById(elementId);

  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum item encontrado.</p>';
    return;
  }

  container.innerHTML = items.map(renderer).join('');
}

function renderTeamManagerList() {
  const container = document.getElementById('team-list');

  if (!container) {
    return;
  }

  if (!teamMembers.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum membro cadastrado.</p>';
    return;
  }

  container.innerHTML = teamMembers.map((member) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          ${member.photo_url
            ? `<img src="${member.photo_url}" alt="${member.name}" class="h-14 w-14 rounded-full object-cover border border-gray-200" />`
            : `<div class="h-14 w-14 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold">${member.initials || '--'}</div>`}
          <div>
            <p class="font-semibold text-slate-900">${member.name}</p>
            <p class="text-sm text-slate-500">${member.role}</p>
            <p class="mt-1 text-xs uppercase tracking-wide ${member.is_active ? 'text-emerald-600' : 'text-slate-400'}">${member.is_active ? 'Ativo' : 'Inativo'}</p>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" data-team-action="edit" data-team-id="${member.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Editar</button>
        <button type="button" data-team-action="delete" data-team-id="${member.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Excluir</button>
      </div>
    </article>
  `).join('');
}

function resetTeamForm() {
  document.getElementById('team-id').value = '';
  document.getElementById('team-name').value = '';
  document.getElementById('team-role').value = '';
  document.getElementById('team-initials').value = '';
  document.getElementById('team-photo-url').value = '';
  document.getElementById('team-order').value = '0';
  document.getElementById('team-active').checked = true;
}

function renderServiceManagerList() {
  const container = document.getElementById('services-list');

  if (!container) {
    return;
  }

  if (!services.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum serviço cadastrado.</p>';
    return;
  }

  container.innerHTML = services.map((service) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-800 text-lg">
            <i class="fa-solid fa-briefcase"></i>
          </span>
          <div>
            <p class="font-semibold text-slate-900">${service.title}</p>
            <p class="mt-1 text-sm text-slate-500">${service.description || '-'}</p>
            <p class="mt-1 text-xs uppercase tracking-wide ${service.is_active ? 'text-emerald-600' : 'text-slate-400'}">${service.is_active ? 'Ativo' : 'Inativo'}</p>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" data-service-action="edit" data-service-id="${service.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Editar</button>
        <button type="button" data-service-action="delete" data-service-id="${service.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Excluir</button>
      </div>
    </article>
  `).join('');
}

function resetServiceForm() {
  document.getElementById('service-id').value = '';
  document.getElementById('service-title').value = '';
  document.getElementById('service-description').value = '';
  document.getElementById('service-order').value = '0';
  document.getElementById('service-active').checked = true;
}

function renderProjectManagerList() {
  const container = document.getElementById('projects-list');

  if (!container) {
    return;
  }

  if (!projects.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum projeto cadastrado.</p>';
    return;
  }

  container.innerHTML = projects.map((project) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      ${project.image_url
        ? `<img src="${project.image_url}" alt="${project.title}" class="h-36 w-full rounded-xl border border-gray-200 object-cover" />`
        : '<div class="h-36 w-full rounded-xl border border-gray-200 bg-slate-50 flex items-center justify-center text-slate-400"><i class="fa-regular fa-image text-2xl"></i></div>'}
      <h3 class="mt-4 text-xl font-bold text-slate-900">${project.title}</h3>
      <p class="mt-2 text-sm text-slate-500">${project.description || '-'}</p>
      <p class="mt-2 text-xs uppercase tracking-wide text-slate-400">${project.category || '-'} • ${project.technologies || '-'}</p>
      <p class="mt-2 text-xs uppercase tracking-wide ${project.is_active ? 'text-emerald-600' : 'text-slate-400'}">${project.is_active ? 'Ativo' : 'Inativo'}</p>

      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" data-project-action="edit" data-project-id="${project.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Editar</button>
        <button type="button" data-project-action="delete" data-project-id="${project.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Excluir</button>
      </div>
    </article>
  `).join('');
}

function resetProjectForm() {
  document.getElementById('project-id').value = '';
  document.getElementById('project-title').value = '';
  document.getElementById('project-description').value = '';
  document.getElementById('project-category').value = '';
  document.getElementById('project-technologies').value = '';
  document.getElementById('project-image-url').value = '';
  document.getElementById('project-order').value = '0';
  document.getElementById('project-active').checked = true;
}

function fillProjectForm(project) {
  document.getElementById('project-id').value = project.id;
  document.getElementById('project-title').value = project.title || '';
  document.getElementById('project-description').value = project.description || '';
  document.getElementById('project-category').value = project.category || '';
  document.getElementById('project-technologies').value = project.technologies || '';
  document.getElementById('project-image-url').value = project.image_url || '';
  document.getElementById('project-order').value = project.display_order ?? 0;
  document.getElementById('project-active').checked = Boolean(project.is_active);
}

async function reloadProjects() {
  projects = await adminFetch('/admin/projects');
  renderProjectManagerList();
}

function renderEditalManagerList() {
  const container = document.getElementById('editals-list');

  if (!container) {
    return;
  }

  if (!editals.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum edital cadastrado.</p>';
    return;
  }

  container.innerHTML = editals.map((edital) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xl font-bold text-slate-900">${edital.title}</h3>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">${edital.status || 'Em breve'}</span>
      </div>
      <p class="mt-2 text-sm text-slate-500">${edital.description || '-'}</p>
      <p class="mt-2 text-xs uppercase tracking-wide text-slate-400">${edital.enrollment_period || '-'}</p>
      ${edital.file_url ? `<a href="${edital.file_url}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-800">Link do edital <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i></a>` : ''}
      <p class="mt-2 text-xs uppercase tracking-wide ${edital.is_active ? 'text-emerald-600' : 'text-slate-400'}">${edital.is_active ? 'Ativo' : 'Inativo'}</p>

      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" data-edital-action="edit" data-edital-id="${edital.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Editar</button>
        <button type="button" data-edital-action="delete" data-edital-id="${edital.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Excluir</button>
      </div>
    </article>
  `).join('');
}

function resetEditalForm() {
  document.getElementById('edital-id').value = '';
  document.getElementById('edital-title').value = '';
  document.getElementById('edital-description').value = '';
  document.getElementById('edital-status-input').value = 'Em breve';
  document.getElementById('edital-period').value = '';
  document.getElementById('edital-file-url').value = '';
  document.getElementById('edital-order').value = '0';
  document.getElementById('edital-active').checked = true;
}

function fillEditalForm(edital) {
  document.getElementById('edital-id').value = edital.id;
  document.getElementById('edital-title').value = edital.title || '';
  document.getElementById('edital-description').value = edital.description || '';
  document.getElementById('edital-status-input').value = edital.status || 'Em breve';
  document.getElementById('edital-period').value = edital.enrollment_period || '';
  document.getElementById('edital-file-url').value = edital.file_url || '';
  document.getElementById('edital-order').value = edital.display_order ?? 0;
  document.getElementById('edital-active').checked = Boolean(edital.is_active);
}

async function reloadEditals() {
  editals = await adminFetch('/admin/editals');
  renderEditalManagerList();
}

function renderContactMessagesList() {
  const container = document.getElementById('contact-messages-list');

  if (!container) {
    return;
  }

  if (!contactMessages.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhuma mensagem recebida.</p>';
    return;
  }

  container.innerHTML = contactMessages.map((contact) => `
    <article class="rounded-xl border border-gray-200 p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold text-slate-900">${contact.name}</p>
          <p class="text-sm text-slate-500">${contact.email} • ${contact.whatsapp}</p>
          <p class="mt-2 text-sm text-slate-600">${contact.message || '-'}</p>
          <p class="mt-1 text-xs uppercase tracking-wide text-slate-400">${contact.profile_type}</p>
        </div>
        <button type="button" data-contact-action="delete" data-contact-id="${contact.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Excluir</button>
      </div>
    </article>
  `).join('');
}

function renderUsersList() {
  const container = document.getElementById('users-list');

  if (!container) {
    return;
  }

  if (!users.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum usuário encontrado.</p>';
    return;
  }

  container.innerHTML = users.map((user) => `
    <article class="rounded-xl border border-gray-200 p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold text-slate-900">${user.name}</p>
          <p class="text-sm text-slate-500">${user.email}</p>
          <p class="mt-1 text-xs uppercase tracking-wide text-slate-400">ID: ${user.id}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-user-action="edit" data-user-id="${user.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Editar</button>
          <button type="button" data-user-action="delete" data-user-id="${user.id}" class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-800 hover:text-red-800">Excluir</button>
          <span class="text-xs text-slate-400">${formatDate(user.created_at)}</span>
        </div>
      </div>
    </article>
  `).join('');
}

function resetUserForm() {
  document.getElementById('user-id').value = '';
  document.getElementById('user-name').value = '';
  document.getElementById('user-email').value = '';
  document.getElementById('user-password').value = '';
}

function fillUserForm(user) {
  document.getElementById('user-id').value = user.id;
  document.getElementById('user-name').value = user.name || '';
  document.getElementById('user-email').value = user.email || '';
  document.getElementById('user-password').value = '';
}

async function reloadUsers() {
  const usersPayload = await adminFetch('/admin/users');
  users = Array.isArray(usersPayload) ? usersPayload : (usersPayload.data || []);
  renderUsersList();
}

async function reloadContactMessages() {
  const contactsPayload = await adminFetch('/admin/contacts');
  contactMessages = contactsPayload.data || contactsPayload || [];
  renderContactMessagesList();
}

function fillServiceForm(service) {
  document.getElementById('service-id').value = service.id;
  document.getElementById('service-title').value = service.title || '';
  document.getElementById('service-description').value = service.description || '';
  document.getElementById('service-order').value = service.display_order ?? 0;
  document.getElementById('service-active').checked = Boolean(service.is_active);
}

async function reloadServices() {
  services = await adminFetch('/admin/services');
  renderServiceManagerList();
}

function fillTeamForm(member) {
  document.getElementById('team-id').value = member.id;
  document.getElementById('team-name').value = member.name || '';
  document.getElementById('team-role').value = member.role || '';
  document.getElementById('team-initials').value = member.initials || '';
  document.getElementById('team-photo-url').value = member.photo_url || '';
  document.getElementById('team-order').value = member.display_order ?? 0;
  document.getElementById('team-active').checked = Boolean(member.is_active);
}

async function reloadTeamMembers() {
  teamMembers = await adminFetch('/admin/team-members');
  renderTeamManagerList();
}

function renderDashboardCharts(chartData) {
  const contactsCtx = document.getElementById('contacts-chart');
  const productsCtx = document.getElementById('products-chart');

  if (contactsChart) {
    contactsChart.destroy();
  }

  if (productsChart) {
    productsChart.destroy();
  }

  contactsChart = new Chart(contactsCtx, {
    type: 'line',
    data: {
      labels: chartData.daily_contacts.map((item) => item.label),
      datasets: [{
        label: 'Contatos',
        data: chartData.daily_contacts.map((item) => item.total),
        borderColor: '#991b1b',
        backgroundColor: 'rgba(153, 27, 27, 0.12)',
        fill: true,
        tension: 0.35,
      }],
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });

  productsChart = new Chart(productsCtx, {
    type: 'doughnut',
    data: {
      labels: ['Ativos', 'Inativos'],
      datasets: [{
        data: [chartData.product_breakdown.active, chartData.product_breakdown.inactive],
        backgroundColor: ['#991b1b', '#cbd5e1'],
        borderWidth: 0,
      }],
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  });
}

function renderDashboardSections(data, contactsPayload, productsPayload) {
  renderMetricCards(data.stats);
  renderRecentContacts(data.recent.contacts || []);
  renderRecentProducts(data.recent.products || []);
  renderDashboardCharts(data.charts);

  renderCardsList('team-list', data.sections.team || [], (member) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p class="text-sm uppercase tracking-wide text-slate-400">${member.initials || '--'}</p>
      <h3 class="mt-3 text-xl font-bold text-slate-900">${member.name}</h3>
      <p class="mt-2 text-slate-500">${member.role}</p>
    </article>
  `);

  renderCardsList('services-list', data.sections.services || [], (service) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="text-xl font-bold text-slate-900">${service.title}</h3>
      <p class="mt-3 text-slate-500">${service.description || '-'}</p>
    </article>
  `);

  renderCardsList('pillars-list', data.sections.pillars || [], (pillar) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="text-xl font-bold text-slate-900">${pillar.title}</h3>
      <p class="mt-3 text-slate-500">${pillar.description || '-'}</p>
    </article>
  `);

  renderCardsList('projects-list', data.sections.projects || [], (project) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="text-xl font-bold text-slate-900">${project.title}</h3>
      <p class="mt-3 text-slate-500">${project.description || '-'}</p>
      <p class="mt-4 text-xs uppercase tracking-wide text-slate-400">${project.technologies || '-'}</p>
    </article>
  `);

  renderCardsList('editals-list', data.sections.editals || [], (edital) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-xl font-bold text-slate-900">${edital.title}</h3>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">${edital.status}</span>
      </div>
      <p class="mt-3 text-slate-500">${edital.description || '-'}</p>
      <p class="mt-4 text-xs uppercase tracking-wide text-slate-400">${edital.enrollment_period || '-'}</p>
    </article>
  `);

  renderCardsList('contacts-list', contactsPayload.data || contactsPayload || [], (contact) => `
    <article class="rounded-xl border border-gray-200 p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold text-slate-900">${contact.name}</p>
          <p class="text-sm text-slate-500">${contact.email}</p>
          <p class="mt-1 text-sm text-slate-500">${contact.whatsapp}</p>
        </div>
        <span class="text-xs uppercase tracking-wide text-slate-400">${contact.profile_type}</span>
      </div>
    </article>
  `);

  renderCardsList('products-list', productsPayload.data || productsPayload || [], (product) => `
    <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-xl font-bold text-slate-900">${product.name}</h3>
        <span class="rounded-full ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} px-3 py-1 text-xs font-semibold">${product.is_active ? 'Ativo' : 'Inativo'}</span>
      </div>
      <p class="mt-3 text-slate-500">${product.description || '-'}</p>
      <p class="mt-4 text-lg font-bold text-red-800">${formatPrice(product.price)}</p>
    </article>
  `);
}

async function adminFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401 && adminPage === 'admin-dashboard') {
      clearSession();
      window.location.href = 'login.html';
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }

    throw new Error(payload?.message || `Erro ${response.status}`);
  }

  return payload;
}

async function requireAuth() {
  const token = getToken();

  if (!token) {
    window.location.href = 'login.html';
    return null;
  }

  try {
    const payload = await adminFetch('/auth/me');
    return payload.user;
  } catch (error) {
    clearSession();
    window.location.href = 'login.html';
    return null;
  }
}

async function initLoginPage() {
  const existingToken = getToken();

  if (existingToken) {
    try {
      await adminFetch('/auth/me');
      window.location.href = 'dashboard.html';
      return;
    } catch (error) {
      clearSession();
    }
  }

  const form = document.getElementById('admin-login-form');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';

    try {
      const payload = await adminFetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('senha').value,
        }),
      });

      setSession(payload.token, payload.user);
      window.location.href = 'dashboard.html';
    } catch (error) {
      setStatus('login-status', error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Entrar';
    }
  });
}

async function initDashboardPage() {
  const user = await requireAuth();

  if (!user) {
    return;
  }

  const userName = document.getElementById('admin-user-name');
  const userEmail = document.getElementById('admin-user-email');
  const logoutButton = document.getElementById('logout-button');
  const form = document.getElementById('admin-settings-form');
  const submitButton = form.querySelector('button[type="submit"]');
  const aboutForm = document.getElementById('about-form');
  const aboutSubmitButton = aboutForm.querySelector('button[type="submit"]');
  const teamForm = document.getElementById('team-form');
  const teamSubmitButton = teamForm.querySelector('button[type="submit"]');
  const teamCancelEditButton = document.getElementById('team-cancel-edit');
  const teamList = document.getElementById('team-list');
  const serviceForm = document.getElementById('service-form');
  const serviceSubmitButton = serviceForm.querySelector('button[type="submit"]');
  const serviceCancelEditButton = document.getElementById('service-cancel-edit');
  const serviceList = document.getElementById('services-list');
  const projectForm = document.getElementById('project-form');
  const projectSubmitButton = projectForm.querySelector('button[type="submit"]');
  const projectCancelEditButton = document.getElementById('project-cancel-edit');
  const projectList = document.getElementById('projects-list');
  const editalForm = document.getElementById('edital-form');
  const editalSubmitButton = editalForm.querySelector('button[type="submit"]');
  const editalCancelEditButton = document.getElementById('edital-cancel-edit');
  const editalList = document.getElementById('editals-list');
  const contactSectionForm = document.getElementById('contact-section-form');
  const contactSectionSubmitButton = contactSectionForm.querySelector('button[type="submit"]');
  const contactMessagesList = document.getElementById('contact-messages-list');
  const userForm = document.getElementById('user-form');
  const userSubmitButton = userForm.querySelector('button[type="submit"]');
  const userCancelEditButton = document.getElementById('user-cancel-edit');
  const usersList = document.getElementById('users-list');
  let managementName = 'Gestão Pioneira 2026';

  document.querySelectorAll('[data-section-target]').forEach((item) => {
    item.addEventListener('click', () => setActiveAdminSection(item.dataset.sectionTarget));
  });

  setActiveAdminSection('dashboard');

  userName.textContent = user.name;
  userEmail.textContent = user.email;

  try {
    const [settings, dashboardData, contactsPayload, productsPayload, aboutPayload, contactSectionPayload, usersPayload] = await Promise.all([
      adminFetch('/admin/settings'),
      adminFetch('/admin/dashboard'),
      adminFetch('/admin/contacts'),
      adminFetch('/admin/products'),
      adminFetch('/admin/about'),
      adminFetch('/admin/contact-section'),
      adminFetch('/admin/users'),
    ]);

    managementName = settings.management_name || managementName;
    document.getElementById('hero-title').value = settings.hero_title || '';
    document.getElementById('hero-subtitle').value = settings.hero_subtitle || '';
    document.getElementById('sobre-ej').value = settings.about_text || '';
    document.getElementById('contact-email').value = settings.contact_email || '';
    document.getElementById('contact-phone').value = settings.contact_phone || '';

    renderDashboardSections(dashboardData, contactsPayload, productsPayload);
    teamMembers = dashboardData.sections.team || [];
    renderTeamManagerList();
    services = dashboardData.sections.services || [];
    renderServiceManagerList();
    projects = dashboardData.sections.projects || [];
    renderProjectManagerList();
    editals = dashboardData.sections.editals || [];
    renderEditalManagerList();
    contactMessages = contactsPayload.data || contactsPayload || [];
    renderContactMessagesList();
    users = Array.isArray(usersPayload) ? usersPayload : (usersPayload.data || []);
    renderUsersList();

    document.getElementById('about-subtitle-input').value = aboutPayload.subtitle || '';
    document.getElementById('about-title-input').value = aboutPayload.title || '';
    document.getElementById('about-summary-input').value = aboutPayload.summary || '';
    document.getElementById('about-mission-input').value = aboutPayload.mission || '';
    document.getElementById('about-vision-input').value = aboutPayload.vision || '';
    document.getElementById('about-values-input').value = (aboutPayload.values || []).join('\n');
    document.getElementById('about-professor-input').value = aboutPayload.professor || '';
    document.getElementById('about-mandate-input').value = aboutPayload.mandate || '';
    document.getElementById('about-image-url-input').value = aboutPayload.image_url || '';

    document.getElementById('contact-section-title').value = contactSectionPayload.title || '';
    document.getElementById('contact-section-subtitle').value = contactSectionPayload.subtitle || '';
    document.getElementById('contact-section-content').value = contactSectionPayload.content || '';
    document.getElementById('contact-section-email').value = contactSectionPayload.contact_email || settings.contact_email || '';
    document.getElementById('contact-section-phone').value = contactSectionPayload.contact_phone || settings.contact_phone || '';
  } catch (error) {
    setStatus('dashboard-status', error.message, 'error');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    try {
      const response = await adminFetch('/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          management_name: managementName,
          hero_title: document.getElementById('hero-title').value.trim(),
          hero_subtitle: document.getElementById('hero-subtitle').value.trim(),
          about_text: document.getElementById('sobre-ej').value.trim(),
          contact_email: document.getElementById('contact-email').value.trim(),
          contact_phone: document.getElementById('contact-phone').value.trim(),
        }),
      });

      setStatus('dashboard-status', response.message || 'Configurações salvas.', 'success');
    } catch (error) {
      setStatus('dashboard-status', error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Salvar alterações';
    }
  });

  aboutForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    aboutSubmitButton.disabled = true;
    aboutSubmitButton.textContent = 'Salvando...';

    try {
      const values = document.getElementById('about-values-input').value
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean);

      const response = await adminFetch('/admin/about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtitle: document.getElementById('about-subtitle-input').value.trim(),
          title: document.getElementById('about-title-input').value.trim(),
          summary: document.getElementById('about-summary-input').value.trim(),
          mission: document.getElementById('about-mission-input').value.trim(),
          vision: document.getElementById('about-vision-input').value.trim(),
          values,
          professor: document.getElementById('about-professor-input').value.trim(),
          mandate: document.getElementById('about-mandate-input').value.trim(),
          image_url: document.getElementById('about-image-url-input').value.trim(),
        }),
      });

      setStatus('about-status', response.message || 'Seção Sobre atualizada.', 'success');
    } catch (error) {
      setStatus('about-status', error.message, 'error');
    } finally {
      aboutSubmitButton.disabled = false;
      aboutSubmitButton.textContent = 'Salvar Sobre';
    }
  });

  teamForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const memberId = document.getElementById('team-id').value;
    const isEditing = Boolean(memberId);

    teamSubmitButton.disabled = true;
    teamSubmitButton.textContent = isEditing ? 'Atualizando...' : 'Salvando...';

    try {
      const payload = {
        name: document.getElementById('team-name').value.trim(),
        role: document.getElementById('team-role').value.trim(),
        initials: document.getElementById('team-initials').value.trim(),
        photo_url: document.getElementById('team-photo-url').value.trim(),
        display_order: Number(document.getElementById('team-order').value || 0),
        is_active: document.getElementById('team-active').checked,
      };

      const endpoint = isEditing ? `/admin/team-members/${memberId}` : '/admin/team-members';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await adminFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setStatus('team-status', response.message || 'Membro salvo com sucesso.', 'success');
      await reloadTeamMembers();
      resetTeamForm();
    } catch (error) {
      setStatus('team-status', error.message, 'error');
    } finally {
      teamSubmitButton.disabled = false;
      teamSubmitButton.textContent = 'Salvar Membro';
    }
  });

  teamCancelEditButton.addEventListener('click', () => {
    resetTeamForm();
    setStatus('team-status', 'Edição cancelada.', 'success');
  });

  teamList.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-team-action]');

    if (!trigger) {
      return;
    }

    const action = trigger.dataset.teamAction;
    const memberId = trigger.dataset.teamId;
    const member = teamMembers.find((item) => String(item.id) === String(memberId));

    if (!member) {
      return;
    }

    if (action === 'edit') {
      fillTeamForm(member);
      setActiveAdminSection('equipe');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Deseja remover ${member.name} da equipe?`);

      if (!confirmed) {
        return;
      }

      try {
        const response = await adminFetch(`/admin/team-members/${member.id}`, {
          method: 'DELETE',
        });

        setStatus('team-status', response.message || 'Membro removido com sucesso.', 'success');
        await reloadTeamMembers();
        resetTeamForm();
      } catch (error) {
        setStatus('team-status', error.message, 'error');
      }
    }
  });

  serviceForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const serviceId = document.getElementById('service-id').value;
    const isEditing = Boolean(serviceId);

    serviceSubmitButton.disabled = true;
    serviceSubmitButton.textContent = isEditing ? 'Atualizando...' : 'Salvando...';

    try {
      const payload = {
        title: document.getElementById('service-title').value.trim(),
        description: document.getElementById('service-description').value.trim(),
        display_order: Number(document.getElementById('service-order').value || 0),
        is_active: document.getElementById('service-active').checked,
      };

      const endpoint = isEditing ? `/admin/services/${serviceId}` : '/admin/services';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await adminFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setStatus('service-status', response.message || 'Serviço salvo com sucesso.', 'success');
      await reloadServices();
      resetServiceForm();
    } catch (error) {
      setStatus('service-status', error.message, 'error');
    } finally {
      serviceSubmitButton.disabled = false;
      serviceSubmitButton.textContent = 'Salvar Serviço';
    }
  });

  serviceCancelEditButton.addEventListener('click', () => {
    resetServiceForm();
    setStatus('service-status', 'Edição cancelada.', 'success');
  });

  serviceList.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-service-action]');

    if (!trigger) {
      return;
    }

    const action = trigger.dataset.serviceAction;
    const serviceId = trigger.dataset.serviceId;
    const service = services.find((item) => String(item.id) === String(serviceId));

    if (!service) {
      return;
    }

    if (action === 'edit') {
      fillServiceForm(service);
      setActiveAdminSection('servicos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Deseja remover o serviço \"${service.title}\"?`);

      if (!confirmed) {
        return;
      }

      try {
        const response = await adminFetch(`/admin/services/${service.id}`, {
          method: 'DELETE',
        });

        setStatus('service-status', response.message || 'Serviço removido com sucesso.', 'success');
        await reloadServices();
        resetServiceForm();
      } catch (error) {
        setStatus('service-status', error.message, 'error');
      }
    }
  });

  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const projectId = document.getElementById('project-id').value;
    const isEditing = Boolean(projectId);

    projectSubmitButton.disabled = true;
    projectSubmitButton.textContent = isEditing ? 'Atualizando...' : 'Salvando...';

    try {
      const payload = {
        title: document.getElementById('project-title').value.trim(),
        description: document.getElementById('project-description').value.trim(),
        category: document.getElementById('project-category').value.trim(),
        technologies: document.getElementById('project-technologies').value.trim(),
        image_url: document.getElementById('project-image-url').value.trim(),
        display_order: Number(document.getElementById('project-order').value || 0),
        is_active: document.getElementById('project-active').checked,
      };

      const endpoint = isEditing ? `/admin/projects/${projectId}` : '/admin/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await adminFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setStatus('project-status', response.message || 'Projeto salvo com sucesso.', 'success');
      await reloadProjects();
      resetProjectForm();
    } catch (error) {
      setStatus('project-status', error.message, 'error');
    } finally {
      projectSubmitButton.disabled = false;
      projectSubmitButton.textContent = 'Salvar Projeto';
    }
  });

  projectCancelEditButton.addEventListener('click', () => {
    resetProjectForm();
    setStatus('project-status', 'Edição cancelada.', 'success');
  });

  projectList.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-project-action]');

    if (!trigger) {
      return;
    }

    const action = trigger.dataset.projectAction;
    const projectId = trigger.dataset.projectId;
    const project = projects.find((item) => String(item.id) === String(projectId));

    if (!project) {
      return;
    }

    if (action === 'edit') {
      fillProjectForm(project);
      setActiveAdminSection('projetos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Deseja remover o projeto "${project.title}"?`);

      if (!confirmed) {
        return;
      }

      try {
        const response = await adminFetch(`/admin/projects/${project.id}`, {
          method: 'DELETE',
        });

        setStatus('project-status', response.message || 'Projeto removido com sucesso.', 'success');
        await reloadProjects();
        resetProjectForm();
      } catch (error) {
        setStatus('project-status', error.message, 'error');
      }
    }
  });

  editalForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const editalId = document.getElementById('edital-id').value;
    const isEditing = Boolean(editalId);

    editalSubmitButton.disabled = true;
    editalSubmitButton.textContent = isEditing ? 'Atualizando...' : 'Salvando...';

    try {
      const payload = {
        title: document.getElementById('edital-title').value.trim(),
        description: document.getElementById('edital-description').value.trim(),
        status: document.getElementById('edital-status-input').value.trim(),
        enrollment_period: document.getElementById('edital-period').value.trim(),
        file_url: document.getElementById('edital-file-url').value.trim(),
        display_order: Number(document.getElementById('edital-order').value || 0),
        is_active: document.getElementById('edital-active').checked,
      };

      const endpoint = isEditing ? `/admin/editals/${editalId}` : '/admin/editals';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await adminFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setStatus('edital-status', response.message || 'Edital salvo com sucesso.', 'success');
      await reloadEditals();
      resetEditalForm();
    } catch (error) {
      setStatus('edital-status', error.message, 'error');
    } finally {
      editalSubmitButton.disabled = false;
      editalSubmitButton.textContent = 'Salvar Edital';
    }
  });

  editalCancelEditButton.addEventListener('click', () => {
    resetEditalForm();
    setStatus('edital-status', 'Edição cancelada.', 'success');
  });

  editalList.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-edital-action]');

    if (!trigger) {
      return;
    }

    const action = trigger.dataset.editalAction;
    const editalId = trigger.dataset.editalId;
    const edital = editals.find((item) => String(item.id) === String(editalId));

    if (!edital) {
      return;
    }

    if (action === 'edit') {
      fillEditalForm(edital);
      setActiveAdminSection('editais');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Deseja remover o edital "${edital.title}"?`);

      if (!confirmed) {
        return;
      }

      try {
        const response = await adminFetch(`/admin/editals/${edital.id}`, {
          method: 'DELETE',
        });

        setStatus('edital-status', response.message || 'Edital removido com sucesso.', 'success');
        await reloadEditals();
        resetEditalForm();
      } catch (error) {
        setStatus('edital-status', error.message, 'error');
      }
    }
  });

  contactSectionForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    contactSectionSubmitButton.disabled = true;
    contactSectionSubmitButton.textContent = 'Salvando...';

    try {
      const response = await adminFetch('/admin/contact-section', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: document.getElementById('contact-section-title').value.trim(),
          subtitle: document.getElementById('contact-section-subtitle').value.trim(),
          content: document.getElementById('contact-section-content').value.trim(),
          contact_email: document.getElementById('contact-section-email').value.trim(),
          contact_phone: document.getElementById('contact-section-phone').value.trim(),
        }),
      });

      setStatus('contact-section-status', response.message || 'Contato atualizado.', 'success');
    } catch (error) {
      setStatus('contact-section-status', error.message, 'error');
    } finally {
      contactSectionSubmitButton.disabled = false;
      contactSectionSubmitButton.textContent = 'Salvar Contato';
    }
  });

  contactMessagesList.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-contact-action="delete"]');

    if (!trigger) {
      return;
    }

    const contactId = trigger.dataset.contactId;
    const message = contactMessages.find((item) => String(item.id) === String(contactId));

    if (!message) {
      return;
    }

    const confirmed = window.confirm(`Deseja remover a mensagem de ${message.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await adminFetch(`/admin/contacts/${message.id}`, {
        method: 'DELETE',
      });

      setStatus('contact-messages-status', response.message || 'Mensagem removida.', 'success');
      await reloadContactMessages();
    } catch (error) {
      setStatus('contact-messages-status', error.message, 'error');
    }
  });

  userForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const userId = document.getElementById('user-id').value;
    const isEditing = Boolean(userId);
    const password = document.getElementById('user-password').value;

    userSubmitButton.disabled = true;
    userSubmitButton.textContent = isEditing ? 'Atualizando...' : 'Salvando...';

    try {
      const payload = {
        name: document.getElementById('user-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
      };

      if (password) {
        payload.password = password;
      }

      if (!isEditing && !payload.password) {
        throw new Error('A senha é obrigatória para criar um usuário.');
      }

      const endpoint = isEditing ? `/admin/users/${userId}` : '/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await adminFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setStatus('user-status', response.message || 'Usuário salvo com sucesso.', 'success');
      await reloadUsers();
      resetUserForm();
    } catch (error) {
      setStatus('user-status', error.message, 'error');
    } finally {
      userSubmitButton.disabled = false;
      userSubmitButton.textContent = 'Salvar Usuário';
    }
  });

  userCancelEditButton.addEventListener('click', () => {
    resetUserForm();
    setStatus('user-status', 'Edição cancelada.', 'success');
  });

  usersList.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-user-action]');

    if (!trigger) {
      return;
    }

    const action = trigger.dataset.userAction;
    const userId = trigger.dataset.userId;
    const selectedUser = users.find((item) => String(item.id) === String(userId));

    if (!selectedUser) {
      return;
    }

    if (action === 'edit') {
      fillUserForm(selectedUser);
      setActiveAdminSection('usuarios');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Deseja remover o usuário \"${selectedUser.name}\"?`);

      if (!confirmed) {
        return;
      }

      try {
        const response = await adminFetch(`/admin/users/${selectedUser.id}`, {
          method: 'DELETE',
        });

        setStatus('user-status', response.message || 'Usuário removido com sucesso.', 'success');
        await reloadUsers();
        resetUserForm();
      } catch (error) {
        setStatus('user-status', error.message, 'error');
      }
    }
  });

  logoutButton.addEventListener('click', async () => {
    try {
      await adminFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Mesmo com falha no logout remoto, a sessão local deve ser encerrada.
    }

    clearSession();
    window.location.href = 'login.html';
  });
}

if (adminPage === 'admin-login') {
  initLoginPage();
}

if (adminPage === 'admin-dashboard') {
  initDashboardPage();
}
