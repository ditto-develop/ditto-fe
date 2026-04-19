# FE Agents Guide (Codex / Claude)

이 폴더(`ditto-fe-migration/`)에서 작업하는 모든 코딩 에이전트(Codex 포함)는 아래 문서를 Claude Code와 **완전히 동일하게** 따른다.

## 반드시 먼저 읽을 것

1. [`../CLAUDE.md`](../CLAUDE.md) — 프로젝트 공통 규칙과 클린 코드 공통 원칙
2. [`./CLAUDE.md`](./CLAUDE.md) — FE 상세 규약 (**본 문서의 본체**)
3. [`../AGENTS.md`](../AGENTS.md) — 저장소 진입점 요약

본 파일은 Codex가 이 폴더에 진입했을 때 기본으로 읽는 진입점이며, 규칙 자체는 위 문서들을 그대로 따른다.

## 작업 진행 방식

- 클린업 작업은 `~/.claude/plans/ditto-fe-migration-fancy-rose.md`에 정의된 **배치(batch) 단위**로만 진행한다.
- 한 PR에 여러 배치를 섞지 않는다. 파일 rename과 내용 수정은 커밋을 분리한다.
- 브랜치 네이밍: `chore/cleanup-<letter>-<slug>` (예: `chore/cleanup-b-fetch-unify`)
- 대상 브랜치: `feat/s3-migration`
- 검증: `npm run lint && npm run build && npx tsc --noEmit` 통과 + 주요 페이지 스모크 테스트 + 배포 후 `gh run watch`.

## 즉시 중단하고 사용자에게 질문해야 하는 경우

1. 하드코딩된 색/폰트가 기존 CSS 변수 토큰과 매핑되지 않을 때
2. generated API와 legacy API의 spec이 다를 때 (필드·타입 불일치)
3. Mock 분기 제거 시 BE 연동 완료 여부가 불명확할 때
4. 거대 컴포넌트 분해의 섹션 경계가 모호할 때
5. public API(외부 import 심볼) 이름·시그니처 변경이 필요할 때
6. 배치 범위를 벗어나는 로직 변경이 필요해 보일 때

임의로 근사값을 고르거나 추측하지 않는다.
