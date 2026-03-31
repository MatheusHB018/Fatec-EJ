function getProjectRoot() {
  if (window.location.protocol === 'file:') {
    // quando aberto via file://, usar localhost como fallback
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
let inscritos = [];

// Resolve media URLs returned by the API to a URL reachable from the frontend/admin pages.
function resolveMediaUrlAdmin(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/storage/')) {
    return `${getProjectRoot()}/backend/public${url}`;
  }
  if (url.startsWith('/backend/public/')) return `${getProjectRoot()}${url}`;
  return url;
}

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

  const noUTC = value.replace('Z', '');
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(noUTC));
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
                    ? `<img src="${resolveMediaUrlAdmin(member.photo_url)}" alt="${member.name}" class="h-14 w-14 rounded-full object-cover border border-gray-200" />`
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
        ? `<img src="${resolveMediaUrlAdmin(project.image_url)}" alt="${project.title}" class="h-36 w-full rounded-xl border border-gray-200 object-cover" />`
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

/* -----------------------
   Product manager
   ----------------------- */
async function reloadProducts() {
  const data = await adminFetch('/admin/products');
  // apiResource returns paginated object in admin index; normalize to items array
  products = Array.isArray(data) ? data : (data.data || data.items || []);
  renderProductsList();
  renderRecentProducts(products.slice(0, 4));
  // render quick manager on dashboard
  renderProductsManagerOnDashboard();
}

