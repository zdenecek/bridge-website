# Table Cone Generator - Technical Documentation

Single-page HTML app generating printable table number cones (three triangles that fold into pyramids).

## Architecture

Everything in `index.html`: HTML structure, embedded CSS, and vanilla JavaScript. No build tools required.

## Triangle Geometry

Each cone = 3 equilateral triangles in a strip:
- **Left/Right triangles**: Point up, rotated 120°/240° for folding
- **Middle triangle**: Points down, rotated 180° (prints upside-down, correct when folded)

Key formulas:
- Height: `side * √3 / 2`
- In-radius (text positioning): `(side * √3) / 6`
- mm to pixels: `× 3.78`

## Key Functions

| Function | Purpose |
|----------|---------|
| `generate()` | Main render - reads inputs, creates pages with triangle strips |
| `createTriangleStrip()` | Creates SVG with 3 triangles for one cone |
| `addTriangle()` | Adds polygon + rotated text group to SVG |
| `calculateOptimalCones()` | Auto-calculates how many cones fit on A4 |
| `calculateOptimalGap()` | Auto-calculates spacing between cones |
| `onTriangleSizeChange()` | Triggers recalculation of cones + gap |
| `onConesPerPageChange()` | Triggers recalculation of gap only |

### Font Size Scaling

Font size adapts to number of digits:
- 1 digit: `side × 0.4`
- 2 digits: `side × 0.32`
- 3+ digits: `side × 0.24`

Then multiplied by `fontSizeAdjust` percentage.

### Auto-Calculation Logic

**Cones per page**: `floor((availableHeight + minGap) / (triangleHeight + minGap))` where `minGap = 10mm`

**Gap size**: Distributes remaining vertical space evenly. Bottom margin (10mm) is treated as part of the last gap for visual consistency.

## Constants

```javascript
A4_HEIGHT_MM = 297
BOTTOM_MARGIN_MM = 10
mmToPx = 3.78
```

## Form Inputs

| ID | Default | Description |
|----|---------|-------------|
| `startNum` | 1 | First table number |
| `endNum` | 12 | Last table number |
| `triangleSize` | 100 | Side length (mm), auto-recalculates cones/gap |
| `customText` | "" | Optional text below number |
| `conesPerPage` | auto | Cones per page (1-10) |
| `gapSize` | auto | Gap between cones (mm) |
| `topMargin` | 5 | Top page margin (mm) |
| `fontFamily` | Libre Baskerville | Font selection or "custom" |
| `fontSizeInput` | 0 | Font size adjustment (%) |
| `bottomMarginInput` | 0 | Text margin adjustment (%) |
| `uppercaseText` | true | Uppercase custom text |

## CSS Structure

- `.sidebar` - Left config panel (fixed on desktop, overlay on mobile)
- `.main-content` - Generated pages container
- `.page` - A4 page (210mm × 297mm)
- `.triangle-strip` - One cone's SVG container

**Responsive**: Below 900px, sidebar hides and gear button appears.

**Print**: Sidebar hidden, pages break correctly with `@page { size: A4 portrait; }`

## Extending

**Add font**: Add to Google Fonts import + add `<option>` to `#fontFamily` select.

**Add setting**: 
1. Add HTML input in sidebar
2. Read value in `generate()`
3. Pass to render functions as needed
4. Add event listener in `DOMContentLoaded`

**Modify triangles**: Edit `tri1/tri2/tri3` objects in `createTriangleStrip()` for coordinates/rotation.

## Notes

- Print in Chrome (Firefox has issues on page 2+)
- Mobile: sidebar hidden by default, toggle with gear button
- Custom fonts: entered without quotes, browser must have font installed
- Triangle outlines are gray (#999) for subtle visibility
