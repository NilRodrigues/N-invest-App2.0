// app.js (ESM via CDN) - SEM npm/bundler
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ================== FIREBASE CONFIG ================== */
const firebaseConfig = {
  apiKey: "AIzaSyCIWQj15HFfvoOk2oHrJE1mY-JH5tzYkYU",
  authDomain: "nilinvest-1176c.firebaseapp.com",
  projectId: "nilinvest-1176c",
  storageBucket: "nilinvest-1176c.firebasestorage.app",
  messagingSenderId: "127711268658",
  appId: "1:127711268658:web:4bd1c01fcc09609342512b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================== HELPERS ================== */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const fmtBRL = (cents) => {
  const valor = cents / 100;
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const toISODate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function parseBRLToCents(formattedValue) {
  if (!formattedValue || String(formattedValue).trim() === "") return null;

  const cleanValue = String(formattedValue)
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");

  const number = parseFloat(cleanValue);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.round(number * 100);
}

function applyCurrencyMask(input) {
  let value = input.value.replace(/\D/g, "");

  if (!value) {
    input.value = "";
    return;
  }

  const number = parseInt(value, 10) / 100;
  input.value = number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = String(dateStr).split("-");
  return `${d}/${m}/${y}`;
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(targetISO) {
  const from = startOfToday();
  const to = new Date(targetISO);
  to.setHours(0, 0, 0, 0);
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function computePlan(goal) {
  const daysLeft = daysUntil(goal.targetDate);
  const safeDays = Math.max(daysLeft, 1);

  const saved = Math.max(0, goal.savedCents || 0);
  const remaining = Math.max(0, goal.targetCents - saved);

  const daily = Math.ceil(remaining / safeDays);
  const weekly = Math.ceil(remaining / Math.ceil(safeDays / 7));
  const monthly = Math.ceil(remaining / Math.ceil(safeDays / 30));

  let selected = daily;
  if (goal.frequency === "weekly") selected = weekly;
  if (goal.frequency === "monthly") selected = monthly;

  const pct = goal.targetCents > 0 ? (saved / goal.targetCents) * 100 : 0;

  return {
    daysLeft,
    remaining,
    saved,
    pct: clamp(pct, 0, 100),
    daily,
    weekly,
    monthly,
    selected,
  };
}

/* ================== AUTH/UI ELEMENTS ================== */
const authScreen = $("#authScreen");
const appRoot = $("#appRoot");

// Header / user
const logoutBtn = $("#logoutBtn");
const userNameEl = $("#userName");
const userEmailEl = $("#userEmail");
const userAvatarEl = $("#userAvatar");

// App form
const form = $("#txForm");
const typeHidden = $("#type");
const segButtons = Array.from(document.querySelectorAll(".seg-btn"));
const amountEl = $("#amount");
const categoryEl = $("#category");
const dateEl = $("#date");
const noteEl = $("#note");
const errorEl = $("#formError");

// Filters (CRÍTICO: o HTML precisa ter id="categoryFilter")
const monthFilterEl = $("#monthFilter");
const typeFilterEl = $("#typeFilter");
const categoryFilterEl = $("#categoryFilter"); // ✅ filtro
const onlyExpensesEl = $("#onlyExpenses");

// Table
const txBody = $("#txBody");
const emptyState = $("#emptyState");

// Cashbar
const barIncome = $("#barIncome");
const barExpense = $("#barExpense");
const labelIncome = $("#labelIncome");
const labelExpense = $("#labelExpense");
const labelBalance = $("#labelBalance");

// Actions
const clearAllBtn = $("#clearAll");

// Goals
const goalForm = $("#goalForm");
const goalNameEl = $("#goalName");
const goalAmountEl = $("#goalAmount");
const goalDateEl = $("#goalDate");
const goalFrequencyEl = $("#goalFrequency");
const goalSavedEl = $("#goalSaved");
const goalErrorEl = $("#goalError");
const goalListEl = $("#goalList");
const goalEmptyEl = $("#goalEmpty");
const clearGoalsBtn = $("#clearGoals");

/* ================== STATE ================== */
let txs = [];
let goals = [];
let userId = null;
let currentUser = null;

let unsubTx = null;
let unsubGoals = null;

/* ================== FIRESTORE PATHS ================== */
const txCol = (uid) => collection(db, "users", uid, "txs");
const goalCol = (uid) => collection(db, "users", uid, "goals");

/* ================== UI LOGIC ================== */
function setType(nextType) {
  if (typeHidden) typeHidden.value = nextType;
  segButtons.forEach((b) => {
    const isActive = b.dataset.type === nextType;
    b.classList.toggle("is-active", isActive);
  });
}

function setupCurrencyMasks() {
  if (amountEl) {
    amountEl.addEventListener("input", function () {
      applyCurrencyMask(this);
    });

    amountEl.addEventListener("focus", function () {
      if (!this.value) this.value = "0,00";
    });
  }

  if (goalAmountEl) {
    goalAmountEl.addEventListener("input", function () {
      applyCurrencyMask(this);
    });

    goalAmountEl.addEventListener("focus", function () {
      if (!this.value) this.value = "0,00";
    });
  }

  if (goalSavedEl) {
    goalSavedEl.addEventListener("input", function () {
      applyCurrencyMask(this);
    });

    goalSavedEl.addEventListener("focus", function () {
      if (!this.value) this.value = "0,00";
    });
  }

  document.addEventListener("input", function (e) {
    if (e.target.matches(".goal-deposit-input")) {
      applyCurrencyMask(e.target);
    }
  });
}

function initInputsAndDates() {
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  if (dateEl) {
    dateEl.value = todayISO;
    dateEl.max = todayISO;
  }

  if (goalDateEl) {
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 1);

    const maxDate = new Date(today);
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    goalDateEl.min = minDate.toISOString().split("T")[0];
    goalDateEl.max = maxDate.toISOString().split("T")[0];

    const defaultGoalDate = new Date(today);
    defaultGoalDate.setMonth(defaultGoalDate.getMonth() + 3);
    goalDateEl.value = defaultGoalDate.toISOString().split("T")[0];
  }

  setupCurrencyMasks();
}

/* ================== FILTERS (SAFE) ================== */
function getFilteredTxs() {
  const m = monthFilterEl?.value ?? "";
  const t = typeFilterEl?.value ?? "";
  const c = categoryFilterEl?.value ?? ""; // ✅ não quebra se não existir
  const onlyExp = onlyExpensesEl?.checked ?? false;

  return txs.filter((x) => {
    if (m && !String(x.date || "").startsWith(m)) return false;
    if (t && x.type !== t) return false;
    if (c && x.category !== c) return false;
    if (onlyExp && x.type !== "expense") return false;
    return true;
  });
}

/* ================== CASHBAR ================== */
function updateBarTooltips(availablePct, spentPct, balance, expense) {
  if (!barIncome || !barExpense) return;

  barIncome.removeAttribute("title");
  barExpense.removeAttribute("title");

  barIncome.title = `Entradas: ${fmtBRL(balance)} (${availablePct.toFixed(1)}% das entradas)`;
  barExpense.title = `Saídas: ${fmtBRL(expense)} (${spentPct.toFixed(1)}% das entradas)`;

  barIncome.setAttribute("data-percent", availablePct > 0 ? `${availablePct.toFixed(1)}% Entradas` : "");
  barExpense.setAttribute("data-percent", spentPct > 0 ? `${spentPct.toFixed(1)}% Saídas` : "");
}

function updateCashBar(income, expense) {
  if (!barIncome || !barExpense || !labelIncome || !labelExpense || !labelBalance) return;

  const balance = income - expense;

  let availablePct = 0;
  let spentPct = 0;

  if (income > 0) {
    availablePct = (balance / income) * 100;
    spentPct = (expense / income) * 100;
  }

  availablePct = Number.isFinite(availablePct) ? Math.max(0, Math.min(100, availablePct)) : 0;
  spentPct = Number.isFinite(spentPct) ? Math.max(0, Math.min(100, spentPct)) : 0;

  barIncome.style.width = `${availablePct}%`;
  barExpense.style.width = `${spentPct}%`;

  labelIncome.textContent = fmtBRL(income);
  labelExpense.textContent = fmtBRL(expense);
  labelBalance.textContent = fmtBRL(balance);

  if (balance < 0) {
    labelBalance.style.color = "var(--danger)";
  } else if (balance > 0) {
    labelBalance.style.color = "var(--secondary)";
  } else {
    labelBalance.style.color = "var(--text-primary)";
  }

  updateBarTooltips(availablePct, spentPct, balance, expense, income);
}

/* ================== GOALS RENDER ================== */
function renderGoals() {
  if (!goalListEl || !goalEmptyEl) return;

  const list = goals.slice().sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || ""));

  if (list.length === 0) {
    goalListEl.innerHTML = "";
    goalEmptyEl.style.display = "flex";
    return;
  }

  goalEmptyEl.style.display = "none";

  goalListEl.innerHTML = list
    .map((g) => {
      const plan = computePlan(g);
      const overdue = plan.daysLeft < 0;
      const dueToday = plan.daysLeft === 0;
      const completed = plan.remaining === 0;

      const status = overdue
        ? `Meta vencida há ${Math.abs(plan.daysLeft)} dia(s)`
        : dueToday
          ? "Hoje é a data da meta"
          : `${plan.daysLeft} dia(s) restantes`;

      const freqLabel =
        g.frequency === "daily" ? "Por dia" : g.frequency === "weekly" ? "Por semana" : "Por mês";

      const badge = completed ? "income" : overdue ? "expense" : "income";
      const badgeText = completed ? "Concluído" : overdue ? "Atrasado" : "Ativo";

      return `
        <article class="goal-item">
          <div class="goal-title">
            <h3>${escapeHtml(g.name)}</h3>
            <span class="badge ${badge}">${badgeText}</span>
          </div>

          <div class="goal-meta">
            Alvo: <strong>${fmtBRL(g.targetCents)}</strong> • Data: <strong>${formatDate(g.targetDate)}</strong><br/>
            Guardado: <strong>${fmtBRL(plan.saved)}</strong> • Falta: <strong>${fmtBRL(plan.remaining)}</strong><br/>
            <span>${status}</span>
          </div>

          <div class="goal-progress">
            <div class="goal-progressbar">
              <div class="goal-progressfill" style="width:${plan.pct.toFixed(2)}%"></div>
            </div>
            <div class="goal-progressline">
              <span>${Math.round(plan.pct)}% concluído</span>
              <span>${fmtBRL(plan.saved)} / ${fmtBRL(g.targetCents)}</span>
            </div>
          </div>

          <div class="goal-metrics">
            <div class="goal-chip"><span class="k">${freqLabel} (restante)</span><span class="v">${fmtBRL(plan.selected)}</span></div>
            <div class="goal-chip"><span class="k">Sugestão / dia</span><span class="v">${fmtBRL(plan.daily)}</span></div>
            <div class="goal-chip"><span class="k">Sugestão / semana</span><span class="v">${fmtBRL(plan.weekly)}</span></div>
            <div class="goal-chip"><span class="k">Sugestão / mês</span><span class="v">${fmtBRL(plan.monthly)}</span></div>
          </div>

          <div class="goal-deposit">
            <input class="goal-deposit-input" data-goal-deposit="${g.id}" inputmode="decimal" placeholder="0,00" />
            <button class="goal-add" type="button" data-action="deposit-goal" data-id="${g.id}">
              <i class="fas fa-plus"></i> Guardar
            </button>
          </div>

          <div class="goal-actions">
            <button class="goal-btn" type="button" data-action="delete-goal" data-id="${g.id}">
              <i class="fas fa-trash"></i> Excluir
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

/* ================== MAIN RENDER ================== */
function render() {
  if (!txBody || !emptyState) return;

  const list = getFilteredTxs().slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const income = list.filter((x) => x.type === "income").reduce((acc, x) => acc + (x.amountCents || 0), 0);
  const expense = list.filter((x) => x.type === "expense").reduce((acc, x) => acc + (x.amountCents || 0), 0);

  updateCashBar(income, expense);

  if (list.length === 0) {
    txBody.innerHTML = "";
    emptyState.style.display = "flex";
  } else {
    emptyState.style.display = "none";
    txBody.innerHTML = list
      .map((x) => {
        const isIncome = x.type === "income";
        const badge = isIncome ? "income" : "expense";
        const typeLabel = isIncome ? "Entrada" : "Saída";
        const sign = isIncome ? "+" : "-";
        const icon = isIncome ? "fa-arrow-up" : "fa-arrow-down";

        return `
          <tr>
            <td data-label="Data">${formatDate(x.date)}</td>
            <td data-label="Tipo">
              <span class="badge ${badge}">
                <i class="fas ${icon}"></i> ${typeLabel}
              </span>
            </td>
            <td data-label="Categoria">${escapeHtml(x.category)}</td>
            <td data-label="Descrição">${escapeHtml(x.note ?? "-")}</td>
            <td data-label="Valor" class="right value ${badge}">
              ${sign} ${fmtBRL(x.amountCents)}
            </td>
            <td data-label="Ações" class="right">
              <button class="row-btn" data-action="delete" data-id="${x.id}">
                <i class="fas fa-trash"></i> Excluir
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  renderGoals();
}

/* ================== CRUD ================== */
async function addTx(tx) {
  await addDoc(txCol(userId), { ...tx, createdAt: serverTimestamp() });
}

async function deleteTx(id) {
  await deleteDoc(doc(db, "users", userId, "txs", id));
}

async function clearAllTx() {
  const batch = txs.map((t) => deleteTx(t.id));
  await Promise.all(batch);
}

async function addGoal(goal) {
  await addDoc(goalCol(userId), { ...goal, createdAt: serverTimestamp() });
}

async function deleteGoal(id) {
  await deleteDoc(doc(db, "users", userId, "goals", id));
}

async function clearAllGoals() {
  const batch = goals.map((g) => deleteGoal(g.id));
  await Promise.all(batch);
}

async function depositGoal(id, depositCents) {
  const g = goals.find((x) => x.id === id);
  if (!g) return;

  const nextSaved = Math.max(0, (g.savedCents || 0) + depositCents);
  await updateDoc(doc(db, "users", userId, "goals", id), {
    savedCents: nextSaved,
  });
}

/* ================== FORM EVENTS ================== */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (errorEl) errorEl.textContent = "";

  const amountCents = parseBRLToCents(amountEl?.value);
  if (!amountCents || amountCents <= 0) {
    if (errorEl) errorEl.textContent = "⚠️ Informe um valor válido maior que zero (ex: 1.000,00).";
    amountEl?.focus();
    return;
  }

  if (!categoryEl?.value || categoryEl.value === "Selecione uma categoria") {
    if (errorEl) errorEl.textContent = "⚠️ Selecione uma categoria.";
    categoryEl?.focus();
    return;
  }

  const date = dateEl?.value || toISODate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);

  if (inputDate > today) {
    if (errorEl) errorEl.textContent = "⚠️ A data não pode ser futura. Use a data atual ou passada.";
    dateEl?.focus();
    return;
  }

  try {
    await addTx({
      type: typeHidden?.value || "income",
      amountCents,
      category: categoryEl.value,
      date,
      note: noteEl?.value?.trim() || "",
    });

    if (amountEl) amountEl.value = "";
    if (categoryEl) categoryEl.selectedIndex = 0;
    if (noteEl) noteEl.value = "";
    if (dateEl) dateEl.value = toISODate();
    setType("income");
    amountEl?.focus();
  } catch (err) {
    if (errorEl) errorEl.textContent = "⚠️ Erro ao adicionar transação. Tente novamente.";
    console.error("Add transaction error:", err);
  }
});

