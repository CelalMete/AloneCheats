import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
const swiper = new Swiper(".mySwiper", {
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
 
  touchStartPreventDefault: false 
});

// Karşılaştırma Mantığı
const inputs = document.querySelectorAll('.slider-input');

inputs.forEach(input => {
  input.addEventListener('input', (e) => {
    const container = e.target.parentElement;
    const foreground = container.querySelector('.foreground-img');
    const handle = container.querySelector('.slider-handle');
    
    const val = e.target.value;
    
    foreground.style.width = `${val}%`;
    handle.style.left = `${val}%`;
    
    // Slider kullanılırken Swiper'ın kaymasını engellemek için
    if(val > 0 && val < 100) {
        swiper.allowTouchMove = false;
    }
  });

  // Mouse bırakıldığında Swiper tekrar aktif olsun
  input.addEventListener('change', () => {
    swiper.allowTouchMove = true;
  });
});