import { useState, useEffect, useRef, useMemo } from "react";

/* ================= デモ版メモ =================
   このファイルはClaude APIを使わない静的デモ版です。
   YAMLを貼ると、画面演出とコピー用プロンプト生成だけを行います。
   APIキー不要で、GitHub Pages / Vercel / Netlify などに載せやすい構成です。
*/
/* 貼り付けテキストを「鑑定プロンプト」と「YAML」に分離する。
   - ```yaml フェンスがあれば中身をYAML、フェンス前をプロンプトとして扱う
   - フェンスが無ければ "version:" で始まる行以降をYAMLとして扱う
   - どちらも無ければ全体をYAMLとみなす */
function extractParts(text) {
  const fence = text.match(/```ya?ml\s*\n([\s\S]*?)```/);
  if (fence) {
    const prompt = text.slice(0, fence.index).replace(/以下がYAML[^\n]*\n?/g, "").trim();
    return { prompt, yaml: fence[1].trim() };
  }
  const m = text.match(/^version:/m);
  if (m && m.index > 0) {
    return { prompt: text.slice(0, m.index).trim(), yaml: text.slice(m.index).trim() };
  }
  return { prompt: "", yaml: text.trim() };
}

function getYamlSummary(yaml) {
  const lines = yaml.split("\n").map((line) => line.trim()).filter(Boolean);
  const versionLine = lines.find((line) => line.startsWith("version:"));
  const systemLine = lines.find((line) => line.includes("western") || line.includes("四柱") || line.includes("astrology"));
  const hasTransit = /transit|トランジット|long_term|31/i.test(yaml);
  const hasAsteroids = /asteroid|小惑星|chiron|lilith|キロン|リリス/i.test(yaml);

  return {
    version: versionLine ? versionLine.replace("version:", "").trim() : "",
    system: systemLine || "",
    hasTransit,
    hasAsteroids,
    lineCount: lines.length,
  };
}

function buildDemoReading(yaml) {
  const summary = getYamlSummary(yaml);
  const transitText = summary.hasTransit
    ? "トランジットの流れも含まれているから、今の空気やこれからの変化をAIに読ませる土台として使えるよ。"
    : "出生図を中心に、自分の基本構造をAIに読ませる土台として使えるよ。";
  const asteroidText = summary.hasAsteroids
    ? "小惑星やキロン、リリスのような細かい要素まで入っているなら、傷つきやすさや奥にあるテーマも扱いやすくなるね。"
    : "まずは主要天体とハウスだけでも、十分にその人らしさの骨組みは見えてくるよ。";

  return `いらっしゃい。星詠みの夜へ、ようこそ。

これはClaude APIを使わないデモ版だよ。ここでは鑑定文そのものをAI生成せず、貼り付けたホロスコープYAMLを「好きなAIへ渡すための巻物」として整える流れを体験できるよ。

読み込んだデータは${summary.lineCount}行くらいあるみたい。${transitText}

${asteroidText}

この画面だけで占いを完結させるより、計算済みデータをコピーしてChatGPT、Claude、Geminiに渡す形にすると、AIごとの読み味も比べられるよ。

次に進むと、分身AI用のプロンプトも作れるよ。`;
}

function buildPersonaBlueprint(yaml) {
  const summary = getYamlSummary(yaml);
  const dataNote = summary.hasTransit
    ? "出生図に加えてトランジットも参照し、現在の流れと長期テーマを分けて扱う。"
    : "出生図を中心に、思考・感情・行動の基本傾向を整理する。";

  return `# 分身AI 人格設計書

## 基本気質
貼り付けられたホロスコープYAMLを唯一の根拠として、ユーザーの思考・判断・言葉づかいを整理する。
生年月日から再計算せず、YAML内の天体・ハウス・アスペクト・補足データだけを読む。
${dataNote}

## 話し方・口調
やわらかく自然な話し言葉で返す。
AIらしい定型句や過剰な断定を避ける。
違和感・保留・仮説をそのまま扱い、無理に結論へ急がない。

## 価値観と判断の癖
感覚だけで決めず、観察・整理・検証を通して判断する。
ユーザーの「なんか違う」という反応を重要な入力として扱う。
占術データは決めつけではなく、自己理解や思考整理の補助線として使う。

## 強み
- 複雑な情報を構造化し、今扱うべき論点へ分解できる。
- 感情と事実を分けながら、どちらも軽視せずに扱える。
- 違和感を言語化し、次の行動に落とし込める。

## 危うさ・影
- 根拠確認を重視しすぎて、動き出すまでに時間がかかることがある。
- 情報量が多いほど、整理そのものが目的化しやすい。
- 自分の感覚を信じたい一方で、確証を求めすぎることがある。

## ふるまいの指示
- ホロスコープデータは再計算せず、貼り付けられたYAMLのみを根拠にする。
- 断定ではなく「傾向」「使い方」「可能性」として表現する。
- 根拠にした配置やデータ項目を、必要に応じて簡潔に示す。
- ユーザーの違和感を否定せず、言語化の材料として扱う。
- 最後は現実的な次の一歩に落とし込む。`;
}

