// 10주차: 자바스크립트가 켜져 있을 때만 모바일 메뉴를 접어 둔다(꺼져 있으면 메뉴가 그대로 보임)
document.documentElement.classList.add('js');

// 판매처 필터: 누른 버튼의 판매처 상품만 보여 준다
const chips = document.querySelectorAll('#picks .filter-chips .chip');
const cards = document.querySelectorAll('.product-card');
const pickResult = document.querySelector('#pickResult');

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

    // 10주차: 지금 보이는 상품 수를 알려 준다
    const shown = Array.from(cards).filter(function (card) { return !card.hidden; }).length;
    if (store === 'all') {
      pickResult.textContent = '추천 상품 ' + cards.length + '개를 모두 보여 주고 있어요.';
    } else if (shown === 0) {
      pickResult.textContent = chip.textContent + ' 상품은 아직 없어요. "전체"를 눌러 다른 상품을 보세요.';
    } else {
      pickResult.textContent = chip.textContent + ' 상품 ' + shown + '개를 보여 주고 있어요. (전체 ' + cards.length + '개)';
    }
  });
});

// ===== 10주차: 주요 메뉴 — 현재 위치 표시와 모바일 메뉴 =====

const mainNav = document.querySelector('#mainNav');
const menuToggle = document.querySelector('#menuToggle');
const navLinks = document.querySelectorAll('#mainMenu a');
const navTargets = Array.from(navLinks).map(function (link) {
  return document.querySelector(link.getAttribute('href'));
});
let navLockUntil = 0;   // 메뉴를 눌러 이동하는 동안에는 스크롤 위치로 덮어쓰지 않는다

// 현재 위치 메뉴 하나에만 표시(is-current)와 aria-current 를 주고, 나머지에서는 뺀다
function setCurrentNav(currentLink) {
  navLinks.forEach(function (link) {
    const isCurrent = link === currentLink;
    link.classList.toggle('is-current', isCurrent);
    if (isCurrent) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
  // 11주차: 브라우저 탭 제목에도 지금 보는 곳을 적는다 (예: "추천 요청 | JJ픽")
  if (currentLink) {
    document.title = currentLink.textContent.trim() + ' | JJ픽';
  }
}

function findNavLinkByHash(hash) {
  return Array.from(navLinks).find(function (link) { return link.getAttribute('href') === hash; }) || null;
}

// 화면 위쪽(고정 메뉴 바로 아래)을 지난 마지막 영역을 현재 위치로 본다. 맨 아래에 닿으면 마지막 메뉴.
function findNavLinkByScroll() {
  // 메뉴로 고른 목적지(주소의 #)가 아직 화면 위쪽에 보이면 그 메뉴를 그대로 현재 위치로 둔다
  // (페이지 끝에 가까운 영역은 끝까지 올라오지 못해서, 아래 '맨 아래' 규칙에 밀리지 않게)
  const hashLink = findNavLinkByHash(window.location.hash);
  if (hashLink) {
    const hashTop = document.querySelector(hashLink.getAttribute('href')).getBoundingClientRect().top;
    if (hashTop >= -10 && hashTop <= window.innerHeight / 2) {
      return hashLink;
    }
  }

  const line = mainNav.offsetHeight + 24;
  let current = navLinks[0];
  navTargets.forEach(function (target, i) {
    if (target && target.getBoundingClientRect().top - line <= 0) {
      current = navLinks[i];
    }
  });
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  return atBottom ? navLinks[navLinks.length - 1] : current;
}

function updateCurrentNav() {
  if (Date.now() < navLockUntil) {
    return;
  }
  setCurrentNav(findNavLinkByScroll());
}

// 주소의 #이 가리키는 곳을 먼저 표시하고, 이동이 끝나면 실제 스크롤 위치로 다시 맞춘다
function showNavFromHash() {
  const link = findNavLinkByHash(window.location.hash);
  if (link) {
    setCurrentNav(link);
    navLockUntil = Date.now() + 900;
    setTimeout(function () { navLockUntil = 0; updateCurrentNav(); }, 950);
  } else {
    updateCurrentNav();
  }
}

// 모바일 메뉴: 실제 열림 상태(is-open), 버튼 문구, aria-expanded 를 함께 바꾼다
function setMenuOpen(open) {
  mainNav.classList.toggle('is-open', open);
  menuToggle.textContent = open ? '메뉴 닫기' : '메뉴 열기';
  menuToggle.setAttribute('aria-expanded', String(open));
}

menuToggle.addEventListener('click', function () {
  setMenuOpen(!mainNav.classList.contains('is-open'));
});

// 목적지를 고르면 메뉴를 닫고, 고른 메뉴를 바로 현재 위치로 표시한다
navLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    setMenuOpen(false);
    setCurrentNav(link);
    navLockUntil = Date.now() + 900;
    setTimeout(function () { navLockUntil = 0; updateCurrentNav(); }, 950);
  });
});

