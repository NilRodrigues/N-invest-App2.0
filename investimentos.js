// investimentos.js - Arquivo completo (APIs atuais 2025)

// =========================
// Configuração
// =========================
let investments = [];
let marketData = { selic: 0, ipca: 0, ipca12m: 0 };
let investmentValues = {};
let periodFilter = "month";

// Token opcional do brapi (recomendado para produção)
// Defina no seu HTML antes de carregar este arquivo:
// <script>window.BRAPI_TOKEN = "SEU_TOKEN_AQUI";</script>
const BRAPI_TOKEN = (typeof window !== "undefined" && window.BRAPI_TOKEN) ? String(window.BRAPI_TOKEN) : "";

// =========================
// Opções de investimentos
// =========================
const investmentOptions = {
  fixed_selic: [
    { name: "Tesouro Selic 2027", rate: 100 }, { name: "CDB 100% CDI", rate: 100 }, { name: "CDB 105% CDI", rate: 105 },
    { name: "CDB 110% CDI", rate: 110 }, { name: "CDB 115% CDI", rate: 115 }, { name: "CDB 120% CDI", rate: 120 },
    { name: "CDB 125% CDI", rate: 125 }, { name: "CDB 130% CDI", rate: 130 }, { name: "LCI 85% CDI", rate: 85 },
    { name: "LCI 90% CDI", rate: 90 }, { name: "LCI 95% CDI", rate: 95 }, { name: "LCA 85% CDI", rate: 85 },
    { name: "LCA 90% CDI", rate: 90 }, { name: "LCA 95% CDI", rate: 95 }, { name: "LC 115% CDI", rate: 115 },
    { name: "LC 120% CDI", rate: 120 }, { name: "Debênture 120% CDI", rate: 120 }, { name: "Debênture 125% CDI", rate: 125 }
  ],
  fixed_ipca: [
    { name: "Tesouro IPCA+ 2029", rate: 5.5 }, { name: "Tesouro IPCA+ 2035", rate: 6.0 }, { name: "Tesouro IPCA+ 2045", rate: 6.2 },
    { name: "Tesouro IPCA+ 2055", rate: 6.3 }, { name: "CDB IPCA+ 3%", rate: 3.0 }, { name: "CDB IPCA+ 4%", rate: 4.0 },
    { name: "CDB IPCA+ 5%", rate: 5.0 }, { name: "CDB IPCA+ 6%", rate: 6.0 }, { name: "CDB IPCA+ 7%", rate: 7.0 },
    { name: "LCI IPCA+ 4%", rate: 4.0 }, { name: "LCI IPCA+ 5%", rate: 5.0 }, { name: "LCA IPCA+ 4%", rate: 4.0 },
    { name: "LCA IPCA+ 5%", rate: 5.0 }, { name: "Debênture IPCA+ 6%", rate: 6.0 }, { name: "Debênture IPCA+ 7%", rate: 7.0 },
    { name: "Debênture IPCA+ 8%", rate: 8.0 }, { name: "Debênture IPCA+ 9%", rate: 9.0 }
  ],
  stock: [
    { name: "Itaú Unibanco (ITUB4)", symbol: "ITUB4" }, { name: "Bradesco (BBDC4)", symbol: "BBDC4" }, { name: "Banco do Brasil (BBAS3)", symbol: "BBAS3" },
    { name: "Santander (SANB11)", symbol: "SANB11" }, { name: "BTG Pactual (BPAC11)", symbol: "BPAC11" }, { name: "Nubank (NU)", symbol: "NU" },
    { name: "Petrobras (PETR4)", symbol: "PETR4" }, { name: "Petrobras PN (PETR3)", symbol: "PETR3" }, { name: "PetroRio (PRIO3)", symbol: "PRIO3" },
    { name: "3R Petroleum (RRRP3)", symbol: "RRRP3" }, { name: "Vale (VALE3)", symbol: "VALE3" }, { name: "Gerdau (GGBR4)", symbol: "GGBR4" },
    { name: "Usiminas (USIM5)", symbol: "USIM5" }, { name: "CSN (CSNA3)", symbol: "CSNA3" }, { name: "CSN Mineração (CMIN3)", symbol: "CMIN3" },
    { name: "Metalúrgica Gerdau (GOAU4)", symbol: "GOAU4" }, { name: "Magazine Luiza (MGLU3)", symbol: "MGLU3" }, { name: "Via (VIIA3)", symbol: "VIIA3" },
    { name: "Lojas Renner (LREN3)", symbol: "LREN3" }, { name: "Carrefour Brasil (CRFB3)", symbol: "CRFB3" }, { name: "Assaí (ASAI3)", symbol: "ASAI3" },
    { name: "Pão de Açúcar (PCAR3)", symbol: "PCAR3" }, { name: "Americanas (AMER3)", symbol: "AMER3" }, { name: "C&A (CEAB3)", symbol: "CEAB3" },
    { name: "Ambev (ABEV3)", symbol: "ABEV3" }, { name: "JBS (JBSS3)", symbol: "JBSS3" }, { name: "BRF (BRFS3)", symbol: "BRFS3" },
    { name: "Marfrig (MRFG3)", symbol: "MRFG3" }, { name: "M. Dias Branco (MDIA3)", symbol: "MDIA3" }, { name: "Eletrobras (ELET3)", symbol: "ELET3" },
    { name: "Eletrobras PNB (ELET6)", symbol: "ELET6" }, { name: "Copel (CPLE6)", symbol: "CPLE6" }, { name: "Cemig (CMIG4)", symbol: "CMIG4" },
    { name: "Equatorial (EQTL3)", symbol: "EQTL3" }, { name: "Engie Brasil (EGIE3)", symbol: "EGIE3" }, { name: "CPFL Energia (CPFE3)", symbol: "CPFE3" },
    { name: "Taesa (TAEE11)", symbol: "TAEE11" }, { name: "AES Brasil (AESB3)", symbol: "AESB3" }, { name: "Neoenergia (NEOE3)", symbol: "NEOE3" },
    { name: "TIM (TIMS3)", symbol: "TIMS3" }, { name: "Vivo (VIVT3)", symbol: "VIVT3" }, { name: "Oi (OIBR3)", symbol: "OIBR3" },
    { name: "MRV (MRVE3)", symbol: "MRVE3" }, { name: "Cyrela (CYRE3)", symbol: "CYRE3" }, { name: "Direcional (DIRR3)", symbol: "DIRR3" },
    { name: "EZTec (EZTC3)", symbol: "EZTC3" }, { name: "Trisul (TRIS3)", symbol: "TRIS3" }, { name: "Even (EVEN3)", symbol: "EVEN3" },
    { name: "JHSF (JHSF3)", symbol: "JHSF3" }, { name: "WEG (WEGE3)", symbol: "WEGE3" }, { name: "Embraer (EMBR3)", symbol: "EMBR3" },
    { name: "Randon (RAPT4)", symbol: "RAPT4" }, { name: "Marcopolo (POMO4)", symbol: "POMO4" }, { name: "Tupy (TUPY3)", symbol: "TUPY3" },
    { name: "Ferbasa (FESA4)", symbol: "FESA4" }, { name: "Suzano (SUZB3)", symbol: "SUZB3" }, { name: "Klabin (KLBN11)", symbol: "KLBN11" },
    { name: "Irani (RANI3)", symbol: "RANI3" }, { name: "Rede D'Or (RDOR3)", symbol: "RDOR3" }, { name: "Hapvida (HAPV3)", symbol: "HAPV3" },
    { name: "Fleury (FLRY3)", symbol: "FLRY3" }, { name: "Qualicorp (QUAL3)", symbol: "QUAL3" }, { name: "Intermédica (GNDI3)", symbol: "GNDI3" },
    { name: "Azul (AZUL4)", symbol: "AZUL4" }, { name: "Gol (GOLL4)", symbol: "GOLL4" }, { name: "Rumo (RAIL3)", symbol: "RAIL3" },
    { name: "CCR (CCRO3)", symbol: "CCRO3" }, { name: "Ecorodovias (ECOR3)", symbol: "ECOR3" }, { name: "Movida (MOVI3)", symbol: "MOVI3" },
    { name: "Localiza (RENT3)", symbol: "RENT3" }, { name: "JSL (JSLG3)", symbol: "JSLG3" }, { name: "Cogna (COGN3)", symbol: "COGN3" },
    { name: "Yduqs (YDUQ3)", symbol: "YDUQ3" }, { name: "Ser Educacional (SEER3)", symbol: "SEER3" }, { name: "Ânima (ANIM3)", symbol: "ANIM3" },
    { name: "BB Seguridade (BBSE3)", symbol: "BBSE3" }, { name: "Porto Seguro (PSSA3)", symbol: "PSSA3" }, { name: "Sul América (SULA11)", symbol: "SULA11" },
    { name: "IRB Brasil (IRBR3)", symbol: "IRBR3" }, { name: "B3 (B3SA3)", symbol: "B3SA3" }, { name: "Cielo (CIEL3)", symbol: "CIEL3" },
    { name: "Iguatemi (IGTI11)", symbol: "IGTI11" }, { name: "Multiplan (MULT3)", symbol: "MULT3" }, { name: "BR Malls (BRML3)", symbol: "BRML3" },
    { name: "Aliansce Sonae (ALSO3)", symbol: "ALSO3" }, { name: "Natura &Co (NTCO3)", symbol: "NTCO3" }, { name: "Hypera (HYPE3)", symbol: "HYPE3" },
    { name: "Raia Drogasil (RADL3)", symbol: "RADL3" }, { name: "Pague Menos (PGMN3)", symbol: "PGMN3" }, { name: "Grupo Mateus (GMAT3)", symbol: "GMAT3" },
    { name: "Smart Fit (SMFT3)", symbol: "SMFT3" }, { name: "CVC (CVCB3)", symbol: "CVCB3" }, { name: "Braskem (BRKM5)", symbol: "BRKM5" },
    { name: "Ultrapar (UGPA3)", symbol: "UGPA3" }, { name: "Cosan (CSAN3)", symbol: "CSAN3" }, { name: "Raízen (RAIZ4)", symbol: "RAIZ4" },
    { name: "3Tentos (TTEN3)", symbol: "TTEN3" }, { name: "SLC Agrícola (SLCE3)", symbol: "SLCE3" }, { name: "Jalles Machado (JALL3)", symbol: "JALL3" }
  ],
  crypto: [
    { name: "Bitcoin (BTC)", symbol: "bitcoin" }, { name: "Ethereum (ETH)", symbol: "ethereum" }, { name: "Tether (USDT)", symbol: "tether" },
    { name: "BNB (BNB)", symbol: "binancecoin" }, { name: "Solana (SOL)", symbol: "solana" }, { name: "XRP (XRP)", symbol: "ripple" },
    { name: "USD Coin (USDC)", symbol: "usd-coin" }, { name: "Cardano (ADA)", symbol: "cardano" }, { name: "Dogecoin (DOGE)", symbol: "dogecoin" },
    { name: "TRON (TRX)", symbol: "tron" }, { name: "Avalanche (AVAX)", symbol: "avalanche-2" }, { name: "Shiba Inu (SHIB)", symbol: "shiba-inu" },
    { name: "Polkadot (DOT)", symbol: "polkadot" }, { name: "Chainlink (LINK)", symbol: "chainlink" }, { name: "Polygon (MATIC)", symbol: "matic-network" },
    { name: "Litecoin (LTC)", symbol: "litecoin" }, { name: "Bitcoin Cash (BCH)", symbol: "bitcoin-cash" }, { name: "Uniswap (UNI)", symbol: "uniswap" },
    { name: "Dai (DAI)", symbol: "dai" }, { name: "Wrapped Bitcoin (WBTC)", symbol: "wrapped-bitcoin" }, { name: "Aave (AAVE)", symbol: "aave" },
    { name: "Maker (MKR)", symbol: "maker" }, { name: "Cosmos (ATOM)", symbol: "cosmos" }, { name: "Stellar (XLM)", symbol: "stellar" },
    { name: "Algorand (ALGO)", symbol: "algorand" }, { name: "VeChain (VET)", symbol: "vechain" }, { name: "Filecoin (FIL)", symbol: "filecoin" },
    { name: "Monero (XMR)", symbol: "monero" }, { name: "Ethereum Classic (ETC)", symbol: "ethereum-classic" }, { name: "Hedera (HBAR)", symbol: "hedera-hashgraph" },
    { name: "Arbitrum (ARB)", symbol: "arbitrum" }, { name: "Near Protocol (NEAR)", symbol: "near" }, { name: "Aptos (APT)", symbol: "aptos" },
    { name: "Internet Computer (ICP)", symbol: "internet-computer" }, { name: "Optimism (OP)", symbol: "optimism" }, { name: "The Graph (GRT)", symbol: "the-graph" },
    { name: "Fantom (FTM)", symbol: "fantom" }, { name: "Quant (QNT)", symbol: "quant-network" }, { name: "Injective (INJ)", symbol: "injective-protocol" },
    { name: "Lido DAO (LDO)", symbol: "lido-dao" }, { name: "Render Token (RNDR)", symbol: "render-token" }, { name: "Immutable X (IMX)", symbol: "immutable-x" },
    { name: "Stacks (STX)", symbol: "blockstack" }, { name: "Theta Network (THETA)", symbol: "theta-token" }, { name: "Sei (SEI)", symbol: "sei-network" },
    { name: "Sui (SUI)", symbol: "sui" }, { name: "Celestia (TIA)", symbol: "celestia" }, { name: "Toncoin (TON)", symbol: "the-open-network" },
    { name: "Flow (FLOW)", symbol: "flow" }, { name: "Axie Infinity (AXS)", symbol: "axie-infinity" }, { name: "The Sandbox (SAND)", symbol: "the-sandbox" },
    { name: "Decentraland (MANA)", symbol: "decentraland" }, { name: "Enjin Coin (ENJ)", symbol: "enjincoin" }, { name: "Gala (GALA)", symbol: "gala" },
    { name: "ApeCoin (APE)", symbol: "apecoin" }, { name: "Floki Inu (FLOKI)", symbol: "floki" }, { name: "Pepe (PEPE)", symbol: "pepe" },
    { name: "Worldcoin (WLD)", symbol: "worldcoin-wld" }
  ]
};

