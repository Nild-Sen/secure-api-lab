const express = require('express');

// Імпортуємо всі дані один раз
const { users, documents, employees } = require('./data');

const app = express();
const PORT = 3000;

// Middleware для автоматичного парсингу JSON-тіла запиту
app.use(express.json());

// --- MIDDLEWARE ---

// Logging middleware
const loggingMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  console.log(`[${timestamp}] ${method} ${url}`);
  next();
};
app.use(loggingMiddleware);

// Auth middleware
const authMiddleware = (req, res, next) => {
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];

  const user = users.find(u => u.login === login && u.password === password);

  if (!user) {
    return res.status(401).json({
      message: 'Authentication failed. Please provide valid credentials in headers X-Login and X-Password.'
    });
  }

  req.user = user;
  next();
};

// Admin only middleware
const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// --- МАРШРУТИ ДЛЯ РЕСУРСІВ ---

// Отримання документів
app.get('/documents', authMiddleware, (req, res) => {
  res.status(200).json(documents);
});

// Створення документа
app.post('/documents', authMiddleware, (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Bad Request. Fields "title" and "content" are required.' });
  }

  const newDocument = {
    id: Date.now(),
    title,
    content,
  };

  documents.push(newDocument);
  res.status(201).json(newDocument);
});

// Отримання списку працівників (admin only)
app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

// Видалення документа за id
app.delete('/documents/:id', authMiddleware, (req, res) => {
  const documentId = parseInt(req.params.id);
  const documentIndex = documents.findIndex(doc => doc.id === documentId);

  if (documentIndex === -1) {
    return res.status(404).json({ message: 'Document not found' });
  }

  documents.splice(documentIndex, 1);
  res.status(204).send();
});

// --- КІНЕЦЬ МАРШРУТІВ ---

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
