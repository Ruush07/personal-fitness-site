# Functional Requirements and Test Cases

Simple viva and manual-testing notes for the Personal Fitness Site.

## Functional requirements

| ID | Requirement | Basis / status |
|---|---|---|
| FR-01 | A user can create an account and sign in with email and password. | Implemented with Supabase Auth. |
| FR-02 | A signed-in user can sign out. | Implemented in the sidebar. |
| FR-03 | The dashboard shows the user's saved goals and daily fitness totals. | Implemented in the dashboard flow. |
| FR-04 | A user can save calorie and macronutrient targets. | Implemented on the Goals page. |
| FR-05 | A user can submit a meal description and receive estimated nutrition values. | Implemented through the nutrition API route and Gemini. Estimates may be inaccurate. |
| FR-06 | A user can save and view meal records. | Implemented with Supabase nutrition logs. |
| FR-07 | A user can record daily steps. | Implemented on the dashboard. |
| FR-08 | A user can record weight and review weight history. | Implemented with weight logs and the chart. |
| FR-09 | A user can create exercise routines and save performed workout details. | Implemented as separate routine and workout records. |
| FR-10 | A user can request a password-reset email, choose a new password from a valid link, and receive a clear message for an expired link. | Recovery screens added in this branch; requires the Supabase redirect URLs and email configuration below. |
| FR-11 | Users can access only their own fitness records. | Required security behavior; verify Supabase Row Level Security policies with two accounts before claiming it is tested. |
| FR-12 | A signed-in user can request an editable routine draft tailored to goal, experience, weekly schedule, equipment, and focus. | Implemented through an authenticated server-side Gemini route; requires `GEMINI_API_KEY`. Review AI output before saving. |
| FR-13 | A user can get a workout pick based on saved routines and recent workout logs. | Implemented as a rotation suggestion. It is not a medical or recovery assessment. |
| FR-14 | A user can mark planned exercises complete and see a workout score. | Implemented as completed planned sets divided by total planned sets. |
| FR-15 | A user can see weight increase and potential personal-record prompts based on their own workout logs. | Implemented as optional guidance; the app does not claim a PR until a user records a completed set. |
| FR-16 | A user can log weight and see weight history plus a weekly workout-frequency chart. | Implemented with Supabase logs and Recharts. |

## Test approach

Start with **38 manual test cases**. Use black-box testing for visible behavior, negative and boundary tests for invalid input, and integration tests where the app talks to Supabase or Gemini. These cases are planned; do not report them as passed until they have actually been run.

The repository does not currently define a test script in `package.json`, so this is a manual test plan rather than an automated test suite.

## Test cases

