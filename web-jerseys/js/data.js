/* =========================================================================
   DORSAL — Guadalajara · Datos, configuración y generador de jerseys
   ========================================================================= */

/* --- Configuración de la tienda (EDITAR antes de producción) ------------ */
window.SHOP = {
  brand: "DORSAL",
  city: "Guadalajara, Jalisco",
  ownerEmail: "pedidos@dorsal.mx", // correo del dueño que recibe los pedidos
  whatsapp: "+52 33 0000 0000",
  currency: "MXN",
};

/* Imágenes reales usadas como PLACEHOLDER por ahora (todas Argentina).
   - PLACEHOLDER_IMG: foto que se muestra en la card y en la pestaña "Foto".
   - PLACEHOLDER_BLANK: misma camiseta con la espalda EN BLANCO (sin estampar)
     sobre la que se personaliza el dorsal en vivo. */
window.PLACEHOLDER_IMG = "assets/jerseys/argentina-back.jpg";
window.PLACEHOLDER_BLANK = "assets/jerseys/argentina-back-blank.jpg?v=4";

/* Calibración del overlay de personalización SOBRE FOTO (en % del cuadro
   de la imagen). Usado cuando una camiseta tiene foto de espalda EN BLANCO
   (sin estampar). Calibrado para la foto de Argentina (1:1). */
window.PHOTO_OVERLAY = {
  name: { cx: 50, cy: 18.5, h: 6.2, color: "#0f1f47" },
  number: { cx: 50, cy: 40, h: 30, color: "#0f1f47" },
};

/* --- Opciones de personalización (precios en MXN) ----------------------- */
window.OPTIONS = {
  versions: [
    { id: "aficionado", label: "Afición", extra: 0, note: "Corte regular, tela transpirable" },
    { id: "jugador", label: "Jugador", extra: 600, note: "Corte atlético, tela de competencia" },
  ],
  sizes: ["S", "M", "L", "XL", "XXL"],
  dorsalPrice: 250,
  patches: [
    { id: "ligamx", label: "Liga MX", tag: "LMX", extra: 120 },
    { id: "concacaf", label: "Concacaf", tag: "CCL", extra: 150 },
    { id: "campeon", label: "Campeón", tag: "★", extra: 120 },
    { id: "mexico", label: "Bandera MX", tag: "MX", extra: 80 },
  ],
};