// Esc 로도 닫을 수 있게 하고, 커서를 버튼으로 돌려준다
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && mainNav.classList.contains('is-open')) {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

// 넓은 화면으로 바뀌면 열림 상태를 정리한다(넓은 화면에서는 메뉴가 항상 보임)
window.matchMedia('(min-width: 769px)').addEventListener('change', function (event) {
  if (event.matches) {
    setMenuOpen(false);
  }
});

// 스크롤할 때(한 프레임에 한 번만), 뒤로 가기·앞으로 가기로 #이 바뀔 때, 새로 고침 뒤에 현재 위치를 맞춘다
let navTicking = false;
window.addEventListener('scroll', function () {
  if (navTicking) {
    return;
  }
  navTicking = true;
  requestAnimationFrame(function () {
    navTicking = false;
    updateCurrentNav();
  });
}, { passive: true });
window.addEventListener('hashchange', showNavFromHash);
window.addEventListener('load', showNavFromHash);
showNavFromHash();

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

// 9주차: 써 본 제품(조건부 입력)
const usedBefore = document.querySelector('#usedBefore');
const usedDetail = document.querySelector('#usedDetail');
const usedNote = document.querySelector('#usedNote');
const usedCount = document.querySelector('#usedCount');
const usedError = document.querySelector('#usedError');
const USED_MIN = Number(usedNote.getAttribute('minlength'));
const USED_MAX = usedNote.maxLength;

// 9주차: 제출 상태
const sendStatus = document.querySelector('#sendStatus');
const defaultSendText = sendButton.textContent;
let isSubmitting = false;   // 보내는 중이면 true — 중복 제출을 막는다

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
    blockedByRequestId = result.requestId;
    const requestItem = ensureRequestVisible(result.requestId);
    requestItem.classList.add('is-highlight');
    requestItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function resetItemMessage() {
  requestMessage.textContent = defaultItemMessage;
  requestMessage.classList.remove('is-error', 'is-info');
  itemInput.removeAttribute('aria-invalid');
  blockedByRequestId = null;
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

// 입력할 때마다 글자 수와 조건 충족 여부를 보여 준다(6주차 글자 수 + 9주차 조건 문구)
// 상태를 색만이 아니라 "2자 이상 필요 / 조건 충족" 문구로도 알린다.
function updateItemCount() {
  const currentLength = itemInput.value.length;
  const ok = itemInput.value.trim().length >= 2;
  let state = ok ? '조건 충족' : '2자 이상 필요';
  if (ok && currentLength >= 15) {
    state = '조건 충족 · 최대 ' + maxLength + '자';
  }
  itemCount.textContent = currentLength + ' / ' + maxLength + '자 · ' + state;
  itemCount.classList.toggle('is-valid', ok);
  itemCount.classList.toggle('is-near-limit', currentLength >= 15);
}

itemInput.addEventListener('input', function () {
  updateItemCount();

  // 9주차: 오류가 떠 있는 상태에서 조건에 맞게 고치면 오류를 바로 해제한다
  if (requestMessage.classList.contains('is-error') && itemInput.value.trim().length >= 2) {
    resetItemMessage();
  } else if (requestMessage.classList.contains('is-info')) {
    // "이미 있는/요청한 제품" 안내는 입력이 바뀌면 더 이상 맞지 않으므로 처음 문구로 돌린다
    resetItemMessage();
  }
});

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

// 9주차: "써 본 비슷한 제품이 있어요"를 체크하면 입력 영역을 보여 주고 입력할 수 있게 한다.
// 체크를 풀면 영역을 숨기고 disabled 로 막아서 제출·검사 대상에서 빠지게 한다.
function showUsedError(text) {
  usedError.textContent = text;
  if (text === '') {
    usedNote.removeAttribute('aria-invalid');
  } else {
    usedNote.setAttribute('aria-invalid', 'true');
  }
}

function setUsedDetail(open) {
  usedDetail.hidden = !open;
  usedNote.disabled = !open;
  usedBefore.setAttribute('aria-expanded', String(open));
  if (!open) {
    showUsedError('');
  }
}

function updateUsedCount() {
  const currentLength = usedNote.value.length;
  const ok = usedNote.value.trim().length >= USED_MIN;
  usedCount.textContent = currentLength + ' / ' + USED_MAX + '자 · ' + (ok ? '조건 충족' : USED_MIN + '자 이상 필요');
  usedCount.classList.toggle('is-valid', ok);

  // 고쳐서 조건을 채우면 오류를 바로 해제한다
  if (ok && usedError.textContent !== '') {
    showUsedError('');
  }
}

usedBefore.addEventListener('change', function () {
  setUsedDetail(usedBefore.checked);
  if (usedBefore.checked) {
    usedNote.focus();
  }
});

usedNote.addEventListener('input', updateUsedCount);

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

  // 9주차: 써 본 제품을 체크했다면 내용을 USED_MIN 자 이상 적어야 한다
  const usedLength = usedNote.value.trim().length;
  if (usedBefore.checked && usedLength < USED_MIN) {
    showUsedError('써 본 제품과 아쉬웠던 점을 ' + USED_MIN + '자 이상 적어 주세요. (지금 ' + usedLength +
      '자) 적기 어렵다면 위 체크를 풀어도 돼요.');
    if (firstMissing === null) {
      firstMissing = usedNote;
    }
  } else {
    showUsedError('');
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

// ③ 안내 문구에 지난 오류가 남아 있으면 체크 상태에 맞는 문구로 되돌린다
function clearAgreeError() {
  if (agreeMessage.classList.contains('is-error')) {
    agreeMessage.classList.remove('is-error');
    agreeMessage.textContent = agreeCheck.checked ? '이제 요청을 보낼 수 있어요.' : defaultAgreeMessage;
    agreeMessage.classList.toggle('is-ready', agreeCheck.checked);
  }
}

// 확인 화면은 들어올 때마다 지금 입력값으로 다시 채운다(수정한 값도 바로 반영)
function showSummary() {
  const memo = memoInput.value.trim();
  clearAgreeError();
  if (!isSubmitting) {
    setSubmitState('idle');
  }
  document.querySelector('#summaryItem').textContent = itemInput.value.trim();
  document.querySelector('#summaryCategory').textContent = getCategory();
  document.querySelector('#summaryBudget').textContent = budgetSelect.value;
  document.querySelector('#summaryUsed').textContent = getUsedNote() === '' ? '없음' : getUsedNote();
  document.querySelector('#summaryMemo').textContent = memo === '' ? '없음' : memo;
}

// 체크했을 때만 써 본 제품 내용을 쓴다(체크를 풀면 숨겨진 칸의 값은 보내지 않는다)
function getUsedNote() {
  return usedBefore.checked ? usedNote.value.trim() : '';
}

// 9주차: 제출 상태를 한곳에서 바꾼다 — idle(평소) / loading(보내는 중) / error(실패, 다시 시도)
function setSubmitState(state) {
  isSubmitting = state === 'loading';
  stepConfirm.setAttribute('aria-busy', String(isSubmitting));

  // 보내는 중에는 이전·수정 버튼과 체크박스도 잠가서 화면이 바뀌지 않게 한다
  stepConfirm.querySelectorAll('button[data-go]').forEach(function (button) {
    button.disabled = isSubmitting;
  });
  agreeCheck.disabled = isSubmitting;

  sendStatus.classList.remove('is-loading', 'is-error');
  if (state === 'loading') {
    sendButton.disabled = true;
    sendButton.textContent = '보내는 중…';
    sendStatus.textContent = '요청을 보내는 중이에요. 잠시만 기다려 주세요.';
    sendStatus.classList.add('is-loading');
  } else if (state === 'error') {
    sendButton.disabled = !agreeCheck.checked;
    sendButton.textContent = '다시 보내기';
    sendStatus.textContent = '요청을 저장하지 못했어요. 입력한 내용은 그대로 있어요. 잠시 뒤 "다시 보내기"를 눌러 주세요.';
    sendStatus.classList.add('is-error');
  } else {
    sendButton.disabled = !agreeCheck.checked;
    sendButton.textContent = defaultSendText;
    sendStatus.textContent = '';
  }
}

// 안내 확인에 체크해야 요청 버튼이 켜진다(6주차)
agreeCheck.addEventListener('change', function () {
  const agreed = agreeCheck.checked;
  sendButton.disabled = !agreed;

  agreeMessage.classList.remove('is-error');
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

  // 9주차: 이미 보내는 중이면 다시 보내지 않는다(중복 제출 방지)
  if (isSubmitting) {
    return;
  }
  if (agreeCheck.checked === false) {
    agreeMessage.textContent = '안내 확인에 체크해야 요청을 보낼 수 있어요.';
    agreeMessage.classList.add('is-error');
    agreeCheck.focus();
    return;
  }

  const sameRequest = findWaitingRequest(itemInput.value.trim());
  if (sameRequest !== null) {
    agreeMessage.textContent = '그사이 같은 제품(' + sameRequest.item + ')의 요청이 검토 대기 중이 되어 보낼 수 없어요. 아래 내 요청 목록에 표시한 요청을 취소하거나, 제품을 "수정"해 주세요.';
    agreeMessage.classList.remove('is-ready');
    agreeMessage.classList.add('is-error');
    clearHighlight();
    const requestItem = ensureRequestVisible(sameRequest.id);
    requestItem.classList.add('is-highlight');
    requestItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // 9주차: 보내는 중 상태를 보여 준 뒤 브라우저 저장소에 저장한다(서버 대신 localStorage)
  setSubmitState('loading');

  setTimeout(function () {
    const saved = addRequest();

    // 실패: 입력 내용은 그대로 두고 다시 시도할 수 있게 한다
    if (!saved) {
      setSubmitState('error');
      sendButton.focus();
      return;
    }

    // 성공: 완료 안내로 이동
    setSubmitState('idle');
    doneMessage.textContent = '"' + itemInput.value.trim() + '"(' + getCategory() + ' · ' + budgetSelect.value +
      ') 추천 요청을 받았어요. 내 요청 목록에 저장했으니, 직접 써 본 영상이 올라오기 전까지 언제든 취소할 수 있어요.';
    goToStep(4);
  }, 800);
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
  setUsedDetail(false);     // 9주차: 조건부 영역도 닫고 비활성화
  updateUsedCount();

  agreeMessage.textContent = defaultAgreeMessage;
  agreeMessage.classList.remove('is-ready', 'is-error');
  setSubmitState('idle');   // 9주차: 버튼 글자·상태 문구도 처음으로
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
const requestFilterButtons = document.querySelectorAll('.request-filters .chip');
const requestResult = document.querySelector('#requestResult');
const filterEmpty = document.querySelector('#filterEmpty');
const filterEmptyText = document.querySelector('#filterEmptyText');
let requestFilter = 'all';   // 10주차: 지금 고른 상태 필터(all / waiting / cancelled)
const cancelDialog = document.querySelector('#cancelDialog');
const cancelText = document.querySelector('#cancelText');

// 보낸 요청을 담는 배열 — 9주차부터 브라우저 저장소(localStorage)에 저장해서 새로 고침해도 남는다
const myRequests = [];
let nextRequestId = 1;
const STORAGE_KEY = 'jjpick.myRequests.v1';
let cancelTargetId = null;   // 확인 창이 열려 있는 동안 취소하려는 요청의 번호
let blockedByRequestId = null;   // ①단계 문구가 "이미 요청한 제품"으로 막고 있는 요청의 번호

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

// 9주차: 목록을 브라우저 저장소에 저장한다 — 저장소를 쓸 수 없으면(시크릿 창 제한·용량 초과 등) false
function saveRequests(list, nextId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ requests: list, nextId: nextId }));
    return true;
  } catch (error) {
    console.error('Failed to save requests', error);
    return false;
  }
}

// 9주차: 저장해 둔 목록을 불러온다 — 모양이 맞는 항목만 받아들이고, 읽지 못하면 빈 목록으로 시작한다
function loadRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const data = JSON.parse(raw);
    const list = Array.isArray(data?.requests) ? data.requests : [];
    list.forEach(function (r) {
      const valid = r && Number.isInteger(r.id) && typeof r.item === 'string' && r.item !== '' &&
        typeof r.category === 'string' && typeof r.budget === 'string' && typeof r.time === 'string' &&
        Object.prototype.hasOwnProperty.call(statusText, r.status);
      if (valid) {
        myRequests.push({
          id: r.id,
          item: r.item,
          category: r.category,
          budget: r.budget,
          memo: typeof r.memo === 'string' ? r.memo : '',
          used: typeof r.used === 'string' ? r.used : '',
          time: r.time,
          status: r.status
        });
      }
    });
    const maxId = myRequests.reduce(function (max, r) { return Math.max(max, r.id); }, 0);
    nextRequestId = Math.max(Number.isInteger(data?.nextId) ? data.nextId : 1, maxId + 1);
  } catch (error) {
    console.error('Failed to load saved requests', error);
  }
}

