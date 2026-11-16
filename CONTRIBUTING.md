# Contributing to YPU Music

Thanks for helping! Bug reports, ideas, translations and pull requests are all welcome. / Katkı için teşekkürler! Hata bildirimi, fikir, çeviri ve PR hepsi hoş geldi.

## Report a bug or suggest something

Open an [issue](https://github.com/mgurlek/ypu-music/issues/new/choose). For a bug, tell us your system (Windows/macOS/Linux and version), what you did, and what you saw. The black window's last lines or **Show technical details** in the app help a lot. Issues in Turkish are fine.

## Send a pull request

1. Fork the repo and create a branch: `git checkout -b fix/short-name`.
2. Make a small, focused change. One idea per pull request.
3. Run the checks in `kaynak-kodlar` (the app folder):

   ```bash
   npm ci
   npm run lint
   npx tsc --noEmit
   npm run build
   node scripts/smoke-test.mjs
   ```

4. Open the pull request and fill in the template. CI runs the same checks on Windows, macOS and Linux, plus the real Start files. It must be green.

Bigger changes (new features, new download sources such as YouTube links): please open an issue first so we agree on the idea before you spend time on it.

## Rules of the road

- **Keep it simple for beginners.** Most users are not programmers. Every user-facing text needs **both Turkish and English** (`src/lib/i18n.ts`, `src/lib/messages.ts`).
- Keep the launchers' line endings: CRLF for `.bat`, LF for `.sh` and `.command` (`.gitattributes` does this). Keep `Start-Windows.bat` ASCII-only.
- No new runtime dependency without a good reason.
- Security: the app listens on `127.0.0.1` only and has no login. Do not weaken the Host/Origin checks in `src/lib/guard.ts`.
- Commit messages: a short imperative summary, for example `Fix queue stall on Windows`. Optional prefix: `fix:`, `feat:`, `docs:`, `ci:`.

More technical notes (layout, environment variables, CI): [DETAILS.md](DETAILS.md).

## Türkçe özet

Hata bulduysanız [issue](https://github.com/mgurlek/ypu-music/issues/new/choose) açın. Kod göndermek için repoyu fork'layın, küçük ve tek amaçlı bir değişiklik yapın, yukarıdaki beş komutu çalıştırın ve PR açın. Kullanıcıya görünen her yazı Türkçe **ve** İngilizce olmalı. Büyük değişiklikte önce issue açın.
