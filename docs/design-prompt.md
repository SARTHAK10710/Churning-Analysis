# Frontend Design Prompt — ChurnLens

Use these prompts in an AI design tool (Google Stitch, v0, Lovable, Figma Make, Galileo, etc.).

- **Part 1** is a single master prompt for tools that design a whole app at once.
- **Part 2** has one prompt per screen, for tools that work screen by screen (for example Stitch). Paste the **shared context block** first, then each screen prompt.

All numbers in these prompts come from the real dataset and the real model results, so the mockups look like the finished product.

---

## Part 1 — Master prompt

```
Design a modern, professional web app called "ChurnLens": a bank customer churn
prediction dashboard. Bank retention and analytics teams use it to see which
customers are likely to leave, understand why, and act before they do.

PRODUCT CONTEXT
- Backend: a machine learning model (Gradient Boosting) trained on 10,000 bank
  customers. It predicts the probability that a customer will leave ("churn").
- Built with React + Tailwind CSS + Recharts. Design only with components that are
  realistic to build: cards, tables, forms, sliders, toggles, tabs, bar/line/donut
  charts, badges, file dropzone. No 3D, no illustrations-heavy hero sections.
- Audience: bank analysts and managers. The app must feel trustworthy, data-dense
  but calm. It should look like a real fintech SaaS product (Stripe Dashboard,
  Linear, Vercel analytics, Mercury), not a student data-science demo.

VISUAL STYLE
- Clean, minimal, generous whitespace, 8px spacing grid, rounded-xl cards with a
  subtle 1px border and very soft shadow.
- Font: Inter (or Geist). Tabular numbers for all metrics.
- Neutral slate/zinc base. One brand accent: deep indigo (#4F46E5).
- Semantic risk colours used consistently everywhere:
  Low risk = emerald (#10B981), Medium risk = amber (#F59E0B), High risk = rose (#E11D48).
- Design a light mode, and show the dark mode version of the main screen too.
- Desktop first at 1440px wide, and also show the Predict screen at 390px mobile width.

LAYOUT
- Left sidebar (collapsible) with logo "ChurnLens", nav items with icons:
  1. Predict  2. Batch Scoring  3. Model Performance  4. Data Insights.
  Bottom of sidebar: small "Model: Gradient Boosting · v1 · trained on 10,000 customers"
  status chip with a green dot, and a light/dark mode toggle.
- Top bar: page title + one-line description on the left, and a "GitHub" icon
  button on the right.
- On mobile the sidebar becomes a bottom tab bar.

SCREEN 1 — PREDICT A CUSTOMER (the main screen)
Two-column layout.
Left column: card titled "Customer profile" with a form:
- Credit score: slider 350–850 with a number input (default 650)
- Country: segmented control France / Germany / Spain
- Gender: segmented control Male / Female
- Age: slider 18–92 (default 40)
- Tenure (years with bank): slider 0–10 (default 5)
- Balance (€): currency input (default 75,000)
- Number of products: stepper 1–4 (default 2)
- Has credit card: toggle
- Active member: toggle
- Estimated salary (€): currency input (default 100,000)
- Buttons: primary "Predict churn", secondary "Reset", and a ghost link
  "Load example: high-risk customer".
Right column: result panel.
- Large semicircular gauge showing churn probability, e.g. "72%", coloured by risk band
  (0–30% low, 30–60% medium, 60–100% high) with a badge "High risk".
- One-sentence plain-English summary: "This customer is likely to leave."
- Card "Why this prediction": horizontal diverging bar chart of the top 5 factors.
  Bars to the right (rose) increase risk, bars to the left (emerald) decrease risk.
  Example: Age 52 (+18%), Country Germany (+9%), Inactive member (+8%),
  3 products (+12%), Has credit card (−1%).
- Card "Suggested retention actions": 3 short checklist items, e.g.
  "Assign a relationship manager", "Offer a loyalty rate review",
  "Re-engagement campaign for inactive members".
- Empty state before the first prediction: soft illustration-free placeholder
  saying "Fill in a customer profile and click Predict churn".
- Also show the loading state (skeleton gauge).

SCREEN 2 — BATCH SCORING
- Large drag-and-drop dropzone: "Drop a CSV of customers here, or browse".
  Helper text listing required columns and a "Download sample CSV" link.
- After upload: summary KPI row with 4 cards: Customers scored (1,250),
  High risk (214 · 17%), Medium risk (301 · 24%), Average churn probability (21.3%).
- Data table of scored customers: Customer ID, Surname, Country, Age, Balance,
  Products, Active, Churn probability (number + small inline bar), Risk badge.
  Sorted by probability, highest first. Table has search, a risk filter
  (All / High / Medium / Low), pagination, and a primary
  "Download results CSV" button.
- Show an error state for an invalid file: "Missing column: Geography".

SCREEN 3 — MODEL PERFORMANCE
- Intro callout (info style): "Accuracy alone is misleading. 80% of customers stay,
  so a model that always says 'stays' is 80% accurate but catches no one.
  Recall shows how many real leavers the model catches."
- KPI row for the deployed model (Gradient Boosting): Accuracy 86.8%,
  Recall 48.9%, Precision 75.0%, ROC-AUC 0.87.
- Comparison table of all models, with the deployed one highlighted and tagged
  "Deployed", and the best value in each column bold:
    Model                     Accuracy  Recall  Precision
    Baseline (always "stay")  80.3%     0.0%    0.0%
    Logistic Regression       81.1%     20.1%   55.2%
    K-Nearest Neighbours      83.0%     37.2%   61.1%
    Random Forest             85.4%     31.0%   85.3%
    SVM (RBF)                 85.6%     38.2%   76.9%
    Decision Tree (depth 5)   85.8%     39.7%   76.5%
    Gradient Boosting         86.8%     48.9%   75.0%
- Grouped bar chart: Accuracy vs Recall for each model (shows the gap clearly).
- Confusion matrix card for the deployed model (2,000 test customers), as a 2x2
  heatmap grid: Actually stayed → Predicted stay 1,543 / Predicted leave 64;
  Actually left → Predicted stay 201 / Predicted leave 192.
- Feature importance card: horizontal bar chart (share of importance):
  Age 38.3%, Number of products 30.5%, Active member 12.0%, Balance 8.6%,
  Germany 4.7%, Estimated salary 2.1%, Credit score 2.0%, Gender 1.4%,
  Tenure 0.4%, Has credit card 0.1%.

SCREEN 4 — DATA INSIGHTS
- KPI row: Total customers 10,000 · Churn rate 20.4% · Churned 2,037 · Retained 7,963.
- Donut chart: Stayed 79.6% vs Left 20.4%.
- "Churn rate by country" bar chart: France 16.2%, Germany 32.4%, Spain 16.7%.
  Germany bar highlighted with an annotation "2× the other countries".
- "Churn rate by age group" bar chart: 18–30 7.5%, 31–40 12.1%, 41–50 34.0%,
  51–60 56.2%, 60+ 24.8%. Annotate the peak.
- "Churn rate by number of products": 1 → 27.7%, 2 → 7.6%, 3 → 82.7%, 4 → 100%.
  Add a caption that 3–4 products is a small group (326 customers).
- Two small comparison cards: Gender (Female 25.1% vs Male 16.5%) and
  Activity (Inactive 26.9% vs Active 14.3%).
- "Key takeaways" card with 4 bullet insights written for a business reader.
- Correlation-with-churn card: small horizontal bars. Age +0.29, Balance +0.12,
  Active member −0.16, Products −0.05, Credit score −0.03.
- Filter chips at the top (Country, Gender) that would filter all charts.

GENERAL
- Every chart needs a title, a one-line subtitle explaining what it shows, axis
  labels, and hover tooltips.
- Percentages to 1 decimal place; currency in €, with thousands separators.
- Accessible: WCAG AA contrast, visible focus rings. Risk must never be shown by
  colour alone; always add a text label.
- Keep the copy short and in plain English. No lorem ipsum. Use the real numbers above.
```

