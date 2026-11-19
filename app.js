(() => {
  "use strict";

  const init = () => {
    const $ = (selector) => document.querySelector(selector);
    const products = Array.isArray(window.FOURDRESS_PRODUCTS) ? window.FOURDRESS_PRODUCTS : [];
    const themeToggle = $("#themeToggle");
    const themeColor = $("#themeColor");
    const applyTheme = (theme) => {
      const dark = theme === "dark";
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      if (themeToggle) {
        themeToggle.querySelector(".theme-toggle-icon").textContent = dark ? "☀" : "☾";
        themeToggle.querySelector(".theme-toggle-label").textContent = dark ? "MODO CLARO" : "MODO OSCURO";
        themeToggle.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
        themeToggle.title = dark ? "Activar modo claro" : "Activar modo oscuro";
      }
      if (themeColor) themeColor.setAttribute("content", dark ? "#090909" : "#f4f4f2");
    };
    let savedTheme = "light";
    try {
      const storedTheme = localStorage.getItem("fourDressTheme");
      if (storedTheme === "dark" || storedTheme === "light") savedTheme = storedTheme;
    } catch (error) {
      console.warn("No se pudo recuperar la preferencia de tema.", error);
    }
    applyTheme(savedTheme);
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        try { localStorage.setItem("fourDressTheme", nextTheme); }
        catch (error) { console.warn("No se pudo guardar la preferencia de tema.", error); }
      });
    }
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
      frame.classList.remove("view-front", "view-back", "combined-views", "vertical-views");
      let currentView = "front";

      // Las placas originales de FOUR DRESS muestran dos vistas apiladas:
      // se recorta la mitad superior/inferior y se permite girar arrastrando.
      const views = product.views || {};
      const hasTwoViews = product.combinedViews || (!views.front && !views.back);
      if (hasTwoViews) {
        frame.classList.add("vertical-views", "view-front");
        image.src = product.image;
        image.alt = product.name + " " + product.variant + " - frente";
        const setView = (view) => {
          currentView = view;
          frame.classList.toggle("view-front", view === "front");
          frame.classList.toggle("view-back", view === "back");
          image.alt = product.name + " " + product.variant + (view === "front" ? " - vista superior" : " - vista inferior");
          controls.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.view === view));
        };
        [["front","VISTA 1"],["back","VISTA 2"]].forEach(([key,label]) => {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.view = key;
          button.textContent = label;
          button.classList.toggle("active", key === "front");
          button.addEventListener("click", () => setView(key));
          controls.appendChild(button);
        });

        let dragStartX = null;
        frame.onpointerdown = event => {
          if (event.target.closest(".garment-views")) return;
          dragStartX = event.clientX;
        };
        frame.onpointerup = event => {
          if (dragStartX === null) return;
          const delta = event.clientX - dragStartX;
          if (Math.abs(delta) > 22) setView(delta < 0 ? "back" : "front");
          dragStartX = null;
        };
        frame.onpointercancel = () => { dragStartX = null; };
        $("#viewNote").textContent = "Arrastrá a izquierda o derecha para alternar las dos vistas incluidas en la foto original.";
        return;
      }

      frame.onpointerdown = null;
      frame.onpointerup = null;
      frame.onpointercancel = null;
      const available = product.views || { front: product.image };
      [["front","FRENTE"],["side","COSTADO"],["back","ESPALDA"]].forEach(([key,label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.disabled = !available[key];
        button.classList.toggle("active", key === "front");
        button.addEventListener("click", () => {
          if (!available[key]) return;
          image.src = available[key];
          image.alt = product.name + " " + product.variant + " - " + label.toLowerCase();
          controls.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
          $("#viewNote").textContent = "";
        });
        controls.appendChild(button);
      });
      $("#viewNote").textContent = "Las vistas adicionales se incorporarán cuando estén generadas y revisadas.";
    }

    function closeProduct() {
      $("#productModal").classList.remove("open");
      $("#productModal").setAttribute("aria-hidden", "true");
    }
    const productUrl = product => {
      const url = new URL(window.location.href);
      url.search = "";
      url.hash = "";
      url.searchParams.set("producto", product.id);
      return url.toString();
    };

    function shareProduct(product) {
      if (!product) return;
      const url = productUrl(product);
      const text = `Mirá ${product.name} ${product.variant} de FOUR DRESS.`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
      if (navigator.share) {
        navigator.share({ title: "FOUR DRESS — " + product.name, text, url }).catch(error => {
          if (error.name !== "AbortError") window.open(whatsappUrl, "_blank", "noopener");
        });
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => showToast("ENLACE DEL PRODUCTO COPIADO")).catch(() => {
          window.open(whatsappUrl, "_blank", "noopener");
        });
      } else {
        window.open(whatsappUrl, "_blank", "noopener");
      }
    }

    function openSizeGuide() {
      if (!activeProduct) return;
      const message = `Hola FOUR DRESS! Quiero consultar qué talle me recomiendan para ${activeProduct.name} ${activeProduct.variant}. ¿Me pueden pasar las medidas disponibles?`;
      $("#sizeHelpWhatsapp").href = `https://wa.me/5493437453535?text=${encodeURIComponent(message)}`;
      $("#sizeGuideModal").classList.add("open");
      $("#sizeGuideModal").setAttribute("aria-hidden", "false");
    }

    function closeSizeGuide() {
      $("#sizeGuideModal").classList.remove("open");
      $("#sizeGuideModal").setAttribute("aria-hidden", "true");
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
    $("#openSizeGuide").addEventListener("click", openSizeGuide);
    $("#sizeGuideClose").addEventListener("click", closeSizeGuide);
    $("#sizeGuideBackdrop").addEventListener("click", closeSizeGuide);
    $("#shareProduct").addEventListener("click", () => shareProduct(activeProduct));
    $("#qtyMinus").addEventListener("click", () => {
      modalQty = Math.max(1, modalQty - 1);
      $("#modalQty").textContent = modalQty;
    });
    $("#qtyPlus").addEventListener("click", () => {
      modalQty = Math.min(10, modalQty + 1);
      $("#modalQty").textContent = modalQty;
    });
    // El botón existe de forma fija en index.html: enlazarlo directamente evita
    // depender de delegación global o de otros listeners de clic.
    $("#addToCart").addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      if (!activeProduct) {
        showToast("NO SE PUDO IDENTIFICAR LA PRENDA. VOLVÉ A ABRIRLA.");
        console.error("FOUR DRESS: intento de agregar sin producto activo.");
        return;
      }

      const size = $("#sizeSelect").value || "M";
      const existing = cart.find(item => item.id === activeProduct.id && item.size === size);
      if (existing) {
        existing.qty += modalQty;
      } else {
        cart.push({
          id: activeProduct.id,
          name: activeProduct.name,
          variant: activeProduct.variant,
          category: activeProduct.category,
          image: activeProduct.image,
          price: activeProduct.price ?? null,
          size,
          qty: modalQty
        });
      }

      renderCart();
      closeProduct();
      openCart();
      showToast("PRENDA AGREGADA AL CARRITO");
      console.info("FOUR DRESS: producto agregado.", { id: activeProduct.id, size, qty: modalQty });
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
      const body = `Hola FOUR DRESS! Quiero realizar este pedido:\n\n${lines}\n\nTotal: ${total}\n\nNombre: ${data.get("name")}\nEmail: ${data.get("email")}\nTeléfono: ${data.get("phone")}\nComentarios: ${data.get("notes") || "Sin comentarios"}\n\nQuedo atento/a a la confirmación de disponibilidad, envío y medios de pago.`;
      const whatsappNumber = "5493437453535";
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(body)}`;
      closeCheckout();
      window.location.href = whatsappUrl;
    });

    $("#menuToggle").addEventListener("click", () => $(".main-nav").classList.toggle("open"));
    document.querySelectorAll(".main-nav a").forEach(link =>
      link.addEventListener("click", () => $(".main-nav").classList.remove("open"))
    );
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeProduct();
        closeSizeGuide();
        closeCheckout();
        closeCart();
      }
    });

    // Magnetismo leve para los accesos de contacto; se desactiva en pantallas táctiles.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".magnetic-contact").forEach(link => {
        link.addEventListener("pointermove", event => {
          const rect = link.getBoundingClientRect();
          const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
          const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
          link.style.setProperty("--mag-x", `${(x * 7).toFixed(1)}px`);
          link.style.setProperty("--mag-y", `${(y * 7).toFixed(1)}px`);
        });
        link.addEventListener("pointerleave", () => {
          link.style.setProperty("--mag-x", "0px");
          link.style.setProperty("--mag-y", "0px");
        });
      });
      const magneticWords = document.querySelectorAll(".magnetic-word");
      if (magneticWords.length) {
        const heading = magneticWords[0].closest(".contact-heading");
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          heading.addEventListener("pointermove", event => {
            magneticWords.forEach((word, index) => {
              const rect = word.getBoundingClientRect();
              const x = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.8)));
              const y = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height * 1.2)));
              const direction = index === 0 ? -1 : 1;
              word.style.transform = `perspective(700px) translate3d(${(x * 9).toFixed(1)}px, ${(y * 6 * direction).toFixed(1)}px, 18px) rotateX(${(y * -7).toFixed(1)}deg) rotateY(${(x * 9).toFixed(1)}deg)`;
            });
          });
          heading.addEventListener("pointerleave", () => {
            magneticWords.forEach(word => { word.style.transform = ""; });
          });
        }
      }
    }

    renderProducts();
    renderCart();
    const requestedProduct = new URLSearchParams(window.location.search).get("producto");
    if (requestedProduct) {
      const match = products.find(product => product.id === requestedProduct);
      if (match) openProduct(match);
    }
    console.info("FOUR DRESS: interacciones inicializadas.", { products: products.length });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
