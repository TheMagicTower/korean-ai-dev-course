ApplyFlow 구현을 인계합니다.

- 산출물: projects/applyflow/index.html 및 README.md. 기존 예제의 공고·검색·저장 흐름을 재사용하고 백업 가져오기 검증·미리보기·교체 동의, 개별 삭제 확인, 한국어 온보딩을 추가했습니다.
- 검증: node projects/applyflow/test-model.cjs와 node --check projects/applyflow/app.js가 통과했습니다. 실제 실패→통과 출력은 evidence/tests.txt에 있습니다.
- 기록: evidence/events.jsonl에 실제 UTC 단계 시각과 공개 응답, evidence/files-sha256.json에 구현 파일 지문을 남겼습니다. 일본어로 잘못 보낸 중간 응답도 원문 그대로 보존했습니다.
- 한계: 개인 브라우저 도구이며 인증·서버·동시 편집 보장은 없습니다. 브라우저 상호작용·파일 가져오기/내보내기·모바일 확인은 루트 통합 검증이 필요합니다. 커밋하지 않았습니다.