txBody?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;
  if (action !== "delete") return;

  const tx = txs.find((x) => x.id === id);
  if (!tx) return;

  const ok = confirm(`Excluir transação?\n\n${tx.category} - ${fmtBRL(tx.amountCents)}`);
  if (!ok) return;

  try {
    await deleteTx(id);
  } catch (err) {
    alert("Erro ao excluir transação. Tente novamente.");
  }
});

// Filtros (não quebra se algum elemento não existir)
const filterEls = [monthFilterEl, typeFilterEl, categoryFilterEl, onlyExpensesEl].filter(Boolean);
filterEls.forEach((el) => {
  el.addEventListener("input", () => {
    clearTimeout(window.filterTimeout);
    window.filterTimeout = setTimeout(render, 150);
  });
});

clearAllBtn?.addEventListener("click", async () => {
  if (txs.length === 0) {
    alert("Não há transações para limpar.");
    return;
  }

  const ok = confirm(`⚠️ Apagar TODAS as ${txs.length} transações?\n\nEsta ação não pode ser desfeita.`);
  if (!ok) return;

  try {
    await clearAllTx();
  } catch (err) {
    alert("Erro ao limpar transações. Tente novamente.");
  }
});

/* ================== GOALS EVENTS ================== */
goalForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (goalErrorEl) goalErrorEl.textContent = "";

  const name = goalNameEl?.value?.trim() || "";
  if (!name) {
    if (goalErrorEl) goalErrorEl.textContent = "⚠️ Informe um nome para o cofrinho.";
    goalNameEl?.focus();
    return;
  }

  const targetCents = parseBRLToCents(goalAmountEl?.value);
  if (!targetCents) {
    if (goalErrorEl) goalErrorEl.textContent = "⚠️ Informe um valor alvo válido.";
    goalAmountEl?.focus();
    return;
  }

  const targetDate = goalDateEl?.value;
  if (!targetDate) {
    if (goalErrorEl) goalErrorEl.textContent = "⚠️ Selecione a data alvo.";
    goalDateEl?.focus();
    return;
  }

  const frequency = goalFrequencyEl?.value || "daily";
  const savedCents = goalSavedEl?.value?.trim() ? parseBRLToCents(goalSavedEl.value) ?? 0 : 0;

  try {
    await addGoal({
      name,
      targetCents,
      targetDate,
      frequency,
      savedCents,
    });

    if (goalNameEl) goalNameEl.value = "";
    if (goalAmountEl) goalAmountEl.value = "";
    if (goalDateEl) goalDateEl.value = "";
    if (goalFrequencyEl) goalFrequencyEl.value = "daily";
    if (goalSavedEl) goalSavedEl.value = "";
    goalNameEl?.focus();
  } catch (err) {
    if (goalErrorEl) goalErrorEl.textContent = "⚠️ Erro ao criar meta. Tente novamente.";
    console.error("Add goal error:", err);
  }
});

