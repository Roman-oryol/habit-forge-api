import express from 'express';
import { habitsRouter } from './routes/habits.js';
import { categoriesRouter } from './routes/categories.js';

const app = express();
app.use(express.json());
app.use('/api/v1/habits', habitsRouter);
app.use('/api/v1/categories', categoriesRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

export default app;
