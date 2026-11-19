(() => {
  "use strict";

  const init = () => {
    const $ = (selector) => document.querySelector(selector);
    const products = Array.isArray(window.FOURDRESS_PRODUCTS) ? window.FOURDRESS_PRODUCTS : [];
    const grid = $("#productGrid");
    if (!grid) {
      console.error("FOUR DRESS: no se encontró #productGrid.");
      return;
    }

    const money = (value) => value == null
      ? "A consultar"
      : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

    let cart = [];
    try {
      const saved = JSON.parse(localStorage.getItem("fourDressCart") || "[]");
      if (Array.isArray(saved)) cart = saved;
    } catch (error) {
      console.warn("No se pudo recuperar el carrito guardado.", error);
    }

    let activeProduct = null;
    let modalQty = 1;
    let toastTimer;

    const saveCart = () => {
      try { localStorage.setItem("fourDressCart", JSON.stringify(cart)); }
      catch (error) { console.warn("No se pudo guardar el carrito.", error); }
    };

    const showToast = (message) => {
      const toast = $("#toast");
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
    };

    function renderProducts(filter = "Todos") {
      grid.replaceChildren();
      products.filter(p => filter === "Todos" || p.category === filter).forEach(p => {
        const card = document.createElement("article");
        card.className = "product-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Ver ${p.name}, ${p.variant}`);
        card.innerHTML = `
          <div class="hanger"><span></span></div>
          <div class="product-visual">
            <span class="product-number">FD / ${String(products.indexOf(p) + 1).padStart(2, "0")}</span>
            <img src="${p.image}" alt="${p.name} ${p.variant}" loading="lazy">
            <span class="product-open" aria-hidden="true">VER PRENDA ↗</span>
          </div>
          <div class="product-meta">
            <div><div class="product-name">${p.name}</div><div class="product-variant">${p.variant}</div></div>
            <div class="product-price">${money(p.price)}</div>
          </div>`;
        card.addEventListener("click", () => openProduct(p));
        card.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProduct(p);
          }
        });
        grid.appendChild(card);
      });
    }

    function openProduct(product) {
      activeProduct = product;
      modalQty = 1;
      $("#modalImage").src = product.image;
      $("#modalImage").alt = product.name + " " + product.variant + " - frente";
      $("#modalName").textContent = product.name;
      $("#modalVariant").textContent = product.variant;
      $("#modalCategory").textContent = "FOUR DRESS / " + product.category.toUpperCase();
      $("#modalDescription").textContent = product.description || "";
      $("#modalQty").textContent = modalQty;
      renderGarmentViews(product);
      $("#productModal").classList.add("open");
      $("#productModal").setAttribute("aria-hidden", "false");
    }

    function renderGarmentViews(product) {
      const controls = $("#garmentViews");
      const frame = $(".modal-image-wrap");
      const image = $("#modalImage");
      controls.replaceChildren();
      frame.classList.remove("view-front", "view-back", "combined-views");

      if (product.combinedViews) {
        frame.classList.add("combined-views", "view-front");
        image.src = product.image;
        image.alt = product.name + " " + product.variant + " - frente";
        [["front", "FRENTE"], ["back", "ESPALDA"]].forEach(([key, label]) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = label;
          button.classList.toggle("active", key === "front");
          button.addEventListener("click", () => {
            frame.classList.toggle("view-front", key === "front");
            frame.classList.toggle("view-back", key === "back");
            image.alt = product.name + " " + product.variant + " - " + label.toLowerCase();
            controls.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
          });
          controls.appendChild(button);
        });
        $("#viewNote").textContent = "Vistas separadas desde la fotografía original.";
        return;
      }

      const views = product.views || { front: product.image };
      const labels = [["front", "FRENTE"], ["side", "COSTADO"], ["back", "ESPALDA"]];
      labels.forEach(([key, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.disabled = !views[key];
        button.classList.toggle("active", key === "front");
        button.addEventListener("click", () => {
          if (!views[key]) return;
          image.src = views[key];
          image.alt = product.name + " " + product.variant + " - " + label.toLowerCase();
          controls.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
          $("#viewNote").textContent = "";
        });
        controls.appendChild(button);
      });
      const missing = labels.filter(([key]) => !views[key]).map(([, label]) => label.toLowerCase());
      $("#viewNote").textContent = missing.length
        ? "Las fotos de " + missing.join(" y ") + " se pueden sumar cuando estén disponibles."
        : "";
    }

    function closeProduct() {
      $("#productModal").classList.remove("open");
      $("#productModal").setAttribute("aria-hidden", "true");
    }

    function renderCart() {
      $("#cartCount").textContent = cart.reduce((sum, item) => sum + item.qty, 0);
      const items = $("#cartItems");
      if (!cart.length) {
        items.innerHTML = '<div class="empty-cart">TU CARRITO ESTÁ VACÍO.<br><span>Hay algo esperando en la colección.</span></div>';
      } else {
        items.replaceChildren();
        cart.forEach((item, index) => {
          const row = document.createElement("div");
          row.className = "cart-row";
          row.innerHTML = `<img src="${item.image}" alt="">
            <div><h3>${item.name}</h3><p>${item.variant} · Talle ${item.size}</p>
            <button type="button" data-remove="${index}">ELIMINAR</button><span class="row-qty">× ${item.qty}</span></div>
            <strong>${money(item.price)}</strong>`;
          items.appendChild(row);
        });
      }
      const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);
      $("#cartTotal").textContent = cart.some(item => item.price == null) ? "A consultar" : money(total);
      saveCart();
    }

    const openCart = () => {
      document.body.classList.add("cart-open");
      $("#cartDrawer").setAttribute("aria-hidden", "false");
    };
    const closeCart = () => {
      document.body.classList.remove("cart-open");
      $("#cartDrawer").setAttribute("aria-hidden", "true");
    };
    const closeCheckout = () => {
      $("#checkoutModal").classList.remove("open");
      $("#checkoutModal").setAttribute("aria-hidden", "true");
    };

    $("#filters").addEventListener("click", event => {
      const button = event.target.closest(".filter");
      if (!button) return;
      document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      renderProducts(button.dataset.filter || "Todos");
    });

    $("#modalClose").addEventListener("click", closeProduct);
    $("#modalBackdrop").addEventListener("click", closeProduct);
    $("#qtyMinus").addEventListener("click", () => {
      modalQty = Math.max(1, modalQty - 1);
      $("#modalQty").textContent = modalQty;
    });
    $("#qtyPlus").addEventListener("click", () => {
      modalQty = Math.min(10, modalQty + 1);
      $("#modalQty").textContent = modalQty;
    });
    $("#addToCart").addEventListener("click", () => {
      if (!activeProduct) return;
      const size = $("#sizeSelect").value;
      const existing = cart.find(item => item.id === activeProduct.id && item.size === size);
      if (existing) existing.qty += modalQty;
      else cart.push({ ...activeProduct, size, qty: modalQty });
      renderCart();
      closeProduct();
      showToast("AGREGADO A TU CARRITO");
    });

    $("#cartItems").addEventListener("click", event => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      cart.splice(Number(button.dataset.remove), 1);
      renderCart();
    });

    $("#openCart").addEventListener("click", openCart);
    $("#closeCart").addEventListener("click", closeCart);
    $("#cartBackdrop").addEventListener("click", closeCart);
    $("#checkoutButton").addEventListener("click", () => {
      if (!cart.length) {
        showToast("TU CARRITO ESTÁ VACÍO");
        return;
      }
      closeCart();
      $("#checkoutModal").classList.add("open");
      $("#checkoutModal").setAttribute("aria-hidden", "false");
    });
    $("#checkoutClose").addEventListener("click", closeCheckout);
    $("#checkoutBackdrop").addEventListener("click", closeCheckout);
    $("#checkoutForm").addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const lines = cart.map(item =>
        `- ${item.name} / ${item.variant} / Talle ${item.size} / Cantidad: ${item.qty} / Precio: ${money(item.price)}`
      ).join("\n");
      const total = cart.some(item => item.price == null)
        ? "A consultar"
        : money(cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0));
      const body = `Hola FOUR DRESS, quiero realizar este pedido:\n\n${lines}\n\nSubtotal: ${total}\n\nNombre: ${data.get("name")}\nEmail: ${data.get("email")}\nTeléfono: ${data.get("phone")}\nComentarios: ${data.get("notes") || "Sin comentarios"}\n\nQuedo atento/a a la confirmación de disponibilidad y medios de pago.`;
      window.location.href = `mailto:alanlacombe01@gmail.com?subject=${encodeURIComponent("Pedido FOUR DRESS")}&body=${encodeURIComponent(body)}`;
      closeCheckout();
    });

    $("#menuToggle").addEventListener("click", () => $(".main-nav").classList.toggle("open"));
    document.querySelectorAll(".main-nav a").forEach(link =>
      link.addEventListener("click", () => $(".main-nav").classList.remove("open"))
    );
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeProduct();
        closeCheckout();
        closeCart();
      }
    });

    renderProducts();
    renderCart();
    console.info("FOUR DRESS: interacciones inicializadas.", { products: products.length });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
