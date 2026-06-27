/* =========================================================================
   DORSAL — Producto: foto real + personalizador en vivo + checkout por email
   ========================================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => "$" + n.toLocaleString("es-MX");

  const id = new URLSearchParams(location.search).get("id");
  const product = window.getProduct(id) || PRODUCTS[0];
  const teamColor = teamAccent(product);
  document.documentElement.style.setProperty("--team", teamColor);
  document.title = `${product.club} ${product.name} — DORSAL`;

  const state = {
    view: "photo", // 'photo' (foto real) | 'custom' (lienzo editable en vivo)
    version: "aficionado",
    size: "M",
    dorsal: false,
    name: "",
    number: "",
    patches: [],
    qty: 1,
  };

  /* --- Precio ---------------------------------------------------------- */
  function unitPrice() {
    let p = product.price;
    p += OPTIONS.versions.find((v) => v.id === state.version).extra;
    if (state.dorsal) p += OPTIONS.dorsalPrice;
    state.patches.forEach((pid) => {
      const def = OPTIONS.patches.find((d) => d.id === pid);
      if (def) p += def.extra;
    });
    return p;
  }
  const totalPrice = () => unitPrice() * state.qty;

  /* --- Lienzo editable (SVG espalda con dorsal en vivo) --------------- */
  function customSVG(scale = 1) {
    return buildJersey(product, {
      view: "back",
      scale,
      name: state.dorsal ? state.name : "",
      number: state.dorsal ? state.number : "",
      patches: state.patches,
    });
  }

  /* --- Foto real de la camiseta (pestaña Foto) ------------------------ */
  function fotoHTML() {
    return `<div class="viewer__photo-wrap"><img src="${product.img}" alt="${product.club} ${product.name}" /></div>`;
  }

  /* --- Parches superpuestos sobre la manga ---------------------------- */
  function patchesOverlay() {
    if (!state.patches.length) return "";
    return state.patches.slice(0, 3).map((pid, i) => {
      const d = OPTIONS.patches.find((x) => x.id === pid);
      return d ? `<span class="ov-patch" style="top:${21 + i * 9}%">${d.tag}</span>` : "";
    }).join("");
  }

  /* --- Espalda real EN BLANCO + dorsal en vivo (pestaña Personalizar) - */
  function personalizeHTML(wrapClass) {
    const o = PHOTO_OVERLAY;
    const hasName = state.dorsal && state.name;
    const hasNum = state.dorsal && state.number;
    const name = hasName ? state.name.toUpperCase() : "TU NOMBRE";
    const num = hasNum ? state.number : "00";
    return `<div class="${wrapClass || "viewer__photo-wrap"}">
      <img src="${product.imgBack}" alt="${product.club} espalda personalizable" />
      <div class="overlay-dorsal">
        <span class="ov-name" style="top:${o.name.cy}%;color:${o.name.color};opacity:${hasName ? 1 : 0.3}">${name}</span>
        <span class="ov-number" style="top:${o.number.cy}%;color:${o.number.color};opacity:${hasNum ? 1 : 0.3}">${num}</span>
        ${patchesOverlay()}
      </div>
    </div>`;
  }

  /* --- Render del visor según vista ----------------------------------- */
  function renderStage() {
    const stage = $("#stage");
    const note = $("#viewerNote");
    stage.classList.add("viewer__stage--photo");
    if (state.view === "photo") {
      stage.innerHTML = fotoHTML();
      note.innerHTML = "Camiseta oficial · foto real";
    } else {
      stage.innerHTML = personalizeHTML();
      note.innerHTML = state.dorsal
        ? "Tu dorsal sobre la camiseta real · en vivo"
        : "Activa “Personaliza tu dorsal” para escribir tu nombre y número";
    }
  }

  /* --- Layout ---------------------------------------------------------- */
  function renderLayout() {
    const versionSegs = OPTIONS.versions
      .map((v) => `<button class="segment ${state.version === v.id ? "active" : ""}" data-version="${v.id}">${v.label}<small>${v.extra ? "+" + money(v.extra) : v.note}</small></button>`)
      .join("");
    const sizeSegs = OPTIONS.sizes
      .map((s) => `<button class="segment ${state.size === s ? "active" : ""}" data-size="${s}">${s}</button>`)
      .join("");
    const patchCards = OPTIONS.patches
      .map((p) => `<div class="patch ${state.patches.includes(p.id) ? "active" : ""}" data-patch="${p.id}" role="checkbox" aria-checked="${state.patches.includes(p.id)}" tabindex="0">
        <span class="patch__box"></span><span class="patch__label">${p.label}<small>+${money(p.extra)}</small></span></div>`)
      .join("");

    $("#pdpLayout").innerHTML = `
      <div class="viewer">
        <div class="viewer__stage viewer__stage--photo" id="stage"></div>
        <div class="viewer__toggleWrap">
          <div class="viewer__toggle">
            <button data-view="photo" class="${state.view === "photo" ? "active" : ""}">Foto</button>
            <button data-view="custom" class="${state.view === "custom" ? "active" : ""}">Personalizar</button>
          </div>
        </div>
        <div class="viewer__note" id="viewerNote"></div>
      </div>

      <div class="buy">
        <div class="eyebrow buy__eyebrow">${product.wc ? "Colección Mundial" : product.city}</div>
        <h1 class="display">${product.club}</h1>
        <p class="buy__sub">${product.name} · ${product.season}</p>
        <div class="buy__price" id="unitPrice">${money(unitPrice())} <span>${SHOP.currency}</span></div>
        <p class="buy__desc">${product.desc}<br /><span class="dim">${product.fabric}</span></p>

        <div class="field">
          <div class="field__label">Versión</div>
          <div class="segments" id="versionSegs">${versionSegs}</div>
        </div>
        <div class="field">
          <div class="field__label">Talla <a class="hint" href="#" data-noop>Guía de tallas</a></div>
          <div class="segments" id="sizeSegs">${sizeSegs}</div>
        </div>

        <div class="switch-row">
          <div class="switch-row__txt">
            <strong>Personaliza tu dorsal</strong>
            <small>Nombre y número en la espalda · +${money(OPTIONS.dorsalPrice)}</small>
          </div>
          <button class="switch ${state.dorsal ? "on" : ""}" id="dorsalSwitch" role="switch" aria-checked="${state.dorsal}" aria-label="Activar dorsal personalizado"></button>
        </div>

        <div class="field" id="dorsalFields" ${state.dorsal ? "" : "hidden"}>
          <div class="field__label">Nombre y número</div>
          <div class="input-row">
            <input class="input" id="nameInput" maxlength="12" placeholder="Tu apellido" value="${state.name}" />
            <input class="input" id="numberInput" inputmode="numeric" maxlength="2" placeholder="00" value="${state.number}" />
          </div>
        </div>

        <div class="field">
          <div class="field__label">Parches <span class="hint">opcional</span></div>
          <div class="patches" id="patches">${patchCards}</div>
        </div>

        <div class="field">
          <div class="field__label">Cantidad</div>
          <div class="segments" id="qtySegs">
            ${[1, 2, 3, 4].map((q) => `<button class="segment ${state.qty === q ? "active" : ""}" data-qty="${q}">${q}</button>`).join("")}
          </div>
        </div>
      </div>`;

    bindLayout();
    renderStage();
    updatePrice();
  }

  function updatePrice() {
    const u = unitPrice();
    if ($("#unitPrice")) $("#unitPrice").innerHTML = `${money(u)} <span>${SHOP.currency}</span>`;
    $("#barTotal").textContent = money(totalPrice());
    $("#barCalc").textContent = state.qty > 1 ? `${money(u)} c/u × ${state.qty}` : "Envío e impuestos al confirmar";
    $("#buybar").hidden = false;
  }

  function setView(v) {
    state.view = v;
    $$("[data-view]").forEach((x) => x.classList.toggle("active", x.dataset.view === v));
    renderStage();
  }

  /* --- Bindings -------------------------------------------------------- */
  function bindLayout() {
    $$("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
    $$("[data-version]").forEach((b) => b.addEventListener("click", () => {
      state.version = b.dataset.version;
      $$("[data-version]").forEach((x) => x.classList.toggle("active", x === b));
      updatePrice();
    }));
    $$("[data-size]").forEach((b) => b.addEventListener("click", () => {
      state.size = b.dataset.size;
      $$("[data-size]").forEach((x) => x.classList.toggle("active", x === b));
    }));
    $$("[data-qty]").forEach((b) => b.addEventListener("click", () => {
      state.qty = +b.dataset.qty;
      $$("[data-qty]").forEach((x) => x.classList.toggle("active", x === b));
      updatePrice();
    }));

    $("#dorsalSwitch").addEventListener("click", () => {
      state.dorsal = !state.dorsal;
      $("#dorsalSwitch").classList.toggle("on", state.dorsal);
      $("#dorsalSwitch").setAttribute("aria-checked", state.dorsal);
      $("#dorsalFields").hidden = !state.dorsal;
      // al activar: salta a personalizar; al desactivar: vuelve a la foto original
      setView(state.dorsal ? "custom" : "photo");
      updatePrice();
    });

    const nameInput = $("#nameInput");
    const numberInput = $("#numberInput");
    if (nameInput) nameInput.addEventListener("input", (e) => {
      state.name = e.target.value.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ .\-]/g, "");
      e.target.value = state.name;
      renderStage();
    });
    if (numberInput) numberInput.addEventListener("input", (e) => {
      state.number = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
      e.target.value = state.number;
      renderStage();
    });

    $$("[data-patch]").forEach((el) => {
      const toggle = () => {
        const pid = el.dataset.patch;
        const i = state.patches.indexOf(pid);
        if (i >= 0) state.patches.splice(i, 1);
        else state.patches.push(pid);
        el.classList.toggle("active");
        el.setAttribute("aria-checked", state.patches.includes(pid));
        renderStage();
        updatePrice();
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } });
    });
    $$("[data-noop]").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
  }

  /* =====================================================================
     CHECKOUT
     ===================================================================== */
  const sheet = $("#sheet");
  const sheetPanel = $("#sheetPanel");

  function orderSummaryRows() {
    const rows = [];
    const v = OPTIONS.versions.find((x) => x.id === state.version);
    rows.push([`${product.club} ${product.name}`, money(product.price)]);
    rows.push([`Versión ${v.label}`, v.extra ? "+" + money(v.extra) : "incluida"]);
    if (state.dorsal) rows.push([`Dorsal ${state.name || "—"} #${state.number || "—"}`, "+" + money(OPTIONS.dorsalPrice)]);
    state.patches.forEach((pid) => {
      const d = OPTIONS.patches.find((x) => x.id === pid);
      rows.push([`Parche ${d.label}`, "+" + money(d.extra)]);
    });
    rows.push([`Talla ${state.size} · Cantidad ${state.qty}`, ""]);
    return rows;
  }

  function openCheckout() {
    const rows = orderSummaryRows().map((r) => `<div class="order-line"><span>${r[0]}</span><span>${r[1]}</span></div>`).join("");
    sheetPanel.innerHTML = `
      <div class="sheet__head"><h3>Confirmar pedido</h3><button class="sheet__close" data-close aria-label="Cerrar">✕</button></div>
      <div class="order-summary">
        ${personalizeHTML("mini-photo-wrap")}
        <div class="order-summary__meta">
          <strong>${product.club} · ${product.name}</strong>
          Talla ${state.size} · ${OPTIONS.versions.find((v) => v.id === state.version).label}
          ${state.dorsal ? `<br/>Dorsal: ${state.name || "—"} #${state.number || "—"}` : ""}
          ${state.patches.length ? `<br/>Parches: ${state.patches.map((p) => OPTIONS.patches.find((d) => d.id === p).label).join(", ")}` : ""}
        </div>
      </div>
      <div style="margin:14px 0 6px">${rows}
        <div class="order-line total"><span>Total (${state.qty})</span><span>${money(totalPrice())}</span></div>
      </div>
      <form id="orderForm">
        <div class="form-grid">
          <div class="full"><label class="flabel" for="cName">Nombre completo</label><input class="input" id="cName" name="nombre" required placeholder="Tu nombre" /></div>
          <div><label class="flabel" for="cPhone">Teléfono / WhatsApp</label><input class="input" id="cPhone" name="telefono" required inputmode="tel" placeholder="33 1234 5678" /></div>
          <div><label class="flabel" for="cEmail">Tu correo</label><input class="input" id="cEmail" name="email_cliente" required type="email" placeholder="tu@correo.com" /></div>
          <div class="full"><label class="flabel" for="cDelivery">Entrega</label>
            <select class="select" id="cDelivery" name="entrega">
              <option value="Recoger en tienda (Guadalajara)">Recoger en tienda · Guadalajara</option>
              <option value="Envío a domicilio">Envío a domicilio (toda la República)</option>
            </select></div>
          <div class="full"><label class="flabel" for="cNotes">Notas para el pedido <span class="dim">(opcional)</span></label>
            <textarea class="textarea" id="cNotes" name="notas" placeholder="Dirección de envío, referencias, dudas…"></textarea></div>
        </div>
        <div style="margin-top:22px">
          <button type="submit" class="btn btn--team btn--block btn--lg" id="submitBtn">Enviar pedido · ${money(totalPrice())}</button>
          <p class="dim" style="font-size:12px; text-align:center; margin-top:12px">Recibimos tu pedido en ${SHOP.brand} y te contactamos para confirmar pago y entrega.</p>
        </div>
      </form>`;
    sheet.classList.add("open");
    document.body.style.overflow = "hidden";
    $$("[data-close]", sheet).forEach((el) => el.addEventListener("click", closeCheckout));
    $("#orderForm").addEventListener("submit", submitOrder);
  }

  function closeCheckout() {
    sheet.classList.remove("open");
    document.body.style.overflow = "";
  }

  function buildOrderPayload(customer) {
    const orderId = "DOR-" + Date.now().toString(36).toUpperCase().slice(-6);
    const v = OPTIONS.versions.find((x) => x.id === state.version);
    const lines = orderSummaryRows().map((r) => `${r[0]}${r[1] ? "  —  " + r[1] : ""}`).join("\n");
    const resumen =
`PEDIDO ${orderId} · ${SHOP.brand}
────────────────────────────
Camiseta:  ${product.club} ${product.name} (${product.season})
Versión:   ${v.label}
Talla:     ${state.size}
Cantidad:  ${state.qty}
Dorsal:    ${state.dorsal ? `${state.name || "—"} #${state.number || "—"}` : "Sin personalizar"}
Parches:   ${state.patches.length ? state.patches.map((p) => OPTIONS.patches.find((d) => d.id === p).label).join(", ") : "Ninguno"}

Desglose:
${lines}
TOTAL:     ${money(totalPrice())} ${SHOP.currency}
────────────────────────────
Cliente:   ${customer.nombre}
Teléfono:  ${customer.telefono}
Correo:    ${customer.email_cliente}
Entrega:   ${customer.entrega}
Notas:     ${customer.notas || "—"}`;
    return { orderId, resumen };
  }

  async function submitOrder(e) {
    e.preventDefault();
    const btn = $("#submitBtn");
    const customer = Object.fromEntries(new FormData(e.target).entries());
    const { orderId, resumen } = buildOrderPayload(customer);
    btn.disabled = true;
    btn.textContent = "Enviando pedido…";

    const payload = {
      _subject: `🛒 Nuevo pedido ${orderId} — ${product.club} ${product.name}`,
      _template: "box",
      pedido: orderId, camiseta: `${product.club} ${product.name}`, total: money(totalPrice()),
      cliente: customer.nombre, telefono: customer.telefono, correo_cliente: customer.email_cliente,
      entrega: customer.entrega, notas: customer.notas || "—", resumen_completo: resumen,
    };

    let sent = false;
    try {
      const res = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(SHOP.ownerEmail), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      sent = res.ok;
    } catch (err) { sent = false; }

    if (!sent) {
      const mailto = `mailto:${SHOP.ownerEmail}?subject=${encodeURIComponent("Pedido " + orderId + " — " + product.club)}&body=${encodeURIComponent(resumen)}`;
      window.open(mailto, "_blank");
    }
    showSuccess(orderId, customer.email_cliente);
  }

  function showSuccess(orderId, email) {
    sheetPanel.innerHTML = `
      <div class="success">
        <div class="success__check">✓</div>
        <h3>¡Pedido enviado!</h3>
        <p>Mandamos tu pedido a <strong>${SHOP.brand}</strong> en Guadalajara. Te contactaremos a <strong>${email}</strong> para confirmar pago y entrega.</p>
        <div class="order-id">${orderId}</div>
        <button class="btn btn--ghost btn--block" data-close>Listo</button>
      </div>`;
    $$("[data-close]", sheet).forEach((el) => el.addEventListener("click", closeCheckout));
    toast("Pedido " + orderId + " enviado");
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* --- Init ------------------------------------------------------------ */
  renderLayout();
  $("#checkoutBtn").addEventListener("click", openCheckout);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCheckout(); });
})();