// 확인 화면에서 요청을 보내면 지금 입력값으로 목록에 하나 추가한다
// 9주차: 먼저 저장해 보고, 저장에 성공했을 때만 목록에 반영한다 — 성공하면 true, 실패하면 false
function addRequest() {
  const now = new Date();
  const request = {
    id: nextRequestId,
    item: itemInput.value.trim(),
    category: getCategory(),
    budget: budgetSelect.value,
    memo: memoInput.value.trim(),
    used: getUsedNote(),
    time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    status: 'waiting'
  };

  if (!saveRequests(myRequests.concat([request]), nextRequestId + 1)) {
    return false;
  }

  myRequests.push(request);
  nextRequestId = nextRequestId + 1;
  renderRequests();
  showListMessage('"' + request.item + '" 요청을 목록에 추가했어요.', 'is-ready');
  return true;
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

  if (request.used) {
    const used = document.createElement('p');
    used.className = 'request-memo';
    used.textContent = '써 본 제품: ' + request.used;
    li.append(used);
  }

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
  // 11주차: 같은 이름의 버튼이 여러 개라 어떤 요청의 버튼인지 이름에 넣는다 (예: "전기포트 요청 취소")
  button.setAttribute('aria-label', request.item + ' ' + button.textContent);
  li.append(button);
  return li;
}

