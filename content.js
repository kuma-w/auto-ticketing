// 전역 변수
let isRunning = false;
let refreshIntervalId = null;
let config = {
  refreshInterval: 1000,
  month: null,
  day: null,
  time: null,
  priorityCourtNumbers: [],
  secondPriorityCourtNumbers: [],
  isRunning: false,
};

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'start') {
    config = message.config;
    setTimeout(() => {
      startMacro();
    }, 30);
  } else if (message.action === 'stop') {
    stopMacro();
  }
  return true;
});

// 매크로 시작 함수
function startMacro() {
  if (isRunning) return;

  isRunning = true;
  console.log('티켓팅 매크로 시작됨', config);

  // 현재 페이지 URL 확인
  const currentUrl = window.location.href;

  if (currentUrl.includes('calendar1')) {
    // calendar1 페이지에서는 confirmReservationDate 함수를 호출하고
    // 1초마다 새로고침하여 다시 시도
    confirmReservationDate();

    refreshIntervalId = setInterval(function () {
      if (!isRunning) return;

      // 현재 URL 다시 확인 (페이지가 변경되었을 수 있음)
      const currentPageUrl = window.location.href;

      if (currentPageUrl.includes('calendar1')) {
        console.log('calendar1 페이지 새로고침 및 함수 재호출');
        location.reload();
      } else {
        // 페이지가 변경된 경우 인터벌 중지
        clearInterval(refreshIntervalId);

        // 새 페이지에 대한 처리 진행
        if (currentPageUrl.includes('reservationStep2')) {
          confirmCourtReservation();
        }
      }
    }, 1000);
  } else if (currentUrl.includes('reservationStep2')) {
    confirmCourtReservation();
  } else {
    // 다른 페이지인 경우 단순 새로고침
    refreshIntervalId = setInterval(function () {
      if (!isRunning) return;
      location.reload();
    }, config.refreshInterval);
  }
}

// 매크로 중지 함수
function stopMacro() {
  isRunning = false;
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
  console.log('티켓팅 매크로 중지됨');
}

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'selectTime') {
    selectTimeAndRegister(message.date, message.startTime, message.endTime);
    sendResponse({ success: true, message: 'Time selection started' });
    return true;
  }
});

const confirmReservationDate = () => {
  // class가 'day'인 모든 span 요소를 선택
  const daySpans = document.querySelectorAll('span.day');

  // 그 중에서 텍스트 내용이 '05'인 요소만 필터링
  const dayElement = Array.from(daySpans).find((span) => span.textContent.trim() === config.day);

  if (dayElement) {
    const parentDiv = dayElement.parentElement;
    if (parentDiv) {
      const ulElement = parentDiv.nextElementSibling;
      if (ulElement) {
        // 모든 li > a 요소를 찾습니다
        const allAnchors = ulElement.querySelectorAll('li > a');
        // a 태그의 텍스트가 "17:10"인 요소 찾기
        let targetAnchor = null;

        for (const anchor of allAnchors) {
          if (
            anchor.innerText.trim() === `가\n${config.time}` ||
            anchor.innerText.trim() === `불\n${config.time}`
          ) {
            targetAnchor = anchor;
            break;
          }
        }

        if (targetAnchor) {
          if (targetAnchor.innerText.trim() === `가\n${config.time}`) {
            targetAnchor.click();
            updateStatusText('날짜 선택 완료');

            // 잠시 대기 후 등록 버튼 클릭 (클릭 후 UI가 업데이트될 시간 필요)
            setTimeout(() => {
              const registButton = document.querySelector('a.common_btn.regist');
              if (registButton) {
                console.log(`registButton`, registButton);
                registButton.click();
              } else {
                console.log('버튼을 못찾음');
              }
            }, 1);
          } else {
            console.log(`requestStopMacro`);
            onStopMacroFailure('선택한 시간의 코트가 만석입니다.');
          }
        }
      } else {
        console.log('ul 요소를 찾을 수 없습니다');
      }
    }
  }
};

