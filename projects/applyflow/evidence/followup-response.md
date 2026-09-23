ApplyFlow 삭제 확인 보완을 인계합니다.

- window.confirm을 페이지 내부 확인 영역으로 바꾸고 회사·직무, 취소, 삭제 확정 버튼을 제공했습니다. 확정 시 대상 존재를 재확인하며 취소는 데이터를 바꾸지 않습니다.
- test-delete-ui.cjs, test-model.cjs, app.js 구문 검사를 통과했습니다. 최소 DOM 검사는 실제 브라우저 검증과 구분해 기록했습니다.
- 최초 응답·handoff 시각을 보존하고 followup-prompt.txt, followup-response.md, followup 단계 이벤트와 파일 지문을 추가했습니다. README도 갱신했습니다.
- projects/applyflow만 수정했고 커밋하지 않았습니다. 브라우저의 삭제 취소·확정과 화면 캡처는 루트에서 확인해 주세요.