// 배열 내용대로 목록·건수·빈 목록 안내를 다시 그린다
// 목록이 바뀌면(취소·다시 요청) "이미 요청한 제품" 같은 지난 안내는 더 이상 맞지 않을 수 있으니 되돌린다
function renderRequests() {
  if (blockedByRequestId !== null) {
    resetItemMessage();
  }
  clearAgreeError();
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

  applyRequestFilter();
}

// 10주차: 고른 상태에 맞는 요청만 보이게 하고, 결과 수와 빈 결과 안내를 바꾼다
function applyRequestFilter() {
  const total = myRequests.length;
  let shown = 0;
  requestList.querySelectorAll('.request-item').forEach(function (li) {
    const request = findRequest(Number(li.dataset.id));
    const visible = requestFilter === 'all' || request.status === requestFilter;
    li.hidden = !visible;
    if (visible) {
      shown = shown + 1;
    }
  });

  const label = requestFilter === 'waiting' ? '검토 대기' : '취소된';

  // 전체 요청이 없을 때 / 요청은 있지만 고른 상태에 맞는 게 없을 때 / 결과가 있을 때를 나눠 안내한다
  emptyRequests.hidden = total !== 0;
  filterEmpty.hidden = !(total > 0 && shown === 0);
  requestList.hidden = shown === 0;

  if (total === 0) {
    requestResult.textContent = '';
  } else if (requestFilter === 'all') {
    requestResult.textContent = '전체 요청 ' + total + '건을 보여 주고 있어요.';
  } else {
    requestResult.textContent = label + ' 요청 ' + shown + '건을 보여 주고 있어요. (전체 ' + total + '건)';
    if (shown === 0) {
      filterEmptyText.textContent = (requestFilter === 'waiting' ? '검토 대기 중인' : '취소된') +
        ' 요청이 없어요. 다른 상태를 고르거나 "전체 요청 보기"를 눌러 주세요.';
    }
  }
}

