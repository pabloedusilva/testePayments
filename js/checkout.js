// Checkout page logic
(function(){
  const money = (v) => v.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
  const cart = JSON.parse(localStorage.getItem('pizza_cart') || '[]');
  const pizzasData = null; // We will use info stored in cart (already has id, size, price)

  // Derive order items list and totals using menu/cart logic convention
  let itemsTotal = 0;
  let entrega = 5; // same as cart.js
  const orderItemsEl = document.getElementById('orderItems');
  if (Array.isArray(cart) && cart.length) {
    cart.forEach(item => {
      const price = (item.price || 0) * (item.qt || 1);
      itemsTotal += price;
      const imgSrc = item.img || '';
      const name = item.name || '';
      // name fallback (id + size) if not saved
      const sizeText = typeof item.size === 'number' ? ['PEQUENA','MÉDIO','GRANDE'][item.size] : '';
      const removed = item.removedIngredients ? `<br><small style="color:#999;">Sem: ${item.removedIngredients}</small>` : '';
      const displayName = name ? `${name} (${sizeText})${removed}` : `${item.id || ''} (${sizeText})${removed}`;

      const row = document.createElement('div');
      row.className = 'order-item';
      row.innerHTML = `
        <img src="${item.img || ''}" alt="item">
        <div>
          <div class="name">${displayName}</div>
          <div class="details">Qtd: ${item.qt || 1}</div>
        </div>
        <div class="qty">${money(price)}</div>
      `;
      orderItemsEl?.appendChild(row);
    });
  } else {
    const empty = document.createElement('div');
    empty.className = 'order-item';
    empty.innerHTML = '<div class="name">Seu carrinho está vazio.</div>';
    orderItemsEl?.appendChild(empty);
  }

  const subtotal = itemsTotal + entrega;
  const desconto = subtotal * 0.1;
  const total = subtotal - desconto;

  document.getElementById('resumoItens').textContent = money(itemsTotal);
  document.getElementById('resumoEntrega').textContent = money(entrega);
  document.getElementById('resumoSubtotal').textContent = money(subtotal);
  document.getElementById('resumoDesconto').textContent = money(desconto);
  document.getElementById('resumoTotal').textContent = money(total);

  // Stepper helpers
  const steps = Array.from(document.querySelectorAll('.stepper .step'));
  let activeStep = 1;
  const connectors = Array.from(document.querySelectorAll('.stepper .connector'));
  function markCompleted(upTo){
    steps.forEach(s=>{
      const stepNum = Number(s.getAttribute('data-step'));
      const completed = stepNum < upTo; // only previous steps
      s.classList.toggle('completed', completed);
    });
    // Mark connectors before the active step as completed
    connectors.forEach((c, idx)=>{
      // connector 0 connects step 1->2, connector 1 connects 2->3, etc.
      const connectsUpTo = idx + 2; // e.g., idx 0 completes when upTo >= 2
      c.classList.toggle('completed', upTo >= connectsUpTo);
    });
  }

  function setActiveStep(n){
    activeStep = n;
    const target = String(n);
    document.querySelectorAll('.stepper .step').forEach(s=>{
      const isActive = s.getAttribute('data-step')===target;
      s.classList.toggle('active', isActive);
      s.setAttribute('aria-current', isActive ? 'step' : 'false');
      // Keep aria-disabled in sync with disabled
      if (s.hasAttribute('disabled')) s.setAttribute('aria-disabled','true'); else s.removeAttribute('aria-disabled');
    });
    document.querySelectorAll('[data-step-content]').forEach(c=>{
      const show = c.getAttribute('data-step-content')===target;
      if (show) c.removeAttribute('hidden'); else c.setAttribute('hidden','');
    });
    markCompleted(n);
  }

  // initial step
  setActiveStep(1);

  // Step 1 -> Step 2
  const personalRequired = ['nome','sobrenome','telefone','email'];
  function isPersonalValid(){ return personalRequired.every(id=>document.getElementById(id).value.trim()); }
  function enableStep2IfValid(){
    const step2Btn = steps.find(s=>s.getAttribute('data-step')==='2');
    if (!step2Btn) return;
    if (isPersonalValid()) step2Btn.removeAttribute('disabled'); else step2Btn.setAttribute('disabled','');
  }
  enableStep2IfValid();

  document.getElementById('goStep2').addEventListener('click', ()=>{
    if (!isPersonalValid()) { alert('Preencha seus dados pessoais.'); return; }
    setActiveStep(2);
  });

  // Step 2 back
  document.getElementById('backToStep1').addEventListener('click', ()=> setActiveStep(1));

  // Step 2 -> Step 3
  const addressRequired = ['cep','logradouro','numero','bairro','cidade','uf'];
  function isAddressValid(){ return addressRequired.every(id=>document.getElementById(id).value.trim()); }
  function enableStep3IfValid(){
    const step3Btn = steps.find(s=>s.getAttribute('data-step')==='3');
    if (!step3Btn) return;
    if (isAddressValid()) step3Btn.removeAttribute('disabled'); else step3Btn.setAttribute('disabled','');
  }
  enableStep3IfValid();

  document.getElementById('goStep3').addEventListener('click', ()=>{
    if (!isAddressValid()) { alert('Preencha o endereço completo.'); return; }
    setActiveStep(3);
  });

  // Live validation to unlock steps
  personalRequired.forEach(id=>{
    document.getElementById(id).addEventListener('input', enableStep2IfValid);
  });
  addressRequired.forEach(id=>{
    document.getElementById(id).addEventListener('input', enableStep3IfValid);
  });

  // Click/keyboard navigation on step headers with guards
  steps.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const stepNum = Number(btn.getAttribute('data-step'));
      if (btn.hasAttribute('disabled')) return;
      // Ensure previous steps are valid before allowing navigation forward
      if (stepNum===2 && !isPersonalValid()) return;
      if (stepNum===3 && (!isPersonalValid() || !isAddressValid())) return;
      setActiveStep(stepNum);
    });
    btn.addEventListener('keydown', (e)=>{
      if (e.key==='Enter' || e.key===' ') { e.preventDefault(); btn.click(); }
    });
  });

  // Step 3 back
  document.getElementById('backToStep2').addEventListener('click', ()=> setActiveStep(2));

  // CEP auto-fill via ViaCEP
  const cepInput = document.getElementById('cep');
  const cepError = document.getElementById('cepError');
  const buscarCepBtn = document.getElementById('buscarCep');

  function sanitizeCEP(v){ return (v||'').replace(/\D/g,'').slice(0,8); }
  function maskCEP(v){ const s = sanitizeCEP(v); return s.length>5 ? s.slice(0,5)+'-'+s.slice(5) : s; }

  function fillAddress(data){
    document.getElementById('logradouro').value = data.logradouro || '';
    document.getElementById('bairro').value = data.bairro || '';
    document.getElementById('cidade').value = data.localidade || '';
    document.getElementById('uf').value = data.uf || '';
  }

  async function fetchCEP(cep){
    if (!cep || cep.length !== 8) return;
    cepError.textContent = '';
    buscarCepBtn.classList.add('loading');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const json = await res.json();
      if (json.erro) {
        cepError.textContent = 'CEP não encontrado.';
        return;
      }
      fillAddress(json);
    } catch (e) {
      cepError.textContent = 'Não foi possível buscar o CEP.';
    } finally {
      buscarCepBtn.classList.remove('loading');
    }
  }

  cepInput.addEventListener('input', (e) => {
    const masked = maskCEP(e.target.value);
    e.target.value = masked;
    const clean = sanitizeCEP(masked);
    if (clean.length === 8) {
      fetchCEP(clean);
    }
    enableStep3IfValid();
  });

  buscarCepBtn.addEventListener('click', () => {
    const clean = sanitizeCEP(cepInput.value);
    fetchCEP(clean);
  });

  // Prosseguir para pagamento (apenas link em HTML)
})();
