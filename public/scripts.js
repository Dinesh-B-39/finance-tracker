let userData = {
    transactions: [],
    savingGoals: [],
    categories: ['Food', 'Housing', 'Transportation', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Utilities', 'Travel', 'Income', 'Other']
};

let expenseChart;
let monthlyExpensesChart;
let categoryBreakdownChart;

function initApp() {
    // Check authentication
    fetch('http://localhost:3000/api/transactions', {
        method: 'GET',
        credentials: 'include' // Include cookies for session
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = 'login.html';
            return [];
        }
        return response.json();
    })
    .then(data => {
        userData.transactions = data;
        return fetch('http://localhost:3000/api/goals', { credentials: 'include' });
    })
    .then(response => response.json())
    .then(data => {
        userData.savingGoals = data;
        renderAll();
    })
    .catch(err => console.error('Init error:', err));

    document.querySelectorAll('.tab-link').forEach(tab => tab.addEventListener('click', switchTab));
    populateCategories();
}

function populateCategories() {
    const categorySelect = document.getElementById('transactionCategory');
    categorySelect.innerHTML = '<option value="">Select category</option>';
    userData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function switchTab(e) {
    e.preventDefault();
    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(e.target.dataset.tab).classList.add('active');
}

document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault(); // prevent anchor default jump
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
            window.location.href = '/login.html'; // redirect to login page
        } else {
            alert(data.message || 'Logout failed');
        }
    } catch (err) {
        console.error('Logout error:', err);
    }
});

function addTransaction() {
    const description = document.getElementById('transactionDescription').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    const type = document.querySelector('input[name="transactionType"]:checked').value;
    const finalAmount = type === 'expense' ? -amount : amount;

    fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ description, amount: finalAmount, category, date, type })
    })
    .then(response => response.json())
    .then(data => {
        userData.transactions.push(data);
        renderAll();
        closeAddTransactionModal();
    });
}

function deleteTransaction(id) {
    fetch(`http://localhost:3000/api/transactions/${id}`, { method: 'DELETE', credentials: 'include' })
        .then(() => {
            userData.transactions = userData.transactions.filter(t => t.id !== id);
            renderAll();
        });
}

function addSavingGoal() {
    const name = document.getElementById('goalName').value;
    const targetAmount = parseFloat(document.getElementById('goalAmount').value);
    const deadline = document.getElementById('goalDeadline').value;

    fetch('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, targetAmount, currentAmount: 0, deadline })
    })
    .then(response => response.json())
    .then(data => {
        userData.savingGoals.push(data);
        renderGoals();
        closeAddGoalModal();
    });
}

