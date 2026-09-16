# VoteResultsPage Behavior Notes

선택지 추가는 **투표 화면(VoteSubmissionPage)에서 한다**(2026-09-17, BUG-082).
결과 화면에는 두지 않는다 — 마감된 결과에 선택지를 붙일 수 없고, 진행 중이면 투표 화면으로 가면 된다.

## Inputs

- `vote`: current group vote with place/time options, my vote, status, and member counts.
- `memberNameById`: voter ID(Map) to display name mapping. 서버는 ID만 주므로 매핑은 화면 몫이다.
- `onClose`: returns to previous group chat view.
- `onRevote`: opens the vote submission flow again.
- `onCloseVote`: 투표 마감. 방 멤버 누구나 가능하고 멱등이다.

## State Transitions

- 승자·득표율은 서버가 계산하지 않는다. `tallyPlaceOptions` / `tallyTimeOptions` 가 판정하고
  선택지 배열 순서(=생성 시 입력 순)를 그대로 노출한다.
- Revote CTA is visible only when the vote is open, the user already voted, and not all members have voted.
- 동표 안내는 마감된 투표에서만 뜬다. 진행 중에는 아직 결과가 아니다.
- While mounted, body scrolling is disabled and restored on unmount.

## Outputs

- Renders place and time result sections with winner styling, voter names, vote counts, and progress bars.
- 1위 카드는 진행 중에는 배경만, **전원이 투표를 마친 뒤에만** 배경 + 진한 테두리다(Figma 2116/2131).
  전원 투표가 끝나면 1위가 아닌 카드는 opacity 0.74 로 물러난다.
- Place options keep the existing map-link click behavior.

## Smoke Checklist

- Open results and close with the back button.
- Confirm my selected options show check marks.
- Confirm voter names and progress bars render for voted options.
- 전원 투표 전/후로 1위 카드 테두리가 생기는지 확인.
- When eligible, press "다시 투표하기" and confirm submission view opens.