| ID | Test / expected result | Type | Status |
|---|---|---|---|
| AUTH-01 | Sign up with a valid email and password; receive the expected confirmation flow and then sign in. | Functional / integration | Not run |
| AUTH-02 | Submit malformed email or an unacceptable password; show an error and do not create a usable account. | Negative | Not run |
| AUTH-03 | Sign in with a confirmed account and correct password; open the dashboard. | Functional | Not run |
| AUTH-04 | Sign in with an incorrect password; show an error and remain signed out. | Negative | Not run |
| AUTH-05 | Sign out, then open a protected feature; require sign-in. | System / security | Not run |
| GOAL-01 | Save valid calorie and macro targets; show a successful result. | Functional / integration | Not run |
| GOAL-02 | Reload Goals after saving; show the previously saved targets for the same account. | Persistence | Not run |
| DASH-01 | With meal records and targets present, open the dashboard; daily totals match the saved records. | Functional | Not run |
| STEP-01 | Enter a valid step count and save it; the dashboard shows the saved count. | Functional | Not run |
| NUT-01 | Submit a normal meal description; show an estimated meal name and nutrition values. | Integration | Not run |
| NUT-02 | Submit an empty or whitespace-only meal; do not request analysis or save a log. | Negative / boundary | Not run |
| NUT-03 | Simulate a nutrition API error; show an error and do not save a meal. | Negative / integration | Not run |
| NUT-04 | Save a successful meal and reload Nutrition; the meal and daily totals remain visible. | Persistence | Not run |
| ROUT-01 | Create a routine with a name and exercises; show it in the routines list. | Functional / integration | Not run |
| ROUT-02 | Reload the routines page; the saved routine remains available to its owner. | Persistence | Not run |
| WORK-01 | Select a routine, enter workout details, and save; show a successful result. | Functional | Not run |
| WORK-02 | Reload or revisit workouts; saved split, exercises, sets, reps, and weight are retained. | Persistence | Not run |
| WEIGHT-01 | Save a valid weight entry; show a successful result. | Functional | Not run |
| WEIGHT-02 | Open weight history after saving entries; chart displays the saved history. | Functional | Not run |
| DATA-01 | Sign in as User A and User B in separate sessions; neither user can see the other's records. | Security / integration | Not run; verify RLS |
| DATA-02 | Attempt to read or write fitness data while signed out; access is denied. | Security / negative | Not run; verify RLS |
| REC-01 | Request a reset link for an email; show a generic confirmation without revealing whether the account exists. | Functional / security | Not run |
| REC-02 | Open a valid reset link; land on the app's new-password page with a valid recovery session. | Integration | Not run; requires Supabase URL allowlist |
| REC-03 | Submit matching new passwords; update succeeds, then the new password signs in and old password does not. | Functional / integration | Not run |
| REC-04 | Open an expired, reused, or malformed reset link; show a useful error and a way to request another link. | Negative / boundary | **Observed failure before this change; retest** |
| TRAIN-00 | Call routine generation without a valid signed-in Supabase session; receive an authorization error and no Gemini request. | Security / negative | Not run |
| TRAIN-01 | With multiple saved routines and workout history, Coach suggests a routine not yet logged today and identifies it as the least recently logged option. | Functional / data-driven | Not run |
| TRAIN-02 | After every saved routine has a workout logged today, Coach recommends rest instead of repeating a routine. | Boundary / functional | Not run |
| TRAIN-03 | Generate a plan with a goal, experience, schedule, equipment, and focus; show an editable draft that follows those inputs. | Functional / AI integration | Not run; requires Gemini key |
| TRAIN-04 | Submit missing equipment or invalid routine-builder inputs; show a useful error and do not save a routine. | Negative / boundary | Not run |
| TRAIN-05 | Run AI routine generation without `GEMINI_API_KEY`; show a setup message and keep the page usable. | Negative / configuration | Not run |
| TRAIN-06 | Save an AI draft; it appears in saved routines and remains after reloading. | Persistence / integration | Not run |
| TRAIN-07 | Open an older routine stored as a list of exercise-name strings; show usable default sets and reps. | Compatibility | Not run |
| TRAIN-08 | With prior logged sets, show a last-load hint; suggest a small increase only when prior reps meet the target, otherwise recommend repeating the load. | Functional / data-driven | Not run |
| TRAIN-09 | Mark some planned exercises complete; score equals completed planned sets divided by all planned sets and remains attached to the saved session. | Functional / calculation | Not run |
| TRAIN-10 | Enter a load above the highest logged load for that exercise; show it as a potential PR and require controlled completion before counting it. | Functional / boundary | Not run |
| TRAIN-11 | Add workout logs across dates; the weekly chart counts each session under the correct local day. | Functional / chart | Not run |
| WEIGHT-03 | Enter a weight outside 20–500 kg; show a validation message and do not write a record. | Negative / boundary | Not run |

### Recording results

For each case, record **Pass**, **Fail**, or **Not run**, plus the actual result and a screenshot or note for failures. From the supplied screenshot, one recovery-link failure was observed before the new recovery screens were added. The other 24 cases have not been reported as run. Re-run REC-04 after Supabase redirects are configured before updating its status.

Pass rate = passed cases ÷ executed cases × 100. Do not count “Not run” cases as passed.

## Supabase setup needed for password recovery

In the Supabase dashboard, set the Site URL to the deployed app origin and add the exact reset destination to the allowed redirect URLs:

- `https://personal-fitness-site.vercel.app/reset-password`
- `http://localhost:3000/reset-password` for local development

Also allow the deployed app origin and local origin for signup confirmation redirects. The recovery pages are in the code now, but the live email flow cannot work until the matching Supabase Auth redirect settings are applied.

Also allow the app origins used for signup confirmation. If the email template is customized, make sure it uses Supabase's provided redirect destination rather than combining the Supabase project URL with the app URL. Recovery emails are one-time links and can expire or become invalid after reuse. The app cannot fix a bad dashboard URL or an already-expired token by itself.

Supabase handles the Auth network requests through its client library. The app calls `resetPasswordForEmail()` to request the email and `updateUser({ password })` after a valid recovery link opens. Passwords are stored by Supabase as hashes; the app cannot read a user's existing password.
