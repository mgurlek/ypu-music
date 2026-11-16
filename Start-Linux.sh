#!/usr/bin/env bash
# =====================================================================
#  YPU Music - Linux launcher  /  Linux icin baslatici
#
#  Run it with:   bash Start-Linux.sh        (or double-click it in your file
#  manager - that works on some desktops only; "bash Start-Linux.sh" always works)
#  Calistirmak icin:  bash Start-Linux.sh
#
#  It checks what is needed, sets up everything it can on its own, starts the
#  app and opens your web browser.
#  Gerekenleri kontrol eder, kurabildigini kendisi kurar, uygulamayi baslatir
#  ve tarayiciyi acar.
#
#  Options / Secenekler:
#    bash Start-Linux.sh --check    Only look, change nothing: prints a status
#                                   table. Exit code 0 = everything in place,
#                                   1 = something is missing.
#    (testing) YPU_NO_PAUSE=1    never wait for a key press.
#    (testing) YPU_NO_BROWSER=1  do not open the web browser.
#    (testing) YPU_PORT_START=3151  look for a free port from here, not 3000.
#
#  Running it a second time / Ikinci kez calistirirsaniz:
#    - If THIS copy of the app is already running, the second start does
#      nothing but open the browser at the running app and exit (code 0).
#      It looks at ports 3000-3010 (YPU_PORT_START honoured) and only counts
#      an app whose download folder is this copy's "Indirilen-Muzikler".
#      An app from another folder, or another program, is ignored.
#    - If another window of THIS copy is still setting up (the first start can
#      take minutes before the app answers), the second window prints a message
#      and exits with a non-zero code (2) without touching anything.
#      That is a single-instance lock: a directory "ypu-music-<uid>-<n>.lock"
#      in $TMPDIR (or /tmp) that holds the process id of the running window.
#      It is removed when the window ends (also on Ctrl+C or closing the
#      terminal); a lock left behind by a crash is detected and cleaned up.
#    - --check never looks at the lock and never opens the browser.
#    - Every real start still runs "npm run build" (this is how an update of
#      the app files takes effect; to force a rebuild just start it again).
#
#  Settings you can change below:
#    INSTALL_DENO=1  download the "deno" helper (a JavaScript runtime that
#                    yt-dlp needs for some YouTube videos). 0 = skip it.
#
#  This script never uses sudo and never changes system settings. It only uses
#  pip, npm and spotdl's own downloaders (all inside this folder or ~/.spotdl).
#  This file must keep LF line endings (see .gitattributes).
# =====================================================================

# --- Started as "sh Start-Linux.sh" (often dash)? This script needs bash. --
# (Must stay the first command: dash cannot read the rest of this file.)
if [ -z "${BASH_VERSION:-}" ]; then
  if command -v bash >/dev/null 2>&1; then exec bash "$0" "$@"; fi
  echo "  !! bash bulunamadi. Bu dosya bash ister: once bash kurun. / bash was not found. This file needs bash: install it first." >&2
  exit 1
fi

INSTALL_DENO=1
MIN_NODE_MAJOR=20
MIN_NODE_MINOR=9

CHECK=0
[ "${1:-}" = "--check" ] && CHECK=1

HERE="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"

# --- Double-click from a file manager: no terminal -> try to open one ----
# (best effort; "bash Start-Linux.sh" always works)
if [ ! -t 1 ] && [ "$CHECK" = "0" ] && [ -z "${YPU_IN_TERM:-}" ] && [ -z "${YPU_NO_PAUSE:-}" ] && [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
  export YPU_IN_TERM=1
  SELF="$HERE/$(basename "$0")"
  for term in x-terminal-emulator gnome-terminal konsole xfce4-terminal mate-terminal xterm; do
    if command -v "$term" >/dev/null 2>&1; then
      case "$term" in
        gnome-terminal|mate-terminal) exec "$term" -- bash "$SELF" ;;
        *) exec "$term" -e bash "$SELF" ;;
      esac
    fi
  done
fi

# --- Colours only when the output is a real terminal ---------------------
if [ -t 1 ]; then
  C_OK=$'\033[32m'; C_WARN=$'\033[33m'; C_BAD=$'\033[31m'; C_BOLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_OK=""; C_WARN=""; C_BAD=""; C_BOLD=""; C_OFF=""
