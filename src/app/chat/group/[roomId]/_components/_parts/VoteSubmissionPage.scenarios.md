# VoteSubmissionPage Behavior Notes

선택지 추가는 **이 화면에서 한다**(2026-09-17, BUG-082). Figma 2294/2153 의
"+ 새로운 장소/시간 추가하기" 행이 정본이다. 예전에는 "선택지는 생성 시 확정"으로 적어 두었으나
그 결정이 뒤집혔다.

호출은 BE 의 `place-options`/`time-options` 두 엔드포인트다 — 생성된 클라이언트의
`chatControllerAddVoteOption`(단일 경로)은 **실제 서버와 맞지 않으니 쓰지 않는다**.
장소는 `PlaceSearchModal`, 시간은 날짜·시간 피커로 받고 한 번에 하나씩 보낸다.
상한(타입당 10개)과 중복은 서버가 판정한다(8204/8205).

## Inputs

- `vote`: current group vote with options and prior `myVote`.
- `onClose`: closes the submission view.
- `onSubmit`: cast 요청. **보낸 집합이 최종 선택으로 치환**되므로 유지할 기존 선택도 함께 담는다.

## State Transitions

- Initial selected place/time IDs are derived from `vote.myVote`.
- Tapping an option toggles it; if `allowMultiple` is false, the selection is replaced with the tapped ID.
- Submit is enabled only when at least one place and one time are selected and not already submitting.
- While mounted, body scrolling is disabled and restored on unmount.

## Outputs

- Renders full-screen vote submission UI, option lists, and the bottom submit button.
- 선택된 행은 배경을 칠하지 않는다 — 테두리만 진해진다(Figma 2153:33436).

## Smoke Checklist

- Open submission and close with the back button.
- Select/deselect place and time options, including single-select replacement behavior.
- Confirm submit remains disabled until both sections have a selection.
- Submit a vote and confirm the parent switches to results view.
