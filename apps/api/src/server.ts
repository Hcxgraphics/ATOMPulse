import { app } from './app';
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`AtomPulse API is running on http://localhost:${port}`);
});
