const AvailableMonths = [
  { value: '01', text: '1월' },
  { value: '02', text: '2월' },
  { value: '03', text: '3월' },
  { value: '04', text: '4월' },
  { value: '05', text: '5월' },
  { value: '06', text: '6월' },
  { value: '07', text: '7월' },
  { value: '08', text: '8월' },
  { value: '09', text: '9월' },
  { value: '10', text: '10월' },
  { value: '11', text: '11월' },
  { value: '12', text: '12월' },
];
const AvailableDays = [
  { value: '01', text: '1일' },
  { value: '02', text: '2일' },
  { value: '03', text: '3일' },
  { value: '04', text: '4일' },
  { value: '05', text: '5일' },
  { value: '06', text: '6일' },
  { value: '07', text: '7일' },
  { value: '08', text: '8일' },
  { value: '09', text: '9일' },
  { value: '10', text: '10일' },
  { value: '11', text: '11일' },
  { value: '12', text: '12일' },
  { value: '13', text: '13일' },
  { value: '14', text: '14일' },
  { value: '15', text: '15일' },
  { value: '16', text: '16일' },
  { value: '17', text: '17일' },
  { value: '18', text: '18일' },
  { value: '19', text: '19일' },
  { value: '20', text: '20일' },
  { value: '21', text: '21일' },
  { value: '22', text: '22일' },
  { value: '23', text: '23일' },
  { value: '24', text: '24일' },
  { value: '25', text: '25일' },
  { value: '26', text: '26일' },
  { value: '27', text: '27일' },
  { value: '28', text: '28일' },
  { value: '29', text: '29일' },
  { value: '30', text: '30일' },
  { value: '31', text: '31일' },
];

const AvailableTimes = [
  { value: '09:00', text: '09:00' },
  { value: '10:40', text: '10:40' },
  { value: '12:20', text: '12:20' },
  { value: '13:55', text: '13:55' },
  { value: '15:30', text: '15:30' },
  { value: '17:10', text: '17:10' },
  { value: '18:50', text: '18:50' },
  { value: '20:30', text: '20:30' },
];

const AvailableCourtNums = [
  { value: 1, text: '1번' },
  { value: 2, text: '2번' },
  { value: 3, text: '3번' },
  { value: 4, text: '4번' },
  { value: 5, text: '5번' },
  { value: 6, text: '6번' },
  { value: 7, text: '7번' },
  { value: 8, text: '8번' },
  { value: 9, text: '9번' },
  { value: 10, text: '10번' },
  { value: 11, text: '11번' },
  { value: 12, text: '12번' },
];

const RED_COLOR = '#E74C3D';
const BLUE_COLOR = '#009FFF';

let isRunning = false;
let priorityCourtNumbers = [];
const MAX_SELECTIONS = 2;
let secondPriorityCourtNumbers = [];

