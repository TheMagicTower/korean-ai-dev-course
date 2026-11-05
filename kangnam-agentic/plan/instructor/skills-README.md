# 한국어 AI 개발 스킬 패키지

이 폴더는 Codex 또는 Claude Code 프로젝트에서 호출할 수 있는 재사용 가능한 한국어 `SKILL.md` 8개입니다. 별도 실행 프로그램이나 API 키를 포함하지 않습니다. 패키지를 설치하는 절차와 충돌·검증 원칙은 저장소 루트의 [INSTALL.md](../INSTALL.md)를 따르세요.

| 스킬 | 작업 시점 |
|---|---|
| [kdev-start](kdev-start/SKILL.md) | 아이디어, 사용자, 시나리오, 프로젝트 수준과 완료 조건 정리 |
| [kdev-plan](kdev-plan/SKILL.md) | 시안·합의된 요구를 설계 결정과 작은 작업 단위로 분해 |
| [kdev-build](kdev-build/SKILL.md) | 합의한 범위 안에서 코드 구현과 수정 |
| [kdev-review](kdev-review/SKILL.md) | 스펙·계획·변경을 기준에 맞춰 검토하고 차단 문제 구분 |
| [kdev-debug](kdev-debug/SKILL.md) | 오류를 재현하고 원인·수정·재검증 증거 기록 |
| [kdev-model](kdev-model/SKILL.md) | 작업에 맞는 모델·프로바이더·사고 수준 선택 |
| [kdev-deliver](kdev-deliver/SKILL.md) | 계약한 수준의 결과·전달 방법·실제 사용 확인 |
| [kdev-handoff](kdev-handoff/SKILL.md) | 다음 사람이나 세션이 이어갈 상태·증거·다음 행동 인계 |

## 받기와 설치

- 공개된 묶음: [v0.2.0 Release ZIP](https://github.com/TheMagicTower/korean-ai-dev-course/releases/tag/v0.2.0)
- 프로젝트 단위 설치: [설치 안내](../INSTALL.md)
- Codex와 Claude Code에 붙여 넣는 요청: [한 줄 설치 프롬프트](../guides/one-line-prompts.md)
- 패키지 변경점·검증·제한: [한국어 스킬 패키지 안내](../docs/korean-skill-package.md) · [검증 기록](../VALIDATION.md)

저장소에 파일이 있다는 사실만으로 사용자 환경에 설치되거나 자동 호출되지는 않습니다. 설치 경로, 새 세션에서 발견되는지, 실제 작업이 지침을 따르는지를 각각 확인합니다. 스킬을 모델의 추가 학습이나 사용자 계정의 전역 설정 변경으로 설명하지 않습니다.
