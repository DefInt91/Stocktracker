---
name: tw-fund-flow-stock-picker
description: 台股當日資金流向產業分析技能。每當用戶說「資金流向」、「今日台股」、「產業輪動」、「法人買超」、「哪個產業在漲」、「投資計畫」、「台股分析」、台股資金流向、當日強勢產業、產業鏈選股、類股資金輪動、產業一哥，或只說「分析一下」但有台股相關背景脈絡時，必須觸發此技能。執行完整的當日資金流向分析，包含產業上中下游結構、代表公司（含股票代碼）、毛利率與議價能力比較、短中線投資計畫，以及可匯入本地看板的 JSON。
---

# 台股資金流向分析 Skill

## Objective

Produce a professional analyst-style Taiwan equity screen that starts from current fund flow, then connects sector movement to industry fundamentals, supply-chain economics, representative leaders, gross margin, bargaining power, and investable selection logic.

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
- If a number cannot be verified, mark it as `待確認`; do not fill an estimate as fact.
- Every target price must state its source, such as the broker or foreign research house.
- Every estimated fund-flow share must explicitly state: `佔比為估算方向，非交易所官方數據`.
- U.S. stock linkages must explain the Taiwan-stock linkage, such as foundry customer, material supplier, AI server buyer, or cloud capex beneficiary.
- End every analysis with: `本分析僅供研究參考，不構成投資建議，投資人需自行評估風險`.

## 執行前必做：資料蒐集（每次都要跑）

Before outputting any analysis, browse or fetch current data. Do not rely on training-data memory for current market facts.

Run these searches in order:

1. `台股 資金流向 產業 [今日日期]`
2. `三大法人 買超 今日 [今日日期]`
3. `[強勢產業關鍵字] 漲停 今日`
   - Choose the industry keyword dynamically from the first search results.
4. Latest foreign or institutional reports:
   - broker target price changes
   - rating changes
   - sector notes

If same-day data is unavailable because the market has not closed, it is a holiday, or official data is incomplete, say: `今日資料不足，改以最近一個交易日（YYYY-MM-DD）資料進行分析`.

If multiple sources conflict, list the conflict, mark the number as `資料待確認`, and use the most reliable source with explanation.

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

Use this fixed structure:

### 一、當日盤勢背景（3句以內）

- 大盤方向 + 成交量.
- 今日最大系統性風險, such as geopolitical risk, FX, rates, oil, or macro data.
- 外資方向, including buy/sell amount if verified; otherwise write `待確認`.

### 二、資金流入產業地圖

List 3-4 same-day inflow sectors:

```text
產業名稱 ── 估算流入強度（高/中/低）
今日催化劑：[具體事件，如：法說/財報/外資報告/漲價消息]
```

Must include this sentence: `佔比為估算方向，非交易所官方數據`.

### 三、每個產業的上中下游分析

For every selected sector:

```text
#### 產業名稱

本輪議價力最強段：[上游/中游/下游]
理由：[一句話說明核心壁壘]
```

Then output this table:

| 層級 | 代表公司（代碼） | 毛利率區間 | 議價力 ★ |
|------|------------------|------------|----------|
| 上游（原料/IP/設計） | 公司A（XXXX.TW）<br>公司B（XXXX.TW）<br>公司C（XXXX.TW）<br>公司D（XXXX.TW）<br>公司E（XXXX.US 連動） | XX-XX% | ★★★★★ |
| 中游（製造/代工/零組件） | 同上格式 × 5 | XX-XX% | ★★★☆☆ |
| 下游（品牌/通路/服務） | 同上格式 × 5 | XX-XX% | ★★☆☆☆ |

Gross-margin rules:

- Prefer latest quarterly reported numbers, and state quarter/year.
- If no public number is available, write `業界估算 XX-XX%`.
- Never invent a precise margin number.

### 四、投資計畫建議

For each inflow sector:

