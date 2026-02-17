// src/index.ts - load env first so Supabase/OpenRouter config see vars (e.g. on Render)
import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