function setRequestFilter(value) {
  requestFilter = value;
  requestFilterButtons.forEach(function (button) {
    const selected = button.dataset.status === value;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  applyRequestFilter();
}

requestFilterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    setRequestFilter(button.dataset.status);
  });
});

document.querySelector('#showAllRequests').addEventListener('click', function () {
  setRequestFilter('all');
  requestFilterButtons[0].focus();
});

// 10주차: 강조하려는 요청이 필터 때문에 숨어 있으면 '전체'로 돌려서 보이게 한다
function ensureRequestVisible(id) {
  const li = requestList.querySelector('.request-item[data-id="' + id + '"]');
  if (li && li.hidden) {
    setRequestFilter('all');
  }
  return li;
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
    openModal(cancelDialog, null);   // 12주차: 공통 모달 열기 (닫은 뒤 초점은 아래 close 처리에서 요청 버튼으로)
    return;
  }

  // 다시 요청하기: 같은 제품이 이미 검토 대기 중이면 되살리지 않는다
  const waitingRequest = findWaitingRequest(request.item);
  if (waitingRequest !== null) {
    clearHighlight();
    ensureRequestVisible(waitingRequest.id).classList.add('is-highlight');
    showListMessage('같은 제품("' + request.item + '")의 요청이 이미 검토 대기 중이라 다시 요청할 수 없어요. 표시한 요청을 확인해 주세요.', 'is-error');
    return;
  }
  request.status = 'waiting';
  if (!saveRequests(myRequests, nextRequestId)) {
    request.status = 'cancelled';
    showListMessage('저장하지 못해서 다시 요청되지 않았어요. 잠시 뒤 다시 눌러 주세요.', 'is-error');
    return;
  }
  renderRequests();
  showListMessage('"' + request.item + '" 요청을 다시 보냈어요. 상태가 검토 대기로 바뀌었어요.', 'is-ready');
  focusRequestButton(request.id);
});