function submitGoalUpdate() {
    const id = document.getElementById('updateGoalId').value;
    const amount = parseFloat(document.getElementById('updateGoalAmount').value);
    console.log(id)

    fetch(`http://localhost:3000/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount })
    })
    .then(response => response.json())
    .then(data => {
        const goal = userData.savingGoals.find(g => g._id === id);
        goal.currentAmount = data.currentAmount;
        renderGoals();
        closeUpdateGoalModal();
    });
}

function deleteGoal(id) {
    if (!id) {
        console.error('Goal ID is undefined');
        return;
    }

    fetch(`http://localhost:3000/api/goals/${id}`, { method: 'DELETE', credentials: 'include' })
        .then(response => {
            if (response.ok) {
                userData.savingGoals = userData.savingGoals.filter(g => g._id !== id);
                renderGoals();
            } else {
                console.error('Failed to delete goal:', response.statusText);
            }
        })
        .catch(error => console.error('Error:', error));
}

function calculateTotalIncome() {
    return userData.transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
}

function calculateTotalExpenses() {
    return userData.transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

function calculateBalance() {
    return userData.transactions.reduce((sum, t) => sum + t.amount, 0);
}

function getExpensesByCategory() {
    const expenses = {};
    userData.transactions.filter(t => t.amount < 0).forEach(t => {
        expenses[t.category] = (expenses[t.category] || 0) + Math.abs(t.amount);
    });
    return expenses;
}

function getExpensesByMonth() {
    const expenses = {};
    userData.transactions.filter(t => t.amount < 0).forEach(t => {
        const month = t.date.slice(0, 7);
        expenses[month] = (expenses[month] || 0) + Math.abs(t.amount);
    });
    return Object.fromEntries(Object.entries(expenses).sort());
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderAll() {
    renderDashboard();
    renderTransactions();
    renderGoals();
    renderAnalytics();
}

function renderDashboard() {
    document.getElementById('totalIncome').textContent = `₹${calculateTotalIncome().toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `₹${calculateTotalExpenses().toFixed(2)}`;
    document.getElementById('currentBalance').textContent = `₹${calculateBalance().toFixed(2)}`;

    const recent = userData.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const recentList = document.getElementById('recentTransactionsList');
    recentList.innerHTML = recent.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td class="transaction-amount ${t.amount > 0 ? 'positive' : 'negative'}">₹${Math.abs(t.amount).toFixed(2)}</td>
        </tr>
    `).join('');

    // Destroy existing chart if it exists
    if (expenseChart) {
        expenseChart.destroy();
    }

    // Create a new chart
    expenseChart = new Chart(document.getElementById('expenseChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(getExpensesByCategory()),
            datasets: [{ data: Object.values(getExpensesByCategory()), backgroundColor: userData.categories.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`) }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderTransactions() {
    const list = document.getElementById('transactionList');
    list.innerHTML = userData.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td class="transaction-amount ${t.amount > 0 ? 'positive' : 'negative'}">₹${Math.abs(t.amount).toFixed(2)}</td>
            <td><button class="action-btn delete" onclick="deleteTransaction(${t.id})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function renderGoals() {
    const list = document.getElementById('savingGoalsList');
    list.innerHTML = userData.savingGoals.map(g => `
        <div class="goal-item">
            <div>
                <strong>${g.name}</strong> - ₹${g.currentAmount.toFixed(2)} / ₹${g.targetAmount.toFixed(2)} (Due: ${formatDate(g.deadline)})
                <div class="goal-progress"><div class="goal-progress-bar" style="width: ${(g.currentAmount / g.targetAmount) * 100}%"></div></div>
            </div>
            <div>
                <button class="action-btn edit" onclick="openUpdateGoalModal('${g._id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteGoal('${g._id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderAnalytics() {
    // Destroy existing charts if they exist
    if (monthlyExpensesChart) {
        monthlyExpensesChart.destroy();
    }
    if (categoryBreakdownChart) {
        categoryBreakdownChart.destroy();
    }

    // Create new charts
    monthlyExpensesChart = new Chart(document.getElementById('monthlyExpensesChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(getExpensesByMonth()),
            datasets: [{ label: 'Expenses', data: Object.values(getExpensesByMonth()), backgroundColor: '#3498db' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    categoryBreakdownChart = new Chart(document.getElementById('categoryBreakdown'), {
        type: 'pie',
        data: {
            labels: Object.keys(getExpensesByCategory()),
            datasets: [{ data: Object.values(getExpensesByCategory()), backgroundColor: userData.categories.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`) }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function openAddTransactionModal() {
    document.getElementById('transactionForm').reset();
    document.getElementById('addTransactionModal').style.display = 'block';
}

function closeAddTransactionModal() {
    document.getElementById('addTransactionModal').style.display = 'none';
}

function openAddGoalModal() {
    document.getElementById('goalForm').reset();
    document.getElementById('addGoalModal').style.display = 'block';
}

function closeAddGoalModal() {
    document.getElementById('addGoalModal').style.display = 'none';
}

function openUpdateGoalModal(id) {
    document.getElementById('updateGoalId').value = id;
    document.getElementById('updateGoalModal').style.display = 'block';
}

function closeUpdateGoalModal() {
    document.getElementById('updateGoalModal').style.display = 'none';
}