fi

BAD=0
T_NODE="MISSING - you must install it"
T_PY="MISSING - you must install it"
T_VENV="MISSING - will be created on a real start"
T_SPOTDL="MISSING - will be installed on a real start"
T_FFMPEG="MISSING - will be downloaded on a real start"
T_DENO="not needed"
T_NPM="MISSING - will be installed on a real start"
T_PORT="none free (3000-3010)"

say()  { printf '%s\n' "$*"; }
ok()   { printf '        %sOK%s - %s\n' "$C_OK" "$C_OFF" "$*"; }
warn() { printf '        %s[!]%s %s\n' "$C_WARN" "$C_OFF" "$*"; }
bad()  { printf '        %s!!%s %s\n' "$C_BAD" "$C_OFF" "$*"; }
step() { printf '\n  %s[%s/6]%s %s\n' "$C_BOLD" "$1" "$C_OFF" "$2"; }

waitkey() {
  [ -n "${YPU_NO_PAUSE:-}" ] && return 0
  [ "$CHECK" = "1" ] && return 0
  [ -t 0 ] || return 0
  say ""
  printf '  Kapatmak icin bir tusa basin. / Press any key to close this window. '
  read -r -n 1 -s _ || true
  say ""
}

# Opens a web page in the default browser (best effort).
open_url() {
  [ -n "${YPU_NO_BROWSER:-}" ] && { say "        [test] browser not opened: $1"; return 0; }
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$1" >/dev/null 2>&1 &
  elif command -v gio >/dev/null 2>&1; then gio open "$1" >/dev/null 2>&1 &
  elif command -v sensible-browser >/dev/null 2>&1; then sensible-browser "$1" >/dev/null 2>&1 &
  else say "        Tarayici acilamadi, bu adresi kendiniz acin / Could not open a browser, open this address yourself: $1"
  fi
}

# Stops with a message the user can act on.
die() { RC="${1:-1}"; waitkey; exit "$RC"; }

SECONDS=0; LAST=0
tick() { EL=$((SECONDS - LAST)); LAST=$SECONDS; }

# --- Clean-up on every way out: stop the browser helper, release the lock ----
OPENER=""; LOCKDIR=""; LOCK_HELD=0
cleanup() {
  [ -n "$OPENER" ] && kill "$OPENER" 2>/dev/null
  if [ "$LOCK_HELD" = "1" ] && [ -n "$LOCKDIR" ] && [ "$(cat "$LOCKDIR/pid" 2>/dev/null)" = "$$" ]; then
    rm -rf "$LOCKDIR" 2>/dev/null
  fi
  return 0
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

# --- Second double-click protection (used on real starts only) ----------------
# Prints the port when THIS copy of the app already answers on 3000-3010.
# (The request goes to 127.0.0.1:<port>; only an app whose download folder is
#  this copy's "Indirilen-Muzikler" counts. Case-insensitive on macOS only.)
IFS= read -r -d '' PROBEJS <<'EOF' || true
var http=require('http'),path=require('path'),fs=require('fs');
function norm(p){try{p=fs.realpathSync.native(p);}catch(e){p=path.resolve(String(p));}
  p=p.replace(/[\\/]+$/,'');return process.platform==='win32'||process.platform==='darwin'?p.toLowerCase():p;}
var want=norm(process.env.YPU_PROBE_DIR);var first=Number(process.env.YPU_PORT_START)||3000;
function probe(p,cb){var done=false,rq=null,t=null;
  function fin(r){if(!done){done=true;clearTimeout(t);cb(r);}}
  t=setTimeout(function(){try{rq.destroy();}catch(e){}fin(false);},2500);
  rq=http.get({host:'127.0.0.1',port:p,path:'/api/queue',agent:false},function(res){
    if(res.statusCode!==200){res.resume();fin(false);return;}
    var b='';res.setEncoding('utf8');
    res.on('data',function(d){b+=d;if(b.length>5000000){rq.destroy();fin(false);}});
    res.on('end',function(){try{var j=JSON.parse(b);fin(!!j&&typeof j.downloadDir==='string'&&norm(j.downloadDir)===want);}catch(e){fin(false);}});
    res.on('error',function(){fin(false);});});
  rq.on('error',function(){fin(false);});}
setTimeout(function(){process.exit(0);},30000);
(function go(p){if(p>first+10){process.exit(0);}probe(p,function(m){if(m){console.log(p);process.exit(0);}go(p+1);});})(first);
EOF

# Is the window that wrote the lock still alive? (Not just "some process has
# that number": after a crash or reboot the number may belong to another program.)
lock_owner_alive() {
  local pid="$1" args
  case "$pid" in *[!0-9]*|"") return 1 ;; esac
  [ "$pid" -gt 0 ] 2>/dev/null || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  args="$(ps -p "$pid" -o args= 2>/dev/null)"
  case "$args" in
    "") return 0 ;;                          # no ps output: trust kill -0
    *"$(basename "$0")"*) return 0 ;;
  esac
  return 1
}