function focusRequestButton(id) {
  const button = requestList.querySelector('button[data-id="' + id + '"]');
  // 10주차: 상태가 바뀌어 지금 필터에서 사라졌으면 목록 상자로 커서를 옮긴다
  if (button && !button.closest('.request-item').hidden) {
    button.focus();
  } else {
    myRequestsBox.focus({ preventScroll: true });
  }
}

// 확인 창: 그대로 두기 → 아무것도 바꾸지 않음 (12주차: 버튼의 data-modal-close 로 공통 닫기 처리)

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
  if (!saveRequests(myRequests, nextRequestId)) {
    request.status = 'waiting';
    showListMessage('저장하지 못해서 취소되지 않았어요. 요청은 그대로 검토 대기예요. 잠시 뒤 다시 시도해 주세요.', 'is-error');
    focusRequestButton(request.id);
    return;
  }
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

loadRequests();
renderRequests();
updateItemCount();
updateUsedCount();

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
  setSaveLabel(button);

  if (isSaved) {
    savedCount = savedCount + 1;
  } else {
    savedCount = savedCount - 1;
  }
  updateSaveSummary();
}

// 11주차: "찜하기" 버튼이 6개라 화면 낭독기에서는 상품 이름을 붙여 읽게 한다 (♡·♥ 기호는 빼고)
function setSaveLabel(button) {
  const name = button.closest('.product-card').querySelector('.product-name').textContent;
  const isSaved = button.getAttribute('aria-pressed') === 'true';
  button.setAttribute('aria-label', name + (isSaved ? ' 찜했어요' : ' 찜하기'));
}

saveButtons.forEach(function (button) {
  setSaveLabel(button);
  button.addEventListener('click', handleSaveClick);
});

