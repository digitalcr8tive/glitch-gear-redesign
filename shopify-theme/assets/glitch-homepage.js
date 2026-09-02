(() => {
  const footerQuery = matchMedia('(max-width: 767px)');
  const syncFooterMenus = () => document.querySelectorAll('.gh-footer-menu').forEach((menu) => {
    if (footerQuery.matches) menu.removeAttribute('open');
    else menu.setAttribute('open', '');
  });
  syncFooterMenus();
  footerQuery.addEventListener('change', syncFooterMenus);

  const updateCartCount = (count) => {
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
      node.textContent = count;
      const link = node.closest('a');
      if (link) link.setAttribute('aria-label', `Cart with ${count} items`);
    });
  };

  document.addEventListener('click', (event) => {
    const menuButton = event.target.closest('[data-gh-menu-button]');
    document.querySelectorAll('.gh-nav-menu.is-open').forEach((menu) => {
      if (!menuButton || menu !== menuButton.closest('.gh-nav-menu')) {
        menu.classList.remove('is-open');
        menu.querySelector('[data-gh-menu-button]')?.setAttribute('aria-expanded', 'false');
      }
    });
    if (menuButton) {
      const menu = menuButton.closest('.gh-nav-menu');
      const open = menu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-gh-sort]')) {
      const url = new URL(location.href);
      url.searchParams.set('sort_by', event.target.value);
      location.assign(url.toString());
    }
    if (event.target.matches('[data-gh-variant]')) {
      const option = event.target.selectedOptions[0];
      const panel = event.target.closest('[data-gh-product]');
      const available = option?.dataset.available === 'true';
      panel?.querySelector('[data-gh-product-price]')?.replaceChildren(option?.dataset.price || '');
      panel?.querySelector('[data-gh-product-availability]')?.replaceChildren(available ? 'Available in selected option' : 'Selected option is sold out');
      const button = panel?.querySelector('[name="add"]');
      if (button) button.disabled = !available;
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-product-form]');
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector('[name="add"]');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error('Unable to add this product.');
      const cart = await fetch(window.Shopify.routes.root + 'cart.js').then((result) => result.json());
      updateCartCount(cart.item_count);
      form.querySelector('[data-gh-form-message]')?.replaceChildren('Added to your gear.');
      document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true, detail: { cart } }));
    } catch (error) {
      button.setAttribute('data-error', error.message);
      form.querySelector('[data-gh-form-message]')?.replaceChildren(error.message);
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });

  document.querySelectorAll('[data-countdown-end]').forEach((section) => {
    const output = section.querySelector('[data-gh-countdown]');
    const end = Date.parse(section.dataset.countdownEnd);
    if (!output || !Number.isFinite(end) || end <= Date.now()) return;
    output.hidden = false;
    const render = () => {
      const remaining = end - Date.now();
      if (remaining <= 0) {
        output.hidden = true;
        return;
      }
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      output.textContent = `${String(days).padStart(2, '0')}D : ${String(hours).padStart(2, '0')}H : ${String(minutes).padStart(2, '0')}M`;
      setTimeout(render, 60000);
    };
    render();
  });
})();
