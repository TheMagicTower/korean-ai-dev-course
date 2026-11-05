import sys,re
root='/tmp/claude-0/-home-claude/1e61c45b-9ca0-544b-985f-74ce7a96fb3a/scratchpad/ka/src/periods/'
def run(fn, spec):
    s=open(root+fn,encoding='utf-8').read()
    parts=re.split(r'(?=<!-- \d\d )',s)  # head + slide chunks
    # chunk index: find by number
    chunks={}
    for i,p in enumerate(parts):
        m=re.match(r'<!-- (\d\d) ',p)
        if m: chunks[int(m.group(1))]=i
    for n,ed in spec.items():
        i=chunks[n]; p=parts[i]
        for e in ed:
            kind=e[0]
            if kind=='ko':   # ('ko', k_occurrence, text)  append after nth kind div
                _,idx,text=e
                ms=list(re.finditer(r'<div class="kind">[^\n]*</div>',p))
                m=ms[idx]
                ind='      '
                p=p[:m.end()]+'\n'+ind+'<div class="ko">'+text+'</div>'+p[m.end():]
            else:
                _,old,new=e
                if p.count(old)!=1:
                    print('MISS',fn,n,p.count(old),old[:60]); sys.exit(1)
                p=p.replace(old,new)
        parts[i]=p
    open(root+fn,'w',encoding='utf-8').write(''.join(parts))

def T(old,new): return ('r',old,new)
def K(idx,text): return ('ko',idx,text)
def Q(cite,tr): return ('r',cite,'<span class="tr">'+tr+'</span>'+cite)

