# GroupVoteCreateModal Behavior Notes

## Inputs

- `onClose`: closes the modal.
- `onComplete`: receives valid place options, valid time options with generated `dateLabel`, and `allowMultiple`.

## State Transitions

- Initial state starts on the `place` step with two empty place inputs and two empty time options.
- Primary action on `place` validates at least two non-empty place options, then moves to `time`.
- Primary action on `time` validates at least two complete date/time options, calls `onComplete`, then closes.
- Back action on `time` returns to `place`; back action on `place` closes.
- Add option appends one place input or one time option depending on current step.
- Multiple select toggles `allowMultiple`.
- While mounted, body scrolling is disabled and restored on unmount.

## Outputs

- Renders full-screen modal navigation, step chips, current-step option inputs, multiple-selection toggle, and fixed bottom primary action.
- Date/time native picker fields proxy clicks and keyboard activation to hidden native inputs.

## Smoke Checklist

- Open modal, close with back on place step.
- Enter fewer than two place options and confirm validation message.
- Enter two place options and move to time step.
- Back from time step and confirm place inputs persist.
- Enter fewer than two complete time options and confirm validation message.
- Toggle multiple selection and complete the modal; confirm payload shape is unchanged.
