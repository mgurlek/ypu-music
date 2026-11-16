// Client-side dictionary. English is the default; Turkish is used when the browser language starts with "tr".
// A value containing "|" is a plural pair: "one|other" (the first form is used when params.n === 1).

export type Lang = 'tr' | 'en';

const en = {
  appName: 'YPU Music',
  navLabel: 'Main navigation',
  navHome: 'Home',
  navLibrary: 'Your Library',

  homeTitle: 'Download Playlist',
  homeSubtitle: 'Paste a Spotify playlist or song link. Its songs are added to the queue and saved as MP3 files on this computer.',
  urlLabel: 'Spotify playlist or song link',
  urlPlaceholder: 'https://open.spotify.com/playlist/...',
  addToQueue: 'Add to queue',
  fetchingButton: 'Fetching songs...',
  fetchingHint: 'Fetching the song list - big playlists can take a minute.',
  cancelFetch: 'Cancel',
  fetchCancelled: 'Cancelled. Nothing was added.',
  addedToQueue: 'Added {n} song from "{name}" to the queue.|Added {n} songs from "{name}" to the queue.',
  errNoTracks: 'No songs were found at that link.',
  errBadResponse: 'The app answered in a way it did not expect. Please try again.',
  errNetwork: 'Could not reach the app. Is the black window (terminal) still open? Start it again with the Start script.',
  errUnknown: 'Something went wrong. Please try again.',

  folderTitle: 'Your MP3 files are saved in this folder',
  folderCopy: 'Copy',
  folderCopied: 'Copied',
  folderCopyLabel: 'Copy the folder path',

  nowDownloading: 'Now downloading',
  songsRemaining: '{n} song remaining in the queue|{n} songs remaining in the queue',
  toPlaylist: 'to {name}',
  statusSuccess: 'Song downloaded successfully.',
  statusError: 'This song could not be downloaded.',
  errorTitle: 'A problem occurred',

  blockedTitle: 'Downloads are paused',
  blockedFallback: 'The downloader is not ready yet.',
  tryAgain: 'Try again',
  unreachable: 'Cannot reach the app. Is the black window (terminal) still open? Start it again with the Start script.',
  actionFailed: 'That did not work. Please try again.',

  stopAll: 'Stop all',
  stopAllAsk: 'Are you sure? This stops the download and empties the queue.',
  stopAllYes: 'Yes, stop all',
  stopAllNo: 'No, keep going',

  summaryTitle: 'Finished',
  summaryCounts: '{done} downloaded, {failed} failed',
  summaryFailedHeading: 'These songs could not be downloaded',
  summaryAllGood: 'Everything was downloaded.',

  logsShow: 'Show technical details',
  logsHide: 'Hide technical details',
  logsLabel: 'Technical details',

  libraryTitle: 'Your Library',
  librarySavedIn: 'Saved in',
  libraryEmpty: 'Nothing here yet. Playlists you download will appear here.',
  libraryEmptyWhere: 'Downloaded songs are saved in this folder:',
  libraryKind: 'Playlist',
  backToLibrary: 'Back to Your Library',
  songCount: '{n} song|{n} songs',
  tableNumber: '#',
  tableTitle: 'Title',
  playlistLoading: 'Loading...',
  playlistError: 'Could not open this playlist.',
  playlistEmpty: 'There are no songs in this folder yet.',

  queueTitle: 'Queue',
  queueNow: 'Now downloading',
  queueNone: 'No active downloads.',
  queueNext: 'Next in queue ({n})',
  queueEmpty: 'Queue is empty.',
  cancelDownload: 'Cancel this download',
  removePlaylist: 'Remove "{name}" from the queue',
  removeTrack: 'Remove {name} from the queue',
  moveUp: 'Move {name} up',
  moveDown: 'Move {name} down',
  togglePlaylist: 'Show or hide the song of "{name}" ({n} song)|Show or hide the songs of "{name}" ({n} songs)',
} as const;

export type Key = keyof typeof en;

