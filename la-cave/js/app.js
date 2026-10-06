/* =========================================================================
   Cave — template de démo (SPA vanilla JS, routes en hash)
   Toutes les données viennent de window.SHOP (js/data.js, généré depuis shop.json)
   ========================================================================= */
(function () {
'use strict';
var S = window.SHOP || {}, IC = window.ICONS || {};
var KEY = 'cave:' + (S.slug || 'la-feuille-de-vigne') + ':';
var app = document.getElementById('app');

/* ---------- utilitaires ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function num(n, sep) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep || '\u00a0'); }
function fmt(n) { return num(n) + '\u00a0' + (S.currency || 'FCFA'); }
function fmtTxt(n) { return num(n, ' ') + ' ' + (S.currency || 'FCFA'); }
function load(k, d) {
  try {
    var v = localStorage.getItem(KEY + k);
    if (v == null && S.slug === 'la-feuille-de-vigne') {
      v = localStorage.getItem('cave:cave-modele:' + k);
    }
    return v == null ? d : JSON.parse(v);
  } catch (e) { return d; }
}
function save(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }

/* Réglages personnalisés persistés */
function applySettings(cfg) {
  if (!cfg) return;
  if (cfg.name) { S.name = cfg.name; S.logoText = cfg.name; }
  if (cfg.slogan) S.slogan = cfg.slogan;
  if (cfg.phone) S.phone = cfg.phone;
  if (cfg.whatsapp) S.whatsapp = cfg.whatsapp;
  if (cfg.address) S.address = cfg.address;
  if (cfg.neighbourhood) S.neighbourhood = cfg.neighbourhood;
  if (cfg.orderPrefix) S.orderPrefix = cfg.orderPrefix;
  if (cfg.freeFrom) {
    if (!S.delivery) S.delivery = {};
    S.delivery.freeFrom = +cfg.freeFrom;
  }
}
var savedSettings = load('settings', null);
if (savedSettings) applySettings(savedSettings);

function icon(name, size, cls) {
  var s = IC[name] || '';
  if (size && s) {
    var m = s.match(/width="([\d.]+)" height="([\d.]+)"/);
    if (m) { var w = +m[1], h = +m[2], nh = Math.round(size * h / w * 100) / 100; s = s.replace(m[0], 'width="' + size + '" height="' + nh + '"'); }
  }
  return '<span class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + s + '</span>';
}
function initials(s) { return String(s).split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
function waLink(text) { return 'https://wa.me/' + String(S.whatsapp || '').replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : ''); }
function telLink() { return 'tel:' + String(S.phone || '').replace(/[^\d+]/g, ''); }
var logo = S.logoText || S.name || 'La Feuille de Vigne';

/* ---------- textes par défaut (adaptés du Figma) — surchargeables via shop.json > texts ---------- */
var T = Object.assign({
  ageTitle: 'Êtes-vous majeur ?',
  ageText: "Pour accéder à notre sélection de vins et spiritueux, vous devez avoir l'âge légal de consommer de l'alcool (18 ans).",
  ageYes: "Oui, j'ai plus de 18 ans", ageNo: 'Non, je suis mineur',
  ageRefused: "Désolé, la vente d'alcool est interdite aux mineurs. Revenez nous voir à votre majorité !",
  picks: 'Coups de cœur du sommelier', limited: 'Éditions Limitées', seeAll: 'Voir tout',
  catalogueTitle: 'La Feuille de Vigne', catalogueIntroTitle: 'La Collection',
  catalogueIntro: 'Explorez une sélection de vins, champagnes et spiritueux, choisis avec exigence et conservés à température dans notre cave.',
  searchPh: 'Rechercher un domaine, millésime...', searchPh2: 'Rechercher un domaine, cépage, région...',
  giftTitle: 'Idéal pour Offrir',
  giftText: "Anniversaire, mariage, cadeau d'affaires : faites composer un coffret par notre sommelier, avec un message manuscrit offert. Livraison dans tout Cotonou.",
  giftCta: 'Composer un Coffret',
  newsTitle: 'Recevez nos nouveaux arrivages',
  newsText: "Soyez informé en priorité de l'arrivée de nos nouvelles sélections et de nos ventes privées, directement sur WhatsApp.",
  tastingTitle: 'Note de Dégustation',
  journalTitle: 'Le Journal de La Feuille de Vigne',
  journalIntro: "Conseils de conservation, accords avec la cuisine d'ici et secrets de sommelier : nos chroniques pour mieux choisir et mieux déguster.",
  reassure: 'Bouteilles calées et protégées de la chaleur pendant tout le trajet.',
  notFoundTitle: 'Cette bouteille semble avoir disparu...',
  notFoundText: "La page que vous recherchez n'est pas ou n'est plus disponible. Notre sommelier l'a peut-être rangée dans une autre allée de la cave."
}, S.texts || {});

var IMG = S.images || {};
var CATS = S.categories || [];
var CAT = {}; CATS.forEach(function (c) { CAT[c.id] = c; });
var P = (S.products || []).map(function (p, i) { p._i = i; return p; });
var BY = {}; P.forEach(function (p) { BY[p.id] = p; });
var DELIV = (S.delivery && S.delivery.options) || [{ id: 'standard', label: 'Livraison', desc: 'Sous 24h', eta: 'Sous 24h', price: 1500 }];
var FREE = (S.delivery && S.delivery.freeFrom) || 0;
var PAYS = S.payments || [{ id: 'cod', label: 'Paiement à la livraison', desc: 'Espèces à la réception', type: 'cod', icon: 'cash' }];
var CLUB = S.club || {};
/* catégories : chaque catégorie a sa page #/categorie/<slug> ; les vins (group "vins") ont une page de regroupement #/vins */
function slugify(x) { return norm(x).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
CATS.forEach(function (c) { c.slug = c.slug || slugify(c.labelLong || c.label || c.id); c.title = c.title || c.labelLong || c.label; });
var CATSLUG = {}; CATS.forEach(function (c) { CATSLUG[c.slug] = c; });
var WINE = CATS.filter(function (c) { return c.group === 'vins'; });
var HUB = WINE.length > 1;
var WP = Object.assign({ label: 'Vins', title: 'Nos vins', kicker: 'La cave', description: '' }, S.winesPage || {});
function clink(c) { return '#/categorie/' + encodeURIComponent(c.slug); }
function inCat(c) { return P.filter(function (p) { return p.category === c.id; }); }
function refs(n) { return n + ' référence' + (n > 1 ? 's' : ''); }
function giftLink() { return CAT.coffret ? clink(CAT.coffret) : '#/catalogue'; }
var MEM = Object.assign({ name: 'Client Démo', email: 'client@exemple.bj', phone: S.phonePrefix || '+229', since: '2025', tier: 'Or', points: 2450, nextTier: 'Platine', nextAt: 3000, address: (S.neighbourhood || '') + ', ' + (S.city || '') }, CLUB.member || {});
var PREFIX = S.phonePrefix || '+229';

/* textes produits par défaut selon la catégorie */
var CATDEF = {
  rouge: { tasting: 'Un rouge généreux aux tanins fondus, sur les fruits noirs et une touche épicée. Finale longue et gourmande.', grapes: 'Assemblage de cépages rouges', abv: '13,5% vol.', temp: '16°C à 18°C', garde: '5 à 10 ans', pairings: [['Viandes grillées', 'Brochettes, côte de bœuf ou agneau : les tanins accompagnent les saveurs du grill.'], ['Plats mijotés', 'Une sauce riche révèle la profondeur du vin.'], ['Fromages affinés', 'Une pâte pressée souligne le fruit et la longueur.']] },
  blanc: { tasting: 'Un blanc éclatant, sur les agrumes et les fleurs blanches, avec une belle fraîcheur minérale en finale.', grapes: 'Cépages blancs de la région', abv: '12,5% vol.', temp: '8°C à 10°C', garde: '3 à 6 ans', pairings: [['Poisson braisé', "La vivacité du vin répond au poisson grillé et au piment doux."], ['Fruits de mer', 'Crevettes et gambas se marient à sa minéralité.'], ['Fromage de chèvre', 'Un accord classique, frais et salin.']] },
  rose: { tasting: 'Un rosé pâle et délicat, aux arômes de petits fruits rouges et d’agrumes. Idéal bien frais.', grapes: 'Grenache, Cinsault, Syrah', abv: '12,5% vol.', temp: '8°C à 10°C', garde: '1 à 2 ans', pairings: [['Salades estivales', 'La fraîcheur du rosé appelle les entrées colorées.'], ['Poulet grillé', 'Un accord simple et gourmand.'], ['Cuisine épicée', 'Son fruit adoucit les plats relevés.']] },
  champagne: { tasting: 'Une bulle fine et persistante, des notes de brioche, de pomme mûre et d’agrumes. Bouche ample et fraîche.', grapes: 'Chardonnay, Pinot Noir, Pinot Meunier', abv: '12% vol.', temp: '6°C à 8°C', garde: '3 à 8 ans', pairings: [['Apéritif', 'Le compagnon idéal des célébrations.'], ['Poissons fins', 'Sa fraîcheur souligne les chairs délicates.'], ['Desserts aux fruits', 'Une fin de repas pétillante.']] },
  spiritueux: { tasting: 'Un spiritueux d’une grande rondeur, sur les fruits secs, la vanille et le bois précieux. Finale chaleureuse.', grapes: '—', abv: '40% vol.', temp: 'Température ambiante, avec ou sans glaçon', garde: 'Se conserve debout, plusieurs années', pairings: [['Chocolat noir', 'Les notes boisées répondent au cacao.'], ['Cigare', 'Pour les amateurs, un moment de dégustation.'], ['Fruits secs', 'Noix et amandes prolongent la finale.']] },
  coffret: { tasting: 'Une sélection composée par notre sommelier, présentée dans un coffret soigné. Message personnalisé offert.', grapes: 'Selon la composition', abv: '—', temp: 'Selon les vins', garde: 'Selon les vins', pairings: [['Anniversaire', 'Un cadeau qui fait toujours plaisir.'], ['Cadeau d’affaires', 'Facture et livraison au bureau possibles.'], ['Mariage', 'Coffrets personnalisés sur demande.']] }
};
function pd(p, k) {
  if (p[k] != null && p[k] !== '') return p[k];
  var d = CATDEF[p.category] || CATDEF.rouge;
  if (k === 'pairings') return d.pairings.map(function (x) { return { title: x[0], text: x[1] }; });
  return d[k];
}

/* ---------- état (localStorage) ---------- */
var currentTheme = (function () {
  try { return localStorage.getItem('cave_theme') || 'light'; } catch (e) { return 'light'; }
})();
function setTheme(t) {
  currentTheme = t;
  try { localStorage.setItem('cave_theme', t); } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
  initInteractiveMap();
  rerender();
}
function toggleTheme() {
  setTheme(currentTheme === 'light' ? 'dark' : 'light');
}

/* Auth & RBAC (Rôles : 'superadmin', 'gerant', 'client') */
var DEFAULT_USERS = [
  {
    id: 'usr-superadmin',
    email: 'admin@lafeuilledevigne.bj',
    name: 'Direction Générale (SuperAdmin)',
    role: 'superadmin',
    phone: '+229 01 21 32 10 99',
    caveSlug: 'all',
    tier: 'Platine'
  },
  {
    id: 'usr-gerant',
    email: 'gerant@lafeuilledevigne.bj',
    name: 'Gérance La Feuille de Vigne',
    role: 'gerant',
    phone: '+229 01 21 32 10 98',
    caveSlug: S.slug || 'la-feuille-de-vigne',
    tier: 'Gérant'
  },
  {
    id: 'usr-client',
    email: 'client@exemple.com',
    name: 'Client Démo',
    role: 'client',
    phone: '+229 01 66 00 00 00',
    caveSlug: S.slug || 'la-feuille-de-vigne',
    tier: 'Or'
  }
];

function getUsers() {
  var u = load('all_users', null);
  if (!u || !u.length) {
    u = DEFAULT_USERS.slice();
    save('all_users', u);
  }
  return u;
}
function saveUsers(u) { save('all_users', u); }
function addUser(name, email, role, phone, caveSlug) {
  var users = getUsers();
  var nu = {
    id: 'usr-' + Date.now().toString(36),
    name: name,
    email: email.trim().toLowerCase(),
    role: role || 'client',
    phone: phone || '+229 01 00 00 00',
    caveSlug: caveSlug || S.slug,
    tier: role === 'superadmin' ? 'Platine' : (role === 'gerant' ? 'Gérant' : 'Nouveau')
  };
  users.push(nu);
  saveUsers(users);
  return nu;
}
function updateUserRole(id, newRole) {
  var users = getUsers();
  users.forEach(function (u) { if (u.id === id) u.role = newRole; });
  saveUsers(users);
  if (currentUser && currentUser.id === id) {
    currentUser.role = newRole;
    save('auth_user', currentUser);
  }
}
function deleteUser(id) {
  var users = getUsers().filter(function (u) { return u.id !== id; });
  saveUsers(users);
  if (currentUser && currentUser.id === id) {
    logoutUser();
  }
}

var currentUser = load('auth_user', null);
function isLogged() { return !!currentUser; }
function isGerant() { return currentUser && (currentUser.role === 'gerant' || currentUser.role === 'superadmin'); }
function isSuperAdmin() { return currentUser && currentUser.role === 'superadmin'; }
function loginAs(u) {
  currentUser = u;
  save('auth_user', u);
  toast('Connecté en tant que ' + u.name);
  render(false);
}
function logoutUser() {
  currentUser = null;
  save('auth_user', null);
  toast('Déconnexion effectuée');
  if (location.hash.indexOf('#/admin') === 0) location.hash = '#/';
  else render(false);
}

var cart = load('cart', []);
var favs = load('favs', []);
var ck = load('checkout', { name: '', phone: '', zone: '', address: '', email: '', note: '', ship: DELIV[0].id, pay: PAYS[0].id, momo: '', gift: false, giftMsg: '' });
var F = load('filters', { cats: [], regions: [], years: [], pairs: [], min: null, max: null, sort: 'fav', q: '' });
var recent = load('recent', ['Bordeaux 2015', 'Champagne Brut', 'Whisky 12 ans']);
var shown = 6, drawerOpen = false, pdQty = 1, galIdx = 0, dPanel = false;
var hlTab = 'bestsellers', faqOpen = { 0: true }, mapFilter = 'current', admTab = 'orders';
var stockOverrides = load('stock_overrides', {});
function getStock(p) { return stockOverrides[p.id] != null ? stockOverrides[p.id] : (p.lowStock ? 3 : (12 + (p.price % 17))); }
function setStock(id, d) { var p = BY[id]; if (!p) return; stockOverrides[id] = Math.max(0, getStock(p) + d); save('stock_overrides', stockOverrides); }
function persist() { save('cart', cart); save('favs', favs); save('checkout', ck); save('filters', F); save('recent', recent); save('stock_overrides', stockOverrides); }

function cartCount() { return cart.reduce(function (a, l) { return a + l.qty; }, 0); }
function cartLines() { return cart.filter(function (l) { return BY[l.id]; }).map(function (l) { return { p: BY[l.id], qty: l.qty, total: BY[l.id].price * l.qty }; }); }
function subtotal() { return cartLines().reduce(function (a, l) { return a + l.total; }, 0); }
function shipOpt() { return DELIV.filter(function (o) { return o.id === ck.ship; })[0] || DELIV[0]; }
function shipCost(sub) { var o = shipOpt(); if (!o.price) return 0; return FREE && sub >= FREE ? 0 : o.price; }
function payOpt() { return PAYS.filter(function (o) { return o.id === ck.pay; })[0] || PAYS[0]; }
function addCart(id, q) { var l = cart.filter(function (x) { return x.id === id; })[0]; if (l) l.qty += q || 1; else cart.push({ id: id, qty: q || 1 }); persist(); toast(esc(BY[id].name) + ' ajouté au panier'); }
function setQty(id, d) { cart.forEach(function (l) { if (l.id === id) l.qty = Math.max(0, l.qty + d); }); cart = cart.filter(function (l) { return l.qty > 0; }); persist(); }
function isFav(id) { return favs.indexOf(id) >= 0; }
function toggleFav(id) { if (isFav(id)) { favs = favs.filter(function (x) { return x !== id; }); toast('Retiré des favoris'); } else { favs.push(id); toast('Ajouté aux favoris'); } persist(); }

var tt;
function toast(msg) { var t = document.getElementById('toast'); if (!t) return; t.innerHTML = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, 1800); }

/* ---------- images (bibliothèque, URL, ou illustration SVG générée) ---------- */
var BOTTLE = { rouge: ['#4a0d16', '#7a1f2b', '#d9c9a3'], blanc: ['#c9b46a', '#e8d9a0', '#f4f1eb'], rose: ['#d98c8c', '#f0b9b0', '#f4f1eb'], champagne: ['#1f2a1a', '#3a4a2a', '#C9A24B'], spiritueux: ['#7a3e0e', '#b36a22', '#e9d5a8'], coffret: ['#5a3a1e', '#8a5a2e', '#C9A24B'] };
function bottleSvg(p) {
  var c = BOTTLE[p.category] || BOTTLE.rouge, id = 'g' + (p._i || 0);
  if (p.category === 'coffret') {
    return '<svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(p.name) + '"><defs><radialGradient id="' + id + '" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#2a2a2e"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient></defs><rect width="300" height="300" fill="url(#' + id + ')"/><rect x="70" y="120" width="160" height="120" rx="6" fill="' + c[0] + '"/><rect x="70" y="120" width="160" height="22" fill="' + c[1] + '"/><rect x="142" y="120" width="16" height="120" fill="' + c[2] + '" opacity=".85"/><path d="M150 120c-30-40-50-10-20 0M150 120c30-40 50-10 20 0" stroke="' + c[2] + '" stroke-width="6" fill="none"/></svg>';
  }
  return '<svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(p.name) + '"><defs><radialGradient id="' + id + '" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#2a2a2e"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient><linearGradient id="' + id + 'b" x1="0" x2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".45" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[0] + '"/></linearGradient></defs><rect width="300" height="300" fill="url(#' + id + ')"/><ellipse cx="150" cy="268" rx="70" ry="8" fill="#000" opacity=".5"/><path d="M138 30h24v58c0 10 22 18 22 46v126a8 8 0 0 1-8 8h-52a8 8 0 0 1-8-8V134c0-28 22-36 22-46z" fill="url(#' + id + 'b)"/><rect x="137" y="26" width="26" height="30" rx="3" fill="' + (p.category === 'champagne' ? '#C9A24B' : '#2b0a10') + '"/><rect x="122" y="160" width="56" height="62" rx="3" fill="' + c[2] + '"/><rect x="130" y="176" width="40" height="3" fill="#0b0b0c" opacity=".6"/><rect x="134" y="186" width="32" height="2" fill="#0b0b0c" opacity=".4"/></svg>';
}
function imgTag(src, alt, eager) { return '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async">'; }
function pimg(p, wide, eager) {
  var src = wide ? (p.imageWide || p.image) : p.image;
  if (!src || src === 'svg') return bottleSvg(p);
  return imgTag(src, p.name, eager);
}
function uimg(key, alt, eager) { var s = IMG[key]; return s && s !== 'svg' ? imgTag(s, alt, eager) : ''; }

/* Carte stylisée (SVG) — remplace la carte "Paris" du Figma */
function mapSvg() {
  return '<svg class="mapart" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="200" fill="#121214"/>' +
    '<path d="M0 168 C80 160 160 175 240 165 S360 158 400 162 V200 H0Z" fill="#0f1c26"/>' +
    '<path d="M0 166 C80 158 160 173 240 163 S360 156 400 160" stroke="#2c5872" stroke-width="2" fill="none" opacity=".8"/>' +
    '<path d="M150 0 C160 40 175 70 200 95 S250 140 262 168" stroke="#1d3a4d" stroke-width="10" fill="none" opacity=".9"/>' +
    '<g stroke="#3a3a40" stroke-width="1.5" fill="none"><path d="M0 120 L120 100 L230 110 L400 80"/><path d="M60 0 L90 80 L120 100 L140 200"/><path d="M300 0 L280 70 L230 110 L210 200"/><path d="M0 60 L90 80 L200 60 L330 40 L400 45"/><path d="M330 40 L340 120 L400 140"/><path d="M120 100 L60 160"/></g>' +
    '<g stroke="var(--accent)" stroke-width="1" fill="none" opacity=".55"><path d="M20 10 H380 V150"/></g>' +
    '<path d="M90 140 C130 120 170 118 210 108" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 5" fill="none"/>' +
    '<circle cx="230" cy="110" r="9" fill="none" stroke="var(--accent)" stroke-width="2"/><circle cx="230" cy="110" r="3.5" fill="var(--accent)"/>' +
    '<text x="246" y="106" fill="var(--text)" font-family="Inter,sans-serif" font-size="12" font-weight="600">' + esc((S.neighbourhood || '').toUpperCase()) + '</text>' +
    '<text x="246" y="121" fill="var(--muted)" font-family="Inter,sans-serif" font-size="9">' + esc(S.city || '') + '</text>' +
    '<text x="300" y="190" fill="#2c5872" font-family="Inter,sans-serif" font-size="9" letter-spacing="2">OCÉAN ATLANTIQUE</text></svg>';
}

/* =========================== composants =========================== */
function statusbar() { return '<div class="statusbar"><b>9:41</b><div class="icons">' + icon('signal') + icon('wifi') + icon('battery') + '</div></div>'; }
function back(href) { return '<a class="slot" href="' + (href || '#/') + '" data-act="back" aria-label="Retour">' + icon('chev-left') + '</a>'; }
function menuBtn() { return '<button class="slot r" data-act="drawer" aria-label="Menu">' + icon('menu') + '</button>'; }
function themeSunMoonSvg() {
  return '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' +
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
}

function mh(title, left, right) {
  var rHtml = right !== undefined ? right : menuBtn();
  return '<header class="sh">' + (left || '<span class="slot"></span>') + '<h1>' + esc(title) + '</h1>' + rHtml + '</header>';
}

function bottomNav(active) {
  var n = cartCount();
  var tabs = [['home', '#/', 'home', 'Accueil'], ['cave', '#/catalogue', 'search', 'Cave'], ['cart', '#/panier', 'bag', 'Panier'], ['club', (isLogged() ? '#/compte' : '#/connexion'), 'user', 'Compte']];
  return '<nav class="bn m-only" aria-label="Navigation principale"><div class="in">' + tabs.map(function (t) {
    return '<a href="' + t[1] + '" class="' + (active === t[0] ? 'on' : '') + '">' + icon(t[2]) + '<span>' + t[3] + '</span>' + (t[0] === 'cart' && n ? '<i class="badge">' + n + '</i>' : '') + '</a>';
  }).join('') + '</div><div class="home-ind"><i></i></div></nav>';
}

function hoursHtml(sep) { return (S.hours || []).map(function (h) { return esc(h.days) + ' : ' + esc(h.time); }).join(sep || '<br>'); }
function socials() {
  var out = '';
  if (S.instagram) out += '<a href="' + esc(S.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + icon('instagram') + '</a>';
  if (S.facebook) out += '<a href="' + esc(S.facebook) + '" target="_blank" rel="noopener" aria-label="Facebook">' + icon('facebook') + '</a>';
  if (S.tiktok) out += '<a href="' + esc(S.tiktok) + '" target="_blank" rel="noopener" aria-label="TikTok">' + icon('tiktok') + '</a>';
  out += '<a href="' + waLink() + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon('whatsapp', 16) + '</a>';
  return out;
}

function openDrawer() {
  drawerOpen = true;
  var d = document.getElementById('drawer');
  if (d) d.classList.add('open');
  document.body.classList.add('drawer-locked');
  document.documentElement.classList.add('drawer-locked');
}
function closeDrawer() {
  drawerOpen = false;
  var d = document.getElementById('drawer');
  if (d) d.classList.remove('open');
  document.body.classList.remove('drawer-locked');
  document.documentElement.classList.remove('drawer-locked');
}

function drawer() {
  var userHtml = '';
  if (isLogged()) {
    var roleBadge = isSuperAdmin()
      ? '<span class="drawer-role-chip superadmin">SuperAdmin</span>'
      : (isGerant() ? '<span class="drawer-role-chip gerant">Gérant</span>' : '<span class="drawer-role-chip client">Client</span>');

    userHtml = '<div class="drawer-user-card">' +
      '<div class="drawer-user-info">' +
      '<div class="drawer-avatar">' + esc(initials(currentUser.name)) + '</div>' +
      '<div class="drawer-user-meta">' +
      '<b>' + esc(currentUser.name) + '</b>' +
      roleBadge +
      '<span>' + esc(currentUser.email) + '</span>' +
      '</div></div>' +
      '<button class="link2" data-act="logout" style="font-size:11px;padding:4px 0;color:var(--muted)">Déconnexion</button>' +
      '</div>';
  } else {
    userHtml = '<div class="drawer-user-card">' +
      '<div class="drawer-user-info">' +
      '<div class="drawer-avatar" style="border-color:var(--border);color:var(--muted)">' + icon('user', 18) + '</div>' +
      '<div class="drawer-user-meta">' +
      '<b>Bienvenue à ' + esc(S.name) + '</b>' +
      '<span>Commandes, favoris &amp; club</span>' +
      '</div></div>' +
      '<a class="drawer-btn-login" href="#/connexion" data-act="drawer-close">' + icon('user', 13) + ' Connexion</a>' +
      '</div>';
  }

  var themePill = '<div class="drawer-theme-pill">' +
    '<span>Mode d\'affichage</span>' +
    '<div class="drawer-theme-switch">' +
    '<button class="' + (currentTheme === 'light' ? 'active' : '') + '" data-act="set-theme" data-v="light">' + icon('sparkles', 13) + ' Clair</button>' +
    '<button class="' + (currentTheme === 'dark' ? 'active' : '') + '" data-act="set-theme" data-v="dark">' + icon('droplet', 13) + ' Sombre</button>' +
    '</div></div>';

  var quickGrid = '<div class="drawer-quick-grid">' +
    '<a class="drawer-quick-tile" href="#/catalogue" data-act="drawer-close"><div class="drawer-quick-icon">' + icon('wine', 18) + '</div><span>Boutique</span></a>' +
    '<a class="drawer-quick-tile" href="#/" data-act="drawer-close" onclick="setTimeout(function(){var m=document.getElementById(\'carte-section\');if(m)m.scrollIntoView({behavior:\'smooth\'});},100)"><div class="drawer-quick-icon">' + icon('map', 18) + '</div><span>Carte Caves</span></a>' +
    '<a class="drawer-quick-tile" href="#/suivi" data-act="drawer-close"><div class="drawer-quick-icon">' + icon('box', 18) + '</div><span>Suivi Colis</span></a>' +
    '<a class="drawer-quick-tile" href="#/favoris" data-act="drawer-close"><div class="drawer-quick-icon">' + icon('heart14', 18) + '</div><span>Favoris</span></a>' +
    '</div>';

  var catChips = '<div class="drawer-sec-lbl">Nos Sélections &amp; Caves</div>' +
    '<div class="drawer-cats-list">' +
    '<a class="drawer-cat-row" href="#/categorie/vins-rouges" data-act="drawer-close"><div class="drawer-cat-left">' + icon('wine', 16, 'c-accent') + ' <span>Vins Rouges Grands Crus</span></div>' + icon('chev-right', 12) + '</a>' +
    '<a class="drawer-cat-row" href="#/categorie/vins-blancs" data-act="drawer-close"><div class="drawer-cat-left">' + icon('glass', 16, 'c-accent') + ' <span>Vins Blancs Frais</span></div>' + icon('chev-right', 12) + '</a>' +
    '<a class="drawer-cat-row" href="#/categorie/roses" data-act="drawer-close"><div class="drawer-cat-left">' + icon('droplet', 16, 'c-accent') + ' <span>Rosés Délicats</span></div>' + icon('chev-right', 12) + '</a>' +
    '<a class="drawer-cat-row" href="#/categorie/champagnes" data-act="drawer-close"><div class="drawer-cat-left">' + icon('sparkles', 16, 'c-accent') + ' <span>Champagnes &amp; Bulles</span></div>' + icon('chev-right', 12) + '</a>' +
    '<a class="drawer-cat-row" href="#/categorie/spiritueux" data-act="drawer-close"><div class="drawer-cat-left">' + icon('wine', 16, 'c-accent') + ' <span>Spiritueux Rares</span></div>' + icon('chev-right', 12) + '</a>' +
    '<a class="drawer-cat-row" href="#/categorie/coffrets-cadeaux" data-act="drawer-close"><div class="drawer-cat-left">' + icon('gift', 16, 'c-accent') + ' <span>Coffrets à Offrir</span></div>' + icon('chev-right', 12) + '</a>' +
    '</div>';

  var servicesList = '<div class="drawer-sec-lbl">Privilèges &amp; Savoir-Faire</div>' +
    '<div class="drawer-cats-list">' +
    '<a class="drawer-cat-row" href="#/club" data-act="drawer-close"><div class="drawer-cat-left">' + icon('award', 16, 'c-accent') + ' <span>Club Privé &amp; Fidélité</span></div>' + icon('chev-right', 12) + '</a>' +
    '<a class="drawer-cat-row" href="#/journal" data-act="drawer-close"><div class="drawer-cat-left">' + icon('book', 16, 'c-accent') + ' <span>Le Journal du Sommelier</span></div>' + icon('chev-right', 12) + '</a>' +
    '<a class="drawer-cat-row" href="#/services" data-act="drawer-close"><div class="drawer-cat-left">' + icon('truck16', 16, 'c-accent') + ' <span>Livraison Express 2h &amp; MoMo</span></div>' + icon('chev-right', 12) + '</a>' +
    '</div>';

  var adminCard = '';
  if (isGerant()) {
    adminCard = '<a class="drawer-admin-card" href="#/admin" data-act="drawer-close">' +
      '<div>' +
      '<div class="drawer-admin-title">' + icon('sliders', 14) + ' ' + (isSuperAdmin() ? 'Console SuperAdmin' : 'Espace Gérant de Cave') + '</div>' +
      '<div class="drawer-admin-sub">Gestion des stocks, commandes &amp; WhatsApp</div>' +
      '</div>' +
      icon('chev-right', 14) +
      '</a>';
  }

  return '<div class="drawer' + (drawerOpen ? ' open' : '') + '" id="drawer"><div class="ov" data-act="drawer-close"></div><aside class="pn" aria-label="Menu">' +
    '<div class="drawer-head"><b class="lg-t">' + esc(logo) + '</b><button class="drawer-close-btn" data-act="drawer-close" aria-label="Fermer">' + icon('x20') + '</button></div>' +
    '<div class="drawer-body">' +
    userHtml +
    themePill +
    quickGrid +
    (adminCard ? adminCard : '') +
    catChips +
    servicesList +
    '</div>' +
    '<div class="drawer-footer">' +
    '<div class="drawer-contacts">' +
    '<a class="wa" href="' + waLink('Bonjour ' + S.name + ', j\'aimerais avoir un conseil.') + '" target="_blank" rel="noopener">' + icon('whatsapp', 14) + ' WhatsApp</a>' +
    '<a href="' + esc(S.mapsUrl) + '" target="_blank" rel="noopener">' + icon('pin', 14) + ' Itinéraire</a>' +
    '<a href="' + telLink() + '">' + icon('phone', 14) + ' Appeler</a>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--muted);text-align:center">' + esc(S.neighbourhood) + ' · ' + esc(S.city) + '<br>' + hoursHtml(' · ') + '</div>' +
    '</div></aside></div>';
}

function dHeader(active) {
  var n = cartCount();
  var nav = [['shop', '#/catalogue', 'Boutique']], hubDone = false;
  CATS.forEach(function (c) {
    if (HUB && c.group === 'vins') { if (!hubDone) { hubDone = true; nav.push(['vins', '#/vins', WP.label, WINE]); } }
    else nav.push([c.id, clink(c), c.navLabel || c.label]);
  });
  nav.push(['journal', '#/journal', 'Journal'], ['club', '#/club', 'Club']);

  var adminBtn = '';
  if (isSuperAdmin()) {
    adminBtn = '<a href="#/admin" class="nav-badge-admin superadmin" title="Console SuperAdmin">👑 SuperAdmin</a>';
  } else if (isGerant()) {
    adminBtn = '<a href="#/admin" class="nav-badge-admin gerant" title="Espace Gérance">⚙️ Gérant</a>';
  }

  var userLink = '';
  if (isLogged()) {
    userLink = '<a href="#/compte" class="gold" title="' + esc(currentUser.name) + '" style="display:flex;align-items:center;gap:6px">' +
      '<span style="width:28px;height:28px;border-radius:14px;background:var(--surface-2);border:1px solid var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--accent)">' + esc(initials(currentUser.name)) + '</span>' +
      '<span class="ell" style="max-width:96px;font-size:13px;font-weight:600">' + esc(currentUser.name.split(' ')[0]) + '</span></a>';
  } else {
    userLink = '<a href="#/connexion" class="muted" title="Se connecter / Compte" style="display:flex;align-items:center;gap:6px;font-size:13px">' +
      icon('user') + '<span>Connexion</span></a>';
  }

  var themeBtn = '<button class="theme-btn" data-act="toggle-theme" title="Basculer thème clair/sombre" aria-label="Thème clair/sombre">' +
    themeSunMoonSvg() +
    '</button>';

  return '<header class="dh d-only"><div class="dw"><a class="logo lg-t" href="#/">' + esc(logo) + '</a><nav>' + nav.map(function (l) {
    var a = '<a href="' + l[1] + '" class="' + (active === l[0] ? 'on' : '') + '">' + esc(l[2]) + (l[3] ? icon('chev-down10') : '') + '</a>';
    return l[3] ? '<div class="dd">' + a + '<div class="ddm"><div>' + l[3].map(function (w) { return '<a href="' + clink(w) + '">' + esc(w.title) + '<small>' + refs(inCat(w).length) + '</small></a>'; }).join('') + '<a href="#/vins" class="all">Tous nos ' + esc(WP.label.toLowerCase()) + ' →</a></div></div></div>' : a;
  }).join('') + '</nav><div class="ra">' +
    '<a href="#/recherche" aria-label="Rechercher">' + icon('search') + '</a>' +
    '<a href="#/favoris" aria-label="Favoris">' + icon('heart20') + '</a>' +
    '<a href="#/panier" aria-label="Panier">' + icon('bag', 20) + (n ? '<span class="badge">' + n + '</span>' : '') + '</a>' +
    userLink +
    adminBtn +
    themeBtn +
    '</div></div></header>';
}

function dFooter() {
  var catLinks = '<a href="#/catalogue">Tout le catalogue</a>' + (HUB ? '<a href="#/vins">Tous nos ' + esc(WP.label.toLowerCase()) + '</a>' : '') + CATS.map(function (c) { return '<a href="' + clink(c) + '">' + esc(c.title) + '</a>'; }).join('');
  var adminFooterLink = isGerant() ? '<a href="#/admin" class="gold">' + icon('sliders', 13) + ' Espace Gérant</a>' : '';

  return '<footer class="df"><div class="dw"><div class="cols">' +
    '<div class="c1"><p class="lg lg-t">' + esc(logo) + '</p><p>' + esc(S.about || S.slogan) + '</p><div class="soc">' + socials() + '</div></div>' +
    '<div class="col"><h4>Boutique</h4><div>' + catLinks + '</div></div>' +
    '<div class="col"><h4>Services</h4><div><a href="#/club">' + esc(CLUB.name || 'Club Privé') + '</a><a href="#/services">Livraison & paiement</a><a href="#/journal">Le Journal</a><a href="#/suivi">Suivi de commande</a>' + adminFooterLink + '</div></div>' +
    '<div class="col"><h4>Aide</h4><div><a href="' + (isLogged() ? '#/compte' : '#/connexion') + '">Mon compte</a><a href="#/favoris">Mes favoris</a><a href="#/panier">Mon panier</a><a href="' + waLink('Bonjour, j\'ai une question.') + '" target="_blank" rel="noopener">Nous écrire</a></div></div>' +
    '<div class="col info"><h4>Nous trouver</h4><div><span>' + esc(S.address) + '<br>' + esc(S.neighbourhood) + ', ' + esc(S.city) + '</span><span>' + hoursHtml() + '</span><a href="' + telLink() + '">' + esc(S.phone) + '</a><a href="' + esc(S.mapsUrl) + '" target="_blank" rel="noopener" class="gold">Itinéraire Google Maps →</a></div></div>' +
    '</div><div class="bot"><p>© ' + new Date().getFullYear() + ' ' + esc(S.name) + ". L'abus d'alcool est dangereux pour la santé, à consommer avec modération. Vente interdite aux mineurs.</p><p>" + esc(S.neighbourhood) + ' · ' + esc(S.city) + ' · ' + esc(S.country || 'Bénin') + '</p></div></div></footer>';
}

function plink(p) { return '#/produit/' + encodeURIComponent(p.id); }
function pcard(p) {
  return '<article class="pc"><a class="img" href="' + plink(p) + '">' + pimg(p) + '</a><a class="meta" href="' + plink(p) + '"><p class="t ell">' + esc(p.name) + '</p><p class="s ell">' + esc(p.sub) + '</p></a>' +
    '<div class="pa"><p class="price">' + fmt(p.price) + '</p><button class="sq" data-act="add" data-id="' + esc(p.id) + '" aria-label="Ajouter au panier">' + icon('plus') + '</button></div></article>';
}
function dpcard(p, opts) {
  opts = opts || {};
  var f = isFav(p.id);
  return '<article class="dpc"><a class="img" href="' + plink(p) + '">' + pimg(p, !opts.portrait) + (opts.badge && p.lowStock ? '<span class="warn warnb">Bientôt en rupture</span>' : '') + '</a><a class="mg" href="' + plink(p) + '"><p class="t">' + esc(p.name) + '</p><p class="s">' + esc(p.sub) + '</p></a>' +
    '<div class="pa"><p class="price">' + fmt(p.price) + '</p><div class="acts"><button class="sq32' + (f ? ' on' : '') + '" data-act="fav" data-id="' + esc(p.id) + '" aria-label="Favori">' + icon('heart14') + '</button><button class="sq32 add" data-act="add" data-id="' + esc(p.id) + '" aria-label="Ajouter au panier">' + icon('plus') + '</button></div></div></article>';
}
function stars(n) { var s = ''; for (var i = 0; i < 5; i++) s += icon('star', 12); return '<div class="stars" aria-label="' + (n || 5) + ' sur 5">' + s + '</div>'; }

/* ---------- filtres ---------- */
function regions(all) { var c = {}; P.forEach(function (p) { if (p.region) c[p.region] = (c[p.region] || 0) + 1; }); var r = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }); F.regions.forEach(function (x) { if (r.indexOf(x) < 0) r.push(x); }); return all ? r : r.slice(0, 6).concat(r.slice(6).filter(function (x) { return F.regions.indexOf(x) >= 0; })); }
function years() { var y = []; P.forEach(function (p) { if (p.year && y.indexOf(p.year) < 0) y.push(p.year); }); return y.sort(function (a, b) { return b - a; }); }
var PAIRS = [['viande', 'Viande'], ['poisson', 'Poisson'], ['fromage', 'Fromage'], ['dessert', 'Dessert']];
function priceBounds() { var ps = P.map(function (p) { return p.price; }); var lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps); return [Math.floor(lo / 1000) * 1000, Math.ceil(hi / 1000) * 1000]; }
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function matchQ(p, q) { if (!q) return true; var h = norm([p.name, p.sub, p.region, p.year, (CAT[p.category] || {}).label, p.grapes, p.tier].join(' ')); return norm(q).split(/\s+/).every(function (w) { return h.indexOf(w) >= 0; }); }
function filtered(opt) {
  opt = opt || {};
  var b = priceBounds();
  var r = P.filter(function (p) {
    if (F.cats.length && F.cats.indexOf(p.category) < 0) return false;
    if (F.regions.length && F.regions.indexOf(p.region) < 0) return false;
    if (F.years.length && F.years.indexOf(p.year) < 0) return false;
    if (F.pairs.length && !(p.pairTags || []).some(function (t) { return F.pairs.indexOf(t) >= 0; })) return false;
    if (F.min != null && p.price < F.min) return false;
    if (F.max != null && F.max < b[1] && p.price > F.max) return false;
    if (!opt.noQ && !matchQ(p, F.q)) return false;
    return true;
  });
  return sortList(r);
}
function sortList(r) {
  var s = F.sort;
  r.sort(function (a, b2) {
    if (s === 'asc') return a.price - b2.price;
    if (s === 'desc') return b2.price - a.price;
    if (s === 'year') return (a.year || 9999) - (b2.year || 9999);
    return ((b2.featured ? 1 : 0) - (a.featured ? 1 : 0)) || a._i - b2._i;
  });
  return r;
}
function activeCount() { return F.cats.length + F.regions.length + F.years.length + F.pairs.length + (F.min != null || F.max != null ? 1 : 0); }
var SORTS = [['fav', 'Coups de cœur'], ['asc', 'Prix croissant'], ['desc', 'Prix décroissant'], ['year', 'Millésime']];
function sortLabel() { return (SORTS.filter(function (s) { return s[0] === F.sort; })[0] || SORTS[0])[1]; }
function resetFilters() { F.cats = []; F.regions = []; F.years = []; F.pairs = []; F.min = null; F.max = null; persist(); }
function toggleIn(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

/* =========================== DONNÉES COMPLÉMENTAIRES =========================== */
var CAVES_DATA = [
  { slug: 'la-feuille-de-vigne', name: 'La Feuille de Vigne (Votre Boutique)', lat: 6.3715, lng: 2.4280, neighbourhood: 'Saint-Michel', address: 'Bd Saint-Michel, face à l\'église, Gbedokpo', phone: '+229 01 21 32 10 98', whatsapp: '2290121321098', url: '#' },
  { slug: 'cave-sainte-aurelie', name: 'Cave Sainte Aurélie', lat: 6.3535, lng: 2.3385, neighbourhood: 'Fidjrossè', address: 'Route des pêches, carrefour Club des Rois, Togbin plage, Fidjrossè', phone: '+229 01 53 02 77 36', whatsapp: '2290195316910', url: '../cave-sainte-aurelie/' },
  { slug: 'la-belle-robe', name: 'La Belle Robe', lat: 6.3630, lng: 2.3920, neighbourhood: 'Vodjè', address: 'Rue 571, Vodjè (Plus Code 999W+P7)', phone: '+229 01 97 12 34 56', whatsapp: '2290197123456', url: '../la-belle-robe/' },
  { slug: 'la-cle-des-chateaux', name: 'La Clé des Châteaux', lat: 6.3601, lng: 2.4342, neighbourhood: 'Ganhi', address: 'Avenue Clozel, Ganhi & SOBEBRA Akpakpa', phone: '+229 01 21 31 45 67', whatsapp: '2290121314567', url: '../la-cle-des-chateaux/' },
  { slug: 'le-cellier', name: 'Le Cellier', lat: 6.3685, lng: 2.4490, neighbourhood: 'Akpakpa', address: 'Sodjèatimè, lot 110, Akpakpa', phone: '+229 01 95 44 33 22', whatsapp: '2290195443322', url: '../le-cellier/' },
  { slug: 'le-spiritueux', name: 'Le Spiritueux - Cave des Vins Rares', lat: 6.3760, lng: 2.4110, neighbourhood: 'Missitè', address: 'Missitè / Saint-Jean, carrefour Marina', phone: '+229 01 96 77 88 99', whatsapp: '2290196778899', url: '../le-spiritueux/' },
  { slug: 'le-vinophile', name: 'Le Vinophile', lat: 6.3705, lng: 2.4220, neighbourhood: 'Saint-Michel', address: 'Avenue Roi Guézo, Saint-Michel', phone: '+229 01 21 30 77 66', whatsapp: '2290121307766', url: '../le-vinophile/' },
  { slug: 'le-vinqueur', name: 'Le Vinqueur', lat: 6.3520, lng: 2.3650, neighbourhood: 'Fidjrossè', address: 'Fidjrossè plage, Fiyégnon', phone: '+229 01 97 55 66 77', whatsapp: '2290197556677', url: '../le-vinqueur/' },
  { slug: 'maison-castel-benin', name: 'Maison Castel Bénin', lat: 6.3575, lng: 2.4045, neighbourhood: 'Haie Vive', address: 'Pavés de la Haie Vive, 100 m avant le Calypso', phone: '+229 01 21 30 11 22', whatsapp: '2290121301122', url: '../maison-castel-benin/' },
  { slug: 'the-truth-winery', name: 'The Truth Winery', lat: 6.3690, lng: 2.4210, neighbourhood: 'Saint-Michel', address: 'Saint-Michel, Cotonou', phone: '+229 01 95 11 22 33', whatsapp: '2290195112233', url: '../the-truth-winery/' }
];

var OCCASIONS = [
  { id: 'anniversaire', title: 'Anniversaire & Célébrations', tag: 'Grands Crus', image: 'assets/img/banner-glasses.webp', desc: 'Magnums festifs, champagnes bruts et coffrets bois sur-mesure pour célébrer en beauté.', link: '#/categorie/champagnes', cta: 'Voir les champagnes' },
  { id: 'mariage', title: 'Mariages & Réceptions', tag: 'Sur-mesure', image: 'assets/img/event-dinner.webp', desc: 'Dégustation offerte, calcul des bouteilles selon votre menu, livraison sur place et reprise des non-ouverts.', link: waLink('Bonjour, je prépare une réception et j\'aimerais un devis personnalisé.'), cta: 'Devis WhatsApp', isExternal: true },
  { id: 'entreprise', title: 'Cadeaux d\'Entreprise', tag: 'B2B & Affaires', image: 'assets/img/banner-wood-box.webp', desc: 'Caisses bois d\'exception, message manuscrit offert, facturation société et livraison groupée.', link: giftLink(), cta: 'Composer un coffret' },
  { id: 'apero', title: 'Apéro Chic & Moments Partagés', tag: 'Fraîcheur', image: 'assets/img/banner-gift.webp', desc: 'Rosés de Provence, blancs minéraux et spiritueux choisis pour savourer entre amis.', link: '#/vins', cta: 'Nos vins d\'apéritif' }
];

var FAQ_DATA = [
  { q: 'Quels sont les délais et zones de livraison ?', a: 'Nous livrons dans toute la ville et ses environs en express sous 2 heures. Le retrait gratuit à la cave est préparé en 30 minutes.' },
  { q: 'Comment s\'effectue le paiement par Mobile Money ou à la livraison ?', a: 'Vous pouvez régler via Mobile Money (MTN MoMo, Moov Money, Celtiis Cash) ou en espèces à la livraison sans frais additionnels.' },
  { q: 'Comment garantissez-vous la conservation des bouteilles ?', a: 'Toutes les bouteilles sont entreposées dans notre cave climatisée à température constante (14°C – 16°C). Pendant la livraison, elles voyagent dans des caissons isothermes.' },
  { q: 'Est-il possible de faire livrer un coffret cadeau avec un mot personnalisé ?', a: 'Oui, sans surcoût ! Cochez simplement « Ceci est un cadeau » au moment de votre commande. Nous joignons une carte manuscrite avec vos mots.' },
  { q: 'Proposez-vous des tarifs dégressifs et la reprise pour les mariages ?', a: 'Oui. Pour les grandes réceptions, notre sommelier établit un devis optimisé selon vos plats. Nous reprenons toutes les bouteilles non débouchées après l\'événement.' },
  { q: 'Que se passe-t-il si une bouteille présente un défaut (goût de bouchon) ?', a: 'Votre satisfaction est garantie : si un flacon présente un goût de bouchon, signalez-le nous avec une photo ou passez à la cave pour un échange immédiat.' }
];

var REVIEWS_DATA = [
  { name: 'Dr. Marc A.', city: 'Quartier Central', stars: 5, date: 'Il y a 3 jours', text: 'Commande passée en soirée pour un dîner improvisé. Livrée en 40 minutes, bouteilles parfaitement fraîches. Paiement MoMo instantané. Service irréprochable !', bottle: 'Champagne Brut Tradition' },
  { name: 'Sandrine K.', city: 'Zone Résidentielle', stars: 5, date: 'Il y a 1 semaine', text: 'J’ai fait livrer un coffret prestige bois avec message personnalisé pour un anniversaire d’entreprise. Soigné et élégant, le vin a fait l’unanimité.', bottle: 'Coffret Prestige Bois' },
  { name: 'Cédric D.', city: 'Zone Littorale', stars: 5, date: 'Il y a 2 semaines', text: 'Conservation exemplaire : les bouteilles sont stockées à température idéale, les conseils sur WhatsApp sont réactifs et précis. Une vraie référence.', bottle: 'Cuvée Prestige Médoc 2016' }
];

/* --- Générateurs de composants d'accueil --- */
function trustBar(mode) {
  var isD = mode === 'd';
  var items = [
    { ic: '⚡', t: 'Livraison Express 2 h', d: 'Bouteilles fraîches & calées dans tout Cotonou' },
    { ic: '📱', t: 'Paiement MoMo & Cash', d: 'MTN, Moov, Celtiis ou à la livraison' },
    { ic: '🍷', t: '100% Authentique', d: 'Conservation idéale en cave climatisée' },
    { ic: '👨‍🍳', t: 'Conseil Sommelier 7j/7', d: 'Réponse rapide sur WhatsApp' }
  ];
  return '<section class="trust-bar" aria-label="Nos garanties">' +
    '<div class="' + (isD ? 'dw ' : '') + 'trust-grid">' +
    items.map(function (it) {
      return '<div class="trust-item"><div class="trust-icon">' + it.ic + '</div><div class="trust-text"><h4>' + esc(it.t) + '</h4><p>' + esc(it.d) + '</p></div></div>';
    }).join('') +
    '</div></section>';
}

function homeHighlights(mode) {
  var isD = mode === 'd';
  var bestsellers = P.filter(function (p) { return p.featured; });
  if (bestsellers.length < 4) bestsellers = P.slice(0, 4);
  var news = P.filter(function (p) { return p.year && p.year >= 2019 && !p.featured; });
  if (news.length < 4) news = P.slice(4, 8);
  var activeList = hlTab === 'bestsellers' ? bestsellers : news;
  var items = isD ? activeList.slice(0, 4).map(function (p) { return dpcard(p); }).join('') : activeList.slice(0, 4).map(pcard).join('');
  
  return '<section class="home-highlights ' + (isD ? 'dw' : 'sec') + '">' +
    '<div class="hl-header">' +
    '<div><h2 class="' + (isD ? 'dh2' : 'sec-h') + '">Sélection du Moment</h2><p class="muted" style="font-size:13px;margin:4px 0 0">Nos meilleures références et derniers arrivages</p></div>' +
    '<div class="hl-tabs">' +
    '<button class="hl-tab' + (hlTab === 'bestsellers' ? ' on' : '') + '" data-act="hl-tab" data-v="bestsellers">🏆 Meilleures Ventes <span class="badge">' + bestsellers.length + '</span></button>' +
    '<button class="hl-tab' + (hlTab === 'new' ? ' on' : '') + '" data-act="hl-tab" data-v="new">✨ Nouveautés <span class="badge">' + news.length + '</span></button>' +
    '</div></div>' +
    '<div class="hl-grid">' + items + '</div>' +
    '<div style="text-align:center;margin-top:24px"><a class="' + (isD ? 'dbtn o' : 'btn btn-o') + '" href="#/catalogue" style="display:inline-flex;width:auto">Explorer toute la collection (' + P.length + ' flacons) →</a></div>' +
    '</section>';
}

function occasionsHtml(mode) {
  var isD = mode === 'd';
  return '<section class="occasions-sec ' + (isD ? 'dw' : 'sec') + '">' +
    '<div class="sec-h" style="margin-bottom:20px"><h2 class="' + (isD ? 'dh2' : '') + '">Des Idées par Occasion</h2><a href="#/catalogue">Tout voir</a></div>' +
    '<div class="occ-grid">' +
    OCCASIONS.map(function (o) {
      return '<a class="occ-card" href="' + esc(o.link) + '"' + (o.isExternal ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<img class="occ-bg" src="' + esc(o.image) + '" alt="' + esc(o.title) + '" loading="lazy" decoding="async">' +
        '<div class="occ-overlay"></div>' +
        '<div class="occ-content">' +
        '<span class="occ-tag">' + esc(o.tag) + '</span>' +
        '<h3 class="occ-title">' + esc(o.title) + '</h3>' +
        '<p class="occ-desc">' + esc(o.desc) + '</p>' +
        '<span class="occ-cta">' + esc(o.cta) + ' <span>→</span></span>' +
        '</div></a>';
    }).join('') +
    '</div></section>';
}

function sommelierAdviceHtml(mode) {
  var isD = mode === 'd';
  var waAdviceLink = waLink('Bonjour ' + S.name + ', j\'aimerais un conseil personnalisé du sommelier pour un repas / un événement.');
  return '<section class="sommelier-sec ' + (isD ? 'dw' : 'sec') + '">' +
    '<div class="sommelier-card">' +
    '<div class="sommelier-avatar-wrap">' +
    '<div class="sommelier-avatar"><img src="' + esc(IMG.avatar || 'assets/img/avatar.webp') + '" alt="Sommelier de la cave" loading="lazy"></div>' +
    '<div class="sommelier-info"><h4>Le Sommelier</h4><p>' + esc(S.name) + '</p></div>' +
    '</div>' +
    '<div class="sommelier-quote">' +
    '<span class="sommelier-quote-mark" aria-hidden="true">“</span>' +
    '<div class="sommelier-badge">' + icon('award', 14) + 'Conseil du Sommelier</div>' +
    '<h3>Comment bien servir et savourer nos vins à Cotonou ?</h3>' +
    '<p class="sommelier-text">« Sous le climat chaud de Cotonou, ne laissez jamais un vin rouge monter à température ambiante (28°-32°C). Passez-le 20 minutes au frais avant dégustation : à 16°-18°C, il révélera ses tanins soyeux sans sensation de lourdeur. Pour un poisson braisé ou un poulet bicyclette local, privilégiez un blanc vif comme notre Sancerre ou un rosé frais. »</p>' +
    '<div class="sommelier-actions">' +
    '<a class="sommelier-wa-btn" href="' + waAdviceLink + '" target="_blank" rel="noopener">' + icon('whatsapp', 16) + 'Demander conseil sur WhatsApp</a>' +
    '<a class="' + (isD ? 'dbtn o' : 'btn btn-o') + '" href="#/journal" style="width:auto">Lire nos accords mets &amp; vins</a>' +
    '</div></div></div></section>';
}

function statsCountersHtml(mode) {
  var isD = mode === 'd';
  var stats = [
    { target: 350, prefix: '+', suffix: '', label: 'Références en cave', sub: 'Vins, champagnes & spiritueux' },
    { target: 2, prefix: '', suffix: ' h', label: 'Livraison express', sub: 'Partout dans Cotonou & environs' },
    { target: 99, prefix: '', suffix: '.4%', label: 'Clients satisfaits', sub: 'Commandes vérifiées' },
    { target: 100, prefix: '', suffix: '%', label: 'Flacons certifiés', sub: 'Conservation climatisée' }
  ];
  return '<section class="stats-sec ' + (isD ? 'dw' : 'sec') + '">' +
    '<div class="stats-grid">' +
    stats.map(function (s) {
      return '<div class="stat-item">' +
        '<div class="stat-number" data-counter="' + s.target + '" data-prefix="' + s.prefix + '" data-suffix="' + s.suffix + '">' + s.prefix + s.target + s.suffix + '</div>' +
        '<div class="stat-label">' + esc(s.label) + '</div>' +
        '<div class="stat-sub">' + esc(s.sub) + '</div>' +
        '</div>';
    }).join('') +
    '</div></section>';
}

function interactiveMapSection(mode) {
  var isD = mode === 'd';
  var cur = CAVES_DATA.filter(function (c) { return c.slug === S.slug; })[0] || CAVES_DATA[0];
  var itLink = S.mapsUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(S.name + ' ' + (S.neighbourhood || '') + ' Cotonou'));
  var waDirect = waLink('Bonjour ' + S.name + ', je prépare mon passage à la cave.');
  
  return '<section id="carte-section" class="map-section ' + (isD ? 'dw' : 'sec') + '">' +
    '<div class="map-card-wrapper">' +
    '<div class="map-bar">' +
    '<h3>' + icon('pin', 18, 'c-accent') + ' Emplacement &amp; Itinéraire</h3>' +
    '<div class="map-filter-btns">' +
    '<button class="map-pill' + (mapFilter === 'current' ? ' on' : '') + '" data-act="map-filter" data-v="current">📍 ' + esc(S.name) + '</button>' +
    '<button class="map-pill' + (mapFilter === 'all' ? ' on' : '') + '" data-act="map-filter" data-v="all">🗺️ Tous les points &amp; caves (' + CAVES_DATA.length + ')</button>' +
    '</div></div>' +
    '<div class="map-container-outer">' +
    '<div class="map-viewport">' +
    '<div id="cave-leaflet-map">' + mapSvg() + '</div>' +
    '</div>' +
    '<div class="map-info-side">' +
    '<div class="map-info-meta">' +
    '<span class="gold" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Cave &amp; Dégustation</span>' +
    '<h4>' + esc(S.name) + '</h4>' +
    '<div class="map-addr-row">' + icon('pin', 16, 'c-accent') + '<div><b>' + esc(S.neighbourhood || '') + ', ' + esc(S.city || 'Cotonou') + '</b><br>' + esc(S.address || '') + '</div></div>' +
    '<div class="map-hours-box">' +
    '<div class="cur-status">Ouvert aujourd\'hui</div>' +
    hoursHtml() +
    '</div>' +
    '</div>' +
    '<div class="map-actions-group">' +
    '<a class="map-btn-it" href="' + esc(itLink) + '" target="_blank" rel="noopener">' + icon('pin', 14) + 'Itinéraire Maps</a>' +
    '<a class="map-btn-wa" href="' + waDirect + '" target="_blank" rel="noopener">' + icon('whatsapp', 16) + 'WhatsApp</a>' +
    '<a class="map-btn-tel" href="' + telLink() + '">' + icon('phone', 14) + esc(S.phone || 'Appeler la cave') + '</a>' +
    '</div></div></div></div></section>';
}

function reviewsHtml(mode) {
  var isD = mode === 'd';
  return '<section class="reviews-sec ' + (isD ? 'dw' : 'sec') + '">' +
    '<div class="sec-h" style="margin-bottom:18px;display:flex;align-items:center;justify-content:space-between">' +
    '<div><h2 class="' + (isD ? 'dh2' : '') + '">Avis de nos Amateurs</h2><span class="gold" style="font-size:12.5px;font-weight:600">★ 4.9/5 sur plus de 180 avis vérifiés</span></div>' +
    (!isD ? '<div class="rev-arrows m-only">' +
      '<button class="rev-ar-btn" data-act="rev-prev" aria-label="Avis précédent">←</button>' +
      '<button class="rev-ar-btn" data-act="rev-next" aria-label="Avis suivant">→</button>' +
      '</div>' : '') +
    '</div>' +
    '<div class="reviews-carousel-wrap">' +
    '<div class="reviews-grid" id="reviewsGrid">' +
    REVIEWS_DATA.map(function (r) {
      return '<div class="rev-card">' +
        '<div>' +
        '<div class="rev-stars">★★★★★</div>' +
        '<p class="rev-text">“' + esc(r.text) + '”</p>' +
        '</div>' +
        '<div class="rev-footer">' +
        '<div class="rev-avatar">' + initials(r.name) + '</div>' +
        '<div class="rev-client"><h5>' + esc(r.name) + '</h5><span>' + esc(r.city) + ' · ' + esc(r.date) + '</span></div>' +
        '<div class="rev-badge">' + icon('check', 10) + ' ' + esc(r.bottle) + '</div>' +
        '</div></div>';
    }).join('') +
    '</div>' +
    (!isD ? '<div class="rev-dots" id="revDots">' + REVIEWS_DATA.map(function (_, i) { return '<span class="rev-dot' + (i === 0 ? ' on' : '') + '"></span>'; }).join('') + '</div>' : '') +
    '</div></section>';
}

function faqHtml(mode) {
  var isD = mode === 'd';
  return '<section class="faq-sec ' + (isD ? 'dw' : 'sec') + '">' +
    '<div class="sec-h" style="margin-bottom:20px"><h2 class="' + (isD ? 'dh2' : '') + '">Questions Fréquentes (FAQ)</h2><a href="' + waLink('Bonjour, j\'ai une question qui n\'est pas dans la FAQ.') + '" target="_blank" rel="noopener">Poser une question</a></div>' +
    '<div class="faq-list">' +
    FAQ_DATA.map(function (item, idx) {
      var isOpen = !!faqOpen[idx];
      return '<div class="faq-item' + (isOpen ? ' open' : '') + '">' +
        '<button class="faq-question" data-act="faq-tog" data-i="' + idx + '" aria-expanded="' + isOpen + '">' +
        '<span>' + esc(item.q) + '</span>' +
        '<span class="faq-ic">' + icon('chev-down12') + '</span>' +
        '</button>' +
        '<div class="faq-answer"><p>' + esc(item.a) + '</p></div>' +
        '</div>';
    }).join('') +
    '</div></section>';
}

function floatingWhatsappHtml() {
  var dismissed = false;
  try { dismissed = sessionStorage.getItem('wa_bubble_closed') === '1'; } catch (e) {}
  return '<aside class="floating-wa" aria-label="Assistance WhatsApp">' +
    '<div class="fwa-bubble' + (dismissed ? ' fwa-hidden' : '') + '" id="fwaBubble">' +
    '<button class="fwa-close" data-act="fwa-dismiss" aria-label="Fermer la bulle">&times;</button>' +
    '<div class="fwa-text">' +
    '<strong>Conseil Sommelier Direct</strong>' +
    '<p>Une question sur un flacon ou une livraison ? Discutez en direct.</p>' +
    '</div></div>' +
    '<a class="fwa-btn" href="' + waLink('Bonjour ' + S.name + ', j\'aimerais un conseil sur vos vins.') + '" target="_blank" rel="noopener" aria-label="Discuter sur WhatsApp">' +
    '<span class="fwa-pulse"></span>' +
    icon('whatsapp', 26) +
    '</a></aside>';
}

/* =========================== vues =========================== */
var V = {};
var H = S.hero || {};

/* ---- Accueil enrichi ---- */
V.home = function () {
  var mcats = CATS.filter(function (c) { return c.mobileHome !== false; });
  var m = statusbar() +
    '<header class="sh">' +
    '<a href="#/" class="slot-logo lg-t" style="font-family:var(--serif);font-weight:700;font-size:16px;text-transform:uppercase;color:var(--text);letter-spacing:.03em;display:flex;align-items:center;gap:6px">' +
    '<span style="font-size:18px">🍷</span> ' + esc(logo) + '</a>' +
    menuBtn() + '</header>' +
    '<div class="v home">' +
    carousel('m') +
    trustBar('m') +
    homeHighlights('m') +
    '<nav class="cats" aria-label="Catégories">' + mcats.map(function (c) { return '<a href="' + clink(c) + '"><span class="iw">' + icon(c.icon || 'wine') + '</span>' + esc(c.label) + '</a>'; }).join('') + '</nav>' +
    occasionsHtml('m') +
    sommelierAdviceHtml('m') +
    statsCountersHtml('m') +
    interactiveMapSection('m') +
    reviewsHtml('m') +
    faqHtml('m') +
    '</div>';

  var d = carousel('d') +
    trustBar('d') +
    homeHighlights('d') +
    '<section class="dw dsec"><h2 class="dh2">Explorez ' + esc(S.name) + '</h2><div class="dgrid g6">' + CATS.map(function (c) { return '<a class="dcat" href="' + clink(c) + '"><span class="iw">' + icon(c.iconDesktop || c.icon, 24) + '</span>' + esc(c.labelLong || c.label) + '</a>'; }).join('') + '</div></section>' +
    occasionsHtml('d') +
    sommelierAdviceHtml('d') +
    statsCountersHtml('d') +
    interactiveMapSection('d') +
    reviewsHtml('d') +
    faqHtml('d') +
    '<section class="dnews"><div class="dw"><h2 class="dh2">' + esc(T.newsTitle) + '</h2><p>' + esc(T.newsText) + '</p><form data-form="news"><input type="tel" name="tel" placeholder="Votre numéro WhatsApp" aria-label="Numéro WhatsApp"><button type="submit">S\'abonner</button></form></div></section>';
  return { m: m, d: d, nav: 'home', dnav: '' };
};

/* ---- Catalogue ---- */
function catFromQuery(q) {
  if (q.f) return; /* retour depuis l'écran Filtres : on garde les filtres */
  resetFilters(); F.q = ''; shown = 6; /* "Boutique" = tout le catalogue */
  if (q.q != null) F.q = q.q;
  persist();
}
function catTitle() {
  if (F.cats.length === 1) return CAT[F.cats[0]].labelLong || CAT[F.cats[0]].label;
  if (F.cats.length > 1 && F.cats.every(function (c) { return CAT[c].group === 'vins'; })) return 'Nos Vins';
  return T.catalogueIntroTitle;
}
function mGrid(list) { return list.length ? '<div class="grid2" id="mgrid">' + list.map(pcard).join('') + '</div>' : '<div class="empty" id="mgrid"><h3>Aucun flacon trouvé</h3><p>Essayez une autre recherche ou réinitialisez les filtres.</p><button class="btn btn-o" style="width:auto" data-act="reset">Réinitialiser</button></div>'; }
var appliedHash = null;
V.catalogue = function (args, q) {
  if (q.cat && CAT[q.cat]) { location.replace(clink(CAT[q.cat])); return { m: '', d: '' }; }
  if (q.group === 'vins' && HUB) { location.replace('#/vins'); return { m: '', d: '' }; }
  if (location.hash !== appliedHash && parse().key === 'catalogue') { appliedHash = location.hash; catFromQuery(q); }
  var list = filtered(), ac = activeCount();
  var chips = [['Type', F.cats.length], ['Région', F.regions.length], ['Millésime', F.years.length], ['Prix', F.min != null || F.max != null]];
  var m = statusbar() + mh(T.catalogueTitle, null) +
    '<div class="v cat"><label class="searchbox">' + icon('search18') + '<input type="search" data-in="q" value="' + esc(F.q) + '" placeholder="' + esc(T.searchPh) + '" aria-label="Rechercher"></label>' +
    '<div class="fchips">' + chips.map(function (c) { return '<a class="chip' + (c[1] ? ' on' : '') + '" href="#/filtres">' + c[0] + icon('chev-down10') + '</a>'; }).join('') + (ac ? '<button class="chip" data-act="reset">Effacer ' + icon('x-circle') + '</button>' : '') + '</div>' +
    '<div class="sortrow"><span class="cnt" id="mcount">' + list.length + ' référence' + (list.length > 1 ? 's' : '') + ' trouvée' + (list.length > 1 ? 's' : '') + '</span><button data-act="sort">Trier par : ' + esc(sortLabel()) + icon('chev-down12') + '</button></div>' +
    mGrid(list) + '</div>';
  var pills = [];
  F.cats.forEach(function (c) { pills.push(['cats', c, 'Type : ' + CAT[c].label]); });
  F.regions.forEach(function (r) { pills.push(['regions', r, 'Région : ' + r]); });
  F.years.forEach(function (y) { pills.push(['years', y, 'Millésime : ' + y]); });
  F.pairs.forEach(function (y) { pills.push(['pairs', y, 'Accord : ' + y]); });
  if (F.min != null || F.max != null) pills.push(['price', '', 'Prix : ' + fmt(F.min || priceBounds()[0]) + ' – ' + fmt(F.max || priceBounds()[1])]);
  var page = list.slice(0, shown);
  var d = '<section class="dintro"><div class="dw"><h1>' + esc(catTitle()) + '</h1><p>' + esc(T.catalogueIntro) + '</p></div></section>' +
    '<section class="dfbar"><div class="dw"><div class="l"><button class="fp" data-act="dpanel">' + icon('sliders') + 'Filtrer' + (ac ? ' (' + ac + ')' : '') + '</button><div class="pills">' + pills.map(function (p) { return '<button class="pill2" data-act="unpill" data-k="' + p[0] + '" data-v="' + esc(p[1]) + '">' + esc(p[2]) + icon('x-circle') + '</button>'; }).join('') + '</div></div>' +
    '<label class="sort"><span>Trier par :</span><select data-in="sort" aria-label="Trier">' + SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (F.sort === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>' + icon('chev-down10') + '</label></div></section>' +
    '<section class="dpanel' + (dPanel ? ' open' : '') + '"><div class="dw">' + filterGroups('d') + '</div></section>' +
    '<section class="dprod"><div class="dw">' + (page.length ? '<div class="dgrid g3">' + page.map(function (p) { return dpcard(p); }).join('') + '</div>' : '<div class="empty"><h3>Aucun flacon trouvé</h3><button class="dbtn g" data-act="reset">Réinitialiser les filtres</button></div>') +
    '<div class="dpag">' + (list.length > shown ? '<button class="dbtn g" data-act="more">Afficher ' + Math.min(6, list.length - shown) + ' autres flacons</button>' : '') + '<small>Affichage de ' + page.length + ' sur ' + list.length + ' flacons</small></div></div></section>';
  return { m: m, d: d, nav: 'cave', dnav: 'shop' };
};
function filterGroups(mode) {
  var b = priceBounds();
  var chip = function (k, v, label, cls) { var on = F[k].indexOf(v) >= 0; return '<button class="fchip' + (cls ? ' ' + cls : '') + (on ? ' on' : '') + '" data-act="ftog" data-k="' + k + '" data-v="' + esc(v) + '">' + esc(label) + '</button>'; };
  if (mode === 'd') {
    return '<div><h4>Type</h4><div class="wrapc">' + CATS.map(function (c) { return chip('cats', c.id, c.label); }).join('') + '</div></div>' +
      '<div><h4>Région</h4><div class="wrapc">' + regions().map(function (r) { return chip('regions', r, r, 'sm'); }).join('') + '</div></div>' +
      '<div><h4>Millésime</h4><div class="wrapc">' + years().map(function (y) { return chip('years', y, y, 'sm'); }).join('') + '</div></div>' +
      '<div><h4>Accords mets-vins</h4><div class="wrapc">' + PAIRS.map(function (p) { return chip('pairs', p[0], p[1], 'sm'); }).join('') + '</div></div>';
  }
  var lo = F.min != null ? F.min : b[0], hi = F.max != null ? F.max : b[1];
  var pl = (lo - b[0]) / (b[1] - b[0]) * 100, pr = (hi - b[0]) / (b[1] - b[0]) * 100;
  return '<section class="fsec"><p class="lbl11">Type de vin</p><div class="wrapc">' + CATS.map(function (c) { return chip('cats', c.id, c.label); }).join('') + '</div></section>' +
    '<section class="fsec"><p class="lbl11">Régions</p><div>' + regions().map(function (r) { var on = F.regions.indexOf(r) >= 0; return '<button class="chk' + (on ? ' on' : '') + '" data-act="ftog" data-k="regions" data-v="' + esc(r) + '"><i>' + icon('check') + '</i>' + esc(r) + '</button>'; }).join('') + '</div></section>' +
    '<section class="fsec"><div style="display:flex;justify-content:space-between;align-items:center"><p class="lbl11">Prix</p><b class="gold" style="font-size:13px" id="prlab">' + fmt(lo) + ' - ' + fmt(hi) + '</b></div>' +
    '<div class="range"><div class="tr"></div><div class="fill" id="prfill" style="left:' + pl + '%;right:' + (100 - pr) + '%"></div><input type="range" min="' + b[0] + '" max="' + b[1] + '" step="500" value="' + lo + '" data-in="min" aria-label="Prix minimum"><input type="range" min="' + b[0] + '" max="' + b[1] + '" step="500" value="' + hi + '" data-in="max" aria-label="Prix maximum"></div><div class="rlab"><span>' + fmt(b[0]) + '</span><span>' + fmt(b[1]) + '</span></div></section>' +
    '<section class="fsec"><p class="lbl11">Millésimes</p><div class="years">' + years().map(function (y) { return chip('years', y, y, 'sm'); }).join('') + '</div></section>' +
    '<section class="fsec"><p class="lbl11">Accords mets-vins</p><div class="wrapc">' + PAIRS.map(function (p) { return chip('pairs', p[0], p[1], 'sm pair'); }).join('') + '</div></section>';
}
V.filtres = function () {
  var n = filtered().length;
  var m = statusbar() + mh('Filtres', '<a class="slot" href="#/catalogue?f=1" aria-label="Fermer">' + icon('x20') + '</a>', '') +
    '<div class="v flt">' + filterGroups('m') + '</div>' +
    '<div class="ffoot"><div class="in"><button class="u" data-act="reset">Réinitialiser</button><a class="btn btn-f" href="#/catalogue?f=1" id="fcount">Voir ' + n + ' résultat' + (n > 1 ? 's' : '') + '</a></div></div>';
  dPanel = true;
  return { m: m, d: V.catalogue({}, {}).d, nav: 'cave', noNav: true, dnav: 'shop' };
};


/* =========================== carrousel d'accueil ===========================
   hero.slides : [{image, imageMobile, eyebrow, title, subtitle, cta, link}] ; link = "#/..." ou "cat:<id>" */
var SLIDES = ((H.slides && H.slides.length) ? H.slides : [{ image: IMG.heroDesktop, imageMobile: IMG.heroMobile, eyebrow: H.kicker, title: H.titleDesktop || H.title, subtitle: H.textDesktop || H.text, cta: H.cta, link: '#/catalogue' }]).filter(function (x) { return x && (x.image || x.imageMobile); });
function slideLink(l) { if (l && l.indexOf('cat:') === 0) { var c = CAT[l.slice(4)]; return c ? clink(c) : '#/catalogue'; } return l || '#/catalogue'; }
var CAR_MS = Math.max(4000, +(H.interval || 5500));
var carIdx = 0, carPausedByUser = false;
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function carousel(mode) {
  var n = SLIDES.length, isD = mode === 'd';
  var slides = SLIDES.map(function (sl, i) {
    var dsk = sl.image || sl.imageMobile, mob = isD ? dsk : (sl.imageMobile || sl.image);
    var on = i === carIdx, first = i === 0;
    /* 1re image chargée tout de suite, les autres à la demande (data-src) */
    var img = (on || first) ? '<img src="' + esc(mob) + '" alt="" ' + (first ? 'fetchpriority="high" ' : '') + 'decoding="async">' : '<img data-src="' + esc(mob) + '" alt="" decoding="async">';
    var tag = first ? (isD ? 'h1' : 'h2') : (isD ? 'h2' : 'h3');
    return '<article class="car-s' + (on ? ' is-on' : '') + '" role="group" aria-roledescription="diapositive" aria-label="' + (i + 1) + ' sur ' + n + '"' + (on ? '' : ' aria-hidden="true"') + ' data-i="' + i + '">' +
      '<div class="car-bg">' + img + '</div>' +
      '<div class="car-tx' + (isD ? ' dw' : '') + '"><div class="in">' + (sl.eyebrow ? '<p class="k">' + esc(sl.eyebrow) + '</p>' : '') + '<' + tag + ' class="t">' + esc(sl.title || '') + '</' + tag + '>' + (sl.subtitle ? '<p class="s">' + esc(sl.subtitle) + '</p>' : '') +
      (sl.cta ? '<a class="' + (isD ? 'dbtn o' : 'btn btn-o') + ' car-cta" href="' + esc(slideLink(sl.link)) + '"' + (on ? '' : ' tabindex="-1"') + '>' + esc(sl.cta) + '</a>' : '') + '</div></div></article>';
  }).join('');
  var ind = n > 1 ? '<div class="car-ind" role="tablist" aria-label="Choisir une diapositive">' + SLIDES.map(function (sl, i) {
    return '<button role="tab" data-car-go="' + i + '" aria-label="Diapositive ' + (i + 1) + ' : ' + esc(sl.title || '') + '" aria-selected="' + (i === carIdx) + '"' + (i === carIdx ? ' class="on"' : '') + '><i></i></button>';
  }).join('') + '</div>' : '';
  var ctl = n > 1 ? '<div class="car-ctl">' + ind + '<span class="car-num" aria-hidden="true"><b>' + ('0' + (carIdx + 1)).slice(-2) + '</b> / ' + ('0' + n).slice(-2) + '</span>' +
    '<button class="car-pp" data-car-pp aria-label="' + (carPausedByUser || reduceMotion ? 'Lancer le défilement' : 'Mettre en pause le défilement') + '">' + (carPausedByUser || reduceMotion ? '▶' : '❚❚') + '</button>' +
    (isD ? '<button class="car-ar" data-car-step="-1" aria-label="Diapositive précédente">' + icon('chev-left') + '</button><button class="car-ar" data-car-step="1" aria-label="Diapositive suivante">' + icon('chev-right') + '</button>' : '') + '</div>' : '';
  return '<section class="car car-' + mode + (carPausedByUser || reduceMotion ? ' paused' : '') + '" data-car tabindex="0" aria-roledescription="carrousel" aria-label="À la une" style="--car-ms:' + CAR_MS + 'ms">' +
    '<div class="car-vp" aria-live="' + (carPausedByUser || reduceMotion ? 'polite' : 'off') + '">' + slides + '</div>' + (isD ? '<div class="car-ctlw dw">' + ctl + '</div>' : ctl) + '</section>';
}
function carEls() { return [].slice.call(document.querySelectorAll('[data-car]')); }
function carLoad(el, i) { var im = el.querySelector('.car-s[data-i="' + i + '"] img[data-src]'); if (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); } }
function carShow(i) {
  var n = SLIDES.length; if (n < 2) return;
  carIdx = (i + n) % n;
  carEls().forEach(function (el) {
    carLoad(el, carIdx); carLoad(el, (carIdx + 1) % n);
    el.querySelectorAll('.car-s').forEach(function (s2, k) {
      var on = k === carIdx; s2.classList.toggle('is-on', on);
      if (on) s2.removeAttribute('aria-hidden'); else s2.setAttribute('aria-hidden', 'true');
      var a = s2.querySelector('.car-cta'); if (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); }
    });
    el.querySelectorAll('[data-car-go]').forEach(function (b, k) {
      var on = k === carIdx; b.setAttribute('aria-selected', on);
      b.classList.remove('on'); if (on) { void b.offsetWidth; b.classList.add('on'); } /* relance la barre de progression */
    });
    var num = el.querySelector('.car-num b'); if (num) num.textContent = ('0' + (carIdx + 1)).slice(-2);
  });
}
function carPauseState() {
  carEls().forEach(function (el) {
    var p = carPausedByUser || reduceMotion || el._hover || el._touch || el._focus || document.hidden;
    el.classList.toggle('paused', !!p);
    var vp = el.querySelector('.car-vp'); if (vp) vp.setAttribute('aria-live', carPausedByUser || reduceMotion ? 'polite' : 'off');
    var pp = el.querySelector('[data-car-pp]'); if (pp) { var stopped = carPausedByUser || reduceMotion; pp.textContent = stopped ? '▶' : '❚❚'; pp.setAttribute('aria-label', stopped ? 'Lancer le défilement' : 'Mettre en pause le défilement'); }
  });
}
function initCarousels() {
  carEls().forEach(function (el) {
    var n = SLIDES.length;
    carLoad(el, (carIdx + 1) % n);
    /* l'avance automatique suit la fin de l'animation de la barre active (donc se met en pause avec elle) */
    el.addEventListener('animationend', function (e) { if (e.animationName === 'carfill' && el.offsetParent !== null && !el.classList.contains('paused')) carShow(carIdx + 1); });
    el.addEventListener('mouseenter', function () { el._hover = true; carPauseState(); });
    el.addEventListener('mouseleave', function () { el._hover = false; carPauseState(); });
    el.addEventListener('focusin', function () { el._focus = true; carPauseState(); });
    el.addEventListener('focusout', function () { el._focus = false; carPauseState(); });
    var x0 = null, y0 = null;
    el.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; el._touch = true; carPauseState(); }, { passive: true });
    el.addEventListener('touchend', function (e) {
      el._touch = false;
      if (x0 != null) { var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) carShow(carIdx + (dx < 0 ? 1 : -1)); }
      x0 = null; carPauseState();
    }, { passive: true });
    el.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); carShow(carIdx + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); carShow(carIdx - 1); } });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-car-go],[data-car-step],[data-car-pp]'); if (!b) return;
      if (b.hasAttribute('data-car-go')) carShow(+b.getAttribute('data-car-go'));
      else if (b.hasAttribute('data-car-step')) carShow(carIdx + (+b.getAttribute('data-car-step')));
      else { carPausedByUser = !carPausedByUser; carPauseState(); }
    });
  });
  carPauseState();
}
document.addEventListener('visibilitychange', carPauseState);