p05={
2:[K(0,'Kiro 발표문의 첫 화면. <b>프롬프트만 반복해 앱을 만들 때</b> 생기는 문제를 짚는 글.'),
   Q('<cite>Kiro 발표문 · 2025-07-14</cite>','“에이전트를 계속 이끌었지만, 그 결정들은 어디에도 기록되어 있지 않다.”')],
3:[T('<h2>같은 시기, 같은 문제를 푸는 두 갈래</h2>','<h2>Plan 모드와 SDD는 같은 시기에 같은 문제를 푼다</h2>')],
4:[K(0,'Fowler 사이트의 SDD 설명 글, ‘정의’ 절. AI로 코드를 쓰기 전에 <b>스펙을 먼저 쓴다</b>는 뜻으로 정리한다.'),
   Q('<cite>Böckeler · 2025-10-15</cite>','“스펙이 사람과 AI 모두에게 기준 문서(source of truth)가 된다.”')],
5:[T('<h2>스펙을 얼마나 오래 쓰는가: 세 수준</h2>','<h2>SDD는 스펙을 얼마나 오래 쓰느냐로 세 수준이 나뉜다</h2>')],
6:[T('<h2>Kiro: 요구사항 → 설계 → 작업, 파일 세 개</h2>','<h2>Kiro는 요구사항, 설계, 작업 파일 세 개를 차례로 만든다</h2>'),
   K(0,'Kiro 문서의 Specs 개요 화면. IDE·CLI·웹에서 같은 스펙 기능을 지원하며 <b>세 단계 문서</b>로 진행한다.'),
   T('<b>requirements.md</b>: 사용자 스토리와 수용 기준','<b>requirements.md</b>: 사용자 스토리(사용자 입장의 요구)와 수용 기준(완료 조건)')],
7:[T('<h2>Kiro 스펙 파일: 폴더와 EARS 문장</h2>','<h2>Kiro는 요구사항을 “WHEN…SHALL…” 문장 틀(EARS)로 쓴다</h2>'),
   K(0,'Kiro Feature Specs 문서. 기능 하나가 <b>폴더 하나와 파일 세 개</b>로 정리되고, 요구사항은 정해진 문장 틀로 쓴다.'),
   T('<span class="dim"># requirements.md (EARS 표기, 문서 예시)</span>','<span class="dim"># requirements.md (EARS = 요구사항 문장 형식, 문서 예시)</span>'),
   T('<span class="acc">THE SYSTEM SHALL</span> create a new user account','<span class="acc">THE SYSTEM SHALL</span> create a new user account\n<span class="dim">→ 올바른 가입 정보를 제출하면, 시스템은 새 계정을 만든다</span>')],
8:[T('<h2>Spec Kit: 스펙, 계획, Task, 구현을 명령으로</h2>','<h2>Spec Kit은 슬래시 명령으로 스펙에서 구현까지 단계를 밟는다</h2>'),
   K(0,'GitHub이 낸 Spec Kit 발표 글. 스펙을 먼저 쓰고 AI로 개발하는 <b>오픈소스 도구 모음</b> 소개.'),
   T('<span class="dim">$</span> uv tool install specify-cli','<span class="dim"># CLI 설치 → 프로젝트 초기화</span>\n<span class="dim">$</span> uv tool install specify-cli')],
9:[T('<h2>Spec Kit이 만드는 파일: spec.md와 tasks.md</h2>','<h2>Spec Kit은 기능마다 spec.md와 tasks.md 뼈대를 채운다</h2>'),
   K(0,'<b>spec.md</b> 템플릿. 우선순위 붙은 사용자 스토리와 수용 시나리오를 적는 양식.'),
   K(1,'<b>tasks.md</b> 템플릿. 스토리별로 묶은 Task에 병렬 가능 표시를 붙이는 양식.')],
10:[K(0,'Spec Kit의 constitution 템플릿. 코드 품질·테스트 같은 <b>프로젝트 전체 원칙</b>을 적는 빈칸 양식.')],
12:[K(0,'Fowler 글의 ‘관찰과 질문’ 절. Kiro와 Spec Kit을 써 본 뒤 적은 <b>한계</b>.'),
    Q('<cite>Böckeler · 2025-10-15</cite>','“이 마크다운 파일들을 전부 보느니 차라리 코드를 리뷰하겠다.”'),
    T('<li>Kiro: 작은 버그가 스토리 4개, 수용 기준 16개로 부푼다</li>','<li>Kiro: 작은 버그 하나가 사용자 스토리 4개, 수용 기준 16개로 부푼다</li>')],
14:[T('<h2>실제 문서: 진입 방법과 승인 선택지</h2>','<h2>Plan 모드는 승인 전까지 소스를 고치지 않고, 계획은 직접 고칠 수 있다</h2>'),
    K(0,'Plan 모드 진입 방법. 읽고 조사해 <b>계획만</b> 쓰며 소스는 수정하지 않는다.'),
    K(1,'계획 승인 선택지. 자동 모드로 승인, 편집마다 확인, <b>계속 계획</b> 중에서 고른다.'),
    T('<b>계획은 압축 뒤에도 디스크에서 다시 주입</b>됩니다.','<b>계획은 압축(대화 요약) 뒤에도 디스크에서 다시 주입</b>됩니다.')],
15:[T('<h2>다른 도구도 같은 답: Cursor Plan Mode</h2>','<h2>Cursor도 계획을 파일로 남기고, 사람이 고친 뒤 실행한다</h2>'),
    K(0,'Cursor의 Plan Mode 발표문. 코드베이스를 조사해 <b>계획 파일(.plan.md)</b>을 만든다.')],
18:[K(0,'Claude Code 문서의 컨텍스트 창 설명. 지침·읽은 파일·응답·도구 결과가 <b>한 창에 쌓이는</b> 모습.'),
    T('<li>창에는 지침, 읽은 파일, 응답, 도구 결과가 모두 쌓인다</li>','<li>컨텍스트 창(AI가 한 번에 볼 수 있는 분량)에 지침, 읽은 파일, 응답, 도구 결과가 모두 쌓인다</li>')],
19:[K(0,'압축 뒤에 무엇이 남는지 정리한 공식 문서 표. <b>디스크의 파일은 다시 읽고, 대화는 요약만</b> 남는다.')],
20:[T('<h2>더 길게 넣어도 해결이 아니다: Context Rot</h2>','<h2>입력이 길어질수록 성능이 흔들린다: Context Rot</h2>'),
    K(0,'Chroma의 Context Rot 보고서 첫 화면. 입력 길이에 따라 <b>모델 성능이 어떻게 변하는지</b> 평가한 글.'),
    T('<div class="n">18</div>','<div class="n">18개</div>'),
    T('<p class="d">LLM을 평가했더니<br>입력이 길수록 성능이 불안정해졌다</p>','<p class="d">평가한 LLM 18개에서<br>입력이 길수록 성능이 불안정해졌다</p>')],
21:[K(0,'Anthropic 엔지니어링 글. 오래 걸리는 작업을 <b>교대 근무처럼</b> 이어 가도록 인계 파일을 두는 방법.')],
23:[K(0,'Claude Code 문서의 계획 승인 선택지. 자동 모드로 승인, 편집마다 확인, 계속 계획.')],
}

