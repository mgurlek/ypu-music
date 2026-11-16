# YPU Music — full details / tüm ayrıntılar

Short guide: [README.md](README.md). This file has every detail: system limits, troubleshooting, Docker, developers, CI.
*Çetrefilli adamların kulübü.*

[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Node.js 20.9+](https://img.shields.io/badge/node-%3E%3D20.9-339933)](https://nodejs.org/)
[![Python 3.11 to 3.15](https://img.shields.io/badge/python-3.11--3.15-3776AB)](https://www.python.org/downloads/)
[![CI](https://github.com/mgurlek/ypu-music/actions/workflows/ci.yml/badge.svg)](https://github.com/mgurlek/ypu-music/actions/workflows/ci.yml)

**[English](#english) | [Türkçe](#türkçe)**

---

## English

Download your Spotify playlists as MP3 files, on your own computer.

**Contents:** [About](#about) · [Quick start](#quick-start) · [What you need](#what-you-need) · [Using the app](#using-the-app) · [If something goes wrong](#if-something-goes-wrong) · [Docker (optional)](#docker-optional) · [For developers](#for-developers) · [Privacy, legal and credits](#privacy-legal-and-credits)

### About

YPU Music is a small app that runs on your own computer. You paste a Spotify playlist link or a Spotify song link. The app saves the songs as MP3 files in a folder on your computer. It uses the free open-source tool [spotDL](https://github.com/spotDL/spotify-downloader) to do this. I built it to put music on my COROS Pace 4 watch, but the MP3 files work on any player.

You do not need to know programming. You double-click one file, and a web page opens in your browser.

> **What it can and cannot do**
>
> - It works with **public** Spotify playlists and **single songs** only. Private playlists, albums and artist pages do not work.
> - It needs an internet connection the whole time.
> - A playlist takes a few minutes, because the songs are downloaded one by one.
> - A few songs may not be found. The app lists them for you at the end.

### Quick start

You do this once. Pick your system: [Windows](#windows), [macOS](#macos) or [Linux](#linux).

#### Windows

1. Open <https://github.com/mgurlek/ypu-music> in your browser. Click the green **Code** button, then click **Download ZIP** (a ZIP is a compressed folder).
2. Right-click the downloaded ZIP file and click **Extract All**. Choose a short place such as `C:\`. You get a folder such as `C:\ypu-music-main`. You may rename it to `C:\ypu-music`.
3. Check the folder name. Do not use a folder inside OneDrive (your Desktop and Documents may be inside OneDrive). Do not use the signs `&`, `^` or `;` in any folder name of the path. Windows cannot handle very long paths, so keep it short.
4. Open the folder. You see `Start-Windows.bat` and a folder named `kaynak-kodlar` (it means "source code").
5. Double-click `Start-Windows.bat`. Windows may hide the `.bat` ending. If Windows or your antivirus shows a warning for a file you just downloaded, only continue if you trust this repository.
6. A black window (the terminal) opens. It counts from `[1/6]` to `[6/6]` and writes in Turkish and English. You do not need to type anything. It checks Node.js and Python, makes a private Python folder, installs spotDL, downloads ffmpeg (a tool that makes MP3 files, about 70 MB) and a helper called deno when they are missing, installs the app's files, builds the app, finds a free port from 3000 to 3010 (a port is a door number the app uses) and starts the app.
7. If the window says **Node.js** is missing or too old, it opens <https://nodejs.org/>. Download the green **LTS** version (LTS means long-term support, the safe choice), install it and click Next on every screen. Then close the black window and double-click `Start-Windows.bat` again.
8. If the window says **Python** is missing, it opens <https://www.python.org/downloads/>. Click the yellow **Download Python** button and run the file. If the installer shows a box **Add python.exe to PATH** (older installers say **Add Python to PATH**), tick it (PATH is the list of places where Windows looks for programs). If you get the newer "Python install manager" and it asks to add a folder to PATH, say yes. If it asks which Python to install, pick 3.13 (any version from 3.11 to 3.15 works). Then close the black window and double-click `Start-Windows.bat` again.
9. Wait. When you see **THE APP IS READY**, your browser opens by itself. If it does not, type the address shown in the black window into your browser. It is usually `http://localhost:3000`.
10. Paste a Spotify playlist or song link into the box. Press **Add to queue**.
11. Find your MP3 files in the folder `Indirilen-Muzikler`. It sits next to `kaynak-kodlar`, for example `C:\ypu-music-main\Indirilen-Muzikler`. The app also shows the full folder path on its page.
12. **Do not close the black window while you use the app. Closing it stops the app.** To stop the app, close the window, or press Ctrl+C (Windows may ask "Terminate batch job (Y/N)?", then type `Y` and press Enter).
13. Next time, just double-click `Start-Windows.bat` again. The first start takes about 2 minutes (it downloads things). Later starts take about 15 seconds. If you double-click while the app is already running, the second window does not rebuild anything: it prints that the app is already running and opens your browser. If another window is still setting up, it asks you to wait for that window and exits without touching anything.

#### macOS

1. Open <https://github.com/mgurlek/ypu-music> in your browser. Click the green **Code** button, then click **Download ZIP** (a ZIP is a compressed folder).
2. Double-click the ZIP file to extract it. Move the extracted folder to your home folder. Do not keep it inside OneDrive, Dropbox or iCloud Drive.
3. Open the folder. You see `Start-Mac.command` and a folder named `kaynak-kodlar` (it means "source code").
4. Double-click `Start-Mac.command`. The first time, macOS blocks it. This is normal for files from the internet. Apple describes the way around it ([Apple Support](https://support.apple.com/en-us/102445)): "On your Mac, choose Apple menu > System Settings, then click Privacy & Security in the sidebar." Scroll down to the message about the file and click **Open Anyway**. Apple says: "This button is available for about an hour after you try to open the app." Then "Enter your login password, then click OK." (More steps: [Apple Support](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unknown-developer-mh40616/mac).)
5. If double-clicking does nothing, open the Terminal app (it is the black-or-white text window of your Mac). Type `bash ` (with a space after it), drag `Start-Mac.command` into the Terminal window, and press Enter. If you are already in the folder, this is the same as `bash Start-Mac.command`.
6. A window opens. It counts from `[1/6]` to `[6/6]` and writes in Turkish and English. It checks Node.js and Python, makes a private Python folder, installs spotDL, downloads ffmpeg (a tool that makes MP3 files, about 70 MB) and a helper called deno when they are missing, installs the app's files, builds the app, finds a free port from 3000 to 3010 (a port is a door number the app uses) and starts the app.
7. If the window says **Node.js** is missing or too old, it opens <https://nodejs.org/en/download>. Download the **LTS** version (a `.pkg` file) and install it. Click Continue on every screen. Then close the window and double-click `Start-Mac.command` again. If you use Homebrew, `brew install node` also works.
8. If the window says **Python** is missing, it opens <https://www.python.org/downloads/>. Click **Download Python** and install the `.pkg` file. Then close the window and double-click `Start-Mac.command` again. If you use Homebrew, `brew install python` also works.
9. Wait. When you see **THE APP IS READY**, your browser opens by itself. If it does not, type the address shown in the window into your browser. It is usually `http://localhost:3000`.
10. Paste a Spotify playlist or song link into the box. Press **Add to queue**.
11. Find your MP3 files in the folder `Indirilen-Muzikler`. It sits next to `kaynak-kodlar`. The app also shows the full folder path on its page.
12. **Do not close the window while you use the app. Closing it stops the app.** To stop the app, close the window or press Ctrl+C.
13. Next time, just double-click `Start-Mac.command` again. The first start takes about 2 minutes (it downloads things). Later starts take about 15 seconds. If you double-click while the app is already running, the second window does not rebuild anything: it prints that the app is already running and opens your browser. If another window is still setting up, it asks you to wait for that window and exits without touching anything.

#### Linux

1. Open <https://github.com/mgurlek/ypu-music> in your browser. Click the green **Code** button, then click **Download ZIP** (a ZIP is a compressed folder).
2. Extract the ZIP file (right-click, **Extract Here**, or run `unzip` in the Terminal). Put the folder in your home folder. Do not keep it inside OneDrive or Dropbox.
3. Open the folder. You see `Start-Linux.sh` and a folder named `kaynak-kodlar` (it means "source code").
4. Open a Terminal (the text window) in that folder. Type `bash Start-Linux.sh` and press Enter. On some desktops, double-clicking `Start-Linux.sh` also works; `bash Start-Linux.sh` always works.
5. The Terminal counts from `[1/6]` to `[6/6]` and writes in Turkish and English. It checks Node.js and Python, makes a private Python folder, installs spotDL, downloads ffmpeg (a tool that makes MP3 files, about 70 MB) and a helper called deno when they are missing, installs the app's files, builds the app, finds a free port from 3000 to 3010 (a port is a door number the app uses) and starts the app. The script never uses `sudo`. It never changes system settings.
6. If the window says **Node.js** is missing or too old, install the LTS version from <https://nodejs.org/en/download>. The `nodejs` package of many Linux systems is too old: it is version 12 on Ubuntu 22.04 and version 18 on Ubuntu 24.04 and Debian 12, and the app needs 20.9 or newer. Use NodeSource (<https://github.com/nodesource/distributions>) or nvm (<https://github.com/nvm-sh/nvm>) instead. Then run `bash Start-Linux.sh` again.
7. If the window says **Python** is missing, copy the line for your system into the Terminal (it asks for your password), then run `bash Start-Linux.sh` again. If your Python is older than 3.11 (Ubuntu 22.04 has 3.10), install a newer one from <https://www.python.org/downloads/> instead:
   - Debian, Ubuntu, Mint: `sudo apt install python3 python3-venv python3-pip`
   - Fedora: `sudo dnf install python3 python3-pip`
   - Arch, Manjaro: `sudo pacman -S python python-pip`
8. If ffmpeg cannot be downloaded, install it yourself (see the troubleshooting table below): `sudo apt install ffmpeg` on Debian, Ubuntu and Mint.
9. Wait. When you see **THE APP IS READY**, your browser opens by itself. If it does not, type the address shown in the Terminal into your browser. It is usually `http://localhost:3000`.
10. Paste a Spotify playlist or song link into the box. Press **Add to queue**.
11. Find your MP3 files in the folder `Indirilen-Muzikler`. It sits next to `kaynak-kodlar`. The app also shows the full folder path on its page.
12. **Do not close the Terminal while you use the app. Closing it stops the app.** To stop the app, close the Terminal or press Ctrl+C.
13. Next time, run `bash Start-Linux.sh` again. The first start takes about 2 minutes (it downloads things). Later starts take about 15 seconds. If you run it while the app is already running, the second window does not rebuild anything: it prints that the app is already running and opens your browser. If another window is still setting up, it asks you to wait for that window and exits without touching anything.

### What you need

| | Windows | macOS | Linux |
|---|---|---|---|
| Minimum system | Windows 10 or 11, 64-bit | macOS 13.5 or newer | A 64-bit Linux with glibc 2.28 or newer and kernel 4.18 or newer (for example Ubuntu 20.04, Debian 10, RHEL 8) |
| Chips | Intel/AMD (x64). ARM64 works too, but you must install ffmpeg yourself. | Intel and Apple Silicon | x64 and ARM64 |
| Start file | `Start-Windows.bat` | `Start-Mac.command` | `Start-Linux.sh` |

Why these minimums:

- **Windows 10 or 11, 64-bit.** The app's framework, Next.js 16, has no program files for 32-bit Windows (its package list has no `win32-ia32` build). Node.js 24 and 26 list "Windows 10/Server 2016" as the minimum and have no 32-bit Windows download. Windows 7, 8 and 8.1 are not supported. Sources: [Next.js 16.4.6 in the npm registry](https://registry.npmjs.org/next/16.4.6), [Node.js 24 platform list](https://raw.githubusercontent.com/nodejs/node/v24.x/BUILDING.md), [Node.js 26 platform list](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md).
- **macOS 13.5.** Node.js 24 and 26 list "macOS 13.5" as the minimum ([Node.js 26 platform list](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md)). Older Macs: we have not tested them. Homebrew supports macOS 15 or higher ([Homebrew docs](https://docs.brew.sh/Installation)); you do not need Homebrew for the normal Quick start.
- **Linux.** Node.js lists "kernel >= 4.18, glibc >= 2.28" for x64 and ARM64 ([Node.js 26 platform list](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md)). Alpine Linux and other musl systems: untested.
- **Windows ARM64.** Node.js has native ARM64 builds ([Node.js 26 platform list](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md)). Python's ARM64 Windows installer is marked "Experimental" ([python.org](https://www.python.org/downloads/release/python-3143/)). The automatic ffmpeg download does not exist for Windows ARM64, so install ffmpeg by hand (see the troubleshooting table).

What the Start file installs by itself, and what you install yourself:

| | You install it yourself (once) | The Start file does it for you |
|---|---|---|
| Node.js 20.9 or newer (the LTS version is best) | Yes, from <https://nodejs.org/> | No |
| Python 3.11 to 3.15 (3.16 and newer do not work with spotDL 4.6) | Yes, from <https://www.python.org/downloads/> | No |
| spotDL and yt-dlp (Python parts) | No | Yes, into a private folder (`kaynak-kodlar\.venv`) |
| ffmpeg (turns audio into MP3) | Only if the download fails | Yes, about 70 MB (not on Windows ARM64) |
| deno (a helper some YouTube songs need) | No | Yes |
| The app's own files | No | Yes (`npm ci`, then `npm run build`, on every start) |

Time: the first start took about 2 minutes on our test computer with our internet connection. Later starts took about 15 seconds. Slower internet takes longer. We did not measure disk space.

Browser: any current browser works. The app is shown in Turkish if your browser language is Turkish, and in English for every other language.

### Using the app

The page is called **Download Playlist** (Turkish: **Çalma Listesi İndir**). The menu has **Home** and **Your Library**.

1. Copy a link from Spotify. It must start with `https://open.spotify.com/` and point to a playlist or a single song. The playlist must be public.
2. Paste it into the box **Spotify playlist or song link**.
3. Press **Add to queue**. The app shows **Fetching songs...** while it reads the song list. Big playlists can take a minute. Press **Cancel** to stop this step. Nothing is added then.
4. The page shows **Added N songs from "name" to the queue.**
5. Look at **Now downloading** for the current song and at **Queue** (**Next in queue**) for the rest. Songs download one at a time.
6. In the queue you can move a song up or down, remove a song or a whole playlist from the queue, or cancel the current download.
7. Press **Stop all** to stop everything. The app asks **Are you sure? This stops the download and empties the queue.** Answer **Yes, stop all** or **No, keep going**.
8. A download only counts as finished when the song was truly downloaded or already exists in the playlist folder. When the queue is done, **Finished** shows how many songs were downloaded and how many failed (for example "12 downloaded, 1 failed"). Cancelling a download or pressing **Stop all** does not count as a failure. **These songs could not be downloaded** lists the failed songs.
9. **Show technical details** opens the raw log. You only need it when you ask for help.
10. The box **Your MP3 files are saved in this folder** shows the folder. The **Copy** button copies the path.
11. **Your Library** lists the playlists you downloaded and the songs inside them.
12. If a banner says **Downloads are paused**, something blocks every song (for example no internet). Your queue is kept. Fix the problem, then press **Try again**.

### If something goes wrong

| What you see | What it means and what to do |
|---|---|
| The black window says **Python was not found**, or the Microsoft Store opens when you type `python` | The Microsoft Store shortcut named `python` is not real Python. Install Python from <https://www.python.org/downloads/> (see Quick start, Windows, step 8). After installing, close the black window and double-click the Start file again. A window that was open before the installation does not see the new Python. |
| The window says Python **3.16** (or newer) was found but is not supported | spotDL 4.6 works with Python 3.11 to 3.15 only. Install Python 3.13 or 3.14 from <https://www.python.org/downloads/> next to it, then start again. |
| The window says **Node.js** is missing or too old | Install the LTS version from <https://nodejs.org/en/download>, close the black window, start again. On Linux, do not use the old `nodejs` package from `apt` (see Quick start, Linux, step 6). |
| **ffmpeg COULD NOT BE SET UP** | Without ffmpeg no MP3 can be made. Install it by hand, close the black window, and start again. **Windows** (also needed on Windows ARM64): open the Start menu, type `PowerShell`, open it and run `winget install Gyan.FFmpeg`. **macOS:** run `brew install ffmpeg` in the Terminal (install Homebrew first from <https://brew.sh> if `brew` is missing). **Debian, Ubuntu, Mint:** `sudo apt install ffmpeg`. **Fedora:** `sudo dnf install ffmpeg` (needs the RPM Fusion repository). **Arch, Manjaro:** `sudo pacman -S ffmpeg`. |
| The setup stops with errors about files, paths, or "could not create the private Python folder" | Check the folder path. Windows cannot handle paths longer than 260 characters. Move the whole folder to a short place such as `C:\ypu-music`. Do not use OneDrive. Do not use `&`, `^` or `;` in the folder name; they break npm on Windows. (If the path is longer than 130 characters, the Windows Start file keeps the private Python folder in `%LOCALAPPDATA%\YPU-Music\venv` instead.) |
| The banner **Downloads are paused** with the button **Try again** | A problem affects all songs, for example: no internet, YouTube temporarily blocks too many requests, the disk is full, or the music folder cannot be written. Your queue is kept. Read the message in the banner, fix it (check your internet, wait a few minutes, free some disk space), then press **Try again**. |
| A song is listed under **These songs could not be downloaded**, with "could not be found on YouTube" | The app looks for each song on YouTube. Some songs are not there or are blocked. Other songs are not affected. Nothing you can fix in the app. |
| The page says the playlist **could not be opened** | The playlist must be public. Open it in Spotify and set it to public, or copy the link again. Albums and artist links are not supported. Only links that start with `https://open.spotify.com/` work. |
| Port 3000 is busy | The Start file checks the ports 3000 to 3010 and uses the first free one. Your browser opens that one. If the browser does not open, read the address in the black window. |
| You closed the black window by accident | The app stopped. Double-click the Start file again. Your downloaded MP3 files are safe. The queue is empty after a restart; add the link again. |
| You double-clicked twice, or a second window says the app is **already running** or **still starting** | If the app is already running, the second window opens your browser and you can close that second window. If it is still setting up (the first start can take a few minutes), do not close the first window: wait for it to finish, and the browser will open when the app is ready. |
| The page says it **cannot reach the app** | The black window is closed or the app stopped. Start it again with the Start file. |
| Windows, your antivirus, or macOS blocks the file | Only continue if you trust this repository. On macOS, use **System Settings > Privacy & Security > Open Anyway** (see Quick start, macOS, step 4), or run `bash Start-Mac.command` in the Terminal. |
| Downloads suddenly fail after weeks of working | YouTube changes often, and the download tool (yt-dlp) must keep up. Close the black window and double-click the Start file again. It updates yt-dlp and spotDL on every start (you need internet for this). |
| Docker on Windows: `500 Internal Server Error` or `dockerDesktopLinuxEngine` | The WSL2 engine of Docker is stuck. Open PowerShell or CMD and run `wsl --shutdown`. Quit Docker Desktop from the system tray (near the clock). Start it again. |
| Docker on Linux: the music folder cannot be written | Create the folder yourself before the first `docker compose up`, in the folder that contains `kaynak-kodlar`: `mkdir Indirilen-Muzikler`. If Docker creates it, it belongs to the root user and the container user cannot write into it. If it still fails, run `chmod 777 Indirilen-Muzikler`. |
| Manual route on Windows: PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled` | This only affects the manual install, not the Start file. Run the npm commands in Command Prompt (cmd) instead of PowerShell. Another way is `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`; it changes a Windows setting for your user account, so only do it if you understand it. |

### Docker (optional)

Docker is an alternative to the Start file. It runs the app in a box (a container) that already has Node.js, Python, spotDL and ffmpeg inside. Only use it if you already know Docker. The Start file is easier.

1. Install Docker. **Windows:** [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/). Its page lists Windows 10 64-bit (22H2, build 19045) or Windows 11 64-bit (23H2, build 22631) or higher in the Enterprise, Pro or Education editions (Windows Home is not listed there), WSL 2.1.5 or later, the WSL 2 feature, 8 GB RAM, and hardware virtualization turned on in the BIOS/UEFI. **macOS:** [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/); it supports "the current and two previous major macOS releases". **Linux:** install Docker Engine with the Compose plugin ([instructions](https://docs.docker.com/engine/install/)). Start Docker and wait until it is running.
2. On Linux, create the music folder first, in the folder that contains `kaynak-kodlar`: `mkdir Indirilen-Muzikler`.
3. Open a terminal in the folder `kaynak-kodlar` (inside the folder you downloaded).
4. Run: `docker compose up -d --build`. The first build takes several minutes.
5. Open <http://localhost:3000> in your browser.
6. Your MP3 files appear in `Indirilen-Muzikler`, next to `kaynak-kodlar` (the compose file maps `../Indirilen-Muzikler` into the container).
7. To update after you download a new version: run `docker compose build --no-cache`, then `docker compose up -d`.
8. To stop: run `docker compose down`.

The container can only be reached from this computer (`127.0.0.1:3000`), not from other computers on your network. Use `docker compose` (with a space), not the old `docker-compose`.

### For developers

**You need:** Node.js 20.9 or newer, Python 3.11 to 3.15, and ffmpeg (`python -m spotdl --download-ffmpeg` can download it; Deno is optional: `python -m spotdl --download-deno`).

**Manual install** (run in the `kaynak-kodlar` folder):

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm ci
npm run build
npm run start      # http://127.0.0.1:3000   (or: npm run dev for development)
```

```bat
:: Windows (Command Prompt)
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
npm ci
npm run build
npm run start
```

If the app cannot find spotDL, point it at the right Python: `YPU_PYTHON=.venv/bin/python` (macOS/Linux) or `set YPU_PYTHON=.venv\Scripts\python.exe` (Windows).

**Environment variables the app reads:**

| Variable | Default | Meaning |
|---|---|---|
| `YPU_PYTHON` | not set (tries `py -3`, `python`, `python3` on Windows; `python3`, `python` elsewhere) | Full path of the Python that has spotDL. The Start files set it to the private folder. |
| `DOWNLOAD_DIR` | `../Indirilen-Muzikler` (next to `kaynak-kodlar`) | Folder where MP3 files are saved. |
| `YPU_METADATA_TIMEOUT_MS` | `180000` (3 minutes) | How long reading a playlist may take. |
| `YPU_STALL_MS` | `300000` (5 minutes); values below `1000` are ignored | A song download that prints nothing for this long is stopped. |
| `YPU_ALLOWED_HOSTS` | not set | Extra host names the API accepts, comma-separated (case-insensitive). By default the app only accepts `localhost`, `127.0.0.1`, `[::1]` and `*.localhost` to block DNS rebinding attacks. |

The Start files also understand `--check` (only look, change nothing, print a status table; exit code 0 means ready), and the test variables `YPU_NO_PAUSE=1`, `YPU_NO_BROWSER=1` and `YPU_PORT_START=<port>`. `Start-Windows.bat` also has `YPU_TIMING=1`. `.gitattributes` keeps the right line endings (CRLF for `.bat`, LF for `.sh` and `.command`); do not change them.

**Project layout:**

```
Start-Windows.bat, Start-Mac.command, Start-Linux.sh   one-click launchers
.github/workflows/ci.yml                               CI
kaynak-kodlar/                                         the app ("source code")
  src/app/                                             page (page.tsx) and API routes: metadata, queue, playlist, library
  src/lib/                                             queueManager.ts, i18n.ts, messages.ts, paths.ts, python.ts, guard.ts, spotifyUrl.ts
  scripts/get_playlist.py                              reads playlist / song data through spotDL
  scripts/smoke-test.mjs                               smoke test
  Dockerfile, docker-compose.yml, requirements.txt
Indirilen-Muzikler/                                    your MP3 files (created on first start, not in git)
```

**Checks** (in `kaynak-kodlar`):

```bash
npm run lint
npx tsc --noEmit
node scripts/smoke-test.mjs                      # needs "npm run build" first; starts its own server
node scripts/smoke-test.mjs http://127.0.0.1:3000   # tests a server that is already running
```

**CI** ([workflow](https://github.com/mgurlek/ypu-music/actions/workflows/ci.yml)) runs on every push, every pull request and by hand. The badge at the top shows the latest result. Job `build-test` runs `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `pip install -r requirements.txt`, `python -m spotdl --version` and the smoke test on these 11 combinations (system / Node.js / Python):

- `windows-2022` / 22 / 3.11, `windows-2025` / 24 / 3.13, `windows-11-arm` / 24 / 3.13
- `macos-15-intel` / 22 / 3.11, `macos-15` / 24 / 3.13, `macos-26` / 24 / 3.11
- `ubuntu-22.04` / 22 / 3.11, `ubuntu-24.04` / 24 / 3.13, `ubuntu-24.04-arm` / 24 / 3.13
- `ubuntu-24.04` / 20.9.0 / 3.11 (oldest supported Node.js), `ubuntu-24.04` / 26 / 3.13 (the Node.js version of the Docker image)

Job `docker` builds the image with `docker compose build`, starts it, waits until it is healthy, runs the smoke test against it, checks `ffmpeg`, `spotdl` and `deno` inside, and checks that the container does not run as root.

Job `launcher` runs the real Start files (`Start-Windows.bat`, `Start-Mac.command`, `Start-Linux.sh`) unattended, the way a beginner double-clicks them. In each cell it checks that `--check` exits with 1 before setup, starts the launcher in the background, waits up to 12 minutes for the app, runs the smoke test against it, checks the private virtualenv, the spotDL import, ffmpeg and the `Indirilen-Muzikler` folder, runs `--check` again while the app runs (it must exit 0, print READY and pick port 3001, because 3000 is busy), stops everything and uploads the launcher logs. On `windows-11-arm` a missing ffmpeg is only a warning. It never downloads music (no Spotify or YouTube calls). It runs on these 10 combinations (system / Node.js / Python):

- `windows-2022` / 22 / 3.11, `windows-2025` / 24 / 3.13, `windows-11-arm` / 24 / 3.13
- `macos-15` / 24 / 3.13, `macos-15-intel` / 24 / 3.11, `macos-26` / 24 / 3.13
- `ubuntu-22.04` / 22 / 3.11, `ubuntu-24.04` / 24 / 3.13, `ubuntu-24.04-arm` / 24 / 3.13
- `windows-2025` / 24 / 3.14 (experimental: it may fail without failing the workflow)

**Security:** the app has no login. It listens on `127.0.0.1` only (`npm run start` and the Start files use `-H 127.0.0.1`; Docker publishes `127.0.0.1:3000` only). Do not expose it to the internet or to your network. By default nothing is needed because the app only listens on `127.0.0.1`; other host names must be listed in `YPU_ALLOWED_HOSTS`.

### Privacy, legal and credits

- The app has no accounts and no login. It runs on your computer and your MP3 files stay on your computer. To work, it contacts Spotify (to read the public song list) and YouTube (to get the audio) through spotDL, and it downloads its helper programs (packages with `pip` and `npm`, and ffmpeg and deno) when they are missing.
- **Disclaimer:** this tool is for educational purposes and personal archiving. It does not promote piracy of copyrighted material. Respect copyright law in your country and the terms of the services you use. Please support artists through official streaming platforms.
- License: [MIT](LICENSE).
- Contributions are welcome: open an issue or a pull request.
- Credits: [spotDL](https://github.com/spotDL/spotify-downloader), [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org/), [Next.js](https://nextjs.org/).

---

## Türkçe

Spotify çalma listelerinizi kendi bilgisayarınızda MP3 dosyası olarak indirin.

**İçindekiler:** [Hakkında](#hakkında) · [Hızlı başlangıç](#hızlı-başlangıç) · [Gerekenler](#gerekenler) · [Uygulamayı kullanma](#uygulamayı-kullanma) · [Bir şey ters giderse](#bir-şey-ters-giderse) · [Docker (isteğe bağlı)](#docker-isteğe-bağlı) · [Geliştiriciler için](#geliştiriciler-için) · [Gizlilik, yasal uyarı ve teşekkürler](#gizlilik-yasal-uyarı-ve-teşekkürler)

### Hakkında

YPU Music, kendi bilgisayarınızda çalışan küçük bir uygulamadır. Bir Spotify çalma listesi bağlantısını veya bir Spotify şarkı bağlantısını yapıştırırsınız. Uygulama şarkıları bilgisayarınızdaki bir klasöre MP3 dosyası olarak kaydeder. Bunun için ücretsiz ve açık kaynaklı [spotDL](https://github.com/spotDL/spotify-downloader) aracını kullanır. COROS Pace 4 saatime müzik atmak için yaptım, ama MP3 dosyaları her oynatıcıda çalışır.

Programlama bilmeniz gerekmez. Tek bir dosyaya çift tıklarsınız ve tarayıcınızda bir web sayfası açılır.

> **Neler yapabilir, neler yapamaz**
>
> - Yalnızca **herkese açık** Spotify çalma listeleriyle ve **tek şarkılarla** çalışır. Özel çalma listeleri, albümler ve sanatçı sayfaları çalışmaz.
> - Her zaman internet bağlantısı gerekir.
> - Bir çalma listesi birkaç dakika sürer, çünkü şarkılar tek tek indirilir.
> - Birkaç şarkı bulunamayabilir. Uygulama bunları sonunda size listeler.

### Hızlı başlangıç

Bunu bir kez yaparsınız. Sisteminizi seçin: [Windows](#windows-1), [macOS](#macos-1) veya [Linux](#linux-1).

#### Windows

1. Tarayıcınızda <https://github.com/mgurlek/ypu-music> adresini açın. Yeşil **Code** düğmesine, sonra **Download ZIP**'e (sıkıştırılmış klasör) tıklayın.
2. İndirilen ZIP dosyasına sağ tıklayın ve **Extract All** (Tümünü ayıkla) seçeneğine tıklayın. `C:\` gibi kısa bir yer seçin. `C:\ypu-music-main` gibi bir klasör oluşur. Adını `C:\ypu-music` olarak değiştirebilirsiniz.
3. Klasör adını kontrol edin. OneDrive içindeki bir klasörü kullanmayın (Masaüstü ve Belgeler klasörleriniz OneDrive içinde olabilir). Yolun hiçbir klasör adında `&`, `^` veya `;` işareti kullanmayın. Windows çok uzun yolları işleyemez, bu yüzden yolu kısa tutun.
4. Klasörü açın. `Start-Windows.bat` dosyasını ve `kaynak-kodlar` adlı bir klasörü görürsünüz (anlamı: "kaynak kodlar").
5. `Start-Windows.bat` dosyasına çift tıklayın. Windows `.bat` uzantısını gizleyebilir. Windows veya antivirüs programınız yeni indirdiğiniz bir dosya için uyarı gösterirse, yalnızca bu depoya güveniyorsanız devam edin.
6. Siyah bir pencere (terminal) açılır. `[1/6]` ile `[6/6]` arasında sayar ve Türkçe ile İngilizce yazar. Bir şey yazmanız gerekmez. Node.js ve Python'u kontrol eder, özel bir Python klasörü oluşturur, spotDL'i kurar, eksikse ffmpeg'i (MP3 dosyası yapan bir araç, yaklaşık 70 MB) ve deno adlı bir yardımcıyı indirir, uygulamanın dosyalarını kurar, uygulamayı derler, 3000 ile 3010 arasında boş bir kapı (port; uygulamanın kullandığı bir kapı numarası) bulur ve uygulamayı başlatır.
7. Pencere **Node.js**'in eksik veya çok eski olduğunu söylerse <https://nodejs.org/> sayfasını açar. Yeşil **LTS** sürümünü (LTS uzun süreli destek demektir, güvenli seçimdir) indirin, kurun ve her ekranda İleri'ye tıklayın. Sonra siyah pencereyi kapatın ve `Start-Windows.bat` dosyasına yeniden çift tıklayın.
8. Pencere **Python**'un eksik olduğunu söylerse <https://www.python.org/downloads/> sayfasını açar. Sarı **Download Python** düğmesine tıklayın ve dosyayı çalıştırın. Kurulum ekranında **Add python.exe to PATH** kutusu varsa (eski kurulumlarda **Add Python to PATH** yazar) işaretleyin (PATH, Windows'un programları aradığı yerlerin listesidir). Daha yeni "Python install manager" gelirse ve PATH'e bir klasör eklemeyi sorarsa evet deyin. Hangi Python'u kuracağını sorarsa 3.13'ü seçin (3.11 ile 3.15 arasındaki her sürüm olur). Sonra siyah pencereyi kapatın ve `Start-Windows.bat` dosyasına yeniden çift tıklayın.
9. Bekleyin. **UYGULAMA HAZIR** yazısını görünce tarayıcınız kendiliğinden açılır. Açılmazsa siyah pencerede yazan adresi tarayıcınıza yazın. Genellikle `http://localhost:3000` olur.
10. Bir Spotify çalma listesi veya şarkı bağlantısını kutuya yapıştırın. **Sıraya ekle** düğmesine basın.
11. MP3 dosyalarınızı `Indirilen-Muzikler` klasöründe bulursunuz. Klasör `kaynak-kodlar` klasörünün yanındadır, örneğin `C:\ypu-music-main\Indirilen-Muzikler`. Uygulama, klasörün tam yolunu kendi sayfasında da gösterir.
12. **Uygulamayı kullanırken siyah pencereyi kapatmayın. Pencereyi kapatmak uygulamayı durdurur.** Uygulamayı durdurmak için pencereyi kapatın veya Ctrl+C tuşlarına basın (Windows "Terminate batch job (Y/N)?" diye sorabilir; `Y` yazıp Enter'a basın).
13. Bir dahaki sefer `Start-Windows.bat` dosyasına yine çift tıklamanız yeter. İlk başlatma yaklaşık 2 dakika sürer (bir şeyler indirir). Sonraki başlatmalar yaklaşık 15 saniye sürer. Uygulama zaten çalışırken çift tıklarsanız ikinci pencere hiçbir şeyi yeniden derlemez: uygulamanın zaten çalıştığını yazar ve tarayıcınızı açar. Başka bir pencere hâlâ kurulum yapıyorsa o pencereyi beklemenizi ister ve hiçbir şeye dokunmadan kapanır.

#### macOS

1. Tarayıcınızda <https://github.com/mgurlek/ypu-music> adresini açın. Yeşil **Code** düğmesine, sonra **Download ZIP**'e (sıkıştırılmış klasör) tıklayın.
2. ZIP dosyasına çift tıklayarak açın. Açılan klasörü kendi ev klasörünüze taşıyın. Klasörü OneDrive, Dropbox veya iCloud Drive içinde tutmayın.
3. Klasörü açın. `Start-Mac.command` dosyasını ve `kaynak-kodlar` adlı bir klasörü görürsünüz (anlamı: "kaynak kodlar").
4. `Start-Mac.command` dosyasına çift tıklayın. macOS ilk seferde dosyayı engeller. İnternetten gelen dosyalar için bu normaldir. Apple, çözüm yolunu şöyle anlatır ([Apple Destek](https://support.apple.com/en-us/102445)): "On your Mac, choose Apple menu > System Settings, then click Privacy & Security in the sidebar." (Mac'inizde Apple menüsü > Sistem Ayarları'nı seçin, kenar çubuğunda Gizlilik ve Güvenlik'e tıklayın.) Aşağı kaydırın, dosyayla ilgili iletiyi bulun ve **Open Anyway** (Yine de Aç) düğmesine tıklayın. Apple şöyle der: "This button is available for about an hour after you try to open the app." (Bu düğme, dosyayı açmayı denedikten sonra yaklaşık bir saat boyunca vardır.) Sonra "Enter your login password, then click OK." (Giriş parolanızı yazın, sonra Tamam'a tıklayın.) (Daha fazla adım: [Apple Destek](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unknown-developer-mh40616/mac).)
5. Çift tıklamak hiçbir şey yapmazsa Terminal uygulamasını açın (Mac'inizin yazı penceresidir). `bash ` yazın (sonunda bir boşluk olsun), `Start-Mac.command` dosyasını Terminal penceresine sürükleyin ve Enter'a basın. Zaten klasördeyseniz bu, `bash Start-Mac.command` ile aynıdır.
6. Bir pencere açılır. `[1/6]` ile `[6/6]` arasında sayar ve Türkçe ile İngilizce yazar. Node.js ve Python'u kontrol eder, özel bir Python klasörü oluşturur, spotDL'i kurar, eksikse ffmpeg'i (MP3 dosyası yapan bir araç, yaklaşık 70 MB) ve deno adlı bir yardımcıyı indirir, uygulamanın dosyalarını kurar, uygulamayı derler, 3000 ile 3010 arasında boş bir kapı (port; uygulamanın kullandığı bir kapı numarası) bulur ve uygulamayı başlatır.
7. Pencere **Node.js**'in eksik veya çok eski olduğunu söylerse <https://nodejs.org/en/download> sayfasını açar. **LTS** sürümünü (`.pkg` dosyası) indirin ve kurun. Her ekranda Devam'a tıklayın. Sonra pencereyi kapatın ve `Start-Mac.command` dosyasına yeniden çift tıklayın. Homebrew kullanıyorsanız `brew install node` da olur.
8. Pencere **Python**'un eksik olduğunu söylerse <https://www.python.org/downloads/> sayfasını açar. **Download Python**'a tıklayın ve `.pkg` dosyasını kurun. Sonra pencereyi kapatın ve `Start-Mac.command` dosyasına yeniden çift tıklayın. Homebrew kullanıyorsanız `brew install python` da olur.
9. Bekleyin. **UYGULAMA HAZIR** yazısını görünce tarayıcınız kendiliğinden açılır. Açılmazsa penceredeki adresi tarayıcınıza yazın. Genellikle `http://localhost:3000` olur.
10. Bir Spotify çalma listesi veya şarkı bağlantısını kutuya yapıştırın. **Sıraya ekle** düğmesine basın.
11. MP3 dosyalarınızı `Indirilen-Muzikler` klasöründe bulursunuz. Klasör `kaynak-kodlar` klasörünün yanındadır. Uygulama, klasörün tam yolunu kendi sayfasında da gösterir.
12. **Uygulamayı kullanırken pencereyi kapatmayın. Pencereyi kapatmak uygulamayı durdurur.** Uygulamayı durdurmak için pencereyi kapatın veya Ctrl+C tuşlarına basın.
13. Bir dahaki sefer `Start-Mac.command` dosyasına yine çift tıklamanız yeter. İlk başlatma yaklaşık 2 dakika sürer (bir şeyler indirir). Sonraki başlatmalar yaklaşık 15 saniye sürer. Uygulama zaten çalışırken çift tıklarsanız ikinci pencere hiçbir şeyi yeniden derlemez: uygulamanın zaten çalıştığını yazar ve tarayıcınızı açar. Başka bir pencere hâlâ kurulum yapıyorsa o pencereyi beklemenizi ister ve hiçbir şeye dokunmadan kapanır.

#### Linux

1. Tarayıcınızda <https://github.com/mgurlek/ypu-music> adresini açın. Yeşil **Code** düğmesine, sonra **Download ZIP**'e (sıkıştırılmış klasör) tıklayın.
2. ZIP dosyasını açın (sağ tık, **Extract Here** veya Terminal'de `unzip`). Klasörü ev klasörünüze koyun. Klasörü OneDrive veya Dropbox içinde tutmayın.
3. Klasörü açın. `Start-Linux.sh` dosyasını ve `kaynak-kodlar` adlı bir klasörü görürsünüz (anlamı: "kaynak kodlar").
4. Bu klasörde bir Terminal (yazı penceresi) açın. `bash Start-Linux.sh` yazın ve Enter'a basın. Bazı masaüstlerinde `Start-Linux.sh` dosyasına çift tıklamak da çalışır; `bash Start-Linux.sh` her zaman çalışır.
5. Terminal `[1/6]` ile `[6/6]` arasında sayar ve Türkçe ile İngilizce yazar. Node.js ve Python'u kontrol eder, özel bir Python klasörü oluşturur, spotDL'i kurar, eksikse ffmpeg'i (MP3 dosyası yapan bir araç, yaklaşık 70 MB) ve deno adlı bir yardımcıyı indirir, uygulamanın dosyalarını kurar, uygulamayı derler, 3000 ile 3010 arasında boş bir kapı (port; uygulamanın kullandığı bir kapı numarası) bulur ve uygulamayı başlatır. Betik hiçbir zaman `sudo` kullanmaz. Sistem ayarlarını değiştirmez.
6. Pencere **Node.js**'in eksik veya çok eski olduğunu söylerse <https://nodejs.org/en/download> adresinden LTS sürümünü kurun. Birçok Linux sisteminin `nodejs` paketi çok eskidir: Ubuntu 22.04'te sürüm 12, Ubuntu 24.04 ve Debian 12'de sürüm 18'dir; uygulama ise 20.9 veya daha yenisini ister. Bunun yerine NodeSource'u (<https://github.com/nodesource/distributions>) veya nvm'i (<https://github.com/nvm-sh/nvm>) kullanın. Sonra `bash Start-Linux.sh` komutunu yeniden çalıştırın.
7. Pencere **Python**'un eksik olduğunu söylerse sisteminize uyan satırı Terminal'e kopyalayın (parolanızı sorar), sonra `bash Start-Linux.sh` komutunu yeniden çalıştırın. Python'unuz 3.11'den eskiyse (Ubuntu 22.04'te 3.10 vardır), bunun yerine <https://www.python.org/downloads/> adresinden daha yenisini kurun:
   - Debian, Ubuntu, Mint: `sudo apt install python3 python3-venv python3-pip`
   - Fedora: `sudo dnf install python3 python3-pip`
   - Arch, Manjaro: `sudo pacman -S python python-pip`
8. ffmpeg indirilemezse kendiniz kurun (aşağıdaki sorun giderme tablosuna bakın): Debian, Ubuntu ve Mint'te `sudo apt install ffmpeg`.
9. Bekleyin. **UYGULAMA HAZIR** yazısını görünce tarayıcınız kendiliğinden açılır. Açılmazsa Terminal'deki adresi tarayıcınıza yazın. Genellikle `http://localhost:3000` olur.
10. Bir Spotify çalma listesi veya şarkı bağlantısını kutuya yapıştırın. **Sıraya ekle** düğmesine basın.
11. MP3 dosyalarınızı `Indirilen-Muzikler` klasöründe bulursunuz. Klasör `kaynak-kodlar` klasörünün yanındadır. Uygulama, klasörün tam yolunu kendi sayfasında da gösterir.
12. **Uygulamayı kullanırken Terminal'i kapatmayın. Terminal'i kapatmak uygulamayı durdurur.** Uygulamayı durdurmak için Terminal'i kapatın veya Ctrl+C tuşlarına basın.
13. Bir dahaki sefer `bash Start-Linux.sh` komutunu yine çalıştırın. İlk başlatma yaklaşık 2 dakika sürer (bir şeyler indirir). Sonraki başlatmalar yaklaşık 15 saniye sürer. Uygulama zaten çalışırken başlatırsanız ikinci pencere hiçbir şeyi yeniden derlemez: uygulamanın zaten çalıştığını yazar ve tarayıcınızı açar. Başka bir pencere hâlâ kurulum yapıyorsa o pencereyi beklemenizi ister ve hiçbir şeye dokunmadan kapanır.

### Gerekenler

| | Windows | macOS | Linux |
|---|---|---|---|
| En düşük sistem | Windows 10 veya 11, 64 bit | macOS 13.5 veya daha yenisi | glibc 2.28 veya daha yeni ve çekirdek (kernel) 4.18 veya daha yeni 64 bit bir Linux (örneğin Ubuntu 20.04, Debian 10, RHEL 8) |
| İşlemciler | Intel/AMD (x64). ARM64 de çalışır, ama ffmpeg'i kendiniz kurmalısınız. | Intel ve Apple Silicon | x64 ve ARM64 |
| Başlatma dosyası | `Start-Windows.bat` | `Start-Mac.command` | `Start-Linux.sh` |

Bu en düşük sürümlerin nedenleri:

- **Windows 10 veya 11, 64 bit.** Uygulamanın çatısı olan Next.js 16'nın 32 bit Windows için program dosyası yoktur (paket listesinde `win32-ia32` yapısı yok). Node.js 24 ve 26 en düşük sistem olarak "Windows 10/Server 2016" yazar ve 32 bit Windows için indirme sunmaz. Windows 7, 8 ve 8.1 desteklenmez. Kaynaklar: [npm kayıt defterinde Next.js 16.4.6](https://registry.npmjs.org/next/16.4.6), [Node.js 24 platform listesi](https://raw.githubusercontent.com/nodejs/node/v24.x/BUILDING.md), [Node.js 26 platform listesi](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md).
- **macOS 13.5.** Node.js 24 ve 26 en düşük sistem olarak "macOS 13.5" yazar ([Node.js 26 platform listesi](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md)). Daha eski Mac'ler: denemedik. Homebrew macOS 15 veya üstünü destekler ([Homebrew belgeleri](https://docs.brew.sh/Installation)); normal Hızlı başlangıç için Homebrew gerekmez.
- **Linux.** Node.js, x64 ve ARM64 için "kernel >= 4.18, glibc >= 2.28" yazar ([Node.js 26 platform listesi](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md)). Alpine Linux ve diğer musl sistemleri: denenmedi.
- **Windows ARM64.** Node.js'in yerel ARM64 yapıları vardır ([Node.js 26 platform listesi](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md)). Python'un ARM64 Windows kurucusu "Experimental" (deneysel) olarak işaretlidir ([python.org](https://www.python.org/downloads/release/python-3143/)). Windows ARM64 için otomatik ffmpeg indirmesi yoktur; ffmpeg'i elle kurun (sorun giderme tablosuna bakın).

Başlatma dosyasının kendisinin kurduğu şeyler ve sizin kuracaklarınız:

| | Kendiniz kurarsınız (bir kez) | Başlatma dosyası sizin yerinize yapar |
|---|---|---|
| Node.js 20.9 veya daha yenisi (en iyisi LTS sürümü) | Evet, <https://nodejs.org/> adresinden | Hayır |
| Python 3.11 ile 3.15 arası (3.16 ve üstü spotDL 4.6 ile çalışmaz) | Evet, <https://www.python.org/downloads/> adresinden | Hayır |
| spotDL ve yt-dlp (Python parçaları) | Hayır | Evet, özel bir klasöre (`kaynak-kodlar\.venv`) |
| ffmpeg (sesi MP3'e çevirir) | Yalnızca indirme başarısız olursa | Evet, yaklaşık 70 MB (Windows ARM64'te değil) |
| deno (bazı YouTube şarkılarının gerek duyduğu yardımcı) | Hayır | Evet |
| Uygulamanın kendi dosyaları | Hayır | Evet (her başlatmada `npm ci`, sonra `npm run build`) |

Süre: ilk başlatma, test bilgisayarımızda ve internet bağlantımızda yaklaşık 2 dakika sürdü. Sonraki başlatmalar yaklaşık 15 saniye sürdü. Daha yavaş internet daha uzun sürer. Disk alanını ölçmedik.

Tarayıcı: güncel her tarayıcı olur. Tarayıcı dili Türkçeyse uygulama Türkçe, diğer tüm dillerde İngilizce gösterilir.

### Uygulamayı kullanma

Sayfanın adı **Çalma Listesi İndir** (İngilizcesi: **Download Playlist**). Menüde **Ana Sayfa** ve **Kitaplığın** vardır.

1. Spotify'dan bir bağlantı kopyalayın. Bağlantı `https://open.spotify.com/` ile başlamalı ve bir çalma listesine veya tek bir şarkıya işaret etmelidir. Çalma listesi herkese açık olmalıdır.
2. Bağlantıyı **Spotify çalma listesi veya şarkı bağlantısı** kutusuna yapıştırın.
3. **Sıraya ekle** düğmesine basın. Uygulama şarkı listesini okurken **Şarkılar getiriliyor...** yazar. Büyük listeler bir dakika sürebilir. Bu adımı durdurmak için **Vazgeç**'e basın. O zaman hiçbir şey eklenmez.
4. Sayfa **"ad" listesinden N şarkı sıraya eklendi.** yazar.
5. Şu anki şarkı için **Şu an indiriliyor** bölümüne, geri kalanlar için **Sıra** bölümüne (**Sıradakiler**) bakın. Şarkılar tek tek iner.
6. Sırada bir şarkıyı yukarı veya aşağı taşıyabilir, bir şarkıyı ya da bir çalma listesinin tamamını sıradan kaldırabilir veya şu anki indirmeyi iptal edebilirsiniz.
7. Her şeyi durdurmak için **Hepsini durdur**'a basın. Uygulama **Emin misin? İndirme durur ve sıra boşaltılır.** diye sorar. **Evet, hepsini durdur** veya **Hayır, devam etsin** diye yanıtlayın.
8. Bir indirme yalnızca şarkı gerçekten indirildiğinde veya çalma listesi klasöründe zaten mevcut olduğunda tamamlandı sayılır. Sıra bitince **Tamamlandı** bölümü kaç şarkının indirildiğini ve kaçının başarısız olduğunu gösterir (örneğin "12 indirildi, 1 başarısız"). Bir indirmeyi iptal etmek veya **Hepsini durdur**'a basmak başarısız sayılmaz. **Bu şarkılar indirilemedi** başarısız şarkıları listeler.
9. **Teknik ayrıntıları göster** ham günlüğü açar. Yalnızca yardım isterken gerekir.
10. **MP3 dosyaların bu klasöre kaydedilir** kutusu klasörü gösterir. **Kopyala** düğmesi yolu kopyalar.
11. **Kitaplığın**, indirdiğiniz çalma listelerini ve içindeki şarkıları listeler.
12. Bir şerit **İndirmeler duraklatıldı** derse, her şarkıyı bir şey engelliyordur (örneğin internet yok). Sıranız korunur. Sorunu giderin, sonra **Tekrar dene**'ye basın.

### Bir şey ters giderse

| Ne görüyorsunuz | Anlamı ve ne yapmalı |
|---|---|
| Siyah pencere **Python bulunamadı** diyor veya `python` yazınca Microsoft Store açılıyor | Microsoft Store'daki `python` adlı kısayol gerçek Python değildir. Python'u <https://www.python.org/downloads/> adresinden kurun (Hızlı başlangıç, Windows, 8. adım). Kurduktan sonra siyah pencereyi kapatın ve Başlatma dosyasına yeniden çift tıklayın. Kurulumdan önce açık olan pencere yeni Python'u görmez. |
| Pencere Python **3.16** (veya daha yenisinin) bulunduğunu ama desteklenmediğini söylüyor | spotDL 4.6 yalnızca Python 3.11 ile 3.15 arasıyla çalışır. <https://www.python.org/downloads/> adresinden Python 3.13 veya 3.14'ü yanına kurun, sonra yeniden başlatın. |
| Pencere **Node.js**'in eksik veya çok eski olduğunu söylüyor | <https://nodejs.org/en/download> adresinden LTS sürümünü kurun, siyah pencereyi kapatın, yeniden başlatın. Linux'ta `apt`'in eski `nodejs` paketini kullanmayın (Hızlı başlangıç, Linux, 6. adım). |
| **ffmpeg KURULAMADI** | ffmpeg olmadan MP3 yapılamaz. Elle kurun, siyah pencereyi kapatın ve yeniden başlatın. **Windows** (Windows ARM64'te de gerekir): Başlat menüsünde `PowerShell` yazıp açın ve `winget install Gyan.FFmpeg` komutunu çalıştırın. **macOS:** Terminal'de `brew install ffmpeg` çalıştırın (`brew` yoksa önce <https://brew.sh> adresinden Homebrew'u kurun). **Debian, Ubuntu, Mint:** `sudo apt install ffmpeg`. **Fedora:** `sudo dnf install ffmpeg` (RPM Fusion deposu gerekir). **Arch, Manjaro:** `sudo pacman -S ffmpeg`. |
| Kurulum dosyalar, yollar veya "özel Python klasörü oluşturulamadı" ile ilgili hatalarla duruyor | Klasör yolunu kontrol edin. Windows 260 karakterden uzun yolları işleyemez. Klasörün tamamını `C:\ypu-music` gibi kısa bir yere taşıyın. OneDrive kullanmayın. Klasör adında `&`, `^` veya `;` kullanmayın; bunlar Windows'ta npm'i bozar. (Yol 130 karakterden uzunsa Windows başlatma dosyası özel Python klasörünü bunun yerine `%LOCALAPPDATA%\YPU-Music\venv` içinde tutar.) |
| **İndirmeler duraklatıldı** şeridi ve **Tekrar dene** düğmesi | Bir sorun bütün şarkıları etkiliyor, örneğin: internet yok, YouTube çok fazla istek yüzünden geçici olarak engelledi, disk dolu veya müzik klasörüne yazılamıyor. Sıranız korunur. Şeritteki iletiyi okuyun, sorunu giderin (interneti kontrol edin, birkaç dakika bekleyin, biraz disk yeri açın), sonra **Tekrar dene**'ye basın. |
| Bir şarkı **Bu şarkılar indirilemedi** altında, "YouTube üzerinde bulunamadı" notuyla listeleniyor | Uygulama her şarkıyı YouTube'da arar. Bazı şarkılar orada yoktur veya erişime kapalıdır. Diğer şarkılar etkilenmez. Uygulamada yapabileceğiniz bir şey yok. |
| Sayfa çalma listesinin **açılamadığını** söylüyor | Çalma listesi herkese açık olmalıdır. Spotify'da listeyi herkese açık yapın veya bağlantıyı yeniden kopyalayın. Albüm ve sanatçı bağlantıları desteklenmez. Yalnızca `https://open.spotify.com/` ile başlayan bağlantılar çalışır. |
| 3000 numaralı kapı (port) meşgul | Başlatma dosyası 3000 ile 3010 arasındaki kapılara bakar ve ilk boş olanı kullanır. Tarayıcınız o kapıyı açar. Tarayıcı açılmazsa siyah penceredeki adresi okuyun. |
| Siyah pencereyi yanlışlıkla kapattınız | Uygulama durdu. Başlatma dosyasına yeniden çift tıklayın. İndirdiğiniz MP3 dosyaları güvendedir. Yeniden başlatınca sıra boştur; bağlantıyı yeniden ekleyin. |
| İki kez çift tıkladınız veya ikinci pencere uygulamanın **zaten çalıştığını** ya da **hâlâ hazırlandığını** söylüyor | Uygulama zaten çalışıyorsa ikinci pencere tarayıcınızı açar ve o ikinci pencereyi kapatabilirsiniz. Hâlâ kurulum yapılıyorsa (ilk başlatma birkaç dakika sürebilir) ilk pencereyi kapatmayın: bitmesini bekleyin; uygulama hazır olduğunda tarayıcı kendiliğinden açılır. |
| Sayfa **uygulamaya ulaşılamadığını** söylüyor | Siyah pencere kapalı veya uygulama durdu. Başlatma dosyasıyla yeniden başlatın. |
| Windows, antivirüs programınız veya macOS dosyayı engelliyor | Yalnızca bu depoya güveniyorsanız devam edin. macOS'ta **Sistem Ayarları > Gizlilik ve Güvenlik > Open Anyway** yolunu kullanın (Hızlı başlangıç, macOS, 4. adım) veya Terminal'de `bash Start-Mac.command` çalıştırın. |
| Haftalarca çalıştıktan sonra indirmeler birden başarısız oluyor | YouTube sık değişir ve indirme aracı (yt-dlp) bunu izlemek zorundadır. Siyah pencereyi kapatın ve Başlatma dosyasına yeniden çift tıklayın. Her başlatmada yt-dlp'yi ve spotDL'i günceller (bunun için internet gerekir). |
| Windows'ta Docker: `500 Internal Server Error` veya `dockerDesktopLinuxEngine` | Docker'ın WSL2 motoru takılmıştır. PowerShell veya CMD açıp `wsl --shutdown` çalıştırın. Docker Desktop'ı sistem tepsisinden (saatin yanından) kapatın. Yeniden açın. |
| Linux'ta Docker: müzik klasörüne yazılamıyor | İlk `docker compose up` öncesinde klasörü kendiniz oluşturun, `kaynak-kodlar` klasörünü içeren klasörde: `mkdir Indirilen-Muzikler`. Docker oluşturursa klasör root kullanıcısına ait olur ve kapsayıcı kullanıcısı içine yazamaz. Yine olmazsa `chmod 777 Indirilen-Muzikler` çalıştırın. |
| Windows'ta elle kurulum: PowerShell `npm.ps1 cannot be loaded because running scripts is disabled` diyor | Bu yalnızca elle kurulumu etkiler, Başlatma dosyasını değil. npm komutlarını PowerShell yerine Komut İstemi'nde (cmd) çalıştırın. Başka bir yol `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` komutudur; kullanıcı hesabınız için bir Windows ayarını değiştirir, bu yüzden yalnızca ne yaptığını anlıyorsanız kullanın. |

### Docker (isteğe bağlı)

Docker, Başlatma dosyasına bir alternatiftir. Uygulamayı, içinde Node.js, Python, spotDL ve ffmpeg hazır bulunan bir kutuda (kapsayıcıda) çalıştırır. Yalnızca Docker'ı zaten biliyorsanız kullanın. Başlatma dosyası daha kolaydır.

1. Docker'ı kurun. **Windows:** [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/). Sayfası şunları sıralar: Enterprise, Pro veya Education sürümlerinde Windows 10 64 bit (22H2, build 19045) ya da Windows 11 64 bit (23H2, build 22631) veya üstü (Windows Home orada listelenmez), WSL 2.1.5 veya sonrası, WSL 2 özelliği, 8 GB RAM ve BIOS/UEFI'de açık donanım sanallaştırma. **macOS:** [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/); "güncel ve önceki iki ana macOS sürümünü" destekler. **Linux:** Docker Engine'i Compose eklentisiyle kurun ([yönergeler](https://docs.docker.com/engine/install/)). Docker'ı başlatın ve çalışır duruma gelmesini bekleyin.
2. Linux'ta önce müzik klasörünü oluşturun, `kaynak-kodlar` klasörünü içeren klasörde: `mkdir Indirilen-Muzikler`.
3. İndirdiğiniz klasörün içindeki `kaynak-kodlar` klasöründe bir terminal açın.
4. Şunu çalıştırın: `docker compose up -d --build`. İlk derleme birkaç dakika sürer.
5. Tarayıcınızda <http://localhost:3000> adresini açın.
6. MP3 dosyalarınız `kaynak-kodlar` klasörünün yanındaki `Indirilen-Muzikler` klasöründe görünür (compose dosyası `../Indirilen-Muzikler` klasörünü kapsayıcıya bağlar).
7. Yeni bir sürüm indirdikten sonra güncellemek için: `docker compose build --no-cache`, sonra `docker compose up -d` çalıştırın.
8. Durdurmak için: `docker compose down` çalıştırın.

Kapsayıcıya yalnızca bu bilgisayardan ulaşılır (`127.0.0.1:3000`), ağınızdaki başka bilgisayarlardan ulaşılamaz. `docker compose` komutunu (boşlukla) kullanın, eski `docker-compose` komutunu değil.

### Geliştiriciler için

**Gerekenler:** Node.js 20.9 veya daha yenisi, Python 3.11 ile 3.15 arası ve ffmpeg (`python -m spotdl --download-ffmpeg` komutu indirebilir; Deno isteğe bağlıdır: `python -m spotdl --download-deno`).

**Elle kurulum** (`kaynak-kodlar` klasöründe çalıştırın):

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm ci
npm run build
npm run start      # http://127.0.0.1:3000   (geliştirme için: npm run dev)
```

```bat
:: Windows (Komut İstemi)
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
npm ci
npm run build
npm run start
```

Uygulama spotDL'i bulamazsa doğru Python'u gösterin: `YPU_PYTHON=.venv/bin/python` (macOS/Linux) veya `set YPU_PYTHON=.venv\Scripts\python.exe` (Windows).

**Uygulamanın okuduğu ortam değişkenleri:**

| Değişken | Varsayılan | Anlamı |
|---|---|---|
| `YPU_PYTHON` | ayarlı değil (Windows'ta `py -3`, `python`, `python3`; diğerlerinde `python3`, `python` denenir) | spotDL'in kurulu olduğu Python'un tam yolu. Başlatma dosyaları bunu özel klasöre ayarlar. |
| `DOWNLOAD_DIR` | `../Indirilen-Muzikler` (`kaynak-kodlar` klasörünün yanında) | MP3 dosyalarının kaydedildiği klasör. |
| `YPU_METADATA_TIMEOUT_MS` | `180000` (3 dakika) | Bir çalma listesini okumanın en fazla ne kadar sürebileceği. |
| `YPU_STALL_MS` | `300000` (5 dakika); `1000` altındaki değerler yok sayılır | Bu süre boyunca hiçbir şey yazmayan bir şarkı indirmesi durdurulur. |
| `YPU_ALLOWED_HOSTS` | ayarlı değil | API'nin kabul ettiği ek ana bilgisayar adları, virgülle ayrılmış (büyük/küçük harf duyarsız). DNS yeniden bağlama (DNS rebinding) saldırılarını engellemek için uygulama varsayılan olarak yalnızca `localhost`, `127.0.0.1`, `[::1]` ve `*.localhost` adlarını kabul eder. |

Başlatma dosyaları ayrıca `--check` seçeneğini (yalnızca bakar, hiçbir şeyi değiştirmez, bir durum tablosu yazar; çıkış kodu 0 hazır demektir) ve test değişkenleri `YPU_NO_PAUSE=1`, `YPU_NO_BROWSER=1` ile `YPU_PORT_START=<kapı>` değişkenlerini anlar. `Start-Windows.bat` dosyasında ayrıca `YPU_TIMING=1` vardır. `.gitattributes` doğru satır sonlarını korur (`.bat` için CRLF, `.sh` ve `.command` için LF); bunları değiştirmeyin.

**Proje yapısı:**

```
Start-Windows.bat, Start-Mac.command, Start-Linux.sh   tek tıkla başlatıcılar
.github/workflows/ci.yml                               CI
kaynak-kodlar/                                         uygulama ("kaynak kodlar")
  src/app/                                             sayfa (page.tsx) ve API yolları: metadata, queue, playlist, library
  src/lib/                                             queueManager.ts, i18n.ts, messages.ts, paths.ts, python.ts, guard.ts, spotifyUrl.ts
  scripts/get_playlist.py                              çalma listesi / şarkı bilgisini spotDL ile okur
  scripts/smoke-test.mjs                               duman testi
  Dockerfile, docker-compose.yml, requirements.txt
Indirilen-Muzikler/                                    MP3 dosyalarınız (ilk başlatmada oluşur, git'te yok)
```

**Kontroller** (`kaynak-kodlar` içinde):

```bash
npm run lint
npx tsc --noEmit
node scripts/smoke-test.mjs                      # önce "npm run build" gerekir; kendi sunucusunu başlatır
node scripts/smoke-test.mjs http://127.0.0.1:3000   # zaten çalışan bir sunucuyu sınar
```

**CI** ([iş akışı](https://github.com/mgurlek/ypu-music/actions/workflows/ci.yml)) her push'ta, her pull request'te ve elle çalışır. Üstteki rozet son sonucu gösterir. `build-test` işi `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `pip install -r requirements.txt`, `python -m spotdl --version` ve duman testini şu 11 birleşimde çalıştırır (sistem / Node.js / Python):

- `windows-2022` / 22 / 3.11, `windows-2025` / 24 / 3.13, `windows-11-arm` / 24 / 3.13
- `macos-15-intel` / 22 / 3.11, `macos-15` / 24 / 3.13, `macos-26` / 24 / 3.11
- `ubuntu-22.04` / 22 / 3.11, `ubuntu-24.04` / 24 / 3.13, `ubuntu-24.04-arm` / 24 / 3.13
- `ubuntu-24.04` / 20.9.0 / 3.11 (desteklenen en eski Node.js), `ubuntu-24.04` / 26 / 3.13 (Docker imajının Node.js sürümü)

`docker` işi imajı `docker compose build` ile derler, başlatır, sağlıklı olana kadar bekler, duman testini ona karşı çalıştırır, içinde `ffmpeg`, `spotdl` ve `deno` komutlarını yoklar ve kapsayıcının root olarak çalışmadığını denetler.

`launcher` işi gerçek Başlatma dosyalarını (`Start-Windows.bat`, `Start-Mac.command`, `Start-Linux.sh`) bir acemi çift tıklıyormuş gibi, kimse başında olmadan çalıştırır. Her hücrede şunları yapar: kurulumdan önce `--check` komutunun 1 koduyla çıktığını denetler, başlatıcıyı arka planda başlatır, uygulama için en fazla 12 dakika bekler, duman testini ona karşı çalıştırır, özel sanal ortamı, spotDL içe aktarmasını, ffmpeg'i ve `Indirilen-Muzikler` klasörünü denetler, uygulama çalışırken `--check` komutunu yeniden çalıştırır (0 koduyla çıkmalı, READY yazmalı ve 3000 meşgul olduğu için 3001 kapısını seçmeli), her şeyi durdurur ve başlatıcı günlüklerini yükler. `windows-11-arm` üzerinde ffmpeg'in eksik olması yalnızca uyarıdır. Hiç müzik indirmez (Spotify veya YouTube çağrısı yok). Şu 10 birleşimde çalışır (sistem / Node.js / Python):

- `windows-2022` / 22 / 3.11, `windows-2025` / 24 / 3.13, `windows-11-arm` / 24 / 3.13
- `macos-15` / 24 / 3.13, `macos-15-intel` / 24 / 3.11, `macos-26` / 24 / 3.13
- `ubuntu-22.04` / 22 / 3.11, `ubuntu-24.04` / 24 / 3.13, `ubuntu-24.04-arm` / 24 / 3.13
- `windows-2025` / 24 / 3.14 (deneysel: başarısız olabilir ama iş akışını başarısız saymaz)

**Güvenlik:** uygulamada oturum açma yoktur. Yalnızca `127.0.0.1` üzerinde dinler (`npm run start` ve Başlatma dosyaları `-H 127.0.0.1` kullanır; Docker yalnızca `127.0.0.1:3000` yayınlar). Uygulamayı internete veya yerel ağınıza açmayın. Varsayılan olarak bir ayar gerekmez çünkü uygulama yalnızca `127.0.0.1` üzerinde dinler; diğer ana bilgisayar adlarının `YPU_ALLOWED_HOSTS` içine yazılması gerekir.

### Gizlilik, yasal uyarı ve teşekkürler

- Uygulamada hesap ve oturum açma yoktur. Bilgisayarınızda çalışır ve MP3 dosyalarınız bilgisayarınızda kalır. Çalışmak için spotDL aracılığıyla Spotify'a (herkese açık şarkı listesini okumak için) ve YouTube'a (sesi almak için) bağlanır; eksikse yardımcı programlarını (`pip` ve `npm` ile paketler, ffmpeg ve deno) indirir.
- **Yasal uyarı:** bu araç eğitim ve kişisel arşivleme amacıyla hazırlanmıştır. Telif haklı eserlerin izinsiz çoğaltılmasını desteklemez. Ülkenizdeki telif hakkı yasasına ve kullandığınız hizmetlerin şartlarına uyun. Lütfen sanatçıları resmi müzik servisleriyle destekleyin.
- Lisans: [MIT](LICENSE).
- Katkılar memnuniyetle karşılanır: bir issue veya pull request açın.
- Teşekkürler: [spotDL](https://github.com/spotDL/spotify-downloader), [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org/), [Next.js](https://nextjs.org/).
