const API_BASE_URL = 'https://smartphone-store-backend.onrender.com/api';
const STOCK_API_URL = `${API_BASE_URL}/products`;

function getProductImageUrl(url) {
  const BACKEND_URL = "https://smartphone-store-backend.onrender.com";
  
  if (!url) return "https://placehold.co/400x300/e9ecef/212529?text=Pas+d'image";
  
  // Si l'image vient de ton dossier uploads sur Render
  if (url.startsWith('http')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    return `${BACKEND_URL}${url}`;
  }
  
  // Si c'est déjà une URL complète (ex: lien externe ou assets/)
  return url;
}

// ==================================================================
// VARIABLES GLOBALES ET UTILS
// ==================================================================

let allProducts = [];
let currentCategoryFilter = 'all';

/**
 * Affiche un message flottant à la place de window.alert()
 */
function displayMessage(title, message, type = 'info') {
  const container = document.getElementById('messageContainer');
  if (!container) {
    console.warn("MessageContainer non trouvé.");
    console.log(`${title} (${type}): ${message}`);
    return;
  }
 
  // Palette de couleurs selon le type — cohérente avec le design system
  const styles = {
    success: {
      bg: 'rgba(22, 163, 74, 0.08)',
      border: 'rgba(22, 163, 74, 0.25)',
      color: '#15803d',
      icon: 'fas fa-check-circle'
    },
    danger: {
      bg: 'rgba(220, 38, 38, 0.07)',
      border: 'rgba(220, 38, 38, 0.25)',
      color: '#dc2626',
      icon: 'fas fa-circle-exclamation'
    },
    warning: {
      bg: 'rgba(234, 179, 8, 0.08)',
      border: 'rgba(234, 179, 8, 0.25)',
      color: '#ca8a04',
      icon: 'fas fa-triangle-exclamation'
    },
    info: {
      bg: 'rgba(37, 99, 235, 0.08)',
      border: 'rgba(37, 99, 235, 0.2)',
      color: '#2563eb',
      icon: 'fas fa-circle-info'
    }
  };
 
  const s = styles[type] || styles.info;
 
  const toast = document.createElement('div');
  toast.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: ${s.bg};
    border: 1.5px solid ${s.border};
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    color: #1a1a1a;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    animation: slideIn 0.3s ease;
    position: relative;
  `;
 
  toast.innerHTML = `
    <i class="${s.icon}" style="color:${s.color}; font-size:1rem; margin-top:2px; flex-shrink:0;"></i>
    <div style="flex:1; line-height:1.5;">
      <strong style="color:${s.color};">${title}</strong>
      ${message ? `<span style="color:#6b7280;"> — ${message}</span>` : ''}
    </div>
    <button onclick="this.parentElement.remove()" style="
      background: none; border: none; cursor: pointer;
      color: #9ca3af; font-size: 0.9rem; padding: 0;
      line-height: 1; flex-shrink: 0; margin-top: 1px;
      transition: color 0.2s;
    " onmouseover="this.style.color='#1a1a1a'" onmouseout="this.style.color='#9ca3af'">
      <i class="fas fa-xmark"></i>
    </button>
  `;
 
  // Injection de l'animation si pas encore présente
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(20px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideOut {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(20px); }
      }
    `;
    document.head.appendChild(style);
  }
 
  container.prepend(toast);
 
  // Auto-fermeture après 3.5 secondes
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
// ==================================================================
// FONCTIONS D'AUTHENTIFICATION
// ==================================================================