goalListEl?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;

  if (action === "delete-goal") {
    const g = goals.find((x) => x.id === id);
    if (!g) return;

    const ok = confirm(`Excluir cofrinho?\n\n${g.name} • ${fmtBRL(g.targetCents)}`);
    if (!ok) return;

    try {
      await deleteGoal(id);
    } catch (err) {
      alert("Erro ao excluir cofrinho. Tente novamente.");
    }
    return;
  }

  if (action === "deposit-goal") {
    const input = goalListEl.querySelector(`input[data-goal-deposit="${id}"]`);
    if (!input) return;

    const depositCents = parseBRLToCents(input.value);
    if (!depositCents || depositCents <= 0) {
      alert("Informe um valor válido para guardar (ex: 50,00).");
      input.focus();
      return;
    }

    try {
      await depositGoal(id, depositCents);
      input.value = "";
    } catch (err) {
      alert("Erro ao adicionar valor. Tente novamente.");
    }
  }
});

clearGoalsBtn?.addEventListener("click", async () => {
  if (goals.length === 0) {
    alert("Não há cofrinhos para limpar.");
    return;
  }

  const ok = confirm(`⚠️ Apagar TODOS os ${goals.length} cofrinhos?\n\nEsta ação não pode ser desfeita.`);
  if (!ok) return;

  try {
    await clearAllGoals();
  } catch (err) {
    alert("Erro ao limpar cofrinhos. Tente novamente.");
  }
});

