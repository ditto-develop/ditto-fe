# VoteSubmissionPage Behavior Notes

선택지 추가(`chatControllerAddVoteOption`)는 이 화면에 없다. 선택지는 **투표 생성 시 확정**된다
(BE 위키 Frontend-Vote-Guide). Figma 2294/2153 에 "+ 새로운 장소/시간 추가하기" 행이 남아 있지만
그 결정이 정본이므로 그리지 않는다 — 이 문서가 예전에 적어 두었던 add-place/add-time 모드는
구현된 적이 없다.

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
