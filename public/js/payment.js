document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('checkoutData');
    if (!container) return; 
    const walletsData = container.getAttribute('data-wallets');
    const wallets = JSON.parse(walletsData);
    const selectEl = document.getElementById('cryptoSelect');
    const addressDisplay = document.getElementById('walletAddressDisplay');
    const nameDisplay = document.getElementById('cryptoName');
    function updateWalletAddress() {
        const selectedCoin = selectEl.value; // ltc, btc, vs.
        const selectedText = selectEl.options[selectEl.selectedIndex].text.split(' ')[0]; 
        
        nameDisplay.innerText = selectedText;
        addressDisplay.innerText = wallets[selectedCoin] || "Cüzdan adresi bulunamadı (Sunucu ayarlarını kontrol et)";
    }
    selectEl.addEventListener('change', updateWalletAddress);
    updateWalletAddress();
});