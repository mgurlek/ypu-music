<div align="center">
  <h1>🎵 YPU Music</h1>
  <p><em>Çetrefilli adamların kulübü.</em></p>
  <p>Download Spotify playlists and tracks as tagged MP3s, built for offline players and sports watches.</p>

  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
  [![SpotDL](https://img.shields.io/badge/SpotDL-v4-blue?style=for-the-badge&logo=python&logoColor=white)](https://github.com/spotDL/spotify-downloader)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

  🇺🇸 [English](#-english) · 🇹🇷 [Türkçe](#-türkçe)
</div>

---

## 🇺🇸 English

**YPU Music** is an open-source web app that runs on your own machine. Paste a Spotify playlist or track link and it downloads the songs as MP3 files with their metadata intact. I built it to put music on my COROS Pace 4 watch, but the files work anywhere.

### ✨ Features

- Paste a Spotify playlist or track link and get tagged MP3s (title, artist, album, cover art)
- Download queue: reorder, remove or cancel tracks while it runs
- Live logs with readable error messages (missing FFmpeg, rate limits, unavailable tracks)
- Songs are grouped into one folder per playlist
- Runs locally, nothing is uploaded to a third-party server

### 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend / API | Next.js 16 (App Router), React 19, TypeScript |
| Download engine | [spotDL](https://github.com/spotDL/spotify-downloader) (Python) |
| Playlist parsing | `spotify-url-info`, `scripts/get_playlist.py` |
| Packaging | Docker, docker-compose |

### 🚀 Getting Started

Pick one method. **Docker is recommended** because it bundles Node.js, Python, spotDL and FFmpeg for you.

#### Option 1: Docker (recommended)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and make sure it is running. Or from a terminal:

   | OS | Command |
   |----|---------|
   | macOS | `brew install --cask docker` |
   | Windows | `winget install Docker.DockerDesktop` |
   | Linux | `sudo apt update && sudo apt install docker.io docker-compose` |

2. Clone the repo and start the app:

   ```bash
   git clone https://github.com/mgurlek/ypu-music.git
   cd ypu-music/kaynak-kodlar
   docker-compose up --build
   ```

3. Open <http://localhost:3000>. Downloads are saved to the `Indirilen-Muzikler` folder next to `kaynak-kodlar`.

#### Option 2: Manual installation

You need [Node.js](https://nodejs.org/) (includes `npm`), [Python 3](https://www.python.org/downloads/) and [FFmpeg](https://ffmpeg.org/download.html).

> **Windows:** tick **"Add Python to PATH"** in the Python installer, then open a new terminal.

| OS | Command |
|----|---------|
| macOS | `brew install node python ffmpeg` |
| Windows | `winget install OpenJS.NodeJS Python.Python.3.11 Gyan.FFmpeg` |
| Linux | `sudo apt update && sudo apt install nodejs npm python3 python3-pip ffmpeg` |

```bash
git clone https://github.com/mgurlek/ypu-music.git
cd ypu-music/kaynak-kodlar

npm install
pip install spotdl      # macOS: pip3 install spotdl --break-system-packages
npm run dev
```

Open <http://localhost:3000> and keep the terminal open while downloading.

### 🏗️ How it works

```
Browser ──► Next.js API routes ──► QueueManager (singleton)
                │                        │
                │                        └─► spawns `python -m spotdl <url>` one track at a time
                └─► scripts/get_playlist.py (reads playlist / track metadata)
```

- `src/app/` holds the UI and the API routes (`metadata`, `queue`, `playlist`, `library`).
- `src/lib/queueManager.ts` runs the queue and streams spotDL output into the log panel.
- `scripts/get_playlist.py` uses spotDL to list the tracks of a link.

### 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| **Docker on Windows: `500 Internal Server Error` / `dockerDesktopLinuxEngine`** | The WSL2 backend froze. Run `wsl --shutdown` in PowerShell/CMD, quit Docker Desktop from the system tray and start it again. |
| **"FFmpeg is not installed"** (manual install) | Install FFmpeg (see table above) or run `spotdl --download-ffmpeg`, then restart the app. |
| **"Python or spotDL not found"** | Check that `python --version` (Windows) or `python3 --version` (macOS/Linux) works and that `pip install spotdl` finished. |
| **"Too many requests"** | YouTube rate-limited you. Wait a few minutes and retry. |

### 🤝 Contributing

Issues and pull requests are welcome.

### ⚠️ Disclaimer

This tool is for educational purposes and personal archiving. It does not promote piracy of copyrighted material. Please support artists through official streaming platforms.

---

## 🇹🇷 Türkçe

**YPU Music**, kendi bilgisayarınızda çalışan açık kaynaklı bir web uygulamasıdır. Spotify çalma listesi veya parça linkini yapıştırırsınız, şarkılar metadata'sı korunmuş MP3 dosyaları olarak iner. COROS Pace 4 saatime müzik atmak için yaptım, ama dosyalar her yerde çalışır.

### ✨ Özellikler

- Spotify çalma listesi veya parça linkinden etiketli MP3 (başlık, sanatçı, albüm, kapak)
- İndirme kuyruğu: çalışırken parçaları sıralayın, kaldırın veya iptal edin
- Canlı loglar ve anlaşılır hata mesajları (FFmpeg eksik, istek sınırı, bulunamayan parça)
- Her çalma listesi için ayrı klasör
- Her şey yerelde çalışır, hiçbir şey üçüncü taraf bir sunucuya yüklenmez

### 🧰 Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Arayüz / API | Next.js 16 (App Router), React 19, TypeScript |
| İndirme motoru | [spotDL](https://github.com/spotDL/spotify-downloader) (Python) |
| Liste ayrıştırma | `spotify-url-info`, `scripts/get_playlist.py` |
| Paketleme | Docker, docker-compose |

### 🚀 Kurulum

İki yoldan birini seçin. **Docker önerilir**, çünkü Node.js, Python, spotDL ve FFmpeg hazır gelir.

#### Yöntem 1: Docker (önerilen)

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/)'ı kurun ve açık olduğundan emin olun. Ya da terminalden:

   | İşletim sistemi | Komut |
   |-----------------|-------|
   | macOS | `brew install --cask docker` |
   | Windows | `winget install Docker.DockerDesktop` |
   | Linux | `sudo apt update && sudo apt install docker.io docker-compose` |

2. Repoyu klonlayıp uygulamayı başlatın:

   ```bash
   git clone https://github.com/mgurlek/ypu-music.git
   cd ypu-music/kaynak-kodlar
   docker-compose up --build
   ```

3. <http://localhost:3000> adresini açın. Şarkılar, `kaynak-kodlar` klasörünün yanındaki `Indirilen-Muzikler` klasörüne kaydedilir.

#### Yöntem 2: Manuel kurulum

[Node.js](https://nodejs.org/) (`npm` ile birlikte gelir), [Python 3](https://www.python.org/downloads/) ve [FFmpeg](https://ffmpeg.org/download.html) gerekir.

> **Windows:** Python kurulumunda **"Add Python to PATH"** kutusunu işaretleyin, sonra yeni bir terminal açın.

| İşletim sistemi | Komut |
|-----------------|-------|
| macOS | `brew install node python ffmpeg` |
| Windows | `winget install OpenJS.NodeJS Python.Python.3.11 Gyan.FFmpeg` |
| Linux | `sudo apt update && sudo apt install nodejs npm python3 python3-pip ffmpeg` |

```bash
git clone https://github.com/mgurlek/ypu-music.git
cd ypu-music/kaynak-kodlar

npm install
pip install spotdl      # macOS'ta hata alırsanız: pip3 install spotdl --break-system-packages
npm run dev
```

<http://localhost:3000> adresini açın ve indirirken terminal penceresini kapatmayın.

### 🏗️ Nasıl çalışır

```
Tarayıcı ──► Next.js API yolları ──► QueueManager (singleton)
                  │                        │
                  │                        └─► her seferinde bir parça için `python -m spotdl <url>` başlatır
                  └─► scripts/get_playlist.py (liste / parça bilgilerini okur)
```

- `src/app/` arayüzü ve API yollarını (`metadata`, `queue`, `playlist`, `library`) içerir.
- `src/lib/queueManager.ts` kuyruğu yönetir, spotDL çıktısını log paneline aktarır.
- `scripts/get_playlist.py` bir linkteki parçaları spotDL ile listeler.

### 🔧 Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|-------|-------|
| **Windows'ta Docker: `500 Internal Server Error` / `dockerDesktopLinuxEngine`** | WSL2 motoru takılmıştır. PowerShell/CMD'de `wsl --shutdown` yazın, Docker Desktop'ı sistem tepsisinden kapatıp yeniden açın. |
| **"FFmpeg kurulu değil"** (manuel kurulum) | FFmpeg'i kurun (yukarıdaki tablo) veya `spotdl --download-ffmpeg` çalıştırın, uygulamayı yeniden başlatın. |
| **"Python veya spotDL bulunamadı"** | Windows'ta `python --version`, macOS/Linux'ta `python3 --version` çalışıyor mu ve `pip install spotdl` bitti mi kontrol edin. |
| **"Çok fazla istek"** | YouTube geçici olarak engelledi. Birkaç dakika bekleyip tekrar deneyin. |

### 🤝 Katkı

Issue ve Pull Request göndermekten çekinmeyin.

### ⚠️ Yasal Uyarı

Bu uygulama eğitim ve kişisel arşivleme amacıyla hazırlanmıştır. Telif haklı eserlerin izinsiz çoğaltılmasını desteklemez. Lütfen sanatçıları resmi müzik servisleriyle destekleyin.

---

## 📄 License

Distributed under the [MIT License](LICENSE). / [MIT Lisansı](LICENSE) ile dağıtılmaktadır.