const tr: Record<Key, string> = {
  appName: 'YPU Music',
  navLabel: 'Ana gezinme',
  navHome: 'Ana Sayfa',
  navLibrary: 'Kitaplığın',

  homeTitle: 'Çalma Listesi İndir',
  homeSubtitle: 'Bir Spotify çalma listesi veya şarkı bağlantısı yapıştır. Şarkılar sıraya eklenir ve bu bilgisayara MP3 olarak kaydedilir.',
  urlLabel: 'Spotify çalma listesi veya şarkı bağlantısı',
  urlPlaceholder: 'https://open.spotify.com/playlist/...',
  addToQueue: 'Sıraya ekle',
  fetchingButton: 'Şarkılar getiriliyor...',
  fetchingHint: 'Şarkı listesi getiriliyor - büyük listeler bir dakika sürebilir.',
  cancelFetch: 'Vazgeç',
  fetchCancelled: 'Vazgeçildi. Hiçbir şey eklenmedi.',
  addedToQueue: '"{name}" listesinden {n} şarkı sıraya eklendi.|"{name}" listesinden {n} şarkı sıraya eklendi.',
  errNoTracks: 'Bu bağlantıda hiç şarkı bulunamadı.',
  errBadResponse: 'Uygulama beklenmeyen bir yanıt verdi. Lütfen tekrar dene.',
  errNetwork: 'Uygulamaya ulaşılamadı. Siyah pencere (terminal) hâlâ açık mı? Başlatma dosyasıyla yeniden başlat.',
  errUnknown: 'Bir şeyler ters gitti. Lütfen tekrar dene.',

  folderTitle: 'MP3 dosyaların bu klasöre kaydedilir',
  folderCopy: 'Kopyala',
  folderCopied: 'Kopyalandı',
  folderCopyLabel: 'Klasör yolunu kopyala',

  nowDownloading: 'Şu an indiriliyor',
  songsRemaining: 'Sırada {n} şarkı daha var|Sırada {n} şarkı daha var',
  toPlaylist: '{name} listesine',
  statusSuccess: 'Şarkı başarıyla indirildi.',
  statusError: 'Bu şarkı indirilemedi.',
  errorTitle: 'Bir sorun oluştu',

  blockedTitle: 'İndirmeler duraklatıldı',
  blockedFallback: 'İndirici henüz hazır değil.',
  tryAgain: 'Tekrar dene',
  unreachable: 'Uygulamaya ulaşılamıyor. Siyah pencere (terminal) hâlâ açık mı? Başlatma dosyasıyla yeniden başlat.',
  actionFailed: 'Bu işlem olmadı. Lütfen tekrar dene.',

  stopAll: 'Hepsini durdur',
  stopAllAsk: 'Emin misin? İndirme durur ve sıra boşaltılır.',
  stopAllYes: 'Evet, hepsini durdur',
  stopAllNo: 'Hayır, devam etsin',

  summaryTitle: 'Tamamlandı',
  summaryCounts: '{done} indirildi, {failed} başarısız',
  summaryFailedHeading: 'Bu şarkılar indirilemedi',
  summaryAllGood: 'Her şey indirildi.',

  logsShow: 'Teknik ayrıntıları göster',
  logsHide: 'Teknik ayrıntıları gizle',
  logsLabel: 'Teknik ayrıntılar',

  libraryTitle: 'Kitaplığın',
  librarySavedIn: 'Kayıt yeri',
  libraryEmpty: 'Henüz burada bir şey yok. İndirdiğin çalma listeleri burada görünür.',
  libraryEmptyWhere: 'İndirilen şarkılar bu klasöre kaydedilir:',
  libraryKind: 'Çalma listesi',
  backToLibrary: 'Kitaplığına dön',
  songCount: '{n} şarkı|{n} şarkı',
  tableNumber: '#',
  tableTitle: 'Başlık',
  playlistLoading: 'Yükleniyor...',
  playlistError: 'Bu çalma listesi açılamadı.',
  playlistEmpty: 'Bu klasörde henüz şarkı yok.',

  queueTitle: 'Sıra',
  queueNow: 'Şu an indiriliyor',
  queueNone: 'Etkin indirme yok.',
  queueNext: 'Sıradakiler ({n})',
  queueEmpty: 'Sıra boş.',
  cancelDownload: 'Bu indirmeyi iptal et',
  removePlaylist: '"{name}" listesini sıradan kaldır',
  removeTrack: '{name} şarkısını sıradan kaldır',
  moveUp: '{name} şarkısını yukarı taşı',
  moveDown: '{name} şarkısını aşağı taşı',
  togglePlaylist: '"{name}" listesinin şarkılarını göster veya gizle ({n} şarkı)|"{name}" listesinin şarkılarını göster veya gizle ({n} şarkı)',
};

const dictionaries: Record<Lang, Record<Key, string>> = { en, tr };

export type Params = Record<string, string | number>;

export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const l = typeof navigator.language === 'string' ? navigator.language.toLowerCase() : '';
  return l.startsWith('tr') ? 'tr' : 'en';
}

export function t(lang: Lang, key: Key, params?: Params): string {
  let s: string = dictionaries[lang][key] ?? en[key];
  if (s.includes('|')) {
    const [one, other] = s.split('|');
    s = params && params.n === 1 ? one : other;
  }
  if (params) {
    s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
  }
  return s;
}