const handleLoaded = () => {
  console.log('Dom 로딩됨');
  const actionBtn = document.getElementById('actionBtn');

  // 저장된 설정 불러오기
  chrome.storage.local.get(
    [
      'refreshInterval',
      'month',
      'day',
      'time',
      'priorityCourtNumbers',
      'secondPriorityCourtNumbers',
    ],
    function (data) {
      initializeUI(data);
      priorityCourtNumbers = data.priorityCourtNumbers;
      secondPriorityCourtNumbers = data.secondPriorityCourtNumbers;
    }
  );

  // 시작 버튼 클릭 이벤트
  actionBtn.addEventListener('click', function () {
    if (!isRunning) {
      // 상태 업데이트
      isRunning = true;
      console.log('매크로 시작');

      // 설정 값 가져오기
      const month = document.getElementById('month').value;
      const day = document.getElementById('day').value;
      const time = document.getElementById('time').value;
      // const priorityCourtNumbers = document.getElementById('priorityCourtNumbers').value;
      // const secondPriorityCourtNumbers = document.getElementById(
      //   'secondPriorityCourtNumbers'
      // ).value;

      // 설정 저장
      chrome.storage.local.set({
        month: month,
        day: day,
        time: time,
        priorityCourtNumbers: priorityCourtNumbers,
        secondPriorityCourtNumbers: secondPriorityCourtNumbers,
        isRunning: true,
      });

      // 현재 활성화된 탭에 메시지 보내기
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'start',
          config: {
            month: month,
            day: day,
            time: time,
            priorityCourtNumbers: priorityCourtNumbers,
            secondPriorityCourtNumbers: secondPriorityCourtNumbers,
          },
        });
      });
    } else {
      // 상태 업데이트
      isRunning = false;
      console.log('매크로 중지');
      chrome.storage.local.set({ isRunning: false });

      // 현재 활성화된 탭에 중지 메시지 보내기
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'stop' });
      });

      // 상태 업데이트
    }
    updateUI();

    // 체크박스 감지 이벤트 추가
    //
  });

  const initializeUI = (data) => {
    // // UI 업데이트
    actionBtn.disabled = true;

    const monthSelect = document.getElementById('month');
    AvailableMonths.forEach((month) => {
      const option = document.createElement('option');
      option.value = month.value;
      option.textContent = month.text;
      monthSelect.appendChild(option);
    });
    monthSelect.value = data.month;

    const daySelect = document.getElementById('day');
    AvailableDays.forEach((day) => {
      const option = document.createElement('option');
      option.value = day.value;
      option.textContent = day.text;
      daySelect.appendChild(option);
    });
    daySelect.value = data.day;

    const timeSelect = document.getElementById('time');
    AvailableTimes.forEach((time) => {
      const option = document.createElement('option');
      option.value = time.value;
      option.textContent = time.text;
      timeSelect.appendChild(option);
    });
    timeSelect.value = data.time;

    console.log(data.priorityCourtNumbers);

    const priorityCheckboxContainer = document.getElementById('priorityCourtNumbers');
    // 각 코트에 대한 체크박스 생성
    AvailableCourtNums.forEach((court) => {
      // 체크박스 아이템 컨테이너 생성
      const checkboxItem = document.createElement('div');
      checkboxItem.className = 'checkbox-item';

      // 체크박스 요소 생성
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `court-${court.value}`;
      checkbox.value = court.value;
      // 스토리지의 체크박스 반영
      if (data.priorityCourtNumbers.includes(court.value)) checkbox.checked = true;

      // 체크박스 변경 이벤트 처리
      checkbox.addEventListener('change', function () {
        updateSelectedPriorityCourts();
        updateSelectedPriorityCourtState();
        enableStartButton();
      });

      // 레이블 생성
      const label = document.createElement('label');
      label.htmlFor = `court-${court.value}`; // 체크박스 ID와 연결
      label.textContent = court.text;

      // 체크박스 아이템에 체크박스와 레이블 추가
      checkboxItem.appendChild(checkbox);
      checkboxItem.appendChild(label);

      // 체크박스 아이템을 컨테이너에 추가
      priorityCheckboxContainer.appendChild(checkboxItem);
    });

    const secondPriorityCheckboxContainer = document.getElementById('secondPriorityCourtNumbers');

    // 각 코트에 대한 체크박스 생성
    AvailableCourtNums.forEach((court) => {
      // 체크박스 아이템 컨테이너 생성
      const checkboxItem = document.createElement('div');
      checkboxItem.className = 'checkbox-item';

      // 체크박스 요소 생성
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `second-court-${court.value}`;
      checkbox.value = court.value;
      // 스토리지의 체크박스 반영
      if (data.secondPriorityCourtNumbers.includes(court.value)) checkbox.checked = true;

      // 체크박스 변경 이벤트 처리
      checkbox.addEventListener('change', function () {
        updateSelectedSecondPriorityCourts();
      });

      // 레이블 생성
      const label = document.createElement('label');
      label.htmlFor = `second-court-${court.value}`; // 체크박스 ID와 연결
      label.textContent = court.text;

      // 체크박스 아이템에 체크박스와 레이블 추가
      checkboxItem.appendChild(checkbox);
      checkboxItem.appendChild(label);

      // 체크박스 아이템을 컨테이너에 추가
      secondPriorityCheckboxContainer.appendChild(checkboxItem);
    });
  };

  const updateUI = () => {
    const actionBtn = document.getElementById('actionBtn');
    const statusText = document.getElementById('status');
    const monthInput = document.getElementById('month');
    const dayInput = document.getElementById('day');
    const timeInput = document.getElementById('time');
    if (isRunning) {
      // UI 업데이트
      actionBtn.textContent = '중지';
      statusText.textContent = '실행 중...';
      statusText.style.color = 'black';
      monthInput.disabled = true;
      dayInput.disabled = true;
      timeInput.disabled = true;

      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      allCheckboxes.forEach((checkbox) => {
        checkbox.disabled = true;
      });
    } else {
      // UI 업데이트
      console.log('test');
      actionBtn.textContent = '시작';
      statusText.textContent = '대기 중...';
      statusText.style.color = 'black';
      monthInput.disabled = false;
      dayInput.disabled = false;
      timeInput.disabled = false;

      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      allCheckboxes.forEach((checkbox) => {
        checkbox.disabled = false;
      });
    }
  };

  // 선택된 체크박스 ID 업데이트 함수
  function updateSelectedPriorityCourts() {
    // 선택된 모든 체크박스 가져오기
    const checkedBoxes = document.querySelectorAll(
      '#priorityCourtNumbers input[type="checkbox"]:checked'
    );

    // 배열 초기화
    priorityCourtNumbers = [];

    // 선택된 체크박스의 value 값(코트 ID)을 배열에 추가
    checkedBoxes.forEach((checkbox) => {
      priorityCourtNumbers.push(checkbox.value);
    });

    console.log('선택된 코트 ID:', priorityCourtNumbers);

    // 여기서 필요에 따라 추가 작업 수행
    // 예: 스토리지에 저장, 다른 컴포넌트에 메시지 전송 등
  }

  function updateSelectedPriorityCourtState() {
    const checkboxes = document.querySelectorAll('#priorityCourtNumbers input[type="checkbox"]');
    const checkedCount = document.querySelectorAll(
      '#priorityCourtNumbers input[type="checkbox"]:checked'
    ).length;

    // 최대 선택 수에 도달했는지 확인
    if (checkedCount >= MAX_SELECTIONS) {
      // 체크되지 않은 체크박스를 비활성화
      checkboxes.forEach((checkbox) => {
        if (!checkbox.checked) {
          checkbox.disabled = true;
        }
      });
    } else {
      // 모든 체크박스 활성화
      checkboxes.forEach((checkbox) => {
        checkbox.disabled = false;
      });
    }
  }

  function enableStartButton() {
    const checkedCount = document.querySelectorAll(
      '#priorityCourtNumbers input[type="checkbox"]:checked'
    ).length;

    // 최대 선택 수에 도달했는지 확인
    if (checkedCount === MAX_SELECTIONS) {
      actionBtn.disabled = false;
    } else {
      actionBtn.disabled = true;
    }
  }

  // 선택된 체크박스 ID 업데이트 함수
  function updateSelectedSecondPriorityCourts() {
    // 선택된 모든 체크박스 가져오기
    const checkedBoxes = document.querySelectorAll(
      '#secondPriorityCourtNumbers input[type="checkbox"]:checked'
    );

    // 배열 초기화
    secondPriorityCourtNumbers = [];

    // 선택된 체크박스의 value 값(코트 ID)을 배열에 추가
    checkedBoxes.forEach((checkbox) => {
      secondPriorityCourtNumbers.push(checkbox.value);
    });

    console.log('선택된 코트 ID:', secondPriorityCourtNumbers);

    // 여기서 필요에 따라 추가 작업 수행
    // 예: 스토리지에 저장, 다른 컴포넌트에 메시지 전송 등
  }
};

document.addEventListener('DOMContentLoaded', handleLoaded);

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'updateStatusText') {
    console.log('updateStatusText');
    const statusText = document.getElementById('status');
    if (statusText) {
      statusText.textContent = message.data.text;
    }
    sendResponse({ success: true });
  } else if (message.action === 'onStopMacroFailure') {
    console.log('onStopMacroFailure');
    const statusText = document.getElementById('status');
    if (statusText) {
      setTimeout(() => {
        statusText.textContent = message.reason;
        statusText.style.color = RED_COLOR;
      }, 10);
    }
    if (isRunning) {
      const actionBtn = document.getElementById('actionBtn');
      actionBtn.click();
    }

    sendResponse({ success: true });
  } else if (message.action === 'onStopMacroSuccess') {
    console.log('onStopMacroSuccess');
    const statusText = document.getElementById('status');
    if (statusText) {
      setTimeout(() => {
        statusText.textContent = message.reason;
        statusText.style.color = BLUE_COLOR;
      }, 10);
    }
    if (isRunning) {
      const actionBtn = document.getElementById('actionBtn');
      actionBtn.click();
    }

    sendResponse({ success: true });
  }
  return true;
});
