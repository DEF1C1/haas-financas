import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  BarChart3,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Assinaturas",
  "Educação",
  "Outros",
];

const CHART_COLORS = [
  "#34D8B0",
  "#FF6F91",
  "#5B8DEF",
  "#B78CFF",
  "#FFC768",
  "#6EE7F2",
  "#F2A65B",
  "#8CE39B",
];

const CHART_GRID = "#262B38";
const CHART_TICK = { fontSize: 12, fill: "#8B92A3" };
const TOOLTIP_STYLE = {
  background: "#1B1F29",
  border: "1px solid #2A2F3D",
  borderRadius: 8,
  fontSize: 12,
};
const TOOLTIP_LABEL_STYLE = { color: "#EDEEF2", marginBottom: 4 };
const TOOLTIP_ITEM_STYLE = { color: "#EDEEF2" };
const LEGEND_STYLE = { fontSize: 12, color: "#8B92A3" };

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function formatPercent(value) {
  const v = Number(value) || 0;
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthKeyFromDate(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : "";
}

function monthLabel(key) {
  if (!key) return "";
  const [y, m] = key.split("-");
  const names = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `${names[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

let idCounter = 1;
function nextId() {
  idCounter += 1;
  return `id-${Date.now()}-${idCounter}`;
}

function Card({ label, value, sub, tone }) {
  return (
    <div className="fp-card">
      <div className="fp-card-label">{label}</div>
      <div className={`fp-card-value ${tone ? `fp-tone-${tone}` : ""}`}>
        {value}
      </div>
      {sub ? <div className="fp-card-sub">{sub}</div> : null}
    </div>
  );
}

function EmptyState({ title, hint }) {
  return (
    <div className="fp-empty">
      <div className="fp-empty-title">{title}</div>
      <div className="fp-empty-hint">{hint}</div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [investments, setInvestments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [inv, exp, cats] = await Promise.allSettled([
          window.storage.get("investments", false),
          window.storage.get("expenses", false),
          window.storage.get("categories", false),
        ]);
        if (inv.status === "fulfilled" && inv.value)
          setInvestments(JSON.parse(inv.value.value));
        if (exp.status === "fulfilled" && exp.value)
          setExpenses(JSON.parse(exp.value.value));
        if (cats.status === "fulfilled" && cats.value)
          setCategories(JSON.parse(cats.value.value));
      } catch (e) {
        setStorageWarning(true);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.storage
      .set("investments", JSON.stringify(investments), false)
      .catch(() => setStorageWarning(true));
  }, [investments, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.storage
      .set("expenses", JSON.stringify(expenses), false)
      .catch(() => setStorageWarning(true));
  }, [expenses, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.storage
      .set("categories", JSON.stringify(categories), false)
      .catch(() => setStorageWarning(true));
  }, [categories, loaded]);

  const currentMonthKey = todayISO().slice(0, 7);

  const totals = useMemo(() => {
    const totalInvestido = investments.reduce(
      (s, i) => s + Number(i.valorInvestido || 0),
      0
    );
    const totalAtual = investments.reduce(
      (s, i) => s + Number(i.valorAtual || i.valorInvestido || 0),
      0
    );
    const rentabilidade =
      totalInvestido > 0
        ? ((totalAtual - totalInvestido) / totalInvestido) * 100
        : 0;
    const gastoMesAtual = expenses
      .filter((e) => monthKeyFromDate(e.data) === currentMonthKey)
      .reduce((s, e) => s + Number(e.valor || 0), 0);
    return { totalInvestido, totalAtual, rentabilidade, gastoMesAtual };
  }, [investments, expenses, currentMonthKey]);

  const gastosPorCategoriaMesAtual = useMemo(() => {
    const map = {};
    expenses
      .filter((e) => monthKeyFromDate(e.data) === currentMonthKey)
      .forEach((e) => {
        map[e.categoria] = (map[e.categoria] || 0) + Number(e.valor || 0);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses, currentMonthKey]);

  const fixoVsVariavelMesAtual = useMemo(() => {
    const map = { Fixo: 0, Variável: 0 };
    expenses
      .filter((e) => monthKeyFromDate(e.data) === currentMonthKey)
      .forEach((e) => {
        const label = e.tipo === "fixo" ? "Fixo" : "Variável";
        map[label] += Number(e.valor || 0);
      });
    return [
      { name: "Fixo", valor: map.Fixo },
      { name: "Variável", valor: map.Variável },
    ];
  }, [expenses, currentMonthKey]);

  const gastoMensalHistorico = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const key = monthKeyFromDate(e.data);
      if (!key) return;
      map[key] = (map[key] || 0) + Number(e.valor || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([key, valor]) => ({ mes: monthLabel(key), valor }));
  }, [expenses]);

  const gastosPorCategoriaTodos = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.categoria] = (map[e.categoria] || 0) + Number(e.valor || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const carteiraPorTipo = useMemo(() => {
    const map = { "Renda fixa": 0, "Renda variável": 0 };
    investments.forEach((i) => {
      const label = i.tipo === "fixa" ? "Renda fixa" : "Renda variável";
      map[label] += Number(i.valorAtual || i.valorInvestido || 0);
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [investments]);

  const comparativoAtivos = useMemo(() => {
    return investments.map((i) => ({
      nome: i.nome,
      investido: Number(i.valorInvestido || 0),
      atual: Number(i.valorAtual || i.valorInvestido || 0),
    }));
  }, [investments]);

  function addInvestment(inv) {
    setInvestments((prev) => [...prev, { ...inv, id: nextId() }]);
  }
  function removeInvestment(id) {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  }
  function addExpense(exp) {
    setExpenses((prev) => [...prev, { ...exp, id: nextId() }]);
  }
  function removeExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }
  function addCategory(name) {
    if (name && !categories.includes(name)) {
      setCategories((prev) => [...prev, name]);
    }
  }

  return (
    <div className="fp-root">
      <style>{`
        .fp-root {
          --bg: #12141B;
          --sidebar-bg: #0B0D12;
          --panel: #1B1F29;
          --panel-alt: #20242F;
          --border: #2A2F3D;
          --text: #EDEEF2;
          --text-muted: #8B92A3;
          --accent: #34D8B0;
          --accent-soft: rgba(52,216,176,0.14);
          --coral: #FF6F91;
          --coral-soft: rgba(255,111,145,0.14);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          color: var(--text);
          background: var(--bg);
          display: flex;
          min-height: 640px;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .fp-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-variant-numeric: tabular-nums;
        }
        .fp-sidebar {
          width: 208px;
          flex-shrink: 0;
          background: var(--sidebar-bg);
          color: var(--text);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-right: 1px solid var(--border);
        }
        .fp-brand {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0 8px 24px 8px;
        }
        .fp-brand-accent {
          color: var(--accent);
        }
        .fp-nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: #9098A8;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .fp-nav-btn:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
        .fp-nav-btn.active {
          background: var(--accent-soft);
          color: #fff;
          border-left: 2px solid var(--accent);
          padding-left: 10px;
        }
        .fp-main {
          flex: 1;
          padding: 28px 32px;
          overflow-y: auto;
          background: var(--bg);
        }
        .fp-page-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 4px 0;
          color: var(--text);
        }
        .fp-page-sub {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0 0 24px 0;
        }
        .fp-cards-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .fp-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px 18px;
        }
        .fp-card-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .fp-card-value {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 22px;
          font-variant-numeric: tabular-nums;
          color: var(--text);
        }
        .fp-tone-positive { color: var(--accent); }
        .fp-tone-negative { color: var(--coral); }
        .fp-card-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .fp-panels-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .fp-panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 18px;
        }
        .fp-panel-title {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 14px 0;
          color: var(--text);
        }
        .fp-form {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 18px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          align-items: end;
        }
        .fp-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .fp-field label {
          font-size: 11px;
          color: var(--text-muted);
        }
        .fp-field input, .fp-field select {
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 7px 8px;
          font-size: 13px;
          background: var(--panel-alt);
          color: var(--text);
          font-family: inherit;
        }
        .fp-field input:focus, .fp-field select:focus {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
        .fp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: var(--accent);
          color: #0B0D12;
          border: none;
          border-radius: 4px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .fp-btn:hover { background: #2BC29D; }
        .fp-btn-secondary {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border);
        }
        .fp-btn-secondary:hover { background: var(--panel-alt); }
        .fp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .fp-table th {
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          padding: 8px 10px;
        }
        .fp-table td {
          padding: 9px 10px;
          border-bottom: 1px solid var(--border);
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-variant-numeric: tabular-nums;
          color: var(--text);
        }
        .fp-table td.fp-text { font-family: inherit; }
        .fp-table tr:hover td { background: rgba(255,255,255,0.03); }
        .fp-del-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .fp-del-btn:hover { color: var(--coral); background: var(--coral-soft); }
        .fp-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }
        .fp-tag {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 11px;
          background: var(--accent-soft);
          color: var(--accent);
        }
        .fp-tag.fp-fixo {
          background: var(--coral-soft);
          color: var(--coral);
        }
        .fp-empty {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-muted);
        }
        .fp-empty-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--text);
        }
        .fp-empty-hint { font-size: 12px; }
        .fp-warning {
          background: var(--coral-soft);
          color: #FFB3C4;
          border: 1px solid rgba(255,111,145,0.3);
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 12px;
          margin-bottom: 16px;
        }
        .fp-add-cat-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .fp-root { flex-direction: column; }
          .fp-sidebar { width: 100%; flex-direction: row; overflow-x: auto; }
          .fp-cards-row { grid-template-columns: repeat(2, 1fr); }
          .fp-panels-row { grid-template-columns: 1fr; }
          .fp-form { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <nav className="fp-sidebar">
        <div className="fp-brand">
          Haas<span className="fp-brand-accent"> Finanças</span>
        </div>
        <button
          className={`fp-nav-btn ${view === "dashboard" ? "active" : ""}`}
          onClick={() => setView("dashboard")}
        >
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button
          className={`fp-nav-btn ${view === "investimentos" ? "active" : ""}`}
          onClick={() => setView("investimentos")}
        >
          <TrendingUp size={16} /> Investimentos
        </button>
        <button
          className={`fp-nav-btn ${view === "gastos" ? "active" : ""}`}
          onClick={() => setView("gastos")}
        >
          <Receipt size={16} /> Gastos
        </button>
        <button
          className={`fp-nav-btn ${view === "relatorios" ? "active" : ""}`}
          onClick={() => setView("relatorios")}
        >
          <BarChart3 size={16} /> Relatórios
        </button>
      </nav>

      <main className="fp-main">
        {storageWarning && (
          <div className="fp-warning">
            Não foi possível salvar ou carregar alguns dados automaticamente.
            Seus dados podem não persistir entre sessões.
          </div>
        )}

        {view === "dashboard" && (
          <DashboardView
            totals={totals}
            gastosPorCategoriaMesAtual={gastosPorCategoriaMesAtual}
            fixoVsVariavelMesAtual={fixoVsVariavelMesAtual}
          />
        )}

        {view === "investimentos" && (
          <InvestimentosView
            investments={investments}
            onAdd={addInvestment}
            onRemove={removeInvestment}
          />
        )}

        {view === "gastos" && (
          <GastosView
            expenses={expenses}
            categories={categories}
            onAdd={addExpense}
            onRemove={removeExpense}
            onAddCategory={addCategory}
          />
        )}

        {view === "relatorios" && (
          <RelatoriosView
            gastoMensalHistorico={gastoMensalHistorico}
            gastosPorCategoriaTodos={gastosPorCategoriaTodos}
            carteiraPorTipo={carteiraPorTipo}
            comparativoAtivos={comparativoAtivos}
          />
        )}
      </main>
    </div>
  );
}

