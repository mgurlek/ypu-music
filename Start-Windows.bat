@echo off
rem =====================================================================
rem  YPU Music - Windows launcher  /  Windows icin baslatici
rem
rem  Double-click this file. It checks what is needed, sets up everything
rem  it can on its own, starts the app and opens your web browser.
rem  Bu dosyaya cift tiklayin. Gerekenleri kontrol eder, kurabildigini
rem  kendisi kurar, uygulamayi baslatir ve tarayiciyi acar.
rem
rem  Options / Secenekler:
rem    Start-Windows.bat --check   Only look, change nothing: prints a status
rem                                table. Exit code 0 = everything in place,
rem                                1 = something is missing.
rem    (testing) set YPU_NO_PAUSE=1  -> never wait for a key press.
rem    (testing) set YPU_TIMING=1    -> print seconds spent per step.
rem    (testing) set YPU_NO_BROWSER=1 -> do not open the web browser.
rem    (testing) set YPU_PORT_START=3151 -> look for a free port from here, not 3000.
rem
rem  Double-clicking it a second time / Ikinci kez cift tiklarsaniz:
rem    - If THIS copy of the app is already running, the second start does
rem      nothing but open the browser at the running app and exit (code 0).
rem      It looks at ports 3000-3010 (YPU_PORT_START honoured) and only counts
rem      an app whose download folder is this copy's "Indirilen-Muzikler".
rem      An app from another folder, or another program, is ignored.
rem    - If another window of THIS copy is still setting up (the first start
rem      can take minutes before the app answers), the second window prints a
rem      message and exits with a non-zero code without touching anything.
rem      That is a single-instance lock: a file in %TEMP% that the running
rem      window keeps open. Windows frees it by itself when the window closes
rem      or crashes, so a stale lock cannot happen.
rem    - --check never looks at the lock and never opens the browser.
rem    - Every real start still runs "npm run build" (this is how an update of
rem      the app files takes effect; to force a rebuild just start it again).
rem
rem  Settings you can change below:
rem    INSTALL_DENO=1  download the "deno" helper (a JavaScript runtime that
rem                    yt-dlp needs for some YouTube videos). 0 = skip it.
rem
rem  Notes for maintainers:
rem   - This file must keep CRLF line endings (see .gitattributes).
rem   - It is deliberately ASCII only: Turkish text is written without the
rem     special letters (g s i o u c), because batch files containing UTF-8
rem     letters are fragile in cmd.exe on older Windows 10 builds.
rem   - Delayed expansion is OFF on purpose, so a folder name that contains
rem     an exclamation mark still works. Paths are always printed in quotes.
rem =====================================================================
setlocal DisableDelayedExpansion
set "INSTALL_DENO=1"

title YPU Music
set "RC=0"
set "BAD=0"
set "CHECK="
if /i "%~1"=="--check" set "CHECK=1"

rem --- UTF-8 console, so folder names with special letters survive ------
set "OLDCP="
for /f "tokens=2 delims=:" %%c in ('chcp 2^>nul') do set "OLDCP=%%c"
rem Turkish Windows prints "Etkin kod sayfasi: 1254." (with a dot): keep digits only.
if defined OLDCP for /f "tokens=1 delims=. " %%d in ("%OLDCP%") do set "OLDCP=%%d"
if defined OLDCP echo %OLDCP%| findstr /r /x "[0-9][0-9]*" >nul 2>&1
if errorlevel 1 set "OLDCP="
chcp 65001 >nul 2>&1

rem --- Environment for every program we start ---------------------------
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
set "PIP_DISABLE_PIP_VERSION_CHECK=1"
set "NEXT_TELEMETRY_DISABLED=1"
set "npm_config_update_notifier=false"