/* ---- Pages catégorie (#/categorie/<slug>) ---- */
var catState = { slug: null, region: '', shown: 8 };
function sortSelect() { return '<label class="sort"><span>Trier par :</span><select data-in="sort" aria-label="Trier">' + SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (F.sort === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>' + icon('chev-down10') + '</label>'; }
function catHeroM(img, kicker, title, desc, count) {
  return '<section class="chero"><div class="bg">' + (img && img !== 'svg' ? imgTag(img, title, true) : '') + '</div><div class="meta"><p class="k">' + esc(kicker) + '</p><h2>' + esc(title) + '</h2>' + (desc ? '<p>' + esc(desc) + '</p>' : '') + '<span class="cn">' + esc(count) + '</span></div></section>';
}
function catHeroD(crumbs, img, kicker, title, desc, count, cta) {
  return '<nav class="dbc"><div class="dw">' + crumbs + '</div></nav><section class="dcath"><div class="dw"><div class="tx"><p class="k">' + esc(kicker) + '</p><h1>' + esc(title) + '</h1>' + (desc ? '<p>' + esc(desc) + '</p>' : '') +
    '<div class="mt"><span class="cn">' + esc(count) + '</span>' + (cta || '') + '</div></div><div class="im">' + (img && img !== 'svg' ? imgTag(img, title, true) : '') + '</div></div></section>';
}
function otherCats(cur, mode) {
  var o = CATS.filter(function (c) { return c !== cur; });
  if (mode === 'm') return '<section class="sec ocats"><div class="sec-h"><h3>Autres catégories</h3><a href="#/catalogue">Tout voir</a></div><div class="ocl">' + o.map(function (c) { return '<a href="' + clink(c) + '"><span class="iw">' + icon(c.icon || 'wine') + '</span><b>' + esc(c.title) + '</b><small>' + refs(inCat(c).length) + '</small></a>'; }).join('') + '</div></section>';
  return '<section class="dw dsec docats"><div class="dsh"><h2 class="dh2">Autres catégories</h2><a href="#/catalogue">Toute la boutique</a></div><div class="dgrid g' + Math.min(6, Math.max(3, o.length)) + '">' + o.map(function (c) { return '<a class="dcat" href="' + clink(c) + '"><span class="iw">' + icon(c.iconDesktop || c.icon, 24) + '</span>' + esc(c.title) + '<small>' + refs(inCat(c).length) + '</small></a>'; }).join('') + '</div></section>';
}
V.categorie = function (args) {
  var c = CATSLUG[decodeURIComponent(args[0] || '')] || CAT[decodeURIComponent(args[0] || '')];
  if (!c) return V.notfound();
  if (catState.slug !== c.slug) catState = { slug: c.slug, region: '', shown: 8 };
  var all = inCat(c), rc = {};
  all.forEach(function (p) { if (p.region) rc[p.region] = (rc[p.region] || 0) + 1; });
  var regs = Object.keys(rc).sort(function (a, b) { return rc[b] - rc[a] || a.localeCompare(b); });
  if (catState.region && !rc[catState.region]) catState.region = '';
  var list = sortList(all.filter(function (p) { return !catState.region || p.region === catState.region; }));
  var wine = HUB && c.group === 'vins';
  var kicker = c.kicker || (wine ? WP.title : 'La Feuille de Vigne');
  var chips = regs.length > 1 ? [['', 'Toutes (' + all.length + ')']].concat(regs.map(function (r) { return [r, r + ' (' + rc[r] + ')']; })) : [];
  var sibs = wine ? WINE.filter(function (w) { return w !== c; }) : [];
  var chipHtml = function (cls) { return chips.map(function (x) { return '<button class="' + cls + (catState.region === x[0] ? ' on' : '') + '" data-act="creg" data-v="' + esc(x[0]) + '">' + esc(x[1]) + '</button>'; }).join(''); };
  var sibHtml = function (cls) { return sibs.map(function (w) { return '<a class="' + cls + '" href="' + clink(w) + '">' + esc(w.title) + ' →</a>'; }).join(''); };
  var m = statusbar() + mh(c.title, back(wine ? '#/vins' : '#/catalogue')) +
    '<div class="v catp">' + catHeroM(c.image, kicker, c.title, c.description, refs(all.length)) +
    (chips.length ? '<div class="fchips">' + chipHtml('chip') + '</div>' : '') +
    (sibs.length ? '<div class="sibs">' + sibHtml('chip g') + '</div>' : '') +
    '<div class="sortrow"><span class="cnt">' + refs(list.length) + (catState.region ? ' · ' + esc(catState.region) : '') + '</span><button data-act="sort">Trier par : ' + esc(sortLabel()) + icon('chev-down12') + '</button></div>' +
    mGrid(list) + otherCats(c, 'm') + '</div>';
  var crumbs = '<a href="#/catalogue">Boutique</a><span>/</span>' + (wine ? '<a href="#/vins">' + esc(WP.title) + '</a><span>/</span>' : '') + '<b>' + esc(c.title) + '</b>';
  var page = list.slice(0, catState.shown);
  var d = catHeroD(crumbs, c.image, kicker, c.title, c.description, refs(all.length), sibs.length ? '<span class="sib">' + sibHtml('lk') + '</span>' : '') +
    '<section class="dfbar"><div class="dw"><div class="l"><div class="pills">' + (chips.length ? chipHtml('fchip sm') : '<span class="muted">' + refs(all.length) + '</span>') + '</div></div>' + sortSelect() + '</div></section>' +
    '<section class="dprod"><div class="dw">' + (page.length ? '<div class="dgrid g4">' + page.map(function (p) { return dpcard(p); }).join('') + '</div>' : '<div class="empty"><h3>Aucun flacon dans cette catégorie</h3></div>') +
    '<div class="dpag">' + (list.length > catState.shown ? '<button class="dbtn g" data-act="cmore">Afficher ' + Math.min(8, list.length - catState.shown) + ' autres flacons</button>' : '') + '<small>Affichage de ' + page.length + ' sur ' + list.length + ' flacons</small></div></div></section>' +
    otherCats(c, 'd');
  return { m: m, d: d, nav: 'cave', dnav: wine ? 'vins' : c.id, title: c.title };
};

/* ---- Page Vins : regroupe uniquement les sous-catégories de vins ---- */
V.vins = function () {
  if (!HUB) { location.replace(WINE[0] ? clink(WINE[0]) : '#/catalogue'); return { m: '', d: '' }; }
  var wines = P.filter(function (p) { return CAT[p.category] && CAT[p.category].group === 'vins'; });
  var picks = wines.filter(function (p) { return p.featured; }).concat(wines.filter(function (p) { return !p.featured; })).slice(0, 4);
  var m = statusbar() + mh(WP.title, back('#/catalogue')) +
    '<div class="v catp">' + catHeroM(WP.image, WP.kicker, WP.title, WP.description, refs(wines.length) + ' · ' + WINE.length + ' couleurs') +
    '<section class="wtiles">' + WINE.map(function (w) { var n = inCat(w).length; return '<a class="wt" href="' + clink(w) + '"><div class="im">' + (w.image && w.image !== 'svg' ? imgTag(w.image, w.title) : '') + '</div><div class="tx"><b>' + esc(w.title) + '</b><p>' + esc(w.description || '') + '</p><small>' + refs(n) + '</small></div>' + icon('chev-right') + '</a>'; }).join('') + '</section>' +
    '<section class="sec"><div class="sec-h"><h3>Sélection de vins</h3><a href="#/catalogue">Toute la boutique</a></div><div class="hscroll">' + picks.map(pcard).join('') + '</div></section></div>';
  var d = catHeroD('<a href="#/catalogue">Boutique</a><span>/</span><b>' + esc(WP.title) + '</b>', WP.image, WP.kicker, WP.title, WP.description, refs(wines.length) + ' · ' + WINE.length + ' couleurs', '') +
    '<section class="dw dsec"><h2 class="dh2">Choisissez votre couleur</h2><div class="dgrid g' + Math.min(4, WINE.length) + '">' + WINE.map(function (w) { var n = inCat(w).length; return '<a class="dwt" href="' + clink(w) + '"><div class="im">' + (w.image && w.image !== 'svg' ? imgTag(w.image, w.title) : '') + '</div><div class="tx"><h3>' + esc(w.title) + '</h3><p>' + esc(w.description || '') + '</p><span>' + refs(n) + ' · Découvrir →</span></div></a>'; }).join('') + '</div></section>' +
    '<section class="dw dsec"><div class="dsh"><h2 class="dh2">Sélection de vins</h2><a href="#/catalogue">Toute la boutique</a></div><div class="dgrid g4">' + picks.map(function (p) { return dpcard(p); }).join('') + '</div></section>';
  return { m: m, d: d, nav: 'cave', dnav: 'vins', title: WP.title };
};

/* ---- Services : livraison, retrait, paiement, cadeaux ---- */
V.services = function () {
  var del = S.delivery || {}, zones = del.zones || [];
  var opts = DELIV.map(function (o) { return '<div class="svo"><div><b>' + esc(o.label) + '</b><p>' + esc(o.desc || '') + '</p><small>' + esc(o.eta || '') + '</small></div><span class="gold">' + (o.price ? fmt(o.price) : 'Gratuit') + '</span></div>'; }).join('');
  var pays = PAYS.map(function (p) { return '<div class="svp">' + icon(p.icon || 'phone22', 18) + '<div><b>' + esc(p.label) + '</b><p>' + esc(p.desc || '') + '</p></div></div>'; }).join('');
  var blocks = [
    ['Livraison & retrait', (FREE ? '<p class="muted">Livraison offerte dès ' + fmt(FREE) + ' d\'achat.</p>' : '') + opts],
    ['Quartiers desservis', '<div class="tags">' + zones.map(function (z) { return '<span class="chip g">' + esc(z) + '</span>'; }).join('') + '</div>'],
    ['Paiement', pays],
    ['Commande par WhatsApp', '<p class="muted">Composez votre panier puis envoyez-le en un clic : nous confirmons la disponibilité, le total et l\'heure de livraison sur WhatsApp.</p><a class="chip g" href="' + waLink('Bonjour ' + S.name + ', je souhaite passer commande.') + '" target="_blank" rel="noopener">' + icon('whatsapp', 14) + 'Écrire à la cave</a>'],
    ['Cadeaux', '<p class="muted">Option « Ceci est un cadeau » au moment de la commande : message manuscrit offert et emballage soigné.</p>' + (CAT.coffret ? '<a class="chip g" href="' + clink(CAT.coffret) + '">' + icon('gift', 14) + 'Voir les ' + esc(CAT.coffret.title.toLowerCase()) + '</a>' : '')],
    ['Retrait à la cave', '<p><b>' + esc(S.neighbourhood) + ', ' + esc(S.city) + '</b><br><span class="muted">' + esc(S.address) + '</span></p><p class="muted">' + hoursHtml() + '</p><a class="chip g" href="' + esc(S.mapsUrl) + '" target="_blank" rel="noopener">' + icon('pin', 14) + 'Itinéraire</a>']
  ];
  var m = statusbar() + mh('Livraison & paiement', back('#/')) + '<div class="v svc">' + blocks.map(function (b) { return '<section class="card svb"><h3>' + esc(b[0]) + '</h3>' + b[1] + '</section>'; }).join('') + '</div>';
  var d = '<section class="dintro"><div class="dw"><h1>Livraison & paiement</h1><p>Comment commander chez ' + esc(S.name) + ' : livraison dans Cotonou, retrait à la cave, Mobile Money ou paiement à la livraison.</p></div></section>' +
    '<section class="dw dsvc">' + blocks.map(function (b) { return '<div class="dcard svb"><h3>' + esc(b[0]) + '</h3>' + b[1] + '</div>'; }).join('') + '</section>';
  return { m: m, d: d, nav: 'home', dnav: '', title: 'Livraison & paiement' };
};

/* ---- Recherche ---- */
function sugg() { var s = P.filter(function (p) { return !p.featured && !p.limited; }); return [s[2], s[8], s[10]].filter(Boolean); }
function mSearchBody() {
  if (F.q) { var r = P.filter(function (p) { return matchQ(p, F.q); }); return '<div class="blk g12"><p class="lbl11">' + r.length + ' résultat' + (r.length > 1 ? 's' : '') + ' pour « ' + esc(F.q) + ' »</p></div>' + (r.length ? '<div class="grid2" style="padding-bottom:0">' + r.map(pcard).join('') + '</div>' : '<div class="empty"><h3>Aucun résultat</h3><p>Essayez « Bordeaux », « Champagne » ou « Whisky ».</p></div>'); }
  return '<div class="blk g12"><p class="lbl11">Recherches récentes</p><div class="recent">' + recent.map(function (r, i) { return '<div>' + icon('clock') + '<button class="q" data-act="q" data-v="' + esc(r) + '">' + esc(r) + '</button><button data-act="unrecent" data-i="' + i + '" aria-label="Supprimer">' + icon('x16') + '</button></div>'; }).join('') + '</div></div>' +
    '<div class="blk g12"><p class="lbl11">Tendances</p><div class="tags">' + (S.trending || ['Bordeaux', 'Champagne', 'Rosé', 'Whisky']).map(function (t) { return '<button class="chip g" data-act="q" data-v="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div></div>' +
    '<div class="blk"><p class="lbl11">Suggestions pour vous</p><div class="sugg">' + sugg().map(function (p) { return '<a class="sc" href="' + plink(p) + '"><div class="im">' + pimg(p) + '</div><div class="mm"><b class="ell">' + esc(p.name) + '</b><span class="ell">' + esc(p.region || p.sub) + '</span><span class="price">' + fmt(p.price) + '</span></div></a>'; }).join('') + '</div></div>';
}
function dSearchRes() {
  var r = filtered();
  return '<div class="dgrid g3">' + r.map(function (p) { return dpcard(p); }).join('') + '</div>' + (r.length ? '' : '<div class="empty"><h3>Aucun résultat</h3><p>Essayez « Bordeaux », « Champagne » ou « Whisky ».</p></div>');
}
V.recherche = function (args, q) {
  if (location.hash !== appliedHash) { appliedHash = location.hash; if (q.q != null) { F.q = q.q; persist(); } }
  var m = statusbar() + mh('Rechercher', null, '') +
    '<div class="v srch"><label class="searchbox">' + icon('search18') + '<input type="search" data-in="sq" value="' + esc(F.q) + '" placeholder="' + esc(T.searchPh2) + '" aria-label="Rechercher" enterkeyhint="search"></label><div id="msearch" class="v" style="gap:24px">' + mSearchBody() + '</div></div>';
  var b = priceBounds(), r = filtered();
  var cnt = function (k, v) { return P.filter(function (p) { return matchQ(p, F.q) && (k === 'cats' ? p.category === v : p.region === v); }).length; };
  var opt = function (k, v, label) { var on = F[k].indexOf(v) >= 0, c = cnt(k, v); return '<button class="op' + (on ? ' on' : '') + (c ? '' : ' dim') + '" data-act="ftog" data-k="' + k + '" data-v="' + esc(v) + '"><i></i>' + esc(label) + ' (' + c + ')</button>'; };
  var t1 = Math.round((b[0] + (b[1] - b[0]) * 0.2) / 1000) * 1000, t2 = Math.round((b[0] + (b[1] - b[0]) * 0.5) / 1000) * 1000;
  var pr = [['', null, t1, 'Moins de ' + fmt(t1)], ['', t1, t2, fmt(t1) + ' - ' + fmt(t2)], ['', t2, null, 'Plus de ' + fmt(t2)]];
  var reco = P.filter(function (p) { return r.indexOf(p) < 0; }).slice(0, 3);
  var d = '<section class="dsrch"><div class="dw"><div class="dsbar"><label class="box"><input type="search" data-in="dq" value="' + esc(F.q) + '" placeholder="' + esc(T.searchPh2) + '" aria-label="Rechercher">' + icon('search', 24) + '</label><small id="dcount">' + r.length + ' résultat' + (r.length > 1 ? 's' : '') + (F.q ? ' pour « ' + esc(F.q) + ' »' : '') + '</small></div>' +
    '<div class="dsg"><aside class="dfs"><h3>Affiner la recherche</h3><div class="grp"><h4>Type de vin</h4>' + CATS.map(function (c) { return opt('cats', c.id, c.label); }).join('') + '</div><div class="grp"><h4>Région</h4>' + regions().slice(0, 6).map(function (x) { return opt('regions', x, x); }).join('') + '</div>' +
    '<div class="grp"><h4>Gamme de prix</h4>' + pr.map(function (x) { var on = F.min === x[1] && F.max === x[2]; return '<button class="op rad' + (on ? ' on' : '') + '" data-act="prange" data-a="' + (x[1] == null ? '' : x[1]) + '" data-b="' + (x[2] == null ? '' : x[2]) + '"><i></i>' + x[3] + '</button>'; }).join('') + '</div></aside>' +
    '<div class="dsres" id="dres">' + dSearchRes() + '</div></div>' +
    '<section class="dreco"><h2 class="dh2">Vous pourriez aussi aimer</h2><div class="dgrid g3">' + reco.map(function (p) { return dpcard(p); }).join('') + '</div></section></div></section>';
  return { m: m, d: d, nav: 'cave', dnav: '' };
};

/* ---- Fiche produit ---- */
V.produit = function (args) {
  var p = BY[decodeURIComponent(args[0] || '')];
  if (!p) return V.notfound();
  var f = isFav(p.id), c = CAT[p.category] || {};
  var recoIds = p.reco || P.filter(function (x) { return x.category === p.category && x.id !== p.id; }).slice(0, 2).map(function (x) { return x.id; });
  var reco = recoIds.map(function (id) { return BY[id]; }).filter(Boolean);
  var pairs = pd(p, 'pairings');
  var m = statusbar() + mh('Détail du Flacon', back('#/catalogue')) +
    '<div class="v pd"><div class="pd-hero">' + pimg(p, false, true) + '</div><div class="pd-meta">' +
    '<div class="tg"><div class="tier"><p>' + esc(p.tier || c.labelLong || '') + '</p>' + stars(p.rating) + '</div><h2>' + esc(p.name) + '</h2><p class="sub">' + esc(p.sub) + '</p></div>' +
    '<p class="bigprice">' + fmt(p.price) + '</p>' +
    '<div class="acts-row"><button class="btn btn-o" data-act="add" data-id="' + esc(p.id) + '">Ajouter au panier</button><button class="sq48' + (f ? ' on' : '') + '" data-act="fav" data-id="' + esc(p.id) + '" aria-label="Favori">' + icon('heart') + '</button></div>' +
    '<div class="tasting card"><p class="h">' + esc(T.tastingTitle) + '</p><p class="q">"' + esc(pd(p, 'tasting')) + '"</p></div>' +
    '<div class="acc">' + [['Cépage', pd(p, 'grapes')], ['Région', [p.region, p.year ? 'Millésime ' + p.year : ''].filter(Boolean).join(' · ')], ['Degré', pd(p, 'abv')], ['Accords mets-vins', pairs.map(function (x) { return x.title; }).join(', ')]].map(function (r, i) {
      return '<details' + (i < 4 ? ' open' : '') + '><summary>' + r[0] + icon('chev-down14') + '</summary><p class="ell">' + esc(r[1]) + '</p></details>';
    }).join('') + '</div>' +
    (reco.length ? '<div class="rec"><h3>Le sommelier recommande</h3>' + reco.map(function (x) { return '<a class="reccard card" href="' + plink(x) + '"><span class="th">' + pimg(x) + '</span><span class="m"><b class="ell">' + esc(x.name) + '</b><span class="ell">' + esc(x.sub) + '</span></span><span class="price">' + fmt(x.price) + '</span></a>'; }).join('') + '</div>' : '') +
    '</div></div>';
  var gal = (p.gallery && p.gallery.length ? p.gallery : [p.image, p.imageWide].concat(reco.map(function (x) { return x.image; }))).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).slice(0, 4);
  if (galIdx >= gal.length) galIdx = 0;
  var gimg = function (src, eager) { return src === 'svg' ? bottleSvg(p) : imgTag(src, p.name, eager); };
  var d = '<nav class="dbc"><div class="dw"><a href="#/catalogue">Boutique</a><span>/</span><a href="' + (c.slug ? clink(c) : '#/catalogue') + '">' + esc(c.title || c.labelLong || c.label || 'Catalogue') + '</a><span>/</span><b>' + esc(p.name) + '</b></div></nav>' +
    '<section class="dmain"><div class="dw"><div class="dgal"><div class="mi">' + (gal.length ? gimg(gal[galIdx], true) : bottleSvg(p)) + '</div>' + (gal.length > 1 ? '<div class="ths">' + gal.map(function (g, i) { return '<button class="' + (i === galIdx ? 'on' : '') + '" data-act="gal" data-i="' + i + '" aria-label="Image ' + (i + 1) + '">' + gimg(g) + '</button>'; }).join('') + '</div>' : '') + '</div>' +
    '<div class="dbuy"><div class="mt"><p class="k">' + esc(p.tier || c.labelLong) + '</p><h1>' + esc(p.name) + '</h1><p class="ap">' + esc(p.sub) + '</p></div>' +
    '<div class="pr"><b>' + fmt(p.price) + '</b><span>' + (p.lowStock ? '<span style="color:var(--warning)">Plus que quelques bouteilles</span>' : 'Disponible immédiatement en cave') + '</span></div>' +
    '<div class="ctl"><div class="qc"><div class="dstep"><button data-act="pdq" data-d="-1" aria-label="Moins">-</button><b id="pdq">' + pdQty + '</b><button data-act="pdq" data-d="1" aria-label="Plus">+</button></div><button class="dbtn f lg" data-act="addq" data-id="' + esc(p.id) + '">Ajouter au panier</button></div>' +
    '<button class="wl' + (f ? ' on fav-on' : '') + '" data-act="fav" data-id="' + esc(p.id) + '">' + icon('heart14') + (f ? 'Dans ma liste de désirs' : 'Ajouter à ma liste de désirs') + '</button></div>' +
    '<div class="note"><h4>Note de dégustation du sommelier</h4><p>"' + esc(pd(p, 'tasting')) + '"</p></div></div></div></section>' +
    '<section class="dtech"><div class="dw"><div class="tl"><h2>Fiche Technique</h2><p>Informations de garde et caractéristiques du flacon.</p></div><div class="tg">' +
    [['Cépages', pd(p, 'grapes')], ['Région', p.region], ['Millésime', p.year || 'Non millésimé'], ["Degré d'alcool", pd(p, 'abv')], ['Potentiel de garde', pd(p, 'garde')], ['Température de service', pd(p, 'temp')]].map(function (r) { return '<div class="tr"><span>' + r[0] + '</span><span>' + esc(r[1]) + '</span></div>'; }).join('') + '</div></div></section>' +
    '<section class="dpair"><div class="dw"><h2>Accords Mets &amp; Vins recommandés</h2><div class="dgrid g3">' + pairs.slice(0, 3).map(function (x) { return '<div class="pc3"><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></div>'; }).join('') + '</div></div></section>';
  return { m: m, d: d, nav: 'cave', dnav: p.category === 'rouge' || p.category === 'blanc' || p.category === 'rose' ? 'vins' : p.category, title: p.name };
};

/* ---- Favoris ---- */
V.favoris = function () {
  var list = favs.map(function (id) { return BY[id]; }).filter(Boolean);
  var empty = function (btn) { return '<div class="empty"><h3>Votre liste est vide</h3><p>Touchez le cœur d\'un flacon pour le retrouver ici.</p>' + btn + '</div>'; };
  var m = statusbar() + mh("Ma Liste d'Envies", back('#/compte'), '<a class="slot r" href="#/catalogue" aria-label="Catalogue">' + icon('heart') + '</a>') +
    '<div class="v wl"><div class="items">' + (list.length ? list.map(function (p) {
      return '<div class="wli card"><a class="th" href="' + plink(p) + '">' + pimg(p) + '</a><a class="m" href="' + plink(p) + '">' + (p.lowStock ? '<span class="warn">Bientôt épuisé</span>' : '') + '<b class="ell" style="max-width:100%">' + esc(p.name) + '</b><span>' + esc(p.sub) + '</span><span class="price">' + fmt(p.price) + '</span></a><div class="a"><button data-act="fav" data-id="' + esc(p.id) + '" aria-label="Retirer">' + icon('trash') + '</button><button class="cb" data-act="add" data-id="' + esc(p.id) + '" aria-label="Ajouter au panier">' + icon('bag14') + '</button></div></div>';
    }).join('') : empty('<a class="btn btn-o" style="width:auto" href="#/catalogue">Découvrir la cave</a>')) + '</div></div>';
  var d = '<section class="dwl"><div class="dw"><div class="hd"><h1>Mes Favoris</h1><p>Retrouvez et gérez vos flacons sauvegardés.</p></div>' +
    (list.length ? '<div class="dgrid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">' + list.map(function (p) { return dpcard(p, { badge: true, portrait: true }); }).join('') + '</div>' : empty('<a class="dbtn g" href="#/catalogue">Découvrir la cave</a>')) +
    '<div class="foot"><a href="#/catalogue">Continuer mes découvertes</a></div></div></section>';
  return { m: m, d: d, nav: 'club', dnav: '' };
};

/* ---- Panier ---- */
function freeLeft(sub) { return FREE ? Math.max(0, FREE - sub) : 0; }
function quickWa() { return waLink(orderText(null)); }
V.panier = function () {
  var lines = cartLines(), sub = subtotal(), left = freeLeft(sub), std = DELIV.filter(function (o) { return o.price; })[0];
  if (!lines.length) {
    var e = '<div class="empty"><h3>Votre panier est vide</h3><p>Parcourez la cave et ajoutez vos flacons préférés.</p>';
    return { m: statusbar() + mh('Votre Sélection', back('#/catalogue')) + '<div class="v cart">' + e + '<a class="btn btn-o" style="width:auto" href="#/catalogue">Découvrir la cave</a></div></div>', d: '<section class="dcart"><div class="dw"><h1 class="dh1">Votre Sélection</h1>' + e + '<a class="dbtn g" href="#/catalogue">Découvrir la cave</a></div></div></section>', nav: 'cart' };
  }
  var shipTxt = !FREE ? 'Calculée à l\'étape suivante' : left ? 'Plus que ' + fmt(left) + ' pour la livraison offerte.' : 'Livraison offerte débloquée !';
  var m = statusbar() + mh('Votre Sélection', back('#/catalogue')) +
    '<div class="v cart"><div class="promo">' + icon('truck', 16, 'c-accent') + '<span>' + shipTxt + '</span></div>' +
    '<div class="items" style="gap:0">' + lines.map(function (l) {
      return '<div class="ci"><a class="th" href="' + plink(l.p) + '">' + pimg(l.p) + '</a><div class="info"><b class="ell">' + esc(l.p.name) + '</b><span class="ell">' + esc(l.p.sub) + '</span><div class="qty"><button data-act="qty" data-id="' + esc(l.p.id) + '" data-d="-1" aria-label="Moins">-</button><span>' + l.qty + '</span><button data-act="qty" data-id="' + esc(l.p.id) + '" data-d="1" aria-label="Plus">+</button></div></div><p class="price">' + fmt(l.total) + '</p></div>';
    }).join('') + '</div>' +
    '<div class="gift"><div class="tr"><span>' + icon('gift18') + 'Ceci est un cadeau</span><button class="toggle' + (ck.gift ? ' on' : '') + '" data-act="gift" role="switch" aria-checked="' + !!ck.gift + '" aria-label="Cadeau"></button></div>' + (ck.gift ? '<textarea class="field-ta" rows="2" data-in="giftMsg" placeholder="Saisir votre message d\'accompagnement...">' + esc(ck.giftMsg) + '</textarea>' : '') + '</div>' +
    '<div class="promo-row"><span>Code privilège</span><button class="u" data-act="promo">Ajouter un code</button></div>' +
    '<div class="panel"><div class="srow"><span>Sous-total</span><span>' + fmt(sub) + '</span></div><div class="srow"><span>Livraison</span><span class="' + (left || !FREE ? '' : 'ok') + '">' + (FREE && !left ? 'Offerte' : 'dès ' + fmt(std ? std.price : 0)) + '</span></div><div class="hr"></div>' +
    '<div class="trow"><b>Total</b><b>' + fmt(sub) + '</b></div><a class="btn btn-f" href="#/commande">Valider la commande</a>' +
    '<a class="link2" style="text-align:center;display:flex;gap:8px;justify-content:center;align-items:center" href="' + quickWa() + '" target="_blank" rel="noopener">' + icon('whatsapp', 14) + 'Ou commander directement via WhatsApp</a>' +
    '<div class="secure">' + icon('lock') + '<span>Paiement Mobile Money ou à la livraison</span></div></div></div>';
  var pct = FREE ? Math.min(100, sub / FREE * 100) : 100;
  var d = '<section class="dcart"><div class="dw"><h1 class="dh1">Votre Sélection</h1><div class="dcgrid"><div class="dcl">' +
    '<div class="dship"><p>' + shipTxt + '</p><div class="tr"><i style="width:' + pct + '%"></i></div></div>' +
    '<div class="dtable"><div class="th"><span>Produit</span><span>Quantité</span><span>Prix unitaire</span><span>Total</span><span></span></div>' + lines.map(function (l) {
      return '<div class="tr2"><a class="pi" href="' + plink(l.p) + '"><span class="th2">' + pimg(l.p) + '</span><span><b>' + esc(l.p.name) + '</b><span>' + esc(l.p.sub) + '</span></span></a><div class="ps"><button data-act="qty" data-id="' + esc(l.p.id) + '" data-d="-1" aria-label="Moins">-</button><span>' + l.qty + '</span><button data-act="qty" data-id="' + esc(l.p.id) + '" data-d="1" aria-label="Plus">+</button></div><span class="u">' + fmt(l.p.price) + '</span><span class="tt">' + fmt(l.total) + '</span><button class="del" data-act="qty" data-id="' + esc(l.p.id) + '" data-d="-999" aria-label="Supprimer">' + icon('trash14') + '</button></div>';
    }).join('') + '</div>' +
    '<div class="dgiftbox"><div class="hd">' + icon('gift-solid') + 'Ceci est un cadeau</div><p>Ajoutez un message manuscrit personnalisé, offert avec votre commande.</p><textarea data-in="giftMsg" placeholder="Rédigez votre message d\'accompagnement ici...">' + esc(ck.giftMsg) + '</textarea></div></div>' +
    '<aside class="dsum"><h3>Récapitulatif</h3><div class="bk"><div class="r"><span>Sous-total</span><span>' + fmt(sub) + '</span></div><div class="r"><span>Frais de livraison</span><span class="ok2">' + (FREE && !left ? 'Offerts' : 'dès ' + fmt(std ? std.price : 0)) + '</span></div><div class="tot"><b>Total</b><b>' + fmt(sub) + '</b></div></div>' +
    '<div class="promo2"><input placeholder="Code privilège" aria-label="Code privilège"><button data-act="promo">Appliquer</button></div><a class="dbtn f lg" href="#/commande">Valider la commande</a><a class="wa-mini" href="' + quickWa() + '" target="_blank" rel="noopener">' + icon('whatsapp', 14) + 'Commander directement via WhatsApp</a></aside></div></div></section>';
  return { m: m, d: d, nav: 'cart', dnav: '' };
};

/* ---- Commande (livraison) & paiement ---- */
function steps(i) {
  var l = ['Livraison', 'Paiement', 'Confirmation'];
  return '<div class="steps"><div class="lbl">' + l.map(function (x, k) { return '<span class="' + (k === i ? 'on' : '') + '">' + x + '</span>'; }).join('') + '</div><div class="line">' + l.map(function (x, k) { return (k ? '<u class="' + (k <= i ? 'on' : '') + '"></u>' : '') + '<i class="' + (k <= i ? 'on' : '') + '"></i>'; }).join('') + '</div></div>';
}
function zoneSelect(cls) { var z = (S.delivery && S.delivery.zones) || []; return '<select data-in="zone" class="' + (cls || '') + '"><option value="">Choisir…</option>' + z.map(function (x) { return '<option' + (ck.zone === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; }
function shipPrice(o) { if (!o.price) return 'Gratuit'; return FREE && subtotal() >= FREE ? 'Offerte' : fmt(o.price); }
V.commande = function () {
  if (!cart.length) { return V.panier(); }
  var m = statusbar() + mh('Commande', back('#/panier')) + '<div class="v co">' + steps(0) +
    '<div class="fgroup"><h3>Adresse de Livraison</h3>' +
    '<label class="fl"><label>Nom complet</label><input data-in="name" autocomplete="name" value="' + esc(ck.name) + '" placeholder="Ex. Aïcha Dossou"></label>' +
    '<label class="fl"><label>Téléphone (WhatsApp)</label><input data-in="phone" type="tel" autocomplete="tel" value="' + esc(ck.phone) + '" placeholder="' + esc(PREFIX) + ' 01 00 00 00 00"></label>' +
    '<label class="fl"><label>Quartier</label>' + zoneSelect() + '</label>' +
    '<label class="fl"><label>Adresse & point de repère</label><input data-in="address" autocomplete="street-address" value="' + esc(ck.address) + '" placeholder="Rue, maison, repère (ex. après la station)"></label></div>' +
    '<div class="fgroup"><h3>Mode de livraison</h3>' + DELIV.map(function (o) { var on = o.id === ck.ship; return '<button class="opt card' + (on ? ' on' : '') + '" data-act="ship" data-id="' + o.id + '"><span class="rad"></span><span class="om"><b>' + esc(o.label) + '</b><span>' + esc(o.desc) + '</span></span><span class="op">' + shipPrice(o) + '</span></button>'; }).join('') + '</div>' +
    '<div class="note">' + icon('shield') + '<span>' + esc(T.reassure) + '</span></div>' +
    '<div class="fgroup" style="padding-bottom:8px"><button class="btn btn-o" data-act="to-pay">Continuer</button></div></div>';
  return { m: m, d: dCheckout(), nav: 'cart', dnav: '' };
};
function payIcon(p) { return icon(p.icon || (p.type === 'cod' ? 'cash' : 'phone22'), 22); }
function sumRows(cls) {
  var sub = subtotal(), sh = shipCost(sub), o = shipOpt(), n = cartCount();
  return '<div class="srow"><span>Sous-total (' + n + ' flacon' + (n > 1 ? 's' : '') + ')</span><span>' + fmt(sub) + '</span></div><div class="srow"><span>' + esc(o.label) + '</span><span>' + (sh ? fmt(sh) : (o.price ? 'Offerte' : 'Gratuit')) + '</span></div>' + (ck.gift || ck.giftMsg ? '<div class="srow"><span>Message cadeau</span><span class="gold">Offert</span></div>' : '') + '<div class="hr"></div><div class="trow"><b>Total TTC</b><b>' + fmt(sub + sh) + '</b></div>';
}
V.paiement = function () {
  if (!cart.length) return V.panier();
  var p = payOpt(), total = subtotal() + shipCost(subtotal());
  var m = statusbar() + mh('Paiement', back('#/commande'), '') + '<div class="v co" style="padding-bottom:0">' + steps(1) +
    '<div class="fgroup"><p class="lbl11">Méthodes de paiement</p>' + PAYS.map(function (x) { var on = x.id === p.id; return '<button class="pm card' + (on ? ' on' : '') + '" data-act="pay" data-id="' + x.id + '"><span class="pi">' + payIcon(x) + '</span><span class="om"><b>' + esc(x.label) + '</b><span>' + esc(x.desc) + '</span></span><i class="rd"></i></button>'; }).join('') + '</div>' +
    (p.type === 'momo' ? '<div class="fgroup"><p class="lbl11">Numéro Mobile Money</p><label class="phonef"><span>' + esc(PREFIX) + '</span><input type="tel" data-in="momo" value="' + esc(ck.momo) + '" placeholder="01 00 00 00 00" aria-label="Numéro Mobile Money"></label><p style="font-size:11px;color:var(--muted)">' + esc(S.name) + ' vous enverra la demande de paiement sur ce numéro après confirmation.</p></div>' : '<div class="note">' + icon('shield') + '<span>Vous réglez en espèces (ou MoMo) au livreur, à la réception de votre commande.</span></div>') +
    '<div class="fgroup"><p class="lbl11">Récapitulatif de la commande</p><div class="sumcard">' + sumRows() + '</div></div>' +
    '<div class="paycta"><button class="btn btn-f" data-act="order">' + icon('whatsapp', 18) + 'Commander via WhatsApp · ' + fmt(total) + '</button><small>Le récapitulatif s\'ouvre dans WhatsApp, prêt à être envoyé à ' + esc(S.name) + '.</small></div></div>';
  return { m: m, d: dCheckout(), nav: 'cart', noNav: true, dnav: '' };
};
function dCheckout() {
  if (!cart.length) return V.panier().d;
  var sub = subtotal(), sh = shipCost(sub), p = payOpt(), o = shipOpt();
  var fld = function (k, label, ph, type, full) { return '<div class="dfl' + (full ? ' full' : '') + '"><label>' + label + '</label><input data-in="' + k + '" value="' + esc(ck[k]) + '" placeholder="' + esc(ph) + '"' + (type ? ' type="' + type + '"' : '') + '></div>'; };
  return '<section class="dco"><div class="dw"><div class="dstepper"><span class="si done"><i>01</i>Panier</span><u></u><span class="si on"><i>02</i>Livraison</span><u></u><span class="si on"><i>03</i>Paiement</span><u></u><span class="si"><i>04</i>Confirmation</span></div>' +
    '<div class="dcog"><div class="dcof"><h2>Vos informations</h2><div class="dff">' + fld('name', 'Nom complet', 'Ex. Aïcha Dossou') + fld('phone', 'Téléphone (WhatsApp)', PREFIX + ' 01 00 00 00 00', 'tel') +
    '<div class="dfl"><label>Quartier</label>' + zoneSelect() + '</div>' + fld('address', 'Adresse & point de repère', 'Rue, maison, repère') + fld('email', 'E-mail (facultatif)', 'vous@exemple.bj', 'email') + fld('note', 'Instructions de livraison (facultatif)', 'Ex. appeler en arrivant') + '</div>' +
    '<div class="v" style="gap:16px"><h3>Mode de livraison</h3><div class="dmeth c3">' + DELIV.map(function (x) { var on = x.id === o.id; return '<button class="dmc' + (on ? ' on' : '') + '" data-act="ship" data-id="' + x.id + '"><span class="cl">' + esc(x.label) + '<i></i></span><span>' + esc(x.desc) + '</span><b>' + shipPrice(x) + '</b></button>'; }).join('') + '</div></div>' +
    '<div class="dreas">' + icon('shield', 20) + '<span><b style="color:var(--text)">Livraison soignée :</b> ' + esc(T.reassure) + ' Livraison dans tout ' + esc(S.city) + '.</span></div>' +
    '<div class="v" style="gap:16px"><h3>Méthodes de paiement</h3><div class="dmeth c5">' + PAYS.map(function (x) { var on = x.id === p.id; return '<button class="dmc' + (on ? ' on' : '') + '" data-act="pay" data-id="' + x.id + '"><span class="cl">' + esc(x.label) + '<i></i></span><span>' + esc(x.desc) + '</span></button>'; }).join('') + '</div></div>' +
    (p.type === 'momo' ? '<div class="v" style="gap:12px"><h3>Numéro Mobile Money</h3><label class="dphone"><span class="cc">' + esc(PREFIX) + '</span><input type="tel" data-in="momo" value="' + esc(ck.momo) + '" placeholder="01 00 00 00 00" aria-label="Numéro Mobile Money"></label><p class="hint">' + esc(S.name) + ' vous enverra la demande de paiement sur ce numéro après confirmation de la commande.</p></div>' : '') +
    '<div class="v" style="gap:12px"><button class="dbtn f lg" style="height:49px" data-act="order">' + icon('whatsapp', 18) + 'Commander via WhatsApp · ' + fmt(sub + sh) + '</button><p class="hint" style="text-align:center">Le récapitulatif s\'ouvre dans WhatsApp, prêt à être envoyé à ' + esc(S.name) + '. Paiement Mobile Money ou à la livraison.</p></div></div>' +
    '<aside class="dsum"><h3>Récapitulatif commande</h3><div class="items">' + cartLines().map(function (l) { return '<div class="it"><div><b>' + esc(l.p.name) + '</b><span>' + esc(l.p.sub) + ' · x' + l.qty + '</span></div><span class="p">' + fmt(l.total) + '</span></div>'; }).join('') + '</div>' +
    '<div class="bk"><div class="r"><span>Sous-total</span><span>' + fmt(sub) + '</span></div><div class="r"><span>' + esc(o.label) + '</span><span class="ok2">' + (sh ? fmt(sh) : (o.price ? 'Offerte' : 'Gratuit')) + '</span></div><div class="tot"><b>Total commande</b><b>' + fmt(sub + sh) + '</b></div></div></aside></div></div></section>';
}

/* ---- message WhatsApp (récapitulatif de commande) ---- */
function orderText(o) {
  var lines = o ? o.lines : cartLines().map(function (l) { return { name: l.p.name, sub: l.p.sub, qty: l.qty, total: l.total }; });
  var t = 'Bonjour ' + S.name + ',\n' + (o ? 'Je souhaite passer commande (réf. ' + o.id + ') :' : 'Je souhaite commander :') + '\n\n';
  lines.forEach(function (l) { t += '• ' + l.qty + ' × ' + l.name + (l.sub ? ' (' + l.sub + ')' : '') + ' — ' + fmtTxt(l.total) + '\n'; });
  var sub = lines.reduce(function (a, l) { return a + l.total; }, 0);
  t += '\nSous-total : ' + fmtTxt(sub);
  if (o) {
    t += '\nLivraison (' + o.shipLabel + ') : ' + (o.ship ? fmtTxt(o.ship) : (o.shipPaid ? 'offerte' : 'gratuit')) + '\nTOTAL : ' + fmtTxt(o.total) + '\n';
    t += '\nNom : ' + (o.c.name || '-') + '\nTéléphone : ' + (o.c.phone || '-') + '\nQuartier : ' + (o.c.zone || '-') + '\nAdresse / repère : ' + (o.c.address || '-');
    if (o.c.note) t += '\nInstructions : ' + o.c.note;
    t += '\nPaiement : ' + o.pay + (o.momo ? ' (numéro ' + PREFIX + ' ' + o.momo + ')' : '');
    if (o.gift) t += '\nMessage cadeau : « ' + o.gift + ' »';
    t += '\n\nMerci de me confirmer la disponibilité et l\'heure de livraison.';
  } else t += '\n\nPouvez-vous me confirmer la disponibilité et les frais de livraison ? Merci !';
  return t;
}
function makeOrder() {
  var sub = subtotal(), sh = shipCost(sub), o = shipOpt(), p = payOpt();
  return { id: (S.orderPrefix || 'CMD') + '-' + String(Date.now()).slice(-6), date: new Date().toISOString(),
    lines: cartLines().map(function (l) { return { id: l.p.id, name: l.p.name, sub: l.p.sub, qty: l.qty, price: l.p.price, total: l.total }; }),
    sub: sub, ship: sh, shipPaid: !!o.price, shipId: o.id, shipLabel: o.label, eta: o.eta || o.desc, total: sub + sh,
    c: { name: ck.name, phone: ck.phone, zone: ck.zone, address: ck.address, note: ck.note }, pay: p.label, payType: p.type, momo: p.type === 'momo' ? ck.momo : '', gift: ck.gift || ck.giftMsg ? ck.giftMsg : '' };
}
function demoOrder() {
  var feat = P.filter(function (p) { return p.featured; }).slice(0, 2); if (!feat.length) feat = P.slice(0, 2);
  var lines = feat.map(function (p, i) { return { id: p.id, name: p.name, sub: p.sub, qty: i + 1, price: p.price, total: p.price * (i + 1) }; });
  var sub = lines.reduce(function (a, l) { return a + l.total; }, 0), o = DELIV[0];
  return { id: (S.orderPrefix || 'CMD') + '-857205', date: new Date(Date.now() - 3 * 3600e3).toISOString(), lines: lines, sub: sub, ship: FREE && sub >= FREE ? 0 : o.price, shipPaid: true, shipId: o.id, shipLabel: o.label, eta: o.eta || o.desc, total: sub + (FREE && sub >= FREE ? 0 : o.price),
    c: { name: MEM.name, phone: MEM.phone, zone: S.neighbourhood, address: S.address }, pay: PAYS[0].label, payType: PAYS[0].type, momo: '', gift: '', demo: true };
}
function lastOrder() { return load('order', null) || demoOrder(); }
function hm(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function dayTxt(d) { var t = new Date(); if (d.toDateString() === t.toDateString()) return "Aujourd'hui"; return d.getDate() + ' ' + MOIS[d.getMonth()]; }

/* ---- Confirmation ---- */
V.confirmation = function () {
  var o = lastOrder();
  var th = o.lines.slice(0, 2).map(function (l) { var p = BY[l.id]; return '<span class="t">' + (p ? pimg(p) : '') + '</span>'; }).join('');
  var n = o.lines.reduce(function (a, l) { return a + l.qty; }, 0);
  var body = '<div class="glow"><span class="ic">' + IC.glow + '</span><span class="ck">' + icon('check', 40, 'c-accent') + '</span></div>' +
    '<div class="txt"><h2>Commande Envoyée</h2><p class="id">ID : #' + esc(o.id) + '</p><p>Merci pour votre confiance ! Votre récapitulatif a été transmis à ' + esc(S.name) + ' sur WhatsApp. Nous vous confirmons la disponibilité et l\'heure de livraison très vite.</p></div>' +
    '<div class="ocard card"><div class="ths">' + th + '<div><b>' + n + ' flacon' + (n > 1 ? 's' : '') + ' · ' + fmt(o.total) + '</b><span>' + esc(o.lines.map(function (l) { return l.name; }).join(', ')) + '</span></div></div><div class="hr"></div>' +
    '<div class="kv"><span>' + (o.shipId === 'pickup' ? 'Retrait estimé' : 'Livraison estimée') + '</span><b>' + esc(o.eta) + '</b></div><div class="kv"><span>' + (o.shipId === 'pickup' ? 'Adresse de la cave' : 'Adresse') + '</span><p>' + esc(o.shipId === 'pickup' ? S.address + ', ' + S.neighbourhood : [o.c.address, o.c.zone, S.city].filter(Boolean).join(', ')) + '</p></div><div class="kv"><span>Paiement</span><p>' + esc(o.pay) + '</p></div></div>' +
    '<div class="acol"><a class="btn btn-o" href="#/suivi">Suivre ma commande</a><a class="link2" href="' + waLink(orderText(o)) + '" target="_blank" rel="noopener">WhatsApp ne s\'est pas ouvert ? Renvoyer le message</a><a class="link2" href="#/catalogue">Continuer mes découvertes</a></div>';
  return { m: statusbar() + '<div class="v conf">' + body + '</div>', d: '<section class="dw" style="padding-top:48px;padding-bottom:80px"><div class="v conf" style="max-width:560px;margin:0 auto">' + body + '</div></section>', nav: 'cart', noNav: true, dnav: '' };
};

/* ---- Suivi de commande ---- */
function trackSteps(o) {
  var d0 = new Date(o.date), d1 = new Date(d0.getTime() + 25 * 60e3), d2 = new Date(d0.getTime() + 70 * 60e3);
  var pick = o.shipId === 'pickup';
  return [
    { s: 'done', t: 'Commande confirmée', w: dayTxt(d0) + ', ' + hm(d0), p: 'Votre commande de ' + fmt(o.total) + ' a été reçue par ' + S.name + '.' },
    { s: 'done', t: 'Préparée en cave', w: dayTxt(d1) + ', ' + hm(d1), p: 'Nos cavistes sélectionnent et emballent soigneusement vos bouteilles.' },
    { s: 'cur', t: pick ? 'Prête au retrait' : 'En route', w: 'En cours', p: pick ? 'Votre commande vous attend à ' + S.name + ', ' + S.neighbourhood + '.' : 'Le livreur est en route vers ' + (o.c.zone || S.city) + '. Il vous appellera à l\'arrivée.' },
    { s: 'todo', t: pick ? 'Retirée' : 'Livrée', w: /^aujourd/i.test(o.eta) ? "Prévu aujourd'hui" : /^demain/i.test(o.eta) ? 'Prévu demain' : 'À venir', p: 'Paiement ' + (o.payType === 'cod' ? 'à la livraison' : 'Mobile Money') + ' · remise en main propre.' }
  ];
}
V.suivi = function () {
  var o = lastOrder(), st = trackSteps(o), dd = new Date(o.date);
  var m = statusbar() + mh('Suivi Commande', back('#/compte')) + '<div class="v trk"><div class="trk-meta"><p>Commande N° #' + esc(o.id) + (o.demo ? ' (démo)' : '') + '</p><h2>' + (o.shipId === 'pickup' ? 'Retrait' : 'Livraison') + ' estimée : ' + esc(o.eta) + '</h2></div>' +
    '<div class="map">' + mapSvg() + '<span class="pill">' + (o.shipId === 'pickup' ? 'À retirer à ' + esc(S.neighbourhood) : 'En route vers ' + esc(o.c.zone || S.city)) + '</span></div>' +
    '<div class="tl">' + st.map(function (x, i) { return '<div class="st ' + x.s + '"><span style="width:12px;flex:none;display:flex;flex-direction:column;align-items:center;align-self:stretch"><i style="width:12px;height:12px;border-radius:6px;margin-top:4px;flex:none;' + (x.s === 'done' ? 'background:var(--accent)' : x.s === 'cur' ? 'border:2px solid var(--accent);background:var(--bg)' : 'background:var(--border)') + '"></i>' + (i < st.length - 1 ? '<u style="flex:1;width:1px;margin-top:4px;background:' + (x.s === 'done' ? 'var(--accent)' : 'var(--border)') + '"></u>' : '') + '</span><div class="m"><div class="r"><b>' + esc(x.t) + '</b><span>' + esc(x.w) + '</span></div><p>' + esc(x.p) + '</p></div></div>'; }).join('') + '</div>' +
    '<div class="note" style="padding-bottom:24px">' + icon('sparkles') + '<span>' + esc(T.reassure) + ' Une question ? <a class="gold u" href="' + waLink('Bonjour, je souhaite suivre ma commande #' + o.id) + '" target="_blank" rel="noopener">Écrivez-nous</a>.</span></div></div>';
  var d = '<section class="dod"><div class="dw"><div class="tn"><a class="back" href="#/compte">' + icon('arrow-left') + 'Retour à mon compte</a><div class="tr0"><div class="tg2"><h1>Commande #' + esc(o.id) + '</h1><span class="stb ship">' + (o.shipId === 'pickup' ? 'Prête au retrait' : 'En cours de livraison') + '</span></div><span>Passée le ' + dd.getDate() + ' ' + MOIS[dd.getMonth()] + ' ' + dd.getFullYear() + ' à ' + hm(dd) + '</span></div></div>' +
    '<div class="dodg"><div class="dtl dcard"><div class="hd"><h3>Suivi de la livraison</h3><p>Suivez en temps réel la préparation et l\'acheminement de vos bouteilles.</p></div><div class="steps2">' + st.map(function (x, i) {
      return '<div class="sr ' + (x.s === 'cur' ? 'cur' : x.s) + '"><div class="bc"><span class="bu">' + (x.s === 'done' ? icon('check', 10) : x.s === 'cur' ? '<i></i>' : '') + '</span>' + (i < st.length - 1 ? '<u></u>' : '') + '</div><div class="dc"><b>' + esc(x.t) + (x.s === 'cur' ? '<em>Étape actuelle</em>' : '') + '</b><p>' + esc(x.p) + '</p><small>' + esc(x.w) + '</small></div></div>';
    }).join('') + '</div><div class="alert">' + icon('shield', 24) + '<span><b style="color:var(--text)">Livraison soignée :</b> ' + esc(T.reassure) + '</span></div><div class="dmap" style="min-height:220px">' + mapSvg() + '<span class="pill">' + (o.shipId === 'pickup' ? 'À retirer à ' + esc(S.neighbourhood) : 'En route vers ' + esc(o.c.zone || S.city)) + '</span></div></div>' +
    '<aside class="dos dcard"><h3>Résumé de la commande</h3>' + o.lines.map(function (l) { var p = BY[l.id]; return '<div class="ir"><span class="th3">' + (p ? pimg(p) : '') + '</span><div class="m"><b>' + esc(l.name) + '</b><span>' + esc(l.sub) + '</span><span>Quantité : ' + l.qty + '</span></div><b>' + fmt(l.total) + '</b></div>'; }).join('') +
    '<div class="ad"><div><span>' + (o.shipId === 'pickup' ? 'Retrait' : 'Adresse de livraison') + '</span><p>' + esc(o.c.name) + ' · ' + esc([o.c.address, o.c.zone, S.city].filter(Boolean).join(', ')) + '</p></div><div><span>Méthode de paiement</span><p>' + esc(o.pay) + '</p></div></div>' +
    '<div class="tt2"><div class="r"><span>Sous-total</span><span>' + fmt(o.sub) + '</span></div><div class="r"><span>' + esc(o.shipLabel) + '</span><span>' + (o.ship ? fmt(o.ship) : 'Offerte') + '</span></div><div class="t"><b>Montant total</b><b>' + fmt(o.total) + '</b></div></div></aside></div></div></section>';
  return { m: m, d: d, nav: 'cart', dnav: '' };
};

/* ---- Authentification (Connexion & Inscription) ---- */
V.connexion = function () {
  var authTab = load('auth_tab', 'login');
  if (isLogged()) {
    var roleBadge = isSuperAdmin()
      ? '<span class="adm-role-badge superadmin">SuperAdmin</span>'
      : (isGerant() ? '<span class="adm-role-badge gerant">Gérant</span>' : '<span class="adm-role-badge client">Client VIP</span>');

    var pCard = '<div class="auth-card" style="text-align:center">' +
      '<div style="width:68px;height:68px;border-radius:50%;background:var(--surface-2);border:2px solid var(--accent);color:var(--accent);font-size:24px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin:0 auto 16px">' + esc(initials(currentUser.name)) + '</div>' +
      '<h2 style="margin:0 0 6px 0">' + esc(currentUser.name) + '</h2>' +
      '<p class="sub" style="margin-bottom:14px">' + esc(currentUser.email) + ' · ' + roleBadge + '</p>' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:20px">Téléphone : ' + esc(currentUser.phone || '+229 01 00 00 00') + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
      (isGerant() ? '<a class="btn btn-f" href="#/admin">⚙️ Accéder au Tableau de Bord Gérance</a>' : '') +
      '<a class="btn btn-o" href="#/compte">Consulter mes Commandes &amp; Club</a>' +
      '<button class="btn btn-o" data-act="logout" style="border-color:var(--border);color:var(--muted)">Se Déconnecter</button>' +
      '</div></div>';

    return { m: statusbar() + mh('Mon Compte', back('#/')) + '<div class="auth-page">' + pCard + '</div>', d: '<section class="dw auth-page">' + pCard + '</section>', nav: 'club', dnav: '', title: 'Mon Compte — ' + currentUser.name };
  }

  var cHtml = '<div class="auth-card">' +
    '<h2>Espace Membre &amp; Gérance</h2>' +
    '<p class="sub">Accédez à votre compte client ou à votre espace gérant sécurisé.</p>' +
    '<div class="auth-tabs">' +
    '<button class="auth-tab-btn' + (authTab === 'login' ? ' on' : '') + '" data-act="auth-tab" data-v="login">Se Connecter</button>' +
    '<button class="auth-tab-btn' + (authTab === 'register' ? ' on' : '') + '" data-act="auth-tab" data-v="register">Créer un Compte</button>' +
    '</div>' +
    (authTab === 'login' ?
      '<form data-form="auth-login">' +
      '<div class="auth-fld"><label>Adresse e-mail</label><input type="email" id="auth-email" placeholder="ex: client@cotonou.bj" required></div>' +
      '<div class="auth-fld"><label>Mot de passe</label><input type="password" id="auth-pwd" placeholder="••••••••" required></div>' +
      '<button type="submit" class="auth-btn-submit">Connexion Sécurisée</button>' +
      '</form>' :
      '<form data-form="auth-register">' +
      '<div class="auth-fld"><label>Nom complet</label><input type="text" id="reg-name" placeholder="ex: Patrice Bio" required></div>' +
      '<div class="auth-fld"><label>Adresse e-mail</label><input type="email" id="reg-email" placeholder="ex: patrice@cotonou.bj" required></div>' +
      '<div class="auth-fld"><label>Téléphone WhatsApp</label><input type="tel" id="reg-phone" placeholder="+229 01 00 00 00" required></div>' +
      '<div class="auth-fld"><label>Mot de passe</label><input type="password" id="reg-pwd" placeholder="••••••••" required></div>' +
      '<button type="submit" class="auth-btn-submit">Créer mon Compte</button>' +
      '</form>'
    ) +
    '<div class="auth-demo-box">' +
    '<p>Comptes de test rapides (1-clic) :</p>' +
    '<div class="demo-acc-btns">' +
    '<button class="demo-btn super" data-act="quick-login" data-role="superadmin"><b>👑 Direction Générale <span>(SuperAdmin)</span></b><span>superadmin@caves.bj &rarr;</span></button>' +
    '<button class="demo-btn gerant" data-act="quick-login" data-role="gerant"><b>🍷 Gérance Sainte-Aurélie <span>(Gérant)</span></b><span>gerant@sainte-aurelie.bj &rarr;</span></button>' +
    '<button class="demo-btn" data-act="quick-login" data-role="client"><b>🛍️ Client Fidèle <span>(Client)</span></b><span>client@cotonou.bj &rarr;</span></button>' +
    '</div></div>' +
    '</div>';

  return { m: statusbar() + mh('Connexion', back('#/')) + '<div class="auth-page">' + cHtml + '</div>', d: '<section class="dw auth-page">' + cHtml + '</section>', nav: 'club', dnav: '', title: 'Connexion — ' + S.name };
};

/* ---- Compte ---- */
V.compte = function () {
  if (!isLogged()) {
    return V.connexion();
  }
  var user = currentUser || MEM;
  var o = lastOrder(), orders = load('orders', []);
  var hist = orders.length ? orders : [o];
  var menu = [['#/suivi', 'Mes commandes'], ['#/favoris', "Ma liste d'envies"], ['#/commande', 'Mes adresses'], ['#/paiement', 'Paiement'], ['#/club', CLUB.name || 'Club Privé'], ['#/journal', 'Le Journal']];
  if (isGerant()) menu.unshift(['#/admin', isSuperAdmin() ? '👑 Console SuperAdmin' : '⚙️ Tableau de bord Gérance']);

  var m = statusbar() + mh('Mon Compte', null) + '<div class="v acct"><div class="prof"><span class="avatar">' + esc(initials(user.name)) + '</span><div class="pm2"><div class="nb"><b>' + esc(user.name) + '</b><span class="tierb">' + esc(String(user.tier || 'OR').toUpperCase()) + '</span></div><span>' + esc(user.email) + '</span></div></div>' +
    '<div class="loyal card"><div class="top"><div><span>Carte de fidélité ' + esc(logo) + '</span><b>Membre Privilège ' + esc(user.tier || 'Or') + '</b></div>' + icon('key', 20, 'c-accent') + '</div><div class="bot"><div><span>Solde des points</span><b>' + num(user.points || 2450) + ' pts</b></div><a href="#/club">Utiliser mes avantages</a></div></div>' +
    '<a class="clubban" href="#/club">' + uimg('clubBanner', '') + '<b>Accès Éditions Limitées</b><span>Accédez aux allocations exclusives 24h avant tout le monde.</span></a>' +
    '<nav class="menu">' + menu.map(function (x) { return '<a href="' + x[0] + '">' + x[1] + icon('chev-right') + '</a>'; }).join('') + '</nav><div class="signout"><button class="link2" data-act="logout">Se déconnecter</button></div></div>';

  var nav = [['#/compte', 'Mon profil', 1], ['#/suivi', 'Mes commandes'], ['#/favoris', 'Mes favoris'], ['#/commande', 'Mes adresses'], ['#/club', 'Mon Club'], ['#/journal', 'Le Journal']];
  if (isGerant()) nav.unshift(['#/admin', isSuperAdmin() ? '👑 Console SuperAdmin' : '⚙️ Espace Gérant']);
  var total = hist.reduce(function (a, x) { return a + x.total; }, 0);
  var d = '<section class="dacc"><div class="dw"><aside class="dside"><div class="pf"><span class="av">' + esc(initials(user.name)) + '</span><b>' + esc(user.name) + '</b><span class="tierb">Membre ' + esc(user.tier || 'Or') + '</span></div><nav>' + nav.map(function (x) { return '<a href="' + x[0] + '" class="' + (x[2] ? 'on' : '') + '">' + x[1] + icon('chev-right', 12) + '</a>'; }).join('') + '<a href="#/" data-act="logout">Déconnexion</a></nav></aside>' +
    '<div class="dacont"><div class="tb"><h1>Mon Compte</h1><p>Ravi de vous revoir, ' + esc(String(user.name).split(' ')[0]) + '. Gérez vos informations et suivez vos commandes.</p></div>' +
    '<div class="dgrid g3"><div class="dstat dcard"><span>Total commandes</span><b>' + Math.max(hist.length, 14) + '</b></div><div class="dstat dcard"><span>Montant cumulé</span><b>' + fmt(Math.max(total, 486500)) + '</b></div><div class="dstat dcard"><span>Points fidélité</span><b>' + num(user.points || 2450) + ' pts</b></div></div>' +
    '<div class="dibox dcard"><div class="hd"><h3>Informations personnelles</h3><a href="#/commande">Modifier</a></div><div class="flds"><div class="f"><span>Nom complet</span><b>' + esc(user.name) + '</b></div><div class="f"><span>Adresse e-mail</span><b>' + esc(user.email) + '</b></div><div class="f"><span>Adresse de livraison</span><b>' + esc(user.address || (S.neighbourhood + ', ' + S.city)) + '</b></div><div class="f"><span>Téléphone</span><b>' + esc(user.phone || '+229 01 00 00 00') + '</b></div></div></div>' +
    '<div class="dibox dcard"><div class="hd"><h3>Commandes récentes</h3><a href="#/suivi">Suivre ma dernière commande</a></div><div class="v" style="gap:16px">' + hist.slice(0, 3).map(function (x, i) { var dd = new Date(x.date); return '<div class="dorow"><div class="l">#' + esc(x.id) + '<span>' + dd.getDate() + ' ' + MOIS[dd.getMonth()] + ' ' + dd.getFullYear() + '</span></div><div class="r"><span>' + fmt(x.total) + '</span><span class="stb ' + (i ? 'done' : 'ship') + '">' + (i ? 'Livrée' : 'En cours') + '</span><a href="#/suivi">Détails</a></div></div>'; }).join('') + '</div></div></div></div></section>';
  return { m: m, d: d, nav: 'club', dnav: '', title: 'Mon Compte — ' + user.name };
};

/* ---- Club ---- */
V.club = function () {
  var pct = Math.min(100, MEM.points / (MEM.nextAt || 3000) * 100), left = Math.max(0, (MEM.nextAt || 3000) - MEM.points);
  var ben = CLUB.benefits || [];
  var ev = CLUB.events || [];
  var m = statusbar() + mh(CLUB.name || 'Club Privé', back('#/compte'), '') + '<div class="v club"><div class="mcard"><div class="r1"><b class="lg-t">' + esc(logo) + '</b><span class="tierb">' + esc(String(MEM.tier).toUpperCase()) + '</span></div><div class="r2"><div><span>Membre privé</span><b>' + esc(MEM.name) + '</b></div><div class="pts"><b>' + num(MEM.points) + '</b><span>Points Club</span></div></div></div>' +
    '<div class="prog"><span>Plus que ' + num(left) + ' pts pour devenir Membre ' + esc(MEM.nextTier) + '</span><div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
    '<div class="blk g12"><p class="lbl11">Vos avantages ' + esc(MEM.tier) + '</p><div class="ben">' + ben.slice(0, 3).map(function (b) { return '<div><span class="bi">' + icon(b.icon || 'star16', 16) + '</span>' + esc(b.title) + '</div>'; }).join('') + '</div></div>' +
    '<div class="blk g12" style="padding-bottom:24px"><p class="lbl11">Événements exclusifs</p>' + ev.map(function (e) { return '<div class="evc card"><div class="im">' + imgTag(e.image || IMG.event1, e.title) + '</div><div><b>' + esc(e.title) + '</b><p class="sm">' + esc(e.date) + ' · ' + esc(e.place) + '</p></div><div class="rr"><span>' + esc(e.note) + '</span><a class="minibtn" href="' + waLink('Bonjour, je souhaite réserver pour « ' + e.title + ' » (' + e.date + ').') + '" target="_blank" rel="noopener">Réserver</a></div></div>'; }).join('') + '</div></div>';
  var d = '<section class="dchero">' + uimg('clubHero', '', true) + '<div class="dw"><p class="k">' + esc(CLUB.name || 'Club Privé') + ' · ' + esc(S.name) + '</p><h1>Le cercle des amateurs</h1><p>Allocations rares, dégustations privées et livraison offerte : rejoignez le club des passionnés de ' + esc(S.city) + '.</p><a class="dbtn o" href="' + waLink('Bonjour, je souhaite rejoindre le ' + (CLUB.name || 'club') + '.') + '" target="_blank" rel="noopener">Rejoindre le club</a></div></section>' +
    '<section class="dclub"><div class="dw"><div class="dmem"><div class="dmcard"><div class="r1"><b class="lg-t">' + esc(logo) + '</b><span>Privilège</span></div><div class="mid"><span>Statut actuel</span><b>MEMBRE ' + esc(String(MEM.tier).toUpperCase()) + '</b></div><div class="r3"><div><b>' + esc(MEM.name) + '</b><span>Membre depuis ' + esc(MEM.since) + '</span></div><span class="pts">' + num(MEM.points) + ' pts</span></div></div>' +
    '<div class="dprog dcard"><div><h3>Votre progression</h3><p class="sub">Cumulez des points à chaque achat et franchissez le prochain palier.</p></div><div><div class="lb"><b>Membre ' + esc(MEM.tier) + '</b><span>Membre ' + esc(MEM.nextTier) + ' (' + num(MEM.nextAt) + ' pts)</span></div><div class="trk"><i style="width:' + pct + '%"></i></div><small>Plus que ' + num(left) + ' pts pour devenir Membre ' + esc(MEM.nextTier) + ' et débloquer les dégustations gratuites.</small></div></div></div>' +
    '<div class="v" style="gap:32px"><h2 class="dh2">Vos avantages ' + esc(MEM.tier) + ' permanents</h2><div class="dgrid g3">' + ben.map(function (b) { return '<div class="dben dcard"><span class="bi">' + icon(b.icon || 'award', 20) + '</span><b>' + esc(b.title) + '</b><p>' + esc(b.text) + '</p></div>'; }).join('') + '</div></div>' +
    '<div class="v" style="gap:32px"><div class="dsh"><h2 class="dh2">Événements privés à venir</h2></div><div class="dgrid g2e">' + ev.map(function (e) { return '<div class="dev dcard"><div class="im">' + imgTag(e.image || IMG.event1, e.title) + '</div><div class="inf"><div class="dl"><span>' + esc(e.date) + '</span><span>•</span><span>' + esc(e.place) + '</span></div><h3>' + esc(e.title) + '</h3><p>' + esc(e.text) + '</p><div class="cr"><span>' + esc(e.note) + '</span><a class="minibtn" style="padding:10px 20px;font-size:12px;text-transform:uppercase" href="' + waLink('Bonjour, je souhaite réserver pour « ' + e.title + ' » (' + e.date + ').') + '" target="_blank" rel="noopener">Réserver</a></div></div></div>'; }).join('') + '</div></div></div></section>';
  return { m: m, d: d, nav: 'club', dnav: '' };
};

/* ---- Journal ---- */
var J = S.journal || [];
V.journal = function (args) {
  if (args[0]) return V.article(args[0]);
  var feat = J.filter(function (a) { return a.featured; })[0] || J[0];
  var rest = J.filter(function (a) { return a !== feat; });
  var card = function (a, cls) { return '<a class="' + cls + '" href="#/journal/' + a.id + '"><div class="im">' + imgTag(a.image, a.title) + '</div><span class="tagc">' + esc(a.tag) + '</span><h3>' + esc(a.title) + '</h3><p>' + esc(a.excerpt) + '</p><div class="mr"><span>Par ' + esc(a.author) + '</span><span>' + esc(a.date) + '</span></div></a>'; };
  var m = statusbar() + mh('Le Journal', back('#/')) + '<div class="v jr"><div class="intro"><p>' + esc(T.journalIntro) + '</p></div><div class="items" style="padding-bottom:24px">' + J.map(function (a) { return card(a, 'art card'); }).join('') + '</div></div>';
  var d = '<section class="djintro"><div class="dw"><h1>' + esc(T.journalTitle) + '</h1><p>' + esc(T.journalIntro) + '</p></div></section>' +
    (feat ? '<section class="dw"><a class="dfeat" href="#/journal/' + feat.id + '">' + imgTag(feat.image, feat.title, true) + '<span class="tagc">À la une · ' + esc(feat.tag) + '</span><h2>' + esc(feat.title) + '</h2><p>' + esc(feat.excerpt) + '</p><div class="mr"><span>Par ' + esc(feat.author) + '</span><span>' + esc(feat.date) + '</span></div></a></section>' : '') +
    '<section class="dw dsec" style="padding-bottom:80px"><h2 class="dh2" style="font-size:30px">Dernières Chroniques</h2><div class="dgrid g2">' + rest.map(function (a) { return card(a, 'dart'); }).join('') + '</div></section>';
  return { m: m, d: d, nav: 'home', dnav: 'journal' };
};
V.article = function (id) {
  var a = J.filter(function (x) { return x.id === id; })[0];
  if (!a) return V.notfound();
  var body = (a.body || [a.excerpt]).map(function (p) { return '<p style="font-size:15px;line-height:1.7;color:var(--text)">' + esc(p) + '</p>'; }).join('');
  var inner = '<span class="tagc">' + esc(a.tag) + '</span><h1 style="font-family:var(--serif);font-size:clamp(26px,3vw,40px);line-height:1.2">' + esc(a.title) + '</h1><p class="muted" style="font-size:13px">Par ' + esc(a.author) + ' · ' + esc(a.date) + '</p>';
  var m = statusbar() + mh('Le Journal', back('#/journal')) + '<div class="v" style="gap:20px"><div class="pd-hero" style="height:240px">' + imgTag(a.image, a.title, true) + '</div><div class="blk">' + inner + body + '<a class="btn btn-o" href="#/catalogue" style="margin:8px 0 24px">Découvrir la cave</a></div></div>';
  var d = '<section class="dw" style="padding-top:48px;padding-bottom:80px"><div class="v" style="gap:24px;max-width:820px;margin:0 auto"><a class="back muted" href="#/journal" style="display:flex;gap:8px;align-items:center">' + icon('arrow-left') + 'Retour au journal</a>' + inner + '<div style="height:420px;border-radius:8px;overflow:hidden">' + imgTag(a.image, a.title, true).replace('<img', '<img style="width:100%;height:100%;object-fit:cover"') + '</div>' + body + '<a class="dbtn o" href="#/catalogue" style="align-self:flex-start">Découvrir la cave</a></div></section>';
  return { m: m, d: d, nav: 'home', dnav: 'journal', title: a.title };
};

/* ---- 404 ---- */
V.notfound = function () {
  var art = '<span class="ic c-accent" style="opacity:.9">' + IC['wine-off'] + '</span><i style="display:block;width:12px;height:12px;border-radius:6px;background:var(--accent);margin:-28px auto 0;opacity:.8"></i>';
  var m = statusbar() + mh('Page introuvable', back('#/')) + '<div class="err404">' + art + '<h2>' + esc(T.notFoundTitle) + '</h2><p>' + esc(T.notFoundText) + '</p><a class="btn btn-o" href="#/catalogue">Retourner au catalogue</a></div>';
  var d = '<section class="d404"><div class="dw"><div class="v" style="align-items:center;gap:16px">' + art + '</div><div><h1>' + esc(T.notFoundTitle) + '</h1><p>' + esc(T.notFoundText) + '</p></div><a class="dbtn f lg" href="#/catalogue" style="padding:0 32px">Retourner au catalogue</a></div></section>';
  return { m: m, d: d, nav: '', dnav: '' };
};

/* =========================== ESPACE GÉRANT & ADMIN =========================== */
function getAdminOrders() {
  var orders = load('orders', []);
  if (!orders || !orders.length) {
    var p0 = P[0] || { id: 'p0', name: 'Château Margaux', price: 250000 },
        p1 = P[1] || { id: 'p1', name: 'Veuve Clicquot Brut', price: 48000 },
        p2 = P[2] || { id: 'p2', name: 'Whisky Macallan 12 ans', price: 65000 };
    orders = [
      {
        id: (S.orderPrefix || 'CMD') + '-857205',
        date: new Date(Date.now() - 25 * 60e3).toISOString(),
        status: 'nouvelle',
        lines: [{ id: p1.id, name: p1.name, sub: p1.sub || 'Champagne', qty: 2, price: p1.price, total: p1.price * 2 }],
        sub: p1.price * 2,
        ship: 0,
        shipLabel: 'Livraison Express (2h)',
        total: p1.price * 2,
        c: { name: 'Koffi Mensah', phone: '+229 01 97 45 22 10', zone: 'Haie Vive', address: 'Rue des Palmiers, villa 14' },
        pay: 'Mobile Money (MTN MoMo)',
        payType: 'momo',
        momo: '01 97 45 22 10'
      },
      {
        id: (S.orderPrefix || 'CMD') + '-856940',
        date: new Date(Date.now() - 140 * 60e3).toISOString(),
        status: 'livraison',
        lines: [{ id: p2.id, name: p2.name, sub: p2.sub || 'Single Malt', qty: 1, price: p2.price, total: p2.price }],
        sub: p2.price,
        ship: 1500,
        shipLabel: 'Standard 24h',
        total: p2.price + 1500,
        c: { name: 'Aïcha Dossou', phone: '+229 01 66 88 99 00', zone: 'Fidjrossè', address: 'Face pharmacie Akogbato' },
        pay: 'Paiement à la livraison',
        payType: 'cod'
      },
      {
        id: (S.orderPrefix || 'CMD') + '-856412',
        date: new Date(Date.now() - 28 * 3600e3).toISOString(),
        status: 'livree',
        lines: [{ id: p0.id, name: p0.name, sub: p0.sub || 'Grand Cru', qty: 1, price: p0.price, total: p0.price }],
        sub: p0.price,
        ship: 0,
        shipLabel: 'Livraison Offerte',
        total: p0.price,
        c: { name: 'Dr Patrice Bio', phone: '+229 01 95 12 34 56', zone: 'Ganhi', address: 'Immeuble Horizon, 3e étage' },
        pay: 'Mobile Money (Celtiis Cash)',
        payType: 'momo'
      }
    ];
    save('orders', orders);
  }
  return orders;
}

function waClientNotifyLink(o) {
  var cleanPhone = String(o.c && o.c.phone || '').replace(/\D/g, '');
  if (!cleanPhone.startsWith('229') && cleanPhone.length === 8) cleanPhone = '229' + cleanPhone;
  var statusLabels = {
    nouvelle: 'bien reçue et en attente de validation',
    confirmee: 'confirmée par notre sommelier',
    preparation: 'en cours de préparation soignée en cave',
    livraison: 'confiée à notre livreur et en route vers votre adresse',
    livree: 'livrée avec succès'
  };
  var statusText = statusLabels[o.status] || o.status;
  var msg = 'Bonjour ' + (o.c && o.c.name ? o.c.name : 'cher client') + ',\nVotre commande #' + o.id + ' chez ' + S.name + ' est ' + statusText + '.\nMontant : ' + fmtTxt(o.total) + '.\nNous restons à votre entière disposition !';
  return 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg);
}

function exportOrdersCsv() {
  var orders = getAdminOrders();
  var rows = [['ID', 'Date', 'Client', 'Telephone', 'Quartier', 'Articles', 'Sous-total', 'Livraison', 'Total', 'Paiement', 'Statut']];
  orders.forEach(function (o) {
    var arts = o.lines.map(function (l) { return l.qty + 'x ' + l.name; }).join('; ');
    rows.push([o.id, o.date, o.c.name || '', o.c.phone || '', o.c.zone || '', arts, o.sub, o.ship, o.total, o.pay, o.status || 'nouvelle']);
  });
  var csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(function (e) {
    return e.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'commandes_' + (S.slug || 'cave') + '_' + new Date().toISOString().slice(0, 10) + '.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  toast('Export Excel / CSV téléchargé !');
}

function openReceiptModal(orderId) {
  var orders = getAdminOrders();
  var o = orders.filter(function (x) { return x.id === orderId; })[0] || lastOrder();
  var modal = document.getElementById('receipt-modal');
  if (modal) modal.remove();
  var dd = new Date(o.date);
  var html = '<div class="receipt-modal-bg" id="receipt-modal">' +
    '<div class="receipt-paper">' +
    '<h3>' + esc(S.name) + '</h3>' +
    '<div class="r-sub">' + esc(S.address || S.neighbourhood) + ' · ' + esc(S.city) + '<br>Tél : ' + esc(S.phone) + '<br>Récépissé de Caisse · N° ' + esc(o.id) + '</div>' +
    '<div class="r-line"><span>Date :</span><span>' + dd.toLocaleDateString('fr-FR') + ' ' + hm(dd) + '</span></div>' +
    '<div class="r-line"><span>Client :</span><span>' + esc(o.c.name || 'Client') + '</span></div>' +
    '<div class="r-line"><span>Tél :</span><span>' + esc(o.c.phone || '-') + '</span></div>' +
    '<div class="r-line"><span>Quartier :</span><span>' + esc(o.c.zone || S.neighbourhood) + '</span></div>' +
    '<div class="r-sep"></div>' +
    o.lines.map(function (l) {
      return '<div class="r-line"><span>' + l.qty + 'x ' + esc(l.name) + '</span><span>' + fmt(l.total) + '</span></div>';
    }).join('') +
    '<div class="r-sep"></div>' +
    '<div class="r-line"><span>Sous-total :</span><span>' + fmt(o.sub) + '</span></div>' +
    '<div class="r-line"><span>Livraison (' + esc(o.shipLabel || 'Livraison') + ') :</span><span>' + (o.ship ? fmt(o.ship) : 'Offerte') + '</span></div>' +
    '<div class="r-line r-tot"><span>TOTAL TTC :</span><span>' + fmt(o.total) + '</span></div>' +
    '<div class="r-line" style="margin-top:6px;font-size:11px;color:#4b5563"><span>Règlement :</span><span>' + esc(o.pay) + '</span></div>' +
    '<div class="r-line" style="font-size:11px;color:#4b5563"><span>Statut :</span><span style="font-weight:bold;text-transform:uppercase">' + esc(o.status || 'nouvelle') + '</span></div>' +
    '<div class="r-sep"></div>' +
    '<p style="text-align:center;font-size:10px;color:#6b7280;margin:8px 0 0 0">Merci de votre confiance !<br>Conservation climatisée garantie.</p>' +
    '<div class="receipt-actions">' +
    '<button class="btn-print" onclick="window.print()">Imprimer</button>' +
    '<button class="btn-close" data-act="receipt-close">Fermer</button>' +
    '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

V.admin = function () {
  if (!isGerant()) {
    var gate = '<div class="admin-gate-wrap"><div class="admin-gate-card">' +
      '<div class="admin-gate-icon">🔐</div>' +
      '<h2>Accès Réservé à la Gérance</h2>' +
      '<p>Cet espace de pilotage, de gestion des stocks et de suivi des commandes est strictement réservé aux gérants de la cave et à la direction générale.</p>' +
      '<div class="auth-demo-box" style="margin-top:0;border-top:none;padding-top:0">' +
      '<p>Connexion rapide avec un compte habilité :</p>' +
      '<div class="demo-acc-btns">' +
      '<button class="demo-btn super" data-act="quick-login" data-role="superadmin"><b>👑 Direction Générale <span>(SuperAdmin)</span></b><span>superadmin@caves.bj &rarr;</span></button>' +
      '<button class="demo-btn gerant" data-act="quick-login" data-role="gerant"><b>🍷 Gérant Sainte-Aurélie <span>(Gérant)</span></b><span>gerant@sainte-aurelie.bj &rarr;</span></button>' +
      '<button class="demo-btn" data-act="quick-login" data-role="client"><b>🛍️ Client Ordinaire <span>(Client)</span></b><span>Tester le refus d\'accès &rarr;</span></button>' +
      '</div></div>' +
      '<div style="margin-top:24px"><a class="btn btn-o" href="#/">← Retourner à la boutique client</a></div>' +
      '</div></div>';
    return { m: statusbar() + mh('Accès Restreint', back('#/')) + gate, d: '<section class="dw" style="padding:40px 0">' + gate + '</section>', nav: 'home', dnav: '', title: 'Accès Réservé — Gérance' };
  }

  var orders = getAdminOrders();
  var totalRevenue = orders.reduce(function (sum, o) { return sum + (o.total || 0); }, 0);
  var newOrders = orders.filter(function (o) { return !o.status || o.status === 'nouvelle'; }).length;
  var inProgress = orders.filter(function (o) { return o.status === 'confirmee' || o.status === 'preparation' || o.status === 'livraison'; }).length;
  var avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;
  var lowStockProducts = P.filter(function (p) { return getStock(p) <= 5; });
  var allUsers = getUsers();

  var kpiCards = '<div class="adm-kpis">' +
    '<div class="adm-kpi-card"><div class="adm-kpi-val">' + orders.length + '</div><div class="adm-kpi-lbl">Total Commandes</div>' + (newOrders ? '<div class="adm-kpi-sub" style="color:var(--accent)">' + newOrders + ' nouvelle(s)</div>' : '<div class="adm-kpi-sub">À jour</div>') + '</div>' +
    '<div class="adm-kpi-card"><div class="adm-kpi-val gold">' + fmt(totalRevenue) + '</div><div class="adm-kpi-lbl">Chiffre d\'Affaires Cumulé</div><div class="adm-kpi-sub">Commandes de la cave</div></div>' +
    '<div class="adm-kpi-card"><div class="adm-kpi-val">' + fmt(avgOrder) + '</div><div class="adm-kpi-lbl">Panier Moyen</div><div class="adm-kpi-sub">Par client</div></div>' +
    '<div class="adm-kpi-card"><div class="adm-kpi-val" style="color:' + (lowStockProducts.length ? 'var(--warning)' : 'var(--success)') + '">' + lowStockProducts.length + '</div><div class="adm-kpi-lbl">Alertes Ruptures</div><div class="adm-kpi-sub">' + (lowStockProducts.length ? 'Flacons &le; 5 en stock' : 'Stocks confortables') + '</div></div>' +
    '</div>';

  var tabsNav = '<div class="adm-nav-tabs">' +
    '<button class="adm-tab-btn' + (admTab === 'orders' ? ' on' : '') + '" data-act="adm-tab" data-v="orders">📦 Commandes en direct (' + orders.length + ')</button>' +
    '<button class="adm-tab-btn' + (admTab === 'stock' ? ' on' : '') + '" data-act="adm-tab" data-v="stock">🍷 Gestion des Stocks (' + P.length + ' réf.)' + (lowStockProducts.length ? ' <span style="color:var(--warning)">⚠️</span>' : '') + '</button>' +
    '<button class="adm-tab-btn' + (admTab === 'stats' ? ' on' : '') + '" data-act="adm-tab" data-v="stats">📊 Ventes &amp; Statistiques</button>' +
    '<button class="adm-tab-btn' + (admTab === 'tenant' ? ' on' : '') + '" data-act="adm-tab" data-v="tenant">🏢 Multi-Caves &amp; Réglages</button>' +
    (isSuperAdmin() ? '<button class="adm-tab-btn' + (admTab === 'superadmin' ? ' on' : '') + '" data-act="adm-tab" data-v="superadmin" style="color:#f59e0b">👑 SuperAdmin · Utilisateurs (' + allUsers.length + ')</button>' : '') +
    '</div>';

  var ordersTable = '<div class="adm-table-wrap"><table class="adm-table">' +
    '<thead><tr><th>N° Commande</th><th>Date</th><th>Client</th><th>Flacons</th><th>Total &amp; Paiement</th><th>Statut</th><th>Actions</th></tr></thead>' +
    '<tbody>' +
    orders.map(function (o) {
      var d = new Date(o.date);
      var curSt = o.status || 'nouvelle';
      var linesStr = o.lines.map(function (l) { return l.qty + 'x ' + esc(l.name); }).join('<br>');
      return '<tr>' +
        '<td><b>#' + esc(o.id) + '</b></td>' +
        '<td>' + d.getDate() + ' ' + MOIS[d.getMonth()] + '<br><small style="color:var(--muted)">' + hm(d) + '</small></td>' +
        '<td><b>' + esc((o.c && o.c.name) || 'Client') + '</b><br><small style="color:var(--muted)">' + esc((o.c && o.c.phone) || '-') + '<br>' + esc((o.c && o.c.zone) || S.neighbourhood) + '</small></td>' +
        '<td><div style="font-size:12px;max-width:200px">' + linesStr + '</div></td>' +
        '<td><b class="gold">' + fmt(o.total) + '</b><br><small style="color:var(--muted)">' + esc(o.pay) + '</small></td>' +
        '<td>' +
        '<select class="adm-status-select" data-act="adm-st-change" data-id="' + esc(o.id) + '" aria-label="Statut commande">' +
        ['nouvelle', 'confirmee', 'preparation', 'livraison', 'livree'].map(function (st) {
          var lbl = { nouvelle: 'Nouvelle', confirmee: 'Confirmée', preparation: 'Préparation', livraison: 'En livraison', livree: 'Livrée' }[st];
          return '<option value="' + st + '"' + (curSt === st ? ' selected' : '') + '>' + lbl + '</option>';
        }).join('') +
        '</select>' +
        '<span class="adm-status-chip ' + curSt + '" style="margin-top:4px">' + curSt + '</span>' +
        '</td>' +
        '<td>' +
        '<a class="act-btn wa" href="' + waClientNotifyLink(o) + '" target="_blank" rel="noopener" title="Notifier sur WhatsApp">' + icon('whatsapp', 13) + ' WhatsApp</a>' +
        '<button class="act-btn" data-act="adm-receipt" data-id="' + esc(o.id) + '" title="Imprimer le reçu">' + icon('pin', 12) + ' Reçu</button>' +
        '</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table></div>';

  var ordersPanel = '<div class="adm-panel' + (admTab === 'orders' ? ' on' : '') + '">' +
    '<div class="adm-panel-head"><div class="adm-ph-tx"><h3>Gestion des Commandes</h3><p>Suivi en temps réel des commandes passées via la boutique.</p></div>' +
    '<div class="adm-ph-actions"><button class="adm-btn gold" data-act="adm-export">' + icon('check', 14) + ' Exporter Excel / CSV</button></div></div>' +
    ordersTable +
    '</div>';

  var stockAlertBanner = lowStockProducts.length ?
    '<div class="adm-alert-box">' + icon('shield', 20) + '<div><b>Alerte stock bas détectée :</b> ' + lowStockProducts.length + ' référence(s) ont 5 bouteilles ou moins restantes en cave. Pensez à réapprovisionner auprès de vos distributeurs.</div></div>' : '';

  var stockTable = '<div class="adm-table-wrap"><table class="adm-table">' +
    '<thead><tr><th>Flacon</th><th>Catégorie</th><th>Prix Vente</th><th>En Réserve</th><th>État</th><th>Ajuster Stock</th></tr></thead>' +
    '<tbody>' +
    P.map(function (p) {
      var qty = getStock(p);
      var stateChip = qty === 0 ? '<span class="adm-status-chip" style="background:rgba(239,68,68,.2);color:#ef4444;border-color:rgba(239,68,68,.4)">Rupture</span>' :
        qty <= 5 ? '<span class="adm-status-chip" style="background:rgba(217,119,6,.2);color:#f59e0b;border-color:rgba(217,119,6,.4)">Faible (&le;5)</span>' :
        '<span class="adm-status-chip livree">Disponible</span>';
      return '<tr>' +
        '<td><div style="display:flex;align-items:center;gap:10px">' +
        '<div style="width:36px;height:44px;border-radius:4px;overflow:hidden;background:#1a1a1c;flex:none">' + pimg(p) + '</div>' +
        '<div><b>' + esc(p.name) + '</b><br><small style="color:var(--muted)">' + esc(p.sub || p.region || '') + '</small></div></div></td>' +
        '<td><span class="chip g" style="font-size:11px">' + esc((CAT[p.category] || {}).label || p.category) + '</span></td>' +
        '<td><b class="gold">' + fmt(p.price) + '</b></td>' +
        '<td><b style="font-size:15px;' + (qty <= 5 ? 'color:#f59e0b' : '') + '">' + qty + ' btl</b></td>' +
        '<td>' + stateChip + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
        '<button class="act-btn" data-act="adm-stock" data-id="' + esc(p.id) + '" data-d="-1" title="Décrémenter stock">-1</button>' +
        '<button class="act-btn" data-act="adm-stock" data-id="' + esc(p.id) + '" data-d="1" title="Incrémenter stock">+1</button>' +
        '<button class="act-btn" data-act="adm-stock" data-id="' + esc(p.id) + '" data-d="6" title="Ajouter un carton (+6)">+6 (Carton)</button>' +
        '</div></td>' +
        '</tr>';
    }).join('') +
    '</tbody></table></div>';

  var stockPanel = '<div class="adm-panel' + (admTab === 'stock' ? ' on' : '') + '">' +
    '<div class="adm-panel-head"><div class="adm-ph-tx"><h3>Inventaire &amp; Réserves en Cave</h3><p>Alertes automatiques et gestion unitaire des bouteilles en rayon et en réserve.</p></div></div>' +
    stockAlertBanner +
    stockTable +
    '</div>';

  /* ---- Ventes & Statistiques (Dashboard Gérant) ---- */
  var statsPeriod = load('stats_period', 'all');
  var now = Date.now();
  var filteredOrders = orders.filter(function (o) {
    var t = new Date(o.date).getTime();
    if (statsPeriod === 'today') return (now - t) <= 24 * 3600e3;
    if (statsPeriod === 'week') return (now - t) <= 7 * 24 * 3600e3;
    if (statsPeriod === 'month') return (now - t) <= 30 * 24 * 3600e3;
    return true;
  });
  if (!filteredOrders.length) filteredOrders = orders;

  var statRevenue = filteredOrders.reduce(function (sum, o) { return sum + (o.total || 0); }, 0);
  var statCount = filteredOrders.length;
  var statAvg = statCount ? Math.round(statRevenue / statCount) : 0;
  var statBottles = filteredOrders.reduce(function (sum, o) {
    return sum + (o.lines || []).reduce(function (s2, l) { return s2 + (l.qty || 1); }, 0);
  }, 0);
  if (statBottles < 6) statBottles = 18;

  var momoOrders = filteredOrders.filter(function (o) { return o.payType === 'momo'; });
  var momoPct = statCount ? Math.round((momoOrders.length / statCount) * 100) : 67;

  var pickupOrders = filteredOrders.filter(function (o) { return o.shipId === 'pickup' || (o.shipLabel && o.shipLabel.indexOf('Retrait') >= 0); });
  var pickupPct = statCount ? Math.round((pickupOrders.length / statCount) * 100) : 33;
  var delivPct = 100 - pickupPct;

  var weekDays = [
    { day: 'Lun', val: Math.round(statRevenue * 0.08) || 95000 },
    { day: 'Mar', val: Math.round(statRevenue * 0.10) || 120000 },
    { day: 'Mer', val: Math.round(statRevenue * 0.12) || 155000 },
    { day: 'Jeu', val: Math.round(statRevenue * 0.16) || 210000 },
    { day: 'Ven', val: Math.round(statRevenue * 0.25) || 360000, peak: true },
    { day: 'Sam', val: Math.round(statRevenue * 0.21) || 290000, peak: true },
    { day: 'Dim', val: Math.round(statRevenue * 0.08) || 95000 }
  ];
  var maxDayVal = Math.max.apply(null, weekDays.map(function (d) { return d.val; })) || 1;

  var catTotals = {};
  CATS.forEach(function (c) { catTotals[c.id] = { cat: c, count: 0, total: 0 }; });
  filteredOrders.forEach(function (o) {
    (o.lines || []).forEach(function (l) {
      var prod = BY[l.id];
      var cid = (prod && prod.category) || 'rouge';
      if (!catTotals[cid]) catTotals[cid] = { cat: CAT[cid] || { label: cid, id: cid }, count: 0, total: 0 };
      catTotals[cid].count += (l.qty || 1);
      catTotals[cid].total += (l.total || (l.price * l.qty) || 0);
    });
  });
  var catWeights = { rouge: 0.35, champagne: 0.25, blanc: 0.18, spiritueux: 0.12, rose: 0.06, coffret: 0.04 };
  CATS.forEach(function (c) {
    if (!catTotals[c.id] || catTotals[c.id].total === 0) {
      var w = catWeights[c.id] || 0.1;
      catTotals[c.id] = { cat: c, count: Math.max(1, Math.round(statBottles * w)), total: Math.round(statRevenue * w) };
    }
  });
  var catList = Object.keys(catTotals).map(function (k) { return catTotals[k]; })
    .sort(function (a, b) { return b.total - a.total; });
  var totalCatRevenue = catList.reduce(function (s, x) { return s + x.total; }, 0) || statRevenue || 1;

  var prodCount = {};
  filteredOrders.forEach(function (o) {
    (o.lines || []).forEach(function (l) {
      prodCount[l.id] = (prodCount[l.id] || 0) + (l.qty || 1);
    });
  });
  var sortedProds = P.slice().sort(function (a, b) {
    var ca = prodCount[a.id] || (a.featured ? 6 : 1);
    var cb = prodCount[b.id] || (b.featured ? 6 : 1);
    return cb - ca;
  }).slice(0, 5);

  var statsFilters = '<div class="adm-stat-filters">' +
    '<span style="font-size:12px;color:var(--muted);font-weight:600;margin-right:4px">Période d\'analyse :</span>' +
    '<button class="adm-stat-btn' + (statsPeriod === 'all' ? ' on' : '') + '" data-act="adm-stat-period" data-v="all">Tout l\'historique</button>' +
    '<button class="adm-stat-btn' + (statsPeriod === 'month' ? ' on' : '') + '" data-act="adm-stat-period" data-v="month">Ce mois-ci</button>' +
    '<button class="adm-stat-btn' + (statsPeriod === 'week' ? ' on' : '') + '" data-act="adm-stat-period" data-v="week">7 derniers jours</button>' +
    '<button class="adm-stat-btn' + (statsPeriod === 'today' ? ' on' : '') + '" data-act="adm-stat-period" data-v="today">Aujourd\'hui</button>' +
    '</div>';

  var statsKpis = '<div class="adm-kpis">' +
    '<div class="adm-kpi-card"><div class="adm-kpi-val gold">' + fmt(statRevenue) + '</div><div class="adm-kpi-lbl">Chiffre Réalisé</div><div class="adm-kpi-sub">Total encaissé sur la période</div></div>' +
    '<div class="adm-kpi-card"><div class="adm-kpi-val">' + statCount + ' <small style="font-size:14px;color:var(--muted)">(' + statBottles + ' btl)</small></div><div class="adm-kpi-lbl">Commandes Validées</div><div class="adm-kpi-sub">Volume de ventes boutique</div></div>' +
    '<div class="adm-kpi-card"><div class="adm-kpi-val">' + fmt(statAvg) + '</div><div class="adm-kpi-lbl">Panier Moyen</div><div class="adm-kpi-sub">Par client livré à Cotonou</div></div>' +
    '<div class="adm-kpi-card"><div class="adm-kpi-val" style="color:var(--success)">' + momoPct + '%</div><div class="adm-kpi-lbl">Part Mobile Money</div><div class="adm-kpi-sub">MTN MoMo, Moov, Celtiis</div></div>' +
    '</div>';

  var chartHtml = '<div class="adm-chart-card">' +
    '<div class="adm-chart-head">' +
    '<div><h4>Évolution Hebdomadaire des Ventes</h4><span>Activité consolidée du Lundi au Dimanche</span></div>' +
    '<div style="display:flex;align-items:center;gap:8px"><span class="badge" style="background:rgba(226,186,118,.2);color:var(--accent);font-size:11px">🔥 Pic Vendredi &amp; Samedi</span></div>' +
    '</div>' +
    '<div class="adm-chart-bars">' +
    weekDays.map(function (d) {
      var pct = Math.max(14, Math.round((d.val / maxDayVal) * 100));
      return '<div class="adm-chart-col">' +
        '<div class="adm-chart-val">' + num(d.val) + '</div>' +
        '<div class="adm-chart-bar' + (d.peak ? ' peak' : '') + '" style="height:' + pct + '%" title="' + d.day + ' : ' + fmt(d.val) + '"></div>' +
        '<div class="adm-chart-lbl">' + d.day + '</div>' +
        '</div>';
    }).join('') +
    '</div></div>';

  var catSalesHtml = '<div class="dcard" style="padding:20px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
    '<h4 style="margin:0;font-size:15px">Répartition par Catégorie de Vins</h4>' +
    '<span style="font-size:12px;color:var(--muted)">En % du chiffre</span>' +
    '</div>' +
    catList.map(function (item) {
      var sharePct = Math.round((item.total / totalCatRevenue) * 100);
      return '<div class="adm-cat-item">' +
        '<div class="adm-cat-top">' +
        '<span><b>' + esc(item.cat.labelLong || item.cat.label || item.cat.title) + '</b> <small style="color:var(--muted)">(' + item.count + ' flacons)</small></span>' +
        '<span class="gold"><b>' + fmt(item.total) + '</b> <small style="color:var(--muted)">(' + sharePct + '%)</small></span>' +
        '</div>' +
        '<div class="adm-cat-bar"><div class="adm-cat-fill" style="width:' + sharePct + '%"></div></div>' +
        '</div>';
    }).join('') +
    '</div>';

  var channelsHtml = '<div class="dcard" style="padding:20px">' +
    '<h4 style="margin:0 0 14px 0;font-size:15px">Canaux &amp; Logistique de Distribution</h4>' +
    '<div style="margin-bottom:18px">' +
    '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px">' +
    '<span><b>Modes de Règlement</b></span>' +
    '<span class="gold"><b>' + momoPct + '% MoMo · ' + (100 - momoPct) + '% Cash</b></span>' +
    '</div>' +
    '<div class="adm-cat-bar" style="display:flex;height:8px"><div style="width:' + momoPct + '%;background:var(--accent);height:100%"></div><div style="width:' + (100 - momoPct) + '%;background:var(--border);height:100%"></div></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:4px"><span>MTN MoMo, Moov Money, Celtiis Cash</span><span>Espèces à la livraison</span></div>' +
    '</div>' +
    '<div style="margin-bottom:18px">' +
    '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px">' +
    '<span><b>Livraison Express vs Retrait en Cave</b></span>' +
    '<span class="gold"><b>' + delivPct + '% Livraison · ' + pickupPct + '% Retrait</b></span>' +
    '</div>' +
    '<div class="adm-cat-bar" style="display:flex;height:8px"><div style="width:' + delivPct + '%;background:var(--success);height:100%"></div><div style="width:' + pickupPct + '%;background:var(--border);height:100%"></div></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:4px"><span>Coursiers Cotonou (sous 2h)</span><span>Retrait gratuit Saint-Michel</span></div>' +
    '</div>' +
    '<div style="background:var(--surface-2);border-radius:8px;padding:12px;border:1px solid var(--border);display:flex;gap:10px;align-items:center">' +
    icon('whatsapp', 20, 'c-accent') +
    '<div style="font-size:12px;line-height:1.4"><b>100% des commandes qualifiées via WhatsApp :</b> conversion directe avec coordonnées vérifiées et adresse validée.</div>' +
    '</div>' +
    '</div>';

  var topProductsHtml = '<div class="dcard" style="padding:20px;margin-top:20px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<h4 style="margin:0;font-size:15px">Top 5 des Flacons les Plus Demandés</h4>' +
    '<span style="font-size:12px;color:var(--muted)">Classement par volume de vente</span>' +
    '</div>' +
    sortedProds.map(function (p, i) {
      var cnt = prodCount[p.id] || (6 - i);
      var subTot = cnt * p.price;
      var pct = [95, 82, 68, 52, 38][i] || 30;
      return '<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border)">' +
        '<div style="font-size:14px;font-weight:700;color:var(--accent);width:24px;text-align:center">#' + (i + 1) + '</div>' +
        '<div style="width:36px;height:44px;border-radius:4px;overflow:hidden;background:#1a1a1c;flex:none">' + pimg(p) + '</div>' +
        '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:4px;align-items:center">' +
        '<b style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.name) + '</b>' +
        '<span class="gold" style="font-size:13px;font-weight:700">' + fmt(subTot) + '</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px">' +
        '<span>' + esc(p.sub || p.region || '') + ' · ' + cnt + ' bouteilles</span>' +
        '<span>Prix unitaire : ' + fmt(p.price) + '</span>' +
        '</div>' +
        '<div class="adm-cat-bar"><div class="adm-cat-fill" style="width:' + pct + '%"></div></div>' +
        '</div></div>';
    }).join('') +
    '</div>';

  var statsPanel = '<div class="adm-panel' + (admTab === 'stats' ? ' on' : '') + '">' +
    '<div class="adm-panel-head">' +
    '<div class="adm-ph-tx"><h3>Performance Commerciale &amp; Statistiques</h3><p>Analyse des ventes, encaissements et panier moyen de ' + esc(S.name) + ' à Cotonou.</p></div>' +
    '<div class="adm-ph-actions">' +
    '<button class="adm-btn gold" data-act="adm-export">' + icon('check', 14) + ' Exporter Données (CSV)</button>' +
    '<button class="adm-btn" data-act="adm-print-stats">' + icon('pin', 12) + ' Imprimer Synthèse</button>' +
    '</div></div>' +
    statsFilters +
    statsKpis +
    chartHtml +
    '<div class="dgrid g2" style="gap:20px">' + catSalesHtml + channelsHtml + '</div>' +
    topProductsHtml +
    '</div>';

  /* ---- Multi-Caves & Réglages (Dashboard Gérant) ---- */
  var tenantPanel = '<div class="adm-panel' + (admTab === 'tenant' ? ' on' : '') + '">' +
    '<div class="adm-panel-head"><div class="adm-ph-tx"><h3>Architecture Multi-Caves &amp; Réglages de la Boutique</h3><p>Gestion multi-tenant des 10 caves de Cotonou et paramétrage en direct de ' + esc(S.name) + '.</p></div>' +
    '<div class="adm-ph-actions"><button class="adm-btn gold" data-act="adm-export-json">' + icon('check', 14) + ' Sauvegarde JSON</button></div></div>' +

    /* Carte Multi-Tenant */
    '<div class="dcard" style="padding:20px;margin-bottom:24px;border-left:4px solid var(--accent)">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:gap;gap:12px">' +
    '<div>' +
    '<span class="adm-tenant-badge active" style="margin-bottom:6px">🟢 Partition Multi-Tenant Hermétique</span>' +
    '<h4 style="font-size:17px;margin:4px 0 6px 0;font-family:var(--serif)">' + esc(S.name) + ' — Espace Autonome</h4>' +
    '<p style="font-size:12.5px;color:var(--muted);margin:0;line-height:1.5">Les données (commandes, panier, stocks, clients) sont strictement isolées sous le namespace <code style="color:var(--accent);background:rgba(0,0,0,.35);padding:2px 6px;border-radius:4px">' + esc(KEY) + '</code> sans risque de collision avec les 9 autres caves partenaires.</p>' +
    '</div>' +
    '<div style="text-align:right;flex:none">' +
    '<div style="font-size:11px;color:var(--muted)">Ligne WhatsApp Officielle</div>' +
    '<b style="font-size:14px;color:var(--text)">+' + esc(S.whatsapp) + '</b>' +
    '</div></div></div>' +

    /* Formulaire de Réglages */
    '<div class="adm-settings-card">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;border-bottom:1px solid var(--border);padding-bottom:12px">' +
    '<div><h4 style="margin:0;font-size:16px;font-family:var(--serif)">⚙️ Réglages &amp; Identité de la Cave</h4><p style="font-size:12px;color:var(--muted);margin:2px 0 0 0">Modifiez les informations affichées aux clients de ' + esc(S.name) + '.</p></div>' +
    '<span class="chip g" style="font-size:11px">Mise à jour en temps réel</span>' +
    '</div>' +
    '<div class="adm-settings-grid">' +
    '<div class="adm-setting-field"><label>Nom commercial de la boutique</label><input type="text" id="st-name" value="' + esc(S.name) + '" placeholder="ex: La Feuille de Vigne"><div class="adm-setting-hint">Affiché sur l\'en-tête, le catalogue et les messages WhatsApp.</div></div>' +
    '<div class="adm-setting-field"><label>Slogan &amp; Accroche</label><input type="text" id="st-slogan" value="' + esc(S.slogan || '') + '" placeholder="ex: Cave climatisée face à l\'église Saint-Michel"><div class="adm-setting-hint">Visible sous le logo et sur les bannières.</div></div>' +
    '<div class="adm-setting-field"><label>Numéro WhatsApp de réception des commandes</label><input type="tel" id="st-whatsapp" value="' + esc(S.whatsapp || '') + '" placeholder="2290121321098"><div class="adm-setting-hint">Format international sans le signe +, ex : 2290121321098.</div></div>' +
    '<div class="adm-setting-field"><label>Numéro de téléphone d\'appel</label><input type="tel" id="st-phone" value="' + esc(S.phone || '') + '" placeholder="+229 01 21 32 10 98"><div class="adm-setting-hint">Numéro affiché pour le bouton « Appeler la cave ».</div></div>' +
    '<div class="adm-setting-field"><label>Quartier principal</label><input type="text" id="st-neighbourhood" value="' + esc(S.neighbourhood || '') + '" placeholder="ex: Saint-Michel"><div class="adm-setting-hint">Zone de localisation principale à Cotonou.</div></div>' +
    '<div class="adm-setting-field"><label>Adresse physique détaillée</label><input type="text" id="st-address" value="' + esc(S.address || '') + '" placeholder="ex: Bd Saint-Michel, face à l\'église, Cotonou"><div class="adm-setting-hint">Adresse pour le retrait en magasin et la carte interactive.</div></div>' +
    '<div class="adm-setting-field"><label>Seuil Livraison Offerte (FCFA)</label><input type="number" id="st-freeFrom" value="' + (FREE || 100000) + '" placeholder="100000"><div class="adm-setting-hint">Montant minimum d\'achat pour offrir les frais de coursier.</div></div>' +
    '<div class="adm-setting-field"><label>Préfixe des Commandes</label><input type="text" id="st-orderPrefix" value="' + esc(S.orderPrefix || 'LFV') + '" placeholder="LFV"><div class="adm-setting-hint">Préfixe pour les identifiants de tickets (ex: LFV-857205).</div></div>' +
    '</div>' +
    '<div class="adm-settings-actions">' +
    '<button class="adm-btn gold" data-act="adm-save-settings">' + icon('check', 14) + ' 💾 Enregistrer les Réglages</button>' +
    '<button class="adm-btn" data-act="adm-reset-settings">↺ Rétablir par Défaut</button>' +
    '<button class="adm-btn" data-act="adm-reset-demo-orders" style="margin-left:auto;color:#ef4444;border-color:rgba(239,68,68,.3)">🔄 Réinitialiser les Commandes Démo</button>' +
    '</div></div>' +
    '</div>';

    /* Grille des 10 Caves de Cotonou (Commenté)
    '<div class="dcard" style="padding:22px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">' +
    '<div><h4 style="margin:0;font-size:16px;font-family:var(--serif)">🏢 Réseau des 10 Établissements Partenaires à Cotonou</h4><p style="font-size:12px;color:var(--muted);margin:2px 0 0 0">Chaque boutique dispose de son identité, de sa propre clé de stockage et de son espace gérant.</p></div>' +
    '<span class="badge" style="background:rgba(226,186,118,.2);color:var(--accent);font-size:11px">10 Caves Connectées</span>' +
    '</div>' +
    '<div class="adm-tenant-grid">' +
    CAVES_DATA.map(function (c) {
      var isCur = c.slug === S.slug || c.slug === 'la-feuille-de-vigne';
      return '<div class="adm-tenant-card' + (isCur ? ' current' : '') + '">' +
        '<div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span style="font-size:11px;font-weight:700;color:var(--accent)">' + esc(c.neighbourhood) + '</span>' +
        (isCur ? '<span class="adm-tenant-badge active">🟢 Cave Actuelle</span>' : '<span class="adm-tenant-badge other">Connectée</span>') +
        '</div>' +
        '<h4 style="margin:0 0 6px 0">' + esc(c.name) + '</h4>' +
        '<p class="adm-tenant-desc">📍 ' + esc(c.address) + '<br>📞 ' + esc(c.phone) + '</p>' +
        '</div>' +
        '<div class="adm-tenant-actions">' +
        (isCur ? '<a class="primary" href="#/">🛍️ Boutique</a><a href="#/admin">⚙️ Gérant</a>' : '<a href="' + c.url + '">🛍️ Boutique</a><a href="' + c.url + '#/admin">⚙️ Gérant</a>') +
        '</div></div>';
    }).join('') +
    '</div></div>' +
    '</div>';
    */

  var superadminPanel = '';
  if (isSuperAdmin()) {
    superadminPanel = '<div class="adm-panel' + (admTab === 'superadmin' ? ' on' : '') + '">' +
      '<div class="adm-panel-head">' +
      '<div class="adm-ph-tx"><h3>Console SuperAdmin · Gestion des Admins &amp; Rôles</h3><p>Gérez les droits d\'accès, attribuez des rôles d\'administrateurs ou gérants, et configurez les caves.</p></div>' +
      '</div>' +
      '<div class="adm-super-grid">' +
      '<div class="dcard" style="padding:20px">' +
      '<h4 style="margin:0 0 14px 0">Comptes Utilisateurs Enregistrés (' + allUsers.length + ')</h4>' +
      '<div class="adm-table-wrap"><table class="adm-table">' +
      '<thead><tr><th>Utilisateur</th><th>Email &amp; Tél</th><th>Rôle Actuel</th><th>Cave</th><th>Actions</th></tr></thead>' +
      '<tbody>' +
      allUsers.map(function (u) {
        var isSelf = currentUser && currentUser.id === u.id;
        return '<tr>' +
          '<td><div style="display:flex;align-items:center;gap:10px">' +
          '<div class="adm-user-avatar">' + esc(initials(u.name)) + '</div>' +
          '<div><b>' + esc(u.name) + '</b>' + (isSelf ? ' <small style="color:var(--accent)">(Vous)</small>' : '') + '</div></div></td>' +
          '<td>' + esc(u.email) + '<br><small style="color:var(--muted)">' + esc(u.phone || '-') + '</small></td>' +
          '<td><span class="adm-role-badge ' + esc(u.role) + '">' + esc(u.role) + '</span></td>' +
          '<td><small>' + esc(u.caveSlug === 'all' ? 'Toutes les caves' : u.caveSlug) + '</small></td>' +
          '<td><div style="display:flex;gap:4px;flex-wrap:wrap">' +
          (u.role !== 'gerant' ? '<button class="act-btn" data-act="set-user-role" data-id="' + esc(u.id) + '" data-role="gerant" title="Promouvoir Gérant">Gérant</button>' : '') +
          (u.role !== 'superadmin' ? '<button class="act-btn" data-act="set-user-role" data-id="' + esc(u.id) + '" data-role="superadmin" title="Promouvoir SuperAdmin">SuperAdmin</button>' : '') +
          (u.role !== 'client' ? '<button class="act-btn" data-act="set-user-role" data-id="' + esc(u.id) + '" data-role="client" title="Passer Client">Client</button>' : '') +
          (!isSelf ? '<button class="act-btn" style="color:#ef4444;border-color:rgba(239,68,68,.3)" data-act="del-user" data-id="' + esc(u.id) + '" title="Supprimer">✕</button>' : '') +
          '</div></td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div></div>' +
      '<div class="dcard" style="padding:20px">' +
      '<h4 style="margin:0 0 14px 0">Créer un Nouvel Administrateur / Gérant</h4>' +
      '<form data-form="add-admin-form">' +
      '<div class="auth-fld"><label>Nom &amp; Prénom</label><input type="text" id="new-user-name" placeholder="ex: Marc Agossa" required></div>' +
      '<div class="auth-fld"><label>Adresse e-mail</label><input type="email" id="new-user-email" placeholder="ex: marc@caves.bj" required></div>' +
      '<div class="auth-fld"><label>Téléphone</label><input type="tel" id="new-user-phone" placeholder="+229 01 00 00 00" required></div>' +
      '<div class="auth-fld"><label>Rôle à attribuer</label>' +
      '<select id="new-user-role"><option value="gerant">Gérant de Cave</option><option value="superadmin">SuperAdmin (Direction)</option><option value="client">Client</option></select>' +
      '</div>' +
      '<div class="auth-fld"><label>Cave Assignée</label>' +
      '<select id="new-user-cave">' +
      '<option value="' + esc(S.slug) + '">' + esc(S.name) + ' (Actuelle)</option>' +
      CAVES_DATA.map(function (c) { return '<option value="' + esc(c.slug) + '">' + esc(c.name) + '</option>'; }).join('') +
      '<option value="all">Toutes les caves (Global)</option>' +
      '</select></div>' +
      '<button type="submit" class="auth-btn-submit" style="margin-top:12px">+ Créer l\'accès</button>' +
      '</form></div></div></div>';
  }

  var content = '<div class="adm-wrap">' +
    '<div class="adm-header">' +
    '<div class="adm-title-group">' +
    '<span class="adm-badge">' + (isSuperAdmin() ? '👑 Console SuperAdmin' : 'Espace Administration &amp; Gérance') + '</span>' +
    '<h2>' + esc(S.name) + '</h2>' +
    '<p style="color:var(--muted);font-size:13px;margin:2px 0 0 0">Connecté en tant que <b>' + esc(currentUser.name) + '</b> (' + esc(currentUser.role) + ') · Données cloisonnées en temps réel</p>' +
    '</div>' +
    '<div class="adm-actions-top">' +
    '<a class="adm-btn" href="#/">← Retour Boutique Client</a>' +
    '<button class="adm-btn gold" data-act="adm-export">' + icon('check', 14) + ' Export Données</button>' +
    '</div></div>' +
    kpiCards +
    tabsNav +
    ordersPanel +
    stockPanel +
    statsPanel +
    tenantPanel +
    superadminPanel +
    '</div>';

  var mHeader = statusbar() + mh('Espace Gérance', back('#/'));
  return { m: mHeader + content, d: '<section class="dw" style="padding-top:24px;padding-bottom:60px">' + content + '</section>', nav: 'home', dnav: '', title: 'Tableau de bord Gérant — ' + S.name };
};

/* =========================== INITIALISATEURS DYNAMIQUES =========================== */
function initInteractiveMap() {
  var mapEl = document.getElementById('cave-leaflet-map');
  if (!mapEl) return;
  if (typeof window.maplibregl === 'undefined') {
    console.warn('MapLibre GL non chargé');
    return;
  }

  var cur = CAVES_DATA.filter(function (c) { return c.slug === S.slug; })[0] || CAVES_DATA[0];

  if (window._activeCaveMap) {
    try { window._activeCaveMap.remove(); } catch (e) {}
    window._activeCaveMap = null;
  }

  try {
    var center = mapFilter === 'all' ? [2.395, 6.363] : [cur.lng, cur.lat];
    var zoom = mapFilter === 'all' ? 11.5 : 13.8;

    var map = new maplibregl.Map({
      container: mapEl,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: center,
      zoom: zoom,
      scrollZoom: false
    });
    window._activeCaveMap = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', function () {
      CAVES_DATA.forEach(function (c) {
        var isCur = c.slug === S.slug;
        if (mapFilter === 'current' && !isCur) return;

        var el = document.createElement('div');
        el.className = 'custom-map-pin' + (isCur ? ' current' : '');
        el.innerHTML = isCur
          ? '<div class="pin-pulse"></div><div class="pin-dot current">🍷</div>'
          : '<div class="pin-dot">🍾</div>';

        var itLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.name + ' ' + c.neighbourhood + ' Cotonou');
        var waDirect = 'https://wa.me/' + c.whatsapp + '?text=' + encodeURIComponent('Bonjour ' + c.name + ', je prépare mon passage à la cave.');

        var popupHtml = '<div class="map-popup-inner">' +
          '<h4>' + esc(c.name) + '</h4>' +
          '<p class="pop-addr">' + esc(c.address) + '</p>' +
          '<p class="pop-tel">Tél : ' + esc(c.phone) + '</p>' +
          '<div class="pop-btns">' +
          '<a class="pop-btn-it" href="' + esc(itLink) + '" target="_blank" rel="noopener">🗺️ Itinéraire</a>' +
          '<a class="pop-btn-wa" href="' + esc(waDirect) + '" target="_blank" rel="noopener">💬 WhatsApp</a>' +
          (!isCur ? '<a class="pop-btn-visit" href="' + c.url + '">Visiter la boutique</a>' : '') +
          '</div></div>';

        var popup = new maplibregl.Popup({ offset: 24, closeButton: true })
          .setHTML(popupHtml);

        new maplibregl.Marker({ element: el })
          .setLngLat([c.lng, c.lat])
          .setPopup(popup)
          .addTo(map);
      });
    });

    setTimeout(function () { map.resize(); }, 350);
  } catch (err) {
    console.warn('MapLibre map error:', err);
  }
}

function initCounters() {
  var counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  if (!('IntersectionObserver' in window)) {
    counters.forEach(function (el) {
      var target = +el.getAttribute('data-counter');
      var pre = el.getAttribute('data-prefix') || '';
      var suf = el.getAttribute('data-suffix') || '';
      el.textContent = pre + target + suf;
    });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        observer.unobserve(el);
        var target = +el.getAttribute('data-counter');
        var pre = el.getAttribute('data-prefix') || '';
        var suf = el.getAttribute('data-suffix') || '';
        var duration = 1200;
        var startTime = null;

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          var progress = Math.min((timestamp - startTime) / duration, 1);
          var current = Math.floor(progress * target);
          el.textContent = pre + current + suf;
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = pre + target + suf;
          }
        }
        requestAnimationFrame(step);
      }
    });
  }, { threshold: 0.2 });

  counters.forEach(function (c) { observer.observe(c); });
}

function initScrollReveals() {
  var reveals = document.querySelectorAll('.reveal-on-scroll');
  reveals.forEach(function (el) {
    el.classList.add('is-visible');
    el.classList.add('is-revealed');
  });
}

/* ---------- Carrousel d'Avis Défilement Automatique sur Mobile ---------- */
var revInterval = null;
var currentRevIdx = 0;

function updateRevDots(idx) {
  var dots = document.querySelectorAll('.rev-dot');
  dots.forEach(function (d, i) {
    d.classList.toggle('on', i === idx);
  });
}

function stepReviews(direction) {
  var grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  var cards = grid.querySelectorAll('.rev-card');
  if (!cards.length) return;
  currentRevIdx = (currentRevIdx + direction + cards.length) % cards.length;
  var targetCard = cards[currentRevIdx];
  if (targetCard) {
    grid.scrollTo({
      left: targetCard.offsetLeft - 20,
      behavior: 'smooth'
    });
    updateRevDots(currentRevIdx);
  }
}

function initReviewsSlider() {
  if (revInterval) {
    clearInterval(revInterval);
    revInterval = null;
  }
  var grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  if (window.innerWidth < 1024) {
    revInterval = setInterval(function () {
      if (document.hidden || grid._touch || grid._hover) return;
      stepReviews(1);
    }, 4500);

    grid.addEventListener('touchstart', function () { grid._touch = true; }, { passive: true });
    grid.addEventListener('touchend', function () { grid._touch = false; }, { passive: true });
    grid.addEventListener('mouseenter', function () { grid._hover = true; });
    grid.addEventListener('mouseleave', function () { grid._hover = false; });
  }
}

/* ---------- Bulle WhatsApp Fermable avec Disparition 30s ---------- */
var waTimer = null;
function initFloatingWhatsApp() {
  var bubble = document.getElementById('fwaBubble');
  if (!bubble) return;
  if (waTimer) {
    clearTimeout(waTimer);
    waTimer = null;
  }

  var closed = false;
  try { closed = sessionStorage.getItem('wa_bubble_closed') === '1'; } catch (e) {}
  if (closed) {
    bubble.classList.add('fwa-hidden');
    return;
  }

  // Disparaît automatiquement après 30 secondes
  waTimer = setTimeout(function () {
    if (bubble) bubble.classList.add('fwa-hidden');
  }, 30000);
}

function dismissWhatsAppBubble() {
  var bubble = document.getElementById('fwaBubble');
  if (bubble) bubble.classList.add('fwa-hidden');
  try { sessionStorage.setItem('wa_bubble_closed', '1'); } catch (e) {}
  if (waTimer) clearTimeout(waTimer);
}

/* =========================== routeur & rendu =========================== */
var ROUTES = { '': 'home', catalogue: 'catalogue', categorie: 'categorie', vins: 'vins', services: 'services', filtres: 'filtres', recherche: 'recherche', produit: 'produit', favoris: 'favoris', panier: 'panier', commande: 'commande', paiement: 'paiement', confirmation: 'confirmation', suivi: 'suivi', compte: 'compte', club: 'club', journal: 'journal', admin: 'admin', connexion: 'connexion' };
function parse() {
  var h = location.hash.replace(/^#\/?/, ''), qi = h.indexOf('?'), q = {};
  if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); }); h = h.slice(0, qi); }
  var parts = h.split('/').filter(Boolean);
  return { name: ROUTES[parts[0] || ''] , args: parts.slice(1), q: q, key: parts[0] || '' };
}
var lastKey = null;
function render(keepScroll) {
  var r = parse(), view = r.name ? V[r.name] : V.notfound;
  var v = (view || V.notfound)(r.args, r.q);
  var y = window.scrollY;
  app.innerHTML = dHeader(v.dnav) + '<main><div class="m-only"><div class="screen' + (v.noNav ? ' no-nav' : '') + '">' + v.m + '</div></div><div class="d-only">' + v.d + '</div></main>' + dFooter() + (v.noNav ? '' : bottomNav(v.nav)) + drawer() + ageGate() + floatingWhatsappHtml();
  document.body.classList.toggle('hide-bn', !!v.noNav);
  document.title = (v.title ? v.title + ' — ' : '') + S.name;
  var key = location.hash.split('?')[0];
  if (keepScroll && key === lastKey) window.scrollTo(0, y); else window.scrollTo(0, 0);
  lastKey = key;
  initCarousels();
  initInteractiveMap();
  initCounters();
  initScrollReveals();
  initReviewsSlider();
  initFloatingWhatsApp();
}

/* ---------- vérification d'âge ---------- */
function ageGate() {
  if (load('age', false)) return '';
  var refused = load('ageNo', false);
  return '<div class="age' + (refused ? ' refused' : '') + '" role="dialog" aria-modal="true" aria-labelledby="ageT"><div class="bgimg" style="background-image:url(\'' + esc(IMG.ageGate || '') + '\')"></div><div class="top">' + statusbar() + '</div>' +
    '<div class="mid"><div class="brand"><p class="lg-t">' + esc(logo) + '</p><i></i></div><div class="q"><h2 id="ageT">' + esc(T.ageTitle) + '</h2><p>' + esc(T.ageText) + '</p></div>' +
    '<div class="acts"><button class="btn btn-o" data-act="age-yes">' + esc(T.ageYes) + '</button><button class="link2" data-act="age-no">' + esc(T.ageNo) + '</button><p class="minor">' + esc(T.ageRefused) + '</p></div></div><div class="bot"><div class="home-ind"><i></i></div></div></div>';
}

/* ---------- événements ---------- */
function rerender() { render(true); }
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]');
  if (!el) { if (e.target.closest('.drawer nav a, .drawer .info a, .drawer a')) { closeDrawer(); } return; }
  var a = el.getAttribute('data-act'), id = el.getAttribute('data-id');
  switch (a) {
    case 'back': return; /* lien normal vers l'écran parent */
    case 'drawer': openDrawer(); return;
    case 'drawer-close': closeDrawer(); return;
    case 'add': e.preventDefault(); addCart(id, 1); rerender(); return;
    case 'addq': addCart(id, pdQty); pdQty = 1; rerender(); return;
    case 'pdq': pdQty = Math.max(1, pdQty + (+el.getAttribute('data-d'))); document.getElementById('pdq').textContent = pdQty; return;
    case 'gal': galIdx = +el.getAttribute('data-i'); rerender(); return;
    case 'fav': e.preventDefault(); toggleFav(id); rerender(); return;
    case 'qty': setQty(id, +el.getAttribute('data-d')); rerender(); return;
    case 'gift': ck.gift = !ck.gift; persist(); rerender(); return;
    case 'promo': toast('Codes privilège : fonctionnalité de démonstration'); return;
    case 'ship': ck.ship = id; persist(); rerender(); return;
    case 'pay': ck.pay = id; persist(); rerender(); return;
    case 'to-pay':
      if (!ck.name || !ck.phone) { toast('Merci d\'indiquer votre nom et votre téléphone'); var f = document.querySelector('.m-only [data-in="' + (!ck.name ? 'name' : 'phone') + '"]'); if (f) f.focus(); return; }
      location.hash = '#/paiement'; return;
    case 'order': {
      if (!ck.name || !ck.phone) { toast('Merci d\'indiquer votre nom et votre téléphone'); if (location.hash.indexOf('paiement') >= 0 && window.innerWidth < 1024) location.hash = '#/commande'; return; }
      var o = makeOrder(), url = waLink(orderText(o));
      save('order', o);
      var hist = getAdminOrders();
      hist.unshift(o);
      save('orders', hist.slice(0, 25));
      cart = []; ck.giftMsg = ''; ck.gift = false; persist();
      window.open(url, '_blank', 'noopener');
      location.hash = '#/confirmation'; return;
    }
    case 'sort': { var i = SORTS.map(function (s) { return s[0]; }).indexOf(F.sort); F.sort = SORTS[(i + 1) % SORTS.length][0]; persist(); rerender(); return; }
    case 'reset': resetFilters(); F.q = ''; persist(); rerender(); return;
    case 'ftog': { var k = el.getAttribute('data-k'), v = el.getAttribute('data-v'); if (k === 'years') v = +v; toggleIn(F[k], v); shown = 6; persist(); rerender(); return; }
    case 'unpill': { var k2 = el.getAttribute('data-k'), v2 = el.getAttribute('data-v'); if (k2 === 'price') { F.min = null; F.max = null; } else { if (k2 === 'years') v2 = +v2; toggleIn(F[k2], v2); } persist(); rerender(); return; }
    case 'prange': { var pa = el.getAttribute('data-a'), pb = el.getAttribute('data-b'); var na = pa === '' ? null : +pa, nb = pb === '' ? null : +pb; if (F.min === na && F.max === nb) { F.min = null; F.max = null; } else { F.min = na; F.max = nb; } persist(); rerender(); return; }
    case 'dpanel': dPanel = !dPanel; rerender(); return;
    case 'more': shown += 6; rerender(); return;
    case 'creg': catState.region = el.getAttribute('data-v'); catState.shown = 8; rerender(); return;
    case 'cmore': catState.shown += 8; rerender(); return;
    case 'q': F.q = el.getAttribute('data-v'); persist(); rerender(); return;
    case 'unrecent': recent.splice(+el.getAttribute('data-i'), 1); persist(); rerender(); return;
    case 'logout': e.preventDefault(); logoutUser(); return;
    case 'toggle-theme': e.preventDefault(); toggleTheme(); return;
    case 'set-theme': e.preventDefault(); setTheme(el.getAttribute('data-v')); return;
    case 'auth-tab': save('auth_tab', el.getAttribute('data-v')); rerender(); return;
    case 'quick-login': {
      var role = el.getAttribute('data-role');
      var users = getUsers();
      var match = users.filter(function (u) { return u.role === role; })[0];
      if (!match) match = DEFAULT_USERS.filter(function (u) { return u.role === role; })[0] || DEFAULT_USERS[2];
      loginAs(match);
      if (role === 'superadmin' || role === 'gerant') location.hash = '#/admin';
      else location.hash = '#/compte';
      return;
    }
    case 'set-user-role': {
      var uid = el.getAttribute('data-id'), nrole = el.getAttribute('data-role');
      updateUserRole(uid, nrole);
      toast('Rôle mis à jour : ' + nrole);
      rerender();
      return;
    }
    case 'del-user': {
      var uid2 = el.getAttribute('data-id');
      if (confirm('Supprimer cet utilisateur ?')) {
        deleteUser(uid2);
        toast('Utilisateur supprimé');
        rerender();
      }
      return;
    }
    case 'age-yes': save('age', true); save('ageNo', false); var g = document.querySelector('.age'); if (g) g.remove(); return;
    case 'age-no': save('ageNo', true); document.querySelector('.age').classList.add('refused'); return;
    case 'hl-tab': {
      hlTab = el.getAttribute('data-v');
      var hlSec = el.closest('.home-highlights');
      if (hlSec) {
        hlSec.querySelectorAll('.hl-tab').forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-v') === hlTab);
        });
        var isD = hlSec.classList.contains('dw');
        var bestsellers = P.filter(function (p) { return p.featured; });
        if (bestsellers.length < 4) bestsellers = P.slice(0, 4);
        var news = P.filter(function (p) { return p.year && p.year >= 2019 && !p.featured; });
        if (news.length < 4) news = P.slice(4, 8);
        var activeList = hlTab === 'bestsellers' ? bestsellers : news;
        var newItems = isD ? activeList.slice(0, 4).map(function (p) { return dpcard(p); }).join('') : activeList.slice(0, 4).map(pcard).join('');
        var grid = hlSec.querySelector('.hl-grid');
        if (grid) grid.innerHTML = newItems;
      }
      return;
    }
    case 'rev-prev': stepReviews(-1); return;
    case 'rev-next': stepReviews(1); return;
    case 'faq-tog': { var fi = +el.getAttribute('data-i'); faqOpen[fi] = !faqOpen[fi]; rerender(); return; }
    case 'map-filter': { mapFilter = el.getAttribute('data-v'); rerender(); return; }
    case 'fwa-dismiss': dismissWhatsAppBubble(); return;
    case 'adm-tab': admTab = el.getAttribute('data-v'); rerender(); return;
    case 'adm-stock': setStock(el.getAttribute('data-id'), +el.getAttribute('data-d')); rerender(); return;
    case 'adm-receipt': openReceiptModal(el.getAttribute('data-id')); return;
    case 'receipt-close': { var rm = document.getElementById('receipt-modal'); if (rm) rm.remove(); return; }
    case 'adm-export': exportOrdersCsv(); return;
    case 'adm-stat-period': statsPeriod = el.getAttribute('data-v'); save('stats_period', statsPeriod); rerender(); return;
    case 'adm-print-stats': window.print(); return;
    case 'adm-save-settings': saveSettingsFromForm(); return;
    case 'adm-reset-settings': resetSettingsDefaults(); return;
    case 'adm-export-json': exportShopDataJson(); return;
    case 'adm-reset-demo-orders': resetDemoOrders(); return;
  }
});

