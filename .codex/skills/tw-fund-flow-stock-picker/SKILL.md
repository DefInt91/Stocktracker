---
name: tw-fund-flow-stock-picker
description: Analyze Taiwan stock market fund flow and build a stock-picking view from same-day sector movement, industry seasonality, financial quality, news catalysts, supply-chain position, sector leaders, U.S. stock linkages, margin power, bargaining power, and turnover versus market capitalization. Use when the user asks for 台股資金流向, 當日強勢產業, 產業鏈選股, 類股資金輪動, 產業一哥, or Taiwan stock sector fund-flow analysis.
---

# Taiwan Fund Flow Stock Picker

## Objective

Produce a professional analyst-style Taiwan equity screen that starts from current fund flow, then connects sector movement to industry fundamentals, supply-chain economics, representative leaders, and investable selection logic.

Treat the user's core heuristic as mandatory:

- Prefer sectors with favorable seasonality, improving or resilient financials, clear business models, and strong trend visibility.
- Read current financial news to understand what the companies actually do and why capital is moving.
- Prefer the industry leader first, then compare challengers only when they have a clear margin, capacity, or product-cycle advantage.

## Data Discipline

Always confirm the analysis date first.

- If the user says "today" or "當日", use the user's local date and state the exact date.
- If same-day TWSE data is not available yet, use the latest available trading day and explicitly say so.
- Browse or fetch current data when analyzing modern market flow, stock prices, market cap, financials, news, regulation, or company status.
- Prefer primary or high-quality sources: TWSE, TPEx, MOPS, company IR, financial statements, and reputable financial news.
- State the calculation basis for fund flow. If true net inflow by sector is unavailable, use a transparent proxy such as sector trading value, sector return, institutional net buy, or trading value divided by market capitalization.

## Core Workflow

1. Define market context:
   - Date, index performance, total market turnover, major macro/news catalyst.
   - Note whether the market is in risk-on, defensive, rebound, or rotation mode.

2. Identify fund-flow sectors:
   - Rank sectors by positive sector return plus trading value.
   - When available, add foreign investors, investment trust, and dealer net buy data.
   - Calculate "fund flow as share of market cap" as:
     `sector trading value / aggregate sector market capitalization`.
   - Label this as turnover intensity unless actual net inflow data is available.

3. Break each selected sector into the value chain:
   - Upstream: raw materials, IP, design, EDA, key components, or scarce inputs.
   - Midstream: manufacturing, foundry, assembly, testing, OEM/ODM, modules, components.
   - Downstream: brand, channel, cloud service, system integration, end customer, or service.

4. List leaders:
   - Provide 5 representative leading companies for each value-chain segment.
   - Include stock code for Taiwan-listed companies.
   - If a U.S. stock is central to demand or valuation, include ticker and explain the Taiwan linkage.
   - Prefer true industry leaders by market cap, technology, capacity, order visibility, margin quality, or customer share.

5. Explain profit drivers:
   - Identify the current trend: AI, CoWoS, HBM, CCL, PCB, power, cooling, cloud capex, EV, finance spread, freight rate, tourism, etc.
   - Explain seasonality and why the next quarter or half-year matters.
   - Explain whether earnings growth comes from volume, price increases, mix upgrade, utilization, exchange rate, cost decline, or operating leverage.

6. Identify the highest-quality chain segment:
   - Explicitly state which segment has the highest gross margin or bargaining power.
   - Justify with scarcity, technology threshold, customer concentration, supply shortage, switching cost, capex barrier, or pricing power.
   - Separate "high margin" from "high order visibility"; ODM assemblers may have visibility but lower margins.

7. Convert to stock-picking view:
   - Start with the sector leader.
   - Add 1-3 second-line candidates only if they have a specific catalyst.
   - Flag watchlist names versus aggressive trading names.
   - Include risks: valuation, crowding, export controls, customer concentration, inventory cycle, FX, rates, or commodity prices.

## Required Output Format

Use Traditional Chinese unless the user asks otherwise.

Include these sections:

1. 資料基準
   - Exact trading date.
   - Sources and whether same-day data was available.
   - Fund-flow calculation basis.

2. 當日資金主流
   - Table with sector, return, trading value, market cap, and fund flow / market cap.

3. 產業鏈拆解
   - For each sector, provide upstream, midstream, downstream.
   - Each segment must list 5 representative companies with stock codes or tickers.
   - Add U.S. stock linkage when relevant.

4. 毛利率與議價能力
   - State the highest-margin or strongest-bargaining segment.
   - Explain why that segment currently captures the profit pool.

5. 選股結論
   - Name the preferred industry leader first.
   - Give the reason to own or watch it.
   - Mention 2-5 alternatives if justified by catalysts.

6. 風險與限制
   - State data limitations and investment risks.
   - Do not present the output as guaranteed investment advice.

## Dashboard JSON Output

When the user asks to produce JSON for the local fund-flow dashboard, output a strict JSON object that can be imported by `tw_stock_tree_v8.html`.

The JSON object must use these fields:

```json
{
  "date": "YYYY-MM-DD",
  "market": "strong-up",
  "risk": "系統性風險摘要",
  "foreign": 381.28,
  "industries": ["產業/主題"],
  "catalysts": ["對應 industries 的催化因素"],
  "moats": ["上游"],
  "shortPlan": "短線觀察與操作計畫",
  "midPlan": "中線追蹤指標",
  "risksDetail": "限制與風險細節",
  "potentials": [
    {
      "name": "公司名稱",
      "code": "1234.TW",
      "qualA": true,
      "qualB": "落後或整理描述",
      "qualC": true,
      "condA": "技術面條件",
      "condB": "基本面或籌碼條件",
      "condC": "產業鏈位置",
      "logic": "選股邏輯",
      "trigger": "觸發條件",
      "stop": "停損或假設失效條件",
      "score": 3
    }
  ]
}
```

Rules for dashboard JSON:

- Use `market` values only from: `strong-up`, `up`, `flat`, `down`, `strong-down`.
- `industries`, `catalysts`, and `moats` must have matching order. If a catalyst or moat is unknown, write a conservative description instead of leaving the array shorter.
- `moats` values should be `上游`, `中游`, or `下游`.
- `foreign` should be a number in TWD hundred-million units when available. Use `null` only when not verified.
- Stock codes in `potentials` should use `.TW` or `.TWO` suffix when the market is known.
- Keep JSON valid: no Markdown fences inside the JSON file, no comments, no trailing commas.
- If same-day data is unavailable, set `date` to the latest verified trading day and state the limitation in `risksDetail`.
- Prefer 1-3 `potentials`; include a name only when it has a specific catalyst and a clear supply-chain role.
- The JSON is research input for the dashboard, not investment advice.

## Quality Bar

- Be specific. Avoid saying only "AI is strong"; name the bottleneck and the companies tied to it.
- Do not overfit to one-day price moves. Tie fund flow to trend, earnings, and supply-chain economics.
- Distinguish market heat from business quality.
- When numbers are estimates, label them as estimates.
- If data cannot be verified, say so and provide a safer proxy.
- Avoid recommending a company solely because it rose sharply.

## Example User Requests

- "列出台股今天資金流進的產業，並拆上中下游龍頭。"
- "用資金流向幫我選出台股 AI 供應鏈的一哥。"
- "今天電子零組件為什麼強？毛利率最高的是哪一段？"
- "整理半導體、PCB、伺服器的資金佔市值與美股連動。"
