const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'store.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const salt = bcrypt.genSaltSync(10);
    const demoHashedPassword = bcrypt.hashSync('demo1234', salt);

    const initial = {
      users: [
        {
          _id: 'demo-user-1',
          name: 'Shaheem Demo',
          email: 'demo@example.com',
          password: demoHashedPassword,
          avatar: '',
          createdAt: new Date().toISOString()
        }
      ],
      transactions: [
        {
          _id: 'sample-1',
          user: 'demo-user-1',
          type: 'income',
          amount: 50000,
          category: 'Salary',
          date: '2026-10-01',
          note: 'October Monthly Salary',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'sample-2',
          user: 'demo-user-1',
          type: 'expense',
          amount: 1250,
          category: 'Food',
          date: '2026-10-27',
          note: 'Groceries & fruits',
          createdAt: new Date().toISOString()
        }
      ],
      budgets: {
        'demo-user-1_2026-10': 30000
      }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

function loadData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) parsed.users = [];
    if (!parsed.transactions) parsed.transactions = [];
    if (!parsed.budgets) parsed.budgets = {};
    return parsed;
  } catch (err) {
    return { users: [], transactions: [], budgets: {} };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving fallback data:', err);
  }
}

module.exports = {
  loadData,
  saveData
};
