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

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    <strong>${title} :</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  container.prepend(alertDiv);

  setTimeout(() => {
    const bsAlert = new bootstrap.Alert(alertDiv);
    bsAlert.close();
  }, 3000);
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
  const userName = localStorage.getItem('userName');
  const loginLink = document.getElementById('loginLink');
  const userEmail = localStorage.getItem('userEmail');
  if (loginLink) {
    if (userToken && userName) {
      loginLink.parentElement.innerHTML = `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-user me-1"></i>${userName}
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user-circle me-2"></i>Mon profil</a></li>
            <li><a class="dropdown-item" href="orders.html"><i class="fas fa-box me-2"></i>Mes commandes</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout(event)"><i class="fas fa-sign-out-alt me-2"></i>Déconnexion</a></li>
          </ul>
        </li>
      `;
    } else {
      loginLink.innerHTML = `<i class="fas fa-sign-in-alt me-1"></i>Connexion`;
      loginLink.href = 'login.html';
      loginLink.onclick = null;
    }
  }
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
    if (currentCategoryFilter === 'all') {
      return true;
    }
    return product.category === currentCategoryFilter;
  });

  if (filteredProducts.length === 0) {
    container.innerHTML = '<p class="col-12 text-center text-muted mt-5">Aucun produit trouvé dans cette catégorie.</p>';
  } else {
    container.innerHTML = filteredProducts.map(product => `
      <div class="product-card">
      <a href="product-detail.html?id=${product.id}">
                <img src="${product.image}" class="card-img" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/400x300/e9ecef/212529?text=Image+Non+Trouvée';">
                <div class="card-body">
                    <p class="card-tag">${product.category}</p>
                    <h3 class="product-title">
                    <a href="product-detail.html?id=${product.id}" class="text-decoration-none text-primary fw-bold">
                    ${product.name}</a>
                    </h3>
                    <p class="card-desc">${product.description.substring(0, 100)}...</p>
                    
                    <div class="card-specs">
                        <span class="spec-pill"><i class="fas fa-microchip"></i>${product.specs.ram || 'N/A'}</span>
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


    if (container) container.style.display = 'grid';
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
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${item.image}" alt="${item.name}" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.5rem;" 
                             onerror="this.src='https://placehold.co/60x60/e9ecef/212529?text=IMG';">
                        <div>
                            <h6 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #1a1a1a;">${item.name}</h6>
                        </div>
                    </div>
                </td>
                <td style="color: #6b7280;">${parseFloat(item.price).toFixed(2)} €</td>
                <td>
                    <div style="display: flex; gap: 6px; width: 130px;">
                        <button style="flex: 1; padding: 6px 8px; border: 1.5px solid #e8e8e8; background: white; border-radius: 8px; cursor: pointer; font-size: 0.9rem; color: #6b7280; transition: all 0.2s; font-weight: 600;" 
                                onmouseover="this.style.borderColor='#2563eb'; this.style.color='#2563eb'; this.style.background='#f5f5f7';" 
                                onmouseout="this.style.borderColor='#e8e8e8'; this.style.color='#6b7280'; this.style.background='white';" 
                                type="button" onclick="changeQuantity(${item.id}, -1)">−</button>
                        <input type="text" style="flex: 1; text-align: center; border: 1.5px solid #e8e8e8; border-radius: 8px; padding: 6px 4px; font-size: 0.9rem; background: white; color: #1a1a1a;" value="${item.quantity}" readonly>
                        <button style="flex: 1; padding: 6px 8px; border: 1.5px solid #e8e8e8; background: white; border-radius: 8px; cursor: pointer; font-size: 0.9rem; color: #6b7280; transition: all 0.2s; font-weight: 600;" 
                                onmouseover="this.style.borderColor='#2563eb'; this.style.color='#2563eb'; this.style.background='#f5f5f7';" 
                                onmouseout="this.style.borderColor='#e8e8e8'; this.style.color='#6b7280'; this.style.background='white';" 
                                type="button" onclick="changeQuantity(${item.id}, 1)">+</button>
                    </div>
                </td>
                <td style="font-weight: 700; color: #1a1a1a;">${itemTotal.toFixed(2)} €</td>
                <td>
                    <button style="width: 36px; height: 36px; border: none; background: #dc2626; color: white; border-radius: 10px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);" 
                            onmouseover="this.style.backgroundColor='#b91c1c'; this.style.boxShadow='0 4px 12px rgba(220, 38, 38, 0.3)';" 
                            onmouseout="this.style.backgroundColor='#dc2626'; this.style.boxShadow='0 2px 8px rgba(220, 38, 38, 0.2)';" 
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