rem --- Helper snippets kept in variables (avoids quoting trouble) -------
set "PYPROBE=import sys;v=sys.version_info;print('OK:'+sys.executable if v[0]==3 and v[1] in range(11,16) else 'BAD:'+str(v[0])+'.'+str(v[1]))"
set "YPU_PORTJS=var net=require('net');var hosts=['127.0.0.1','::1'];function isFree(p,cb){var done=false;function fin(r){if(!done){done=true;cb(r);}}var i=0;(function next(){if(done)return;if(i>=hosts.length){var s=net.createServer();s.once('error',function(){fin(false);});s.listen(p,'127.0.0.1',function(){s.close(function(){fin(true);});});return;}var c=net.connect({port:p,host:hosts[i++]});c.setTimeout(1000);c.once('connect',function(){c.destroy();fin(false);});c.once('timeout',function(){c.destroy();next();});c.once('error',function(){next();});})();}var first=Number(process.env.YPU_PORT_START)||3000;(function go(p){if(p>first+10){console.log('NONE');return;}isFree(p,function(ok){if(ok)console.log(p);else go(p+1);});})(first);"
rem Is THIS copy of the app already answering on 3000-3010? Prints the port if so.
rem (Host header is "127.0.0.1:<port>", which the app accepts. Compares folders
rem  case-insensitively on Windows; another folder's app is not a match.)
set "YPU_PROBEJS=var http=require('http'),path=require('path'),fs=require('fs');function norm(p){try{p=fs.realpathSync.native(p);}catch(e){p=path.resolve(String(p));}p=p.replace(/[\\/]+$/,'');return process.platform==='win32'||process.platform==='darwin'?p.toLowerCase():p;}var want=norm(process.env.YPU_PROBE_DIR);var first=Number(process.env.YPU_PORT_START)||3000;function probe(p,cb){var done=false,rq=null,t=null;function fin(r){if(!done){done=true;clearTimeout(t);cb(r);}}t=setTimeout(function(){try{rq.destroy();}catch(e){}fin(false);},2500);rq=http.get({host:'127.0.0.1',port:p,path:'/api/queue',agent:false},function(res){if(res.statusCode!==200){res.resume();fin(false);return;}var b='';res.setEncoding('utf8');res.on('data',function(d){b+=d;if(b.length>5000000){rq.destroy();fin(false);}});res.on('end',function(){try{var j=JSON.parse(b);fin(!!j&&typeof j.downloadDir==='string'&&norm(j.downloadDir)===want);}catch(e){fin(false);}});res.on('error',function(){fin(false);});});rq.on('error',function(){fin(false);});}setTimeout(function(){process.exit(0);},30000);(function go(p){if(p>first+10){process.exit(0);}probe(p,function(m){if(m){console.log(p);process.exit(0);}go(p+1);});})(first);"
set "YPU_HASHJS=console.log(require('crypto').createHash('sha256').update(String(process.env.YPU_PROBE_DIR).toLowerCase()).digest('hex').slice(0,12))"
set "TMPF=%TEMP%\ypu-start-%RANDOM%.txt"
set "LAST=0"
set "PUSHED="
set "LOCK_GOT="
set "RUNPORT="
set "BUILDLOG=%TEMP%\ypu-build-%RANDOM%.log"

echo.
echo   ==================================================================
echo      YPU Music
echo      Spotify listelerini MP3 olarak indirin / Download Spotify as MP3
echo   ==================================================================
echo.
if defined CHECK echo   --check: sadece bakiyorum, hicbir sey kurmuyorum. Only looking, installing nothing.
if defined CHECK echo.

rem --- Go to the app folder (works with spaces and special letters) -----
set "ROOT=%~dp0"
if not exist "%ROOT%kaynak-kodlar\package.json" goto :no_folder
pushd "%ROOT%kaynak-kodlar"
if errorlevel 1 goto :no_folder
set "PUSHED=1"
set "APP=%CD%"
set "VENV_DIR=%APP%\.venv"
set "VENV_PY=%VENV_DIR%\Scripts\python.exe"
set "DL_DIR=%ROOT%Indirilen-Muzikler"

set "T_NODE=MISSING - you must install it"
set "T_PY=MISSING - you must install it"
set "T_VENV=MISSING - will be created on a real start"
set "T_SPOTDL=MISSING - will be installed on a real start"
set "T_FFMPEG=MISSING - will be downloaded on a real start"
set "T_DENO=not needed"
set "T_NPM=MISSING - will be installed on a real start"
set "T_PORT=none free (3000-3010)"

rem --- Warn about OneDrive (slow, can lock files) -----------------------
set "ROOTCHK=%ROOT%"
rem The "&", "^" and ";" characters in a folder name break npm on Windows.
if not "%ROOTCHK:&=%"=="%ROOTCHK%" goto :badchars
if not "%ROOTCHK:^=%"=="%ROOTCHK%" goto :badchars
if not "%ROOTCHK:;=%"=="%ROOTCHK%" goto :badchars
if "%ROOTCHK:OneDrive=%"=="%ROOTCHK%" goto :after_onedrive
echo   [!] Bu klasor OneDrive icinde. Kurulum yavas olabilir ve dosyalar kilitlenebilir.
echo       Daha iyisi: klasoru C:\ypu-music gibi bir yere tasiyin.
echo       This folder is inside OneDrive. Setup can be slow and files can get locked.
echo       Better: move the whole folder to something like C:\ypu-music.
echo.
:after_onedrive

rem =====================================================================
rem  [1/6] Node.js
rem =====================================================================
call :tick
echo   [1/6] Node.js kontrol ediliyor... / Checking Node.js...
set "NODE_VER="
for /f "delims=" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
if not defined NODE_VER goto :node_missing
node -e "var v=process.versions.node.split('.').map(Number);process.exit(v[0]>20||(v[0]==20&&v[1]>=9)?0:1)" >nul 2>&1
if errorlevel 1 goto :node_old
set "T_NODE=%NODE_VER%"
echo         OK - Node.js %NODE_VER% hazir. / Node.js %NODE_VER% is ready.
goto :step2

:node_missing
echo         !! Node.js bulunamadi. / Node.js was not found.
goto :node_help
:node_old
echo         !! Node.js %NODE_VER% cok eski. / Node.js %NODE_VER% is too old.
:node_help
set "BAD=1"
if defined CHECK goto :step2
echo.
echo         Bu program Node.js 20.9 veya daha yenisini ister. Ucretsiz bir programdir.
echo         This app needs Node.js 20.9 or newer. It is a free program.
echo.
echo         NE YAPMALIYIM / WHAT TO DO:
echo          1. Simdi acilan sayfadan yesil "LTS" yazan dugmeyi indirip kurun.
echo             Her ekranda Next / Ileri deyin.
echo             On the page that opens now, download the green "LTS" button and
echo             install it. Click Next on every screen.
echo          2. Kurulum bitince bu SIYAH PENCEREYI KAPATIN ve bu dosyaya
echo             yeniden cift tiklayin. Yeni kurulum ancak yeni pencerede gorulur.
echo             When it is done, CLOSE THIS BLACK WINDOW and double-click this
echo             file again. A new installation only shows up in a new window.
if defined YPU_NO_BROWSER echo         [test] browser not opened: https://nodejs.org/
if not defined YPU_NO_BROWSER start "" "https://nodejs.org/"
set "RC=1"
call :waitkey
goto :finish

rem =====================================================================
rem  Second double-click protection (real starts only, never --check)
rem   (a) this copy already answers on 3000-3010 -> open the browser, stop
rem   (b) another window of this copy is still setting up -> stop
rem  Steps 2-6 run inside ":rest". On a real start ":rest" is called with an
rem  exclusive file handle (9) on a lock file: the second window cannot open
rem  that file, and Windows frees the handle when the window closes or dies.
rem =====================================================================
:step2
if defined CHECK goto :run_check
set "YPU_PROBE_DIR=%DL_DIR%"
for /f "usebackq delims=" %%p in (`node -e "eval(process.env.YPU_PROBEJS)" 2^>nul`) do set "RUNPORT=%%p"
if defined RUNPORT goto :already_running
set "LOCKKEY=default"
for /f "usebackq delims=" %%h in (`node -e "eval(process.env.YPU_HASHJS)" 2^>nul`) do set "LOCKKEY=%%h"
set "YPU_PROBE_DIR="
set "LOCKFILE=%TEMP%\ypu-music-%LOCKKEY%.lock"
rem Quiet test first (the group hides the system's "file in use" text).
set "LOCK_FREE="
( call :lock_test 9>>"%LOCKFILE%" ) 2>nul
if not defined LOCK_FREE goto :lock_busy
rem The real thing: the whole setup + the server run while handle 9 is held.
call :rest 9>"%LOCKFILE%"
if not defined LOCK_GOT goto :lock_busy
goto :finish

:run_check
call :rest
goto :finish

:lock_test
set "LOCK_FREE=1"
exit /b 0

:already_running
set "YPU_PROBE_DIR="
set "URL=http://localhost:%RUNPORT%/"
echo.
echo   ==================================================================
echo.
echo     YPU Music zaten calisiyor. / YPU Music is already running.
echo.
echo     Adres / Address:   http://localhost:%RUNPORT%
echo.
echo     Tarayici aciliyor. Acilmazsa bu adresi tarayiciya yazin.
echo     The browser opens now. If it does not, type this address into it.
echo.
echo     Bu pencereyi kapatabilirsiniz. Uygulamanin CALISTIGI diger siyah
echo     pencereyi ise KAPATMAYIN.
echo     You can close this window. Do NOT close the other black window
echo     where the app is running.
echo.
echo   ==================================================================
if defined YPU_NO_BROWSER echo         [test] browser not opened: %URL%
if not defined YPU_NO_BROWSER start "" "%URL%"
set "RC=0"
call :waitkey
goto :finish

:lock_busy
echo.
echo   ==================================================================
echo.
echo     !!  Baska bir YPU Music penceresi hala hazirlaniyor veya calisiyor.
echo     !!  Another YPU Music window is still starting up or running.
echo.
echo     Diger SIYAH PENCEREYE bakin, bitmesini bekleyin ve onu KAPATMAYIN.
echo     Ilk kurulum birkac dakika surebilir. Uygulama hazir olunca tarayici acilir.
echo     Look for the other black window, wait for it, and do NOT close it.
echo     The first setup can take a few minutes. The browser opens when the app is ready.
echo.
echo     O pencerede sadece bir hata yaziyorsa onu kapatip bunu yeniden baslatin.
echo     If that window only shows an error message, close it and start this again.
echo.
echo   ==================================================================
set "RC=2"
call :waitkey
goto :finish

rem =====================================================================
rem  [2/6] Python  (only needed when the private environment is missing)
rem  From here on this is the ":rest" block (called, so "exit /b" returns).
rem =====================================================================
:rest
set "LOCK_GOT=1"
echo.
echo   [2/6] Python kontrol ediliyor... / Checking Python...
rem Windows can only handle file paths up to 260 characters and some Python
rem packages have long file names. If this folder is deep (OneDrive, long user
rem names) keep the private Python folder in a short place instead.
set "VLEN=0"
set "VLIMIT=130"
if defined YPU_VLIMIT set "VLIMIT=%YPU_VLIMIT%"
if defined NODE_VER for /f %%n in ('node -p "process.argv[1].length" "%VENV_DIR%" 2^>nul') do set "VLEN=%%n"
if %VLEN% gtr %VLIMIT% set "VENV_DIR=%LOCALAPPDATA%\YPU-Music\venv"
if %VLEN% gtr %VLIMIT% set "VENV_PY=%LOCALAPPDATA%\YPU-Music\venv\Scripts\python.exe"
if %VLEN% gtr %VLIMIT% echo         Klasor yolu uzun, ozel Python klasoru kisa bir yerde tutulacak. Long folder path, the private Python folder is kept in a short place.
set "FRESH="
set "PYEXE="
set "PYOLD="
set "VENV_OK="
if exist "%VENV_PY%" call :venv_probe
if defined VENV_OK goto :py_venv_ok
call :find_python
if defined PYEXE goto :py_found
if defined PYOLD goto :py_old
goto :py_missing

:py_venv_ok
set "PYVER="
"%VENV_PY%" -c "import sys;print(sys.version.split()[0])" >"%TMPF%" 2>nul
set /p PYVER=<"%TMPF%"
set "T_PY=%PYVER% (private environment)"
set "T_VENV=OK"
echo         OK - Python %PYVER% hazir (ozel klasor). / Python %PYVER% is ready (private folder).
goto :step3

:py_found
set "PYVER="
"%PYEXE%" -c "import sys;print(sys.version.split()[0])" >"%TMPF%" 2>nul
set /p PYVER=<"%TMPF%"
set "T_PY=%PYVER% at %PYEXE%"
echo         OK - Python %PYVER% bulundu. / Python %PYVER% found.
goto :step3

:py_old
echo         !! Python %PYOLD% bulundu ama bu surum desteklenmiyor.
echo            Python %PYOLD% was found but this version is not supported.
goto :py_help
:py_missing
echo         !! Python bulunamadi. / Python was not found.
echo            Microsoft Store kisayolu gercek Python degildir. The Microsoft Store shortcut is not real Python.
:py_help
set "BAD=1"
if defined CHECK goto :step3
echo.
echo         Bu program Python 3.11 ile 3.15 arasi bir surum ister. Ucretsiz bir programdir.
echo         This app needs Python between 3.11 and 3.15. It is a free program.
echo.
echo         NE YAPMALIYIM / WHAT TO DO:
echo          1. Simdi acilan sayfadan sari "Download Python" dugmesini indirip calistirin.
echo             On the page that opens now, download the yellow "Download Python"
echo             button and run it.
echo          2. !! COK ONEMLI: kurulumun ILK EKRANINDA en alttaki
echo             "Add python.exe to PATH" kutusunu ISARETLEYIN, sonra Install Now deyin.
echo             VERY IMPORTANT: on the FIRST screen of the installer, TICK the box
echo             "Add python.exe to PATH" at the bottom, then click Install Now.
echo          3. Bitince bu SIYAH PENCEREYI KAPATIN ve bu dosyaya yeniden cift tiklayin.
echo             When it is done, CLOSE THIS BLACK WINDOW and double-click this file again.
if defined YPU_NO_BROWSER echo         [test] browser not opened: https://www.python.org/downloads/
if not defined YPU_NO_BROWSER start "" "https://www.python.org/downloads/"
set "RC=1"
call :waitkey
exit /b 0

rem =====================================================================
rem  [3/6] Private Python environment + packages (spotdl, yt-dlp)
rem =====================================================================
:step3
echo.
echo   [3/6] Ozel Python klasoru ve paketler... / Private Python folder and packages...
if defined CHECK goto :check_pkgs
call :tick
if defined VENV_OK goto :pkgs_install
if exist "%VENV_DIR%" echo         Eski ozel klasor bozuk, yeniden kuruluyor. The old private folder is broken, rebuilding it.
if exist "%VENV_DIR%" rmdir /s /q "%VENV_DIR%"
set "FRESH=1"
echo         Ozel klasor olusturuluyor... / Creating the private folder...
if not exist "%VENV_DIR%\.." md "%VENV_DIR%\.." >nul 2>&1
"%PYEXE%" -m venv "%VENV_DIR%"
if errorlevel 1 goto :venv_failed
if not exist "%VENV_PY%" goto :venv_failed
:pkgs_install
echo         Paketler kuruluyor / guncelleniyor. Ilk seferde birkac dakika surebilir.
echo         Installing / updating packages. The first time this can take a few minutes.
"%VENV_PY%" -m pip install --upgrade --retries 1 --timeout 20 -q -r "%APP%\requirements.txt" yt-dlp >"%VENV_DIR%\ypu-pip.log" 2>&1
if errorlevel 1 goto :pip_failed
call :tick
echo         OK - paketler hazir ^(%EL% sn^). / packages are ready ^(%EL% s^).
goto :step4

rem A first install that broke half way must not be accepted; an update that
rem failed (offline) on top of a working install is fine.
:pip_failed
if defined FRESH goto :pip_fatal
"%VENV_PY%" -c "import spotdl, yt_dlp" >nul 2>&1
if errorlevel 1 goto :pip_fatal
echo         [!] Paketler guncellenemedi (internet yok mu?). Eski surumle devam ediliyor.
echo             Could not update the packages (no internet?). Continuing with the installed ones.
echo             Indirme sorunlari cikarsa internete baglanip yeniden baslatin.
echo             If downloads fail later, connect to the internet and start again.
goto :step4

:pip_fatal
echo.
echo         !! Gerekli paketler kurulamadi. / The required packages could not be installed.
echo            Internet baglantinizi kontrol edin ve yeniden deneyin.
echo            Check your internet connection and try again.
echo            Teknik ayrinti / technical details:
echo            ----------------------------------------------------------
type "%VENV_DIR%\ypu-pip.log"
echo            ----------------------------------------------------------
set "RC=1"
call :waitkey
exit /b 0

:venv_failed
echo.
echo         !! Ozel Python klasoru olusturulamadi. / Could not create the private Python folder.
echo            Klasor yolunda sorun olabilir veya antivirus engelledi. Klasoru C:\ypu-music
echo            gibi kisa bir yere tasiyip yeniden deneyin.
echo            The folder path may be the problem, or antivirus blocked it. Move the folder to
echo            a short place like C:\ypu-music and try again.
set "RC=1"
call :waitkey
exit /b 0

:check_pkgs
if defined VENV_OK goto :check_pkgs_go
set "BAD=1"
goto :step4
:check_pkgs_go
set "V1="
"%VENV_PY%" -c "import importlib.metadata as m;print(m.version('spotdl')+' / yt-dlp '+m.version('yt-dlp'))" >"%TMPF%" 2>nul
set /p V1=<"%TMPF%"
if not defined V1 goto :check_pkgs_none
set "T_SPOTDL=%V1%"
echo         OK - spotdl %V1%
goto :step4
:check_pkgs_none
echo         spotdl kurulu degil. / spotdl is not installed yet.
set "BAD=1"
goto :step4

rem =====================================================================
rem  [4/6] ffmpeg (turns downloads into MP3) and deno (helper for YouTube)
rem =====================================================================
:step4
echo.
echo   [4/6] ffmpeg kontrol ediliyor... / Checking ffmpeg...
set "FFMPEG="
where ffmpeg >nul 2>&1
if not errorlevel 1 set "FFMPEG=on PATH"
if not defined FFMPEG if exist "%USERPROFILE%\.spotdl\ffmpeg.exe" set "FFMPEG=%USERPROFILE%\.spotdl\ffmpeg.exe"
if defined FFMPEG goto :ffmpeg_ok
if defined CHECK goto :ffmpeg_check_missing
if not exist "%VENV_PY%" goto :ffmpeg_manual
call :tick
echo         ffmpeg yok, indiriliyor ^(yaklasik 70 MB^)... / ffmpeg is missing, downloading it ^(about 70 MB^)...
"%VENV_PY%" -m spotdl --download-ffmpeg <nul >"%VENV_DIR%\ypu-ffmpeg.log" 2>&1
if not exist "%USERPROFILE%\.spotdl\ffmpeg.exe" goto :ffmpeg_manual
"%USERPROFILE%\.spotdl\ffmpeg.exe" -version >nul 2>&1
if errorlevel 1 goto :ffmpeg_badfile
set "FFMPEG=%USERPROFILE%\.spotdl\ffmpeg.exe"
call :tick
echo         OK - ffmpeg indirildi ^(%EL% sn^). / ffmpeg downloaded ^(%EL% s^).
goto :ffmpeg_ok

rem A half-downloaded file: remove it so the next start tries again.
:ffmpeg_badfile
del "%USERPROFILE%\.spotdl\ffmpeg.exe" >nul 2>&1
goto :ffmpeg_manual

:ffmpeg_check_missing
echo         ffmpeg bulunamadi. / ffmpeg was not found.
set "BAD=1"
goto :deno

:ffmpeg_manual
echo.
echo         !!!! ffmpeg KURULAMADI - MP3 INDIRME CALISMAYACAK !!!!
echo         !!!! ffmpeg COULD NOT BE SET UP - MP3 DOWNLOADS WILL NOT WORK !!!!
echo.
echo         Uygulamayi yine de acabilirsiniz ama sarki indirilemez. Cozum:
echo         You can still open the app, but songs cannot be downloaded. Fix:
echo          1. Baslat menusunden "PowerShell" yazip acin, sunu yapistirin ve Enter'a basin:
echo             Open the Start menu, type "PowerShell", open it, paste this and press Enter:
echo.
echo                winget install Gyan.FFmpeg
echo.
echo          2. Bitince BU SIYAH PENCEREYI KAPATIN ve bu dosyaya yeniden cift tiklayin.
echo             Then CLOSE THIS BLACK WINDOW and double-click this file again.
echo         ^(Bilgisayariniz ARM64 ise ya da internet yoksa ffmpeg otomatik inemez.^)
echo         ^(On ARM64 PCs or without internet ffmpeg cannot be downloaded automatically.^)
echo.
set "BAD=1"
goto :deno

:ffmpeg_ok
set "T_FFMPEG=%FFMPEG%"
echo         OK - ffmpeg hazir. / ffmpeg is ready.

:deno
if not "%INSTALL_DENO%"=="1" goto :step5
set "DENO="
where deno >nul 2>&1
if not errorlevel 1 set "DENO=on PATH"
if not defined DENO if exist "%USERPROFILE%\.spotdl\deno.exe" set "DENO=%USERPROFILE%\.spotdl\deno.exe"
if defined DENO goto :deno_ok
if defined CHECK goto :deno_check_missing
if not exist "%VENV_PY%" goto :step5
echo         Yardimci arac "deno" indiriliyor... / Downloading the helper "deno"...
"%VENV_PY%" -m spotdl --download-deno <nul >"%VENV_DIR%\ypu-deno.log" 2>&1
if exist "%USERPROFILE%\.spotdl\deno.exe" goto :deno_downloaded
echo         [!] "deno" indirilemedi. Bazi YouTube sarkilari indirilemeyebilir; devam ediyoruz.
echo             Could not download "deno". Some YouTube songs may fail; carrying on.
goto :step5
:deno_downloaded
set "DENO=%USERPROFILE%\.spotdl\deno.exe"
:deno_ok
set "T_DENO=%DENO%"
echo         OK - deno hazir. / deno is ready.
goto :step5
:deno_check_missing
set "T_DENO=MISSING - will be downloaded on a real start"
set "BAD=1"
echo         deno bulunamadi. / deno was not found.

rem =====================================================================
rem  [5/6] App packages (npm) and build
rem =====================================================================
:step5
echo.
echo   [5/6] Uygulama dosyalari hazirlaniyor... / Preparing the app...
set "NEED_NPM="
if not exist "node_modules\.ypu-installed" set "NEED_NPM=1"
if not defined NEED_NPM node -e "var f=require('fs');try{process.exit(f.statSync('package-lock.json').mtimeMs>f.statSync('node_modules/.ypu-installed').mtimeMs?1:0)}catch(e){process.exit(1)}" >nul 2>&1
if not defined NEED_NPM if errorlevel 1 set "NEED_NPM=1"
if defined CHECK goto :check_npm
if not defined NEED_NPM goto :build
call :tick
echo         Uygulama paketleri kuruluyor, birkac dakika surebilir...
echo         Installing the app packages, this can take a few minutes...
call npm ci --no-audit --no-fund --loglevel=error
if errorlevel 1 goto :npm_failed
echo ok>"node_modules\.ypu-installed"
call :tick
echo         OK - paketler kuruldu ^(%EL% sn^). / packages installed ^(%EL% s^).
:build
call :tick
echo         Uygulama hazirlaniyor, bu bir dakika surebilir... / Preparing the app, this can take a minute...
call npm run build >"%BUILDLOG%" 2>&1
if errorlevel 1 goto :build_failed
call :tick
echo         OK - uygulama hazir ^(%EL% sn^). / the app is ready ^(%EL% s^).
goto :step6

:check_npm
if not defined NEED_NPM goto :check_npm_ok
set "BAD=1"
goto :step6
:check_npm_ok
set "T_NPM=OK (build is done on every real start)"
echo         OK - paketler kurulu. / packages are installed.
goto :step6

:npm_failed
echo.
echo         !! Uygulama paketleri kurulamadi. / The app packages could not be installed.
echo            Olasi nedenler / Likely reasons:
echo             - Internet yok. No internet connection.
echo             - OneDrive veya antivirus dosyalari kilitledi: klasoru C:\ypu-music gibi
echo               bir yere tasiyin. OneDrive or antivirus locked files: move the folder
echo               to something like C:\ypu-music.
echo             - Disk dolu. The disk is full.
set "RC=1"
call :waitkey
exit /b 0

:build_failed
echo.
echo         !! Uygulama hazirlanamadi. / The app could not be prepared.
echo            Teknik ayrinti / technical details:
echo            ----------------------------------------------------------
type "%BUILDLOG%"
echo            ----------------------------------------------------------
echo            Yukaridaki kirmizi/hata satirlarina bakin. Look at the error lines above.
echo            Internet yoksa baglanip tekrar deneyin. Klasor OneDrive icindeyse
echo            C:\ypu-music gibi bir yere tasiyin. If there is no internet, connect and
echo            try again. If the folder is in OneDrive, move it to something like C:\ypu-music.
set "RC=1"
call :waitkey
exit /b 0

rem =====================================================================
rem  [6/6] Free port, start the server, open the browser
rem =====================================================================
:step6
echo.
echo   [6/6] Uygulama baslatiliyor... / Starting the app...
set "PORT="
if not defined NODE_VER goto :step6_noport
for /f "usebackq delims=" %%p in (`node -e "eval(process.env.YPU_PORTJS)" 2^>nul`) do set "PORT=%%p"
:step6_noport
if "%PORT%"=="NONE" set "PORT="
if defined PORT set "T_PORT=%PORT%"
if defined CHECK goto :check_table
if defined PORT goto :run_server
echo         !! 3000-3010 arasi bos kapi bulunamadi. / No free port between 3000 and 3010.
echo            Bilgisayari yeniden baslatin veya baska programlari kapatip tekrar deneyin.
echo            Restart the computer or close other programs and try again.
set "RC=1"
call :waitkey
exit /b 0

:run_server
if not exist "%DL_DIR%" md "%DL_DIR%" >nul 2>&1
set "YPU_PYTHON=%VENV_PY%"
set "URL=http://localhost:%PORT%/"
echo         OK - kapi %PORT% bos. / port %PORT% is free.
echo.
echo   ==================================================================
echo.
echo     UYGULAMA HAZIR / THE APP IS READY
echo.
echo     Tarayicinizda acilacak. Acilmazsa bu adresi tarayiciya yazin:
echo     It opens in your browser. If it does not, type this address into it:
echo.
echo         http://localhost:%PORT%
echo.
echo     Indirilen MP3 dosyalari bu klasore gider / Your MP3 files go to this folder:
echo         "%DL_DIR%"
echo.
echo     !!  BU PENCEREYI KAPATMAYIN - kapatirsaniz uygulama durur.
echo     !!  DO NOT CLOSE THIS WINDOW - closing it stops the app.
echo.
echo     Durdurmak icin: Ctrl+C tusuna basin ya da pencereyi kapatin.
echo     To stop it: press Ctrl+C or close this window.
echo.
echo   ==================================================================
echo.
rem Wait (max 60 s) until the server answers, then open the browser.
start "" /b powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$u='%URL%';for($i=0;$i -lt 60;$i++){try{$r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 3;if($r.StatusCode -eq 200){if($env:YPU_NO_BROWSER){[Console]::WriteLine('[test] server answered, browser not opened')}else{Start-Process $u};break}}catch{};Start-Sleep -Seconds 1}"
call npx next start -H 127.0.0.1 -p %PORT%
set "SRV_RC=%errorlevel%"
echo.
echo   ==================================================================
echo     Uygulama durdu ^(kod %SRV_RC%^). / The app has stopped ^(code %SRV_RC%^).
echo     Yeniden baslatmak icin bu dosyaya tekrar cift tiklayin.
echo     To start it again, double-click this file again.
echo   ==================================================================
if not "%SRV_RC%"=="0" set "RC=%SRV_RC%"
call :waitkey
exit /b 0

rem =====================================================================
rem  --check result table
rem =====================================================================
:check_table
echo.
echo   ------------------ STATUS / DURUM ------------------
echo     Node.js        : %T_NODE%
echo     Python         : %T_PY%
echo     Private folder : %T_VENV%
echo     spotdl         : %T_SPOTDL%
echo     ffmpeg         : %T_FFMPEG%
if "%INSTALL_DENO%"=="1" echo     deno           : %T_DENO%
echo     App packages   : %T_NPM%
echo     Free port      : %T_PORT%
echo   ----------------------------------------------------
if not defined PORT set "BAD=1"
if not defined NODE_VER set "BAD=1"
if "%BAD%"=="1" goto :check_bad
echo     READY / HAZIR
exit /b 0
:check_bad
echo     NOT READY - something is missing / HAZIR DEGIL - eksik var
set "RC=1"
exit /b 0

rem =====================================================================
rem  Common exits
rem =====================================================================
:badchars
echo.
echo   !! Klasor yolunda ^&, ^^ veya ; isareti var, bu programi bozar. / The folder path contains an ^&, ^^ or ; sign, which breaks this app.
echo      Klasoru C:\ypu-music gibi basit bir yere tasiyin ve yeniden cift tiklayin.
echo      Move the whole folder to a simple place like C:\ypu-music and double-click again.
set "RC=1"
call :waitkey
goto :finish

:no_folder
echo.
echo   !! "kaynak-kodlar" klasoru bulunamadi. / The "kaynak-kodlar" folder was not found.
echo      ZIP dosyasini once cikartin ^(sag tik, Tumunu ayikla^), sonra bu dosyaya
echo      klasorun icinden cift tiklayin.
echo      Extract the ZIP file first ^(right-click, Extract All^), then double-click this
echo      file from inside the extracted folder.
set "RC=1"
call :waitkey
goto :finish

:finish
if defined PUSHED popd >nul 2>&1
if exist "%TMPF%" del "%TMPF%" >nul 2>&1
if exist "%BUILDLOG%" del "%BUILDLOG%" >nul 2>&1
if defined OLDCP chcp %OLDCP% >nul 2>&1
endlocal & exit /b %RC%

rem =====================================================================
rem  Subroutines
rem =====================================================================

rem Waits for a key so the window does not vanish before it can be read.
:waitkey
if defined YPU_NO_PAUSE exit /b 0
if defined CHECK exit /b 0
echo.
echo   Kapatmak icin bir tusa basin. / Press any key to close this window.
pause >nul
exit /b 0

rem Seconds since the last tick (EL) - handy for "took N s" messages.
:tick
set "TT=%TIME: =0%"
set /a NOW=(1%TT:~0,2%-100)*3600+(1%TT:~3,2%-100)*60+(1%TT:~6,2%-100)
set "PREV=%LAST%"
set /a EL=NOW-LAST
if %EL% lss 0 set /a EL+=86400
set "LAST=%NOW%"
if defined YPU_TIMING if not "%PREV%"=="0" echo         [time %TT% - step took %EL% s]
exit /b 0

rem Is the private environment's python usable (right version, pip works)?
:venv_probe
set "VENV_OK="
"%VENV_PY%" -c "import sys;sys.exit(0 if sys.version_info[0]==3 and 11<=sys.version_info[1]<=15 else 1)" >nul 2>&1
if errorlevel 1 exit /b 0
"%VENV_PY%" -m pip --version >nul 2>&1
if errorlevel 1 exit /b 0
set "VENV_OK=1"
exit /b 0

rem Look for a real, supported Python on this PC. Sets PYEXE (full path) or
rem PYOLD (a version that was found but is not supported).
rem The Microsoft Store shortcut prints nothing useful and exits 9009, so it
rem simply counts as "not there".
:find_python
set "PYEXE="
set "PYOLD="
for %%V in (3.13 3.12 3.14 3.11 3.15) do if not defined PYEXE call :try_py py -%%V
if not defined PYEXE call :try_py py -3
if not defined PYEXE call :try_py python
if not defined PYEXE call :try_py python3
exit /b 0

:try_py
for /f "usebackq tokens=1,* delims=:" %%a in (`%* -c "%PYPROBE%" 2^>nul`) do (
  if "%%a"=="OK" if not defined PYEXE set "PYEXE=%%b"
  if "%%a"=="BAD" set "PYOLD=%%b"
)
exit /b 0
