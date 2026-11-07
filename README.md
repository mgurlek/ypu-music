<div align="center">
  <h1>🎵 YPU Music</h1>
  <p><em>Çetrefilli adamların kulübü.</em></p>
  <p>Download Spotify playlists &amp; tracks as tagged MP3s, built for offline players and sports watches.</p>

  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
  [![SpotDL](https://img.shields.io/badge/SpotDL-v4-blue?style=for-the-badge&logo=python&logoColor=white)](https://github.com/spotDL/spotify-downloader)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
</div>

---

> 🇹🇷 **Türkçe dokümantasyon için [aşağı kaydırın](#türkçe-dokümantasyon).**

## 🇺🇸 English Documentation

**YPU Music** is a fully open-source, desktop web application that allows you to download Spotify playlists and tracks as MP3 files with metadata intact.

Designed to download musics to my COROS Pace 4 watch, you can use it for whatever you want.


### ✨ Features

- Paste a Spotify playlist or track link and download it as MP3 with metadata (title, artist, album, cover art) intact
- Background download queue that processes tracks asynchronously
- One-command setup with Docker, or run it manually with Node.js + Python
- Simple web UI that runs locally on your machine

### 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend / API | Next.js 16 (App Router), React 19, TypeScript |
| Download engine | [spotDL](https://github.com/spotDL/spotify-downloader) (Python) |
| Playlist parsing | `spotify-url-info` + `scripts/get_playlist.py` |
| Packaging | Docker / docker-compose |

### 🚀 Quick Start / How to Run

There are two ways to run the application: using Docker (recommended) or manually.

#### Method 1: Using Docker (Recommended)
Docker solves the problem of installing dependencies manually. You don't need Node.js or Python installed!

1. Make sure Docker is installed and running. If you don't have it, you can download [Docker Desktop](https://www.docker.com/products/docker-desktop/) or install it via terminal:
   - **Mac:** `brew install --cask docker`
   - **Windows:** `winget install Docker.DockerDesktop`
   - **Linux:** `sudo apt update && sudo apt install docker.io docker-compose`
2. Open your terminal in the project directory.
3. Run the following commands:
```bash
cd kaynak-kodlar
docker-compose up --build
```
4. Open `http://localhost:3000` in your browser. Downloaded songs will be saved to the `Indirilen-Muzikler` folder.

#### Method 2: Manual Installation
If you prefer not to use Docker, you need to install Node.js (which includes `npm`) and Python manually first. You can download [Node.js](https://nodejs.org/) and [Python](https://www.python.org/downloads/) from their websites, or install them via terminal:
- **Mac:** `brew install node python`
- **Windows:** `winget install OpenJS.NodeJS` and `winget install Python.Python.3.11`
- **Linux:** `sudo apt update && sudo apt install nodejs npm python3 python3-pip`

```bash
# 1. Enter the source code directory
cd kaynak-kodlar

# 2. Install Node dependencies
npm install

# 3. Install spotdl (Python is required)
# For Mac users: you might need to use `pip3 install spotdl --break-system-packages`
pip install spotdl

# 4. Start the application
npm run dev
```

Open `http://localhost:3000` in your browser. Keep the terminal window open while using the app.

The core architecture relies on Next.js API routes communicating with a custom singleton `QueueManager` (`src/lib/queueManager.ts`) that spawns asynchronous Python `child_process` instances.

### 🔧 Troubleshooting

**Docker Error on Windows (500 Internal Server Error / dockerDesktopLinuxEngine):**
If you encounter this error on Windows while using Docker, it means the Windows Subsystem for Linux (WSL2) backend has frozen.
* **Fix:** Open your terminal (PowerShell/CMD), type `wsl --shutdown` and press Enter. Then, completely close Docker Desktop from the system tray and open it again.

### ⚠️ Disclaimer
This tool is built strictly for educational purposes and personal archiving. It does not promote or encourage the piracy of copyrighted material. Please support artists by using official music streaming platforms.

---

## 🇹🇷 Türkçe Dokümantasyon

**YPU Music** Spotify çalma listelerini ve parçaları metadata korunmuş bir şekilde MP3 dosyaları olarak indirmenizi sağlayan, tamamen açık kaynaklı bir masaüstü web uygulamasıdır.
COROS Pace 4 saatime müzik indirmek amacıyla tasarlanmış olsa da, siz dilediğiniz amaçla kullanabilirsiniz.


### ✨ Özellikler

- Spotify çalma listesi veya parça linkini yapıştırın, metadata (başlık, sanatçı, albüm, kapak) korunmuş MP3 olarak indirin
- Parçaları arka planda sırayla işleyen indirme kuyruğu
- Docker ile tek komutla kurulum veya Node.js + Python ile manuel çalıştırma
- Bilgisayarınızda yerel çalışan sade web arayüzü

### 🧰 Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Arayüz / API | Next.js 16 (App Router), React 19, TypeScript |
| İndirme motoru | [spotDL](https://github.com/spotDL/spotify-downloader) (Python) |
| Liste ayrıştırma | `spotify-url-info` + `scripts/get_playlist.py` |
| Paketleme | Docker / docker-compose |

### 🚀 Nasıl Çalıştırılır

Uygulamayı çalıştırmanın iki yolu vardır: Docker kullanarak (önerilen) veya manuel olarak.

#### Yöntem 1: Docker Kullanarak (Önerilen)
Docker kullanırsanız Node.js veya Python yükleme derdinden kurtulursunuz! Sistem her şeyi izole bir şekilde otomatik kurar.

1. Bilgisayarınızda Docker'ın yüklü ve açık olduğundan emin olun. Yoksa [Docker Desktop](https://www.docker.com/products/docker-desktop/)'ı indirebilir veya terminalden kurabilirsiniz:
   - **Mac:** `brew install --cask docker`
   - **Windows:** `winget install Docker.DockerDesktop`
   - **Linux:** `sudo apt update && sudo apt install docker.io docker-compose`
2. Proje klasöründe bir terminal açın.
3. Aşağıdaki komutları çalıştırın:
```bash
cd kaynak-kodlar
docker-compose up --build
```
4. Tarayıcınızda `http://localhost:3000` adresine gidin. İndirilen şarkılar otomatik olarak ana dizindeki `Indirilen-Muzikler` klasörüne kaydedilecektir.

#### Yöntem 2: Manuel Kurulum
Eğer Docker kullanmak istemiyorsanız, bilgisayarınıza öncelikle Node.js (`npm` ile birlikte gelir) ve Python yüklemeniz gerekmektedir. İsterseniz resmi sitelerinden ([Node.js](https://nodejs.org/), [Python](https://www.python.org/downloads/)) indirebilir, isterseniz de terminalden kurabilirsiniz:
- **Mac:** `brew install node python`
- **Windows:** `winget install OpenJS.NodeJS` ve `winget install Python.Python.3.11`
- **Linux:** `sudo apt update && sudo apt install nodejs npm python3 python3-pip`

```bash
# 1. Kodların olduğu klasöre girin
cd kaynak-kodlar

# 2. Javascript kütüphanelerini yükleyin
npm install

# 3. İndirme motoru olan spotdl'yi kurun
# Mac kullanıcıları için not: Hata alırsanız "pip3 install spotdl --break-system-packages" komutunu deneyin
pip install spotdl

# 4. Sunucuyu başlatın
npm run dev
```

Ardından tarayıcınızda `http://localhost:3000` adresine gidin. Uygulamayı kullanırken terminal penceresini kapatmamalısınız.

Mimari yapı; Next.js API yolları ile asenkron Python işlemlerini (`spawn`) yöneten özel bir kuyruk yöneticisi sınıfına (`src/lib/queueManager.ts`) dayanmaktadır. Pull Request (PR) gönderimlerine her zaman açığız!

### 🔧 Sık Karşılaşılan Sorunlar (Troubleshooting)

**Windows'ta Docker 500 Internal Server Error Hatası:**
Eğer Windows'ta Docker kullanırken `pipe/dockerDesktopLinuxEngine` veya `500 Internal Server Error` hatası alırsanız, bu arka plandaki WSL2 motorunun takılı kaldığını gösterir.
* **Çözüm:** Terminalinizi (CMD veya PowerShell) açın, `wsl --shutdown` yazıp Enter'a basın. Ardından Docker Desktop uygulamasını sağ alt köşeden tamamen kapatıp (Quit) yeniden başlatın. Sorun düzelecektir.

### ⚠️ Yasal Uyarı
Bu uygulama sadece açık kaynak geliştirme pratikleri, eğitim ve kişisel araştırmalar için tasarlanmıştır. Telif haklarıyla korunan eserlerin yasa dışı biçimde çoğaltılmasını desteklemez. Lütfen sanatçıları desteklemek adına resmi müzik servislerini kullanmaya özen gösterin.

---

## 📄 License / Lisans

Distributed under the [MIT License](LICENSE). / [MIT Lisansı](LICENSE) ile dağıtılmaktadır.
