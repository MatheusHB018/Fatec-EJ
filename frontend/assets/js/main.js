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

  if (name.includes('planner')) {
    return 'Papelaria';
  }

  return 'Produtos';
}

function renderMenu(menuItems) {
  const menu = document.getElementById('main-menu');

  if (!menu || !Array.isArray(menuItems)) {
    return;
  }

  const homeHrefPrefix = page === 'products' ? '../index.html#' : '#';
  const productsHref = page === 'products' ? 'produtos.html' : 'pages/produtos.html';

  menu.innerHTML = menuItems.map((item) => {
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

  if (quickLinks && Array.isArray(menuItems)) {
    const footerItems = menuItems.filter((item) => item.slug !== 'loja').slice(0, 5);
    const hrefPrefix = page === 'products' ? '../index.html#' : '#';

    quickLinks.innerHTML = footerItems.map((item) => (
      `<li><a href="${hrefPrefix}${item.slug}" class="hover:text-red-300">${escapeHtml(item.label)}</a></li>`
    )).join('');
  }

  if (servicesList && Array.isArray(services)) {
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
      aboutImage.src = about.image_url;
      aboutImage.classList.remove('hidden');
      aboutImagePlaceholder.classList.add('hidden');
    } else {
      aboutImage.src = '';
      aboutImage.classList.add('hidden');
      aboutImagePlaceholder.classList.remove('hidden');
    }
  }

  if (teamGrid && Array.isArray(payload.team)) {
    teamGrid.innerHTML = payload.team.map((member) => `
      <article class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 text-center">
        ${member.photo_url
          ? `<img src="${escapeHtml(member.photo_url)}" alt="${escapeHtml(member.name)}" class="mx-auto h-16 w-16 rounded-full object-cover border border-slate-200" />`
          : `<div class="mx-auto h-16 w-16 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-xl font-bold">${escapeHtml(member.initials || member.name.split(' ').map((piece) => piece[0]).slice(0, 2).join(''))}</div>`}
        <p class="mt-4 font-semibold text-red-800">${escapeHtml(member.role)}</p>
        <p class="text-slate-600">${escapeHtml(member.name)}</p>
      </article>
    `).join('');
  }

  if (servicesGrid && Array.isArray(payload.services)) {
    servicesGrid.innerHTML = payload.services.map((service) => `
      <article class="rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-800 text-xl"><i class="fa-solid fa-briefcase"></i></span>
        <h3 class="mt-5 text-3xl font-bold">${escapeHtml(service.title)}</h3>
        <p class="mt-3 text-slate-500">${escapeHtml(service.description)}</p>
        <a href="#contato" class="mt-5 inline-flex items-center gap-2 text-red-800 font-semibold">Saiba mais <i class="fa-solid fa-arrow-right"></i></a>
      </article>
    `).join('');
  }

  if (pillarsGrid && Array.isArray(payload.pillars)) {
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

  if (projectsGrid && Array.isArray(payload.projects)) {
    projectsGrid.innerHTML = payload.projects.map((project) => {
      const techList = String(project.technologies || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `<span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">${escapeHtml(item)}</span>`)
        .join('');

      const projectImage = project.image_url
        ? `<img src="${escapeHtml(project.image_url)}" alt="${escapeHtml(project.title)}" class="h-40 w-full object-cover" />`
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

  if (editalsGrid && Array.isArray(payload.editals)) {
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
    const category = inferProductCategory(product.name);

    return `
      <article class="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <button type="button" class="w-full text-left" data-product-id="${product.id}">
          <div class="relative h-52 bg-slate-100 flex items-center justify-center text-slate-400">
            <i class="fa-solid fa-image text-4xl"></i>
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

  if (!product) {
    return;
  }

  selectedProduct = product;
  modalName.textContent = product.name;
  modalCategory.textContent = `Categoria: ${inferProductCategory(product.name)}`;
  modalPrice.textContent = formatPrice(product.price);
  modalDescription.textContent = product.description || 'Produto exclusivo da EJ FATEC.';
  modalAvailability.textContent = product.is_active ? 'Disponível' : 'Indisponível';
}

function openProductModal(productId) {
  const productModal = document.getElementById('produto-modal');
  const product = allProducts.find((item) => String(item.id) === String(productId));

  if (!productModal || !product) {
    return;
  }

  fillProductModal(product);
  productModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
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
  const search = document.getElementById('product-search').value.trim().toLowerCase();
  const category = document.getElementById('product-category').value.replace('Categoria: ', '');
  const sort = document.getElementById('product-sort').value;

  let filtered = [...allProducts].filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search) || (product.description || '').toLowerCase().includes(search);
    const inferredCategory = inferProductCategory(product.name);
    const matchesCategory = category === 'Todos' || category === inferredCategory;

    return matchesSearch && matchesCategory;
  });

  if (sort === 'Menor Preço') {
    filtered.sort((left, right) => Number(left.price) - Number(right.price));
  } else if (sort === 'Maior Preço') {
    filtered.sort((left, right) => Number(right.price) - Number(left.price));
  } else {
    filtered.sort((left, right) => Number(right.id) - Number(left.id));
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
}

async function bootstrapProducts() {
  const [content, products] = await Promise.all([
    fetchJson('/content'),
    fetchJson('/products'),
  ]);

  allProducts = Array.isArray(products) ? products : [];
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
    }
  } catch (error) {
    console.error(error);
  }
}

bootstrapPage();
