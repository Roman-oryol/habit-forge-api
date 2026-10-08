import express from 'express';
import cors from 'cors';
import { habitsRouter } from './routes/habits.js';
import { categoriesRouter } from './routes/categories.js';

const PORT = process.env.PORT ?? 3000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const app = express();
app.use(
  cors({
    origin: [FRONTEND_URL],
  }),
);
app.use(express.json());
app.use('/api/v1/habits', habitsRouter);
app.use('/api/v1/categories', categoriesRouter);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

export default app;
