import re,sys
def load(p): return open(f'src/periods/{p}.html',encoding='utf-8').read()
def edit(s,title,h2=None,ko=None,reps=(),aside=None):
    m=re.search(r'<section class="slide[^"]*" data-title="%s">'%re.escape(title),s)
    assert m,title
    st=m.start(); en=s.index('</section>',st)
    sec=s[st:en]; orig=sec
    if h2:
        sec,n=re.subn(r'<h2>.*?</h2>','<h2>%s</h2>'%h2,sec,count=1); assert n,title
    if ko:
        kos=[ko] if isinstance(ko,str) else ko
        parts=re.split(r'(<div class="kind">.*?</div>)',sec)
        k=0; out=[]
        for p in parts:
            out.append(p)
            if p.startswith('<div class="kind">') and k<len(kos):
                out.append('\n      <div class="ko">%s</div>'%kos[k]); k+=1
        assert k==len(kos),(title,k)
        sec=''.join(out)
    for a,b in reps:
        assert sec.count(a)==1,(title,a,sec.count(a))
        sec=sec.replace(a,b)
    return s[:st]+sec+s[en:]
# ---------------- p13
s=load('p13')
E=lambda *a,**k: globals().__setitem__('s',edit(s,*a,**k))
E('모델마다 가격이 다르다',h2='같은 회사 모델도 입력 단가가 최대 100배 차이 난다',
  ko='Anthropic 공식 가격표. 모델마다 값이 달라서, <b>가장 비싼 모델과 가장 싼 모델이 100배</b> 차이 난다.',
  reps=[('같은 회사 안에서도 입력 단가가 최대 <b class="hl">100배</b>: Fable 5.1 $10 → Haiku 5.5 $0.10 (100만 토큰당)','같은 회사 안에서도 입력 단가가 최대 <b class="hl">100배</b>: Fable 5.1 $10 vs Haiku 5.5 $0.10 (모델에 보내는 글 100만 토큰당)')])
E('한 개발자, 여러 하네스',h2='한 사람이 큰 프로젝트를 맡으려면 하네스가 여러 개여야 한다')
E('GitHub Agent HQ',h2='GitHub는 여러 회사의 에이전트를 한곳에서 관리하겠다고 밝혔다',
  ko='GitHub가 낸 <b>Agent HQ</b> 발표 글. Anthropic · OpenAI 등의 코딩 에이전트를 GitHub 안에서 쓰게 하겠다는 내용.')
E('Codex 앱',h2='Codex 앱은 에이전트마다 저장소 사본을 따로 준다',
  ko='OpenAI Codex 앱 공식 문서 첫 화면. 여러 에이전트를 <b>프로젝트별 스레드로 나란히</b> 돌리는 앱.',
  reps=[('에이전트마다 저장소의 격리된 <b>워크트리</b>','에이전트마다 저장소의 격리된 <b>워크트리</b>(작업용 사본)')])
E('Claude Code agent teams',h2='agent teams: 팀 리드가 독립된 세션의 팀원들을 이끈다',
  ko='Claude Code 공식 문서의 agent teams 설명. 한 세션이 <b>팀 리드</b>, 나머지가 <b>팀원</b>이 되어 작업 목록을 공유.',
  reps=[('각자 컨텍스트 창을 가진 팀원','각자 컨텍스트 창(기억 범위)을 가진 팀원')])
E('Cursor 3 Agents Window',h2='Cursor 3는 에이전트 여러 개를 병렬로 돌리는 새 창을 내놓았다',
  ko='Cursor 3 변경 기록. <b>Agents Window</b>에서 여러 에이전트를 로컬·클라우드 등 어디서든 병렬로 돌린다는 내용.',
  reps=[('<span class="mono">/best-of-n</span>: 같은 작업을 여러 모델에 동시에','<span class="mono">/best-of-n</span>: 같은 작업을 여러 모델에 동시에 시켜 가장 나은 결과 고르기')])
E('Orca란',h2='Orca는 에이전트를 나란히 돌리는 데스크톱 IDE다',
  ko='Orca 공식 문서 첫 화면. Orca는 Codex · Claude Code 같은 <b>CLI 에이전트를 한 화면에 나란히</b> 돌리는 개발 도구.',
  reps=[('<cite>Orca README','<span class="tr">Codex, ClaudeCode, OpenCode, Pi를 나란히 실행하세요</span><cite>Orca README'),
        ('모델이 아니다. 내가 구독한 CLI 에이전트를 그대로 쓴다','모델이 아니다. 내가 구독한 CLI 에이전트(터미널용)를 그대로 쓴다')])