---

## Part 2 — Screen-by-screen prompts

### Shared context (paste this first)

```
App: "ChurnLens", a bank customer churn prediction dashboard for retention analysts.
It runs on a Gradient Boosting ML model trained on 10,000 bank customers.
Style: modern fintech SaaS (like Stripe Dashboard / Linear / Mercury). Clean, minimal,
Inter font, slate neutrals, indigo #4F46E5 accent, rounded-xl cards with a 1px border
and a soft shadow, 8px grid.
Risk colours: Low = emerald #10B981, Medium = amber #F59E0B, High = rose #E11D48,
always paired with a text label.
Layout: collapsible left sidebar (logo "ChurnLens"; nav: Predict, Batch Scoring,
Model Performance, Data Insights; footer chip "Model: Gradient Boosting · v1";
light/dark toggle). Top bar with page title + subtitle. Desktop 1440px.
Buildable with React + Tailwind + Recharts. Use real data, no lorem ipsum.
```

### Screen 1 — Predict

```
Design the "Predict" screen. Two columns.
Left: "Customer profile" form card with: Credit score slider (350–850, default 650),
Country segmented control (France/Germany/Spain), Gender segmented control,
Age slider (18–92), Tenure slider (0–10 yrs), Balance € input, Number of products
stepper (1–4), Has credit card toggle, Active member toggle, Estimated salary € input.
Buttons: "Predict churn" (primary), "Reset", and the link "Load example: high-risk customer".
Right: a result panel with a large semicircle gauge "72% churn probability" and the
badge "High risk"; a one-line summary; a "Why this prediction" diverging bar chart of
the top 5 factors (Age 52 +18%, 3 products +12%, Germany +9%, Inactive +8%,
Has credit card −1%; red = raises risk, green = lowers it); and a "Suggested retention
actions" checklist with 3 items. Also show the empty state and the loading skeleton,
plus a 390px mobile version with a bottom tab bar.
```

