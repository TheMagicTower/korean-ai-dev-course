# 약어 풀어 쓰기 (2026-10-29 11:52 강사 요청)

강사 말: “FIM은 무슨 뜻이야? 약자들은 풀어서 써주면 좋겠음.”

## 규칙
- 슬라이드: **교시(pNN.html)마다 각 약어가 처음 나오는 곳**에 `약어(영어 원말, 한국어 뜻)` 형태로 한 번 풀어 쓴다. 예) `FIM(Fill-in-the-Middle, 가운데 채우기)`, `LSP(Language Server Protocol, 언어 서버 프로토콜)`. 원말과 뜻이 같으면 한쪽만. 이후에는 약어만.
  - 처음 나오는 곳이 제목(h2)이라 길어지면, 제목은 그대로 두고 같은 장 본문(.ko, .under, 표, 카드)이나 tag에서 풀어도 된다. 노트(aside)에서도 처음 말할 때 한 번 풀어 읽는다.
  - 이미 풀어 쓴 곳은 그대로.
- 강의 노트(plan/notes/*.md): **교시 절마다** 처음 나오는 곳에서 같은 방식으로 한 번 푼다.
- 대상 예: FIM, LSP, MCP, SDD, ADR, TDD, BDD, DDD, MDD, CI, CD, PR, PoC, MVP, IDE, CLI, LLM, API, SDK, UI, UX, RL, EARS, MADR, JSONL, DOM, PII, AST, RAG, SaaS, YAML, JSON, OAuth, URL 등. 교시에 실제로 나오는 것만. 제품·도구 고유명(Copilot, Codex, Orca 등)과 일반인이 아는 것(AI, OS, PC, GitHub)은 제외.
- 정확한 원말만 쓴다. 확신 없으면 WebSearch로 확인하거나 풀지 말고 보고. 예) MCP = Model Context Protocol, EARS = Easy Approach to Requirements Syntax, MADR = Markdown Architectural Decision Records, PoC = Proof of Concept, MVP = Minimum Viable Product, RL = Reinforcement Learning.
- 넘침이 생기면 문장을 줄여 맞춘다. 사실·장 구성은 바꾸지 않는다.

## 검사
`python3 tools/build.py pNN` → `NODE_PATH=$(npm root -g) node tools/qa.js pNN` 넘침 0.
보고: 교시별로 푼 약어 목록(한 줄), 확신이 없어 남긴 것.
