---
name: require-lint-typecheck
enabled: true
event: stop
pattern: .*
action: block
---

**Before finishing: run lint and typecheck.**

You are about to stop. If you touched any code in `react-app/` this turn, you must verify it still compiles and passes lint before reporting the task as complete.

**Required checks (run in `react-app/`):**

```bash
cd /Users/tobiaslekman/Repo/lekman/smart-on-fihr-tutorial/react-app
/opt/homebrew/bin/npm run lint
/opt/homebrew/bin/npx tsc -b --noEmit
```

Both must exit 0. If either fails:

1. Do not report the task as complete.
2. Read the errors carefully.
3. Fix the underlying code — do **not** mute rules, add `@ts-ignore`, `eslint-disable`, or `any` unless there is a specific, documented reason.
4. Re-run both commands until they pass.
5. Then you may stop.

**Shell caveat on this machine:** the user's zsh has nvm lazy-loading that breaks `node`/`npm` in non-interactive shells. Always use the absolute paths shown above (`/opt/homebrew/bin/npm`, `/opt/homebrew/bin/npx`) or prefix commands with `unset -f node npm nvm 2>/dev/null;`.

**If this turn did not modify `react-app/` code** (e.g. pure conversation, README edits, static-site-only changes in `example-smart-app/`), skip the checks and acknowledge that explicitly in your final message — e.g. "No react-app changes this turn; skipping lint/typecheck."