# Single-instance lock: mkdir is atomic, so only one window can create the
# directory. 0 = we hold the lock (or locking is impossible here), 1 = busy.
acquire_lock() {
  local k n=0 old
  k="$(printf '%s' "$HERE" | cksum | cut -d' ' -f1)"
  LOCKDIR="${TMPDIR:-/tmp}"; LOCKDIR="${LOCKDIR%/}/ypu-music-$(id -u)-$k.lock"
  while [ "$n" -lt 4 ]; do
    n=$((n + 1))
    if mkdir "$LOCKDIR" 2>/dev/null; then
      echo "$$" > "$LOCKDIR/pid"; LOCK_HELD=1; return 0
    fi
    [ -d "$LOCKDIR" ] || return 0            # cannot create it at all: do not block the user
    old="$(cat "$LOCKDIR/pid" 2>/dev/null)"
    if [ -z "$old" ]; then sleep 1; old="$(cat "$LOCKDIR/pid" 2>/dev/null)"; fi   # a window may be writing it right now
    if [ -n "$old" ] && lock_owner_alive "$old"; then return 1; fi
    # Left behind by a window that crashed: move it away (only one window can win
    # this rename), delete it and try again.
    mv "$LOCKDIR" "$LOCKDIR.old.$$" 2>/dev/null
    rm -rf "$LOCKDIR.old.$$" 2>/dev/null
  done
  return 1
}

say ""
say "  =================================================================="
say "     YPU Music"
say "     Spotify listelerini MP3 olarak indirin / Download Spotify as MP3"
say "  =================================================================="
say ""
[ "$CHECK" = "1" ] && say "  --check: sadece bakiyorum, hicbir sey kurmuyorum. Only looking, installing nothing." && say ""

# --- Work from the script's own folder (spaces and special letters ok) ---
if [ ! -f "$HERE/kaynak-kodlar/package.json" ]; then
  say "  !! \"kaynak-kodlar\" klasoru bulunamadi. / The \"kaynak-kodlar\" folder was not found."
  say "     ZIP dosyasini once cikartin, sonra bu dosyayi klasorun icinden calistirin."
  say "     Extract the ZIP first, then run this file from inside the extracted folder."
  die 1
fi
cd "$HERE/kaynak-kodlar" || die 1
APP="$(pwd)"
VENV_DIR="$APP/.venv"
VENV_PY="$VENV_DIR/bin/python"
DL_DIR="$HERE/Indirilen-Muzikler"

# Settings for every program we start.
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8 PIP_DISABLE_PIP_VERSION_CHECK=1 NEXT_TELEMETRY_DISABLED=1 npm_config_update_notifier=false

case "$HERE" in
  *OneDrive*|*Dropbox*)
    warn "Bu klasor OneDrive/Dropbox icinde: kurulum yavas olabilir, dosyalar kilitlenebilir. Klasoru ev klasorunuze tasiyin."
    say  "            This folder is inside OneDrive/Dropbox: setup can be slow and files can get locked. Move it to your home folder."
    ;;
esac

