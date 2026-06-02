const input = document.getElementById('searchBar');
const output = document.getElementById('searchOut');
const sonuc = document.getElementById('sonuclar');
const openSearchBtn = document.getElementById('openSearchBtn');
const searchWrapper = document.getElementById('searchWrapper');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchBackdrop = document.getElementById('searchBackdrop');

input.addEventListener('input', async function() {
    const q = input.value;
    if (q.length < 1) {
        output.style.display = 'none';
        return; 
    }
    output.style.display = 'block';
    
    const response = await fetch(`/search?q=${encodeURIComponent(q)}`);
    const results = await response.json();
    sonuc.innerHTML = '';
    
    results.forEach(cheat => {
        sonuc.innerHTML += `
            <a href='/cheats/${cheat._id}' class="cheat-item">
             <img src='${cheat.Photo}'>
                <h3>${cheat.CheatName}</h3>
            </a>
        `;
    });
});

document.addEventListener('click', function(event) {
    if (!input.contains(event.target) && !output.contains(event.target)) {
        output.style.display = 'none';
    }
});

if (openSearchBtn) {
    openSearchBtn.addEventListener('click', () => {
        searchWrapper.classList.add('modal-active');
        input.focus();
    });
}

const closeSearchModal = () => {
    if (searchWrapper) {
        searchWrapper.classList.remove('modal-active');
    }
};

if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearchModal);
if (searchBackdrop) searchBackdrop.addEventListener('click', closeSearchModal);

const cartBtn = document.getElementById('cart');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const closeCartBtn = document.getElementById('closeCartBtn');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');
const cartEmpty = document.getElementById('cartEmpty');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartFooter = document.getElementById('cartFooter');
const cartCountHeader = document.getElementById('cartCountHeader');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const clearCartBtn = document.getElementById('clearCartBtn');

let cartItems = JSON.parse(localStorage.getItem('alone_cart')) || [];

function saveCart() {
    localStorage.setItem('alone_cart', JSON.stringify(cartItems));
}

function toggleCart() {
    cartOverlay.classList.toggle('active');
    cartDrawer.classList.toggle('active');
}

if(cartBtn) cartBtn.addEventListener('click', toggleCart);
if(closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
if(cartOverlay) cartOverlay.addEventListener('click', toggleCart);
if(continueShoppingBtn) continueShoppingBtn.addEventListener('click', toggleCart);

window.addToCart = function(item) {
    const existingItem = cartItems.find(i => i.id === item.id && i.variant === item.variant);
    
    if (existingItem) {
        existingItem.qty += item.qty;
        if (existingItem.qty > item.maxStock) existingItem.qty = item.maxStock;
    } else {
        cartItems.push(item);
    }
    
    saveCart();
    renderCart();
    
    cartOverlay.classList.add('active');
    cartDrawer.classList.add('active');
};

function renderCart() {
    cartCountHeader.innerText = `(${cartItems.length} Items)`;
    
    if (cartItems.length === 0) {
        cartEmpty.style.display = 'flex';
        cartItemsContainer.style.display = 'none';
        cartFooter.style.display = 'none';
    } else {
        cartEmpty.style.display = 'none';
        cartItemsContainer.style.display = 'block';
        cartFooter.style.display = 'block';
        
        cartItemsContainer.innerHTML = '';
        let total = 0;
        
        cartItems.forEach((item, index) => {
            total += item.price * item.qty;
            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-top">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                    <div class="cart-item-variant">${item.variant}</div>
                    <div class="cart-item-controls">
                        <div class="qty-control">
                            <button class="qty-btn" onclick="updateQty(${index}, -1)"><i class="fa-solid fa-minus"></i></button>
                            <div class="qty-val">${item.qty}</div>
                            <button class="qty-btn" onclick="updateQty(${index}, 1)"><i class="fa-solid fa-plus"></i></button>
                        </div>
                        <button class="remove-btn" onclick="removeItem(${index})"><i class="fa-regular fa-trash-can"></i> Remove</button>
                    </div>
                </div>
            `;
        });
        
        cartTotalPrice.innerText = `$${total.toFixed(2)}`;
    }
}

window.updateQty = function(index, change) {
    const item = cartItems[index];
    const newQty = item.qty + change;

    if (newQty > 0) {
        if (newQty <= item.maxStock) {
            item.qty = newQty;
        }
    } else {
        cartItems.splice(index, 1);
    }
    
    saveCart();
    renderCart();
};

window.removeItem = function(index) {
    cartItems.splice(index, 1);
    saveCart();
    renderCart();
};

if(clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        cartItems = [];
        saveCart();
        renderCart();
    });
}

renderCart();

const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cartItems.length === 0) return alert("Your cart is empty!");
        
        const itemsToCheckout = cartItems.map(item => ({
            id: item.id,
            title: item.variant,
            qty: item.qty
        }));

        const cartData = encodeURIComponent(JSON.stringify(itemsToCheckout));
        window.location.href = `/checkout?cart=${cartData}`; 
    });
}