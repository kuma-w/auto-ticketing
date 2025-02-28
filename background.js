// 확장 프로그램이 설치될 때 초기화
chrome.runtime.onInstalled.addListener(() => {
  console.log('티켓팅 매크로 테스트가 설치되었습니다.');

  // 기본 설정 저장
  chrome.storage.local.set({
    refreshInterval: 1000,
    month: '01',
    day: '01',
    time: '09:00',
    priorityCourtNumbers: [],
    secondPriorityCourtNumbers: [],
    isRunning: false,
  });
});

// 탭이 업데이트될 때 상태 확인
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('www.auc.or.kr')) {
    chrome.storage.local.get(['isRunning'], function (data) {
      if (data.isRunning) {
        // 페이지가 로드되었고 매크로가 실행 중인 경우 content script에 메시지 전송
        chrome.storage.local.get(
          [
            'refreshInterval',
            'month',
            'day',
            'time',
            'priorityCourtNumbers',
            'secondPriorityCourtNumbers',
          ],
          function (config) {
            chrome.tabs.sendMessage(tabId, {
              action: 'start',
              config: {
                refreshInterval: config.refreshInterval,
                month: config.month,
                day: config.day,
                time: config.time,
                priorityCourtNumbers: config.priorityCourtNumbers,
                secondPriorityCourtNumbers: config.secondPriorityCourtNumbers,
              },
            });
          }
        );
      }
    });
  }
});