/* --- Catálogo de clubes ------------------------------------------------- */
window.PRODUCTS = [
  {
    id: "chivas-local", club: "Chivas de Guadalajara", name: "Local 24/25", kit: "Local",
    season: "2024/25", city: "Guadalajara", featured: true, price: 1690, pattern: "stripes",
    colors: { primary: "#ffffff", secondary: "#c8102e", ink: "#c8102e" }, accent: "#e11b38",
    crest: "CDG", sponsor: "PUMA", tagline: "El rebaño se lleva en la piel.",
    desc: "La franja rojiblanca más icónica de México. Tejido ligero con perforación lateral para la calle o la cancha.",
    fabric: "100% poliéster reciclado · dry-fit",
  },
  {
    id: "atlas-local", club: "Atlas FC", name: "Local 24/25", kit: "Local",
    season: "2024/25", city: "Guadalajara", featured: true, price: 1690, pattern: "stripes",
    colors: { primary: "#000000", secondary: "#c8102e", ink: "#ffffff" }, accent: "#e11b38",
    crest: "ATL", sponsor: "ZALDÍVAR", tagline: "Rojinegro hasta la médula.",
    desc: "Los colores de la Furia en franjas verticales sobre negro absoluto. Cuello redondo con remate rojo.",
    fabric: "100% poliéster · ligero",
  },
  {
    id: "mexico-local", club: "Selección Mexicana", name: "Local 2024", kit: "Local",
    season: "2024", city: "México", featured: true, price: 1890, pattern: "solid",
    colors: { primary: "#0a5c36", secondary: "#ffffff", ink: "#ffffff" }, accent: "#1f8a52",
    crest: "FMF", sponsor: "ADIDAS", tagline: "Verde que se siente.",
    desc: "El verde de la Selección con detalles tonales y cuello tejido. Para el Tri y para presumir el escudo del águila.",
    fabric: "Aeroready · transpirable",
  },
  {
    id: "tigres-local", club: "Tigres UANL", name: "Local 24/25", kit: "Local",
    season: "2024/25", city: "Monterrey", featured: false, price: 1690, pattern: "solid",
    colors: { primary: "#ffb81c", secondary: "#003da5", ink: "#003da5" },
    crest: "UANL", sponsor: "CEMEX", tagline: "Amarillo incomparable.",
    desc: "El amarillo felino con cuello azul rey. Tejido de alto contraste que destaca el dorsal.",
    fabric: "100% poliéster · dry-fit",
  },
  {
    id: "america-local", club: "Club América", name: "Local 24/25", kit: "Local",
    season: "2024/25", city: "Ciudad de México", featured: false, price: 1690, pattern: "solid",
    colors: { primary: "#ffd100", secondary: "#0b1f4e", ink: "#0b1f4e" },
    crest: "CA", sponsor: "NIKE", tagline: "Odiame más.",
    desc: "Crema y azul, el kit más reconocible del continente. Acabado mate premium.",
    fabric: "Dri-FIT · corte estándar",
  },
  {
    id: "cruzazul-local", club: "Cruz Azul", name: "Local 24/25", kit: "Local",
    season: "2024/25", city: "Ciudad de México", featured: false, price: 1690, pattern: "stripes",
    colors: { primary: "#005baa", secondary: "#ffffff", ink: "#ffffff" }, accent: "#1577c9",
    crest: "CAZ", sponsor: "JOMA", tagline: "La Máquina celeste.",
    desc: "Azul cielo con franjas blancas y cuello clásico. El dorsal blanco resalta sobre el celeste.",
    fabric: "100% poliéster reciclado",
  },
  {
    id: "barcelona-local", club: "FC Barcelona", name: "Local 24/25", kit: "Local",
    season: "2024/25", city: "Barcelona", featured: false, price: 2290, pattern: "stripes",
    colors: { primary: "#a50044", secondary: "#004d98", ink: "#ffd100" }, accent: "#c4185f",
    crest: "FCB", sponsor: "SPOTIFY", tagline: "Més que un club.",
    desc: "El blaugrana auténtico en franjas verticales. Dorsal en dorado catalán.",
    fabric: "Dri-FIT ADV · player issue disponible",
  },
  {
    id: "realmadrid-local", club: "Real Madrid", name: "Local 24/25", kit: "Local",
    season: "2024/25", city: "Madrid", featured: false, price: 2290, pattern: "solid",
    colors: { primary: "#ffffff", secondary: "#cfa64b", ink: "#0b1f4e" }, accent: "#cfa64b",
    crest: "RM", sponsor: "EMIRATES", tagline: "Blanco inmaculado.",
    desc: "El blanco merengue con remates dorados. Acabado limpio que deja al dorsal como protagonista.",
    fabric: "Dri-FIT ADV · ligero",
  },
];

