import { useEffect, useState } from "react";

type Payment = {
  payer: string;
  beneficiaries: string[];
  amount: number;
};

function calculate(people: string[], payments: Payment[]) {
  const balance: Record<string, number> = Object.fromEntries(
    people.map((p) => [p, 0])
  );

  for (const { payer, beneficiaries, amount } of payments) {
    const share = amount / beneficiaries.length;
    for (const b of beneficiaries) balance[b] -= share;
    balance[payer] += amount;
  }

  const creditors = Object.entries(balance)
    .filter(([, v]) => v > 1e-6)
    .map(([p, v]) => [p, v] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const debtors = Object.entries(balance)
    .filter(([, v]) => v < -1e-6)
    .map(([p, v]) => [p, -v] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const settlements: [string, string, number][] = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i][1], creditors[j][1]);
    settlements.push([debtors[i][0], creditors[j][0], pay]);
    debtors[i][1] -= pay;
    creditors[j][1] -= pay;
    if (debtors[i][1] < 1e-6) i++;
    if (creditors[j][1] < 1e-6) j++;
  }

  return { balance, settlements };
}

export default function App() {
  const [count, setCount] = useState("5");
  const [names, setNames] = useState<string[]>(Array(5).fill(""));
  const [payments, setPayments] = useState<Payment[]>([]);
  const [temp, setTemp] = useState({ payer: "", beneficiary: "all", amount: "" });
  const [result, setResult] = useState<null | {
    balance: Record<string, number>;
    settlements: [string, string, number][];
  }>(null);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const ready = filled.length === Number(count);

  // 若成員輸入完畢，預設付款人選第一位
  useEffect(() => {
    if (ready) {
      setTemp((t) => ({
        ...t,
        payer: filled.includes(t.payer) ? t.payer : filled[0] || "",
      }));
    }
  }, [ready, filled]);

  const addPayment = () => {
    const amt = parseFloat(temp.amount);
    if (isNaN(amt) || amt <= 0 || !temp.payer) return;

    const beneficiaries =
      temp.beneficiary === "all" ? [...filled] : [temp.beneficiary];

    setPayments((p) => [
      ...p,
      { payer: temp.payer, beneficiaries, amount: amt },
    ]);
    setTemp((t) => ({ ...t, amount: "" }));
    setResult(null);
  };

  return (
    <div className="container fade-in">
      <h1 style={{ textAlign: "center" }}>🧮 旅遊分帳小幫手</h1>

      {/* 1️⃣ 出遊人數 & 成員名稱 */}
      <section className="card">
        <h2>1️⃣ 出遊人數 & 成員名稱</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label>人數：</label>
          <input
            type="number"
            min={1}
            max={26}
            value={count}
            onChange={(e) => {
              const raw = e.target.value;
              const n = Number(raw || 0);
              setCount(raw);
              setNames((prev) =>
                n > prev.length
                  ? [...prev, ...Array(n - prev.length).fill("")]
                  : prev.slice(0, n)
              );
              setPayments([]);
              setResult(null);
            }}
            style={{ width: 90 }}
          />
        </div>

        {/* 名稱輸入：手機單欄，>=640px 變雙欄 */}
        <div className="grid-2" style={{ marginTop: 12 }}>
          {names.map((n, i) => (
            <input
              key={i}
              className="input-full"
              placeholder={`成員 ${i + 1}`}
              value={n}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
            />
          ))}
        </div>

        {!ready && (
          <p style={{ fontSize: 12, color: "crimson", marginTop: 6 }}>
            請輸入所有成員名稱
          </p>
        )}
      </section>

      {/* 2️⃣ 新增付款紀錄 */}
      {ready && (
        <section className="card">
          <h2>2️⃣ 新增付款紀錄</h2>

          {/* 手機單欄，>=768px 三欄 */}
          <div className="grid-3">
            <select
              value={temp.payer}
              onChange={(e) => setTemp({ ...temp, payer: e.target.value })}
              className="input-full"
            >
              <option value="">付款人</option>
              {filled.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <select
              value={temp.beneficiary}
              onChange={(e) => setTemp({ ...temp, beneficiary: e.target.value })}
              className="input-full"
            >
              <option value="all">全體</option>
              {filled.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                placeholder="金額"
                value={temp.amount}
                onChange={(e) => setTemp({ ...temp, amount: e.target.value })}
                className="input-full"
              />
              <button className="btn-ghost" onClick={addPayment} title="新增一筆">
                ＋
              </button>
            </div>
          </div>

          {payments.length > 0 && (
            <ul style={{ marginTop: 12 }}>
              {payments.map((p, idx) => (
                <li key={idx} className="record-item">
                  <span>
                    <strong>{p.payer}</strong> 幫 {p.beneficiaries.join(" 、")} 付：$
                    {Number(p.amount).toFixed(0)}
                  </span>
                  <button
                    className="btn-ghost"
                    onClick={() =>
                      setPayments((arr) => arr.filter((_, i) => i !== idx))
                    }
                    title="刪除"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 3️⃣ 計算 */}
      {ready && (
        <div className="center" style={{ marginTop: 16 }}>
          <button
            className="btn-primary"
            disabled={!payments.length}
            onClick={() => setResult(calculate(filled, payments))}
          >
            計算結果
          </button>
        </div>
      )}

      {/* 4️⃣ 結果 */}
      {result && (
        <div style={{ marginTop: 16 }}>
          <section className="card">
            <h2>各自餘額</h2>
            <ul style={{ columns: 2, fontSize: 14 }}>
              {filled.map((n) => (
                <li
                  key={n}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>{n}</span>
                  <span>
                    {result.balance[n] > 0 ? "+" : ""}
                    {result.balance[n].toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ marginTop: 12 }}>
            <h2>建議結算</h2>
            {result.settlements.length ? (
              <ul style={{ fontSize: 14 }}>
                {result.settlements.map(([d, c, a], i) => (
                  <li key={i}>{`${d} → ${c}: $${a.toFixed(0)}`}</li>
                ))}
              </ul>
            ) : (
              <p>🎉 已平帳！</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