// Renderiza um gerenciador rápido de produtos dentro do Dashboard (lista curta)
function renderProductsManagerOnDashboard() {
  const container = document.getElementById('dashboard-products-manager');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <article class="rounded-xl border border-gray-200 p-4 bg-white">
        <h3 class="text-sm font-semibold text-slate-900">Nenhum produto cadastrado</h3>
        <p class="mt-1 text-sm text-slate-500">Você pode criar um produto rapidamente.</p>
        <div class="mt-3">
          <button id="product-create-button-dashboard" class="inline-flex items-center gap-2 rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-white">Criar Produto</button>
        </div>
      </article>
    `;
    return;
  }

  // mostrar até 5 produtos no gerenciador rápido
  const slice = products.slice(0, 5);
  container.innerHTML = slice.map((p) => `
    <article data-product-card-id="${p.id}" class="rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition bg-white">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold text-slate-900">${p.name}</p>
          <p class="text-sm text-slate-500">${formatPrice(p.price)}</p>
          <p class="text-xs text-slate-500">Categoria: <strong>${p.category || '-'}</strong></p>
          <p class="mt-1 text-xs uppercase tracking-wide ${p.is_active ? 'text-emerald-600' : 'text-slate-400'}">${p.is_active ? 'ATIVO' : 'INATIVO'}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">${formatDate(p.created_at)}</p>
          <div class="mt-3 flex flex-col gap-2">
            <button data-product-action="edit" data-product-id="${p.id}" class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"> <i class="fa-solid fa-pen-to-square"></i> Editar</button>
            <button data-product-action="delete" data-product-id="${p.id}" class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-slate-100"> <i class="fa-solid fa-trash"></i> Excluir</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function renderProductsList() {
  const container = document.getElementById('products-list');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <article class="rounded-xl border border-gray-200 p-6 bg-white">
        <h3 class="text-lg font-bold text-slate-900">Nenhum produto cadastrado</h3>
        <p class="mt-2 text-sm text-slate-500">Adicione produtos para que apareçam na loja.</p>
        <div class="mt-4">
          <button id="product-create-button" class="inline-flex items-center gap-2 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white">Criar Produto</button>
        </div>
      </article>
    `;
    return;
  }

  container.innerHTML = products.map((p) => `
    <article data-product-card-id="${p.id}" class="rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold text-slate-900">${p.name}</p>
          <p class="text-sm text-slate-500">${formatPrice(p.price)}</p>
          <p class="text-xs text-slate-500">Categoria: <strong>${p.category || '-'}</strong></p>
          <p class="mt-1 text-xs uppercase tracking-wide ${p.is_active ? 'text-emerald-600' : 'text-slate-400'}">${p.is_active ? 'Ativo' : 'Inativo'}</p>
          
        </div>
          <div class="text-right">
          <p class="text-xs text-slate-400">${formatDate(p.created_at)}</p>
            <div class="mt-3 flex flex-col gap-2">
              <button data-product-action="edit" data-product-id="${p.id}" class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"> <i class="fa-solid fa-pen-to-square"></i> Editar</button>
              <button data-product-action="delete" data-product-id="${p.id}" class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-slate-100"> <i class="fa-solid fa-trash"></i> Excluir</button>
            </div>
        </div>
      </div>
    </article>
  `).join('');
}

function resetProductForm() {
  document.getElementById('product-id').value = '';
  document.getElementById('product-name').value = '';
  document.getElementById('product-description').value = '';
  document.getElementById('product-price').value = '';
  const categoryEl = document.getElementById('product-category');
  if (categoryEl) categoryEl.value = 'acessorio';
  document.getElementById('product-active').checked = true;
  const status = document.getElementById('product-status');
  if (status) status.classList.add('hidden');
  // clear image input and hide preview modal
  const imageEl = document.getElementById('product-image');
  if (imageEl) {
    imageEl.value = '';
  }
  hideProductImagePreview();
  // reset sizes
  ['pp','p','m','g','gg','xg'].forEach((s) => {
    const chk = document.getElementById(`size-${s}`);
    const qty = document.getElementById(`qty-${s}`);
    if (chk) chk.checked = false;
    if (qty) qty.value = '0';
  });
  // reset stock quantity
  const stockEl = document.getElementById('product-stock-quantity');
  if (stockEl) stockEl.value = '0';

  // update category-dependent UI
  try { updateProductCategoryDisplay(); } catch (e) { /* ignore */ }
}

function clearProductFieldErrors() {
  const ids = ['product-name', 'product-description', 'product-price', 'product-category'];
  ids.forEach((id) => {
    const el = document.getElementById(`${id}-error`);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  });
}

function setProductFieldError(fieldId, message) {
  const el = document.getElementById(`${fieldId}-error`);
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
  }
}

function validateProductFormFields() {
  clearProductFieldErrors();
  const name = document.getElementById('product-name').value.trim();
  const priceVal = document.getElementById('product-price').value;
  // coupon fields removed from the form
  const category = document.getElementById('product-category') ? document.getElementById('product-category').value : null;

  let valid = true;

  if (!name) {
    setProductFieldError('product-name', 'Nome é obrigatório.');
    valid = false;
  } else if (name.length > 255) {
    setProductFieldError('product-name', 'Nome deve ter no máximo 255 caracteres.');
    valid = false;
  }

  const price = Number(priceVal);
  if (priceVal === '' || Number.isNaN(price)) {
    setProductFieldError('product-price', 'Preço válido é obrigatório.');
    valid = false;
  } else if (price < 0) {
    setProductFieldError('product-price', 'Preço não pode ser negativo.');
    valid = false;
  }

  // coupon validation removed

  if (!category || (category !== 'vetuario' && category !== 'acessorio')) {
    setProductFieldError('product-category', 'Selecione uma categoria válida.');
    valid = false;
  }

  // image client-side checks (optional)
  const imageEl = document.getElementById('product-image');
  if (imageEl && imageEl.files && imageEl.files.length > 0) {
    const file = imageEl.files[0];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (!file.type.startsWith('image/')) {
      setProductFieldError('product-image', 'O arquivo precisa ser uma imagem.');
      valid = false;
    } else if (file.size > maxBytes) {
      setProductFieldError('product-image', 'A imagem é muito grande (máx 5MB).');
      valid = false;
    }
  }

  // sizes validation: if a size is checked, its quantity must be integer >= 0
  const sizes = ['pp','p','m','g','gg','xg'];
  let anySizeChecked = false;
  for (const s of sizes) {
    const chk = document.getElementById(`size-${s}`);
    const qtyEl = document.getElementById(`qty-${s}`);
    if (chk && chk.checked) {
      anySizeChecked = true;
      const q = Number(qtyEl ? qtyEl.value : 0);
      if (Number.isNaN(q) || q < 0 || !Number.isInteger(q)) {
        setProductFieldError('product-sizes', 'Quantidades devem ser inteiros >= 0 para tamanhos selecionados.');
        valid = false;
        break;
      }
    }
  }

  // If category is accessory, validate single stock quantity instead
  // (category variable defined earlier in this function)
  if (category === 'acessorio') {
    const stockEl = document.getElementById('product-stock-quantity');
    const stockVal = stockEl ? stockEl.value : '';
    const q = Number(stockVal);
    if (stockVal === '' || Number.isNaN(q) || q < 0 || !Number.isInteger(q)) {
      const err = document.getElementById('product-stock-error');
      if (err) { err.textContent = 'Quantidade deve ser inteiro >= 0.'; err.classList.remove('hidden'); }
      valid = false;
    } else {
      const err = document.getElementById('product-stock-error');
      if (err) { err.textContent = ''; err.classList.add('hidden'); }
    }
  } else {
    // clear any stock error when not accessory
    const err = document.getElementById('product-stock-error');
    if (err) { err.textContent = ''; err.classList.add('hidden'); }
  }

  return valid;
}

// Toggle visibility between sizes (for vestuario) and single stock field (for acessorio)
function updateProductCategoryDisplay() {
  const categoryEl = document.getElementById('product-category');
  const category = categoryEl ? categoryEl.value : null;
  const sizesSection = document.getElementById('product-sizes-section');
  const stockSection = document.getElementById('product-stock-section');
  // default: show sizes, hide stock
  if (category === 'acessorio') {
    if (sizesSection) sizesSection.classList.add('hidden');
    if (stockSection) stockSection.classList.remove('hidden');
  } else {
    if (sizesSection) sizesSection.classList.remove('hidden');
    if (stockSection) stockSection.classList.add('hidden');
  }
}

// wire category select to toggle UI on change (and call once at load)
const productCategoryEl = document.getElementById('product-category');
if (productCategoryEl) {
  productCategoryEl.addEventListener('change', () => {
    // clear any size/stock errors when switching
    const sizesErr = document.getElementById('product-sizes-error'); if (sizesErr) { sizesErr.textContent = ''; sizesErr.classList.add('hidden'); }
    const stockErr = document.getElementById('product-stock-error'); if (stockErr) { stockErr.textContent = ''; stockErr.classList.add('hidden'); }
    updateProductCategoryDisplay();
  });
  // initial run
  try { updateProductCategoryDisplay(); } catch (e) { /* ignore */ }
}

// Image preview handling
let _productImagePreviewURL = null;
function showProductImagePreview(file) {
  const panel = document.getElementById('product-image-preview-panel');
  const img = document.getElementById('product-image-preview');
  const placeholder = document.getElementById('product-image-preview-placeholder');
  if (!panel || !img || !file) return;

  // revoke previous URL
  if (_productImagePreviewURL) {
    try { URL.revokeObjectURL(_productImagePreviewURL); } catch (e) {}
    _productImagePreviewURL = null;
  }

  const url = URL.createObjectURL(file);
  _productImagePreviewURL = url;
  img.src = url;
  img.classList.remove('hidden');
  if (placeholder) placeholder.classList.add('hidden');
}

function hideProductImagePreview() {
  const panel = document.getElementById('product-image-preview-panel');
  const img = document.getElementById('product-image-preview');
  const placeholder = document.getElementById('product-image-preview-placeholder');
  if (!panel) return;
  if (img) img.src = '';
  if (img) img.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');
  if (_productImagePreviewURL) {
    try { URL.revokeObjectURL(_productImagePreviewURL); } catch (e) {}
    _productImagePreviewURL = null;
  }
}

function showProductImagePreviewUrl(url) {
  const panel = document.getElementById('product-image-preview-panel');
  const img = document.getElementById('product-image-preview');
  const placeholder = document.getElementById('product-image-preview-placeholder');
  if (!panel || !img || !url) return;

  // revoke previous object URL if any
  if (_productImagePreviewURL) {
    try { URL.revokeObjectURL(_productImagePreviewURL); } catch (e) {}
    _productImagePreviewURL = null;
  }

  img.src = url;
  img.classList.remove('hidden');
  if (placeholder) placeholder.classList.add('hidden');
}

// wire input change to preview
const productImageInput = document.getElementById('product-image');
if (productImageInput) {
  productImageInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      showProductImagePreview(f);
    } else {
      hideProductImagePreview();
    }
  });
}

// close button
const previewCloseBtn = document.getElementById('product-image-preview-close');
if (previewCloseBtn) previewCloseBtn.addEventListener('click', (e) => { e.preventDefault(); hideProductImagePreview(); const el = document.getElementById('product-image'); if (el) el.value = ''; });

// limpar erro do campo ao digitar
['product-name','product-description','product-price','product-category','product-image'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      const err = document.getElementById(`${id}-error`);
      if (err) { err.textContent = ''; err.classList.add('hidden'); }
    });
    el.addEventListener('change', () => {
      const err = document.getElementById(`${id}-error`);
      if (err) { err.textContent = ''; err.classList.add('hidden'); }
    });
  }
});

function fillProductForm(product) {
  document.getElementById('product-id').value = product.id || '';
  document.getElementById('product-name').value = product.name || '';
  document.getElementById('product-description').value = product.description || '';
  document.getElementById('product-price').value = product.price || '';
  // coupon fields removed from form
  const categoryEl = document.getElementById('product-category');
  if (categoryEl) categoryEl.value = product.category || 'acessorio';
  document.getElementById('product-active').checked = Boolean(product.is_active);
  // clear file input so we don't accidentally submit previous selection
  const imageEl = document.getElementById('product-image');
  if (imageEl) imageEl.value = '';

  // if product already has an image_url, show preview from that URL
  if (product.image_url) {
    showProductImagePreviewUrl(resolveMediaUrlAdmin(product.image_url));
  } else {
    hideProductImagePreview();
  }

  // fill stock for accessories (if present)
  const stockEl = document.getElementById('product-stock-quantity');
  if (stockEl) stockEl.value = (product.stock_quantity !== undefined && product.stock_quantity !== null) ? String(product.stock_quantity) : '0';

  // ensure UI reflects chosen category (show/hide sizes vs stock)
  try { updateProductCategoryDisplay(); } catch (e) { /* ignore */ }

  // fill sizes if available
  try {
    const sizes = product.sizes || {};
    ['pp','p','m','g','gg','xg'].forEach((s) => {
      const chk = document.getElementById(`size-${s}`);
      const qty = document.getElementById(`qty-${s}`);
      if (chk) chk.checked = Boolean(sizes[s]);
      if (qty) qty.value = (sizes[s] !== undefined && sizes[s] !== null) ? String(sizes[s]) : '0';
    });
  } catch (e) {
    // ignore
  }
}

// Event delegation for product actions
document.addEventListener('click', async (ev) => {
  // Clique no card (qualquer lugar do artigo) abre o formulário de edição,
  // exceto quando o clique for em botões com data-product-action (Editar/Excluir).
  const createBtn = ev.target.closest && (ev.target.closest('#product-create-button') || ev.target.closest('#product-create-button-dashboard'));
  if (createBtn) {
    // botão para abrir o formulário em branco
    resetProductForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const cardEl = ev.target.closest && ev.target.closest('[data-product-card-id]');
  const actionEl = ev.target.closest && ev.target.closest('[data-product-action]');

  if (cardEl && !actionEl) {
    const id = cardEl.getAttribute('data-product-card-id');
    const prod = products.find((p) => String(p.id) === String(id));
    if (prod) fillProductForm(prod);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const editBtn = actionEl && actionEl.getAttribute('data-product-action') === 'edit' ? actionEl : null;
  const delBtn = actionEl && actionEl.getAttribute('data-product-action') === 'delete' ? actionEl : null;

  if (editBtn) {
    const id = editBtn.getAttribute('data-product-id');
    const prod = products.find((p) => String(p.id) === String(id));
    if (prod) fillProductForm(prod);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (delBtn) {
    const id = delBtn.getAttribute('data-product-id');
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await adminFetch(`/admin/products/${id}`, { method: 'DELETE' });
      await reloadProducts();
      setStatus('product-status', 'Produto removido com sucesso.', 'success');
    } catch (err) {
      setStatus('product-status', err.message || 'Erro ao remover produto.', 'error');
    }
  }
});

// Form submit handler
const productForm = document.getElementById('product-form');
if (productForm) {
  productForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    // Validação client-side por campo
    const isValid = validateProductFormFields();
    if (!isValid) {
      setStatus('product-status', 'Corrija os erros do formulário antes de enviar.', 'error');
      return;
    }
    const id = document.getElementById('product-id').value;
      const payload = {
      name: document.getElementById('product-name').value.trim(),
      description: document.getElementById('product-description').value.trim(),
      price: Number(document.getElementById('product-price').value),
      category: document.getElementById('product-category') ? document.getElementById('product-category').value : null,
      is_active: document.getElementById('product-active').checked,
    };

    try {
      const imageEl = document.getElementById('product-image');
      const hasImage = imageEl && imageEl.files && imageEl.files.length > 0;

      if (hasImage) {
        const formData = new FormData();
        // append all fields
        Object.keys(payload).forEach((k) => {
          const v = payload[k];
          if (v !== null && v !== undefined) formData.append(k, v);
        });
        formData.append('image', imageEl.files[0]);

        // append sizes as JSON string if any
        const sizesObj = {};
        ['pp','p','m','g','gg','xg'].forEach((s) => {
          const chk = document.getElementById(`size-${s}`);
          const qty = document.getElementById(`qty-${s}`);
          if (chk && chk.checked) {
            sizesObj[s] = Number(qty ? qty.value : 0) || 0;
          }
        });
        if (Object.keys(sizesObj).length > 0) {
          formData.append('sizes', JSON.stringify(sizesObj));
        }

        // append stock quantity (for accessories)
        const stockVal = document.getElementById('product-stock-quantity') ? document.getElementById('product-stock-quantity').value : null;
        if (stockVal !== null && stockVal !== undefined) {
          formData.append('stock_quantity', String(Number(stockVal) || 0));
        }

        if (id) {
          // Laravel expects method spoofing for multipart PUT
          formData.append('_method', 'PUT');
          await adminFetch(`/admin/products/${id}`, { method: 'POST', body: formData });
          setStatus('product-status', 'Produto atualizado.', 'success');
        } else {
          await adminFetch('/admin/products', { method: 'POST', body: formData });
          setStatus('product-status', 'Produto criado com sucesso.', 'success');
        }
      } else {
        // include sizes in JSON payload when not using FormData
        const sizesObj = {};
        ['pp','p','m','g','gg','xg'].forEach((s) => {
          const chk = document.getElementById(`size-${s}`);
          const qty = document.getElementById(`qty-${s}`);
          if (chk && chk.checked) {
            sizesObj[s] = Number(qty ? qty.value : 0) || 0;
          }
        });
  if (Object.keys(sizesObj).length > 0) payload.sizes = sizesObj;
  // include stock quantity in JSON payload
  const stockValJson = document.getElementById('product-stock-quantity') ? document.getElementById('product-stock-quantity').value : null;
  if (stockValJson !== null && stockValJson !== undefined) payload.stock_quantity = Number(stockValJson) || 0;
        if (id) {
          await adminFetch(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
          setStatus('product-status', 'Produto atualizado.', 'success');
        } else {
          await adminFetch('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
          setStatus('product-status', 'Produto criado com sucesso.', 'success');
        }
      }

      resetProductForm();
      await reloadProducts();
    } catch (err) {
      setStatus('product-status', err.message || 'Erro ao salvar produto.', 'error');
    }
  });

  const cancelBtn = document.getElementById('product-cancel-edit');
  if (cancelBtn) cancelBtn.addEventListener('click', (e) => { e.preventDefault(); resetProductForm(); });
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

  // Se houver body e não foi definido Content-Type, presumimos JSON quando for string
  if (options.body && typeof options.body === 'string') {
    const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
    if (!hasContentType) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // tenta parsear JSON somente se for apropriado
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');
  let payload = null;

  if (isJson) {
    try {
      payload = await response.json();
    } catch (err) {
      console.error('Falha ao parsear JSON da resposta:', err);
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && adminPage === 'admin-dashboard') {
      clearSession();
      window.location.href = 'login.html';
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }

    // prioriza mensagem do payload se existir
    const message = payload?.message || `Erro ${response.status}`;
    throw new Error(message);
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

    if (!payload || typeof payload !== 'object' || !payload.user) {
      // resposta inesperada: força logout local
      clearSession();
      window.location.href = 'login.html';
      return null;
    }

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
        if (!payload || typeof payload !== 'object') {
          throw new Error('Resposta inválida do servidor. Tente novamente.');
        }

        if (!payload.token) {
          throw new Error(payload?.message || 'Token não recebido do servidor.');
        }

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
    item.addEventListener('click', async () => {
      const target = item.dataset.sectionTarget;
      setActiveAdminSection(target);
      // Quando abrir a seção Loja, garanta que os produtos sejam recarregados
      if (target === 'loja') {
        try {
          await reloadProducts();
        } catch (err) {
          setStatus('dashboard-status', 'Erro ao carregar produtos: ' + (err.message || err), 'error');
        }
      }
      // Quando abrir a seção Eventos, recarrega eventos
      if (target === 'eventos') {
        try {
          await reloadEvents();
          await reloadInscritos();
        } catch (err) {
          setStatus('dashboard-status', 'Erro ao carregar eventos: ' + (err.message || err), 'error');
        }
      }
    });
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

/* -----------------------
   Eventos (Cursos/Eventos)
   ----------------------- */
async function reloadEvents() {
  try {
    const payload = await adminFetch('/admin/events');
    events = Array.isArray(payload) ? payload : (payload.data || payload || []);
    renderEventsList();
  } catch (err) {
    console.error('Erro ao carregar eventos', err);
    throw err;
  }
}

function renderEventsList() {
  const container = document.getElementById('events-list');
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum evento cadastrado.</p>';
    return;
  }

  container.innerHTML = events.map((ev) => {
    // determine status visually in admin: upcoming, ongoing, finished
    const now = new Date();
    const start = ev.start_date ? new Date(ev.start_date) : null;
    const end = ev.end_date ? new Date(ev.end_date) : null;
    let badge = '';

    if (start && now < start) {
      // upcoming (agendado) - yellow
      badge = '<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Agendado</span>';
    } else if (start && end && now >= start && now <= end) {
      // ongoing - green
      badge = '<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Ativo</span>';
    } else if (end && now > end) {
      // finished - red
      badge = '<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Encerrado</span>';
    } else {
      badge = ev.is_active ? '<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Ativo</span>' : '<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Inativo</span>';
    }

    return `
    <article class="rounded-xl border border-gray-200 p-4 mb-3 bg-white">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">${badge}</div>
          <h3 class="font-semibold text-slate-900 mt-3">${ev.title}</h3>
          <p class="mt-1 text-sm text-slate-500">${ev.description || '-'}</p>
          <p class="mt-2 text-xs uppercase tracking-wide text-slate-400">${formatDate(ev.start_date)} → ${formatDate(ev.end_date)}</p>
          <p class="mt-1 text-xs uppercase tracking-wide ${ev.is_active ? 'text-emerald-600' : 'text-slate-400'}">${ev.is_active ? 'Ativo (flag)' : 'Inativo (flag)'}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-slate-500">${ev.location || '-'}</p>
          <div class="mt-3 flex flex-col gap-2">
            <button data-event-action="edit" data-event-id="${ev.id}" class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"> <i class="fa-solid fa-pen-to-square"></i> Editar</button>
            <button data-event-action="delete" data-event-id="${ev.id}" class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-slate-100"> <i class="fa-solid fa-trash"></i> Excluir</button>
          </div>
        </div>
      </div>
    </article>
    `;
  }).join('');
}

function renderInscritosList() {
  const container = document.getElementById('inscritos-list');
  if (!container) return;

  if (!inscritos || inscritos.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-500">Nenhum inscrito encontrado.</p>';
    return;
  }

  container.innerHTML = inscritos.map((inscrito) => {
    const eventName = inscrito.event ? inscrito.event.title : 'Evento removido';
    return `
    <article class="rounded-xl border border-gray-200 p-4 mb-3 bg-white">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="font-semibold text-slate-900">${escapeHtml(inscrito.name)}</h3>
          <p class="text-sm text-slate-500">${escapeHtml(inscrito.email)} • ${escapeHtml(inscrito.whatsapp)}</p>
          <p class="text-xs text-slate-400">CPF: ${escapeHtml(inscrito.cpf)}</p>
          <p class="text-xs text-slate-400">Evento: ${escapeHtml(eventName)}</p>
          <p class="text-xs text-slate-400">Status: ${escapeHtml(inscrito.status)}</p>
        </div>
        <button type="button" data-inscrito-action="delete" data-inscrito-id="${inscrito.id}" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Excluir</button>
      </div>
    </article>
    `;
  }).join('');
}

async function reloadInscritos() {
  try {
    const payload = await adminFetch('/admin/inscritos');
    inscritos = Array.isArray(payload) ? payload : (payload.data || payload || []);
    renderInscritosList();
  } catch (err) {
    console.error('Erro ao carregar inscritos', err);
    throw err;
  }
}

function resetEventForm() {
  document.getElementById('event-id').value = '';
  document.getElementById('event-title').value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-start').value = '';
  document.getElementById('event-end').value = '';
  document.getElementById('event-location').value = '';
  document.getElementById('event-price').value = '';
  document.getElementById('event-pix').value = '';
  document.getElementById('event-active').checked = true;
  const status = document.getElementById('event-status'); if (status) { status.classList.add('hidden'); status.textContent = ''; }
}

function fillEventForm(ev) {
  document.getElementById('event-id').value = ev.id || '';
  document.getElementById('event-title').value = ev.title || '';
  document.getElementById('event-description').value = ev.description || '';
  // convert ISO datetime to input value format yyyy-MM-ddTHH:mm
  try {
    if (ev.start_date) document.getElementById('event-start').value = new Date(ev.start_date).toISOString().slice(0,16);
    if (ev.end_date) document.getElementById('event-end').value = new Date(ev.end_date).toISOString().slice(0,16);
  } catch (e) {}
  document.getElementById('event-location').value = ev.location || '';
  document.getElementById('event-price').value = ev.price || '';
  document.getElementById('event-pix').value = ev.pix_key || '';
  document.getElementById('event-active').checked = Boolean(ev.is_active);
}

// Delegation for event actions
document.addEventListener('click', async (ev) => {
  const trigger = ev.target.closest && ev.target.closest('[data-event-action]');
  if (!trigger) return;

  const action = trigger.dataset.eventAction;
  const eventId = trigger.dataset.eventId;
  const theEvent = events.find((e) => String(e.id) === String(eventId));

  if (!theEvent) return;

  if (action === 'edit') {
    fillEventForm(theEvent);
    setActiveAdminSection('eventos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`Deseja remover o evento "${theEvent.title}"?`);
    if (!confirmed) return;
    try {
      await adminFetch(`/admin/events/${eventId}`, { method: 'DELETE' });
      setStatus('event-status', 'Evento removido com sucesso.', 'success');
      await reloadEvents();
      resetEventForm();
    } catch (err) {
      setStatus('event-status', err.message || 'Erro ao remover evento.', 'error');
    }
  }
});

// Form submit handling
const eventForm = document.getElementById('event-form');
if (eventForm) {
  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('event-id').value;
    const payload = {
      title: document.getElementById('event-title').value.trim(),
      description: document.getElementById('event-description').value.trim(),
      start_date: document.getElementById('event-start').value,
      end_date: document.getElementById('event-end').value,
      location: document.getElementById('event-location').value.trim(),
      price: document.getElementById('event-price').value ? Number(document.getElementById('event-price').value.replace(',', '.')) : 0,
      pix_key: document.getElementById('event-pix').value.trim(),
      is_active: document.getElementById('event-active').checked,
    };

    try {
      const method = id ? 'PUT' : 'POST';
      const endpoint = id ? `/admin/events/${id}` : '/admin/events';
      await adminFetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setStatus('event-status', id ? 'Evento atualizado.' : 'Evento criado com sucesso.', 'success');
      resetEventForm();
      await reloadEvents();
    } catch (err) {
      setStatus('event-status', err.message || 'Erro ao salvar evento.', 'error');
    }
  });

document.addEventListener('click', async (ev) => {
  const trigger = ev.target.closest && ev.target.closest('[data-inscrito-action]');
  if (!trigger) return;

  const action = trigger.dataset.inscritoAction;
  const inscritoId = trigger.dataset.inscritoId;

  if (action === 'delete') {
    const confirmed = window.confirm('Deseja remover esse inscrito?');
    if (!confirmed) return;

    try {
      await adminFetch(`/admin/inscritos/${inscritoId}`, { method: 'DELETE' });
      setStatus('event-status', 'Inscrito removido com sucesso.', 'success');
      await reloadInscritos();
    } catch (err) {
      setStatus('event-status', err.message || 'Erro ao remover inscrito.', 'error');
    }
  }
});

  const cancelBtn = document.getElementById('event-cancel-edit');
  if (cancelBtn) cancelBtn.addEventListener('click', (ev) => { ev.preventDefault(); resetEventForm(); setStatus('event-status', 'Edição cancelada.', 'success'); });
}

/* -----------------------
   Entry Modal (Inscrição)
   ----------------------- */
function openEntryModal() {
  const modal = document.getElementById('entry-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeEntryModal() {
  const modal = document.getElementById('entry-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-entry-modal-btn');
  const closeBtn = document.getElementById('entry-modal-close');
  const overlay = document.getElementById('entry-modal-overlay');
  const cancelBtn = document.getElementById('entry-cancel');

  if (openBtn) openBtn.addEventListener('click', (e) => { e.preventDefault(); openEntryModal(); });
  const openFromEventBtn = document.getElementById('open-entry-modal-from-event-btn');
  if (openFromEventBtn) openFromEventBtn.addEventListener('click', (e) => { e.preventDefault(); openEntryModal(); });
  if (closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeEntryModal(); });
  if (overlay) overlay.addEventListener('click', () => closeEntryModal());
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeEntryModal());

  // entry type buttons
  document.querySelectorAll('.entry-type-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.entry-type-btn').forEach((b) => {
        b.classList.remove('border-blue-300','bg-blue-50');
      });
      btn.classList.add('border-blue-300','bg-blue-50');
      const t = btn.getAttribute('data-entry-type');
      const hidden = document.getElementById('entry-type-input');
      if (hidden) hidden.value = t;
      // enable/disable price and pix inputs depending on type
      const priceInput = document.getElementById('entry-price');
      const pixInput = document.getElementById('entry-pix');
      if (t === 'gratuita') {
        if (priceInput) { priceInput.disabled = true; priceInput.classList.add('opacity-50'); }
        if (pixInput) { pixInput.disabled = true; pixInput.classList.add('opacity-50'); }
      } else if (t === 'paga') {
        if (priceInput) { priceInput.disabled = false; priceInput.classList.remove('opacity-50'); }
        if (pixInput) { pixInput.disabled = false; pixInput.classList.remove('opacity-50'); }
      } else {
        // doacao: pix optional but price hidden/disabled
        if (priceInput) { priceInput.disabled = true; priceInput.classList.add('opacity-50'); }
        if (pixInput) { pixInput.disabled = false; pixInput.classList.remove('opacity-50'); }
      }
    });
  });

  // default select 'paga'
  const defaultBtn = document.querySelector('.entry-type-btn[data-entry-type="paga"]');
  if (defaultBtn) defaultBtn.click();

  // submit entry form
  const entryForm = document.getElementById('entry-form');
  if (entryForm) {
    entryForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const selectedType = document.getElementById('entry-type-input').value;
      const priceRaw = document.getElementById('entry-price').value;
      const pixRaw = document.getElementById('entry-pix') ? document.getElementById('entry-pix').value : null;
      const payload = {
        type: selectedType,
        modality: document.getElementById('entry-modality').value,
        category: document.getElementById('entry-category').value,
        price: priceRaw ? Number(priceRaw.toString().replace(',','.')) : null,
        pix_key: pixRaw || null,
        quantity: Number(document.getElementById('entry-quantity').value || 0),
        valid_from: document.getElementById('entry-valid-from').value || null,
        valid_to: document.getElementById('entry-valid-to').value || null,
        // minimal title/description so EventController validation passes
        title: 'Inscrição - ' + (document.getElementById('entry-category').value || 'Evento'),
        description: '',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        registration_type: 'participante',
        is_active: true,
      };

      // client-side validation
      if (selectedType === 'paga') {
        if (!payload.price || payload.price <= 0) {
          setStatus('event-status', 'Informe um valor válido para inscrições pagas.', 'error');
          return;
        }
        if (!payload.pix_key) {
          setStatus('event-status', 'Informe a chave PIX para receber pagamentos.', 'error');
          return;
        }
      }

      try {
        await adminFetch('/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        setStatus('event-status', 'Entrada criada com sucesso.', 'success');
        closeEntryModal();
        await reloadEvents();
      } catch (err) {
        setStatus('event-status', err.message || 'Erro ao criar entrada.', 'error');
      }
    });
  }
});

if (adminPage === 'admin-login') {
  initLoginPage();
}

if (adminPage === 'admin-dashboard') {
  initDashboardPage();
}