const typeLabels = { fixed_selic: "Selic/CDI", fixed_ipca: "IPCA+", stock: "Ações", crypto: "Crypto" };

// =========================
// Funções auxiliares
// =========================
function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(value) {
  return parseFloat(String(value).replace(/\./g, "").replace(",", ".")) || 0;
}

function showAlert(message, type = "info") {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) return;

  const colors = {
    info: "bg-blue-900 border-blue-600 text-blue-100",
    error: "bg-red-900 border-red-600 text-red-100",
    warning: "bg-yellow-900 border-yellow-600 text-yellow-100"
  };
  const alertClass = colors[type] || colors.info;

  alertContainer.innerHTML = `<div class="rounded-lg p-4 border-l-4 ${alertClass}">${message}</div>`;
  window.clearTimeout(showAlert._t);
  showAlert._t = window.setTimeout(() => { alertContainer.innerHTML = ""; }, 5000);
}

function handleValueChange(e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value) {
    value = (parseInt(value, 10) / 100).toFixed(2);
    e.target.value = formatCurrency(parseFloat(value));
  }
}

function countBusinessDays(startDate, endDate) {
  let count = 0;
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  // Normaliza horário para evitar bugs por timezone/dst
  currentDate.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
}

function formatDateBR(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function fetchJson(url, { timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function lastOfArray(arr) {
  return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
}

// =========================
// LocalStorage
// =========================
function saveInvestments() {
  localStorage.setItem("investments", JSON.stringify(investments));
}

function loadInvestments() {
  const saved = localStorage.getItem("investments");
  if (saved) investments = JSON.parse(saved);
}

// =========================
// APIs externas (ATUAIS 2025)
// =========================

// BCB/SGS (oficial):
// Selic anualizada base 252: série 1178
// IPCA variação % mensal: série 433
async function fetchBCBSeries(seriesCode, startDate, endDate) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;
  return fetchJson(url, { timeoutMs: 20000 });
}

function parseBCBValue(item) {
  // Formato típico: { data: "26/12/2025", valor: "11.75" }
  if (!item) return null;
  const n = Number(String(item.valor).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function computeIpca12mFromMonthlyRates(monthlyRates) {
  // monthlyRates: array de % mensais (ex.: 0.42 = 0,42%)
  // 12m acumulado ≈ (Π(1 + m/100) - 1) * 100
  if (!Array.isArray(monthlyRates) || monthlyRates.length < 12) return 0;

  const last12 = monthlyRates.slice(-12);
  let acc = 1;
  for (const m of last12) {
    acc *= (1 + (m / 100));
  }
  return (acc - 1) * 100;
}

async function fetchMarketData() {
  try {
    // Pega janela segura (últimos ~18 meses) para garantir ter 12 pontos do IPCA mensal
    const today = new Date();
    const start = formatDateBR(addDays(today, -550));
    const end = formatDateBR(today);

    const [selicSeries, ipcaSeries] = await Promise.all([
      fetchBCBSeries(1178, start, end),
      fetchBCBSeries(433, start, end)
    ]);

    const lastSelic = lastOfArray(selicSeries);
    const lastIpca = lastOfArray(ipcaSeries);

    const selicAnnual = parseBCBValue(lastSelic); // % a.a.
    const ipcaMonthly = parseBCBValue(lastIpca);  // % no mês

    const ipcaMonthlyList = ipcaSeries
      .map(parseBCBValue)
      .filter(v => typeof v === "number" && Number.isFinite(v));

    const ipca12m = computeIpca12mFromMonthlyRates(ipcaMonthlyList);

    // Guardar em marketData (percentuais)
    marketData.selic = selicAnnual || 0;
    marketData.ipca = ipcaMonthly || 0;
    marketData.ipca12m = ipca12m || 0;

    const selicEl = document.getElementById("selicRate");
    const ipcaEl = document.getElementById("ipcaRate");

    if (selicEl) selicEl.textContent = `Selic (a.a.): ${marketData.selic.toFixed(2)}%`;
    if (ipcaEl) ipcaEl.textContent = `IPCA 12m: ${marketData.ipca12m.toFixed(2)}% (mês: ${marketData.ipca.toFixed(2)}%)`;
  } catch (error) {
    console.error("Erro ao buscar taxas (BCB):", error);
    showAlert("⚠️ Não foi possível carregar Selic/IPCA agora. Verifique sua conexão e tente novamente.", "warning");

    // fallback mínimo: mantém 0 (evita cálculo errado silencioso)
    marketData.selic = marketData.selic || 0;
    marketData.ipca = marketData.ipca || 0;
    marketData.ipca12m = marketData.ipca12m || 0;

    const selicEl = document.getElementById("selicRate");
    const ipcaEl = document.getElementById("ipcaRate");
    if (selicEl) selicEl.textContent = `Selic (a.a.): --`;
    if (ipcaEl) ipcaEl.textContent = `IPCA 12m: --`;
  }
}

// Ações (B3) via brapi.dev (recomendado)
// Observação: sem token, alguns ativos podem falhar/limitar.
async function getStockPrice(symbol) {
  try {
    if (!symbol) return null;

    // NU é listado na NYSE, brapi pode não ter. Nesse caso tentamos fallback no Yahoo.
    // Para B3: "ITUB4", "PETR4", etc.
    if (symbol === "NU") {
      return await getYahooPrice("NU");
    }

    const tokenParam = BRAPI_TOKEN ? `&token=${encodeURIComponent(BRAPI_TOKEN)}` : "";
    const url = `https://brapi.dev/api/quote/${encodeURIComponent(symbol)}?range=1d&interval=1d${tokenParam}`;
    const data = await fetchJson(url, { timeoutMs: 20000 });

    const result = data?.results?.[0];
    const price = result?.regularMarketPrice;

    if (typeof price === "number" && Number.isFinite(price)) return price;
    return null;
  } catch (error) {
    console.error("Erro ao buscar cotação (brapi):", error);
    return null;
  }
}

// Fallback Yahoo (pode sofrer CORS dependendo do ambiente)
async function getYahooPrice(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const data = await fetchJson(url, { timeoutMs: 20000 });
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (typeof price === "number" && Number.isFinite(price)) return price;
    return null;
  } catch (e) {
    return null;
  }
}

// Crypto via CoinGecko
async function getCryptoPrice(symbol) {
  try {
    if (!symbol) return null;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(symbol)}&vs_currencies=brl`;
    const data = await fetchJson(url, { timeoutMs: 20000 });
    const price = data?.[symbol]?.brl;
    if (typeof price === "number" && Number.isFinite(price)) return price;
    return null;
  } catch (error) {
    console.error("Erro ao buscar cotação de crypto (CoinGecko):", error);
    return null;
  }
}

async function getHistoricalStockPrice(symbol, date) {
  // Em produção, ideal usar histórico do brapi (ou seu backend).
  // Aqui: tentativa simples via brapi (range) -> fallback preço atual.
  try {
    const current = await getStockPrice(symbol);
    return current;
  } catch (e) {
    return await getStockPrice(symbol);
  }
}

async function getHistoricalCryptoPrice(symbol, date) {
  try {
    const dateStr = new Date(date).toISOString().split("T")[0].split("-").reverse().join("-");
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(symbol)}/history?date=${dateStr}&localization=false`;
    const data = await fetchJson(url, { timeoutMs: 20000 });
    const price = data?.market_data?.current_price?.brl;
    if (typeof price === "number" && Number.isFinite(price)) return price;
    return await getCryptoPrice(symbol);
  } catch (error) {
    return await getCryptoPrice(symbol);
  }
}

// =========================
// Cálculos
// =========================
async function calculateCurrentValue(investment) {
  const { type, initialValue, date, rate, quantity, symbol } = investment;

  if (type === "stock") {
    const currentPrice = await getStockPrice(symbol);
    return currentPrice ? (quantity * currentPrice) : initialValue;
  }

  if (type === "crypto") {
    const currentPrice = await getCryptoPrice(symbol);
    return currentPrice ? (quantity * currentPrice) : initialValue;
  }

  const startDate = new Date(date);
  const today = new Date();
  const businessDays = countBusinessDays(startDate, today);
  const years = businessDays / 252;

  // Selic a.a. (1178) -> efetivo proporcional ao % do CDI do produto
  if (type === "fixed_selic") {
    const selicAnnual = (marketData.selic || 0) / 100;   // 0.1175
    const multiplier = (rate || 0) / 100;                // 1.10 (110% CDI)
    const effectiveAnnual = selicAnnual * multiplier;    // aproximação CDI ~ Selic (para tracking)
    return initialValue * Math.pow(1 + effectiveAnnual, years);
  }

  // IPCA+: usa IPCA 12m como inflação base a.a. + taxa real do título (rate a.a.)
  if (type === "fixed_ipca") {
    const ipcaAnnual = (marketData.ipca12m || 0) / 100;  // 0.0462
    const realRate = (rate || 0) / 100;                  // 0.06
    const totalAnnual = ipcaAnnual + realRate;           // aproximação simples
    return initialValue * Math.pow(1 + totalAnnual, years);
  }

  return initialValue;
}

// =========================
// Event handlers
// =========================
document.getElementById("invType")?.addEventListener("change", function (e) {
  const optionSelect = document.getElementById("invOption");
  const type = e.target.value;

  if (!optionSelect) return;

  if (!type) {
    optionSelect.classList.add("hidden");
    return;
  }

  optionSelect.innerHTML = '<option value="">Selecione o investimento</option>';
  investmentOptions[type].forEach((opt, idx) => {
    const option = document.createElement("option");
    option.value = String(idx);
    option.textContent = opt.name;
    optionSelect.appendChild(option);
  });

  optionSelect.classList.remove("hidden");
});

document.getElementById("invValue")?.addEventListener("input", handleValueChange);
document.getElementById("submitBtn")?.addEventListener("click", addInvestment);

// =========================
// CRUD
// =========================
async function addInvestment() {
  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Processando...";

  try {
    const type = document.getElementById("invType")?.value;
    const optionIdxStr = document.getElementById("invOption")?.value;
    const valueStr = document.getElementById("invValue")?.value;
    const date = document.getElementById("invDate")?.value;

    if (!type || optionIdxStr === "" || !valueStr || !date) {
      throw new Error("Preencha todos os campos");
    }

    const optionIdx = Number(optionIdxStr);
    if (!Number.isFinite(optionIdx)) throw new Error("Seleção inválida");

    const value = parseCurrency(valueStr);
    if (value <= 0) throw new Error("Valor inválido");

    const selected = investmentOptions[type][optionIdx];
    if (!selected) throw new Error("Investimento inválido");

    const investment = {
      id: Date.now(),
      type,
      name: selected.name,
      initialValue: value,
      date,
      rate: selected.rate
    };

    if (type === "stock" || type === "crypto") {
      investment.symbol = selected.symbol;

      showAlert("Buscando cotação atual...", "info");

      const currentPrice = (type === "stock")
        ? await getStockPrice(selected.symbol)
        : await getCryptoPrice(selected.symbol);

      if (!currentPrice) throw new Error("Não foi possível obter a cotação (tente novamente)");

      investment.quantity = value / currentPrice;
      investment.avgPrice = currentPrice;
    }

    investments.push(investment);
    saveInvestments();

    const invTypeEl = document.getElementById("invType");
    const invOptionEl = document.getElementById("invOption");
    const invValueEl = document.getElementById("invValue");
    const invDateEl = document.getElementById("invDate");

    if (invTypeEl) invTypeEl.value = "";
    if (invOptionEl) {
      invOptionEl.value = "";
      invOptionEl.classList.add("hidden");
    }
    if (invValueEl) invValueEl.value = "";
    if (invDateEl) invDateEl.value = new Date().toISOString().split("T")[0];

    showAlert("✅ Investimento adicionado com sucesso!", "info");
    await renderInvestments();
    await updateSummary();
    await renderTopPerformers();
  } catch (error) {
    showAlert(`Erro: ${error.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Adicionar Investimento";
  }
}

function deleteInvestment(id) {
  if (!confirm("Deseja realmente excluir este investimento?")) return;
  investments = investments.filter(inv => inv.id !== id);
  saveInvestments();
  renderInvestments();
  updateSummary();
  renderTopPerformers();
  showAlert("Investimento excluído", "info");
}

// =========================
// Render
// =========================
async function renderInvestments() {
  const container = document.getElementById("investmentList");
  const topBox = document.getElementById("topPerformersContainer");

  if (!container) return;

  if (investments.length === 0) {
    container.innerHTML = '<div class="text-center py-12 text-gray-500">Nenhum investimento cadastrado ainda</div>';
    topBox?.classList.add("hidden");
    return;
  }

  container.innerHTML = '<div class="text-center py-8 text-gray-400">Carregando cotações...</div>';
  topBox?.classList.remove("hidden");

  const html = await Promise.all(investments.map(async inv => {
    const currentValue = await calculateCurrentValue(inv);
    investmentValues[inv.id] = currentValue;

    const profit = currentValue - inv.initialValue;
    const profitPercent = (inv.initialValue > 0) ? ((profit / inv.initialValue) * 100) : 0;
    const businessDays = countBusinessDays(new Date(inv.date), new Date());

    return `
      <div class="bg-gray-800 rounded-xl p-6 mb-4 border border-gray-700 hover:border-purple-500 transition-all">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-xl font-bold text-white mb-2">${inv.name}</div>
            <span class="inline-block px-3 py-1 bg-purple-600 text-white text-xs rounded-full">${typeLabels[inv.type]}</span>
          </div>
          <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all" onclick="deleteInvestment(${inv.id})">
            Excluir
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          ${inv.quantity ? `
            <div>
              <div class="text-gray-400 text-xs mb-1">Quantidade</div>
              <div class="text-white font-semibold">${inv.quantity.toFixed(8)}</div>
            </div>
            <div>
              <div class="text-gray-400 text-xs mb-1">Preço Médio</div>
              <div class="text-white font-semibold">R$ ${formatCurrency(inv.avgPrice)}</div>
            </div>
          ` : ""}
          <div>
            <div class="text-gray-400 text-xs mb-1">Investido</div>
            <div class="text-white font-semibold">R$ ${formatCurrency(inv.initialValue)}</div>
          </div>
          <div>
            <div class="text-gray-400 text-xs mb-1">Valor Atual</div>
            <div class="text-white font-semibold">R$ ${formatCurrency(currentValue)}</div>
          </div>
          <div>
            <div class="text-gray-400 text-xs mb-1">Rentabilidade</div>
            <div class="font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}">
              ${profit >= 0 ? "+" : ""}R$ ${formatCurrency(Math.abs(profit))}
            </div>
            <div class="text-sm ${profit >= 0 ? "text-green-400" : "text-red-400"}">
              (${profitPercent.toFixed(2)}%)
            </div>
            ${(inv.type === "fixed_selic" || inv.type === "fixed_ipca")
              ? `<div class="text-gray-500 text-xs mt-1">${businessDays} dias úteis</div>`
              : ""}
          </div>
          <div>
            <div class="text-gray-400 text-xs mb-1">Data</div>
            <div class="text-white font-semibold">${new Date(inv.date).toLocaleDateString("pt-BR")}</div>
          </div>
        </div>
      </div>
    `;
  }));

  container.innerHTML = html.join("");
}

async function updateSummary() {
  const container = document.getElementById("summaryCards");
  if (!container) return;

  if (investments.length === 0) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");

  const totalInvested = investments.reduce((acc, inv) => acc + inv.initialValue, 0);
  const totalCurrent = Object.values(investmentValues).reduce((acc, val) => acc + val, 0);
  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

  const isUp = totalProfit >= 0;
  const color = isUp ? "green" : "red";

  container.innerHTML = `
    <div class="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-center">
      <div class="text-purple-200 text-sm mb-2">Total Investido</div>
      <div class="text-white text-3xl font-bold">R$ ${formatCurrency(totalInvested)}</div>
    </div>
    <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-center">
      <div class="text-blue-200 text-sm mb-2">Patrimônio Atual</div>
      <div class="text-white text-3xl font-bold">R$ ${formatCurrency(totalCurrent)}</div>
    </div>
    <div class="bg-gradient-to-br from-${color}-600 to-${color}-700 rounded-xl p-6 text-center">
      <div class="text-${color}-200 text-sm mb-2">Rentabilidade</div>
      <div class="text-white text-3xl font-bold">${isUp ? "+" : ""}R$ ${formatCurrency(Math.abs(totalProfit))}</div>
      <div class="text-${color}-200 text-sm mt-2">(${totalProfitPercent.toFixed(2)}%)</div>
    </div>
  `;
}

function getFilteredInvestments() {
  if (periodFilter === "all") return investments;

  const now = new Date();
  const periods = { week: 7, month: 30, quarter: 90, year: 365 };
  const daysBack = periods[periodFilter] || 30;
  const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

  return investments.filter(inv => new Date(inv.date) >= cutoffDate);
}

async function renderTopPerformers() {
  const container = document.getElementById("topPerformersList");
  if (!container) return;

  const filtered = getFilteredInvestments();

  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-gray-500">Nenhum investimento no período selecionado</div>';
    return;
  }

  container.innerHTML = '<div class="text-center py-8 text-gray-400">Calculando performances...</div>';

  const performances = await Promise.all(filtered.map(async inv => {
    const currentValue = investmentValues[inv.id] || await calculateCurrentValue(inv);
    const profit = currentValue - inv.initialValue;
    const profitPercent = inv.initialValue > 0 ? ((profit / inv.initialValue) * 100) : 0;
    return { ...inv, currentValue, profit, profitPercent };
  }));

  const sorted = performances
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 10);

  if (sorted.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-gray-500">Nenhum dado disponível</div>';
    return;
  }

  const html = sorted.map((inv, idx) => `
    <div class="flex items-center gap-4 p-4 bg-gray-800 rounded-lg mb-3 hover:bg-gray-750 transition-all">
      <div class="text-2xl font-bold text-purple-400 w-8">#${idx + 1}</div>
      <div class="flex-1">
        <div class="font-semibold text-white">${inv.name}</div>
        <div class="text-sm text-gray-400">${typeLabels[inv.type]}</div>
      </div>
      <div class="text-right">
        <div class="font-bold ${inv.profit >= 0 ? "text-green-400" : "text-red-400"}">
          ${inv.profit >= 0 ? "+" : ""}${inv.profitPercent.toFixed(2)}%
        </div>
        <div class="text-sm text-gray-400">
          R$ ${formatCurrency(Math.abs(inv.profit))}
        </div>
      </div>
    </div>
  `).join("");

  container.innerHTML = html;
}

document.getElementById("periodFilter")?.addEventListener("change", function (e) {
  periodFilter = e.target.value;
  renderTopPerformers();
});

// =========================
// Dados de mercado em tempo real (simulado)
// =========================
async function fetchMarketGainers() {
  const container = document.getElementById('marketGainersList');

  try {
    const response = await fetch(
      'https://brapi.dev/api/quote/list?sortBy=change&sortOrder=desc&limit=10'
    );
    const data = await response.json();

    if (!data.stocks) throw new Error('Dados inválidos');

    const html = data.stocks.map((stock, idx) => `
      <div class="flex items-center gap-4 p-4 bg-gray-800 rounded-lg mb-3">
        <div class="text-2xl font-bold text-green-400 w-8">#${idx + 1}</div>
        <div class="flex-1">
          <div class="font-semibold text-white">${stock.name}</div>
          <div class="text-sm text-gray-400">${stock.stock}</div>
        </div>
        <div class="text-right">
          <div class="text-white font-semibold">
            R$ ${stock.close.toFixed(2)}
          </div>
          <div class="text-green-400 font-bold">
            +${stock.change.toFixed(2)}%
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;

  } catch (error) {
    container.innerHTML =
      '<div class="text-center py-8 text-red-400">Erro ao carregar dados reais</div>';
  }
}



async function fetchMarketLosers() {
  const container = document.getElementById('marketLosersList');

  try {
    const response = await fetch(
      'https://brapi.dev/api/quote/list?sortBy=change&sortOrder=asc&limit=10'
    );
    const data = await response.json();

    if (!data.stocks) throw new Error('Dados inválidos');

    const html = data.stocks.map((stock, idx) => `
      <div class="flex items-center gap-4 p-4 bg-gray-800 rounded-lg mb-3">
        <div class="text-2xl font-bold text-green-400 w-8">#${idx + 1}</div>
        <div class="flex-1">
          <div class="font-semibold text-white">${stock.name}</div>
          <div class="text-sm text-gray-400">${stock.stock}</div>
        </div>
        <div class="text-right">
          <div class="text-white font-semibold">
            R$ ${stock.close.toFixed(2)}
          </div>
<div class="font-bold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}">
  ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%
</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;

  } catch (error) {
    container.innerHTML =
      '<div class="text-center py-8 text-red-400">Erro ao carregar dados reais</div>';
  }
}


// =========================
// Inicialização
// =========================
async function init() {
  loadInvestments();
  await fetchMarketData();
  await fetchMarketGainers();
  await fetchMarketLosers();

  const invDate = document.getElementById("invDate");
  if (invDate) invDate.value = new Date().toISOString().split("T")[0];

  if (investments.length > 0) {
    await renderInvestments();
    await updateSummary();
    await renderTopPerformers();
  }
}

// Iniciar aplicação
init();