async function handleRegister(event) {
  event.preventDefault();

  const full_name = document.getElementById('full_name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageContainer = document.getElementById('authMessage');

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ full_name, email, password })
    });

    const result = await response.json();

    if (response.ok) {
      messageContainer.innerHTML = `
        <div class="alert alert-success">
          ${result.message} Redirection vers la connexion...
        </div>
      `;
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      messageContainer.innerHTML = `
        <div class="alert alert-danger">
          ${result.message}
        </div>
      `;
    }
  } catch (error) {
    console.error('Erreur inscription:', error);
    messageContainer.innerHTML = `
      <div class="alert alert-danger">
        Erreur serveur. Vérifiez que l'API est démarrée sur le port 3000.
      </div>
    `;
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageContainer = document.getElementById('authMessage');

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem('userToken', result.token);
      localStorage.setItem('userName', result.user.name);
      localStorage.setItem('userEmail', result.user.email);
      messageContainer.innerHTML = `
        <div class="alert alert-success">
          Connexion réussie ! Redirection...
        </div>
      `;

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      messageContainer.innerHTML = `
        <div class="alert alert-danger">
          ${result.message}
        </div>
      `;
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    messageContainer.innerHTML = `
      <div class="alert alert-danger">
        Erreur serveur. Vérifiez que l'API Node.js est démarrée sur le port 3000.
      </div>
    `;
  }
}

