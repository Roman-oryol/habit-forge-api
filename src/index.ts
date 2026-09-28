import express from 'express';

const app = express();
app.use(express.json());

const habits = [
  { id: 1, name: 'Sample habit 1' },
  { id: 2, name: 'Sample habit 2' },
];

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello!' });
});

app.get('/habits/:id', (req, res) => {
  const habitId = req.params.id;
  const habit = habits.find((h) => h.id === parseInt(habitId));
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  res.json(habit);
});

app.get('/habits', (req, res) => {
  res.json(habits);
});

app.post('/habits', (req, res) => {
  const { name } = req.body;
  const newHabit = { id: habits.length + 1, name };
  habits.push(newHabit);
  res.status(201).json(newHabit);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
