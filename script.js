// Scroll reveal (Анімація появи елементів)
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

// Nav scroll effect
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  nav.style.padding = window.scrollY > 60 ? '14px 60px' : '20px 60px';
});

// CALCULATOR LOGIC
let currentType = 'window';
let currentProfile = 'standard';
let currentGlass = 'double';

const basePrices = { window: 3500, door: 6800, balcony: 10500 };
const profileMult = { standard: 1, comfort: 1.25, premium: 1.6 };
const glassMult = { double: 1, triple: 1.18, lowe: 1.32 };

function setType(el, val) {
  currentType = val;
  document.querySelectorAll('#typeTabs .calc-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); calc();
}

function setProfile(el, val) {
  currentProfile = val;
  document.querySelectorAll('#profileTabs .calc-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); calc();
}

function setGlass(el, val) {
  currentGlass = val;
  document.querySelectorAll('#glassTabs .calc-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); calc();
}

function adjustDim(id, delta) {
  const el = document.getElementById(id);
  el.value = Math.max(40, Math.min(300, parseInt(el.value || 100) + delta));
  calc();
}

function fmt(n) { return n.toLocaleString('uk-UA') + ' ₴'; }

function calc() {
  const w = parseInt(document.getElementById('width').value) || 120;
  const h = parseInt(document.getElementById('height').value) || 140;
  const qty = parseInt(document.getElementById('qty').value) || 1;

  const area = (w / 100) * (h / 100);
  const areaFactor = Math.max(0.7, Math.min(2.5, area));

  let base = basePrices[currentType] * profileMult[currentProfile] * glassMult[currentGlass] * areaFactor;
  base = Math.round(base / 50) * 50;

  let options = 0;
  if (document.getElementById('opt_sill').checked) options += Math.round(w * 18);
  if (document.getElementById('opt_mosquito').checked) options += 680;
  if (document.getElementById('opt_color').checked) options += Math.round(base * 0.12);

  let install = 0;
  if (document.getElementById('opt_install').checked) {
      install = Math.max(800, Math.round(area * 800)); // Від 800 грн за метр
  }

  const perUnit = base + options + install;
  const total = perUnit * qty;

  document.getElementById('resultPrice').textContent = fmt(perUnit);
  document.getElementById('resultPer').textContent = qty > 1 ? `за 1 шт. · разом: ${fmt(total)}` : 'за 1 шт.';

  document.getElementById('b_product').textContent = fmt(base);
  document.getElementById('b_install').textContent = install ? fmt(install) : 'не обрано';
  document.getElementById('b_options').textContent = options ? fmt(options) : 'не обрано';
  document.getElementById('b_total').textContent = fmt(total);
}

calc();

// WEBHOOK HANDLER (Відправка форми)
async function handleSubmit(btn) {
  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const product = document.getElementById('clientProduct').value;
  const comment = document.getElementById('clientComment').value.trim();

  // Мінімальна перевірка
  if (!name || !phone) { 
    alert('Будь ласка, вкажіть ваше ім\'я та номер телефону.'); 
    return; 
  }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Відправка...';

  // Твій вебхук
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzx_CK43-reXVZ4amB-MynFlYHUSTTRnauj8BVpkOvAtbE2zaB5ytNv0cfKh_bVKTT3Eg/exec';

  const payload = {
    name: name,
    phone: phone,
    product: product || 'Не обрано',
    comment: comment || 'Немає'
  };

  try {
    // Відправка з text/plain для уникнення блокування браузером (CORS)
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    // Успіх
    btn.textContent = '✓ Заявку надіслано!';
    btn.style.background = '#4caf50';
    
    // Очищення полів
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientProduct').value = '';
    document.getElementById('clientComment').value = '';

  } catch (error) {
    // Помилка
    console.error('Помилка відправки:', error);
    btn.textContent = '❌ Помилка. Спробуйте ще';
    btn.style.background = '#f44336';
  }

  // Відновлення кнопки
  setTimeout(() => { 
    btn.disabled = false; 
    btn.textContent = originalText; 
    btn.style.background = ''; 
  }, 4000);
}