function saveSettingsFromForm() {
  var nameEl = document.getElementById('st-name'),
      sloganEl = document.getElementById('st-slogan'),
      waEl = document.getElementById('st-whatsapp'),
      phoneEl = document.getElementById('st-phone'),
      addrEl = document.getElementById('st-address'),
      neighEl = document.getElementById('st-neighbourhood'),
      freeEl = document.getElementById('st-freeFrom'),
      pfxEl = document.getElementById('st-orderPrefix');
  if (!nameEl || !nameEl.value.trim()) {
    toast('Veuillez renseigner un nom pour la boutique');
    return;
  }
  var sets = {
    name: nameEl.value.trim(),
    slogan: sloganEl ? sloganEl.value.trim() : S.slogan,
    whatsapp: waEl ? waEl.value.trim().replace(/\D/g, '') : S.whatsapp,
    phone: phoneEl ? phoneEl.value.trim() : S.phone,
    address: addrEl ? addrEl.value.trim() : S.address,
    neighbourhood: neighEl ? neighEl.value.trim() : S.neighbourhood,
    freeFrom: freeEl && +freeEl.value >= 0 ? +freeEl.value : (S.delivery && S.delivery.freeFrom) || 100000,
    orderPrefix: pfxEl && pfxEl.value.trim() ? pfxEl.value.trim().toUpperCase() : (S.orderPrefix || 'LFV')
  };
  save('settings', sets);
  applySettings(sets);
  toast('Réglages de La Feuille de Vigne enregistrés avec succès !');
  rerender();
}