function updateAuthLinks() {
  const userToken = localStorage.getItem('userToken');
  const userName  = localStorage.getItem('userName');
  const loginLink = document.getElementById('loginLink');
 
  if (!loginLink) return;
 
  if (userToken && userName) {
    // Injection du menu custom dans le li parent
    loginLink.parentElement.innerHTML = `
      <li class="nav-item" id="userMenuWrapper" style="position:relative;">
        <button id="userMenuBtn" onclick="toggleUserMenu(event)" style="
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem; font-weight: 600;
          color: #1a1a1a;
          padding: 6px 14px;
          border-radius: 20px;
          transition: background 0.2s;
        "
        onmouseover="this.style.background='#f5f5f7'"
        onmouseout="this.style.background='none'">
          <span style="
            width:28px; height:28px;
            background: rgba(37,99,235,0.10);
            border-radius: 50%;
            display:flex; align-items:center; justify-content:center;
            color:#2563eb; font-size:0.75rem;
          "><i class="fas fa-user"></i></span>
          ${userName}
          <i class="fas fa-chevron-down" id="userMenuChevron" style="font-size:0.65rem; color:#9ca3af; transition: transform 0.2s;"></i>
        </button>
 
        <div id="userDropdownMenu" style="
          display: none;
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #ffffff;
          border: 1.5px solid #e8e8e8;
          border-radius: 16px;
          padding: 8px;
          min-width: 200px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          z-index: 200;
          animation: fadeDropdown 0.2s ease;
        ">
          <a href="profile.html" style="
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px; border-radius: 10px;
            text-decoration: none; color: #1a1a1a;
            font-size: 0.875rem; font-weight: 500;
            transition: background 0.15s;
          "
          onmouseover="this.style.background='#f5f5f7'"
          onmouseout="this.style.background='none'">
            <i class="fas fa-user-circle" style="color:#2563eb; width:16px;"></i> Mon profil
          </a>
 
          <a href="orders.html" style="
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px; border-radius: 10px;
            text-decoration: none; color: #1a1a1a;
            font-size: 0.875rem; font-weight: 500;
            transition: background 0.15s;
          "
          onmouseover="this.style.background='#f5f5f7'"
          onmouseout="this.style.background='none'">
            <i class="fas fa-box" style="color:#2563eb; width:16px;"></i> Mes commandes
          </a>
 
          <div style="height:1px; background:#e8e8e8; margin:6px 0;"></div>
 
          <a href="#" onclick="handleLogout(event)" style="
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px; border-radius: 10px;
            text-decoration: none; color: #dc2626;
            font-size: 0.875rem; font-weight: 500;
            transition: background 0.15s;
          "
          onmouseover="this.style.background='rgba(220,38,38,0.06)'"
          onmouseout="this.style.background='none'">
            <i class="fas fa-sign-out-alt" style="width:16px;"></i> Déconnexion
          </a>
        </div>
      </li>
    `;
 
    // Injection de l'animation du dropdown si pas encore présente
    if (!document.getElementById('dropdown-style')) {
      const style = document.createElement('style');
      style.id = 'dropdown-style';
      style.textContent = `
        @keyframes fadeDropdown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
 
    // Fermer le menu si on clique ailleurs
    document.addEventListener('click', function closeMenu(e) {
      const wrapper = document.getElementById('userMenuWrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        const menu = document.getElementById('userDropdownMenu');
        const chevron = document.getElementById('userMenuChevron');
        if (menu) menu.style.display = 'none';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        document.removeEventListener('click', closeMenu);
      }
    });
 
  } else {
    // Non connecté : bouton Connexion standard
    loginLink.innerHTML = `Connexion`;
    loginLink.href = 'login.html';
    loginLink.onclick = null;
  }
}

function toggleUserMenu(event) {
  event.stopPropagation();
  const menu    = document.getElementById('userDropdownMenu');
  const chevron = document.getElementById('userMenuChevron');
  const isOpen  = menu.style.display === 'block';
 
  menu.style.display    = isOpen ? 'none' : 'block';
  chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
 

function handleLogout(event) {
  event.preventDefault();
  localStorage.removeItem('userToken');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  alert('Vous êtes déconnecté.');
  window.location.href = 'index.html';
}

// ==================================================================
// CHARGEMENT ET FILTRAGE DU CATALOGUE PRODUITS
// ==================================================================

async function fetchCatalog() {
  const container = document.getElementById("productContainer");
  const loadingMessage = document.getElementById("loadingMessage");

  if (container) container.style.display = 'none';
  if (loadingMessage) loadingMessage.style.display = 'block';

  try {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    const products = data.map(item => ({
      id: item.id_produit,
      name: item.nom,
      price: parseFloat(item.prix),
      image: getProductImageUrl(item.url_image),
      description: item.description,
      category: item.categorie,
      specs: {
        ram: item.ram,
        storage: item.stockage,
        battery: item.batterie,
        camera: item.appareil_photo,
        screen: item.ecran
      }
    }));

    allProducts = products;
    renderProducts();
    if (container) container.style.display = 'grid';
  } catch (error) {
    console.error("Erreur lors du chargement du catalogue:", error);
    displayMessage('Erreur', "Impossible de charger le catalogue. Serveur hors ligne.", 'danger');
  } finally {
    if (loadingMessage) loadingMessage.style.display = 'none';
  }
}

function renderProducts() {
  const container = document.getElementById("productContainer");
  if (!container) return;

  const filteredProducts = allProducts.filter(product => {
    if (currentCategoryFilter === 'all') return true;
    return product.category === currentCategoryFilter;
  });

  if (filteredProducts.length === 0) {
    container.innerHTML = '<p style="grid-column:1 / -1;text-align:center;color:#6b7280;">Aucun produit trouvé dans cette catégorie.</p>';
    return;
  }

  container.innerHTML = filteredProducts.map(product => `
    <div class="product-card">
      <a href="product-detail.html?id=${product.id}">
        <img src="${product.image}" class="card-img" alt="${product.name}"
             onerror="this.onerror=null;this.src='https://placehold.co/400x300/e9ecef/212529?text=Image+Non+Trouvée';">
      </a>

      <div class="card-body">
        <p class="card-tag">${product.category}</p>
        <h3 class="product-title">
          <a href="product-detail.html?id=${product.id}" style="text-decoration:none;color:inherit;">
            ${product.name}
          </a>
        </h3>
        <p class="card-desc">${product.description.substring(0, 100)}...</p>

        <div class="card-specs">
          <span class="spec-pill"><i class="fas fa-memory"></i>${product.specs.ram || 'N/A'}</span>
          <span class="spec-pill"><i class="fas fa-hard-drive"></i>${product.specs.storage || 'N/A'}</span>
        </div>

        <div class="card-footer-row">
          <span class="product-price">${product.price.toFixed(2)} €</span>
          <button class="btn-add-to-cart" onclick="addToCart(${product.id})">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function setCategoryFilter(category, clickedButton) {
  currentCategoryFilter = category;

  document.querySelectorAll('.filter-button').forEach(btn => {
    btn.classList.remove('active', 'btn-primary');
    btn.classList.add('btn-outline-primary');
  });
  clickedButton.classList.remove('btn-outline-primary');
  clickedButton.classList.add('active', 'btn-primary');

  renderProducts();
}

// ==================================================================
// GESTION DU PANIER
// ==================================================================

function getCart() {
  const cartJson = localStorage.getItem('shoppingCart');
  return cartJson ? JSON.parse(cartJson) : [];
}

function saveCart(cart) {
  localStorage.setItem('shoppingCart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId) {
  const productToAdd = allProducts.find(p => p.id === productId);

  if (!productToAdd) {
    displayMessage('Erreur', "Produit non trouvé. Veuillez rafraîchir la page.", 'danger');
    return;
  }

  const cart = getCart();
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productToAdd.name,
      price: productToAdd.price,
      image: productToAdd.image,
      quantity: 1
    });
  }

  saveCart(cart);
  displayMessage('Succès', `${productToAdd.name} a été ajouté au panier !`, 'success');
}

function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cartBadge");

  if (badge) {
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }
}

function changeQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);

  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeItem(productId);
      return;
    }
    saveCart(cart);
    renderCart();
  }
}

function removeItem(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== productId);
  saveCart(cart);
  renderCart();
  displayMessage('Panier', "Article retiré.", 'info');
}

async function handleCheckout() {
    // 1. Selection du bouton grace a son attribut onclick existant
    const checkoutBtn = document.querySelector('button[onclick="handleCheckout()"]');
    
    // 2. Recuperation des donnees (on teste les cles communes de LocalStorage)
    const rawCart = localStorage.getItem('shoppingCart') || localStorage.getItem('cart') || '[]';
    const cartData = JSON.parse(rawCart);
    const token = localStorage.getItem('userToken');
    
    // 3. Verification si le panier est vide
    if (!cartData || cartData.length === 0) {
        displayMessage("Erreur", "Votre panier est vide !", "danger");
        return;
    }

     if (!token) {
    displayMessage('Erreur', "Vous devez être connecté pour passer commande.", 'danger');
    setTimeout(() => window.location.href = 'login.html', 2000);
    return;
  }

    // 4. Interface : desactiver le bouton pour eviter les doubles clics
    const originalContent = checkoutBtn ? checkoutBtn.innerHTML : "";
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Redirection...`;
    }

    // 5. Aller a la page de paiement sans vider le panier
    window.location.href = "checkout.html";

    // Si pour une raison quelconque la redirection est bloquee, on reactive le bouton
    setTimeout(() => {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalContent;
        }
    }, 1500);
}
function renderCart() {
  const cart = getCart();
  const cartTableBody = document.getElementById('cartTableBody');
  const emptyMessage = document.getElementById('emptyCartMessage');
  const cartContent = document.getElementById('cartContent');
  const totalAmount = document.getElementById('totalAmount');
  const subtotal = document.getElementById('subtotal');
  const itemCount = document.getElementById('itemCount');

  if (!cartTableBody || !totalAmount) return;

  if (cart.length === 0) {
    emptyMessage.style.display = 'block';
    cartContent.style.display = 'none';
    if (itemCount) itemCount.textContent = 0;
    return;
  }

  emptyMessage.style.display = 'none';
  cartContent.style.display = 'block';

  let total = 0;

  cartTableBody.innerHTML = cart.map(item => {
    const itemTotal = parseFloat(item.price) * item.quantity;
    total += itemTotal;

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${item.image}" alt="${item.name}"
                 style="width:60px;height:60px;object-fit:cover;border-radius:12px;border:1px solid #e8e8e8;background:#f5f5f7;"
                 onerror="this.src='https://placehold.co/60x60/f5f5f7/9ca3af?text=IMG';">
            <div>
              <div style="font-weight:600;font-size:0.9rem;">${item.name}</div>
            </div>
          </div>
        </td>
        <td>${parseFloat(item.price).toFixed(2)} €</td>
        <td>
          <div style="display:flex; gap:6px; width:130px;">
            <button style="flex:1;padding:6px 8px;border:1.5px solid #e8e8e8;background:#fff;border-radius:8px;cursor:pointer;font-size:0.9rem;color:#6b7280;font-weight:600;"
                    type="button" onclick="changeQuantity(${item.id}, -1)">−</button>
            <input type="text" style="flex:1;text-align:center;border:1.5px solid #e8e8e8;border-radius:8px;padding:6px 4px;font-size:0.9rem;background:#fff;color:#1a1a1a;"
                   value="${item.quantity}" readonly>
            <button style="flex:1;padding:6px 8px;border:1.5px solid #e8e8e8;background:#fff;border-radius:8px;cursor:pointer;font-size:0.9rem;color:#6b7280;font-weight:600;"
                    type="button" onclick="changeQuantity(${item.id}, 1)">+</button>
          </div>
        </td>
        <td style="font-weight:700;">${itemTotal.toFixed(2)} €</td>
        <td>
          <button style="width:36px;height:36px;border:none;background:#dc2626;color:#fff;border-radius:10px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(220,38,38,0.2);"
                  onclick="removeItem(${item.id})">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  subtotal.textContent = total.toFixed(2) + ' €';
  totalAmount.textContent = total.toFixed(2) + ' €';
  if (itemCount) itemCount.textContent = cart.length;
}




// ==================================================================
// GESTION DES COMMANDES
// ==================================================================

async function loadOrders() {
  const token = localStorage.getItem('userToken');
  const loadingMessage = document.getElementById('loadingMessage');
  const ordersContainer = document.getElementById('ordersContainer');
  const noOrdersMessage = document.getElementById('noOrdersMessage');

  if (!ordersContainer) return;

  if (!token) {
    if (loadingMessage) loadingMessage.style.display = 'none';
    displayMessage('Erreur', 'Vous devez être connecté pour voir vos commandes.', 'danger');
    setTimeout(() => window.location.href = 'login.html', 2000);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des commandes');
    }

    const orders = await response.json();

    if (loadingMessage) loadingMessage.style.display = 'none';

    if (orders.length === 0) {
      if (noOrdersMessage) noOrdersMessage.style.display = 'block';
      return;
    }

    ordersContainer.innerHTML = orders.map(order => `
      <div class="card order-card">
        <div class="order-header">
          <div class="row">
            <div class="col-md-3">
              <strong>Commande #${order.id_commande}</strong>
            </div>
            <div class="col-md-3">
              <i class="fas fa-calendar me-2"></i>${new Date(order.date_commande).toLocaleDateString('fr-FR')}
            </div>
            <div class="col-md-3">
              <span class="badge ${order.statut === 'En attente' ? 'bg-warning' : 'bg-success'}">
                ${order.statut}
              </span>
            </div>
            <div class="col-md-3 text-end">
              <strong class="text-primary">${order.montant_total} €</strong>
            </div>
          </div>
        </div>
        <div class="card-body">
          ${order.details.map(detail => {
            let detailImage = getProductImageUrl(detail.url_image);
            return `
              <div class="row product-item py-3">
                <div class="col-md-2">
                  <img src="${detailImage}" alt="${detail.nom_produit}"
                       class="img-fluid rounded"
                       onerror="this.src='https://placehold.co/100x100/e9ecef/212529?text=IMG'">
                </div>
                <div class="col-md-6">
                  <h6 class="mb-1">${detail.nom_produit}</h6>
                  <small class="text-muted">Quantité: ${detail.quantite}</small>
                </div>
                <div class="col-md-4 text-end">
                  <p class="mb-0">${detail.prix_a_la_commande} € × ${detail.quantite}</p>
                  <strong>${(detail.prix_a_la_commande * detail.quantite).toFixed(2)} €</strong>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
    if (loadingMessage) loadingMessage.style.display = 'none';
    displayMessage('Erreur', 'Impossible de charger vos commandes.', 'danger');
  }
}

async function deleteAccount() {
  const token = localStorage.getItem('userToken');

  if (!token) {
    displayMessage('Erreur', 'Vous devez être connecté.', 'danger');
    return;
  }

  const confirmed = confirm(
    '⚠️ ATTENTION ⚠️\n\n' +
    'Êtes-vous sûr de vouloir supprimer votre compte ?\n\n' +
    'Cette action est IRRÉVERSIBLE et supprimera :\n' +
    '- Votre compte utilisateur\n' +
    '- Tout l\'historique de vos commandes\n' +
    '- Toutes vos données personnelles\n\n' +
    'Tapez OK pour confirmer la suppression.'
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('shoppingCart');

      alert('✅ Votre compte a été supprimé avec succès.\n\nVous allez être redirigé vers la page d\'accueil.');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } else {
      displayMessage('Erreur', result.message || 'Impossible de supprimer le compte.', 'danger');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    displayMessage('Erreur', 'Erreur de connexion au serveur.', 'danger');
  }
}

async function addStockManual(productId, quantity) {
  const token = localStorage.getItem('userToken');
  
  // On prépare le corps de la requête selon ce que ton serveur attend
  const bodyData = {
    quantite: parseInt(quantity),
    id_utilisateur: null, // Tu pourras extraire l'ID du token plus tard si besoin
    motif: "Réapprovisionnement manuel"
  };

  try {
    const response = await fetch(`${STOCK_API_URL}/${productId}/add-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Optionnel selon ta config serveur
      },
      body: JSON.stringify(bodyData)
    });

    const result = await response.json();

    if (response.ok) {
      displayMessage('Succès', result.message, 'success');
      // On rafraîchit l'affichage du produit spécifique
      refreshProductStockDisplay(productId);
    } else {
      displayMessage('Erreur', result.error || "Erreur de mise à jour", 'danger');
    }
  } catch (error) {
    console.error("Erreur réapprovisionnement:", error);
    displayMessage('Erreur', "Serveur injoignable", 'danger');
  }
}

