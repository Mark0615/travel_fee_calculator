import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { motion } from "framer-motion";

function calculate(people: string[], payments: Payment[]) {
  const balance: Record<string, number> = Object.fromEntries(people.map((p) => [p, 0]));
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

interface Payment {
  payer: string;
  beneficiaries: string[];
  amount: number;
}

export default function ExpenseSettlementApp() {
  const [count, setCount] = useState("5");
  const [names, setNames] = useState<string[]>(Array(5).fill(""));
  const [payments, setPayments] = useState<Payment[]>([]);
  const [temp, setTemp] = useState({ payer: "", beneficiary: "all", amount: "" });
  const [result, setResult] = useState<null | { balance: Record<string, number>; settlements: [string, string, number][] }>(null);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const ready = filled.length === Number(count);

  useEffect(() => {
    if (ready) {
      setTemp((t) => ({ ...t, payer: filled.includes(t.payer) ? t.payer : filled[0] }));
    }
  }, [ready, filled]);

  const addPayment = () => {
    const amt = parseFloat(temp.amount);
    if (isNaN(amt) || amt <= 0 || !temp.payer) return;
    const beneficiaries = temp.beneficiary === "all" ? [...filled] : [temp.beneficiary];
    setPayments((p) => [...p, { payer: temp.payer, beneficiaries, amount: amt }]);
    setTemp((t) => ({ ...t, amount: "" }));
    setResult(null);
  };

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-6">
      <motion.h1 className="text-3xl font-bold text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        🧮 AA 制結算小幫手
      </motion.h1>
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold">1️⃣ 出遊人數 & 成員名稱</h2>
          <Input
            type="number"
            min={1}
            max={26}
            value={count}
            onChange={(e) => {
              const n = Number(e.target.value);
              setCount(e.target.value);
              setNames((prev) => (n > prev.length ? [...prev, ...Array(n - prev.length).fill("")] : prev.slice(0, n)));
              setPayments([]);
              setResult(null);
            }}
            className="w-24"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {names.map((n, i) => (
              <Input
                key={i}
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
          {!ready && <p className="text-xs text-red-500">請輸入所有成員名稱</p>}
        </CardContent>
      </Card>
      {ready && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold">2️⃣ 新增付款紀錄</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <Select value={temp.payer} onValueChange={(v) => setTemp({ ...temp, payer: v })}>
                <SelectTrigger className="w-full">{temp.payer || "付款人"}</SelectTrigger>
                <SelectContent>
                  {filled.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={temp.beneficiary} onValueChange={(v) => setTemp({ ...temp, beneficiary: v })}>
                <SelectTrigger className="w-full">{temp.beneficiary === "all" ? "全體" : temp.beneficiary}</SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全體</SelectItem>
                  {filled.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="金額" value={temp.amount} onChange={(e) => setTemp({ ...temp, amount: e.target.value })} />
                <Button onClick={addPayment} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {payments.length > 0 && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                {payments.map((p, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-1 text-sm">
                    <span>
                      <strong>{p.payer}</strong> 幫 {p.beneficiaries.join(" 、")} 付：${p.amount}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setPayments((arr) => arr.filter((_, i) => i !== idx))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </motion.ul>
            )}
          </CardContent>
        </Card>
      )}
      {ready && (
        <div className="flex justify-center">
          <Button className="px-10" disabled={!payments.length} onClick={() => setResult(calculate(filled, payments))}>
            計算結果
          </Button>
        </div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">各自餘額</h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {filled.map((n) => (
                  <li key={n} className="flex justify-between">
                    <span>{n}</span>
                    <span>{result.balance[n] > 0 ? "+" : ""}{result.balance[n].toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">建議結算</h2>
              {result.settlements.length ? (
                <ul className="space-y-1 text-sm">
                  {result.settlements.map(([d, c, a], i) => (
                    <li key={i}>{`${d} → ${c}: $${a.toFixed(0)}`}</li>
                  ))}
                </ul>
              ) : (
                <p>🎉 已平帳！</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