/* --- Colección MUNDIAL: selecciones favoritas --------------------------- */
window.WORLDCUP = [
  {
    id: "wc-argentina", club: "Argentina", name: "Local 2026", kit: "Selección", wc: true,
    season: "2026", city: "AFA", featured: true, price: 2190, pattern: "stripes",
    colors: { primary: "#ffffff", secondary: "#75aadb", ink: "#0f1f47" }, accent: "#75aadb",
    crest: "AFA", sponsor: "ADIDAS", tagline: "Campeones del mundo.",
    desc: "La albiceleste de las tres estrellas. Foto real de la versión Messi #10 — espalda lista para tu dorsal.",
    fabric: "HEAT.RDY · versión jugador disponible",
    img: "assets/jerseys/argentina-back.jpg", blankBack: false,
  },
  {
    id: "wc-brasil", club: "Brasil", name: "Local 2026", kit: "Selección", wc: true,
    season: "2026", city: "CBF", featured: false, price: 1990, pattern: "solid",
    colors: { primary: "#ffd400", secondary: "#1e8a4c", ink: "#1e8a4c" }, accent: "#f0c419",
    crest: "CBF", sponsor: "NIKE", tagline: "O canarinho.",
    desc: "El amarillo más temido del futbol, con cuello y vivos en verde. El dorsal verde sobre amarillo es puro Brasil.",
    fabric: "Dri-FIT · transpirable",
  },
  {
    id: "wc-francia", club: "Francia", name: "Local 2026", kit: "Selección", wc: true,
    season: "2026", city: "FFF", featured: false, price: 1990, pattern: "solid",
    colors: { primary: "#1a2a6c", secondary: "#ffffff", ink: "#ffffff" }, accent: "#2a3f8f",
    crest: "FFF", sponsor: "NIKE", tagline: "Les Bleus.",
    desc: "Azul profundo con detalles tricolor. Sobrio y elegante, el dorsal blanco resalta limpio.",
    fabric: "Dri-FIT ADV",
  },
  {
    id: "wc-espana", club: "España", name: "Local 2026", kit: "Selección", wc: true,
    season: "2026", city: "RFEF", featured: false, price: 1990, pattern: "solid",
    colors: { primary: "#b41229", secondary: "#ffd400", ink: "#ffd400" }, accent: "#d11f37",
    crest: "RFEF", sponsor: "ADIDAS", tagline: "La Roja.",
    desc: "El rojo de La Roja con remates amarillos. Dorsal en oro para un contraste de campeonato.",
    fabric: "HEAT.RDY",
  },
  {
    id: "wc-inglaterra", club: "Inglaterra", name: "Local 2026", kit: "Selección", wc: true,
    season: "2026", city: "ENG", featured: false, price: 1990, pattern: "solid",
    colors: { primary: "#ffffff", secondary: "#cf1020", ink: "#1a2a6c" }, accent: "#cf1020",
    crest: "ENG", sponsor: "NIKE", tagline: "Three Lions.",
    desc: "Blanco impecable con la cruz de San Jorge en los detalles. El dorsal azul marino es clásico inglés.",
    fabric: "Dri-FIT",
  },
  {
    id: "wc-portugal", club: "Portugal", name: "Local 2026", kit: "Selección", wc: true,
    season: "2026", city: "FPF", featured: false, price: 1990, pattern: "solid",
    colors: { primary: "#8a1538", secondary: "#0c6b3d", ink: "#ffd400" }, accent: "#b8253a",
    crest: "FPF", sponsor: "NIKE", tagline: "A Seleção.",
    desc: "Granate intenso con vivos verdes. El kit de CR7, con dorsal dorado que pide tu número.",
    fabric: "Dri-FIT ADV",
  },
  {
    id: "wc-alemania", club: "Alemania", name: "Local 2026", kit: "Selección", wc: true,
    season: "2026", city: "DFB", featured: false, price: 1990, pattern: "solid",
    colors: { primary: "#ffffff", secondary: "#1a1a1a", ink: "#1a1a1a" }, accent: "#b0b0b5",
    crest: "DFB", sponsor: "ADIDAS", tagline: "Die Mannschaft.",
    desc: "Blanco con la franja tricolor sobre el pecho. Minimalista y ganador — el dorsal negro manda.",
    fabric: "HEAT.RDY",
  },
  {
    id: "wc-mexico", club: "México", name: "Local 2026", kit: "Selección", wc: true,
    season: "2026", city: "FMF", featured: true, price: 2090, pattern: "solid",
    colors: { primary: "#0a5c36", secondary: "#ffffff", ink: "#ffffff" }, accent: "#1f8a52",
    crest: "FMF", sponsor: "ADIDAS", tagline: "Sede 2026.",
    desc: "El verde del Tri rumbo al Mundial en casa. Con el águila al pecho y tu apellido en la espalda.",
    fabric: "HEAT.RDY · edición Mundial",
  },
];

/* Asigna las fotos placeholder: card/Foto = imagen normal; Personalizar = espalda
   en blanco con overlay del dorsal en vivo (blankBack = true). */
[...window.PRODUCTS, ...window.WORLDCUP].forEach((p) => {
  if (!p.img) p.img = window.PLACEHOLDER_IMG;
  p.imgBack = p.imgBack || window.PLACEHOLDER_BLANK;
  p.blankBack = true;
});
/* Une selecciones al catálogo para que getProduct las encuentre */
window.PRODUCTS = window.PRODUCTS.concat(window.WORLDCUP);

window.getProduct = (id) => window.PRODUCTS.find((p) => p.id === id);

/* Acento visible del equipo: evita negros y blancos para glows, CTAs y
   estados activos. Prioriza accent explícito; si no, primary/secondary medios. */
window.teamAccent = (p) => {
  if (p.accent) return p.accent;
  const lum = (hex) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substr(0, 2), 16),
      g = parseInt(c.substr(2, 2), 16),
      b = parseInt(c.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const { primary, secondary } = p.colors;
  const lp = lum(primary);
  if (lp >= 0.18 && lp <= 0.82) return primary;
  const ls = lum(secondary);
  if (ls >= 0.18 && ls <= 0.82) return secondary;
  return "#2997ff";
};

/* =========================================================================
   Generador de jersey en SVG (vista de personalización / fallback sin foto)
   ========================================================================= */
