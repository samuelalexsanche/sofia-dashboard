/* =========================================================================
   DORSAL — Home: catálogo con fotos reales, colección Mundial, parallax
   ========================================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Contacto en footer --------------------------------------------- */
  $("#year").textContent = new Date().getFullYear();
  const fm = $("#footMail");
  if (fm) { fm.textContent = SHOP.ownerEmail; fm.href = "mailto:" + SHOP.ownerEmail; }
  const fw = $("#footWa");
  if (fw) fw.textContent = "WhatsApp " + SHOP.whatsapp;

  /* --- Hero con foto real + parallax ---------------------------------- */
  const heroProduct = getProduct("wc-argentina");
  const heroJersey = $("#heroJersey");
  heroJersey.innerHTML = `<img src="${heroProduct.img}" alt="Camiseta Argentina espalda Messi 10" />`;
  heroJersey.style.setProperty("--team", teamAccent(heroProduct));

  const glow = $("#heroGlow");
  if (!reduce) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        heroJersey.style.transform = `translateY(${y * 0.16}px) scale(${1 - Math.min(y / 4200, 0.05)})`;
        glow.style.transform = `translate(-50%, calc(-50% + ${y * 0.25}px))`;
        $("#nav").classList.toggle("scrolled", y > 12);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  } else {
    window.addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", window.scrollY > 12), { passive: true });
  }

  /* --- Card de catálogo (foto real, fallback SVG si falla la imagen) --- */
  function cardHTML(p, tagText, tagClass) {
    return `
      <a class="card reveal" href="producto.html?id=${p.id}" style="--team:${teamAccent(p)}">
        <div class="card__top">
          <div>
            <div class="card__club">${p.club}</div>
            <div class="card__kit">${p.name} · ${p.season}</div>
          </div>
          <span class="${tagClass}">${tagText}</span>
        </div>
        <div class="card__stage card__stage--photo">
          <img src="${p.img}" alt="${p.club} ${p.name}" loading="lazy" decoding="async" width="230" height="230" data-fallback="${p.id}" />
        </div>
        <div class="card__foot">
          <div class="card__price">$${p.price.toLocaleString("es-MX")}<span>${SHOP.currency}</span></div>
          <span class="card__cta">Personalizar →</span>
        </div>
      </a>`;
  }

  // Fallback: si una foto no carga, sustituye por el mockup SVG del equipo
  function wireFallbacks(root) {
    root.querySelectorAll("img[data-fallback]").forEach((img) => {
      img.addEventListener("error", () => {
        const p = getProduct(img.getAttribute("data-fallback"));
        if (!p) return;
        const stage = img.parentElement;
        stage.classList.remove("card__stage--photo");
        stage.innerHTML = buildJersey(p, { view: "front", scale: 1 });
      });
    });
  }

  /* --- Catálogo de clubes (destacados de GDL primero) ------------------ */
  const clubs = PRODUCTS.filter((p) => !p.wc).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  $("#catalogGrid").innerHTML = clubs
    .map((p) => cardHTML(p, p.featured ? "Guadalajara" : p.kit, "card__tag"))
    .join("");
  wireFallbacks($("#catalogGrid"));

  /* --- Colección Mundial ---------------------------------------------- */
  const wcShelf = $("#wcShelf");
  if (wcShelf) {
    wcShelf.innerHTML = WORLDCUP.map((p) => cardHTML(p, "Mundial", "card__flag")).join("");
    wireFallbacks(wcShelf);
  }

  /* --- Arte del bloque "personaliza" (foto real de la espalda) -------- */
  const featArt = $("#featureArt");
  if (featArt) {
    featArt.innerHTML = `<div class="card__stage card__stage--photo" style="width:100%;max-width:300px">
        <img src="${heroProduct.img}" alt="Espalda personalizable Argentina" /></div>`;
    featArt.style.setProperty("--team", teamAccent(heroProduct));
  }

  /* --- Banda de equipos ----------------------------------------------- */
  $("#teamsStrip").innerHTML = PRODUCTS
    .map((p) => `<a class="team-chip" href="producto.html?id=${p.id}" style="--team:${teamAccent(p)}">${p.club}</a>`)
    .join("");

  /* --- Scroll reveal -------------------------------------------------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    $("#catalogGrid").querySelectorAll(".card").forEach((c, i) => c.setAttribute("data-delay", String(i % 3)));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }
})();
