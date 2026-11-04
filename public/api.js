// Konfigurasi Supabase Client (Ganti dengan kredensial proyek Supabase Anda)
const SUPABASE_URL = 'https://onhmatglsvorgxwqcqbj.supabase.co'; // <-- Masukkan URL Supabase Anda
const SUPABASE_ANON_KEY = 'sb_publishable_09P7q4tk7tK9sOaa4oxUEQ_8nkdLPEE'; // <-- Masukkan Anon / Public Key Anda

// PERBAIKAN: Menggunakan window.supabase untuk memanggil SDK CDN secara aman
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// 1. FUNGSI MEMUAT PORTOFOLIO LANGSUNG DARI SUPABASE
// State Manajemen untuk Slider Global
let currentSlideIndex = 0;
let totalSlides = 0;
let portfoliosData = [];

async function loadPortfolios() {
  try {
    if (!supabaseClient) throw new Error('SDK Supabase gagal dideteksi.');

    const { data: portfolios, error } = await supabaseClient
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    portfoliosData = portfolios || [];
    const container = document.getElementById('portfolio-container');
    if (!container) return; 
    container.innerHTML = '';

    if (portfoliosData.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 text-sm">Belum ada portofolio yang diterbitkan.</div>`;
      return;
    }

    // Render Semua Card Item Portofolio
    portfoliosData.forEach(project => {
      let tagsArray = Array.isArray(project.tag) ? project.tag : (typeof project.tag === 'string' ? project.tag.split(',') : []);
      let tagsHTML = '';
      tagsArray.forEach((tagItem, index) => {
        const trimmedTag = tagItem.trim();
        if (index === 0) {
          tagsHTML += `<span class="text-[10px] font-bold uppercase tracking-wider bg-florest-main/10 dark:bg-florest-main/20 text-florest-main dark:text-slate-300 px-2.5 py-1 rounded-md">${trimmedTag}</span>`;
        } else {
          tagsHTML += `<span class="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-florest-secondary px-2.5 py-1 rounded-md">${trimmedTag}</span>`;
        }
      });

      let actionButtonHTML = (project.status === 'Live' && project.project_url) 
        ? `<a href="${project.project_url}" target="_blank" class="flex items-center text-sm font-bold text-florest-main dark:text-florest-secondary gap-2 group/btn">
            <span>Visit ${project.title}</span>
            <svg class="h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </a>`
        : `<div class="flex items-center text-sm font-bold text-slate-400 gap-2"><span>Coming Soon</span></div>`;

      const cardTemplate = `
        <div class="portfolio-item group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-xs hover:shadow-xl hover:shadow-florest-main/5 dark:hover:shadow-black/30 transition-all duration-300 hover:border-florest-main/30">
          <div class="relative aspect-video bg-linear-to-br from-florest-main/20 to-florest-secondary/20 overflow-hidden flex items-center justify-center">
            <div class="relative aspect-video w-full overflow-hidden flex items-center justify-center bg-slate-100">
                <img src="${project.image_url}" alt="${project.title}" class="w-full h-full object-cover" " />
            </div>
          </div>
          <div class="p-6 md:p-8 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex flex-wrap gap-2 mb-4">${tagsHTML}</div>
              <h3 class="font-display font-bold text-xl text-florest-main dark:text-white mb-2 group-hover:text-florest-secondary transition-colors duration-300">${project.title}</h3>
              <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">${project.description}</p>
            </div>
            ${actionButtonHTML}
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', cardTemplate);
    });

    // Inisialisasi Kontrol Navigasi & Hitung Pembagian Slider Halaman
    initSliderLogic();

    // 2. PERBAIKAN: Langsung sembunyikan data cadangan saat pertama kali halaman dimuat
    const items = document.querySelectorAll('.portfolio-item');
    let itemsPerPage = 1;
    if (window.innerWidth >= 1024) itemsPerPage = 3;
    else if (window.innerWidth >= 768) itemsPerPage = 2;
    
    // Panggil ini agar langsung memotong tampilan menjadi 3 item sejak awal!
    updateSliderPosition(items, itemsPerPage);

  } catch (error) {
    console.error('Error loading portfolios:', error);
    const container = document.getElementById('portfolio-container');
    if (container) container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 text-sm">Gagal memuat data.</div>`;
  }
}

function initSliderLogic() {
  const items = document.querySelectorAll('.portfolio-item');
  const navContainer = document.getElementById('slider-nav');
  const dotsContainer = document.getElementById('slider-dots');
  
  // Tentukan jumlah item per halaman berdasarkan breakpoint CSS layar saat ini
  let itemsPerPage = 1;
  if (window.innerWidth >= 1024) itemsPerPage = 3; // Desktop Grid 3
  else if (window.innerWidth >= 768) itemsPerPage = 2; // Tablet Grid 2

  totalSlides = Math.ceil(items.length / itemsPerPage);

  // Jika halaman slide cuma 1, sembunyikan navigasi arrow & dots
  if (totalSlides <= 1) {
    navContainer.classList.add('hidden');
    dotsContainer.innerHTML = '';
    return;
  }

  // Tampilkan container tombol navigasi panah
  navContainer.classList.remove('hidden');

  // Bangun Indikator Titik (Dots) Dinamis
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.className = `h-2.5 rounded-full transition-all duration-300 cursor-pointer ${i === 0 ? 'w-8 bg-florest-main dark:bg-florest-secondary' : 'w-2.5 bg-slate-300 dark:bg-slate-700'}`;
    dot.addEventListener('click', () => {
      currentSlideIndex = i;
      updateSliderPosition(items, itemsPerPage);
    });
    dotsContainer.appendChild(dot);
  }

  // Daftarkan Event Listener Tombol Navigasi Panah
  const btnPrev = document.getElementById('slider-prev');
  const btnNext = document.getElementById('slider-next');

  // Bersihkan event listener lama untuk menghindari duplikasi trigger
  btnPrev.replaceWith(btnPrev.cloneNode(true));
  btnNext.replaceWith(btnNext.cloneNode(true));

  document.getElementById('slider-prev').addEventListener('click', () => {
    if (currentSlideIndex > 0) currentSlideIndex--;
    else currentSlideIndex = totalSlides - 1; // Loop kembali ke halaman akhir
    updateSliderPosition(items, itemsPerPage);
  });

  document.getElementById('slider-next').addEventListener('click', () => {
    if (currentSlideIndex < totalSlides - 1) currentSlideIndex++;
    else currentSlideIndex = 0; // Loop kembali ke halaman awal
    updateSliderPosition(items, itemsPerPage);
  });
}

function updateSliderPosition(items, itemsPerPage) {
  const container = document.getElementById('portfolio-container');
  const dots = document.querySelectorAll('#slider-dots button');

  // Sembunyikan semua item terlebih dahulu
  items.forEach(item => item.classList.add('hidden'));

  // Hitung rentang index data yang harus ditampilkan pada slide saat ini
  const start = currentSlideIndex * itemsPerPage;
  const end = start + itemsPerPage;

  // Tampilkan hanya item yang masuk dalam rentang slide aktif
  for (let i = start; i < end; i++) {
    if (items[i]) items[i].classList.remove('hidden');
  }

  // Perbarui visual status keaktifan tombol titik indikator (Dots)
  dots.forEach((dot, idx) => {
    if (idx === currentSlideIndex) {
      dot.className = 'h-2.5 w-8 rounded-full bg-florest-main dark:bg-florest-secondary transition-all duration-300 cursor-pointer';
    } else {
      dot.className = 'h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 transition-all duration-300 cursor-pointer';
    }
  });
}

// 2. FUNGSI MENYIMPAN PESAN LANGSUNG KE SUPABASE
function initContactForm() {
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!supabaseClient) {
        alert('Gagal mengirim pesan karena database tidak terhubung. Silakan muat ulang halaman.');
        return;
      }

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const whatsappInput = document.getElementById('contact-whatsapp');
      const messageInput = document.getElementById('contact-message');

      const name = nameInput ? nameInput.value : '';
      const email = emailInput ? emailInput.value : '';
      const whatsapp = whatsappInput ? whatsappInput.value : '';
      const message = messageInput ? messageInput.value : '';

      try {
        const { error } = await supabaseClient
          .from('messages')
          .insert([{ name, email, whatsapp, message }]);

        if (error) throw error;

        alert('Pesan berhasil terkirim langsung ke database! Tim ScareCroft akan segera menghubungi Anda.');
        contactForm.reset(); 
      } catch (error) {
        console.error('Error inserting message to Supabase:', error);
        alert(`Gagal mengirim pesan: ${error.message || 'Terjadi kesalahan.'}`);
      }
    });
  }
}

window.addEventListener('resize', () => {
  if (portfoliosData.length > 0) {
    currentSlideIndex = 0; // Reset ke halaman pertama saat resize layar
    initSliderLogic();
    const items = document.querySelectorAll('.portfolio-item');
    let itemsPerPage = window.innerWidth >= 1024 ? 3 : (window.innerWidth >= 768 ? 2 : 1);
    updateSliderPosition(items, itemsPerPage);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadPortfolios();
  initContactForm();
});