(function () {
  let uid = 0;

  function contrastInk(hex) {
    const c = hex.replace("#", "");
    const r = parseInt(c.substr(0, 2), 16),
      g = parseInt(c.substr(2, 2), 16),
      b = parseInt(c.substr(4, 2), 16);
    const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return l > 0.6 ? "#0a0a0c" : "#ffffff";
  }

  const BODY =
    "M118,46 L96,40 L26,72 L58,124 L90,104 L80,332 L220,332 L210,104 L242,124 L274,72 L204,40 L182,46 C172,68 128,68 118,46 Z";

  function frontPattern(p, clip) {
    const { primary, secondary } = p.colors;
    let layer = `<rect x="0" y="0" width="300" height="372" fill="${primary}" clip-path="url(#${clip})"/>`;
    if (p.pattern === "stripes") {
      let stripes = "";
      for (let x = 18, i = 0; x < 286; x += 26, i++) {
        if (i % 2 === 1) stripes += `<rect x="${x}" y="0" width="13" height="372" fill="${secondary}"/>`;
      }
      layer += `<g clip-path="url(#${clip})">${stripes}</g>`;
    } else if (p.pattern === "sash") {
      layer += `<g clip-path="url(#${clip})"><polygon points="40,40 120,40 250,332 170,332" fill="${secondary}"/></g>`;
    } else if (p.pattern === "halves") {
      layer += `<g clip-path="url(#${clip})"><rect x="150" y="0" width="150" height="372" fill="${secondary}"/></g>`;
    }
    return layer;
  }

  function renderPatches(patches) {
    if (!patches || !patches.length) return "";
    const defs = window.OPTIONS.patches;
    let out = "";
    patches.slice(0, 3).forEach((pid, i) => {
      const def = defs.find((d) => d.id === pid);
      if (!def) return;
      const y = 96 + i * 30;
      out += `<g transform="translate(232,${y})"><rect width="26" height="26" rx="5" fill="#0a0a0c" stroke="rgba(255,255,255,.4)"/>
        <text x="13" y="18" text-anchor="middle" font-family="'Saira Condensed',sans-serif" font-weight="700" font-size="12" fill="#fff">${def.tag}</text></g>`;
    });
    return out;
  }

  function buildJersey(p, opts = {}) {
    const view = opts.view || "front";
    const scale = opts.scale || 1;
    const id = "j" + uid++;
    const clip = id + "c";
    const { primary, secondary, ink } = p.colors;

    const collar = `<path d="M118,46 C128,68 172,68 182,46" fill="none" stroke="${secondary}" stroke-width="9" stroke-linecap="round"/>`;
    const cuffs = `<polygon points="26,72 40,64 72,116 58,124" fill="${secondary}"/><polygon points="274,72 260,64 228,116 242,124" fill="${secondary}"/>`;
    const outline = `<path d="${BODY}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`;

    let inner = "";
    if (view === "front") {
      inner = `${frontPattern(p, clip)}${cuffs}${collar}
        <g transform="translate(104,118)"><rect width="30" height="36" rx="5" fill="${secondary}" stroke="rgba(255,255,255,.25)"/>
          <text x="15" y="24" text-anchor="middle" font-family="'Saira Condensed',sans-serif" font-weight="700" font-size="14" fill="${contrastInk(secondary)}">${p.crest}</text></g>
        <text x="150" y="200" text-anchor="middle" font-family="'Saira Condensed',sans-serif" font-weight="600" font-size="22" letter-spacing="2" fill="${contrastInk(primary)}" opacity=".85">${p.sponsor}</text>
        ${outline}`;
    } else {
      const number = (opts.number ?? "").toString().slice(0, 2);
      const name = (opts.name ?? "").toString().toUpperCase().slice(0, 12);
      const dorsalInk = ink || contrastInk(primary);
      inner = `<rect x="0" y="0" width="300" height="372" fill="${primary}" clip-path="url(#${clip})"/>${cuffs}${collar}
        <text x="150" y="132" text-anchor="middle" font-family="'Saira Condensed',sans-serif" font-weight="600" font-size="30" letter-spacing="3" fill="${dorsalInk}" opacity="${name.length ? 1 : 0.28}">${name.length ? name : "TU NOMBRE"}</text>
        <text x="150" y="258" text-anchor="middle" font-family="'Saira Condensed',sans-serif" font-weight="700" font-size="128" letter-spacing="-2" fill="${dorsalInk}" opacity="${number.length ? 1 : 0.28}">${number.length ? number : "00"}</text>
        ${renderPatches(opts.patches)}${outline}`;
    }

    return `<svg class="jersey jersey--${view}" viewBox="0 0 300 372" width="${300 * scale}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.club} ${p.name}">
      <defs><clipPath id="${clip}"><path d="${BODY}"/></clipPath></defs>${inner}</svg>`;
  }

  window.buildJersey = buildJersey;
})();
