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

// ===== 5주차: 추천 요청을 제출하면 결과를 문구·색·버튼 상태로 알려 준다 =====

// 폼·입력창·버튼·결과 문구를 찾는다
const requestForm = document.querySelector('#request-form');
const itemInput = document.querySelector('#item');
const requestButton = document.querySelector('#requestButton');
const requestMessage = document.querySelector('#requestMessage');

// 버튼의 처음 글자는 바뀌지 않으므로 const, 요청 완료 여부는 실행 중 바뀌므로 let
const defaultButtonText = requestButton.textContent;
let isRequested = false;

// 비교하기 쉽게 띄어쓰기를 빼고 소문자로 맞춘다 ("에어 프라이어" = "에어프라이어")
function normalize(text) {
  return text.replace(/\s/g, '').toLowerCase();
}

// 추천 모음에 이미 있는 상품 카드를 찾는다 — 없으면 null
function findPickedCard(itemName) {
  const keyword = normalize(itemName);

  for (let i = 0; i < cards.length; i++) {
    const productName = cards[i].querySelector('.product-name').textContent;
    if (normalize(productName).includes(keyword)) {
      return cards[i];
    }
  }
  return null;
}

// 입력값에 따라 결과 종류와 안내 문구를 정한다
function checkRequest(itemName) {
  if (itemName === '') {
    return { type: 'error', text: '고민 중인 제품을 입력해 주세요.' };
  }

  if (itemName.length < 2) {
    return { type: 'error', text: '제품 이름을 두 글자 이상 입력해 주세요.' };
  }

  const pickedCard = findPickedCard(itemName);
  if (pickedCard !== null) {
    const productName = pickedCard.querySelector('.product-name').textContent;
    return {
      type: 'info',
      text: '이미 추천 모음에 있는 제품이에요 — ' + productName + '. 위에 표시한 상품 카드를 확인해 보세요.',
      card: pickedCard
    };
  }

  return {
    type: 'success',
    text: '"' + itemName + '" 추천 요청이 접수되었어요. 영상이 올라오면 추천 모음에 추가할게요.'
  };
}

