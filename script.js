// 판매처 필터: 누른 버튼의 판매처 상품만 보여 준다
const chips = document.querySelectorAll('.filter-chips .chip');
const cards = document.querySelectorAll('.product-card');

chips.forEach(function (chip) {
  chip.addEventListener('click', function () {
    const store = chip.dataset.store;

    // 누른 버튼만 선택 상태로 표시
    chips.forEach(function (other) {
      const selected = other === chip;
      other.classList.toggle('is-active', selected);
      other.setAttribute('aria-pressed', String(selected));
    });

    // '전체'면 모두 보이고, 아니면 같은 판매처만 남긴다
    cards.forEach(function (card) {
      card.hidden = store !== 'all' && card.dataset.store !== store;
    });
  });
});
