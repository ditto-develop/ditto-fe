# VoteResultsPage Behavior Notes

## Inputs

- `vote`: current group vote with place/time options, my vote, status, and member counts.
- `memberMap`: voter ID to display name mapping.
- `roomId`: group chat room ID used for option-add API calls.
- `onClose`: returns to previous group chat view.
- `onRevote`: opens the vote submission flow again.
- `onVoteUpdated`: receives updated vote after adding an option.

## State Transitions

- Local place/time options are synchronized whenever `vote.placeOptions` or `vote.timeOptions` changes.
- Add-place mode toggles from button to text input, then calls `chatControllerAddVoteOption`.
- Add-time mode toggles from button to date/time inputs, builds a formatted `dateLabel`, then calls `chatControllerAddVoteOption`.
- Revote CTA is visible only when the vote is open, the user already voted, and not all members have voted.
- Option adding is visible only when the vote is open and not all members have voted.
- While mounted, body scrolling is disabled and restored on unmount.

## Outputs

- Renders place and time result sections with winner styling, voter names, vote counts, and progress bars.
- Place options keep the existing map-link click behavior.
- New option additions update local option state and notify the parent with the updated vote.

## Smoke Checklist

- Open results and close with the back button.
- Confirm my selected options show check marks.
- Confirm voter names and progress bars render for voted options.
- Add a new place option and confirm it appears.
- Add a new time option and confirm it appears with formatted date/time.
- When eligible, press “다시 투표하기” and confirm submission view opens.
