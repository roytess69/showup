# ShowUp — phone install & live-update loop

This folder is the complete, deployable ShowUp prototype. On your phone it runs
full-screen with its own icon, the live camera works, and the feed photos load.

────────────────────────────────────────────────────────
FASTEST TASTE — 5 minutes, no accounts needed on your end
────────────────────────────────────────────────────────
1. Go to https://app.netlify.com/drop
2. Drag the `dist/` folder from this zip onto the page.
3. It gives you a URL like https://something.netlify.app — open it on your phone.
4. iPhone: Safari → Share → **Add to Home Screen**. Android: Chrome → menu → **Add to Home screen / Install app**.
   You now have ShowUp as an app icon, full-screen, no browser bars.

(Drag `dist/` again anytime to update that URL — or use the auto-update loop below.)

────────────────────────────────────────────────────────
THE AUTO-UPDATE LOOP — set up once, updates forever (~15 min)
────────────────────────────────────────────────────────
1. Create a free GitHub account (github.com) and a new repository, e.g. `showup`.
2. Upload everything in this zip EXCEPT `dist/` (drag-and-drop works on github.com → "uploading an existing file").
3. Create a free Vercel account (vercel.com) → **Add New → Project → Import** your `showup` repo.
   Vercel auto-detects Vite. Click **Deploy**. You get https://showup-xxxx.vercel.app.
4. Open that URL on your phone → **Add to Home Screen** (same as above).

From then on, every iteration works like this:
  • Claude hands you an updated `App.jsx` (it's the same file as `showup-launch.jsx`).
  • On github.com, open `src/App.jsx` → pencil icon (Edit) → select-all, paste the new file → **Commit**.
  • Vercel rebuilds automatically (~40 seconds).
  • Open the app on your phone — it loads the newest version. If it looks stale,
    pull down to refresh or close/reopen once (PWAs cache briefly).

That's the whole loop: paste → commit → your phone app is updated.

────────────────────────────────────────────────────────
NOTES
────────────────────────────────────────────────────────
• Camera: on the deployed site the LIVE viewfinder works (HTTPS + real browser
  permissions). If any device blocks the in-page preview, the "Take a photo"
  button opens the native camera — either way, real photos.
• Feed photos: the Unsplash images load normally once deployed (the blank
  placeholders only happen inside the claude.ai preview sandbox).
• This is the prototype: data lives in memory, so force-closing the app resets
  to the demo state (accounts, purchases, posts). Persistence comes with the
  real backend.
• Local dev, if you ever want it: `npm install` then `npm run dev`.
