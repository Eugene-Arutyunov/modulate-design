# Radio Switcher Component

A custom radio switcher with specific interaction behaviors.

## Key Implementation Details

- **Active option behavior**: Does not respond to hover and shows `cursor: default`
- **Inactive option hover**: Uses `--ids__hover-RGB` color with instant transition (0s) on hover, smooth return (0.5s) on leave - matching IDS link behavior
- **Indicator animation**: 0.15s cubic-bezier transition for smooth sliding between options
- **Transparent background**: Track has no background, only the indicator provides visual feedback

## HTML Structure Note

Radio inputs are hidden with styling handled through labels. The indicator uses `ids__rounded` class for consistent design system integration.

## Default State

First option ("Speakers") is checked by default.