# =====================================================================
#  [1/6] Node.js
# =====================================================================
step 1 "Node.js kontrol ediliyor... / Checking Node.js..."
if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  # nvm users: the file manager does not load nvm, so do it here.
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
fi
NODE_VER=""
command -v node >/dev/null 2>&1 && NODE_VER="$(node -v 2>/dev/null)"
NODE_OK=0
if [ -n "$NODE_VER" ]; then
  if node -e "var v=process.versions.node.split('.').map(Number);process.exit(v[0]>$MIN_NODE_MAJOR||(v[0]==$MIN_NODE_MAJOR&&v[1]>=$MIN_NODE_MINOR)?0:1)" >/dev/null 2>&1; then
    NODE_OK=1
  fi
fi
if [ "$NODE_OK" = "1" ]; then
  T_NODE="$NODE_VER"
  ok "Node.js $NODE_VER hazir. / Node.js $NODE_VER is ready."
else
  BAD=1
  if [ -z "$NODE_VER" ]; then
    bad "Node.js bulunamadi. / Node.js was not found."
  else
    bad "Node.js $NODE_VER cok eski. / Node.js $NODE_VER is too old."
  fi
  if [ "$CHECK" = "0" ]; then
    say ""
    say "        Bu program Node.js 20.9 veya daha yenisini ister. Ucretsiz bir programdir."
    say "        This app needs Node.js 20.9 or newer. It is a free program."
    say ""
    say "        NE YAPMALIYIM / WHAT TO DO:"
    say "         Linux dagitiminizin hazir 'nodejs' paketi genelde eskidir (Ubuntu 22.04/24.04 ve"
    say "         Debian 12'de 12 veya 18). Resmi sayfadaki talimatlari izleyin: 'LTS' surumunu secin"
    say "         (NodeSource veya nvm ile kurulum). Sonra bu dosyayi yeniden calistirin."
    say "         The 'nodejs' package of your distribution is usually too old (version 12 or 18 on"
    say "         Ubuntu 22.04/24.04 and Debian 12). Follow the official instructions: pick the"
    say "         'LTS' version (install via NodeSource or nvm). Then run this file again."
    say "         https://nodejs.org/en/download   (NodeSource: https://github.com/nodesource/distributions)"
    open_url "https://nodejs.org/en/download"
    die 1
  fi
fi

if [ "$CHECK" = "0" ]; then
  # Already-running check: if this copy is already serving, open browser and exit 0
  RUNNING_PORT="$(YPU_PROBE_DIR="$DL_DIR" YPU_PORT_START="${YPU_PORT_START:-3000}" node -e "$PROBEJS" 2>/dev/null || true)"
  RUNNING_PORT="$(echo "$RUNNING_PORT" | tr -d '[:space:]')"
  if [ -n "$RUNNING_PORT" ]; then
    ok "uygulama zaten calisiyor (kapi $RUNNING_PORT). / the app is already running (port $RUNNING_PORT)."
    say ""
    say "  =================================================================="
    say "    UYGULAMA ZATEN CALISIYOR / THE APP IS ALREADY RUNNING"
    say ""
    say "    Bu klasorun YPU Music uygulamasi su anda acik:"
    say "    The YPU Music app from this folder is currently open:"
    say ""
    say "        http://localhost:$RUNNING_PORT"
    say ""
    say "    Tarayicinizda aciliyor. / Opening it in your browser."
    say "  =================================================================="
    say ""
    open_url "http://localhost:$RUNNING_PORT/"
    exit 0
  fi

  # Single-instance lock: prevent a second window from running setup concurrently
  if ! acquire_lock; then
    say ""
    bad "Baska bir YPU Music penceresi halen hazirlaniyor veya calisiyor."
    say "        Another YPU Music window is still starting up or running."
    say "        Diger pencereyi bulun, bekleyin, kapatmayin."
    say "        Look for the other window; wait for it; do not close it."
    die 2
  fi
fi

# =====================================================================
#  [2/6] Python (only needed when the private environment is missing)
# =====================================================================
step 2 "Python kontrol ediliyor... / Checking Python..."
PYPROBE='import sys;v=sys.version_info;print("OK:"+sys.executable if v[0]==3 and v[1] in range(11,16) else "BAD:"+str(v[0])+"."+str(v[1]))'
VENV_OK=0
PYEXE=""; PYOLD=""; PYNOVENV=""; FRESH=0

