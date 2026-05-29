document.addEventListener("DOMContentLoaded", () => {
    const plus = document.getElementById('plus');
    const minus = document.getElementById('minus');
    const input = document.getElementById('numb');
    const prices = document.querySelectorAll('.variant-box');
    const totalprice = document.getElementById('price');
    const thumbs = document.querySelectorAll('.thumb');
    const buyBtn = document.getElementById('buy');
    input.value = 1;
    let currentVariant = prices[0];
    currentVariant.classList.add('active'); // Nokta yok!
    const updatePrice = () => {
        let price = parseFloat(currentVariant.getAttribute('data-price'));
        let qty = parseInt(input.value) || 1;
        totalprice.innerText = (price * qty).toFixed(2) + "$";
    };
    updatePrice();
    plus.addEventListener('click', () => {
        input.value = parseInt(input.value) + 1;
        updatePrice();
    });
    minus.addEventListener('click', () => {
        if (input.value > 1) { // 1'den aşağı düşmesin
            input.value = parseInt(input.value) - 1;
            updatePrice();
        }
    });
    prices.forEach(pr => {
        pr.addEventListener('click', () => {
            prices.forEach(p => p.classList.remove('active')); // Nokta yok!
            pr.classList.add('active'); // Nokta yok!
            currentVariant = pr;
            updatePrice();
        });
    });
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            const newSrc = e.target.src;
            const mainFrame = document.getElementById('main-frame');
            const fgImg = document.getElementById('fg-img');
            
            fgImg.style.backgroundImage = `url('${newSrc}')`;
            
            thumbs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
   buyBtn.addEventListener('click', (e) => {
    const cheatCard = e.target.closest('.cheat-card');
   const cheatId = cheatCard.getAttribute('data-cheat-id');
    const price = currentVariant.getAttribute('data-price');
    const title = currentVariant.querySelector('.title').innerText;
    window.location.href = `/checkout?cheatId=${cheatId}&title=${encodeURIComponent(title)}`;
});
});