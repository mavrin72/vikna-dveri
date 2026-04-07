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

// Додаємо автозаповнення +380 для зручності
const phoneInput = document.getElementById('clientPhone');
if (phoneInput) {
  phoneInput.addEventListener('focus', function() {
    if (this.value === '') this.value = '+380';
  });
}

// CALCULATOR LOGIC
let currentType = 'window';
let currentProfile = 'standard';
let currentGlass = 'double';

const basePrices = { window: 4200, door: 8200, balcony: 12500 };
const profileMult = { standard: 1, comfort: 1.25, premium: 1.6 };
const glassMult = { double: 1, triple: 1.18, lowe: 1.32 };

function setType(el, val) {
  currentType = val;
  const tabs = document.querySelectorAll('#typeTabs .calc-tab');
  if(tabs.length) tabs.forEach(b => b.classList.remove('active'));
  if(el) el.classList.add('active'); 
  calc();
}

function setProfile(el, val) {
  currentProfile = val;
  const tabs = document.querySelectorAll('#profileTabs .calc-tab');
  if(tabs.length) tabs.forEach(b => b.classList.remove('active'));
  if(el) el.classList.add('active'); 
  calc();
}

function setGlass(el, val) {
  currentGlass = val;
  const tabs = document.querySelectorAll('#glassTabs .calc-tab');
  if(tabs.length) tabs.forEach(b => b.classList.remove('active'));
  if(el) el.classList.add('active'); 
  calc();
}

function adjustDim(id, delta) {
  const el = document.getElementById(id);
  if(el) {
    el.value = Math.max(40, Math.min(300, parseInt(el.value || 100) + delta));
    calc();
  }
}

function fmt(n) { return n.toLocaleString('uk-UA') + ' ₴'; }

function calc() {
  // 1. Безпечно отримуємо елементи
  const wEl = document.getElementById('width');
  const hEl = document.getElementById('height');
  const qtyEl = document.getElementById('qty');

  const w = wEl ? parseInt(wEl.value) || 120 : 120;
  const h = hEl ? parseInt(hEl.value) || 140 : 140;
  const qty = qtyEl ? parseInt(qtyEl.value) || 1 : 1;

  const area = (w / 100) * (h / 100);
  const REFERENCE_AREA = (120 / 100) * (140 / 100); // дефолтний розмір 120×140 = 1.68m²
  const areaFactor = Math.max(0.5, Math.min(2.5, area / REFERENCE_AREA));

  let base = basePrices[currentType] * profileMult[currentProfile] * glassMult[currentGlass] * areaFactor;
  base = Math.max(basePrices[currentType], Math.round(base / 50) * 50);

  let options = 0;
  
  const optSill = document.getElementById('opt_sill');
  if (optSill && optSill.checked) options += Math.round(base * 0.12);

  const optMosq = document.getElementById('opt_mosquito');
  if (optMosq && optMosq.checked) options += 680;

  const optColor = document.getElementById('opt_color');
  if (optColor && optColor.checked) options += Math.round(w * 18);

  let install = 0;
  const optInstall = document.getElementById('opt_install');
  if (optInstall && optInstall.checked) {
      install = Math.max(800, Math.round(area * 800)); // Від 800 грн за метр
  }

  const perUnit = base + options + install;
  const total = perUnit * qty;

  // 2. Безпечно оновлюємо HTML
  const priceEl = document.getElementById('resultPrice');
  if (priceEl) priceEl.textContent = fmt(perUnit);

  const perEl = document.getElementById('resultPer');
  if (perEl) perEl.textContent = qty > 1 ? `за 1 шт. · разом: ${fmt(total)}` : 'за 1 шт.';

  const bProd = document.getElementById('b_product');
  if (bProd) bProd.textContent = fmt(base);

  const bInst = document.getElementById('b_install');
  if (bInst) bInst.textContent = install ? fmt(install) : 'не обрано';

  const bOpt = document.getElementById('b_options');
  if (bOpt) bOpt.textContent = options ? fmt(options) : 'не обрано';

  const bTotal = document.getElementById('b_total');
  if (bTotal) bTotal.textContent = fmt(total);
}

// Запускаємо калькулятор при завантаженні
calc();

// WEBHOOK HANDLER (Відправка форми)
async function handleSubmit(btn) {
  const nameEl = document.getElementById('clientName');
  const phoneEl = document.getElementById('clientPhone');
  const productEl = document.getElementById('clientProduct');
  const commentEl = document.getElementById('clientComment');

  const name = nameEl ? nameEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const product = productEl ? productEl.value : 'Не обрано';
  const comment = commentEl ? commentEl.value.trim() : '';

  if (!name || !phone) { 
    alert('Будь ласка, вкажіть ваше ім\'я та номер телефону.'); 
    return; 
  }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Відправка...';

  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzx_CK43-reXVZ4amB-MynFlYHUSTTRnauj8BVpkOvAtbE2zaB5ytNv0cfKh_bVKTT3Eg/exec';

  const payload = {
    name: name,
    phone: phone,
    product: product,
    comment: comment
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    btn.textContent = '✓ Заявку надіслано!';
    btn.style.background = '#4caf50';
    
    if(nameEl) nameEl.value = '';
    if(phoneEl) phoneEl.value = '';
    if(productEl) productEl.value = '';
    if(commentEl) commentEl.value = '';

  } catch (error) {
    console.error('Помилка відправки:', error);
    btn.textContent = '❌ Помилка. Спробуйте ще';
    btn.style.background = '#f44336';
  }

  setTimeout(() => { 
    btn.disabled = false; 
    btn.textContent = originalText; 
    btn.style.background = ''; 
  }, 4000);
}