venv_probe() {
  [ -x "$VENV_PY" ] || return 1
  "$VENV_PY" -c 'import sys;sys.exit(0 if sys.version_info[0]==3 and 11<=sys.version_info[1]<=15 else 1)' >/dev/null 2>&1 || return 1
  "$VENV_PY" -m pip --version >/dev/null 2>&1 || return 1
  return 0
}

find_python() {
  local c out kind rest
  for c in python3.13 python3.12 python3.14 python3.11 python3 python python3.15; do
    command -v "$c" >/dev/null 2>&1 || continue
    out="$("$c" -c "$PYPROBE" 2>/dev/null)" || continue
    kind="${out%%:*}"; rest="${out#*:}"
    if [ "$kind" = "OK" ]; then
      # python3 -m venv needs the 'ensurepip' part (Debian/Ubuntu: package python3-venv).
      if "$c" -c 'import venv, ensurepip' >/dev/null 2>&1; then
        PYEXE="$rest"; return 0
      else
        PYNOVENV="$rest"
      fi
    elif [ "$kind" = "BAD" ]; then
      PYOLD="$rest"
    fi
  done
  return 1
}

if venv_probe; then
  VENV_OK=1
  PYVER="$("$VENV_PY" -c 'import sys;print(sys.version.split()[0])' 2>/dev/null)"
  T_PY="$PYVER (private environment)"; T_VENV="OK"
  ok "Python $PYVER hazir (ozel klasor). / Python $PYVER is ready (private folder)."
elif find_python; then
  PYVER="$("$PYEXE" -c 'import sys;print(sys.version.split()[0])' 2>/dev/null)"
  T_PY="$PYVER at $PYEXE"
  ok "Python $PYVER bulundu. / Python $PYVER found."
else
  BAD=1
  if [ -n "$PYNOVENV" ]; then
    bad "Python var ama 'venv' parcasi eksik. / Python is there but its 'venv' part is missing."
  elif [ -n "$PYOLD" ]; then
    bad "Python $PYOLD bulundu ama desteklenmiyor. / Python $PYOLD was found but is not supported."
  else
    bad "Python bulunamadi. / Python was not found."
  fi
  if [ "$CHECK" = "0" ]; then
    say ""
    say "        Bu program Python 3.11 ile 3.15 arasi bir surum ister. Ucretsiz bir programdir."
    say "        This app needs Python between 3.11 and 3.15. It is a free program."
    say ""
    say "        NE YAPMALIYIM / WHAT TO DO: asagidaki satirlardan sizinkine uyani siyah pencereye"
    say "        yapistirin (sifre sorabilir), sonra bu dosyayi yeniden calistirin."
    say "        Copy the line that matches your Linux into the black window (it may ask for your"
    say "        password), then run this file again:"
    say "          Debian / Ubuntu / Mint : sudo apt install python3 python3-venv python3-pip"
    say "          Fedora                 : sudo dnf install python3 python3-pip"
    say "          Arch / Manjaro         : sudo pacman -S python python-pip"
    say "        Python 3.11'den eskiyse (ornegin Ubuntu 20.04) https://www.python.org/downloads/ sayfasina bakin."
    say "        If your Python is older than 3.11 (for example Ubuntu 20.04), see https://www.python.org/downloads/"
    open_url "https://www.python.org/downloads/"
    die 1
  fi
fi

# =====================================================================
#  [3/6] Private Python environment + packages (spotdl, yt-dlp)
# =====================================================================
step 3 "Ozel Python klasoru ve paketler... / Private Python folder and packages..."
if [ "$CHECK" = "1" ]; then
  if [ "$VENV_OK" = "1" ]; then
    V1="$("$VENV_PY" -c "import importlib.metadata as m;print(m.version('spotdl')+' / yt-dlp '+m.version('yt-dlp'))" 2>/dev/null)"
    if [ -n "$V1" ]; then T_SPOTDL="$V1"; ok "spotdl $V1"
    else BAD=1; say "        spotdl kurulu degil. / spotdl is not installed yet."; fi
  else
    BAD=1; say "        Ozel klasor henuz yok. / The private folder does not exist yet."
  fi
