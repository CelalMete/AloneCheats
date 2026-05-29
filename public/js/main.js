const input =document.getElementById('searchBar')
const output =document.getElementById('searchOut')
const sonuc =document.getElementById('sonuclar')

input.addEventListener('input', async function() {
    const q = input.value;
    if (q.length < 1) return; 
    if (this.value.length > 0) {
        output.style.display = 'block';
    } else {
        output.style.display = 'none';
    }
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
    if (!input.contains(event.target) && !searchOut.contains(event.target)) {
        output.style.display = 'none';
    }
});