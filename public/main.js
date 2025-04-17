
// 🔐 Генерація унікального WHO-XXXX
function generateUniqueOrderRef(prefix = 'WHO', length = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const used = JSON.parse(localStorage.getItem('used_order_refs')) || {};
  let newCode;

  do {
    let suffix = '';
    for (let i = 0; i < length; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    newCode = `${prefix}-${suffix}`;
  } while (used[newCode]);

  used[newCode] = true;
  localStorage.setItem('used_order_refs', JSON.stringify(used));

  return newCode;
}

// 🟩 Оновлення/підстановка order_ref
function updateOrderRef() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const input = document.getElementById('order_ref');

  if (!input) return;

  if (cart.length >= 1) {
    let orderRef = localStorage.getItem('order_ref');
    if (!orderRef) {
      orderRef = generateUniqueOrderRef(); // WHO-XXXX
      localStorage.setItem('order_ref', orderRef);
    }
    input.value = orderRef;
  } else {
    input.value = '';
    localStorage.removeItem('order_ref');
  }
}

// ➕ Додати товар у кошик
function addToCart(button) {
  const product = button.closest('.product');
  const name = product.dataset.name;
  const author = product.dataset.author;
  const imgSrc = product.dataset.imgSrc;
  const rawPrice = product.dataset.price;
  const price = parseInt(rawPrice.replace(/[^\d]/g, ''), 10);

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existing = cart.find(item => item.name === name && item.price === price);

  if (existing) {
    existing.cnt += 1;
  } else {
    cart.push({ name, author, imgSrc, price, cnt: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  document.querySelector('.cart').style.display = 'flex';
}

// 🧾 Відображення кошика
function renderCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const container = document.getElementById('cart-container');
  const cartBottom = document.querySelector('.cart-bottom');

  container.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML += `<p>Кошик порожній</p>`;
    if (cartBottom) cartBottom.style.display = 'none';
  } else {
    cart.forEach((item, index) => {
      const itemTotal = item.price * item.cnt;
      total += itemTotal;

      container.innerHTML += `
      <div class="cart-product-item">
          <div data-index="${index}" class="cart-body-col">
              <div class="cart-image">
                  <img src="${item.imgSrc}" loading="lazy" alt="" class="book-miniature">
              </div>
              <div class="cart-right-col">
                  <div>${item.author}</div>
                  <div>${item.name}</div>
                  <div class="cost-16">₴ ${item.price}</div>
                  <div class="inc-decr-btn">
                      <button class="minus-btn decrease-btn">-</button>
                      <span class="quantity">${item.cnt}</span>
                      <button class="plus-btn increase-btn">+</button>
                  </div>
              </div>
          </div>
          <button class="remove-btn">Видалити книгу</button>
          <div class="cart-divider w-embed">
              <svg width="100%" height="100%" viewBox="0 0 379 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.2" d="M1 2.33333C107.733 2.33333 214.513 1 321.237 1C335.539 1 349.833 1.66667 364.091 1.66667C368.131 1.66667 374.48 1.37851 378 3" stroke="black" stroke-width="2" stroke-linecap="round"/>
              </svg>
          </div>
      </div>
      `;
    });

    container.innerHTML += `<button onclick="clearCart()">Очистити кошик</button>`;
    if (cartBottom) cartBottom.style.display = 'flex';
  }

  const checkoutPriceEl = document.querySelector('.checkout-cost');
  if (checkoutPriceEl) {
    checkoutPriceEl.textContent = `${total}`;
  }

  const totalItems = cart.reduce((sum, item) => sum + item.cnt, 0);
  document.querySelectorAll('.cart-quantity').forEach(el => {
    el.textContent = totalItems;
  });

  updateOrderRef(); // ✅ оновлення коду замовлення
  addCartEventListeners();
}

// 🔄 Зміна кількості
function updateItemQuantity(index, delta) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const item = cart[index];
  const newCount = (item.cnt || 1) + delta;
  item.cnt = Math.max(1, newCount);

  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

// ❌ Видалити товар
function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

// 🧹 Очистити кошик
function clearCart() {
  localStorage.removeItem('cart');
  localStorage.removeItem('order_ref');
  renderCart();
}

// 🔁 Події кнопок
function addCartEventListeners() {
  document.querySelectorAll('.increase-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = btn.closest('[data-index]').dataset.index;
      updateItemQuantity(Number(index), 1);
    });
  });

  document.querySelectorAll('.decrease-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = btn.closest('[data-index]').dataset.index;
      updateItemQuantity(Number(index), -1);
    });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = btn.closest('[data-index]').dataset.index;
      removeFromCart(Number(index));
    });
  });
}

// 🚀 Оформити замовлення
function submitOrder() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const order_ref = document.getElementById('order_ref')?.value?.trim();

  if (cart.length === 0) {
    alert('Ваш кошик порожній!');
    return;
  }

  if (!order_ref) {
    alert('Внутрішня помилка: не знайдено номер замовлення');
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.cnt, 0);

  fetch('https://monocheckout-test.netlify.app/.netlify/functions/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart, order_ref, total })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Отримано відповідь з Netlify:', data);
    const redirectUrl = data.redirect_url;
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      console.error('Monobank не повернув pageUrl:', data.monobank_response);
      alert('Помилка: посилання на оплату не знайдено.');
    }
  })
  .catch(err => {
    console.error('Помилка оформлення замовлення:', err);
    alert('Не вдалося створити замовлення. Спробуйте ще раз.');
  });
}

// 🧠 При завантаженні
window.onload = () => {
  renderCart();
};