p06={
2:[T('<h2>스펙을 써도 남는 문제: 정말 다 했는가</h2>','<h2>스펙이 있어도 “다 했다”는 말은 검증되지 않는다</h2>'),
   K(0,'5교시에서 본 GitHub의 Spec Kit 발표 글. 스펙은 <b>방향</b>을 잡아 줄 뿐, 완료 여부는 따로 확인해야 한다.')],
3:[T('<h2>삼중 방어: 스펙, 테스트, 경계</h2>','<h2>스펙, 테스트, 경계가 서로 다른 실패를 막는다</h2>')],
4:[K(0,'Fowler의 TDD 설명 글. 테스트 먼저 → 통과시키기 → 정리, 세 단계를 <b>반복</b>하는 도식.'),
   T('<li>다음 기능의 테스트를 쓴다 (Red)</li>','<li>다음 기능의 테스트를 쓴다 (Red: 아직 실패)</li>'),
   T('<li>통과할 때까지 구현한다 (Green)</li>','<li>통과할 때까지 구현한다 (Green: 통과)</li>'),
   T('<li>구조를 정리한다 (Refactor)</li>','<li>동작은 그대로 두고 구조를 정리한다 (Refactor)</li>')],
5:[K(0,'Claude Code 모범 사례 문서. <b>실패하는 테스트를 먼저 쓰고 고치게</b> 하는 프롬프트 예시.'),
   T('<li>공식 문서의 프롬프트 예: “write a failing test that reproduces it, then fix it”</li>','<li>공식 문서의 프롬프트 예: “write a failing test that reproduces it, then fix it” (재현하는 실패 테스트를 쓰고, 그다음 고쳐라)</li>')],
6:[K(0,'Claude Code 문서의 ‘실행해서 확인할 수단을 주라’는 절. <b>통과·실패를 돌려주는 검증 수단</b> 예시.'),
   Q('<cite>Claude Code Docs · Best practices</cite>','“Claude에게 실행했을 때 통과나 실패를 돌려주는 무언가를 주어라.”'),
   T('<li>검증 수단: 테스트 파일, 빌드 종료 코드, 린터</li>','<li>검증 수단: 테스트 파일, 빌드 종료 코드, 린터(코드 규칙 검사기)</li>'),
   T('<li>“All tests pass”만 믿지 말고 실행 출력을 요구</li>','<li>“All tests pass(모두 통과)”만 믿지 말고 실행 출력을 요구</li>')],
7:[T('<div class="k">1) 스텁 · 테스트 실행 → Red</div>','<div class="k">1) 스텁(가짜 구현) · 테스트 실행 → Red(실패)</div>'),
   T('<div class="k">2) 구현 → Green</div>','<div class="k">2) 구현 → Green(통과)</div>')],
8:[T('<h2>에이전트는 지름길을 찾는다</h2>','<h2>에이전트는 테스트만 통과하는 지름길을 찾기도 한다</h2>'),
   K(0,'Claude 4 발표문에서 모델이 <b>지름길·허점을 쓰는 행동</b>을 줄였다고 밝힌 문단.'),
   T('<li>Claude 4는 3.7보다 65% 덜 한다고 발표 (특정 과제 기준)</li>','<li>Claude 4는 Sonnet 3.7보다 65% 덜 한다고 발표 (지름길에 취약한 에이전트 과제 기준)</li>')],
9:[T('<li>테스트 수정·삭제·skip: 초록불이지만 규칙은 안 지킴</li>','<li>테스트 수정·삭제·skip(건너뛰기): 초록불이지만 규칙은 안 지킴</li>'),
   T('<li>하드코딩: 테스트 입력만 통과하는 분기</li>','<li>하드코딩(정답 박아 넣기): 테스트 입력만 통과하는 분기</li>')],
11:[K(0,'Claude Code 권한 문서. <b>deny 규칙</b>으로 특정 파일·명령을 막는 방법.')],
12:[K(0,'Claude Code 훅 가이드의 ‘보호 파일 수정 차단’ 예제. 훅(도구 실행 직전에 끼우는 스크립트)으로 <b>수정을 막는</b> 방법.'),
    T('<span class="dim"># PreToolUse(Edit|Write)에서 실행한 실제 결과</span>','<span class="dim"># 도구 실행 직전(PreToolUse)에 돌린 실제 결과</span>')],
13:[K(0,'Claude Code 서브에이전트 문서. 서브에이전트(별도 컨텍스트를 가진 보조 에이전트)를 설명한다.'),
    T('<li>구현한 세션과 <b>별도 컨텍스트</b>에서 diff만 본다</li>','<li>구현한 세션과 <b>별도 컨텍스트</b>에서 diff(바뀐 부분)만 본다</li>')],
15:[K(0,'Fowler의 DDD(도메인 주도 설계) 설명 첫 화면. 복잡한 업무 규칙을 <b>모델</b>로 만들어 코드에 둔다.')],
16:[K(0,'Fowler의 ‘유비쿼터스 언어’ 설명. 개발자와 사용자가 <b>같은 엄밀한 말</b>을 쓴다는 개념.')],
17:[K(0,'Fowler의 Bounded Context 글. 영업·지원 영역이 Customer(고객)·Product(상품)를 <b>각자 다르게 모델링</b>하는 도식.')],
20:[K(0,'Uncle Bob의 클린 아키텍처 글 중 <b>의존성 규칙</b> 문단. 안쪽 원은 바깥쪽을 알아서는 안 된다.'),
    Q('<cite>Robert C. Martin · 2012</cite>','“소스 코드의 의존은 안쪽으로만 향할 수 있다.”')],
21:[T('<div class="k">PoC · MVP</div>','<div class="k">PoC(시험 제작) · MVP(최소 기능 제품)</div>')],
22:[T('<h2>같은 기능, 두 가지 모양</h2>','<h2>같은 기능도 PoC냐 클린 아키텍처냐에 따라 모양이 달라진다</h2>')],
23:[K(0,'Fowler의 TDD 글 도식. Red → Green → Refactor를 <b>반복</b>한다.')],
}
if len(sys.argv)>1 and sys.argv[1]=='p05': run('p05.html',p05)
if len(sys.argv)>1 and sys.argv[1]=='p06': run('p06.html',p06)