E('Orca 워크트리 모델',h2='Orca: 작업 하나 = 워크트리 하나 = 에이전트 하나',
  ko='Orca 문서의 워크트리 모델 설명. 기준 지점에서 <b>작업마다 워크트리를 하나씩</b> 만들고 그 안에서 에이전트가 일한다.',
  reps=[('저장소마다 <b>base ref</b>(보통 origin/main), 워크트리마다 <b>start-from ref</b>','저장소마다 <b>base ref</b>(기준, 보통 origin/main), 워크트리마다 <b>start-from ref</b>(갈라질 시작점)')])
E('Orca 지원 에이전트',h2='Orca는 터미널에서 도는 에이전트면 모두 돌릴 수 있다',
  ko='Orca 문서의 지원 에이전트 표. Claude Code · Codex 등 <b>수십 종이 미리 설정</b>되어 있고, 일부만 깊게 연동된다.')
E('Orca 화면 구성',h2='Orca 한 화면에서 열 개 안팎의 작업을 감시한다',
  ko='Orca 소개 화면. <b>왼쪽 워크트리 목록, 가운데 에이전트 터미널, 오른쪽 휴대폰 앱</b>으로 작업 상태를 한눈에 본다.')
E('Orca 설치와 사용 흐름',h2='Orca: 설치하고 5분이면 세 에이전트를 경주시킨다',
  ko='Orca 문서의 ‘첫 3-에이전트 세션’ 안내. 같은 프롬프트를 세 에이전트에 주고 <b>가장 나은 결과 하나만</b> 고른다.',
  reps=[('Add Repo → 로컬 저장소 선택','Add Repo(저장소 추가) → 로컬 저장소 선택')])
E('Orca 오케스트레이션 CLI',h2='Orca: 에이전트가 orca 명령으로 작업과 워커를 직접 만든다',
  ko='Orca 문서의 오케스트레이션 CLI 안내. 코디네이터가 <b>작업을 만들고 워커를 띄운 뒤</b> 완료 신호를 기다린다(실험 기능).',
  reps=[('Run · Task · Dispatch · Message · Decision gate','Run(실행) · Task(작업) · Dispatch(배정) · Message · Decision gate(결정 관문)'),
        ('워커는 끝나면 worker_done을 정확히 한 번 보낸다','워커(작업 맡은 에이전트)는 끝나면 worker_done을 한 번 보낸다')])
E('Orca 한계와 주의',h2='Orca는 빨리 바뀌고, 기본값이 권한 우회라 주의해야 한다',
  ko='Orca 릴리스 목록(v1.4.243). <b>거의 매일 새 버전</b>이 나올 만큼 변화가 빠르다.',
  reps=[('기본값이 <b class="hl">권한 우회 플래그</b>(수동 선택 가능). 워크트리는 파일 격리일 뿐 보안 샌드박스가 아니다','기본값이 <b class="hl">권한 우회 플래그</b>(승인 없이 실행, 수동 선택 가능). 워크트리는 파일만 나눌 뿐 보안 샌드박스가 아니다'),
        ('합치기·CI 폭증은','합치기·CI(자동 검사) 폭증은')])
E('/batch',ko='Claude Code 명령 문서의 /batch 항목. 큰 변경을 <b>5~30개 독립 단위</b>로 나눠 단위마다 서브에이전트가 맡는다.',
  reps=[('<b>백그라운드 서브에이전트</b>가','<b>백그라운드 서브에이전트</b>(보조 에이전트)가')])
E('/loop 자기 깨우기',ko='Claude Code 예약 작업 문서. <b>/loop</b>는 같은 일을 되풀이하는 명령이고, 간격을 빼면 Claude가 다음 시각을 고른다.',
  reps=[('2026-08-27(2.1.248)부터 Bedrock · Vertex · Foundry에서도 항상 사용','2026-08-27(2.1.248)부터 Bedrock · Vertex · Foundry(외부 클라우드)에서도 항상 사용')])
