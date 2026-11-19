const products = window.FOURDRESS_PRODUCTS || [];
const $ = (s) => document.querySelector(s);
const grid = $("#productGrid");
let cart = [];
let activeProduct = null;
let modalQty = 1;

const money = (value) => value == null ? "A consultar" : new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(value);

function renderProducts(filter="Todos"){
  grid.innerHTML = "";
  products.filter(p => filter==="Todos" || p.category===filter).forEach((p,index)=>{
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="hanger"></div>
      <div class="product-visual">
        <span class="product-number">FD / ${String(products.indexOf(p)+1).padStart(2,"0")}</span>
        <img src="${p.image}" alt="${p.name} ${p.variant}" loading="lazy">
        <span class="product-open">↗</span>
      </div>
      <div class="product-meta">
        <div><div class="product-name">${p.name}</div><div class="product-variant">${p.variant}</div></div>
        <div class="product-price">${money(p.price)}</div>
      </div>`;
    card.addEventListener("click",()=>openProduct(p));
    grid.appendChild(card);
  });
}
renderProducts();

$("#filters").addEventListener("click",e=>{
  const btn=e.target.closest(".filter"); if(!btn)return;
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active"); renderProducts(btn.dataset.filter);
});

function openProduct(p){
  activeProduct=p; modalQty=1;
  $("#modalImage").src=p.image; $("#modalImage").alt=p.name+" "+p.variant;
  $("#modalName").textContent=p.name; $("#modalVariant").textContent=p.variant;
  $("#modalCategory").textContent="FOUR DRESS / "+p.category.toUpperCase();
  $("#modalDescription").textContent=p.description;
  $("#modalQty").textContent=modalQty;
  $("#productModal").classList.add("open"); $("#productModal").setAttribute("aria-hidden","false");
}
function closeProduct(){ $("#productModal").classList.remove("open"); $("#productModal").setAttribute("aria-hidden","true"); }
$("#modalClose").addEventListener("click",closeProduct);
$("#modalBackdrop").addEventListener("click",closeProduct);
$("#qtyMinus").addEventListener("click",()=>{modalQty=Math.max(1,modalQty-1);$("#modalQty").textContent=modalQty;});
$("#qtyPlus").addEventListener("click",()=>{modalQty=Math.min(10,modalQty+1);$("#modalQty").textContent=modalQty;});
$("#addToCart").addEventListener("click",()=>{
  const size=$("#sizeSelect").value;
  const found=cart.find(x=>x.id===activeProduct.id && x.size===size);
  if(found)found.qty+=modalQty; else cart.push({...activeProduct,size,qty:modalQty});
  renderCart(); closeProduct(); showToast("AGREGADO A TU CARRITO");
});

function renderCart(){
  $("#cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0);
  const items=$("#cartItems");
  if(!cart.length){items.innerHTML='<div class="empty-cart">TU CARRITO ESTÁ VACÍO.<br><span>Hay algo esperando en la colección.</span></div>';}
  else{
    items.innerHTML="";
    cart.forEach((item,index)=>{
      const row=document.createElement("div"); row.className="cart-row";
      row.innerHTML=`<img src="${item.image}" alt=""><div><h3>${item.name}</h3><p>${item.variant} · Talle ${item.size}</p><button data-remove="${index}">ELIMINAR</button><span class="row-qty">× ${item.qty}</span></div><strong style="font-size:9px;color:var(--yellow)">${money(item.price)}</strong>`;
      items.appendChild(row);
    });
  }
  const total=cart.reduce((sum,item)=>sum+(item.price||0)*item.qty,0);
  $("#cartTotal").textContent=cart.some(x=>x.price==null)?"A consultar":money(total);
}
$("#cartItems").addEventListener("click",e=>{
  const btn=e.target.closest("[data-remove]");if(!btn)return;
  cart.splice(Number(btn.dataset.remove),1);renderCart();
});
function openCart(){document.body.classList.add("cart-open");$("#cartDrawer").setAttribute("aria-hidden","false");}
function closeCart(){document.body.classList.remove("cart-open");$("#cartDrawer").setAttribute("aria-hidden","true");}
$("#openCart").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);$("#cartBackdrop").addEventListener("click",closeCart);
$("#checkoutButton").addEventListener("click",()=>{
  if(!cart.length){showToast("TU CARRITO ESTÁ VACÍO");return;}
  closeCart();$("#checkoutModal").classList.add("open");$("#checkoutModal").setAttribute("aria-hidden","false");
});
function closeCheckout(){$("#checkoutModal").classList.remove("open");$("#checkoutModal").setAttribute("aria-hidden","true");}
$("#checkoutClose").addEventListener("click",closeCheckout);$("#checkoutBackdrop").addEventListener("click",closeCheckout);
$("#checkoutForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data=new FormData(e.currentTarget);
  const lines=cart.map(x=>`- ${x.name} / ${x.variant} / Talle ${x.size} / Cantidad: ${x.qty} / Precio: ${money(x.price)}`).join("\n");
  const total=cart.some(x=>x.price==null)?"A consultar":money(cart.reduce((s,x)=>s+(x.price||0)*x.qty,0));
  const body=`Hola FOUR DRESS, quiero realizar este pedido:\n\n${lines}\n\nSubtotal: ${total}\n\nNombre: ${data.get("name")}\nEmail: ${data.get("email")}\nTeléfono: ${data.get("phone")}\nComentarios: ${data.get("notes")||"Sin comentarios"}\n\nQuedo atento/a a la confirmación de disponibilidad y medios de pago.`;
  const subject=encodeURIComponent("Pedido FOUR DRESS");
  window.location.href=`mailto:alanlacombe01@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`;
  closeCheckout();
});
let toastTimer;
function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2300);}
$("#menuToggle").addEventListener("click",()=>$(".main-nav").classList.toggle("open"));
document.querySelectorAll(".main-nav a").forEach(a=>a.addEventListener("click",()=>$(".main-nav").classList.remove("open")));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeProduct();closeCheckout();closeCart();}});
