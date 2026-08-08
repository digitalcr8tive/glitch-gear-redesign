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
    const arrow = event.target.closest('[data-gh-scroll]');
    if (!arrow) return;
    arrow.parentElement.querySelector('[data-gh-rail]')?.scrollBy({
      left: Number(arrow.dataset.ghScroll) * 260,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
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
      document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true, detail: { cart } }));
    } catch (error) {
      button.setAttribute('data-error', error.message);
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
