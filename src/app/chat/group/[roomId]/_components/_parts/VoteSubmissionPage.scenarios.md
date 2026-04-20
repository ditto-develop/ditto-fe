# VoteSubmissionPage Behavior Notes

## Inputs

- `vote`: current group vote with options and prior `myVote`.
- `roomId`: group chat room ID used for cast/add-option API calls.
- `onClose`: closes the submission view.
- `onVoted`: receives updated vote after successful submission.
- `onLocalVote`, `onLocalAddPlace`, `onLocalAddTime`: fallback handlers for mock/local update paths.

## State Transitions

- Initial selected place/time IDs are derived from `vote.myVote`.
- Tapping an option toggles it; if `allowMultiple` is false, the selection is replaced with the tapped ID.
- Add-place mode toggles from button to input, then calls `chatControllerAddVoteOption` or local fallback.
- Add-time mode toggles from button to date/time inputs, creates a formatted `dateLabel`, then calls `chatControllerAddVoteOption` or local fallback.
- Submit is enabled only when at least one place and one time are selected and not already submitting.
- Submit calls `chatControllerCastVote`; if API response is unavailable, local fallback is used.
- While mounted, body scrolling is disabled and restored on unmount.

## Outputs

- Renders full-screen vote submission UI, option lists, add-option controls, and fixed bottom submit button.
- Successful submit passes the updated vote to `onVoted`.

## Smoke Checklist

- Open submission and close with the back button.
- Select/deselect place and time options, including single-select replacement behavior.
- Confirm submit remains disabled until both sections have a selection.
- Add a new place option and confirm it appears.
- Add a new time option and confirm it appears with formatted date/time.
- Submit a vote and confirm the parent switches to results view.