else
  tick
  if [ "$VENV_OK" = "0" ]; then
    if [ -e "$VENV_DIR" ]; then
      say "        Eski ozel klasor bozuk, yeniden kuruluyor. The old private folder is broken, rebuilding it."
      rm -rf "$VENV_DIR"
    fi
    FRESH=1
    say "        Ozel klasor olusturuluyor... / Creating the private folder..."
    if ! "$PYEXE" -m venv "$VENV_DIR" || [ ! -x "$VENV_PY" ]; then
      bad "Ozel Python klasoru olusturulamadi. / Could not create the private Python folder."
      say "           Debian/Ubuntu: sudo apt install python3 python3-venv python3-pip"
      say "           Fedora: sudo dnf install python3 python3-pip      Arch: sudo pacman -S python python-pip"
      die 1
    fi
  fi
  say "        Paketler kuruluyor / guncelleniyor. Ilk seferde birkac dakika surebilir."
  say "        Installing / updating packages. The first time this can take a few minutes."
  if "$VENV_PY" -m pip install --upgrade --retries 1 --timeout 20 -q -r "$APP/requirements.txt" yt-dlp >"$VENV_DIR/ypu-pip.log" 2>&1; then
    tick; ok "paketler hazir (${EL} sn). / packages are ready (${EL} s)."
  elif [ "$FRESH" = "0" ] && "$VENV_PY" -c "import spotdl, yt_dlp" >/dev/null 2>&1; then
    # (an update that failed on top of a working install is fine; a first
    #  install that broke half way is not)
    warn "Paketler guncellenemedi (internet yok mu?). Eski surumle devam ediliyor."
    say  "            Could not update the packages (no internet?). Continuing with the installed ones."
    say  "            Indirme sorunlari cikarsa internete baglanip yeniden baslatin. If downloads fail later, connect and start again."
  else
    say ""
    bad "Gerekli paketler kurulamadi. / The required packages could not be installed."
    say "           Internet baglantinizi kontrol edin ve yeniden deneyin. Check your internet connection and try again."
    say "           Teknik ayrinti / technical details:"
    say "           ----------------------------------------------------------"
    cat "$VENV_DIR/ypu-pip.log"
    say "           ----------------------------------------------------------"
    die 1
  fi
fi

# =====================================================================
#  [4/6] ffmpeg (turns downloads into MP3) and deno (helper for YouTube)
# =====================================================================
step 4 "ffmpeg kontrol ediliyor... / Checking ffmpeg..."
find_tool() {  # find_tool <name>  -> prints a path or "on PATH"
  local n="$1" d
  if command -v "$n" >/dev/null 2>&1; then echo "on PATH"; return 0; fi
  for d in "$HOME/.spotdl" "$HOME/.config/spotdl"; do
    [ -x "$d/$n" ] && { echo "$d/$n"; return 0; }
  done
  return 1
}
FFMPEG="$(find_tool ffmpeg)"
if [ -n "$FFMPEG" ]; then
  T_FFMPEG="$FFMPEG"; ok "ffmpeg hazir. / ffmpeg is ready."
elif [ "$CHECK" = "1" ]; then
  BAD=1; say "        ffmpeg bulunamadi. / ffmpeg was not found."
else
  tick
  say "        ffmpeg yok, indiriliyor (yaklasik 70 MB)... / ffmpeg is missing, downloading it (about 70 MB)..."
  "$VENV_PY" -m spotdl --download-ffmpeg </dev/null >"$VENV_DIR/ypu-ffmpeg.log" 2>&1
  FFMPEG="$(find_tool ffmpeg)"
  # Make sure the downloaded file really runs (a failed download can leave junk).
  if [ -n "$FFMPEG" ] && [ "$FFMPEG" != "on PATH" ] && ! "$FFMPEG" -version >/dev/null 2>&1; then
    rm -f "$FFMPEG" 2>/dev/null   # a half-downloaded file: remove it so the next start retries
    FFMPEG=""
  fi
  if [ -n "$FFMPEG" ]; then
    tick; T_FFMPEG="$FFMPEG"; ok "ffmpeg indirildi (${EL} sn). / ffmpeg downloaded (${EL} s)."
  else
    BAD=1
    say ""
    say "        !!!! ffmpeg KURULAMADI - MP3 INDIRME CALISMAYACAK !!!!"
    say "        !!!! ffmpeg COULD NOT BE SET UP - MP3 DOWNLOADS WILL NOT WORK !!!!"
    say ""
    say "        Uygulamayi yine de acabilirsiniz ama sarki indirilemez. Cozum: siyah pencereye yapistirin."
    say "        You can still open the app, but songs cannot be downloaded. Fix: paste into the black window:"
    say "          Debian / Ubuntu / Mint : sudo apt install ffmpeg"
    say "          Fedora                 : sudo dnf install ffmpeg      (needs the RPM Fusion repository)"
    say "          Arch / Manjaro         : sudo pacman -S ffmpeg"
    say "        Sonra bu dosyayi yeniden calistirin. Then run this file again."
    say ""
  fi
