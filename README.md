# Orders Explorer

A React and TypeScript application for exploring, filtering, sorting, and exporting a large order dataset. The grid is designed to handle approximately 50,000 orders using custom row virtualization.

## Features

- **Large dataset:** Loads and normalizes order records from JSON.
- **Virtualized grid:** Renders a visible window of rows instead of all rows simultaneously.
- **Sorting:** Sorts columns by their underlying values, with missing `updatedAt` values kept at the bottom.
- **Column controls:** Resize columns and pin one column while scrolling horizontally.
- **Selection:** Select individual rows, use Shift-click for range selection, and select visible results using the header checkbox.
- **Keyboard navigation:** Navigate cells with arrow keys, press Enter to open order details, and press Space to toggle row selection.
- **Filtering:** Build filter conditions using supported text, numeric, date, and choice operators. Conditions within a group use OR; separate groups use AND.
- **URL persistence:** Filters, sorting, pinned columns, and selected order IDs are stored in the URL so the state can be restored or shared.
- **Invalid URL handling:** Invalid filter parameters fall back to default filters and display a warning.
- **CSV export:** Export selected orders, including selected orders currently hidden by filters.
- **Order details:** Inspect full field values, including long notes.
- **Empty state:** Shows a helpful message when no orders match the filters.

## Tech Stack

- React
- TypeScript
- Vite
- JSON dataset
- Custom table virtualization and filter builder

## Requirements

- Node.js 24
- npm

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run TypeScript checks:

```bash
npx tsc -b
```

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Data Loading and Normalization

The application imports the dataset from `src/data/orders.json`. The original dataset in `public/data/orders.json` is kept unchanged.

Normalization handles supported schema differences, customer-name field variants, amount units, date formats, missing values, casing, currency whitespace, and duplicate order IDs.

## CSV Export Policy

CSV export includes every selected order, even if the order is currently hidden by active filters. The selection count reflects the selected order IDs, and the exported file is named `selected-orders.csv`.

CSV values are quoted and embedded quotation marks are escaped. The file uses UTF-8 encoding with a byte-order mark to improve compatibility with spreadsheet applications.

## Design

The interface uses a dark theme with a sticky table header, column resizing, pinned columns, compact rows, and an order details panel.

Design sketches should be stored in the `design/` directory.

## Testing Performed

- TypeScript compilation and ESLint checks.
- Filter conditions, group logic, and filter validation.
- URL state restoration and invalid-filter handling.
- Sorting, column pinning, and resizing.
- Individual and range selection.
- Keyboard navigation and order details.
- CSV export, including selections hidden by filters.
- Empty results, missing values, long notes, and large-dataset scrolling.

## Known Limitations

- Column widths are currently maintained in application state and are not persisted in the URL.
- The grid uses a fixed row-height assumption for virtualization.
- Selection and filter state are encoded in the URL, which can become long when many orders are selected.