```text
【產業名稱】

短線（1-4 週）
  催化劑：下一個可能推升股價的事件（ex: 法說/月營收公告日）
  關注標的：XX（代碼），留意價位區間 [根據新聞/法人報告，標明來源]
  操作邏輯：一句話

中線（1-3 月）
  延續動能觀察指標：（ex: 月營收年增率維持 XX% 以上 / 報價維持漲勢）
  風險情境：若 [具體事件]，資金將流出此產業

❌ 今日不適合追高理由：[若短線風險偏高，必須寫出]
```

If the user asks for `規劃投資計畫`, add:

```text
【資金輪動週期觀察】
目前在哪個產業：[強勢段]
下一個可能承接資金的產業：[根據當日盤面訊號]
歷史比對：此輪與 [時間] 的 [產業] 輪動有何相似之處
```

### 五、同類股整理中的大行情潛力標的

Select from the same supply chain as the inflow sectors, focusing on stocks in the same theme but not yet following the main move.

Entry qualification: all three must pass before scoring:

- Same supply-chain position or industry theme as the strong main theme; do not cross industries.
- Relative lag versus main leader > 15%.
- Fundamental support exists; exclude deteriorating fundamentals.

Lag calculation:

`落後幅度 = 龍頭股本波漲幅 - 潛力標的本波漲幅`

Start-date priority:

1. Industry launch date:
   - The first trading day when the sector clearly received fund flow.
   - Confirm through search, such as a conference, major news, or first major institutional buy day.
   - Use the same start date for leader and candidate.
2. Last 20 trading days:
   - Use this only when the industry launch date cannot be identified.
   - Label it as `近20日漲幅差`.

Hard rules:

- Start price and end price must be verified before calculating.
- If start price cannot be found, set `qualB` to `待確認`.
- Show the basis, such as `以4/14（產業啟動日）收盤價計算，落後幅度約X.X%`.

Scoring after qualification:

- 條件 A｜技術面整理完成:
  - Pullback 15-30% from recent high without breaking key support.
  - Volume contraction.
  - Moving averages flatten or a golden cross is forming.
- 條件 B｜基本面領先、股價尚未反映:
  - Last 3 months revenue YoY > 50%, or quarterly gross margin +3 percentage points QoQ.
  - P/E or P/B below peer average.
  - Fundamentals continue improving during consolidation.
- 條件 C｜產業鏈位置優先:
  - Located in the strongest bargaining-power segment.
  - High customer concentration, such as top 3 customers > 50% revenue, if verified.
  - Gross margin rising for at least 2 consecutive quarters, if verified.

Output format:

```text
【潛力標的】公司名稱（股票代碼）

入選資格：同類股 ✓／落後幅度 XX% ✓／基本面支撐 ✓
符合條件：A + B + C（3/3）｜A + B（2/3）｜C（1/3）

條件 A 技術面：[距高點 XX%，量縮/量平狀態，均線描述]
條件 B 基本面：[月營收年增率 / 毛利率數據，標明來源與期間]
條件 C 產業鏈：[供應鏈位置，議價能力說明，毛利率趨勢]

潛力邏輯：一句話說明為何此標的可能是下一根大棒
觸發條件：需要什麼事件或訊號，代表行情正式啟動
止損參考：若跌破 [價位/均線]，代表整理假設不成立
```

Hard limits:

- List at most 3 stocks.
- Do not include a stock that fails entry qualification, even if its technical setup looks good.
- Use `待確認` for unverified data; do not estimate.
- If no stock qualifies, output: `今日無符合資格的潛力標的`.

### 六、今日總風險提示

```text
系統性風險（影響全部產業）：
  - [事件1]：影響方向
  - [事件2]：影響方向

個別產業風險：
  - [產業A]：[具體風險]
  - [產業B]：[具體風險]
```

End this section with:

`本分析僅供研究參考，不構成投資建議，投資人需自行評估風險`.

### 七、📋 匯入 JSON（每次分析結尾必須輸出）