fi

if [ "$INSTALL_DENO" = "1" ]; then
  DENO="$(find_tool deno)"
  if [ -n "$DENO" ]; then
    T_DENO="$DENO"; ok "deno hazir. / deno is ready."
  elif [ "$CHECK" = "1" ]; then
    BAD=1; T_DENO="MISSING - will be downloaded on a real start"
    say "        deno bulunamadi. / deno was not found."
  else
    say "        Yardimci arac \"deno\" indiriliyor... / Downloading the helper \"deno\"..."
    "$VENV_PY" -m spotdl --download-deno </dev/null >"$VENV_DIR/ypu-deno.log" 2>&1
    DENO="$(find_tool deno)"
    if [ -n "$DENO" ]; then T_DENO="$DENO"; ok "deno hazir. / deno is ready."
    else
      warn "\"deno\" indirilemedi. Bazi YouTube sarkilari indirilemeyebilir; devam ediyoruz."
      say  "            Could not download \"deno\". Some YouTube songs may fail; carrying on."
    fi
  fi
fi

# =====================================================================
#  [5/6] App packages (npm) and build
# =====================================================================
step 5 "Uygulama dosyalari hazirlaniyor... / Preparing the app..."
NEED_NPM=0
[ -f node_modules/.ypu-installed ] || NEED_NPM=1
if [ "$NEED_NPM" = "0" ]; then
  node -e "var f=require('fs');try{process.exit(f.statSync('package-lock.json').mtimeMs>f.statSync('node_modules/.ypu-installed').mtimeMs?1:0)}catch(e){process.exit(1)}" >/dev/null 2>&1 || NEED_NPM=1
fi
if [ "$CHECK" = "1" ]; then
  if [ "$NEED_NPM" = "0" ]; then T_NPM="OK (build is done on every real start)"; ok "paketler kurulu. / packages are installed."
  else BAD=1; fi
else
  if [ "$NEED_NPM" = "1" ]; then
    tick
    say "        Uygulama paketleri kuruluyor, birkac dakika surebilir..."
    say "        Installing the app packages, this can take a few minutes..."
    if ! npm ci --no-audit --no-fund --loglevel=error; then
      say ""
      bad "Uygulama paketleri kurulamadi. / The app packages could not be installed."
      say "           Internet yok mu? Disk dolu mu? Klasor yazma izni var mi? Check: internet, free disk space, write permission."
      die 1
    fi
    echo ok > node_modules/.ypu-installed
    tick; ok "paketler kuruldu (${EL} sn). / packages installed (${EL} s)."
  fi
  tick
  say "        Uygulama hazirlaniyor, bu bir dakika surebilir... / Preparing the app, this can take a minute..."
  BUILDLOG="$(mktemp 2>/dev/null || echo "/tmp/ypu-build-$$.log")"
  if ! npm run build >"$BUILDLOG" 2>&1; then
    say ""
    bad "Uygulama hazirlanamadi. / The app could not be prepared."
    say "           Teknik ayrinti / technical details:"
    say "           ----------------------------------------------------------"
    cat "$BUILDLOG"
    say "           ----------------------------------------------------------"
    say "           Yukaridaki hata satirlarina bakin; internet yoksa baglanip tekrar deneyin."
    say "           Look at the error lines above; if there is no internet, connect and try again."
    die 1
  fi
  rm -f "$BUILDLOG" 2>/dev/null
  tick; ok "uygulama hazir (${EL} sn). / the app is ready (${EL} s)."
fi