const confirmCourtReservation = () => {
  const allCheckboxInputs = document.querySelectorAll('input[id^="facilityNo"]');
  const firstWantedCourts = config.priorityCourtNumbers.map((v) => Number(v));
  const secondWantedCourts = config.secondPriorityCourtNumbers.map((v) => Number(v));

  let availableCourts = [];
  allCheckboxInputs.forEach((input, index) => {
    const isDisabled = input.disabled;
    if (!isDisabled) {
      availableCourts.push(index + 1);
    }
  });

  if (availableCourts.length === 0) {
    onStopMacroFailure('코트가 만석입니다.');
  }

  const isFirstWantedCourtsSelectable = firstWantedCourts.every((item) =>
    availableCourts.includes(item)
  );


  if (isFirstWantedCourtsSelectable) {
    onStopMacroSuccess(`코트 선택 완료 : ${firstWantedCourts.join(', ')}`);

    allCheckboxInputs.forEach((input, index) => {
      if (firstWantedCourts.includes(index + 1)) {
        input.checked = true;
      }
    });
    const nextBtn = document.querySelector('a.btn4');
    nextBtn.click();
  } else {
    const result = findAdjacentCourts(secondWantedCourts, availableCourts);
    if (result === false) {
      onStopMacroFailure('조건에 만족하는 코트가 없습니다.');
    } else {

      allCheckboxInputs.forEach((input, index) => {
        if (result.includes(index + 1)) { 
          console.log(`checkbox :`, index + 1);
          input.checked = true;
        }
      });
      onStopMacroSuccess(`코트 선택 완료 : ${result.join(', ')}`);
      const nextBtn = document.querySelector('a.btn4');
      nextBtn.click();
    }
  }
};

function findAdjacentCourts(wantedCourts, availableCourts) {
  // 교차하는 코트(원하는 코트 중 예약 가능한 코트)를 찾음
  const possibleCourts = wantedCourts.filter((court) => availableCourts.includes(court));

  // 가능한 코트가 2개 미만이면 false 반환
  if (possibleCourts.length < 2) {
    return false;
  }

  // 가능한 코트를 오름차순으로 정렬
  possibleCourts.sort((a, b) => a - b);

  // 인접한 코트 쌍 찾기
  for (let i = 0; i < possibleCourts.length - 1; i++) {
    const currentCourt = possibleCourts[i];
    const nextCourt = possibleCourts[i + 1];

    // 인접한 코트인지 확인 (1 차이)
    if (nextCourt - currentCourt === 1) {
      // 6번과 7번은 인접하지 않음 조건 확인
      if (!(currentCourt === 6 && nextCourt === 7)) {
        return [currentCourt, nextCourt];
      }
    }
  }

  // 조건에 맞는 코트를 찾지 못한 경우
  return false;
}

// 페이지 로드 시 저장된 상태 확인
chrome.storage.local.get(
  ['refreshInterval', 'month', 'day', 'time', 'priorityCourtNumbers', 'secondPriorityCourtNumbers'],
  function (data) {
    if (data.isRunning) {
      config = {
        refreshInterval: data.refreshInterval || 1000,
        month: data.month || null,
        day: data.day || null,
        time: data.time || null,
        priorityCourtNumbers: data.priorityCourtNumbers || null,
        secondPriorityCourtNumbers: data.secondPriorityCourtNumbers || null,
      };
      startMacro();
    }
  }
);

const updateStatusText = (text) => {
  chrome.runtime.sendMessage({
    action: 'updateStatusText',
    data: {
      elementId: 'status',
      text: text,
    },
  });
};

const onStopMacroFailure = (text) => {
  chrome.runtime.sendMessage({
    action: 'onStopMacroFailure',
    reason: text,
  });
};

const onStopMacroSuccess = (text) => {
  chrome.runtime.sendMessage({
    action: 'onStopMacroSuccess',
    reason: text,
  });
};