E('실행 화면(모형)',h2='코디네이터는 깨어나 PR·이슈를 읽고 실패한 일을 재배정한다')
E('안전장치: 만료와 사용량',ko='Claude Code 예약 작업 문서의 제약 부분. 반복 작업은 <b>만든 지 7일 뒤 자동으로 사라진다</b>고 안내.')
E('정리와 다음 교시',ko='다음 교시에서 볼 Nygard의 ADR 원문(2011). 큰 문서는 낡는다는 문제의 출발점.')
open('src/periods/p13.html','w',encoding='utf-8').write(s)
# ---------------- p14
s=load('p14')
E('SDD 복습',
  ko=['GitHub Spec Kit 발표 글. 스펙을 먼저 쓰는 SDD(스펙 주도 개발)를 소개.','Böckeler의 글. <b>SDD의 정의</b>가 아직 흔들린다고 밝히고 공통점을 정리.'],
  reps=[('“The spec becomes the source of truth for the human and the AI.” <span class="next">','“The spec becomes the source of truth for the human and the AI.” = 스펙이 사람과 AI 모두의 기준이 된다. <span class="next">')])
E('길어지고 낡는 스펙',ko='Nygard가 2011년에 쓴 글의 ‘Context’ 부분. <b>큰 문서는 최신으로 유지되지 않는다</b>고 짚는다.',
  reps=[('<cite>Nygard · 2011-11-15','<span class="tr">큰 문서는 결코 최신 상태로 유지되지 않는다.</span><cite>Nygard · 2011-11-15')])
E('ADR이란',ko='adr.github.io 첫 화면. ADR을 <b>결정 하나와 그 근거를 적은 문서</b>로 정의한다.',
  reps=[('Architecture Decision Record: 결정','Architecture Decision Record(아키텍처 결정 기록): 결정')])
E('Nygard 원형',h2='Nygard의 ADR 원형은 다섯 칸, 한두 쪽이면 끝난다',
  ko='Nygard 글에서 <b>Status(상태)와 Consequences(결과)</b> 칸을 설명하는 부분.',
  reps=[('<li>Title: 짧은 명사구</li>','<li>Title(제목): 짧은 명사구</li>'),
        ('<li>Status: 제안됨','<li>Status(상태): 제안됨'),
        ('<li>Context: 힘겨루기','<li>Context(맥락): 힘겨루기'),
        ('<li>Decision: “We will …” 능동형 문장</li>','<li>Decision(결정): “We will …”(우리는 ~한다) 문장</li>'),
        ('<li>Consequences: 좋은','<li>Consequences(결과): 좋은')])
E('MADR',ko='MADR 공식 사이트 첫 화면. ADR을 <b>마크다운 서식</b>으로 간소화한 템플릿(4.0)을 소개.')
E('세 서식 비교',reps=[
  ('<td>Title · Status</td>','<td>Title(제목) · Status(상태)</td>'),
  ('<td>Context</td><td>Context and Problem Statement</td>','<td>Context(맥락)</td><td>Context and Problem Statement(배경·문제)</td>'),
  ('<td>Considered Options</td>','<td>Considered Options(검토한 선택지)</td>'),
  ('<td>Decision</td><td>Decision Outcome</td>','<td>Decision(결정)</td><td>Decision Outcome(결정 결과)</td>'),
  ('<td>Consequences</td><td>Consequences</td>','<td>Consequences(결과)</td><td>Consequences(결과)</td>'),
  ('<td>More Information</td>','<td>More Information(추가 정보)</td>')])
E('언제 쓰는가',reps=[('<li>PoC의 임시 결정은 한 줄 메모</li>','<li>PoC(시험 제작)의 임시 결정은 한 줄 메모</li>')])
E('GitHub 프로젝트',ko='GitHub Docs ‘About Projects’ 화면. 프로젝트를 <b>이슈·PR과 연결된 표·보드·로드맵</b>이라고 설명한다.',
  reps=[('<cite>GitHub Docs · About','<span class="tr">유연하게 바꿔 쓰는 표, 보드, 로드맵</span><cite>GitHub Docs · About'),
        ('<li>이슈·PR과 <b>양방향으로 동기화</b></li>','<li>이슈·PR(변경 요청)과 <b>양방향으로 동기화</b></li>')])
E('이슈 하나는 작업 하나',ko='GitHub Docs ‘하위 이슈 추가’ 화면. 이슈 아래 <b>하위 이슈를 100개, 8단계</b>까지 둘 수 있다고 설명한다.')
E('종료 키워드',ko='GitHub Docs ‘PR을 이슈에 연결’ 화면. PR이 기본 브랜치에 머지되면 <b>연결된 이슈가 자동으로 닫힌다</b>.')
E('정리와 다음 교시',ko='GitHub 머지 큐 문서. 15교시에서 PR이 폭증할 때 합치는 문제를 다루며 다시 봅니다.')
open('src/periods/p14.html','w',encoding='utf-8').write(s)
print('ok')
