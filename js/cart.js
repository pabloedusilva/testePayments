// Event listener removido para evitar duplicação
// A funcionalidade de adicionar ao carrinho está no geral.js
//Salvar itens do carrinho no localStorage
const saveCart = () => {
  localStorage.setItem("pizza_cart", JSON.stringify(cart));
};

document.querySelector(".menu-openner").addEventListener("click", () => {
  if (cart.length > 0) {
    document.querySelector("aside").style.left = 0;
  }
});

document.querySelector(".menu-closer").addEventListener("click", () => {
  document.querySelector("aside").style.left = "100vw";
});

function updateCart() {
  document.querySelector(".menu-openner span").innerHTML = cart.length;

  if (cart.length > 0) {
    document.querySelector("aside").classList.add("show");
    document.querySelector(".cart").innerHTML = ""; //Limpar carrinho

    let pizzasValor = 0;
    let subtotal = 0;
    let entrega = 5;
    let desconto = 0;
    let total = 0;

    for (let i in cart) {
      // Determinar se é pizza ou drink e buscar no array correto
      let dataArray = cart[i].type === 'pizza' ? pizzas : drinks;
      let pizzaItem = dataArray.find((item) => item.id == cart[i].id);
      
      // Se não encontrou o item, pular para o próximo
      if (!pizzaItem) {
        continue;
      }
      
      pizzasValor += cart[i].price * cart[i].qt;

      let pizzaSizeName = pizzaItem.sizes[cart[i].size];
      let pizzaName = `${pizzaItem.name} (${pizzaSizeName})`;
      
      // Adicionar ingredientes removidos se houver
      if (cart[i].removedIngredients && cart[i].removedIngredients.length > 0) {
        pizzaName += `<br><small style="color: #999; font-size: 11px;">Sem: ${cart[i].removedIngredients}</small>`;
      }
      
      let cartItem = document
        .querySelector(".models .cart--item")
        .cloneNode(true);

      cartItem.querySelector("img").src = pizzaItem.img;
      cartItem.querySelector(".cart--item-nome").innerHTML = pizzaName;
      cartItem.querySelector(".cart--item--qt").innerHTML = cart[i].qt;
      cartItem
        .querySelector(".cart--item-qtmenos")
        .addEventListener("click", () => {
          if (cart[i].qt > 1) {
            cart[i].qt--;
          } else {
            cart.splice(i, 1);
          }
          updateCart();
          saveCart();
        });
      cartItem
        .querySelector(".cart--item-qtmais")
        .addEventListener("click", () => {
          cart[i].qt++;
          updateCart();
          saveCart();
        });

      document.querySelector(".cart").append(cartItem);
    }

    subtotal = pizzasValor + entrega;
    desconto = subtotal * 0.1;
    total = subtotal - desconto;

    document.querySelector(
      ".pizzasValor span:last-child"
    ).innerHTML = `${pizzasValor.toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })}`;
    document.querySelector(
      ".entrega span:last-child"
    ).innerHTML = `${entrega.toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })}`;
    document.querySelector(
      ".subtotal span:last-child"
    ).innerHTML = `${subtotal.toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })}`;
    document.querySelector(
      ".desconto span:last-child"
    ).innerHTML = `${desconto.toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })}`;
    document.querySelector(
      ".total span:last-child"
    ).innerHTML = `${total.toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })}`;
  } else {
    localStorage.clear();
    document.querySelector("aside").classList.remove("show"); //Closet cart
    document.querySelector("aside").style.left = "100vw";
  }
}

// Controla a sequência de modais: sucesso -> avaliação
let ratingState = {
  value: 0,
  openedAfterSuccess: false,
  inited: false
};

function openRatingModal() {
  const ratingArea = document.querySelector('.rating.pizzaWindowArea');
  if (!ratingArea) return;
  // Reset estado visual
  ratingState.value = 0;
  document.querySelectorAll('.rating-stars .star').forEach(s => {
    s.classList.remove('active');
    s.classList.remove('fa-solid');
    s.classList.add('fa-regular');
  });
  const ta = document.getElementById('ratingComment');
  if (ta) ta.value = '';
  const submitBtn = document.getElementById('ratingSubmit');
  if (submitBtn) submitBtn.disabled = true;

  // Abrir modal com mesma transição
  ratingArea.style.opacity = 0;
  ratingArea.style.display = 'flex';
  setTimeout(() => { ratingArea.style.opacity = 1; }, 200);
}

function closeRatingModal() {
  const ratingArea = document.querySelector('.rating.pizzaWindowArea');
  if (!ratingArea) return;
  ratingArea.style.opacity = 0;
  setTimeout(() => { ratingArea.style.display = 'none'; }, 200);
}

function initRatingInteractionsOnce() {
  if (ratingState.inited) return;
  ratingState.inited = true;

  // Clique nas estrelas
  document.querySelectorAll('.rating-stars .star').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value')) || 0;
      ratingState.value = val;
      // marca todas até o valor como ativas
      document.querySelectorAll('.rating-stars .star').forEach(s => {
        const sVal = parseInt(s.getAttribute('data-value')) || 0;
        s.classList.toggle('active', sVal <= val);
        // troca para sólido quando ativo
        if (s.classList.contains('active')) {
          s.classList.remove('fa-regular');
          s.classList.add('fa-solid');
        } else {
          s.classList.add('fa-regular');
          s.classList.remove('fa-solid');
        }
      });
      const submitBtn = document.getElementById('ratingSubmit');
      if (submitBtn) submitBtn.disabled = ratingState.value === 0;
    });
  });

  // Acessibilidade: Enter/Space seleciona estrela focada
  document.querySelectorAll('.rating-stars .star').forEach(star => {
    star.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        star.click();
      }
    });
  });

  // Submit
  const submitBtn = document.getElementById('ratingSubmit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (ratingState.value === 0) return;
      // Simples feedback: fechar modal e logar
      const comment = (document.getElementById('ratingComment')?.value || '').trim();
      try {
        const payload = { stars: ratingState.value, comment, ts: Date.now() };
        // Poderíamos enviar para backend aqui; por enquanto, salva local
        const prev = JSON.parse(localStorage.getItem('last_rating') || 'null');
        localStorage.setItem('last_rating', JSON.stringify(payload));
        if (window && window.console) console.log('Avaliação registrada:', payload, 'Anterior:', prev);
      } catch (_) {}
      closeRatingModal();
    });
  }

  // Fechar mobile/back
  document.querySelector('.rating-close')?.addEventListener('click', closeRatingModal);
  // Pular avaliação
  document.getElementById('ratingSkip')?.addEventListener('click', closeRatingModal);
  // Fechar com ESC quando aberto
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const ratingArea = document.querySelector('.rating.pizzaWindowArea');
      if (ratingArea && ratingArea.style.display === 'flex') closeRatingModal();
    }
  });
}

document.querySelector(".cart--finalizar").addEventListener("click", () => {
  // Redireciona para checkout mantendo o carrinho
  document.querySelector(".fa-cart-shopping").classList.remove("pulse");
  // garante cart persistido
  localStorage.setItem("pizza_cart", JSON.stringify(cart));
  window.location.href = 'checkout.html';
});
