import express from 'express';
import { habitsRouter } from './routes/habits.js';

const app = express();
app.use(express.json());
app.use('/api/v1/habits', habitsRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

export default app;
