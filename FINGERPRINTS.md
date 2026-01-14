# Conversation Fingerprint Generation Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Input Data Format](#input-data-format)
3. [Generation Algorithm](#generation-algorithm)
4. [Output Data Format](#output-data-format)
5. [File Structure](#file-structure)
6. [Emotion Mapping](#emotion-mapping)
7. [Usage Examples](#usage-examples)

## Introduction

Conversation fingerprints are visual representations of the emotional dynamics and structure of a dialogue. They are displayed as a horizontal bar with colored segments, where each segment represents a period of speech by a specific speaker with a specific emotion.

### Core Principles

- **Structural Accuracy**: The fingerprint reflects the actual structure of the conversation — long monologues are displayed as long clips, intense dialogues as a series of short clips
- **Emotional Accuracy**: Emotions from the transcript are preserved and displayed through color coding
- **Simplification**: Source data is simplified for better readability while preserving key conversation characteristics

## Input Data Format

Source data is stored in HTML files in the `fingerprint-sources/` folder. Each file contains a conversation transcript with clip markup.

### Clip Structure in Source File

```html
<div
  class="clip-item mb-3 p-3 border rounded evidence-clip-item"
  data-clip-uuid="...">
  <div class="mb-2">
    <span class="fw-bold">Customer Service Representative</span>
  </div>
  <div class="d-flex justify-content-between align-items-start mb-2">
    <div class="clip-metadata">
      <span class="badge bg-primary me-2">00:00</span>
      <span class="badge bg-secondary me-1">Neutral</span>
      <span class="badge bg-info me-1">american</span>
      <span class="badge bg-success">english</span>
    </div>
    <small class="text-muted">3s</small>
  </div>
  <div class="clip-text" data-original-text="...">Utterance text</div>
</div>
```

### Extracted Data

For each clip, the following data is extracted:

- **Speaker** (`speaker`): Speaker name from `<span class="fw-bold">`
- **Start Time** (`time`): Time in `MM:SS` format from badge with class `bg-primary`, converted to seconds
- **Emotion** (`emotion`): Emotion text from badge with class `bg-secondary`
- **Duration** (`duration`): Duration in seconds from `<small class="text-muted">`

## Generation Algorithm

Fingerprint generation occurs in several stages:

### Stage 1: Transcript Parsing

1. Read the transcript HTML file
2. Split into clips by pattern `<div class="clip-item..."`
3. Extract data for each clip
4. Sort clips by start time

### Stage 2: Speaker Mapping

Speakers are assigned numeric indices in order of their first appearance:

- First unique speaker gets index `1`
- Second unique speaker gets index `2`
- And so on

**Example:**

- `Customer Service Representative` → index `1`
- `Customer` → index `2`

### Stage 3: Emotion Mapping

Emotions from the transcript are mapped to CSS classes. See [Emotion Mapping](#emotion-mapping) section for details.

### Stage 4: Clip Grouping

Consecutive clips from the same speaker with compatible emotions are aggressively merged into groups:

**Merging Rules:**

- Clips from the same speaker are merged if emotions are compatible:
  - `neutral` and `calm` — compatible
  - `frustrated`, `concerned`, and `angry` — compatible (negative emotions group)
  - `happy`, `amused`, and `excited` — compatible (positive emotions group)
  - Identical emotions — compatible
- Durations are summed when merging
- Dominant emotion (non-`neutral`) is preserved

**Result:** A list of grouped clips with increased durations for similar utterances, reducing the total number of clips significantly.

### Stage 5: Simplification (Final Selection)

Representative clips are selected from grouped clips for the final fingerprint. The algorithm uses aggressive thresholds to achieve ~8-12 clips total:

**Selection Rules:**

1. **Very Long Monologues (>20s)**: Always preserved
2. **Long Clips (12-20s)**: Preserved if emotion is significant (not `neutral`/`calm`)
3. **Medium Clips (8-12s)**: Preserved only if emotion is highly significant (`angry`, `frustrated`, `sad`, `anxious`, `stressed`, `concerned`)
4. **Shorter Clips (5-8s)**: Preserved only if emotion is `angry` or `frustrated`
5. **Very Short Clips (<5s)**: Generally skipped unless extremely emotional

**Coverage Assurance:**

- If fewer than 6 clips are selected, additional medium-long clips (≥10s) are added to ensure minimum coverage
- Target: 8-12 clips for typical 5-10 minute conversations

### Stage 6: Position and Width Calculation

Clips are redistributed to fill 100% of the timeline without gaps:

- **Proportional Redistribution**: Selected clips are redistributed proportionally based on their durations
- **`data-position`**: Start position calculated sequentially, ensuring no gaps
  ```
  position[i] = sum of widths of all previous clips
  ```
- **`data-width`**: Width calculated proportionally to fill remaining space
  ```
  width[i] = (clip_duration / total_selected_duration) * remaining_percentage
  ```
- **Last Clip**: Always fills remaining space to ensure 100% coverage

**Key Features:**

- Clips always fill 100% of the timeline (no gaps)
- Positions are sequential (each clip starts where the previous ends)
- Widths are proportional to original durations, preserving relative importance

**Example:**

- Total duration: 332 seconds (5:32)
- Selected clips total duration: 200 seconds
- Clip with original duration 20 seconds
- `data-width = (20 / 200) * 100 = 10.0%`
- `data-position` is calculated sequentially based on previous clips

## Output Data Format

The fingerprint is generated as an HTML fragment with clips in the format:

```html
<div
  class="table-fingerprint-clip emotion-{emotion}"
  data-position="{position}"
  data-width="{width}"
  data-speaker-index="{speaker_index}">
  <div class="table-fingerprint-visualization"></div>
</div>
```

### Clip Attributes

- **`class`**: `table-fingerprint-clip emotion-{emotion}`
  - `emotion-{emotion}` — emotion class (e.g., `emotion-frustrated`, `emotion-calm`)
- **`data-position`**: Start position in percentage (number with one decimal place)
- **`data-width`**: Width in percentage (number with one decimal place)
- **`data-speaker-index`**: Speaker index (1, 2, 3, ...)

### Wrapper Structure

The fingerprint is inserted into the table in the following structure:

```html
<td class="col-fingerprint">
  <div class="table-fingerprint-wrapper">
    <div class="table-fingerprint dark-mode" style="--speaker-count: 2">
      <!-- Fingerprint clips -->
      {% include "components/fingerprints/filename.html" %}
    </div>
    <span class="table-fingerprint-time">05:33</span>
  </div>
</td>
```

## File Structure

### Source Data

```
fingerprint-sources/
  ├── Elderly Caller Needs Login for Surgery Payment.html
  ├── Gender-Role Argument Ends the Relationship.html
  └── ...
```

### Generated Fingerprints

```
src/includes/components/fingerprints/
  ├── elderly-caller-needs-login.html
  ├── gender-role-argument-ends-relationship.html
  └── ...
```

### Usage in Table

Fingerprints are included via includes in `src/includes/components/demo-recordings-table.html`:

```html
{% include "components/fingerprints/elderly-caller-needs-login.html" %}
```

## Emotion Mapping

### Direct Mapping

Emotions from the transcript are directly mapped to CSS classes:

| Transcript     | CSS Class            |
| -------------- | -------------------- |
| `Neutral`      | `neutral`            |
| `Calm`         | `calm`               |
| `Frustrated`   | `frustrated`         |
| `Concerned`    | `concerned`          |
| `Confused`     | `confused`           |
| `Happy`        | `happy`              |
| `Angry`        | `angry`              |
| `Sad`          | `sad`                |
| `Anxious`      | `anxious`            |
| `Stressed`     | `stressed`           |
| `Excited`      | `excited`            |
| `Disappointed` | `disappointed`       |
| `Curious`      | `curious`            |
| `Interested`   | `interested`         |
| `Confident`    | `confident`          |
| `Amused`       | `amused`             |
| `Hopeful`      | `hopeful`            |
| `Proud`        | `proud`              |
| `Tired`        | `tired`              |
| `Bored`        | `bored`              |
| `Surprised`    | `surprised`          |
| `Afraid`       | `afraid`             |
| `Ashamed`      | `ashamed`            |
| `Disgusted`    | `disgusted`          |
| `Contemptuous` | `contemptuous`       |
| `Affectionate` | `affectionate`       |
| `Relieved`     | `relieved`           |
| `Unknown`      | `neutral` (fallback) |

### Semantic Mapping

If an emotion is not found in direct mapping, semantic search is used:

| Transcript                          | Mapping        |
| ----------------------------------- | -------------- |
| `Worried`                           | → `concerned`  |
| `Upset`, `Annoyed`, `Irritated`     | → `frustrated` |
| `Nervous`                           | → `anxious`    |
| `Scared`, `Frightened`              | → `afraid`     |
| `Pleased`, `Glad`, `Satisfied`      | → `happy`      |
| `Unhappy`, `Miserable`, `Depressed` | → `sad`        |

If semantic mapping also yields no result, `neutral` is used as fallback.

## Usage Examples

### Example 1: Fingerprint Generation

**Input Data:**

- File: `fingerprint-sources/Elderly Caller Needs Login for Surgery Payment.html`
- Total duration: 333 seconds (5:33)
- Number of source clips: 39

**Process:**

1. Parsing → 39 clips
2. Grouping → 39 groups (grouping merges compatible emotions)
3. Simplification → 10 final clips (aggressive selection)
4. Redistribution → 10 clips covering 100% of timeline

**Result:**

- File: `src/includes/components/fingerprints/elderly-caller-needs-login.html`
- 10 clips with varying durations:
  - Very long: up to 41.1% width (extended monologue at end)
  - Long: 8.4-11.2% width (significant dialogue segments)
  - Medium: 3.1-6.1% width (normal dialogue)
- All clips positioned sequentially with no gaps

### Example 2: Conversation Structure

**Very Long Monologue:**

```html
<div
  class="table-fingerprint-clip emotion-calm"
  data-position="58.9"
  data-width="41.1"
  data-speaker-index="1">
  <div class="table-fingerprint-visualization"></div>
</div>
```

→ Extended monologue covering 41.1% of conversation (clips are redistributed proportionally)

**Long Emotional Segment:**

```html
<div
  class="table-fingerprint-clip emotion-frustrated"
  data-position="8.4"
  data-width="11.2"
  data-speaker-index="2">
  <div class="table-fingerprint-visualization"></div>
</div>
```

→ Customer expresses frustration over 11.2% of total duration

**Sequential Coverage (No Gaps):**

```html
<div
  class="table-fingerprint-clip emotion-frustrated"
  data-position="29.2"
  data-width="2.7"
  data-speaker-index="1">
  ...
</div>
<div
  class="table-fingerprint-clip emotion-frustrated"
  data-position="31.8"
  data-width="2.6"
  data-speaker-index="1">
  ...
</div>
<div
  class="table-fingerprint-clip emotion-frustrated"
  data-position="34.4"
  data-width="4.1"
  data-speaker-index="1">
  ...
</div>
```

→ Clips positioned sequentially: 29.2 + 2.7 = 31.9 (next starts at 31.8), ensuring continuous coverage

## Technical Details

### Boundary Handling

- Clips never overlap — each clip starts exactly where the previous ends
- Positions are calculated sequentially to ensure continuous coverage
- Widths are calculated proportionally based on original durations, then redistributed to fill 100%
- Last clip always extends to 100% to eliminate any rounding gaps

### Performance

- Algorithm runs in O(n), where n is the number of clips in the transcript
- Grouping occurs in a single pass
- Simplification occurs in a single pass with additional coverage check

### Limitations

- Minimum clip width: ~1.0% (after redistribution)
- Maximum number of clips: unlimited, but typically 8-15 for conversations 5-10 minutes long
- Coverage: always 100% of total conversation duration (no gaps)
- Target simplification: reduces source clips by 60-80% (e.g., 39 → 10, 51 → 13)

## Support and Extension

### Adding New Emotions

1. Add the emotion to the mapping in the `map_emotion()` function
2. Add CSS styles for the new emotion in `src/styles/components/demo-recordings-table.css`
3. Ensure the emotion color matches its semantics

### Modifying Simplification Algorithm

The simplification algorithm can be tuned by changing threshold values in Stage 5:

- Duration thresholds (currently: 20s, 12s, 8s, 5s)
- Minimum clip count (currently: 6 clips)
- Maximum clip count (currently: ~12 clips)
- Emotion compatibility rules for grouping (Stage 4)

### Adding New Conversation Types

The algorithm is universal and works with any transcripts in the format described in the [Input Data Format](#input-data-format) section.
