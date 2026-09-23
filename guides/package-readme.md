# 한국어 AI 개발 스킬 0.2.0

프로젝트 목적에 맞는 완성 기준과 AI 목업 중심의 개발을 돕는 독립 스킬 8개입니다. 한국어 존댓말로 안내하며 학생·개인 개발자·팀이 필요한 단계만 선택해 사용할 수 있습니다.

1. INSTALL.md를 읽고 Codex의 `.agents/skills` 또는 Claude Code의 `.claude/skills`에 프로젝트 범위로 복사합니다.
2. 새 세션에서 Codex `$kdev-start` 또는 Claude Code `/kdev-start`를 호출합니다.
3. `examples/usage.md`에서 단계별 요청을 선택합니다.

한 줄 설치 프롬프트는 `guides/one-line-prompts.md`에 있습니다. 공식 저장소: https://github.com/TheMagicTower/korean-ai-dev-course · 태그: v0.2.0

- kdev-start: 문제·사용자·범위·완료 조건
- kdev-model: 모델·사고 수준·도구·예산
- kdev-plan: 목업 → 규칙·기능·API·DB → 작업 분해
- kdev-build: 합의한 범위의 구현·검증
- kdev-debug: 재현·원인·수정 또는 진단 인계
- kdev-review: 수준에 맞는 검토·블로커 수렴·종료
- kdev-deliver: 실제 전달 버전과 사용 증거 확인
- kdev-handoff: 상태·결정·검토·남은 예산 인계

한 번에 모든 스킬을 읽거나 실행할 필요는 없습니다. GitHub 자동화·CD 스케줄러는 포함하지 않습니다. 현재 검증 범위는 `VALIDATION.md`를 확인하세요. MIT License로 수정·재사용할 수 있습니다.