function resetSettingsDefaults() {
  save('settings', null);
  toast('Réglages réinitialisés aux valeurs par défaut.');
  setTimeout(function () { location.reload(); }, 600);
}

function exportShopDataJson() {
  var data = {
    shop: S.name,
    slug: S.slug,
    exportedAt: new Date().toISOString(),
    settings: load('settings', {}),
    orders: getAdminOrders(),
    stockOverrides: load('stock_overrides', {})
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (S.slug || 'la-feuille-de-vigne') + '-donnees.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Sauvegarde JSON générée avec succès');
}

function resetDemoOrders() {
  save('orders', null);
  toast('Commandes de démonstration réinitialisées.');
  rerender();
}
var qt;
document.addEventListener('input', function (e) {
  var el = e.target, k = el.getAttribute && el.getAttribute('data-in');
  if (!k) return;
  var v = el.value;
  if (k === 'q' || k === 'sq' || k === 'dq') {
    F.q = v; persist(); clearTimeout(qt);
    qt = setTimeout(function () {
      if (k === 'q') { var list = filtered(); var g = document.getElementById('mgrid'); if (g) g.outerHTML = mGrid(list); var c = document.getElementById('mcount'); if (c) c.textContent = list.length + ' référence' + (list.length > 1 ? 's' : '') + ' trouvée' + (list.length > 1 ? 's' : ''); }
      if (k === 'sq') { document.getElementById('msearch').innerHTML = mSearchBody(); }
      if (k === 'dq') { document.getElementById('dres').innerHTML = dSearchRes(); var n = filtered().length; document.getElementById('dcount').textContent = n + ' résultat' + (n > 1 ? 's' : '') + (F.q ? ' pour « ' + F.q + ' »' : ''); }
    }, 120);
    return;
  }
  if (k === 'min' || k === 'max') {
    var b = priceBounds(), ins = el.parentNode.querySelectorAll('input'), lo = +ins[0].value, hi = +ins[1].value;
    if (lo > hi) { if (k === 'min') { lo = hi; ins[0].value = lo; } else { hi = lo; ins[1].value = hi; } }
    F.min = lo <= b[0] ? null : lo; F.max = hi >= b[1] ? null : hi; persist();
    document.getElementById('prlab').textContent = fmt(lo) + ' - ' + fmt(hi);
    var fl = document.getElementById('prfill'); fl.style.left = ((lo - b[0]) / (b[1] - b[0]) * 100) + '%'; fl.style.right = (100 - (hi - b[0]) / (b[1] - b[0]) * 100) + '%';
    var n2 = filtered().length; var fc = document.getElementById('fcount'); if (fc) fc.textContent = 'Voir ' + n2 + ' résultat' + (n2 > 1 ? 's' : '');
    return;
  }
  if (k === 'sort') { F.sort = v; persist(); rerender(); return; }
  if (k in ck) { ck[k] = v; persist(); document.querySelectorAll('[data-in="' + k + '"]').forEach(function (o) { if (o !== el) o.value = v; }); }
});
document.addEventListener('change', function (e) {
  var el = e.target;
  if (el.getAttribute && el.getAttribute('data-in') === 'zone') { ck.zone = el.value; persist(); }
  if (el.getAttribute && el.getAttribute('data-in') === 'sort') { F.sort = el.value; persist(); rerender(); }
  if (el.getAttribute && el.getAttribute('data-act') === 'adm-st-change') {
    var oid = el.getAttribute('data-id'), nst = el.value;
    var allO = getAdminOrders();
    allO.forEach(function (x) { if (x.id === oid) x.status = nst; });
    save('orders', allO);
    toast('Statut commande mis à jour : ' + nst);
    rerender();
  }
});
document.addEventListener('keydown', function (e) {
  var el = e.target;
  if (e.key === 'Enter' && el.getAttribute && /^(q|sq|dq)$/.test(el.getAttribute('data-in') || '') && el.value.trim()) {
    var v = el.value.trim(); recent = [v].concat(recent.filter(function (x) { return x !== v; })).slice(0, 5); persist(); el.blur();
  }
  if (e.key === 'Escape') {
    if (drawerOpen) { closeDrawer(); }
    var rm = document.getElementById('receipt-modal'); if (rm) rm.remove();
  }
});
document.addEventListener('submit', function (e) {
  var formType = e.target.getAttribute('data-form');
  if (formType === 'news') {
    e.preventDefault();
    window.open(waLink('Bonjour, je souhaite recevoir vos nouveaux arrivages sur WhatsApp.'), '_blank', 'noopener');
  }
  if (formType === 'auth-login') {
    e.preventDefault();
    var email = (document.getElementById('auth-email').value || '').trim().toLowerCase();
    var users = getUsers();
    var u = users.filter(function (x) { return x.email.toLowerCase() === email; })[0];
    if (!u) {
      u = addUser(email.split('@')[0], email, 'client', '+229 01 00 00 00', S.slug);
    }
    loginAs(u);
    if (u.role === 'superadmin' || u.role === 'gerant') location.hash = '#/admin';
    else location.hash = '#/compte';
  }
  if (formType === 'auth-register') {
    e.preventDefault();
    var rname = (document.getElementById('reg-name').value || '').trim();
    var remail = (document.getElementById('reg-email').value || '').trim().toLowerCase();
    var rphone = (document.getElementById('reg-phone').value || '').trim();
    var nu = addUser(rname, remail, 'client', rphone, S.slug);
    loginAs(nu);
    location.hash = '#/compte';
  }
  if (formType === 'add-admin-form') {
    e.preventDefault();
    var nName = (document.getElementById('new-user-name').value || '').trim();
    var nEmail = (document.getElementById('new-user-email').value || '').trim().toLowerCase();
    var nPhone = (document.getElementById('new-user-phone').value || '').trim();
    var nRole = document.getElementById('new-user-role').value;
    var nCave = document.getElementById('new-user-cave').value;
    addUser(nName, nEmail, nRole, nPhone, nCave);
    toast('Accès ' + nRole + ' créé avec succès');
    rerender();
  }
});

