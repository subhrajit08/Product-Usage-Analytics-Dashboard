# Frammer AI - Product Usage Analytics Dashboard

A modern, high-performance analytics dashboard built with **Next.js** and **React** that provides deep insights into video publishing funnels, processing drop-offs, and multi-dimensional content performance.

---

## Features

### Multi-Dimensional Analysis
- Dynamically cross-reference metrics across:
  - Channel
  - Language
  - Client
- Visualized using **Stacked** and **Grouped Bar Charts**

### Publishing Funnel Tracking
- Track full media lifecycle:
  - Uploaded → Processed → Published
- Identify:
  - Drop-offs
  - Trends over time

### Interactive Data Breakdown
- Scrollable and sortable lists
- Sorting options:
  - Publish Rate
  - Processed Volume
- Includes:
  - Custom progress bars
  - Hover-state tooltips

### Advanced Filtering
Filter dashboard data by:
- Client
- Channel
- Language
- Content Type

### KPI Monitoring
Quick-glance metrics including:
- Publish Rate
- Drop Gaps
- Billable Percentage

### Dark Mode UI
- Clean, modern dark theme
- Optimized for high data density
- Improved readability

---

## Tech Stack

| Category | Technology |
|--------|-----------|
| Framework | Next.js (React) |
| Styling | Tailwind CSS |
| Database | SQL (`analytics_db.sql`) |

---

## Getting Started

### Prerequisites
- Node.js (v16 or later recommended)
- npm

---

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/subhrajit08/product-usage-analytics-dashboard.git
cd product-usage-analytics-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Database Setup**
- Ensure `analytics_db.sql` is located in the **root directory**
- The API route `/api/dashboard` reads from this database

4. **Run the development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

---

## Project Structure

```
├── /app                 # Main Next.js pages and API routes
│   └── /api/dashboard   # Backend data endpoint
│   └── globals.css      # Global styles
│   └── layout.js        # Root layout
│   └── page.js          # Main dashboard UI entry point
├── /lib
│   └── db.js            # SQLite connection and database utility functions
├── /public              # Static assets
├── analytics_db.sql     # SQLite database
├── package.json
└── README.md
```

---

## API Overview

### `/api/dashboard`
- Reads data from `analytics_db.sql`
- Returns structured analytics data for:
  - Funnel metrics
  - KPI calculations
  - Chart visualizations

---

## Future Improvements

- Real-time data streaming
- User authentication & role-based views
- Export reports (CSV/PDF)

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License

This project is licensed under the **MIT License**.