# =====================================================================
#  [6/6] Free port, start the server, open the browser
# =====================================================================
step 6 "Uygulama baslatiliyor... / Starting the app..."
PORTJS="var net=require('net');var hosts=['127.0.0.1','::1'];function isFree(p,cb){var done=false;function fin(r){if(!done){done=true;cb(r);}}var i=0;(function next(){if(done)return;if(i>=hosts.length){var s=net.createServer();s.once('error',function(){fin(false);});s.listen(p,'127.0.0.1',function(){s.close(function(){fin(true);});});return;}var c=net.connect({port:p,host:hosts[i++]});c.setTimeout(1000);c.once('connect',function(){c.destroy();fin(false);});c.once('timeout',function(){c.destroy();next();});c.once('error',function(){next();});})();}var first=Number(process.env.YPU_PORT_START)||3000;(function go(p){if(p>first+10){console.log('NONE');return;}isFree(p,function(ok){if(ok)console.log(p);else go(p+1);});})(first);"
PORT=""
[ -n "$NODE_VER" ] && PORT="$(node -e "$PORTJS" 2>/dev/null)"
[ "$PORT" = "NONE" ] && PORT=""
[ -n "$PORT" ] && T_PORT="$PORT"

if [ "$CHECK" = "1" ]; then
  [ -z "$PORT" ] && BAD=1
  say ""
  say "  ------------------ STATUS / DURUM ------------------"
  printf '    %-15s: %s\n' "Node.js" "$T_NODE" "Python" "$T_PY" "Private folder" "$T_VENV" \
    "spotdl" "$T_SPOTDL" "ffmpeg" "$T_FFMPEG"
  [ "$INSTALL_DENO" = "1" ] && printf '    %-15s: %s\n' "deno" "$T_DENO"
  printf '    %-15s: %s\n' "App packages" "$T_NPM" "Free port" "$T_PORT"
  say "  ----------------------------------------------------"
  if [ "$BAD" = "0" ]; then say "    READY / HAZIR"; exit 0
  else say "    NOT READY - something is missing / HAZIR DEGIL - eksik var"; exit 1; fi
fi

if [ -z "$PORT" ]; then
  bad "3000-3010 arasi bos kapi bulunamadi. / No free port between 3000 and 3010."
  say "           Bilgisayari yeniden baslatin veya baska programlari kapatip tekrar deneyin."
  say "           Restart the computer or close other programs and try again."
  die 1
fi

mkdir -p "$DL_DIR" 2>/dev/null
export YPU_PYTHON="$VENV_PY"
URL="http://localhost:$PORT/"
ok "kapi $PORT bos. / port $PORT is free."
say ""
say "  =================================================================="
say ""
say "    UYGULAMA HAZIR / THE APP IS READY"
say ""
say "    Tarayicinizda acilacak. Acilmazsa bu adresi tarayiciya yazin:"
say "    It opens in your browser. If it does not, type this address into it:"
say ""
say "        http://localhost:$PORT"
say ""
say "    Indirilen MP3 dosyalari bu klasore gider / Your MP3 files go to this folder:"
say "        \"$DL_DIR\""
say ""
say "    !!  BU PENCEREYI KAPATMAYIN - kapatirsaniz uygulama durur."
say "    !!  DO NOT CLOSE THIS WINDOW - closing it stops the app."
say ""
say "    Durdurmak icin: Ctrl+C tusuna basin ya da pencereyi kapatin."
say "    To stop it: press Ctrl+C or close this window."
say ""
say "  =================================================================="
say ""

# Wait (max 60 s) until the server answers, then open the browser.
(
  i=0
  while [ "$i" -lt 60 ]; do
    if node -e "fetch('$URL').then(function(r){process.exit(r.ok?0:1)}).catch(function(){process.exit(1)})" >/dev/null 2>&1; then
      open_url "$URL"; exit 0
    fi
    i=$((i + 1)); sleep 1
  done
) &
OPENER=$!

npx next start -H 127.0.0.1 -p "$PORT"
SRV_RC=$?
kill "$OPENER" 2>/dev/null
say ""
say "  =================================================================="
say "    Uygulama durdu (kod $SRV_RC). / The app has stopped (code $SRV_RC)."
say "    Yeniden baslatmak icin bu dosyayi tekrar calistirin."
say "    To start it again, run this file again."
say "  =================================================================="
die "$SRV_RC"
