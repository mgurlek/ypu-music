<div align="center">
  <
  <h1>YPU Music </h1>
  <p><em>Çetrefilli adamların kulübü.</em></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![SpotDL](https://img.shields.io/badge/SpotDL-v4-blue?style=for-the-badge&logo=python)](https://github.com/spotDL/spotify-downloader)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
</div>

---

> 🇹🇷 **Türkçe dokümantasyon için [aşağı kaydırın](#türkçe-dokümantasyon).**

## 🇺🇸 English Documentation

**YPU Music** is a fully open-source, desktop web application that allows you to download Spotify playlists and tracks as MP3 files with metadata intact.

Designed to download musics to my COROS Pace 4 watch, you can use it for what ever you want


### Quick Start / How to Run

To run the application locally, you will need a terminal. Make sure you have Node.js and Python installed on your system.

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

### ⚠️ Disclaimer
This tool is built strictly for educational purposes and personal archiving. It does not promote or encourage the piracy of copyrighted material. Please support artists by using official music streaming platforms.

---

## 🇹🇷 Türkçe Dokümantasyon

**YPU Music** Spotify çalma listelerini ve parçaları metadata korunmuş bir şekilde MP3 dosyaları olarak indirmenizi sağlayan, tamamen açık kaynaklı bir masaüstü web uygulamasıdır.
COROS Pace 4 saatime müzik indirmek amacıyla tasarlanmış olsa da, siz dilediğiniz amaçla kullanabilirsiniz.


### Nasıl Çalıştırılır

Uygulamayı yerel bilgisayarınızda çalıştırmak için terminal (veya Komut İstemi) kullanmanız gerekir. Bilgisayarınızda Node.js ve Python'un yüklü olduğundan emin olun.

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

### ⚠️ Yasal Uyarı
Bu uygulama sadece açık kaynak geliştirme pratikleri, eğitim ve kişisel araştırmalar için tasarlanmıştır. Telif haklarıyla korunan eserlerin yasa dışı biçimde çoğaltılmasını desteklemez. Lütfen sanatçıları desteklemek adına resmi müzik servislerini kullanmaya özen gösterin.