// --- 탭: 누른 탭만 선택 표시하고, 그 탭의 패널만 보여 준다 ---
// 12주차: 탭 묶음(role="tablist") 하나를 받아서 동작을 붙이는 함수로 정리했다.
// 다른 곳에 탭을 더 만들어도 HTML 구조만 맞추면 initTabs 를 그대로 다시 쓴다.
function initTabs(tablist) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

  function selectTab(selectedTab) {
    tabs.forEach(function (tab) {
      const selected = tab === selectedTab;
      const panel = document.querySelector(tab.dataset.target);
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.classList.toggle('is-active', selected);
      panel.hidden = !selected;
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      selectTab(tab);
    });
    // 11주차: 키보드로는 ← → 로 옆 탭, Home·End 로 처음·끝 탭을 고른다. Tab 키는 고른 탭에서 바로 내용으로 넘어간다
    tab.addEventListener('keydown', function (event) {
      const next = findKeyTarget(tabs, index, event.key, 'ArrowLeft', 'ArrowRight');
      if (next) {
        event.preventDefault();
        selectTab(next);
        next.focus();
      }
    });
  });
}

// 12주차: 탭(← →)과 아코디언(↑ ↓)이 함께 쓰는 방향키 처리 — 옮겨 갈 버튼을 돌려준다(해당 없는 키면 null)
function findKeyTarget(list, index, key, prevKey, nextKey) {
  if (key === nextKey) {
    return list[(index + 1) % list.length];
  }
  if (key === prevKey) {
    return list[(index - 1 + list.length) % list.length];
  }
  if (key === 'Home') {
    return list[0];
  }
  if (key === 'End') {
    return list[list.length - 1];
  }
  return null;
}

document.querySelectorAll('[role="tablist"]').forEach(initTabs);

// ===== 12주차: 아코디언 (자주 묻는 질문) =====
// data-accordion 이 붙은 묶음마다 같은 함수를 붙인다. 질문 버튼의 aria-expanded 가 지금 상태다.
function initAccordion(root) {
  const triggers = Array.from(root.querySelectorAll('.accordion-trigger'));
  const allButton = root.querySelector('[data-accordion-all]');
  const summary = root.querySelector('.accordion-summary');

  // 질문 하나를 펼치거나 접는다 — 답 영역, +/− 표시, "펼치기/접기" 문구를 함께 바꾼다
  function setItem(trigger, open) {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    trigger.setAttribute('aria-expanded', String(open));
    trigger.querySelector('.accordion-state').textContent = open ? '접기' : '펼치기';
    trigger.closest('.accordion-item').classList.toggle('is-open', open);
    panel.hidden = !open;
  }

  function countOpen() {
    return triggers.filter(function (t) { return t.getAttribute('aria-expanded') === 'true'; }).length;
  }

  // 몇 개를 펼쳤는지 알려 주고, 전체 버튼 문구를 맞춘다
  function updateSummary() {
    const openCount = countOpen();
    if (summary) {
      if (openCount === 0) {
        summary.textContent = '질문 ' + triggers.length + '개가 모두 접혀 있어요. 궁금한 질문을 눌러 보세요.';
      } else {
        summary.textContent = '질문 ' + triggers.length + '개 중 ' + openCount + '개를 펼쳐 두었어요.';
      }
    }
    if (allButton) {
      allButton.textContent = openCount === triggers.length ? '모두 접기' : '모두 펼치기';
    }
  }

  triggers.forEach(function (trigger, index) {
    setItem(trigger, trigger.getAttribute('aria-expanded') === 'true');
    trigger.addEventListener('click', function () {
      setItem(trigger, trigger.getAttribute('aria-expanded') !== 'true');
      updateSummary();
    });
    // ↑ ↓ 로 이전·다음 질문, Home·End 로 처음·끝 질문으로 초점을 옮긴다(펼치고 접는 건 Enter·Space)
    trigger.addEventListener('keydown', function (event) {
      const next = findKeyTarget(triggers, index, event.key, 'ArrowUp', 'ArrowDown');
      if (next) {
        event.preventDefault();
        next.focus();
      }
    });
  });

  // 하나라도 접혀 있으면 모두 펼치고, 다 펼쳐져 있으면 모두 접는다
  if (allButton) {
    allButton.addEventListener('click', function () {
      const openAll = countOpen() !== triggers.length;
      triggers.forEach(function (trigger) { setItem(trigger, openAll); });
      updateSummary();
    });
  }
  updateSummary();
}

document.querySelectorAll('[data-accordion]').forEach(initAccordion);

// ===== 12주차: 모달 공통 동작 =====
// openModal 로 열고, data-modal-close 버튼·Esc·바깥(배경) 클릭으로 닫는다.
// 닫히면 연 버튼으로 초점을 돌려준다. 요청 취소 확인 창과 상품 자세히 보기가 함께 쓴다.
const modalOpeners = new Map();   // 모달마다 연 버튼을 기억한다