function DashboardView({ totals, gastosPorCategoriaMesAtual, fixoVsVariavelMesAtual }) {
  const rentPositive = totals.rentabilidade >= 0;
  return (
    <div>
      <h1 className="fp-page-title">Visão geral</h1>
      <p className="fp-page-sub">Resumo da sua situação financeira atual</p>

      <div className="fp-cards-row">
        <Card label="Total investido" value={formatBRL(totals.totalInvestido)} />
        <Card label="Valor atual da carteira" value={formatBRL(totals.totalAtual)} />
        <Card
          label="Rentabilidade total"
          value={formatPercent(totals.rentabilidade)}
          tone={rentPositive ? "positive" : "negative"}
          sub={rentPositive ? "acima do investido" : "abaixo do investido"}
        />
        <Card label="Gasto no mês atual" value={formatBRL(totals.gastoMesAtual)} />
      </div>

      <div className="fp-panels-row">
        <div className="fp-panel">
          <h3 className="fp-panel-title">Gastos por categoria — mês atual</h3>
          {gastosPorCategoriaMesAtual.length === 0 ? (
            <EmptyState
              title="Nenhum gasto registrado este mês"
              hint="Adicione lançamentos na seção Gastos"
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={gastosPorCategoriaMesAtual}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {gastosPorCategoriaMesAtual.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatBRL(v)}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Legend wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="fp-panel">
          <h3 className="fp-panel-title">Fixo vs. variável — mês atual</h3>
          {totals.gastoMesAtual === 0 ? (
            <EmptyState
              title="Sem dados suficientes"
              hint="Registre gastos fixos e variáveis para comparar"
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={fixoVsVariavelMesAtual}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="name" tick={CHART_TICK} />
                <YAxis tick={CHART_TICK} />
                <Tooltip
                  formatter={(v) => formatBRL(v)}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  <Cell fill="#FF6F91" />
                  <Cell fill="#34D8B0" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestimentosView({ investments, onAdd, onRemove }) {
  const [form, setForm] = useState({
    tipo: "fixa",
    nome: "",
    valorInvestido: "",
    valorAtual: "",
    dataAporte: todayISO(),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome || !form.valorInvestido) return;
    onAdd({
      tipo: form.tipo,
      nome: form.nome,
      valorInvestido: parseFloat(form.valorInvestido),
      valorAtual: form.valorAtual ? parseFloat(form.valorAtual) : parseFloat(form.valorInvestido),
      dataAporte: form.dataAporte,
    });
    setForm({ tipo: "fixa", nome: "", valorInvestido: "", valorAtual: "", dataAporte: todayISO() });
  }

  return (
    <div>
      <h1 className="fp-page-title">Investimentos</h1>
      <p className="fp-page-sub">Renda fixa e variável — acompanhe seus aportes e rentabilidade</p>

      <form className="fp-form" onSubmit={handleSubmit}>
        <div className="fp-field">
          <label>Tipo</label>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="fixa">Renda fixa</option>
            <option value="variavel">Renda variável</option>
          </select>
        </div>
        <div className="fp-field">
          <label>Ativo</label>
          <input
            type="text"
            placeholder="Ex: Tesouro Selic, PETR4"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>
        <div className="fp-field">
          <label>Valor investido (R$)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={form.valorInvestido}
            onChange={(e) => setForm({ ...form, valorInvestido: e.target.value })}
          />
        </div>
        <div className="fp-field">
          <label>Valor atual (R$)</label>
          <input
            type="number"
            step="0.01"
            placeholder="opcional"
            value={form.valorAtual}
            onChange={(e) => setForm({ ...form, valorAtual: e.target.value })}
          />
        </div>
        <div className="fp-field">
          <label>Data do aporte</label>
          <input
            type="date"
            value={form.dataAporte}
            onChange={(e) => setForm({ ...form, dataAporte: e.target.value })}
          />
        </div>
        <button type="submit" className="fp-btn">
          <Plus size={14} /> Adicionar
        </button>
      </form>

      {investments.length === 0 ? (
        <EmptyState title="Nenhum investimento registrado" hint="Use o formulário acima para começar" />
      ) : (
        <table className="fp-table">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Tipo</th>
              <th>Aporte</th>
              <th>Investido</th>
              <th>Atual</th>
              <th>Rentabilidade</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => {
              const rent =
                inv.valorInvestido > 0
                  ? ((inv.valorAtual - inv.valorInvestido) / inv.valorInvestido) * 100
                  : 0;
              return (
                <tr key={inv.id}>
                  <td className="fp-text">{inv.nome}</td>
                  <td className="fp-text">{inv.tipo === "fixa" ? "Renda fixa" : "Renda variável"}</td>
                  <td>{inv.dataAporte}</td>
                  <td>{formatBRL(inv.valorInvestido)}</td>
                  <td>{formatBRL(inv.valorAtual)}</td>
                  <td className={rent >= 0 ? "fp-tone-positive" : "fp-tone-negative"}>
                    {formatPercent(rent)}
                  </td>
                  <td>
                    <button className="fp-del-btn" onClick={() => onRemove(inv.id)} aria-label="Remover">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function GastosView({ expenses, categories, onAdd, onRemove, onAddCategory }) {
  const [form, setForm] = useState({
    tipo: "variavel",
    categoria: categories[0] || "Outros",
    descricao: "",
    valor: "",
    data: todayISO(),
  });
  const [novaCategoria, setNovaCategoria] = useState("");
  const [showNovaCategoria, setShowNovaCategoria] = useState(false);
  const [filtroMes, setFiltroMes] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.descricao || !form.valor) return;
    onAdd({
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data: form.data,
    });
    setForm({ ...form, descricao: "", valor: "" });
  }

  function handleAddCategory() {
    if (novaCategoria.trim()) {
      onAddCategory(novaCategoria.trim());
      setForm({ ...form, categoria: novaCategoria.trim() });
      setNovaCategoria("");
      setShowNovaCategoria(false);
    }
  }

  const meses = useMemo(() => {
    const set = new Set(expenses.map((e) => monthKeyFromDate(e.data)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => filtroMes === "todos" || monthKeyFromDate(e.data) === filtroMes)
      .filter((e) => filtroCategoria === "todas" || e.categoria === filtroCategoria)
      .sort((a, b) => (a.data < b.data ? 1 : -1));
  }, [expenses, filtroMes, filtroCategoria]);

  return (
    <div>
      <h1 className="fp-page-title">Gastos</h1>
      <p className="fp-page-sub">Fixos e variáveis, organizados por categoria</p>

      <form className="fp-form" onSubmit={handleSubmit}>
        <div className="fp-field">
          <label>Tipo</label>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="fixo">Fixo</option>
            <option value="variavel">Variável</option>
          </select>
        </div>
        <div className="fp-field">
          <label>Categoria</label>
          {showNovaCategoria ? (
            <div className="fp-add-cat-row">
              <input
                type="text"
                placeholder="Nova categoria"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
              />
              <button type="button" className="fp-del-btn" onClick={() => setShowNovaCategoria(false)}>
                <X size={14} />
              </button>
              <button type="button" className="fp-btn" onClick={handleAddCategory}>
                OK
              </button>
            </div>
          ) : (
            <select
              value={form.categoria}
              onChange={(e) => {
                if (e.target.value === "__nova__") {
                  setShowNovaCategoria(true);
                } else {
                  setForm({ ...form, categoria: e.target.value });
                }
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__nova__">+ Nova categoria</option>
            </select>
          )}
        </div>
        <div className="fp-field">
          <label>Descrição</label>
          <input
            type="text"
            placeholder="Ex: Mercado, Aluguel"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>
        <div className="fp-field">
          <label>Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
        </div>
        <div className="fp-field">
          <label>Data</label>
          <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </div>
        <button type="submit" className="fp-btn">
          <Plus size={14} /> Adicionar
        </button>
      </form>

      <div className="fp-filters">
        <div className="fp-field">
          <label>Mês</label>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value="todos">Todos os meses</option>
            {meses.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="fp-field">
          <label>Categoria</label>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="todas">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum gasto encontrado" hint="Ajuste os filtros ou adicione um novo lançamento" />
      ) : (
        <table className="fp-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td>{e.data}</td>
                <td className="fp-text">{e.descricao}</td>
                <td className="fp-text">{e.categoria}</td>
                <td className="fp-text">
                  <span className={`fp-tag ${e.tipo === "fixo" ? "fp-fixo" : ""}`}>
                    {e.tipo === "fixo" ? "Fixo" : "Variável"}
                  </span>
                </td>
                <td>{formatBRL(e.valor)}</td>
                <td>
                  <button className="fp-del-btn" onClick={() => onRemove(e.id)} aria-label="Remover">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RelatoriosView({ gastoMensalHistorico, gastosPorCategoriaTodos, carteiraPorTipo, comparativoAtivos }) {
  return (
    <div>
      <h1 className="fp-page-title">Relatórios</h1>
      <p className="fp-page-sub">Análises consolidadas de gastos e investimentos</p>

      <div className="fp-panels-row" style={{ marginBottom: 16 }}>
        <div className="fp-panel">
          <h3 className="fp-panel-title">Gasto mensal — últimos 6 meses</h3>
          {gastoMensalHistorico.length === 0 ? (
            <EmptyState title="Sem histórico suficiente" hint="Registre gastos ao longo do tempo" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={gastoMensalHistorico}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="mes" tick={CHART_TICK} />
                <YAxis tick={CHART_TICK} />
                <Tooltip
                  formatter={(v) => formatBRL(v)}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Line type="monotone" dataKey="valor" stroke="#FF6F91" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="fp-panel">
          <h3 className="fp-panel-title">Gastos por categoria — total</h3>
          {gastosPorCategoriaTodos.length === 0 ? (
            <EmptyState title="Sem dados" hint="Registre gastos para ver esta análise" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={gastosPorCategoriaTodos}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {gastosPorCategoriaTodos.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatBRL(v)}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Legend wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="fp-panels-row">
        <div className="fp-panel">
          <h3 className="fp-panel-title">Composição da carteira por tipo</h3>
          {carteiraPorTipo.length === 0 ? (
            <EmptyState title="Sem investimentos" hint="Adicione ativos na seção Investimentos" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={carteiraPorTipo}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  <Cell fill="#5B8DEF" />
                  <Cell fill="#B78CFF" />
                </Pie>
                <Tooltip
                  formatter={(v) => formatBRL(v)}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Legend wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="fp-panel">
          <h3 className="fp-panel-title">Investido vs. valor atual por ativo</h3>
          {comparativoAtivos.length === 0 ? (
            <EmptyState title="Sem investimentos" hint="Adicione ativos na seção Investimentos" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={comparativoAtivos}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="nome" tick={CHART_TICK} />
                <YAxis tick={CHART_TICK} />
                <Tooltip
                  formatter={(v) => formatBRL(v)}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Bar dataKey="investido" name="Investido" fill="#5B8DEF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atual" name="Atual" fill="#34D8B0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