/* ================= スタイル ================= */
const Style = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap');
    .vn-root {
      position: relative;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(180deg, #1b1535 0%, #2a2050 55%, #3a2a60 100%);
      font-family: 'Zen Maru Gothic', sans-serif;
      color: #f4ecdf;
      overflow: hidden;
      user-select: none;
    }
    @keyframes twinkle { 0%,100%{opacity:.25} 50%{opacity:.9} }
    .star { position:absolute; border-radius:50%; background:#fff; }
    @media (prefers-reduced-motion: no-preference) {
      .star { animation: twinkle var(--d) ease-in-out infinite; animation-delay: var(--dl); }
    }
    @keyframes orbGlow {
      0%,100%{ filter: drop-shadow(0 0 10px rgba(150,160,255,.7)); }
      50%{ filter: drop-shadow(0 0 26px rgba(170,180,255,1)); }
    }
    @media (prefers-reduced-motion: no-preference) {
      .crystal { animation: orbGlow 3s ease-in-out infinite; }
    }
    @keyframes flame { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.18) translateY(-1px)} }
    @media (prefers-reduced-motion: no-preference) {
      .flame { animation: flame 0.9s ease-in-out infinite; transform-origin: bottom center; }
    }
    @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    @media (prefers-reduced-motion: no-preference) {
      .nanami { animation: bob 3.4s ease-in-out infinite; }
    }
    .dialog {
      position: absolute; left: 4%; right: 4%; bottom: 3.5%;
      background: rgba(26, 18, 48, 0.92);
      border: 2px solid #d9b35e;
      border-radius: 18px;
      padding: 22px 22px 18px;
      min-height: 120px;
      box-shadow: 0 8px 30px rgba(0,0,0,.5);
      cursor: pointer;
    }
    .nametag {
      position: absolute; top: -22px; left: 18px;
      background: rgba(26, 18, 48, 0.97);
      border: 2px solid #d9b35e;
      border-radius: 12px 12px 0 0;
      padding: 5px 22px 4px;
      color: #e8c15e;
      font-weight: 700;
      letter-spacing: 0.25em;
      font-size: 14px;
    }
    .dialog-text { font-size: 16.5px; line-height: 2; white-space: pre-wrap; min-height: 66px; }
    @keyframes blinkv { 0%,100%{opacity:1} 50%{opacity:.2} }
    .advance { position:absolute; right:18px; bottom:10px; color:#e8c15e; animation: blinkv 1.2s infinite; font-size:14px; }
    .tap-hint { position:absolute; top:14px; right:18px; color:rgba(244,236,223,.55); font-size:13px; letter-spacing:.15em; }
    .vn-btn {
      font-family:'Zen Maru Gothic',sans-serif;
      background: linear-gradient(180deg,#e8c15e,#c79a3a);
      color:#241a3e; border:none; border-radius: 999px;
      padding: 11px 28px; font-size:15px; font-weight:700; letter-spacing:.12em;
      cursor:pointer;
    }
    .vn-btn:hover{ filter:brightness(1.08); }
    .vn-btn.ghost{ background:transparent; color:#e8c15e; border:2px solid #d9b35e; }
    .vn-btn:focus-visible{ outline:2px solid #fff; outline-offset:2px; }
    .yaml-area {
      width:100%; height:140px; box-sizing:border-box;
      background:#140e2c; color:#cfc6e8;
      border:1.5px solid #d9b35e; border-radius:10px;
      font-family: ui-monospace, monospace; font-size:11.5px; padding:10px;
      resize:vertical; user-select:text;
    }
    .yaml-area:focus{ outline:1.5px solid #e8c15e; }
    .copy-area {
      width:100%; height:180px; box-sizing:border-box;
      background:#140e2c; color:#cfc6e8;
      border:1.5px solid #d9b35e; border-radius:10px;
      font-family: ui-monospace, monospace; font-size:10.5px; padding:10px;
      user-select:text;
    }
  `}</style>
);

/* ================= 星空 ================= */
function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60,
        s: Math.random() * 2.4 + 0.8,
        d: (Math.random() * 3 + 2).toFixed(1) + "s",
        dl: (Math.random() * 4).toFixed(1) + "s",
      })),
    []
  );
  return (
    <>
      {stars.map((st) => (
        <div
          key={st.id}
          className="star"
          style={{ left: st.x + "%", top: st.y + "%", width: st.s, height: st.s, "--d": st.d, "--dl": st.dl }}
        />
      ))}
    </>
  );
}

/* ================= ナナミ（SVG） ================= */
function NanamiScene() {
  return (
    <svg className="nanami" viewBox="0 0 360 300" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "26%", width: "min(340px, 78vw)" }} aria-label="星詠みのナナミ">
      {/* テーブル */}
      <ellipse cx="180" cy="272" rx="170" ry="34" fill="#4a3a72" />
      <ellipse cx="180" cy="266" rx="170" ry="32" fill="#5a4886" />
      {/* ろうそく 左 */}
      <rect x="38" y="218" width="14" height="40" rx="5" fill="#f4ecdf" />
      <ellipse className="flame" cx="45" cy="210" rx="6" ry="11" fill="#ffb83d" />
      <ellipse className="flame" cx="45" cy="212" rx="3" ry="6" fill="#fff2c4" />
      {/* ろうそく 右 */}
      <rect x="306" y="218" width="14" height="40" rx="5" fill="#f4ecdf" />
      <ellipse className="flame" cx="313" cy="210" rx="6" ry="11" fill="#ffb83d" />
      <ellipse className="flame" cx="313" cy="212" rx="3" ry="6" fill="#fff2c4" />
      {/* 体 */}
      <path d="M120 268 Q116 168 180 162 Q244 168 240 268 Z" fill="#3a2d5e" stroke="#d9b35e" strokeWidth="1.6" strokeDasharray="5 4" />
      {/* 襟 */}
      <path d="M142 184 Q180 202 218 184 Q180 216 142 184 Z" fill="#e58ab0" />
      {/* 袖の手 */}
      <circle cx="146" cy="226" r="15" fill="#f8e9dc" />
      <circle cx="214" cy="226" r="15" fill="#f8e9dc" />
      {/* 後ろ髪（サイドロング） */}
      <path d="M124 104 Q108 96 110 150 Q112 196 130 214 Q140 218 142 206 Q132 170 134 120 Z" fill="#241a30" />
      <path d="M236 104 Q252 96 250 150 Q248 196 230 214 Q220 218 218 206 Q228 170 226 120 Z" fill="#241a30" />
      {/* 顔 */}
      <circle cx="180" cy="118" r="56" fill="#fbeede" />
      {/* 前髪（ぱっつん） */}
      <path d="M126 106 Q122 42 180 40 Q238 42 234 106
               q-9 16 -18 0 q-9 16 -18 0 q-9 16 -18 0
               q-9 16 -18 0 q-9 16 -18 0 q-9 16 -18 0 Z" fill="#2c2138" />
      {/* 髪のツヤ */}
      <path d="M148 66 Q166 52 196 56" stroke="#4a3a5e" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* あほ毛 */}
      <path d="M180 40 Q176 22 190 16 Q180 26 184 40" fill="#2c2138" />
      {/* 星の髪飾り */}
      <path d="M222 78 l4.5 9.5 10.5 1.3 -7.7 7.2 2 10.3 -9.3 -5.1 -9.3 5.1 2 -10.3 -7.7 -7.2 10.5 -1.3 Z" fill="#ffd44d" stroke="#e8b32a" strokeWidth="1" />
      {/* 目（にっこり）＋まつげ */}
      <path d="M150 126 q10 -10 20 0" stroke="#241a30" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M190 126 q10 -10 20 0" stroke="#241a30" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M148 124 l-5 -3 M212 124 l5 -3" stroke="#241a30" strokeWidth="2.6" strokeLinecap="round" />
      {/* ほっぺ */}
      <ellipse cx="146" cy="140" rx="9" ry="6" fill="#f9b9c6" opacity="0.9" />
      <ellipse cx="214" cy="140" rx="9" ry="6" fill="#f9b9c6" opacity="0.9" />
      {/* くち */}
      <path d="M172 148 q8 8 16 0" stroke="#d76a86" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* きらきら */}
      <path d="M96 84 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="#ffe9a3" opacity="0.9" />
      <path d="M268 60 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#ffe9a3" opacity="0.8" />
      {/* 水晶玉 */}
      <ellipse cx="180" cy="262" rx="44" ry="12" fill="#332857" />
      <circle className="crystal" cx="180" cy="234" r="34" fill="url(#orbGrad)" />
      <circle cx="168" cy="222" r="9" fill="rgba(255,255,255,0.7)" />
      <defs>
        <radialGradient id="orbGrad" cx="0.38" cy="0.32" r="0.9">
          <stop offset="0%" stopColor="#e6ecff" />
          <stop offset="45%" stopColor="#8d9af0" />
          <stop offset="100%" stopColor="#4a3f8f" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ================= タイプライター ================= */
function useTypewriter(text, speed = 28) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    setShown("");
    setDone(false);
    if (!text) { setDone(true); return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(text); setDone(true); return; }
    let i = 0;
    timer.current = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer.current); setDone(true); }
    }, speed);
    return () => clearInterval(timer.current);
  }, [text, speed]);
  const skip = () => { clearInterval(timer.current); setShown(text); setDone(true); };
  return [shown, done, skip];
}

/* ================= 本体 ================= */
const INTRO_LINE = "いらっしゃい。星詠みの夜へ、ようこそ。\nわたしはナナミ。星の巻物を整えるね。";

export default function HoshiyomiNoYoru() {
  // mode: intro / choose / input / loading / reading / offer / persona_input / persona_loading / persona
  const [mode, setMode] = useState("intro");
  const [yamlText, setYamlText] = useState("");
  const [chunks, setChunks] = useState([]);
  const [chunkIdx, setChunkIdx] = useState(0);
  const [persona, setPersona] = useState("");
  const [copied, setCopied] = useState(false);
  const [errLine, setErrLine] = useState("");
  const [pureYaml, setPureYaml] = useState("");

  const currentLine =
    mode === "intro" ? INTRO_LINE
    : mode === "choose" ? "今夜はどちらにする？\n星の巻物を整える？ それとも、あなたの分身を作る？"
    : mode === "input" ? (errLine || "じゃあ、その巻物をここに置いてね。")
    : mode === "persona_input" ? (errLine || "分身を紡ぐには、星のデータが要るよ。\nここに置いてね。")
    : mode === "loading" ? "ん……巻物を整えているよ。星の文字が、きれいに並んでいくね……"
    : mode === "reading" ? chunks[chunkIdx] || ""
    : mode === "offer" ? "ねえ、ひとつ提案があるの。\nあなたの星から「分身」も写し取れるよ。設計書と星のデータを束ねて、どこのAIにも連れて行ける巻物にするの。作ってみる？"
    : mode === "persona_loading" ? "ふふ、まかせて。あなたの写し身の糸を紡ぐね……"
    : mode === "persona" ? "できたよ。この巻物をぜんぶ写して、好きなAIに渡してね。あなたの星を持った分身が、話し始めるはずだよ。"
    : "";

  const [shown, typeDone, skip] = useTypewriter(currentLine);

  const advance = () => {
    if (!typeDone) { skip(); return; }
    if (mode === "intro") {
      setMode("choose");
    } else if (mode === "reading") {
      if (chunkIdx < chunks.length - 1) setChunkIdx(chunkIdx + 1);
      else setMode("offer");
    }
  };

  const doReading = async () => {
    if (!yamlText.trim()) return;
    setErrLine("");
    setMode("loading");
    const { yaml } = extractParts(yamlText);
    setPureYaml(yaml);
    try {
      const text = buildDemoReading(yaml);
      const parts = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
      setChunks(parts.length ? parts : [text]);
      setChunkIdx(0);
      setMode("reading");
    } catch (e) {
      console.error(e);
      setErrLine("んん……このデータ、星のかたちが読めないみたい。\nもう一度、巻物を見せてくれる？");
      setMode("input");
    }
  };

  const makePersona = async () => {
    setMode("persona_loading");
    try {
      setPersona(buildPersonaBlueprint(pureYaml));
      setMode("persona");
    } catch (e) {
      console.error(e);
      setMode("offer");
    }
  };

  const combinedPrompt = `あなたは以下の「人格設計書」と「ホロスコープデータ」に基づく分身AIです。
設計書のふるまいに従い、一人称で応答してください。
ホロスコープデータはSwiss Ephemeris計算済みです。再計算せず、この値を根拠としてください。

====== 人格設計書 ======

${persona}

====== ホロスコープデータ (YAML) ======

${pureYaml}`;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(combinedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error(e); }
  };

  const doDirectPersona = async () => {
    if (!yamlText.trim()) return;
    setErrLine("");
    const { yaml } = extractParts(yamlText);
    setPureYaml(yaml);
    setMode("persona_loading");
    try {
      setPersona(buildPersonaBlueprint(yaml));
      setMode("persona");
    } catch (e) {
      console.error(e);
      setErrLine("写し身の糸が、今は紡げないみたい。\nもう一度試してみてね。");
      setMode("persona_input");
    }
  };

  const backToStart = () => { setMode("choose"); setYamlText(""); setPersona(""); setErrLine(""); setChunks([]); setChunkIdx(0); };

  const tappable = mode === "intro" || mode === "reading";

  return (
    <div className="vn-root">
      <Style />
      <Stars />
      <NanamiScene />
      {tappable && <div className="tap-hint">タップで進む ▸</div>}

      <div className="dialog" onClick={tappable ? advance : undefined} role={tappable ? "button" : undefined} tabIndex={tappable ? 0 : -1}
        onKeyDown={tappable ? (e) => { if (e.key === "Enter" || e.key === " ") advance(); } : undefined}>
        <div className="nametag">ナナミ</div>
        <div className="dialog-text">{shown}</div>

        {/* 進むカーソル */}
        {tappable && typeDone && <div className="advance">▼</div>}

        {/* 進行カウンタ */}
        {mode === "reading" && (
          <div style={{ position: "absolute", left: 20, bottom: 8, fontSize: 12, color: "rgba(244,236,223,.45)" }}>
            {chunkIdx + 1} / {chunks.length}
          </div>
        )}

        {/* 選択画面 */}
        {mode === "choose" && typeDone && (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
            <button className="vn-btn" onClick={() => setMode("input")}>巻物を整える ✦</button>
            <button className="vn-btn ghost" onClick={() => setMode("persona_input")}>分身を作ってもらう</button>
          </div>
        )}

        {/* YAML入力（占いルート） */}
        {mode === "input" && typeDone && (
          <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
            <textarea
              className="yaml-area"
              placeholder="ここにホロスコープYAMLを貼り付けてね"
              value={yamlText}
              onChange={(e) => setYamlText(e.target.value)}
              aria-label="ホロスコープYAML"
            />
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button className="vn-btn" onClick={doReading} disabled={!yamlText.trim()}>巻物を整える ✦</button>
            </div>
          </div>
        )}

        {/* YAML入力（分身ルート） */}
        {mode === "persona_input" && typeDone && (
          <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
            <textarea
              className="yaml-area"
              placeholder="ここにホロスコープYAMLを貼り付けてね"
              value={yamlText}
              onChange={(e) => setYamlText(e.target.value)}
              aria-label="ホロスコープYAML"
            />
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button className="vn-btn" onClick={doDirectPersona} disabled={!yamlText.trim()}>分身を紡ぐ ✦</button>
            </div>
          </div>
        )}

        {/* 鑑定後の分身オファー */}
        {mode === "offer" && typeDone && (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
            <button className="vn-btn" onClick={makePersona}>分身を作ってもらう</button>
            <button className="vn-btn ghost" onClick={backToStart}>はじめから</button>
          </div>
        )}

        {/* 分身プロンプト */}
        {mode === "persona" && typeDone && (
          <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
            <textarea className="copy-area" readOnly value={combinedPrompt} aria-label="分身AIプロンプト" />
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
              <button className="vn-btn" onClick={copyAll}>{copied ? "写し取ったよ ✦" : "巻物を写し取る"}</button>
              <button className="vn-btn ghost" onClick={backToStart}>はじめから</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
