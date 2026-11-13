const form = document.getElementById("transaction-form");
const list = document.getElementById("transaction-list");
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance");
const progressBar = document.getElementById("progress-bar");
const search = document.getElementById("search");
const filterType = document.getElementById("filter-type");
const toggleTheme = document.getElementById("toggleTheme");
const resetApp = document.getElementById("resetApp");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const amount = +document.getElementById("amount").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  const transaction = {
    id: Date.now(),
    title,
    amount,
    type,
    category,
    date,
  };

  transactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  form.reset();
  renderTransactions();
});

function renderTransactions() {
  list.innerHTML = "";
  const filtered = transactions.filter((t) => {
    const matchesType =
      filterType.value === "all" || t.type === filterType.value;
    const matchesSearch = t.title
      .toLowerCase()
      .includes(search.value.toLowerCase());
    return matchesType && matchesSearch;
  });

  filtered.forEach((t) => {
    const li = document.createElement("li");
    li.classList.add("tx-item", t.type);
    li.innerHTML = `
      <span>${t.title} (${t.category}) - ${t.date}</span>
      <strong>${t.type === "income" ? "+" : "-"}₹${t.amount}</strong>
    `;
    list.appendChild(li);
  });

  updateStats();
  renderCharts();
}

function updateStats() {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  totalIncomeEl.textContent = `₹${income}`;
  totalExpenseEl.textContent = `₹${expense}`;
  balanceEl.textContent = `₹${balance}`;

  const progress = income ? Math.min((expense / income) * 100, 100) : 0;
  progressBar.style.width = progress + "%";
}

let pieChart, barChart;

function renderCharts() {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const ctxPie = document.getElementById("pieChart").getContext("2d");
  const ctxBar = document.getElementById("barChart").getContext("2d");

  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  pieChart = new Chart(ctxPie, {
    type: "doughnut",
    data: {
      labels: ["Income", "Expense"],
      datasets: [
        {
          data: [income, expense],
          backgroundColor: ["#22c55e", "#ef4444"],
          borderWidth: 2,
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom", labels: { color: "#666" } },
      },
    },
  });

  const categories = [...new Set(transactions.map((t) => t.category))];
  const categoryData = categories.map((c) =>
    transactions
      .filter((t) => t.category === c)
      .reduce((acc, t) => acc + t.amount, 0)
  );

  barChart = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: categories,
      datasets: [
        {
          label: "Amount by Category",
          data: categoryData,
          backgroundColor: [
            "#3b82f6",
            "#f59e0b",
            "#10b981",
            "#8b5cf6",
            "#f87171",
            "#14b8a6",
          ],
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: "#666" } },
        y: { ticks: { color: "#666" } },
      },
    },
  });
}

search.addEventListener("input", renderTransactions);
filterType.addEventListener("change", renderTransactions);

toggleTheme.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  toggleTheme.textContent = isDark ? "☀️" : "🌙";
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  toggleTheme.textContent = "☀️";
}

resetApp.addEventListener("click", () => {
  if (confirm("Reset all data?")) {
    localStorage.clear();
    transactions = [];
    renderTransactions();
  }
});

renderTransactions();