Every analysis must end with complete dashboard JSON.

Output exactly with this wrapper:

```text
───── 📋 匯入 JSON（複製後貼入看板）─────
{...valid JSON...}
─────────────────────────────────────────
```

## Dashboard JSON Output

Every analysis must output a strict JSON object that can be imported by `tw_stock_tree_v8.html`.

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
  - `strong-up`: index gain >= +2%.
  - `flat`: -0.5% to +0.5%.
  - `strong-down`: index loss <= -2%.
- `industries`, `catalysts`, and `moats` must have matching order. If a catalyst or moat is unknown, write a conservative description instead of leaving the array shorter.
- `moats` values should be `上游`, `中游`, or `下游`.
- `foreign` should be a number in TWD hundred-million units when available. Use `null` only when not verified.
- Stock codes in `potentials` should use `.TW` or `.TWO` suffix when the market is known.
- Keep JSON valid: no Markdown fences inside the JSON file, no comments, no trailing commas.
- If same-day data is unavailable, set `date` to the latest verified trading day and state the limitation in `risksDetail`.
- Prefer 1-3 `potentials`; include a name only when it has a specific catalyst and a clear supply-chain role.
- `potentials` must never be omitted. Use an empty array when no stock qualifies.
- If a `potentials` condition A/B/C is not met, use `null` for the corresponding `condA`, `condB`, or `condC`.
- Unverified numeric values must be `null` or `待確認` inside descriptive strings; do not fill estimates as fact.
- The JSON is research input for the dashboard, not investment advice.

## Local Dashboard File Workflow

When working inside this repository and the user wants the JSON imported by the dashboard automatically:

1. Create a dated fund-flow JSON file at the repository root:
   - File name format: `tw-fund-flow-YYYY-MM-DD.json`
   - Example: `tw-fund-flow-2026-05-27.json`

2. Update `tw-fund-flow-index.json` at the repository root:
   - Keep a top-level object with a `files` array.
   - Add the new file name to the array.
   - Put the newest file first.
   - Preserve older file names unless the user explicitly asks to remove them.

Example:

```json
{
  "files": [
    "tw-fund-flow-2026-05-27.json",
    "tw-fund-flow-2026-04-23.json"
  ]
}
```

3. Validate before finishing:
   - Parse the new JSON.
   - Parse `tw-fund-flow-index.json`.
   - Confirm the new file appears in `files`.
   - Confirm `industries`, `catalysts`, and `moats` arrays have matching lengths.

4. If the repository is connected to GitHub Pages:
   - Commit both the new `tw-fund-flow-YYYY-MM-DD.json` and the updated `tw-fund-flow-index.json`.
   - Push to GitHub.
   - The dashboard will load all files listed in `tw-fund-flow-index.json` from the deployed GitHub Pages path.

## Visual Output Rules

If the user environment supports widgets, render interactive cards:

- Tabs for each industry.
- Gross margin as horizontal bars.
- Company cards can expand into detailed analysis.
- Top area shows market background and system-risk pills.

If the environment is plain text, API, or CLI, use Markdown tables with the same structure.

## Special Cases

- If the user asks only `分析一下` but the thread has Taiwan-stock context, trigger this skill.
- If the user asks `規劃投資計畫`, include the additional `資金輪動週期觀察` block.
- If the day is a holiday or same-day data is unavailable, clearly say the latest trading date used and continue.
- If sources conflict, list the conflict, mark uncertain figures as `資料待確認`, and explain the most credible inference.

## Hard Failure Rules

The output is considered failed if any of these are violated:

1. Uncertain numbers are not marked `待確認`.
2. Target prices lack a broker or research-source label.
3. Estimated fund-flow shares omit `非交易所官方數據`.
4. U.S. stock linkages do not explain the Taiwan linkage.
5. The final disclaimer is missing.
6. The final dashboard JSON wrapper is missing.
7. `potentials` is omitted from JSON.

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
