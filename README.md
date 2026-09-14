# Stronger with Zoe — workout app (Month 1)

Private PWA for Aneri's "Stronger with Zoe" program. Built 14 Sep 2026. Not on the App Store; installs from Safari → Share → Add to Home Screen.

## What it does (requirements → where)
| Req | Feature | Where |
|---|---|---|
| 1–2 | Clean GUI, designer touches (Montserrat headings, pink/lime/teal brand, dark mode, safe-area aware) | `index.html` (all CSS) |
| 3 | YouTube demo embedded per exercise, **Next** advances without leaving the app, video loops during the set | `app.js` → `setVideo()` (YouTube IFrame API) |
| 4 | iOS PWA; Apple Watch play/pause/next via Now Playing (Media Session API + silent audio); Apple TV via AirPlay mirroring + **TV mode** (large type) | `mediaSessionStart()`, `#player.tv` |
| 5 | On-screen instructions; `each:true` items play twice (Left → Right); `rounds:n` sections repeat n×; timed items count down; AMRAP/ladder cycle with a cap timer | `buildSteps()`, `showStep()` |
| 6 | Elapsed workout clock (pause-aware) | `elapsedMs()` |
| 7 | History: name · date · time · duration · #count · kcal (Apple Watch via Shortcut → Sheet → synced back) | `viewHistory()`, `backend/Code.gs` |
| 8 | Unique generative SVG thumbnail per workout family; heavier weeks get a "+" seal | `thumbs.js` |
| 9 | Visual QA with Playwright at iPhone/iPad/desktop widths, light+dark; automated overflow/clipping checks | `qa.js` (scratch) |
| 10 | Rules tab: training rules, form & recovery, session note, reminder, quotes, tips | `PROGRAM.rules` in `data.js` |
| 11–12 | Week tab: current week (auto from date), tap-to-open rows, **Next Week** nested list, W1–W4 chips | `viewWeek()` |
| 13 | Daytime nudges: Google Calendar events on the shared "Aneri Neel" calendar (12:00 slot, alert 30 min before, workout days only) + Sunday 6 pm progress email (Apps Script) | Calendar (created via connector), `sundayEmail()` |
| 14 | In-workout motivation: progress bar, round counter, milestone toasts (halfway / last round / cooldown), rest screens with next-up preview, 3-2-1 beeps, Zoe's own lines | `milestone()`, rest step UI |
| 15 | Session recorded only if ≥ 5 min (partial exits ≥ 5 min saved as "partial") | `finishWorkout()` |
| 16 | Equipment summary per workout (from exercise names, PDF notes and video transcripts) on Week rows and the workout overview | `equipmentOf()`, `eq:[]` in `data.js` |
| 17 | Weight log per exercise (lb, "Bodyweight", quick chips); last-used value + date shown next time the exercise appears (any workout) | `openLoadSheet()`, `lastLoad()` |
| 18 | First-run profile (name + email); multiple profiles; per-person history/loads; synced to the Sheet | onboarding, `Users` tab |
| — | Feedback bubble (💬) → `Feedback` tab in the Sheet → Friday 7 am digest email to Neel | `openFeedback()`, `fridayDigest()` |

## Files
```
index.html      shell + all CSS
app.js          views, player, sync, media session, calorie bridge
data.js         THE PROGRAM (13 sessions, 147 items, 87 videos) — edit here for Month 2
videos.js       video titles/channels/durations (oEmbed + captions)
thumbs.js       generative thumbnails
config.js       backend URL (Apps Script /exec) + app URL
sw.js           service worker (offline shell; never caches YouTube/Apps Script)
manifest.webmanifest, icon-*.png
backend/Code.gs Apps Script: Sheet DB (Users/Sessions/Loads/Feedback), sync API,
                calories endpoint, Sunday email, Friday feedback digest
```

## Data model (Sheet tabs = source of truth; app is offline-first with localStorage)
- **Users** email, name, unit, created, lastSeen
- **Sessions** sid, email, name, wid, title, start, end, dur(s), partial, steps, stepsTotal, cal, week, received
- **Loads** id, email, ex (normalised key), exName, val (number|"BW"), unit, date, sid, wid
- **Feedback** id, app, when, name, email, view, text, ua, status(new→emailed)

## Deploy / update
1. **App**: push files to the GitHub repo → GitHub Pages serves `https://pivot12.github.io/stronger-with-zoe/` (repo Pivot12/stronger-with-zoe). Bump `VER` in `sw.js` on each release so installed apps refresh.
2. **Backend**: Google Sheet → Extensions → Apps Script → paste `backend/Code.gs` → Deploy → Web app (execute as *Me*, access *Anyone*) → copy `/exec` URL into `config.js` (`api`). Run `setupTriggers()` once (authorise Mail + Sheets).
3. **Calendar nudges**: events on the "Aneri Neel" calendar for every workout day, Sep 14 – Oct 11.

## Apple Watch calories (one-time, on Aneri's iPhone)
Create a Shortcut named **SWZ Calories**: Get Text from Input → Split Text by `|` → Find Health Samples (Active Energy, between item 2 and item 3) → Calculate Statistics (Sum) → Get Contents of URL (POST JSON `{action:"calories", sid:<item 1>, cal:<Sum>}` to the backend URL). The app's summary screen launches it with `shortcuts://run-shortcut?name=SWZ%20Calories&input=text&text=<sid>|<start>|<end>`. Start a *Strength Training* workout on the Watch when starting a session so Active Energy is attributed. Manual entry is also available.

## Known limits (honest list)
- YouTube autoplay with sound on iOS can be blocked until the user taps the video once; default is muted with a one-tap **Sound** toggle in the player.
- Apple Watch Now Playing controls depend on iOS honouring the page's Media Session while a YouTube iframe is also playing — marked *beta*; verify on device.
- PWAs on iOS cannot schedule local notifications → nudges use Calendar + email.
- Captions unavailable for ~half the videos; equipment for those came from names + PDF notes.
- Program dates are fixed in `data.js` (`PROGRAM.blocks`). After 11 Oct the app shows "Month 1 complete" until Month 2 data is added.

## Adding Month 2
Duplicate a block in `PROGRAM.blocks`, add workouts to `WORKOUTS` (copy an existing one), map days in `schedule` (0=Sun…6=Sat), add a family colour in `thumbs.js` if it's a new type. No other code changes needed.
