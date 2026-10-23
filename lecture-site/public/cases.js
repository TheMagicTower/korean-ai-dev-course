import {$,shell,pageHead} from './app.js';

shell();
$('#main').innerHTML=pageHead(
  'CASE STUDIES · FROM EVIDENCE TO PRODUCT',
  'AI가 한 일과,<br>사람이 설계한 일을 구분합니다.',
  '이미 만든 두 프로젝트를 살펴봅니다. 사용자가 만지는 화면에서 출발해 데이터·모델·검증·공개 범위를 거꾸로 추적합니다.'
)+`<div class="container cases-content">
  <nav class="handout-nav" aria-label="사례 바로가기"><a class="button small secondary" href="#flyblock">2회차 · FlyBlock Arena</a><a class="button small secondary" href="#jev">3회차 · Jev와 Signal Magazine</a></nav>
  <section class="case-study" id="flyblock">
    <div class="case-heading"><p class="eyebrow">SESSION 02 · DATA → ADAPTER → EXPERIENCE</p><h2>초파리 연결지도를 게임 상대에 연결하다</h2><p>FlyBlock Arena는 사람이 블록을 놓고 회로 기반 상대의 다음 수를 관찰하는 게임입니다. 연구 데이터를 가져오는 것과 사용자가 플레이할 수 있는 제품을 만드는 것 사이에 어떤 시스템이 필요한지 보여줍니다.</p></div>
    <figure class="case-shot"><img src="/images/flyblock.png" alt="FlyBlock Arena의 사람과 회로 기반 상대가 나란히 배치된 게임 화면" loading="lazy"><figcaption>실제 게임 화면. 화면에 표시되는 CIRCUIT은 연결지도 기반 부분 회로 컨트롤러입니다.</figcaption></figure>
    <div class="case-map" aria-label="FlyBlock 시스템 흐름"><span>보드 상태</span><span>입력 인코더</span><span>부분 회로 발화</span><span>출력 디코더</span><span>합법 수 검증</span><span>화면 갱신</span></div>
    <div class="case-facts"><article><h3>확인한 것</h3><p>FlyWire v783 데이터의 <b>12개 뉴런·13개 연결</b>로 만든 부분 회로를 게임 어댑터에 연결했습니다. 실제 데모에서 사람이 한 경기를 끝내고 회로 기반 상대의 선택을 볼 수 있습니다.</p></article><article><h3>해석의 한계</h3><p>FlyWire는 전뇌 연결지도를 제공하지만 이 게임은 그중 일부만 사용합니다. 전체 초파리 뇌의 실시간 시뮬레이션이나 생물학적 게임 지능의 재현이라고 설명하지 않습니다. 승리 여부에는 입력·출력 변환과 게임 규칙도 영향을 줍니다.</p></article><article><h3>검증 질문</h3><p>같은 시드에서 무작위·규칙 기반 상대와 비교했습니까? 무효 수·타임아웃·수당 지연을 포함했습니까? 회로 출력이 빠졌을 때도 같은 결과가 나옵니까?</p></article></div>
    <div class="case-transfer"><b>내 프로젝트에 적용</b><p>공공데이터나 연구 데이터를 고른 뒤, 사용자가 실제로 할 행동 하나를 정합니다. 데이터와 행동 사이의 인코더·판단·검증·화면 상태를 그려봅니다.</p></div>
    <div class="actions"><a class="button" href="https://themagictower.github.io/korean-ai-dev-course/projects/flyblock/" target="_blank" rel="noopener noreferrer">실제 게임 체험 ↗</a><a class="button secondary" href="/slides/?session=2#24">2회차 사례 슬라이드</a><a class="button secondary" href="https://github.com/TheMagicTower/korean-ai-dev-course/blob/main/course/cases/flyblock.md" target="_blank" rel="noopener noreferrer">제작 사례 전문 ↗</a></div>
    <p class="case-sources">연구 근거: <a href="https://flywire.ai/" target="_blank" rel="noopener noreferrer">FlyWire 공식 프로젝트 ↗</a> · <a href="https://github.com/philshiu/Drosophila_brain_model" target="_blank" rel="noopener noreferrer">Shiu 연구 코드 ↗</a> · <a href="https://www.nature.com/articles/s41586-024-07763-9" target="_blank" rel="noopener noreferrer">연구 논문 ↗</a></p>
  </section>
  <section class="case-study" id="jev">
    <div class="case-heading"><p class="eyebrow">SESSION 03 · DIVIDE THE WORK, VERIFY THE ROUTE</p><h2>Jev의 좁은 판단을 편집 흐름에 넣다</h2><p>Signal Magazine은 NASA 우주 뉴스 발췌를 받아 주제를 분류하고, 기사 초안과 근거를 검토한 뒤 한 호로 보여주는 실험입니다. Jev는 전체 편집국이 아니라 <b>분류 경로 하나</b>를 담당합니다.</p></div>
    <figure class="case-shot"><img src="/images/signal.png" alt="Signal Magazine의 기사 카드와 편집 검토 상태가 보이는 실제 화면" loading="lazy"><figcaption>실제 매거진 화면. 화면이 보인다는 사실과 자동 운영이 완성됐다는 주장은 다릅니다.</figcaption></figure>
    <div class="case-map" aria-label="Signal Magazine 역할 흐름"><span>NASA RSS 발췌</span><span>Jev 주제 분류</span><span>기사 초안</span><span>주장·근거 확인</span><span>편집자 승인</span><span>발행·정정</span></div>
    <div class="case-facts"><article><h3>실제 기록</h3><p>저장된 한 번의 요청에서 <b>Jev 1.13.0</b>은 NASA RSS 발췌를 <code>space</code>/<code>other</code> 중 <code>space</code>로 분류했습니다. 입력 583토큰·출력 31토큰, 반환된 confidence는 0.99였습니다.</p></article><article><h3>모델의 경계</h3><p>TypeSafe 문서의 Jev는 상태와 타입 지정 질문에 구조화된 판단을 반환합니다. 이 기록의 confidence는 분류 정확도 99%나 기사 내용의 진실성을 뜻하지 않습니다. 기사 초안은 별도 코딩 에이전트 응답으로 만들었습니다.</p></article><article><h3>아직 미구현</h3><p>외부 생성 API 호출은 실패했고, 일정에 따른 자동 공개 발행도 만들지 않았습니다. 브라우저에서 편집·승인·로컬 발행·정정을 체험할 수 있는 단계입니다. 사람이 확인하지 않은 기사 자동 발행의 근거로 사용하지 않습니다.</p></article></div>
    <div class="case-transfer"><b>내 프로젝트에 적용</b><p>명시적인 규칙은 코드로, 의미 판단이 필요한 작은 질문은 모델 후보로 둡니다. 입력·출력·신뢰 범위·보류 기준을 분리하고, 사용자가 실제로 볼 결과 전에 검증 단계를 둡니다.</p></div>
    <div class="actions"><a class="button" href="https://themagictower.github.io/korean-ai-dev-course/projects/signal-magazine/" target="_blank" rel="noopener noreferrer">실제 매거진 체험 ↗</a><a class="button secondary" href="/slides/?session=3#15">3회차 사례 슬라이드</a><a class="button secondary" href="https://github.com/TheMagicTower/korean-ai-dev-course/blob/main/course/cases/signal-magazine.md" target="_blank" rel="noopener noreferrer">제작 사례 전문 ↗</a></div>
    <p class="case-sources">모델·자료 근거: <a href="https://docs.typesafe.ai/introduction" target="_blank" rel="noopener noreferrer">TypeSafe Jev 문서 ↗</a> · <a href="https://docs.typesafe.ai/confidence" target="_blank" rel="noopener noreferrer">confidence 설명 ↗</a> · <a href="https://www.nasa.gov/rss-feeds/" target="_blank" rel="noopener noreferrer">NASA RSS ↗</a> · <a href="https://github.com/TheMagicTower/korean-ai-dev-course/blob/main/projects/signal-magazine/evidence/model-run.json" target="_blank" rel="noopener noreferrer">실제 요청·응답 기록 ↗</a></p>
  </section>
  <aside class="notice case-closing"><b>두 사례를 읽는 기준</b><p>무엇이 실제로 실행됐는지, 무엇을 사람이 연결했는지, 아직 하지 못한 일은 무엇인지 구분합니다. 이 경계가 자신의 MVP에서도 정직한 완료 기준이 됩니다.</p></aside>
</div>`;