/**
 * Récupère les infos fraîches (stock_actuel) et met à jour le DOM
 */
async function refreshProductStockDisplay(productId) {
  try {
    const response = await fetch(`${STOCK_API_URL}/${productId}/stock-info`);
    const data = await response.json();

    if (response.ok) {
      // On cherche l'élément dans le DOM qui affiche le stock de ce produit
      // Exemple: <span id="stock-count-12">
      const stockBadge = document.getElementById(`stock-count-${productId}`);
      if (stockBadge) {
        stockBadge.textContent = data.stock_actuel;
        
        // Changement de couleur si seuil d'alerte atteint
        if (data.stock_actuel <= data.seuil_alerte) {
          stockBadge.className = "badge bg-danger";
        } else {
          stockBadge.className = "badge bg-success";
        }
      }
    }
  } catch (error) {
    console.error("Erreur rafraîchissement stock:", error);
  }
}


// ==================================================================
// INITIALISATION GLOBALE
// ==================================================================

document.addEventListener("DOMContentLoaded", () => {
  updateAuthLinks();
  updateCartBadge();

  if (document.getElementById("productContainer")) {
    fetchCatalog();
  }

  if (document.getElementById('cartTableBody')) {
    renderCart();
  }

  if (document.getElementById('ordersContainer') && typeof fetchUserOrders !== 'function') {
    loadOrders();
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});
