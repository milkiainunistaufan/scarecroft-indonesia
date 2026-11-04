import './style.css'
import logoImg from './assets/scarecroft.png'

console.log("ScareCroft Indonesia is active!");
document.getElementById('logo-agency').src = logoImg;
document.getElementById('logo-hero').src = logoImg;

// Tambahkan ini di bagian paling bawah file main.js Anda
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeToggleDot = document.getElementById('theme-toggle-dot');

  if (!themeToggleBtn || !themeToggleDot) return; // Mencegah eror jika tombol tidak ditemukan

  // Cek preferensi tema sebelumnya
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    themeToggleDot.classList.add('translate-x-5');
  } else {
    document.documentElement.classList.remove('dark');
    themeToggleDot.classList.remove('translate-x-5');
  }

  // Event Listener saat Tombol Slider diklik
  themeToggleBtn.addEventListener('click', () => {
    themeToggleDot.classList.toggle('translate-x-5');
    
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  });
});

