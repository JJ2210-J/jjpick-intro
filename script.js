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

// ===== 7주차: 추천 요청 흐름 (시작 → 제품 입력 → 조건 선택 → 확인 → 완료) =====
// 5주차의 입력 검사, 6주차의 글자 수·안내 확인 체크박스는 각 단계 안에서 그대로 쓴다

// 흐름 전체
const requestIntro = document.querySelector('#requestIntro');
const requestFlow = document.querySelector('#requestFlow');
const flowProgress = document.querySelector('#flowProgress');
const flowSteps = document.querySelectorAll('.flow-step');
const requestSteps = document.querySelectorAll('.request-step');
const stepNames = ['제품 입력', '조건 선택', '확인'];

// 1단계: 제품 입력
const stepItem = document.querySelector('#stepItem');
const itemInput = document.querySelector('#item');
const itemCount = document.querySelector('#itemCount');
const requestMessage = document.querySelector('#requestMessage');
const defaultItemMessage = requestMessage.textContent;
const maxLength = itemInput.maxLength;

// 2단계: 조건 선택
const stepOption = document.querySelector('#stepOption');
const categoryGroup = document.querySelector('.choice-group');
const categoryInputs = document.querySelectorAll('input[name="category"]');
const categoryError = document.querySelector('#categoryError');
const budgetSelect = document.querySelector('#budget');
const budgetError = document.querySelector('#budgetError');
const memoInput = document.querySelector('#memo');

// 3단계: 확인
const stepConfirm = document.querySelector('#stepConfirm');
const agreeCheck = document.querySelector('#agreeCheck');
const agreeMessage = document.querySelector('#agreeMessage');
const defaultAgreeMessage = agreeMessage.textContent;
const sendButton = document.querySelector('#sendButton');

// 완료
const doneMessage = document.querySelector('#doneMessage');

// 단계 하나만 보여 주고, 위쪽 단계 표시와 진행 문구를 함께 바꾼다
function showStep(step) {
  requestSteps.forEach(function (item) {
    item.hidden = Number(item.dataset.step) !== step;
  });

  flowSteps.forEach(function (item) {
    const itemStep = Number(item.dataset.step);
    item.classList.toggle('is-current', itemStep === step);
    item.classList.toggle('is-done', itemStep < step);
    if (itemStep === step) {
      item.setAttribute('aria-current', 'step');
    } else {
      item.removeAttribute('aria-current');
    }
  });

  if (step <= 3) {
    flowProgress.textContent = step + ' / 3 · ' + stepNames[step - 1];
    flowProgress.classList.remove('is-complete');
  } else {
    flowProgress.textContent = '요청 완료 · 세 단계를 모두 마쳤어요';
    flowProgress.classList.add('is-complete');
  }
}

// 단계를 옮긴 뒤 커서를 그 단계로 옮긴다(1단계는 입력칸, 나머지는 제목)
function focusStep(step) {
  if (step === 1) {
    itemInput.focus();
    return;
  }
  const stepBox = document.querySelector('.request-step[data-step="' + step + '"]');
  stepBox.querySelector('h3').focus();
}

function goToStep(step) {
  showStep(step);
  focusStep(step);
}

// --- 시작 ---
document.querySelector('#requestStart').addEventListener('click', function () {
  requestIntro.hidden = true;
  requestFlow.hidden = false;
  goToStep(1);
});

// --- 이전·수정 버튼: data-go 에 적힌 단계로 돌아간다(입력한 값은 그대로 남아 있다) ---
document.querySelectorAll('[data-go]').forEach(function (button) {
  button.addEventListener('click', function (event) {
    goToStep(Number(event.currentTarget.dataset.go));
  });
});

// ----- 1단계: 제품 입력 -----

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

// 입력값에 따라 결과 종류와 안내 문구를 정한다(5주차)
function checkItem(itemName) {
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
      text: '이미 추천 모음에 있는 제품이에요 — ' + productName + '. 위에 표시한 상품 카드를 확인해 보고, 다른 제품을 입력하면 다음 단계로 갈 수 있어요.',
      card: pickedCard
    };
  }

  return { type: 'ok' };
}

function clearHighlight() {
  cards.forEach(function (card) {
    card.classList.remove('is-highlight');
  });
}

