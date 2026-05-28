import { useState, useEffect, useRef } from "react";

const KEY = "tw_fund_flow_entries";
const MARKET_LABEL = {"strong-up":"強漲",up:"上漲",flat:"平盤",down:"下跌","strong-down":"重跌"};
const MARKET_PILL  = {"strong-up":"bg-green-100 text-green-700",up:"bg-green-100 text-green-700",flat:"bg-blue-100 text-blue-700",down:"bg-red-100 text-red-700","strong-down":"bg-red-100 text-red-700"};
const MOAT_COLOR   = {上游:"#F59E0B",中游:"#3B82F6",下游:"#10B981"};
const BAR_COLORS   = ["#7C3AED","#1D4ED8","#15803D","#B45309","#9F1239"];

function fmtDate(d){const p=d.split("-");return p[1]+"/"+p[2];}

// ── 格式說明（點「查看格式」時顯示）──────────────────────────────
const FORMAT_SPEC = `{
  "date": "2026-04-23",
  "market": "strong-up",
  "risk": "美伊談判破局，午後賣壓湧現",
  "foreign": 180,
  "industries": ["先進製程/台積電","觀光旅遊","IC設計/信驊","光通訊/CPO"],
  "catalysts":  ["TSMC技術論壇ADR+5.26%","陸客自由行解禁近10檔漲停","信驊天價帶飛47千金股","Google Cloud Next Day2"],
  "moats":      ["上游","下游","上游","上游"],
  "shortPlan":  "台積電守2050元支撐；觀光股留意陸客政策落地細節；信驊高檔震盪需量縮確認。",
  "midPlan":    "TSMC N2量產進度；陸客入台實際人數；信驊BMC滲透率30%→40%確認。",
  "risksDetail":"美伊和談時程不確定；高位震幅近1500點，籌碼墊高。",
  "potentials": [
    {
      "name": "公司名稱",
      "code": "1234.TW",
      "qualA": true,
      "qualB": "落後約25%",
      "qualC": true,
      "condA": "距高點22%，量縮3週，均線走平",
      "condB": "月營收年增68%（2026/03），P/E低於同業均值",
      "condC": "上游光元件，客戶集中度高，毛利連2季升",
      "logic": "同產業鏈龍頭飆漲但本標的因法說前出貨整理，基本面未變",
      "trigger": "量增突破前高+月營收再創高",
      "stop": "跌破20MA代表整理假設不成立",
      "score": 3
    }
  ]
}`;

