# MatchingDay Behavior Notes

## Inputs

- `matchType`: `beforematch`, `failmatch`, `one`, `many`
- `buttonState`: CTA variant passed through to `ActionButton`
- `day`: countdown target selector, Thursday uses Friday target and otherwise Thursday target
- `isChatTime`: switches matching-period cards to chatting-period cards
- `candidates`: matched candidate list used for one-to-one and group card previews
- `hasAcceptedMatch`, `acceptedCandidate`: accepted one-to-one matching state
- `groupJoined`, `groupJoinPending`: group matching participation state
- `chatRoom`: latest chat-room preview, unread count, and CTA state
- `quizSetId`: localStorage notification key suffix
- `onStartChat`, `onGroupJoined`, `onGroupJoinPending`: parent callbacks

## State Transitions

- On mount/update, when an accepted match exists before chat time and the `quizSetId` notification key has not been seen, show the accepted-match toast and mark the key in localStorage.
- `profileSelect=false -> true`: opened from group preview cards to show the bottom sheet profile selector.
- `selectedProfile=null -> profile`: opened by tapping an accepted-match card or a selectable group profile item.
- `groupModalOpen=false -> true`: opened by pressing the group matching CTA during matching period.
- `groupDeclined=false -> true`: set from the group matching result modal decline callback, causing the fail-match empty state.

## Outputs

- `groupJoined && !isChatTime && matchType === "many"` renders the completed group matching card, disabled chat CTA, bottom sheet selector, and optional profile detail modal.
- `hasAcceptedMatch && acceptedCandidate && !isChatTime` renders the completed one-to-one matching card, disabled chat CTA, and optional profile detail modal.
- `matchType === "beforematch"` renders the pre-result card with countdown and routes CTA/alert to `/matching`.
- `matchType === "failmatch" || groupDeclined` renders the empty-state fail card.
- Otherwise renders the active matching/chatting card:
  - During chat time, `ChattingView` displays one-to-one or group chat preview and CTA delegates to `onStartChat`.
  - Before chat time, `MatchingCandidateCard` displays anonymous avatar collage and the CTA opens group modal or routes to `/matching`.

## Smoke Checklist

- Enter home timeline and confirm the weekly matching card renders for each period state.
- Before matching result, tap CTA and alert chip and confirm navigation to `/matching`.
- In matching period with candidates, confirm anonymous avatar collage and countdown render.
- In accepted one-to-one state, open profile detail modal from the accepted card and close it.
- In joined group state, open the profile bottom sheet, select a profile, open detail modal, and close it.
- In group candidate state, press CTA, open group result modal, decline, and confirm empty state.
- In chat time, confirm one-to-one/group chat preview text, unread badge, countdown, and start/continue CTA behavior.
