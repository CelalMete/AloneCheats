document.addEventListener('DOMContentLoaded', () => {
    const typeSelect = document.getElementById('type');
    const authForm = document.getElementById('authForm');
    const submitBtn = document.getElementById('submitBtn');
    const email = document.getElementById('email');
    const nick = document.getElementById('nick');
    const pass1 = document.getElementById('pass1');
    const pass2 = document.getElementById('pass2');

    let selectedValue;
    let payload = {};
    let rota = '/auth';

    if (typeSelect) {
        selectedValue = typeSelect.value;
        typeSelect.addEventListener('change', (e) => {
            selectedValue = e.target.value;
            if (selectedValue === 'login') {
                if (email) {
                    email.style.display = 'none';
                    const emailInput = document.querySelector('input[name="email"]');
                    if(emailInput) emailInput.removeAttribute('required');
                }
                if (pass2) {
                    pass2.style.display = 'none';
                    const pass2Input = document.querySelector('input[name="Password2"]');
                    if(pass2Input) pass2Input.removeAttribute('required');
                }

            } else if (selectedValue === 'register') {
                if (email) {
                    email.style.display = 'flex';
                    email.style.flexDirection = 'row';
                    const emailInput = document.querySelector('input[name="email"]');
                    if(emailInput) emailInput.setAttribute('required', 'true');
                }
                if (pass2) {
                    pass2.style.display = 'flex';
                    pass2.style.flexDirection = 'row';
                    const pass2Input = document.querySelector('input[name="Password2"]');
                    if(pass2Input) pass2Input.setAttribute('required', 'true');
                }
            }
        });

        selectedValue = typeSelect.value;
        if (selectedValue === 'login') {
            if (email) {
                email.style.display = 'none';
                const emailInput = document.querySelector('input[name="email"]');
                if(emailInput) emailInput.removeAttribute('required');
            }
            if (pass2) {
                pass2.style.display = 'none';
                const pass2Input = document.querySelector('input[name="Password2"]');
                if(pass2Input) pass2Input.removeAttribute('required');
            }
        } else if (selectedValue === 'register') {
            if (email) {
                email.style.display = 'flex';
                email.style.flexDirection = 'row';
                const emailInput = document.querySelector('input[name="email"]');
                if(emailInput) emailInput.setAttribute('required', 'true');
            }
            if (pass2) {
                pass2.style.display = 'flex';
                pass2.style.flexDirection = 'row';
                const pass2Input = document.querySelector('input[name="Password2"]');
                if(pass2Input) pass2Input.setAttribute('required', 'true');
            }
        }
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeSelect) {
                selectedValue = typeSelect.value;
            }

            const nickname = document.querySelector('input[name="Nickname"]').value;
            const password = document.querySelector('input[name="Password"]').value;

            if (selectedValue === 'login') {
                rota = '/auth';
                payload = { nickname, password, selectedValue };
            } else if (selectedValue === 'register') {
                const emailInput = document.querySelector('input[name="email"]');
                const password2Input = document.querySelector('input[name="Password2"]');
                
                const emailVal = emailInput ? emailInput.value : '';
                const password2Val = password2Input ? password2Input.value : '';
                
                rota = '/auth';
                payload = { nickname, email: emailVal, password, password2: password2Val, selectedValue };
            }

            try {
                const response = await fetch(rota, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const sonuc = await response.json();

                if (sonuc.success) {
                    if (sonuc.redirect) {
                        window.location.href = sonuc.redirect;
                    } else {
                        window.location.href = '/'; 
                    }
                } else {
                    alert("Hata: " + (sonuc.message || "Bir hata oluştu"));
                }
            } catch (hata) {
                console.error("Fetch hatası:", hata);
                alert("Sunucuyla iletişim kurulamadı.");
            }
        });
    }
});