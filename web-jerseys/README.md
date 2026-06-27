# DORSAL — Tienda de jerseys de futbol (Guadalajara)

Sitio de e-commerce para retail de jerseys personalizadas. Estilo Apple sobre **negro absoluto**, con parallax, scroll-reveals y un personalizador de dorsal en vivo. Sin build: HTML/CSS/JS puro.

## Cómo verlo en local

**Opción rápida (Windows):** doble clic en `abrir.bat`
→ abre `http://localhost:5500`

**Con PowerShell:** clic derecho en `iniciar.ps1` → *Ejecutar con PowerShell*

**Manual:**
```bash
cd web-jerseys
python -m http.server 5500
# abrir http://localhost:5500
```

> Ábrelo siempre vía `http://localhost`, no con doble clic al `index.html` (los `fetch` del checkout requieren servidor).

## Qué incluye

- **Home** (`index.html`): hero con jersey en parallax → catálogo en grilla con reveal al hacer scroll. Cada producto es una card clickeable.
- **Producto** (`producto.html?id=...`): visor frente/dorsal, selección de **versión** (afición/jugador), **talla**, **dorsal** (nombre + número con vista previa en vivo), **parches** (Liga MX, Concacaf, campeón, bandera MX) y cantidad. Precio en vivo.
- **Checkout**: recoge datos del cliente y **envía el pedido completo por email al dueño de la tienda**.

## Configurar el correo que recibe los pedidos

Edita `js/data.js` → `SHOP.ownerEmail`:

```js
window.SHOP = {
  ownerEmail: "pedidos@tutienda.mx",   // <- cámbialo
  whatsapp: "+52 33 ...",
};
```

El envío usa [FormSubmit](https://formsubmit.co) (gratis, sin backend). **La primera vez**, FormSubmit manda un correo de activación a esa dirección: ábrelo y confirma una vez. Después, cada pedido llega a esa bandeja.
Si el POST falla (sin internet), el sitio abre automáticamente el correo del cliente con el pedido ya redactado como respaldo.

## Estructura

```
web-jerseys/
├── index.html          # home
├── producto.html       # detalle + checkout
├── css/styles.css      # sistema de diseño (Apple · negro)
└── js/
    ├── data.js         # catálogo + config + generador de jersey SVG
    ├── home.js         # parallax, reveals, render de catálogo
    └── producto.js     # personalizador en vivo + envío de pedido
```

## Personalizar el catálogo

Agrega o edita productos en `js/data.js` → `window.PRODUCTS`. Cada jersey define colores (`primary`/`secondary`/`ink`), patrón (`stripes`/`solid`/`sash`/`halves`), escudo, precio y descripción. El gráfico de la camiseta se genera por código (SVG), sin necesidad de fotos.
