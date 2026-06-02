document.addEventListener('DOMContentLoaded', () => {
    const variantBoxes = document.querySelectorAll('.variant-box');
    const priceDisplay = document.getElementById('price');
    const numbInput = document.getElementById('numb');
    const minusBtn = document.getElementById('minus');
    const plusBtn = document.getElementById('plus');
    const addCartBtn = document.getElementById('addcart');
    const buyBtn = document.getElementById('buy');
    const cheatId = document.getElementById('buy').getAttribute('data-cheat-id');
    const cheatName = document.querySelector('h1').innerText;
    let selectedVariant = null;
    let basePrice = 0;
    let maxStock = 0;
    variantBoxes.forEach(box => {
        if (box.querySelector('.stock.out')) {
            box.classList.add('out-of-stock');
        }
    });

    function updateTotal() {
        let qty = parseInt(numbInput.value) || 1;
        if (qty < 1) qty = 1;
        if (qty > maxStock) qty = maxStock; 
        
        numbInput.value = qty;
        priceDisplay.innerText = '$' + (basePrice * qty).toFixed(2);
    }
    variantBoxes.forEach(box => {
        if (!box.classList.contains('out-of-stock')) {
            box.addEventListener('click', () => {
                variantBoxes.forEach(b => b.classList.remove('active'));
                box.classList.add('active');
                basePrice = parseFloat(box.getAttribute('data-price'));
                selectedVariant = box.querySelector('.title').innerText;
                const stockText = box.querySelector('.stock').innerText;
                const stockMatch = stockText.match(/\((\d+)\)/); 
                maxStock = stockMatch ? parseInt(stockMatch[1]) : 0;
                numbInput.value = 1;
                updateTotal();
            });
        }
    });
    const firstInStock = document.querySelector('.variant-box:not(.out-of-stock)');
    if (firstInStock) firstInStock.click();
    minusBtn.addEventListener('click', () => {
        numbInput.value = parseInt(numbInput.value) - 1;
        updateTotal();
    });

    plusBtn.addEventListener('click', () => {
        numbInput.value = parseInt(numbInput.value) + 1;
        updateTotal();
    });

    numbInput.addEventListener('input', updateTotal);
    addCartBtn.addEventListener('click', () => {
        if (!selectedVariant) return alert("Please select a variant!");

        const qty = parseInt(numbInput.value);

        const cartItem = {
            id: cheatId,
            name: cheatName,
            variant: selectedVariant,
            price: basePrice,
            qty: qty,
            maxStock: maxStock
        };

        if (window.addToCart) {
            window.addToCart(cartItem);
        }
    });
     buyBtn.addEventListener('click', (e) => {
    if (!selectedVariant) return alert("Please select a variant!");
    const qty = parseInt(numbInput.value) || 1;
    
    // Sadece 1 üründen oluşan geçici bir sepet oluşturuyoruz
    const singleItemCart = [{
        id: cheatId,
        title: selectedVariant,
        qty: qty
    }];

    // Diziyi JSON string'e çevirip güvenli bir şekilde URL'ye ekliyoruz
    const cartData = encodeURIComponent(JSON.stringify(singleItemCart));
    window.location.href = `/checkout?cart=${cartData}`;
});
});