function openModal(dialog, opener) {
  modalOpeners.set(dialog, opener || null);
  document.body.classList.add('modal-open');
  dialog.showModal();
}

document.querySelectorAll('dialog.modal').forEach(function (dialog) {
  dialog.querySelectorAll('[data-modal-close]').forEach(function (button) {
    button.addEventListener('click', function () {
      dialog.close();
    });
  });
  // 모달이 열려 있는 동안 Tab 이 창 밖(주소창 등)으로 나가지 않고 창 안에서 돌게 한다
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') {
      return;
    }
    const items = Array.from(dialog.querySelectorAll('button, a[href], input, select, textarea'))
      .filter(function (item) { return !item.disabled && item.offsetParent !== null; });
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  // 안쪽 .modal-box 가 창을 꽉 채우므로, dialog 자신이 눌렸다면 바깥 배경을 누른 것이다
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) {
      dialog.close();
    }
  });
  dialog.addEventListener('close', function () {
    document.body.classList.remove('modal-open');
    const opener = modalOpeners.get(dialog);
    if (opener && opener.isConnected) {
      opener.focus();
    }
    modalOpeners.delete(dialog);
  });
});

// --- 상품 자세히 보기: 누른 카드의 내용으로 모달을 채운다 ---
const productModalSave = document.querySelector('#productModalSave');
const productModalState = document.querySelector('#productModalState');
let modalCard = null;   // 지금 모달에 보여 주는 상품 카드

// 모달의 찜 버튼과 상태 문구를 카드의 찜 상태에 맞춘다
function syncModalSave() {
  const name = modalCard.querySelector('.product-name').textContent;
  const isSaved = modalCard.querySelector('.save-button').getAttribute('aria-pressed') === 'true';
  productModalSave.textContent = isSaved ? '♥ 찜했어요' : '♡ 찜하기';
  productModalSave.setAttribute('aria-pressed', String(isSaved));
  productModalSave.setAttribute('aria-label', name + (isSaved ? ' 찜했어요' : ' 찜하기'));
  productModalState.textContent = isSaved
    ? '♥ 찜한 상품이에요. 목록에도 표시했어요. 다시 누르면 찜이 풀려요.'
    : '아직 찜하지 않은 상품이에요.';
  productModalState.classList.toggle('is-saved', isSaved);
}

function fillProductModal(card) {
  modalCard = card;
  document.querySelector('#productModalTitle').textContent = card.querySelector('.product-name').textContent;
  document.querySelector('#productModalDesc').textContent = card.querySelector('.product-desc').textContent;
  document.querySelector('#productModalPrice').textContent = card.querySelector('.product-price').textContent;
  document.querySelector('#productModalThumb').textContent = card.querySelector('.product-thumb').textContent;
  // 판매처 배지와 카테고리는 카드에 있는 것을 그대로 복사해서 같은 모양으로 보여 준다
  const meta = document.querySelector('#productModalMeta');
  meta.replaceChildren();
  card.querySelector('.product-meta').childNodes.forEach(function (node) {
    meta.appendChild(node.cloneNode(true));
  });
  // 상품마다 data-detail 에 "|" 로 나눠 적어 둔 내용을 목록으로 만든다
  const points = document.querySelector('#productModalPoints');
  points.replaceChildren();
  card.dataset.detail.split('|').forEach(function (text) {
    const li = document.createElement('li');
    li.textContent = text;
    points.appendChild(li);
  });
  syncModalSave();
}

document.querySelectorAll('.detail-button').forEach(function (button) {
  const card = button.closest('.product-card');
  button.setAttribute('aria-label', card.querySelector('.product-name').textContent + ' 자세히 보기');
  button.addEventListener('click', function () {
    fillProductModal(card);
    openModal(document.querySelector(button.dataset.modalOpen), button);
  });
});

// 모달에서 찜하면 카드의 찜 버튼을 누른 것과 같게 처리한다(카드 표시와 찜 개수 문구도 같이 바뀐다)
productModalSave.addEventListener('click', function () {
  modalCard.querySelector('.save-button').click();
  syncModalSave();
});
