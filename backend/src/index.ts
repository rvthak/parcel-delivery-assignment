import app from './app';

const port = parseInt(process.env.BACKEND_PORT || '3001', 10);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
