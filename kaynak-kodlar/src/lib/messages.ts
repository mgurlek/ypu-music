export type Lang = 'tr' | 'en';

export type MessageCode =
  | 'PYTHON_MISSING'
  | 'PYTHON_TOO_OLD'
  | 'SPOTDL_MISSING'
  | 'FFMPEG_MISSING'
  | 'NOT_FOUND_ON_YOUTUBE'
  | 'RATE_LIMITED'
  | 'PLAYLIST_NOT_PUBLIC'
  | 'INVALID_URL'
  | 'UNSUPPORTED_URL'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'DOWNLOAD_DIR_ERROR'
  | 'NETWORK'
  | 'DISK_FULL'
  | 'FORBIDDEN_ORIGIN'
  | 'BAD_REQUEST'
  | 'UNEXPECTED';

const MESSAGES: Record<MessageCode, Record<Lang, string>> = {
  PYTHON_MISSING: {
    tr: 'Bilgisayarınızda Python bulunamadı. python.org adresinden Python 3.11 veya daha yenisini kurun (kurulumda "Add python.exe to PATH" kutusunu işaretleyin), sonra uygulamayı yeniden başlatın.',
    en: 'Python was not found on this computer. Install Python 3.11 or newer from python.org (tick "Add python.exe to PATH" during setup), then start the app again.',
  },
  PYTHON_TOO_OLD: {
    tr: 'Bilgisayarınızdaki Python çok eski. python.org adresinden Python 3.11 veya daha yenisini kurun, sonra uygulamayı yeniden başlatın.',
    en: 'The Python on this computer is too old. Install Python 3.11 or newer from python.org, then start the app again.',
  },
  SPOTDL_MISSING: {
    tr: 'İndirme aracı (spotDL) kurulu değil. Uygulamanın kurulum betiğini yeniden çalıştırın (ya da "pip install spotdl" yazın), sonra tekrar deneyin.',
    en: 'The download tool (spotDL) is not installed. Run the app installer script again (or "pip install spotdl"), then try again.',
  },
  FFMPEG_MISSING: {
    tr: 'Ses dönüştürme aracı (FFmpeg) bulunamadı. Uygulamayı yeniden başlatıp internete bağlıyken tekrar deneyin; olmazsa FFmpeg kurun.',
    en: 'The audio converter (FFmpeg) was not found. Restart the app while connected to the internet and try again; if it still fails, install FFmpeg.',
  },
  NOT_FOUND_ON_YOUTUBE: {
    tr: 'Bu şarkı YouTube üzerinde bulunamadı veya erişime kapalı. Diğer şarkılar etkilenmez.',
    en: 'This song could not be found on YouTube or is not available. Other songs are not affected.',
  },
  RATE_LIMITED: {
    tr: 'YouTube çok fazla istek geldiği için geçici olarak engelledi. İndirme durduruldu, sıra korundu. Birkaç dakika bekleyin, sonra "Tekrar dene"ye basın.',
    en: 'YouTube temporarily blocked requests because there were too many. The download is paused and your queue is kept. Wait a few minutes, then press "Try again".',
  },
  PLAYLIST_NOT_PUBLIC: {
    tr: 'Bu çalma listesine erişilemedi. Listenin herkese açık olduğundan emin olun ve bağlantıyı tekrar yapıştırın.',
    en: 'This playlist could not be opened. Make sure it is public, then paste the link again.',
  },
  INVALID_URL: {
    tr: "Bu bağlantı geçerli görünmüyor. Spotify'dan bir şarkı veya çalma listesi bağlantısını kopyalayıp tekrar yapıştırın.",
    en: 'This link does not look valid. Copy a song or playlist link from Spotify and paste it again.',
  },
  UNSUPPORTED_URL: {
    tr: 'Yalnızca Spotify şarkı ve çalma listesi bağlantıları desteklenir. Albüm veya sanatçı bağlantıları çalışmaz.',
    en: 'Only Spotify song and playlist links are supported. Album and artist links do not work.',
  },
  TIMEOUT: {
    tr: 'Bu işlem çok uzun süre yanıt vermedi ve durduruldu. İnternet bağlantınızı kontrol edip bu şarkıyı veya işlemi tekrar deneyin.',
    en: 'This step stopped responding for too long and was cancelled. Check your internet connection, then try this song or action again.',
  },
  CANCELLED: {
    tr: 'İndirme sizin tarafınızdan iptal edildi.',
    en: 'The download was cancelled by you.',
  },
  DOWNLOAD_DIR_ERROR: {
    tr: 'Müzik klasörü oluşturulamadı veya yazılamıyor. Başka bir klasör seçin ya da klasörün yazma iznini kontrol edin.',
    en: 'The music folder could not be created or written to. Choose another folder or check its write permission.',
  },
  NETWORK: {
    tr: 'İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edip tekrar deneyin. İndirme sırasındaysa sıra korunur: bağlantı gelince "Tekrar dene"ye basın.',
    en: 'Could not connect to the internet. Check your connection and try again. If a download was running, your queue is kept: press "Try again" once you are back online.',
  },
  DISK_FULL: {
    tr: 'Diskte yer kalmadı. Biraz yer açıp tekrar deneyin.',
    en: 'The disk is full. Free up some space and try again.',
  },
  FORBIDDEN_ORIGIN: {
    tr: 'Bu istek güvenlik nedeniyle reddedildi. Uygulamayı yalnızca kendi tarayıcı sekmenizden kullanın.',
    en: 'This request was refused for security reasons. Use the app only from its own browser tab.',
  },
  BAD_REQUEST: {
    tr: 'İstek anlaşılamadı. Sayfayı yenileyip tekrar deneyin.',
    en: 'The request could not be understood. Refresh the page and try again.',
  },
  UNEXPECTED: {
    tr: 'Beklenmeyen bir hata oluştu. Uygulamayı yeniden başlatıp tekrar deneyin.',
    en: 'An unexpected error occurred. Restart the app and try again.',
  },
};

export function pickLang(req: Request): Lang {
  const header = req.headers.get('accept-language') ?? '';
  const first = header.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('tr') ? 'tr' : 'en';
}

export function message(code: MessageCode, lang: Lang): string {
  return MESSAGES[code][lang];
}

export function isMessageCode(x: unknown): x is MessageCode {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(MESSAGES, x);
}