export default function Dashboard() {
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [curDate,  setCurDate]  = useState(null);
  const [view,     setView]     = useState("main");   // main | import | history | format
  const [tab,      setTab]      = useState("overview");
  const [msg,      setMsg]      = useState(null);
  const [importTxt,setImportTxt]= useState("");
  const [importErr,setImportErr]= useState("");
  const fileRef = useRef();

  useEffect(()=>{
    (async()=>{
      try{
        const r=await window.storage.get(KEY);
        const d=r?JSON.parse(r.value):[];
        d.sort((a,b)=>b.date.localeCompare(a.date));
        setEntries(d);
        if(d.length) setCurDate(d[0].date);
      }catch{ setEntries([]); }
      setLoading(false);
    })();
  },[]);

  function showMsg(t,type="ok"){setMsg({t,type});setTimeout(()=>setMsg(null),3500);}

  async function persist(ne){
    await window.storage.set(KEY,JSON.stringify(ne));
    setEntries(ne);
  }

  // ── 匯入核心 ───────────────────────────────────────────────────
  function parseImport(raw){
    let obj;
    try{ obj=JSON.parse(raw.trim()); }
    catch(e){ throw new Error("JSON 格式錯誤："+e.message); }
    if(!obj.date)      throw new Error("缺少 date 欄位");
    if(!obj.industries||!obj.industries.length) throw new Error("缺少 industries 欄位");
    // 補齊可選欄位
    return {
      date:        obj.date,
      market:      obj.market      || "up",
      risk:        obj.risk        || "",
      foreign:     obj.foreign     ?? "",
      industries:  obj.industries,
      catalysts:   obj.catalysts   || [],
      moats:       obj.moats       || [],
      shortPlan:   obj.shortPlan   || "",
      midPlan:     obj.midPlan     || "",
      risksDetail: obj.risksDetail || "",
      potentials:  obj.potentials  || [],
      savedAt:     new Date().toISOString(),
    };
  }

  async function doImport(){
    setImportErr("");
    let entry;
    try{ entry=parseImport(importTxt); }
    catch(e){ setImportErr(e.message); return; }
    const ne=[...entries.filter(e=>e.date!==entry.date),entry]
              .sort((a,b)=>b.date.localeCompare(a.date));
    try{
      await persist(ne);
      setCurDate(entry.date);
      showMsg("✓ 已匯入「"+entry.date+"」的分析");
      setImportTxt(""); setImportErr("");
      setView("main");
    }catch(e){ setImportErr("儲存失敗："+e.message); }
  }

  function handleFile(e){
    const f=e.target.files[0];
    if(!f) return;
    const reader=new FileReader();
    reader.onload=ev=>setImportTxt(ev.target.result);
    reader.readAsText(f);
  }

  async function deleteEntry(date){
    if(!confirm("確定刪除「"+date+"」？")) return;
    const ne=entries.filter(e=>e.date!==date);
    await persist(ne);
    if(curDate===date) setCurDate(ne.length?ne[0].date:null);
    showMsg("已刪除 "+date);
  }

  const entry=entries.find(e=>e.date===curDate);

  // ── 子視圖：產業概況 ────────────────────────────────────────────
  function Overview({e}){
    return(
      <div>
        {e.risk&&<div className="border border-red-200 rounded-xl p-3 mb-3 bg-red-50">
          <p className="text-xs font-medium text-red-600 mb-1">今日系統性風險</p>
          <p className="text-xs text-gray-600">{e.risk}</p>
        </div>}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">資金流入產業</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {e.industries.map((ind,i)=>{
            const moat=e.moats[i]||"–"; const cat=e.catalysts[i]||"–";
            const color=BAR_COLORS[i%BAR_COLORS.length]; const pct=Math.max(15,55-i*10);
            const mc=moat==="上游"?"bg-yellow-100 text-yellow-700":moat==="中游"?"bg-blue-100 text-blue-700":"bg-green-100 text-green-700";
            return(
              <div key={i} className="border rounded-xl p-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="text-sm font-medium">{ind}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i===0?"bg-green-100 text-green-700":"bg-blue-100 text-blue-700"}`}>{i===0?"主力":"次要"}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mc}`}>{moat}議價</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">📌 {cat}</p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{width:pct+"%",background:color}}/>
                </div>
              </div>
            );
          })}
        </div>
        {e.risksDetail&&<div className="border border-red-200 rounded-xl p-3 mb-3 bg-red-50">
          <p className="text-xs font-medium text-red-600 mb-1">個別風險</p>
          <p className="text-xs text-gray-600">{e.risksDetail}</p>
        </div>}
        <p className="text-xs text-gray-400 border rounded-lg p-2">⚠ 資金佔比為估算方向，非交易所官方數據。僅供研究參考，不構成投資建議。</p>
      </div>
    );
  }

  // ── 子視圖：投資計畫 ────────────────────────────────────────────
  function Plan({e}){
    return(
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">短線（1-4 週）</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{e.shortPlan||"尚未填入"}</p>
        </div>
        <div className="border rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">中線觀察指標（1-3 月）</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{e.midPlan||"尚未填入"}</p>
        </div>
      </div>
    );
  }

  // ── 子視圖：潛力標的 ────────────────────────────────────────────
  function Potentials({e}){
    const pots=e.potentials||[];
    if(!pots.length) return(
      <div className="text-center py-12">
        <p className="text-3xl mb-2">🔍</p>
        <p className="text-sm font-medium text-gray-700 mb-1">今日無符合資格的潛力標的</p>
        <p className="text-xs text-gray-400">或分析時未篩出。</p>
      </div>
    );
    return(
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">同類股整理中的大行情潛力標的</p>
        {pots.map((p,i)=>{
          const score=p.score||0;
          const theme=score>=3?"border-green-200 bg-green-50":score===2?"border-blue-200 bg-blue-50":"border-yellow-200 bg-yellow-50";
          const scoreColor=score>=3?"text-green-600":score===2?"text-blue-600":"text-yellow-600";
          return(
            <div key={i} className={`border rounded-xl p-4 mb-3 ${theme}`}>
              <div className="flex justify-between items-start mb-2">
                <div><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-gray-400">{p.code}</p></div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
                  <span className="text-gray-400 text-sm">/3</span>
                  <p className="text-xs text-gray-400">條件符合</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.qualA&&<span className="text-xs bg-white border rounded-full px-2 py-0.5">同類股 ✓</span>}
                {p.qualB&&<span className="text-xs bg-white border rounded-full px-2 py-0.5">落後 {p.qualB} ✓</span>}
                {p.qualC&&<span className="text-xs bg-white border rounded-full px-2 py-0.5">基本面支撐 ✓</span>}
              </div>
              <div className="space-y-2 mb-3">
                {p.condA&&<div className="flex gap-2 items-start"><span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium shrink-0">A技術</span><p className="text-xs text-gray-600 leading-relaxed">{p.condA}</p></div>}
                {p.condB&&<div className="flex gap-2 items-start"><span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium shrink-0">B基本</span><p className="text-xs text-gray-600 leading-relaxed">{p.condB}</p></div>}
                {p.condC&&<div className="flex gap-2 items-start"><span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium shrink-0">C產業</span><p className="text-xs text-gray-600 leading-relaxed">{p.condC}</p></div>}
              </div>
              <div className="border-t pt-2 space-y-1">
                {p.logic&&<p className="text-xs text-gray-700"><span className="font-medium">💡 </span>{p.logic}</p>}
                {p.trigger&&<p className="text-xs text-gray-600"><span className="font-medium">🚀 觸發：</span>{p.trigger}</p>}
                {p.stop&&<p className="text-xs text-red-500"><span className="font-medium">🛑 止損：</span>{p.stop}</p>}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-gray-400 border rounded-lg p-2">⚠ 以上為研究參考，非投資建議。</p>
      </div>
    );
  }

  // ── 子視圖：輪動趨勢 ────────────────────────────────────────────
  function Trend(){
    if(entries.length<2) return <div className="text-center text-sm text-gray-400 py-10">累積 2 筆以上後顯示輪動趨勢</div>;
    const freq={},moatFreq={};
    entries.forEach(e=>{
      e.industries.forEach((ind,i)=>{
        freq[ind]=(freq[ind]||0)+1;
        const m=e.moats[i]; if(m) moatFreq[m]=(moatFreq[m]||0)+1;
      });
    });
    return(
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">近 {entries.length} 個交易日產業頻率</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([ind,cnt])=>(
            <div key={ind} className="border rounded-xl p-2 text-center">
              <div className="text-xl font-semibold">{cnt}</div>
              <div className="text-xs text-gray-500 mt-1">{ind}</div>
            </div>
          ))}
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">議價力最強段分布</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(moatFreq).sort((a,b)=>b[1]-a[1]).map(([m,c])=>(
            <div key={m} className="border rounded-xl p-2 text-center">
              <div className="text-xl font-semibold" style={{color:MOAT_COLOR[m]}}>{c}</div>
              <div className="text-xs text-gray-500 mt-1">{m}主導</div>
            </div>
          ))}
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">資金輪動時序</p>
        {[...entries].reverse().map(e=>(
          <div key={e.date} className="flex gap-2 mb-2 text-xs">
            <span className="text-gray-400 whitespace-nowrap w-10 shrink-0">{fmtDate(e.date)}</span>
            <span className="text-gray-300">→</span>
            <span className="text-gray-700">{e.industries.join(" ／ ")}</span>
          </div>
        ))}
      </div>
    );
  }

  const TABS=[
    {key:"overview", label:"產業概況"},
    {key:"plan",     label:"投資計畫"},
    {key:"potentials",label:"潛力標的"},
    {key:"trend",    label:"輪動趨勢"},
  ];

  // ── 匯入視圖 ───────────────────────────────────────────────────
  function ImportView(){
    return(
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">匯入分析 JSON</p>
          <button onClick={()=>setView("format")} className="text-xs text-blue-500 underline">查看格式說明</button>
        </div>
        <p className="text-xs text-gray-500 mb-3">將 Claude 輸出的分析 JSON 貼入下方，或上傳 .json 檔案，一鍵存入看板。</p>

        {/* 貼上區 */}
        <textarea
          value={importTxt}
          onChange={e=>{ setImportTxt(e.target.value); setImportErr(""); }}
          rows={10}
          className="text-xs w-full border rounded-xl px-3 py-2 resize-none font-mono mb-2"
          placeholder={'貼上 JSON，例如：\n{\n  "date": "2026-04-23",\n  "market": "strong-up",\n  ...\n}'}
        />

        {importErr&&<p className="text-xs text-red-500 mb-2">❌ {importErr}</p>}

        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={doImport} disabled={!importTxt.trim()}
            className="text-xs px-4 py-1.5 bg-gray-900 text-white rounded-lg disabled:opacity-40">
            匯入
          </button>
          <label className="text-xs px-4 py-1.5 border rounded-lg cursor-pointer hover:bg-gray-50">
            上傳 .json 檔
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile}/>
          </label>
          <button onClick={()=>{ setImportTxt(""); setImportErr(""); setView("main"); }}
            className="text-xs px-4 py-1.5 border rounded-lg">
            取消
          </button>
        </div>
      </div>
    );
  }

  // ── 格式說明視圖 ───────────────────────────────────────────────
  function FormatView(){
    return(
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">JSON 格式說明</p>
          <button onClick={()=>setView("import")} className="text-xs text-blue-500 underline">← 返回匯入</button>
        </div>
        <p className="text-xs text-gray-500 mb-3">每次分析結束，Claude 會直接輸出以下格式。market 值：<code className="bg-gray-100 px-1 rounded">strong-up / up / flat / down / strong-down</code></p>
        <pre className="text-xs bg-gray-50 border rounded-xl p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">{FORMAT_SPEC}</pre>
        <div className="mt-3 space-y-1">
          {[
            ["date","YYYY-MM-DD"],
            ["market","strong-up / up / flat / down / strong-down"],
            ["foreign","買超為正數，賣超為負數，不確定填 null"],
            ["industries","陣列，依資金強度排序"],
            ["catalysts / moats","對應 industries 的陣列，順序須一致"],
            ["potentials","陣列，最多 3 檔；無符合標的填 []"],
            ["score","1-3，符合幾個條件填幾"],
          ].map(([k,v])=>(
            <div key={k} className="flex gap-2 text-xs">
              <span className="font-mono text-purple-600 shrink-0 w-28">{k}</span>
              <span className="text-gray-500">{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 主體 ───────────────────────────────────────────────────────
  return(
    <div className="p-4 max-w-2xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b">
        <span className="text-base font-semibold">📊 台股資金流向看板</span>
        <div className="flex items-center gap-2 flex-wrap">
          {entries.length>0&&<span className="text-xs text-gray-400">{entries.length} 筆紀錄</span>}
          <button onClick={()=>{ setImportTxt(""); setImportErr(""); setView("import"); }}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg">
            ⬆ 匯入分析
          </button>
          <button onClick={()=>setView("history")} className="text-xs px-3 py-1.5 border rounded-lg">歷史紀錄</button>
        </div>
      </div>

      {msg&&<div className={`text-xs p-2 rounded-lg mb-3 ${msg.type==="ok"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{msg.t}</div>}

      {view==="import"  && <ImportView/>}
      {view==="format"  && <FormatView/>}

      {view==="history" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">歷史紀錄</p>
            <span className="text-xs text-gray-400">共 {entries.length} 筆</span>
          </div>
          {!entries.length?<p className="text-xs text-gray-400 text-center py-8">尚無紀錄</p>
            :entries.map(e=>(
            <div key={e.date} className="flex justify-between items-center border rounded-xl p-3 mb-2">
              <div>
                <p className="text-sm font-medium">
                  {e.date}
                  <span className={`text-xs ml-1 px-2 py-0.5 rounded-full ${MARKET_PILL[e.market]||"bg-blue-100 text-blue-700"}`}>{MARKET_LABEL[e.market]}</span>
                  {(e.potentials||[]).length>0&&<span className="text-xs ml-1 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">🔍 {e.potentials.length}</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{e.industries.join("、")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{ setCurDate(e.date); setView("main"); }} className="text-xs px-3 py-1 border rounded-lg">查看</button>
                <button onClick={()=>deleteEntry(e.date)} className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg">刪除</button>
              </div>
            </div>
          ))}
          <button onClick={()=>setView("main")} className="text-xs px-3 py-1.5 border rounded-lg mt-2">← 返回</button>
        </div>
      )}

      {view==="main" && (
        loading ? <div className="text-center text-sm text-gray-400 py-16">載入中…</div>
        : !entries.length ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-medium mb-1">尚無任何分析紀錄</p>
            <p className="text-sm text-gray-400 mb-4">執行資金流向分析後，點擊右上角「⬆ 匯入分析」</p>
            <button onClick={()=>setView("import")} className="text-xs px-4 py-2 bg-gray-900 text-white rounded-lg">現在匯入 ↗</button>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">選擇日期</p>
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b">
              {entries.map(e=>(
                <button key={e.date} onClick={()=>setCurDate(e.date)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${e.date===curDate?"bg-gray-900 text-white border-transparent":"text-gray-500 hover:bg-gray-50"}`}>
                  {fmtDate(e.date)}{(e.potentials||[]).length>0&&" 🔍"}
                </button>
              ))}
            </div>
            {entry&&<>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">大盤方向</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MARKET_PILL[entry.market]||"bg-blue-100 text-blue-700"}`}>{MARKET_LABEL[entry.market]}</span>
                  <p className="text-xs text-gray-400 mt-1">{entry.date}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">外資</p>
                  <p className="text-sm font-semibold">
                    {entry.foreign!=null&&entry.foreign!==""
                      ?(parseFloat(entry.foreign)>0?"買超 "+Math.abs(entry.foreign)+"億":"賣超 "+Math.abs(entry.foreign)+"億")
                      :"待確認"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">潛力標的</p>
                  <p className="text-2xl font-semibold text-purple-600">{(entry.potentials||[]).length}</p>
                  <p className="text-xs text-gray-400">今日篩出</p>
                </div>
              </div>
              <div className="flex border-b mb-4 overflow-x-auto">
                {TABS.map(t=>(
                  <button key={t.key} onClick={()=>setTab(t.key)}
                    className={`text-xs px-4 py-2 border-b-2 transition-colors whitespace-nowrap
                      ${tab===t.key?"border-gray-900 text-gray-900 font-medium":"border-transparent text-gray-400"}`}>
                    {t.label}
                    {t.key==="potentials"&&(entry.potentials||[]).length>0&&
                      <span className="ml-1 bg-purple-100 text-purple-600 rounded-full px-1.5 text-xs">{entry.potentials.length}</span>}
                  </button>
                ))}
              </div>
              {tab==="overview"   && <Overview   e={entry}/>}
              {tab==="plan"       && <Plan       e={entry}/>}
              {tab==="potentials" && <Potentials e={entry}/>}
              {tab==="trend"      && <Trend/>}
            </>}
          </div>
        )
      )}
    </div>
  );
}
