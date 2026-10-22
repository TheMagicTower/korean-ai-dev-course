# 20시간 강의 보강 계획

## 목표와 합의된 방향

사용자가 기존 회차당 12장 자료의 부족한 설명·참고 자료·시각 자료·실습 운영을 지적하고 전면 보강 및 가상 수강생 5명에 대한 반복 점검을 요청했습니다. 기존 홈페이지·과제 API는 유지하고 강의 콘텐츠와 발표 도구를 보강합니다. 하네스 라우터는 2026-10-23 01:42:46 KST까지 사용하지 않습니다.

## 시간표

각 회차 240분, 총 1200분입니다. 설명 / 시연 / 실습 / 토의·피드백 / 휴식 순서의 분 단위 예산은 다음과 같습니다.

1. 80 / 30 / 75 / 35 / 20
2. 50 / 45 / 100 / 25 / 20
3. 60 / 35 / 100 / 25 / 20
4. 45 / 30 / 120 / 25 / 20
5. 35 / 20 / 125 / 40 / 20

합계: 설명 270분, 시연 160분, 실습 520분, 토의·피드백 150분, 휴식 100분. 각 회차 약 40~45장으로 구성하며 분량을 맞추기 위한 반복 슬라이드는 넣지 않습니다. 시간은 강사 운영 계획이며 학습 성과를 보장하는 측정값이 아닙니다.

## 산출물

- 5회차 각각 개념→예제→확인 문제→실습→피드백 흐름과 240분 계획이 있는 슬라이드
- 단계별 실습 카드: 준비물, 수행 순서, 제출물, 완료 기준, 막힘 대안, 빠른 학생의 추가 과제
- 공식 참고 자료의 핵심 내용·적용 범위·강의 예제 연결
- 개념을 설명하는 생성 이미지 5개와 생성 기록
- 발표 도구: 활동 구분, 경과 시간, 실습 타이머, 정답 펼치기, 실습 안내 다운로드
- 가상 수강생 5명의 초기 점검→수정→재점검 기록과 실제 학습 효과 검증의 한계

## 콘텐츠 계약

각 회차 JSON은 {id,title,slides}입니다. 각 슬라이드는 기존 title/kind/notes와 함께 id(예: s2-01), mode(explain|demo|lab|discussion|break), minutes(양의 정수), block(학습 단위 제목)을 가집니다. 회차별 minutes 합계는 240, mode별 합계는 위 예산과 일치합니다. notes는 강사의 설명·질문·예상 오해·전환을 3~5문장으로 제공합니다.

지원 종류: 기존 title,bullets,columns,quote,image,contributions,merge,checklist,flow,exercise에 code,comparison,reference,quiz,lab,break,visual을 추가합니다.

- code: code(string 최대 12줄), language, caption, bullets(선택)
- comparison: columns([{title,body}]) 최대 3개
- reference: sourceTitle, sources([{label,url}]), findings(2~3개), application, caveat
- quiz: question, options(3~4문자열), answerIndex, explanation
- lab: objective, steps(3~5개), deliverable, success(2~3개), fallback, stretch
- break: message
- visual: image, caption, bullets(2~3개)
- 모든 sources는 직접 확인한 공식 자료만 사용합니다. 확인되지 않은 수치나 인용은 넣지 않습니다.

각 회차에 최소 4개 lab, 2개 break(각10분), 3개 quiz, 2개 reference를 포함합니다. 이후 회차의 API/CLI 실습은 설치 불가·인증 대기 대안을 제시합니다. 실습 예제는 실제 공개 도서관 데모와 프로젝트로 연결하며 가짜 API 응답을 실제 측정처럼 쓰지 않습니다.

## 작업과 검증

- [ ] 1회차 직접 보강, 2~3회차 및 4~5회차 병렬 집필
- [ ] 생성 이미지 5개를 실제 파일로 저장·검사·배치
- [ ] 발표 UI·학습 자료 화면과 시간표 갱신
- [ ] 5명 가상 수강생 초기 점검 및 수정 후 재점검
- [ ] 콘텐츠·시간 합계·참고 자료·새 인터랙션 테스트
- [ ] 실제 브라우저 대표 화면 및 모든 슬라이드 넘침 검사
- [ ] 공개 Cloudflare 재배포·공개 자산 일치 검증·기존 PR 갱신
