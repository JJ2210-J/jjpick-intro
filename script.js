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

  // 중간고사: 내가 이미 보낸 요청(검토 대기)과 같은 제품이면 목록에서 확인하게 한다
  const sameRequest = findWaitingRequest(itemName);
  if (sameRequest !== null) {
    return {
      type: 'info',
      text: '이미 요청한 제품이에요 — ' + sameRequest.item + '(검토 대기). 아래 내 요청 목록에 표시해 두었어요. 다른 제품을 입력하면 다음 단계로 갈 수 있어요.',
      requestId: sameRequest.id
    };
  }

  return { type: 'ok' };
}

function clearHighlight() {
  cards.forEach(function (card) {
    card.classList.remove('is-highlight');
  });
  document.querySelectorAll('.request-item.is-highlight').forEach(function (item) {
    item.classList.remove('is-highlight');
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
  } else if (result.card) {
    // 이미 있는 상품이면: 판매처 필터를 '전체'로 돌리고 그 카드만 강조해서 보여 준다
    itemInput.removeAttribute('aria-invalid');
    chips[0].click();
    result.card.classList.add('is-highlight');
    result.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // 이미 요청한 제품이면: 내 요청 목록의 그 요청을 강조한다
    itemInput.removeAttribute('aria-invalid');
    const requestItem = requestList.querySelector('.request-item[data-id="' + result.requestId + '"]');
    requestItem.classList.add('is-highlight');
    requestItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  addRequest();
  doneMessage.textContent = '"' + itemInput.value.trim() + '"(' + getCategory() + ' · ' + budgetSelect.value +
    ') 추천 요청을 받았어요. 내 요청 목록에 추가했으니, 직접 써 본 영상이 올라오기 전까지 언제든 취소할 수 있어요.';
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

// ===== 중간고사: 내 요청 목록 (요청 완료 → 목록 추가 → 취소 / 다시 요청) =====

const myRequestsBox = document.querySelector('#myRequests');
const requestList = document.querySelector('#requestList');
const requestCount = document.querySelector('#requestCount');
const listMessage = document.querySelector('#listMessage');
const defaultListMessage = listMessage.textContent;
const emptyRequests = document.querySelector('#emptyRequests');
const cancelDialog = document.querySelector('#cancelDialog');
const cancelText = document.querySelector('#cancelText');

// 보낸 요청을 담는 배열 — 새로 고침하면 비워진다(서버 없이 브라우저에서만 동작하는 프로토타입)
const myRequests = [];
let nextRequestId = 1;
let cancelTargetId = null;   // 확인 창이 열려 있는 동안 취소하려는 요청의 번호

const statusText = { waiting: '검토 대기', cancelled: '취소됨' };

function findRequest(id) {
  for (let i = 0; i < myRequests.length; i++) {
    if (myRequests[i].id === id) {
      return myRequests[i];
    }
  }
  return null;
}

// 같은 제품의 검토 대기 요청을 찾는다 — 없으면 null (띄어쓰기·대소문자는 무시)
function findWaitingRequest(itemName) {
  const keyword = normalize(itemName);
  for (let i = 0; i < myRequests.length; i++) {
    if (myRequests[i].status === 'waiting' && normalize(myRequests[i].item) === keyword) {
      return myRequests[i];
    }
  }
  return null;
}

// 확인 화면에서 요청을 보내면 지금 입력값으로 목록에 하나 추가한다
function addRequest() {
  const now = new Date();
  myRequests.push({
    id: nextRequestId,
    item: itemInput.value.trim(),
    category: getCategory(),
    budget: budgetSelect.value,
    memo: memoInput.value.trim(),
    time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    status: 'waiting'
  });
  nextRequestId = nextRequestId + 1;
  renderRequests();
  showListMessage('"' + itemInput.value.trim() + '" 요청을 목록에 추가했어요.', 'is-ready');
}

function showListMessage(text, type) {
  listMessage.textContent = text;
  listMessage.classList.remove('is-ready', 'is-error', 'is-info');
  if (type) {
    listMessage.classList.add(type);
  }
}

// 요청 하나를 목록의 li 로 만든다
function createRequestItem(request) {
  const li = document.createElement('li');
  li.className = 'request-item';
  li.dataset.id = request.id;
  if (request.status === 'cancelled') {
    li.classList.add('is-cancelled');
  }

  const head = document.createElement('div');
  head.className = 'request-item-head';
  const name = document.createElement('h4');
  name.textContent = request.item;
  const badge = document.createElement('span');
  badge.className = 'status-badge is-' + request.status;
  badge.textContent = statusText[request.status];
  head.append(name, badge);

  const meta = document.createElement('p');
  meta.className = 'request-meta';
  meta.textContent = request.category + ' · ' + request.budget + ' · ' + request.time + ' 요청';

  li.append(head, meta);

  if (request.memo !== '') {
    const memo = document.createElement('p');
    memo.className = 'request-memo';
    memo.textContent = '메모: ' + request.memo;
    li.append(memo);
  }

  // 상태에 따라 할 수 있는 행동이 바뀐다: 검토 대기 → 취소, 취소됨 → 다시 요청
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.id = request.id;
  button.className = 'edit-button';
  if (request.status === 'waiting') {
    button.dataset.action = 'cancel';
    button.textContent = '요청 취소';
  } else {
    button.dataset.action = 'restore';
    button.textContent = '다시 요청하기';
  }
  li.append(button);
  return li;
}

// 배열 내용대로 목록·건수·빈 목록 안내를 다시 그린다
function renderRequests() {
  requestList.textContent = '';
  let waitingCount = 0;

  myRequests.forEach(function (request) {
    requestList.append(createRequestItem(request));
    if (request.status === 'waiting') {
      waitingCount = waitingCount + 1;
    }
  });

  const cancelledCount = myRequests.length - waitingCount;
  if (myRequests.length === 0) {
    requestCount.textContent = '0건';
  } else {
    requestCount.textContent = '검토 대기 ' + waitingCount + '건 · 취소 ' + cancelledCount + '건';
  }

  requestList.hidden = myRequests.length === 0;
  emptyRequests.hidden = myRequests.length !== 0;
}

// 목록 안의 버튼은 하나의 click 이벤트에서 data-action 으로 나눠 처리한다
requestList.addEventListener('click', function (event) {
  const button = event.target.closest('button[data-action]');
  if (button === null) {
    return;
  }
  const request = findRequest(Number(button.dataset.id));

  if (button.dataset.action === 'cancel') {
    cancelTargetId = request.id;
    cancelText.textContent = '"' + request.item + '"(' + request.category + ' · ' + request.budget +
      ') 요청을 취소하면 추천 영상 준비가 멈춰요. 취소한 뒤에도 목록에서 다시 요청할 수 있어요.';
    cancelDialog.showModal();
    return;
  }

  // 다시 요청하기: 같은 제품이 이미 검토 대기 중이면 되살리지 않는다
  const waitingRequest = findWaitingRequest(request.item);
  if (waitingRequest !== null) {
    clearHighlight();
    requestList.querySelector('.request-item[data-id="' + waitingRequest.id + '"]').classList.add('is-highlight');
    showListMessage('같은 제품("' + request.item + '")의 요청이 이미 검토 대기 중이라 다시 요청할 수 없어요. 표시한 요청을 확인해 주세요.', 'is-error');
    return;
  }
  request.status = 'waiting';
  renderRequests();
  showListMessage('"' + request.item + '" 요청을 다시 보냈어요. 상태가 검토 대기로 바뀌었어요.', 'is-ready');
  focusRequestButton(request.id);
});

function focusRequestButton(id) {
  requestList.querySelector('button[data-id="' + id + '"]').focus();
}

// 확인 창: 그대로 두기 → 아무것도 바꾸지 않음
document.querySelector('#cancelKeep').addEventListener('click', function () {
  cancelDialog.close();
});

// Esc 로 닫거나 그대로 두기를 누르면 원래 버튼으로 커서를 돌려준다
cancelDialog.addEventListener('close', function () {
  if (cancelTargetId !== null) {
    showListMessage('취소하지 않았어요. 요청은 그대로 검토 대기예요.', 'is-info');
    focusRequestButton(cancelTargetId);
    cancelTargetId = null;
  }
});

// 확인 창: 요청 취소하기 → 상태를 취소됨으로 바꾼다
document.querySelector('#cancelConfirm').addEventListener('click', function () {
  const request = findRequest(cancelTargetId);
  request.status = 'cancelled';
  cancelTargetId = null;
  cancelDialog.close();
  renderRequests();
  showListMessage('"' + request.item + '" 요청을 취소했어요. 마음이 바뀌면 "다시 요청하기"를 눌러 주세요.', 'is-info');
  focusRequestButton(request.id);
});

// 완료 화면의 "내 요청 목록 보기"
document.querySelector('#showMyRequests').addEventListener('click', function () {
  myRequestsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  myRequestsBox.focus({ preventScroll: true });
});

// 목록이 비었을 때 "첫 추천 요청 하기": 흐름을 시작하거나, 이미 진행 중이면 그 단계로 커서를 옮긴다
document.querySelector('#emptyStart').addEventListener('click', function () {
  if (requestIntro.hidden === false) {
    document.querySelector('#requestStart').click();
    return;
  }
  for (let i = 0; i < requestSteps.length; i++) {
    if (requestSteps[i].hidden === false) {
      focusStep(Number(requestSteps[i].dataset.step));
    }
  }
});

renderRequests();

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
