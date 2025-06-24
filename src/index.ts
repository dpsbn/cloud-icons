import express from 'express';
import cors from 'cors';
import path from 'path';
import iconsRouter from './routes/icons';

const app = express();
const PORT = process.env.PORT || 3002;

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// Mount the icons router at root BEFORE static file serving
app.use('/', iconsRouter);

// Serve static files AFTER route handling
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