### Screen 2 — Batch Scoring

```
Design the "Batch Scoring" screen. A large drag-and-drop CSV dropzone with the
required-columns helper text and a "Download sample CSV" link. Below it, the
after-upload state: a KPI row (Customers scored 1,250 · High risk 214 (17%) ·
Medium risk 301 (24%) · Avg churn probability 21.3%), then a data table
(Customer ID, Surname, Country, Age, Balance, Products, Active, Churn probability with an
inline bar, Risk badge) sorted highest risk first, with search, a risk filter,
pagination and a "Download results CSV" button. Also show the error state
"Missing column: Geography".
```

### Screen 3 — Model Performance

```
Design the "Model Performance" screen. An info callout at the top explaining that
accuracy is misleading because 80% of customers stay, so recall matters. A KPI row for the
deployed Gradient Boosting model: Accuracy 86.8%, Recall 48.9%, Precision 75.0%,
ROC-AUC 0.87. A comparison table (deployed row highlighted with a "Deployed" tag):
Baseline 80.3/0.0/0.0, Logistic Regression 81.1/20.1/55.2, KNN 83.0/37.2/61.1,
Random Forest 85.4/31.0/85.3, SVM 85.6/38.2/76.9, Decision Tree 85.8/39.7/76.5,
Gradient Boosting 86.8/48.9/75.0 (accuracy/recall/precision %). A grouped bar chart of
accuracy vs recall per model. A 2x2 confusion matrix heatmap (stayed: 1,543 predicted
stay / 64 predicted leave; left: 201 predicted stay / 192 predicted leave). A horizontal
feature-importance bar chart (Age 38.3%, Products 30.5%, Active member 12.0%,
Balance 8.6%, Germany 4.7%, Salary 2.1%, Credit score 2.0%, Gender 1.4%, Tenure 0.4%,
Has card 0.1%).
```

### Screen 4 — Data Insights

```
Design the "Data Insights" screen. Filter chips at the top (Country, Gender). A KPI row:
10,000 customers · 20.4% churn rate · 2,037 churned · 7,963 retained. A donut chart for
stayed vs left. Bar charts: churn by country (France 16.2%, Germany 32.4% highlighted with
the note "2× the others", Spain 16.7%); churn by age group (18–30 7.5%, 31–40 12.1%,
41–50 34.0%, 51–60 56.2% peak, 60+ 24.8%); churn by number of products (1: 27.7%,
2: 7.6%, 3: 82.7%, 4: 100%, with a small-sample caption). Two comparison cards:
Female 25.1% vs Male 16.5%, Inactive 26.9% vs Active 14.3%. A correlation-with-churn
mini bar chart (Age +0.29, Balance +0.12, Active −0.16, Products −0.05,
Credit score −0.03). A "Key takeaways" card with 4 plain-English bullets.
```

---

## Notes for implementation

- The figures under "Why this prediction" and Batch Scoring are **placeholders for the
  mockup**. The real values will come from the FastAPI backend.
- All other numbers are real: the churn breakdowns come from `Churn_Modelling.csv`, and
  the model metrics, confusion matrix and feature importance come from Gradient Boosting
  (100 trees) on an 80/20 split with `random_state=42`.
- Once the design is generated, export it (HTML/Tailwind or screenshots) into
  `docs/design/`. The React frontend will be built to match it.