/* ================== INITIALIZATION ================== */
if (segButtons.length > 0) {
  segButtons.forEach((b) => {
    b.addEventListener("click", () => setType(b.dataset.type));
  });
}

if (monthFilterEl) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  monthFilterEl.value = `${year}-${month}`;
}

/* ================== REALTIME SYNC ================== */
function stopSync() {
  if (unsubTx) unsubTx();
  if (unsubGoals) unsubGoals();
  unsubTx = null;
  unsubGoals = null;
}

function startSync(uid) {
  stopSync();

  unsubTx = onSnapshot(
    query(txCol(uid), orderBy("createdAt", "desc")),
    (snap) => {
      txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    (error) => console.error("Transaction sync error:", error)
  );

  unsubGoals = onSnapshot(
    query(goalCol(uid), orderBy("createdAt", "desc")),
    (snap) => {
      goals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    (error) => console.error("Goals sync error:", error)
  );
}

/* ================== AUTH STATE ================== */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    userId = null;
    currentUser = null;
    txs = [];
    goals = [];
    stopSync();

    if (authScreen) authScreen.style.display = "flex";
    if (appRoot) appRoot.hidden = true;

    return;
  }

  userId = user.uid;
  currentUser = user;

  if (userNameEl) {
    const displayName = user.displayName || user.email?.split("@")[0] || "Usuário";
    userNameEl.textContent = displayName;
  }

  if (userEmailEl) {
    userEmailEl.textContent = user.email || "Não identificado";
  }

  if (userAvatarEl) {
    const displayName = user.displayName || user.email?.split("@")[0] || "U";
    userAvatarEl.textContent = displayName.charAt(0).toUpperCase();
  }

  if (authScreen) authScreen.style.display = "none";
  if (appRoot) appRoot.hidden = false;

  setType("income");
  initInputsAndDates();

  startSync(userId);
});

logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout error:", err);
    alert("Erro ao sair. Tente novamente.");
  }
});

/* ================== APP INIT ================== */
function initApp() {
  const exportBtn = $("#exportBtn");
  const printBtn = $("#printBtn");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      alert("Funcionalidade de exportação em desenvolvimento!");
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  console.log("N-Invest App inicializado com sucesso!");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
