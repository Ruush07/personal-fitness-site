# Personal Fitness Coach

A full-stack fitness tracker and personal training companion built with Next.js, TypeScript, Supabase, Gemini, and Recharts. Users can track nutrition and activity, create routines, log workouts, and review progress.

## Features

- Supabase email and password sign-in, sign-out, and password recovery pages.
- Personal dashboard with daily nutrition and step totals.
- Weight logging and a Recharts weight history graph.
- AI routine drafts personalized by training goal, experience, weekly schedule, equipment, and focus.
- Workout recommendations based on saved routines and recent workout logs.
- Workout logs with completed-set scoring, past-load guidance, and potential personal-record prompts.
- Gemini-powered meal estimates.

Workout suggestions are based only on data the user has entered. The completion score is completed planned sets divided by total planned sets. Weight suggestions are optional prompts; they are not guarantees or medical advice.

## Run locally

1. Install Node.js and clone this repository.
2. Install dependencies with `npm install`.
3. Create a `.env.local` file in the project root with:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   GEMINI_API_KEY=your-google-gemini-api-key
   ```

   Keep `GEMINI_API_KEY` private. Do not commit `.env.local` or paste secret keys into public issues.

4. In Supabase, configure the Auth Site URL and allowed redirect URLs for local and deployed app addresses. The reset page needs `/reset-password` allowed as a redirect destination.
5. Start the app with `npm run dev`, then open `http://localhost:3000`.

The app expects Supabase tables used by the current project: `profiles`, `nutrition_logs`, `daily_metrics`, `weight_logs`, `user_routines`, and `workout_logs`, with row-level security policies that restrict each user to their own records. The trainer reuses `user_routines` and `workout_logs`; it does not require a new table migration. Routine exercises are stored as JSON so existing routines containing simple exercise-name lists remain supported.

## Deploy

Connect the GitHub repository to Vercel. Add the three environment variables above in Vercel's project settings, then deploy. In Supabase Auth settings, set the production Site URL and allow the production reset URL. Pushes to the connected production branch can trigger a Vercel deployment; preview branches can be reviewed before merging.

## Stack

- Next.js App Router and React
- TypeScript and Tailwind CSS
- Supabase Auth and Postgres
- Google Gemini API
- Recharts