// 결과를 화면에 보여 준다: 문구·색(class)·버튼 상태를 함께 바꾼다
function showResult(result) {
  requestMessage.textContent = result.text;
  requestMessage.classList.remove('is-ready', 'is-error', 'is-info', 'is-success');
  requestMessage.classList.add('is-' + result.type);

  // 입력이 잘못됐으면 입력칸을 빨갛게 하고 다시 입력하도록 커서를 옮긴다
  if (result.type === 'error') {
    itemInput.setAttribute('aria-invalid', 'true');
    itemInput.focus();
  } else {
    itemInput.removeAttribute('aria-invalid');
  }

  // 이미 있는 상품이면: 판매처 필터를 '전체'로 돌리고 그 카드만 강조해서 보여 준다
  cards.forEach(function (card) {
    card.classList.remove('is-highlight');
  });
  if (result.type === 'info') {
    chips[0].click();
    result.card.classList.add('is-highlight');
    result.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 새 요청이 접수되면 버튼을 완료 상태로 바꾸고 같은 요청이 두 번 가지 않게 막는다
  if (result.type === 'success') {
    isRequested = true;
    requestButton.textContent = '요청 완료';
    requestButton.disabled = true;
    requestButton.classList.add('is-done');
  }
}

// 폼이 제출될 때 실행할 함수
function handleRequest(event) {
  event.preventDefault();          // 페이지 새로 고침을 막는다
  const itemName = itemInput.value.trim();
  showResult(checkRequest(itemName));
}

requestForm.addEventListener('submit', handleRequest);

// ===== 6주차: click · input · change 이벤트와 탭 UI =====

// --- input: 입력할 때마다 글자 수를 보여 준다 ---
const itemCount = document.querySelector('#itemCount');
const agreeCheck = document.querySelector('#agreeCheck');
const maxLength = itemInput.maxLength;

function handleItemInput() {
  const currentLength = itemInput.value.length;
  itemCount.textContent = currentLength + ' / ' + maxLength;

  // 15자를 넘으면 글자 수를 빨간색으로 바꿔 거의 다 찼다고 알린다
  if (currentLength >= 15) {
    itemCount.classList.add('is-near-limit');
  } else {
    itemCount.classList.remove('is-near-limit');
  }

  // 요청을 마친 뒤 다른 제품을 입력하기 시작하면 버튼을 다시 쓸 수 있게 되돌린다(5주차)
  if (isRequested === true) {
    isRequested = false;
    requestButton.textContent = defaultButtonText;
    requestButton.classList.remove('is-done');
    requestButton.disabled = !agreeCheck.checked;
  }
}

itemInput.addEventListener('input', handleItemInput);

// --- change: 안내 확인에 체크해야 요청 버튼이 켜진다 ---
function handleAgreeChange() {
  const agreed = agreeCheck.checked;

  // 이미 요청을 마친 상태면 버튼은 계속 '요청 완료'로 둔다
  if (isRequested === false) {
    requestButton.disabled = !agreed;
  }

  requestMessage.classList.remove('is-error', 'is-info', 'is-success');
  if (agreed) {
    requestMessage.textContent = '이제 추천을 요청할 수 있어요. 제품을 입력하고 버튼을 눌러 주세요.';
    requestMessage.classList.add('is-ready');
  } else {
    requestMessage.textContent = '안내 확인에 체크하면 추천을 요청할 수 있어요.';
    requestMessage.classList.remove('is-ready');
  }
}

agreeCheck.addEventListener('change', handleAgreeChange);

// --- click: 찜하기 버튼을 누르면 버튼 글자·색과 찜 개수 문구가 함께 바뀐다 ---
const saveButtons = document.querySelectorAll('.save-button');
const saveSummary = document.querySelector('#saveSummary');
let savedCount = 0;

function updateSaveSummary() {
  if (savedCount === 0) {
    saveSummary.textContent = '마음에 드는 상품의 ♡ 찜하기를 눌러 보세요.';
    saveSummary.classList.remove('has-saved');
  } else {
    saveSummary.textContent = '찜한 상품 ' + savedCount + '개 — 다시 누르면 찜이 풀려요.';
    saveSummary.classList.add('has-saved');
  }
}

function handleSaveClick(event) {
  const button = event.currentTarget;
  const card = button.closest('.product-card');
  const isSaved = button.classList.toggle('is-saved');

  card.classList.toggle('is-saved', isSaved);
  button.setAttribute('aria-pressed', String(isSaved));
  button.textContent = isSaved ? '♥ 찜했어요' : '♡ 찜하기';

  if (isSaved) {
    savedCount = savedCount + 1;
  } else {
    savedCount = savedCount - 1;
  }
  updateSaveSummary();
}

saveButtons.forEach(function (button) {
  button.addEventListener('click', handleSaveClick);
});

// --- 탭: 누른 탭만 선택 표시하고, 그 탭의 패널만 보여 준다 ---
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

function resetTabsAndPanels() {
  tabs.forEach(function (tab) {
    tab.classList.remove('is-active');
    tab.setAttribute('aria-selected', 'false');
  });
  panels.forEach(function (panel) {
    panel.classList.remove('is-active');
    panel.hidden = true;
  });
}

function activateTab(clickedTab) {
  const targetPanel = document.querySelector(clickedTab.dataset.target);
  clickedTab.classList.add('is-active');
  clickedTab.setAttribute('aria-selected', 'true');
  targetPanel.classList.add('is-active');
  targetPanel.hidden = false;
}

function handleTabClick(event) {
  resetTabsAndPanels();
  activateTab(event.currentTarget);
}

tabs.forEach(function (tab) {
  tab.addEventListener('click', handleTabClick);
});
