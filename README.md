# YPU Music

*Çetrefilli adamların kulübü.*

[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![CI](https://github.com/mgurlek/ypu-music/actions/workflows/ci.yml/badge.svg)](https://github.com/mgurlek/ypu-music/actions/workflows/ci.yml)

**[English](#english) | [Türkçe](#türkçe)**

---

## English

Download **public Spotify playlists and songs** as MP3 files on your own computer. No account, no programming. You double-click one file and a web page opens.

### Start in 4 steps

1. On <https://github.com/mgurlek/ypu-music> click the green **Code** button, then **Download ZIP**. Extract it to a **short folder** such as `C:\ypu-music` (Windows) or your home folder (Mac/Linux). Not inside OneDrive, Dropbox or iCloud.
2. Install these two programs once (the app tells you if they are missing):
   - **Node.js**, the LTS version: <https://nodejs.org/>
   - **Python** 3.11 to 3.15: <https://www.python.org/downloads/> (Windows: tick **Add python.exe to PATH**)
3. Open the folder and start the app:

   | System | What to do |
   |---|---|
   | Windows 10/11 | Double-click `Start-Windows.bat` |
   | macOS | Double-click `Start-Mac.command`. If it is blocked: System Settings > Privacy & Security > **Open Anyway** |
   | Linux | In a terminal: `bash Start-Linux.sh` |

4. Wait. The first start takes about 2 minutes (it downloads helper tools). When it says **THE APP IS READY**, your browser opens. Paste a Spotify link and press **Add to queue**.

Your MP3 files are in the folder `Indirilen-Muzikler`, next to `kaynak-kodlar`. The page also shows the path.

**Do not close the black window while you use the app. Closing it stops the app.** Next time, double-click the same file again (about 15 seconds).

### Good to know

- Only **public** playlists and **single songs** work (no albums, artists or private lists).
- Songs download one by one, so a playlist takes a few minutes. Songs that cannot be found are listed at the end.
- Needs internet. Windows 7/8/8.1 and 32-bit Windows are not supported.
- If a banner says **Downloads are paused**, fix the problem (internet, disk space, wait a few minutes) and press **Try again**.

### Problems?

- "Python not found" or the Microsoft Store opens: install real Python from python.org, close the black window, start again.
- "Node.js missing or too old": install the LTS version, close the black window, start again.
- ffmpeg could not be set up (for example Windows ARM): Windows `winget install Gyan.FFmpeg`, macOS `brew install ffmpeg`, Ubuntu/Debian `sudo apt install ffmpeg`.
- Setup stops with path errors: move the folder to a shorter place such as `C:\ypu-music`.
- Downloads suddenly fail after weeks: start the app again. It updates its download tool on every start.

More answers, Docker, developer notes and CI: **[DETAILS.md](DETAILS.md)**. Want to help? See **[CONTRIBUTING.md](CONTRIBUTING.md)**: bug reports and pull requests are welcome.

### Legal

For education and personal archiving. Respect copyright law and the terms of the services you use, and support artists. License: [MIT](LICENSE). Built on [spotDL](https://github.com/spotDL/spotify-downloader), [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org/) and [Next.js](https://nextjs.org/).

---

## Türkçe

**Herkese açık Spotify çalma listelerini ve şarkıları** kendi bilgisayarınızda MP3 olarak indirin. Hesap yok, programlama yok. Tek dosyaya çift tıklarsınız, bir web sayfası açılır.

### 4 adımda başla

1. <https://github.com/mgurlek/ypu-music> sayfasında yeşil **Code** düğmesine, sonra **Download ZIP**'e tıklayın. ZIP'i `C:\ypu-music` gibi **kısa bir klasöre** çıkarın (Mac/Linux'ta ev klasörünüz). OneDrive, Dropbox veya iCloud içinde olmasın.
2. Bu iki programı bir kez kurun (eksikse uygulama söyler):
   - **Node.js**, LTS sürümü: <https://nodejs.org/>
   - **Python** 3.11 ile 3.15 arası: <https://www.python.org/downloads/> (Windows'ta **Add python.exe to PATH** kutusunu işaretleyin)
3. Klasörü açın ve uygulamayı başlatın:

   | Sistem | Ne yapılır |
   |---|---|
   | Windows 10/11 | `Start-Windows.bat` dosyasına çift tıklayın |
   | macOS | `Start-Mac.command` dosyasına çift tıklayın. Engellenirse: Sistem Ayarları > Gizlilik ve Güvenlik > **Yine de Aç** |
   | Linux | Terminal'de: `bash Start-Linux.sh` |

4. Bekleyin. İlk başlatma yaklaşık 2 dakika sürer (yardımcı araçları indirir). **UYGULAMA HAZIR** yazınca tarayıcınız açılır. Bir Spotify bağlantısı yapıştırıp **Sıraya ekle**'ye basın.

MP3 dosyalarınız `kaynak-kodlar` klasörünün yanındaki `Indirilen-Muzikler` klasöründedir. Sayfa yolu da gösterir.

**Uygulamayı kullanırken siyah pencereyi kapatmayın. Kapatmak uygulamayı durdurur.** Bir dahaki sefer aynı dosyaya yine çift tıklayın (yaklaşık 15 saniye).

### Bilmekte fayda var

- Yalnızca **herkese açık** listeler ve **tek şarkılar** çalışır (albüm, sanatçı, özel liste çalışmaz).
- Şarkılar tek tek iner, bir liste birkaç dakika sürer. Bulunamayan şarkılar sonda listelenir.
- İnternet gerekir. Windows 7/8/8.1 ve 32 bit Windows desteklenmez.
- **İndirmeler duraklatıldı** başlığı çıkarsa sorunu giderin (internet, disk alanı, birkaç dakika bekleyin) ve **Tekrar dene**'ye basın.

### Sorun mu var?

- "Python bulunamadı" veya Microsoft Store açılıyor: python.org'dan gerçek Python'u kurun, siyah pencereyi kapatın, yeniden başlatın.
- "Node.js eksik veya çok eski": LTS sürümünü kurun, siyah pencereyi kapatın, yeniden başlatın.
- ffmpeg kurulamadı (örneğin Windows ARM): Windows `winget install Gyan.FFmpeg`, macOS `brew install ffmpeg`, Ubuntu/Debian `sudo apt install ffmpeg`.
- Kurulum yol hatalarıyla duruyor: klasörü `C:\ypu-music` gibi daha kısa bir yere taşıyın.
- Haftalar sonra indirmeler birden bozuldu: uygulamayı yeniden başlatın. İndirme aracını her başlatmada günceller.

Daha fazla cevap, Docker, geliştirici notları ve CI: **[DETAILS.md](DETAILS.md)**. Katkı vermek ister misiniz? **[CONTRIBUTING.md](CONTRIBUTING.md)**: hata bildirimi ve PR hoş geldi.

### Yasal

Eğitim ve kişisel arşiv içindir. Telif hakkı yasalarına ve kullandığınız hizmetlerin şartlarına uyun, sanatçıları destekleyin. Lisans: [MIT](LICENSE). [spotDL](https://github.com/spotDL/spotify-downloader), [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org/) ve [Next.js](https://nextjs.org/) üzerine kuruludur.
