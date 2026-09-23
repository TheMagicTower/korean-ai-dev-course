ApplyFlow 비동기 백업 오류 수정을 인계합니다.

- 지연된 파일 읽기 중 이전 백업을 검증·동의한 후 새 내용이 도착하는 오류를 회귀 검사로 재현했습니다.
- 파일 토큰 확인 후 텍스트 적용 직전에 clearPreview()를 호출해 이전 미리보기·교체 동의를 폐기했습니다.
- 새 회귀 검사, 기존 삭제 UI 검사, 모델 검사, JavaScript 구문 검사가 모두 통과했습니다.
- 원본 기록을 보존하고 review-fix-prompt.txt, review-fix-response.md, 실제 단계 시각과 tests.txt 출력, 변경 지문을 추가했습니다. projects/applyflow만 수정했고 커밋하지 않았습니다.