// 다음 단계로 못 갈 때: 문구·색(class)·입력칸 상태를 함께 바꾼다
function showItemResult(result) {
  requestMessage.textContent = result.text;
  requestMessage.classList.remove('is-error', 'is-info');
  requestMessage.classList.add('is-' + result.type);
  clearHighlight();

  if (result.type === 'error') {
    itemInput.setAttribute('aria-invalid', 'true');
    itemInput.focus();
  } else {
    // 이미 있는 상품이면: 판매처 필터를 '전체'로 돌리고 그 카드만 강조해서 보여 준다
    itemInput.removeAttribute('aria-invalid');
    chips[0].click();
    result.card.classList.add('is-highlight');
    result.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function resetItemMessage() {
  requestMessage.textContent = defaultItemMessage;
  requestMessage.classList.remove('is-error', 'is-info');
  itemInput.removeAttribute('aria-invalid');
  clearHighlight();
}

stepItem.addEventListener('submit', function (event) {
  event.preventDefault();          // 페이지 새로 고침을 막는다
  const result = checkItem(itemInput.value.trim());

  if (result.type !== 'ok') {
    showItemResult(result);
    return;
  }
  resetItemMessage();
  goToStep(2);
});

// 입력할 때마다 글자 수를 보여 주고, 15자를 넘으면 빨간색으로 알린다(6주차)
function updateItemCount() {
  const currentLength = itemInput.value.length;
  itemCount.textContent = currentLength + ' / ' + maxLength;

  if (currentLength >= 15) {
    itemCount.classList.add('is-near-limit');
  } else {
    itemCount.classList.remove('is-near-limit');
  }
}

itemInput.addEventListener('input', updateItemCount);

// ----- 2단계: 조건 선택 -----

// 고른 카테고리 — 아무것도 안 골랐으면 빈 문자열
function getCategory() {
  for (let i = 0; i < categoryInputs.length; i++) {
    if (categoryInputs[i].checked) {
      return categoryInputs[i].value;
    }
  }
  return '';
}

function showCategoryError(text) {
  categoryError.textContent = text;
  categoryGroup.classList.toggle('has-error', text !== '');
}

function showBudgetError(text) {
  budgetError.textContent = text;
  if (text === '') {
    budgetSelect.removeAttribute('aria-invalid');
  } else {
    budgetSelect.setAttribute('aria-invalid', 'true');
  }
}

// 고르면 그 항목의 오류 문구는 바로 지운다
categoryInputs.forEach(function (input) {
  input.addEventListener('change', function () {
    showCategoryError('');
  });
});

budgetSelect.addEventListener('change', function () {
  if (budgetSelect.value !== '') {
    showBudgetError('');
  }
});

stepOption.addEventListener('submit', function (event) {
  event.preventDefault();
  let firstMissing = null;

  if (getCategory() === '') {
    showCategoryError('카테고리를 하나 골라 주세요. 잘 모르겠으면 제품을 가장 많이 쓸 공간을 고르면 돼요.');
    firstMissing = categoryInputs[0];
  } else {
    showCategoryError('');
  }

  if (budgetSelect.value === '') {
    showBudgetError('예산을 골라 주세요. 정해 둔 예산이 없으면 "상관없음"을 고르면 돼요.');
    if (firstMissing === null) {
      firstMissing = budgetSelect;
    }
  } else {
    showBudgetError('');
  }

  // 빠진 항목이 있으면 다음 단계로 넘어가지 않고 첫 번째 빠진 곳으로 커서를 옮긴다
  if (firstMissing !== null) {
    firstMissing.focus();
    return;
  }

  showSummary();
  goToStep(3);
});

// ----- 3단계: 확인 -----

// 확인 화면은 들어올 때마다 지금 입력값으로 다시 채운다(수정한 값도 바로 반영)
function showSummary() {
  const memo = memoInput.value.trim();
  document.querySelector('#summaryItem').textContent = itemInput.value.trim();
  document.querySelector('#summaryCategory').textContent = getCategory();
  document.querySelector('#summaryBudget').textContent = budgetSelect.value;
  document.querySelector('#summaryMemo').textContent = memo === '' ? '없음' : memo;
}

// 안내 확인에 체크해야 요청 버튼이 켜진다(6주차)
agreeCheck.addEventListener('change', function () {
  const agreed = agreeCheck.checked;
  sendButton.disabled = !agreed;

  if (agreed) {
    agreeMessage.textContent = '이제 요청을 보낼 수 있어요.';
    agreeMessage.classList.add('is-ready');
  } else {
    agreeMessage.textContent = defaultAgreeMessage;
    agreeMessage.classList.remove('is-ready');
  }
});

stepConfirm.addEventListener('submit', function (event) {
  event.preventDefault();
  if (agreeCheck.checked === false) {
    return;
  }

  doneMessage.textContent = '"' + itemInput.value.trim() + '"(' + getCategory() + ' · ' + budgetSelect.value +
    ') 추천 요청을 받았어요. 직접 써 본 영상이 올라오면 추천 모음에 추가할게요.';
  goToStep(4);
});

// ----- 다시 시작: 입력·선택·오류·진행 상태를 모두 처음으로 -----
function resetRequest() {
  stepItem.reset();
  stepOption.reset();
  stepConfirm.reset();

  updateItemCount();
  resetItemMessage();
  showCategoryError('');
  showBudgetError('');

  agreeMessage.textContent = defaultAgreeMessage;
  agreeMessage.classList.remove('is-ready');
  sendButton.disabled = true;

  showSummary();
  doneMessage.textContent = '';
}

document.querySelector('#requestRestart').addEventListener('click', function () {
  resetRequest();
  goToStep(1);
});

// ===== 6주차: 찜하기와 주요 기능 탭 =====

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