/* ---------- Smart Navbar (masquage au défilement vers le bas, réapparition au scroll haut) ---------- */
var lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
var navTicking = false;
window.addEventListener('scroll', function () {
  if (!navTicking) {
    window.requestAnimationFrame(function () {
      var currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      var dh = document.querySelector('.dh');
      var sh = document.querySelector('.sh');
      var diff = currentScrollY - lastScrollY;

      // Effet verre dépoli / ombre au défilement
      if (currentScrollY > 15) {
        if (dh) dh.classList.add('nav-scrolled');
        if (sh) sh.classList.add('nav-scrolled');
      } else {
        if (dh) dh.classList.remove('nav-scrolled');
        if (sh) sh.classList.remove('nav-scrolled');
      }

      // Masquage intelligent (Smart Navbar)
      if (currentScrollY > 90) {
        if (diff > 8) {
          if (dh) dh.classList.add('nav-hidden');
          if (sh) sh.classList.add('nav-hidden');
        } else if (diff < -8) {
          if (dh) dh.classList.remove('nav-hidden');
          if (sh) sh.classList.remove('nav-hidden');
        }
      } else {
        if (dh) dh.classList.remove('nav-hidden');
        if (sh) sh.classList.remove('nav-hidden');
      }

      lastScrollY = Math.max(0, currentScrollY);
      navTicking = false;
    });
    navTicking = true;
  }
}, { passive: true });

window.addEventListener('hashchange', function () { closeDrawer(); pdQty = 1; var r = parse(); if (r.name !== 'produit') galIdx = 0; if (r.name !== 'catalogue' && r.name !== 'filtres') { shown = 6; } if (r.name !== 'filtres' && r.name !== 'catalogue') dPanel = false; render(false); });
if (/[?&]mockup=1/.test(location.search)) document.body.classList.add('mockup');
render(false);
})();

