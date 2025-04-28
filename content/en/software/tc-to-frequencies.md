---
title: Frequencies and Averages from Tournament Calculator Presentation
date: 2025-04-28
translationKey: tc-to-freq
url: tc-freq
---

This tool processes results from a Tournament Calculator presentation and displays frequencies and averages for each board. The tool is especially useful for:

- Quick display of result frequencies for individual boards
- Calculating averages with optional exclusion of extreme results
- Processing results from any number of boards at once

## How to Use the Tool

1. **Presentation URL**: Enter the base URL of the Tournament Calculator presentation (where the JSON files are located)
2. **Board Range**: Select the range of boards you want to process
   - You can use quick selection for a complete round by entering the number of boards per round
3. **Average Filtering**: Optionally select a filtering method for average calculations
   - Use all scores
   - Exclude a specific number of top and bottom scores
   - Exclude a specific percentage of top and bottom scores

## Output

The tool provides three types of output:

1. **Frequencies**: Shows the frequency of each score for each board
2. **Simple Averages**: List of boards with their averages in `board_number average` format
3. **Detailed Calculations**: Comprehensive output for each board including:
   - Filtering method used
   - Calculated average
   - List of included and excluded scores

All outputs can be easily copied to clipboard or downloaded as a text file.

## Technical Details

- Board numbers correspond to actual tournament board numbers (not file sequence numbers)
- Averages are rounded to the nearest 10 points (e.g., 423 → 420, 438 → 440)
- Filtering always preserves at least one score for average calculation
- The tool automatically removes any parameters and fragments from the URL

[Go to Tool](/apps/tc-to-frequencies.php)
