// LP 위젯
    (function() {

        var widget = document.getElementById('lp-widget');
        var deck = document.getElementById('lp-deck');
        var tonearm = document.querySelector('.lp-tonearm');
        var vinyl = document.querySelector('.lp-vinyl');
        var playBtn = document.getElementById('lp-play-btn');
        var led = document.getElementById('lp-led');

        var volFill = document.getElementById('lp-vol-fill-sync');
        var volHandle = document.getElementById('lp-vol-handle-sync');

        var isReload = false;
        try {
            if (window.performance && window.performance.getEntriesByType) {
                var navs = window.performance.getEntriesByType("navigation");
                if (navs.length > 0 && navs[0].type === 'reload') isReload = true;
            }
            if (!isReload && window.performance && window.performance.navigation) {
                if (window.performance.navigation.type === 1) isReload = true;
            }
        } catch(e) {}

        if (isReload) {
            sessionStorage.setItem('lp_playing', 'false');
        
        }

        var savedVol = sessionStorage.getItem('lp_volume');
        var targetVol = savedVol ? parseInt(savedVol) : 70; 
        
        if (volFill) volFill.style.width = targetVol + '%';
        if (volHandle) volHandle.style.left = targetVol + '%';

        var isCollapsed = sessionStorage.getItem('lp_collapsed') === 'true';
        if (isCollapsed) {
            if (widget) widget.classList.add('lp-collapsed');
        } else {
            if (widget) widget.classList.remove('lp-collapsed');
        }

        if (widget) {
            widget.style.removeProperty('opacity');
            widget.style.removeProperty('visibility');
        }
        var isPlaying = sessionStorage.getItem('lp_playing') === 'true';
        
        if (isPlaying) {
            if (deck) deck.classList.add('is-playing');
            if (led) led.classList.add('is-on');
            if (tonearm) tonearm.style.transform = 'rotate(-60deg)';
            if (vinyl) vinyl.classList.add('spinning');
            if (playBtn) playBtn.innerHTML = '<i class="lp-pause-icon"></i>';
        }
    })();


    /* ===========================================
       [사용자 설정2] 노래 목록, 이미지, 볼륨 설정
       =========================================== */
    const LP_CONFIG = {

        // 1. 기본 볼륨 (0 ~ 100 사이)
        defaultVolume: 70,

        // 2. 플레이리스트 (유튜브 링크와 제목을 입력하세요)
        playlist: [
            
            { url: "https://www.youtube.com/watch?v=zbKWAzNF6ao", title: "SHIVER" },
        /*  { url: "https://www.youtube.com/watch?v=ApJ-vd-9RU0", title: "Fragile Mind" }, */
            { url: "https://www.youtube.com/watch?v=Ol7PzD0iwMk", title: "The Slightly Chipped Full Moon" },
        /*  { url: "https://www.youtube.com/watch?v=AePhG6R6UdE", title: "Cruelly Eyes" }, */
            { url: "https://www.youtube.com/watch?v=ulp9XrKjKQE", title: "Suo Gân by Emilie Parry Williams" },
            { url: "https://www.youtube.com/watch?v=Ui9YLBHq490", title: "輝く空の静寂には" },
            { url: "https://www.youtube.com/watch?v=kWk95U_njJ0", title: "Medieval Style" },
            { url: "https://www.youtube.com/watch?v=iv5vSbC6188", title: "The Butler of Trancy's" },
        /*  { url: "https://www.youtube.com/watch?v=Nx5c_JZIM6M", title: "Summer, III. Presto by Vivaldi, RV315" }, */
            { url: "https://www.youtube.com/watch?v=RuNqttY67O4", title: "A Spider's Thread" }
        /*  { url: "https://www.youtube.com/watch?v=7eNmrTcpW9g", title: "Cena d'amore" },
            { url: "https://www.youtube.com/watch?v=OM9KdvA7D7E", title: "Love Remembered from Dracula" }, */
         ]
    };

    /* ==========================================================================
       [시스템 로직] 이 아래부터는 코드를 수정하지 마세요.
       (안정화 버전 6.0)
       ========================================================================== */
    try {
        if (window.performance && window.performance.getEntriesByType) {
            var navEntries = window.performance.getEntriesByType("navigation");
            if (navEntries.length > 0 && navEntries[0].type === 'reload') {
                sessionStorage.setItem('lp_playing', 'false');
                sessionStorage.removeItem('lp_spin_base');
            }
        } else {
            if (window.performance && window.performance.navigation && window.performance.navigation.type === 1) {
                sessionStorage.setItem('lp_playing', 'false');
                sessionStorage.removeItem('lp_spin_base');
            }
        }
    } catch(e) {}

    var lpPlaylist = LP_CONFIG.playlist;
    function extractLpVideoId(url) {
        var regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        var match = url.match(regex);
        return (match && match[1]) ? match[1] : url;
    }

    var lpPlayer;
    var lpCurrentIndex = 0;
    var lpIsPlaying = false; 
    var lpIsRestoring = false; 
    var lpIsNavigating = false; 
    var SYNC_LATENCY = 0.5; 
    var checkInterval = null;
    var rebuildTimer 
    = null;
    var fadeInterval = null; 
    var fadeOutInterval = null;
    var lpIsPcBackNav = false; 
    
    var savedVol = sessionStorage.getItem('lp_volume');
    var lpVolume = savedVol ? parseInt(savedVol) : LP_CONFIG.defaultVolume; 

    var lpWidget = document.getElementById('lp-widget');
    var lpDeck = document.getElementById('lp-deck');
    var lpTonearm = document.querySelector('.lp-tonearm');
    var lpPlayBtn = document.getElementById('lp-play-btn');
    var lpCloseBtn = document.getElementById('lp-close-btn');
    var lpExpandBtn = document.getElementById('lp-expand-btn');
    var lpVinyl = document.querySelector('.lp-vinyl');
    var lpLed = document.getElementById('lp-led');
    var lpModal = document.getElementById('lp-modal');
    var lpModalItems = document.getElementById('lp-modal-items');
    var lpTooltip = document.querySelector('.lp-tooltip');
    var lpYtContainer = document.getElementById('lp-yt-container');

    var lpVolWrap = document.querySelector('.lp-volume-wrap');
    var lpVolFill = document.querySelector('.lp-vol-fill');
    var lpVolHandle = document.querySelector('.lp-vol-handle');
    function isMobileDevice() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }

    (function init() {

        if (lpTooltip) {
            lpTooltip.style.visibility = 'hidden';
            lpTooltip.style.opacity = '0';
            lpTooltip.style.transition = 'none';
        }

        var isReload = false;
        try {
            if (window.performance && window.performance.getEntriesByType) {
                var navs = window.performance.getEntriesByType("navigation");
                if (navs.length > 0 && navs[0].type === 'reload') isReload = true;
            }
            if (!isReload && window.performance && window.performance.navigation) {
                if (window.performance.navigation.type === 1) isReload = true;
            }
        } catch(e) {}

        if (isReload) {
            sessionStorage.setItem('lp_playing', 'false');
            sessionStorage.removeItem('lp_spin_base');
            sessionStorage.removeItem('lp_angle');
            sessionStorage.removeItem('lp_valid_nav');
            sessionStorage.removeItem('lp_time'); 
        }

        if (lpVolFill && lpVolHandle) {
            lpVolFill.style.width = lpVolume + '%';
            lpVolHandle.style.left = lpVolume + '%';
        }

        var sessionIndex = sessionStorage.getItem('lp_index');
        var historyIndex = localStorage.getItem('lp_saved_history');
        
        var savedTime = parseFloat(sessionStorage.getItem('lp_time'));
        var savedDuration = parseFloat(sessionStorage.getItem('lp_total_duration'));
        var wasPlaying = sessionStorage.getItem('lp_playing') === 'true';

        if (sessionIndex !== null) {
            lpCurrentIndex = parseInt(sessionIndex);
        } else if (historyIndex !== null) {
            var savedIdx = parseInt(historyIndex);
            if (!isNaN(savedIdx) && savedIdx >= 0 && savedIdx < lpPlaylist.length) {
                lpCurrentIndex = savedIdx;
            }
        }

        if (!isReload && wasPlaying && savedDuration > 0 && savedTime > 0) {
            if ((savedDuration - savedTime) < 1.5) {
                console.log("노래 끝자락(1.5초 미만) 감지 -> 다음 곡으로 자연스럽게 연결");
                lpCurrentIndex = (lpCurrentIndex + 1) % lpPlaylist.length; 
                
                sessionStorage.setItem('lp_index', lpCurrentIndex);
                sessionStorage.removeItem('lp_time'); 
                sessionStorage.removeItem('lp_total_duration');
                
                savedTime = 0; 
            }
        }

        renderLpPlaylist();
        updateLpTooltip();

        if (wasPlaying) {
            lpIsPlaying = true;
            lpIsRestoring = true;

            if(lpTonearm) {
                lpTonearm.style.setProperty('transition', 'none', 'important');
                lpTonearm.style.transform = 'rotate(-60deg)';
            }
            
            lpDeck.classList.add('is-playing');
            if(lpLed) lpLed.classList.add('is-on');
            lpPlayBtn.innerHTML = '<i class="lp-pause-icon"></i>'; 

            var spinBase = sessionStorage.getItem('lp_spin_base');
            if (spinBase) {
                var correction = 40;
                var elapsed = Date.now() - parseInt(spinBase) + correction;
                var syncDelay = (elapsed % 3000) / 1000;
                
                lpVinyl.classList.add('spinning');
                lpVinyl.style.animation = 'lpSpin 3s linear infinite';
                lpVinyl.style.animationDelay = '-' + syncDelay + 's';
            }
        } else {
            lpIsPlaying = false;
            lpDeck.classList.remove('is-playing');
            if(lpLed) lpLed.classList.remove('is-on');
            lpPlayBtn.innerHTML = "&#9654;";
            
            lpVinyl.style.transform = 'rotate(0deg)';
            
            if (lpTonearm) {
                lpTonearm.style.transition = 'none';
                lpTonearm.style.transform = ''; 
                setTimeout(function() { lpTonearm.style.removeProperty('transition'); }, 50);
            }
        }

        setTimeout(function() {
            if(lpWidget) lpWidget.style.removeProperty('transition');
        }, 100);
        setTimeout(function() {
            if (lpTooltip) {
                lpTooltip.style.removeProperty('visibility');
                lpTooltip.style.removeProperty('opacity');
                lpTooltip.style.removeProperty('transition');
            }
            if (lpDeck) lpDeck.classList.add('is-loaded');
        }, 500);
    })();

document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === 'visible') {
            var wasPlaying = sessionStorage.getItem('lp_playing');
            if (wasPlaying === 'true') {
                if (!lpPlayer || typeof lpPlayer.playVideo !== 'function') {
                    performEmergencyRebuild();
                } else {
                    var state = lpPlayer.getPlayerState && lpPlayer.getPlayerState();
                    if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
                        lpPlayer.playVideo();
                    }
                }
                if (lpVinyl && !lpVinyl.classList.contains('spinning')) {
                    lpVinyl.classList.add('spinning');
                }
            }
        }
    });

    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            var wasPlaying = sessionStorage.getItem('lp_playing');
            if (wasPlaying === 'true') {
                if (!isMobileDevice()) lpIsPcBackNav = true; 
                performEmergencyRebuild();
            }
  
        }
    });
    function updateVolumeFromEvent(e) {
        var rect = lpVolWrap.getBoundingClientRect();
        var clientX = e.touches ?
        e.touches[0].clientX : e.clientX;
        var offsetX = clientX - rect.left;
        var width = rect.width;
        var percentage = (offsetX / width) * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        
        if (fadeInterval) clearInterval(fadeInterval);
        if (fadeOutInterval) clearInterval(fadeOutInterval);
        
        setVolume(Math.round(percentage));
    }

    function setVolume(vol) {
        lpVolume = vol;
        sessionStorage.setItem('lp_volume', vol);
        lpVolFill.style.width = vol + '%';
        lpVolHandle.style.left = vol + '%';
        if (lpPlayer && typeof lpPlayer.setVolume === 'function') {
            lpPlayer.setVolume(lpVolume);
        }
    }

    if(lpVolWrap) {
        var isDragging = false;
        lpVolWrap.addEventListener('mousedown', function(e) { isDragging = true; updateVolumeFromEvent(e); });
        document.addEventListener('mousemove', function(e) { if (isDragging) { e.preventDefault(); updateVolumeFromEvent(e); } });
        document.addEventListener('mouseup', function() { isDragging = false; });
        lpVolWrap.addEventListener('touchstart', function(e) { isDragging = true; updateVolumeFromEvent(e); }, {passive: false});
        lpVolWrap.addEventListener('touchmove', function(e) { if (isDragging) { e.preventDefault(); updateVolumeFromEvent(e); } }, {passive: false});
        lpVolWrap.addEventListener('touchend', function() { isDragging = false; });
    }

    function performEmergencyRebuild() {
        if (rebuildTimer) clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(function() {
            if (lpPlayer) { try { lpPlayer.destroy(); } catch(e){} lpPlayer = null; }
            lpYtContainer.innerHTML = ''; 
            var newDiv = document.createElement('div');
            newDiv.id = 'lp-yt-player';
            lpYtContainer.appendChild(newDiv);
            tryRebuildPlayer(0);
      
        }, 200);
    }

    function tryRebuildPlayer(attempt) {
        if (attempt > 10) return;
        if (window.YT && window.YT.Player) {
            createPlayerInstance();
        } else {
            if (!document.getElementById('yt-api-script-reload')) {
                var tag = document.createElement('script');
                tag.id = 'yt-api-script-reload';
                tag.src = "https://www.youtube.com/iframe_api";
                document.head.appendChild(tag);
            }
            setTimeout(function() { tryRebuildPlayer(attempt + 1); }, 300);
        }
    }

function createPlayerInstance() {
        try {
            lpPlayer = new YT.Player('lp-yt-player', {
                height: '200', width: '200',
                videoId: extractLpVideoId(lpPlaylist[lpCurrentIndex].url),
                host: 'https://www.youtube-nocookie.com',
                playerVars: { 
                    'playsinline': 1, 
                    'controls': 0, 
                    'loop': 0,
                    'origin': window.location.origin
                },
            events: { 'onReady': onLpPlayerReady, 'onStateChange': onLpPlayerStateChange }
            });
        } catch(e) {
            setTimeout(function() { 
                lpTonearm.style.removeProperty('transition'); 
                lpTonearm.style.removeProperty('transform');
            }, 500);
        }
    }

    function renderLpPlaylist() {
        lpModalItems.innerHTML = '';
        lpPlaylist.forEach(function(song, index) {
            var li = document.createElement('li');
            li.className = 'lp-modal-item' + (index === lpCurrentIndex ? ' active' : '');
            li.innerText = song.title;
            li.onclick = function() { changeLpSong(index); };
            lpModalItems.appendChild(li);
        });
    }

    function updateLpTooltip() { if(lpTooltip) lpTooltip.innerText = lpPlaylist[lpCurrentIndex].title;
    }

    function smoothAudioReveal(targetPlayer) {
        if (!targetPlayer || typeof targetPlayer.setVolume !== 'function') return;
        if (document.hidden) {
            targetPlayer.setVolume(lpVolume);
            targetPlayer.unMute();
            return;
        }

        targetPlayer.setVolume(0);
        targetPlayer.unMute();
        
        if (fadeInterval) clearInterval(fadeInterval);
        if (fadeOutInterval) clearInterval(fadeOutInterval);
        
        var vol = 0;
        fadeInterval = setInterval(function() {
            vol += 20; 
            
            if (vol >= lpVolume) { 
                vol = lpVolume; 
                clearInterval(fadeInterval); 
            }
            targetPlayer.setVolume(vol);
        }, 20);
    }

    function smoothAudioVanish(targetPlayer, callback) {
        if (!targetPlayer || typeof targetPlayer.getVolume !== 'function') {
            if(callback) callback();
            return;
        }
        
        if (fadeInterval) clearInterval(fadeInterval);
        if (fadeOutInterval) clearInterval(fadeOutInterval);
        if (window.lpFadeTimer) clearTimeout(window.lpFadeTimer);

        var vol = targetPlayer.getVolume();
        fadeOutInterval = setInterval(function() {
            vol -= 6; 
            
            if (vol <= 0) {
                vol = 0; 
                clearInterval(fadeOutInterval);
                
   
              try {
                    targetPlayer.setVolume(0);
                    targetPlayer.mute(); 
                } catch(e) {}
                
           
             setTimeout(function() {
                    if(callback) callback();
                }, 100);
                
            } else {
                targetPlayer.setVolume(vol);
          
            }
        }, 20);
    }

function changeLpSong(index) {
        lpCurrentIndex = index;
        sessionStorage.setItem('lp_index', index);
        localStorage.setItem('lp_saved_history', index); 

        sessionStorage.removeItem('lp_time'); 
        renderLpPlaylist();
        updateLpTooltip();

        if (!lpDeck.classList.contains('is-playing')) {
            var currentAngle = 0;
            var style = window.getComputedStyle(lpVinyl);
            var matrix = new WebKitCSSMatrix(style.transform);
            if (matrix.a !== 1 || matrix.b !== 0) { 
                 currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
                 if (currentAngle < 0) currentAngle += 360;
            }

            lpVinyl.style.transition = 'none';
            lpVinyl.style.transform = 'rotate(' + currentAngle + 'deg)';
            lpVinyl.classList.remove('spinning');
            void lpVinyl.offsetWidth; 

            var duration = 3.0;
            var timeOffset = (currentAngle / 360) * duration;
            lpVinyl.style.animationDelay = '-' + timeOffset + 's';
        }
        
        lpIsRestoring = false;
        lpIsPcBackNav = false;

        if (lpPlayer && typeof lpPlayer.loadVideoById === 'function') {

            if (document.hidden) {
                lpPlayer.unMute();
                lpPlayer.setVolume(lpVolume);
            } else {
                lpPlayer.mute();
                lpPlayer.setVolume(0);
            }
            
            lpPlayer.loadVideoById(extractLpVideoId(lpPlaylist[lpCurrentIndex].url));
            lpPlayer.playVideo(); 
            
            lpIsPlaying = true; 
            sessionStorage.setItem('lp_playing', 'true');
            setLpState(true);
        } else {
            performEmergencyRebuild();
        }
        closeLpModal();
    }

    function onYouTubeIframeAPIReady() { createPlayerInstance();
    }

    function enableTouchToWake(targetPlayer) {
        var strongEvents = ['click', 'keydown', 'touchstart'];
        var wakeUp = function() {
            if(targetPlayer && typeof targetPlayer.playVideo === 'function') {
                targetPlayer.playVideo();
                targetPlayer.unMute();    
            }
            smoothAudioReveal(targetPlayer);
            strongEvents.forEach(function(evt) { document.removeEventListener(evt, wakeUp); });
        };
        strongEvents.forEach(function(evt) { document.addEventListener(evt, wakeUp, { once: true }); });
    }
// [최종 보완] 사용자 첫 터치/클릭 시 강제 페이드인 및 재생 보장
    (function() {
        var isWakeUpDone = false;

        function forceWakeUpAudio(e) {
            if (isWakeUpDone) return;
            
            if (lpPlayer && typeof lpPlayer.playVideo === 'function') {
                isWakeUpDone = true;
                
                // 1. 영상 재생 상태 확실히 보장
                var state = lpPlayer.getPlayerState ? lpPlayer.getPlayerState() : -1;
                if (state !== YT.PlayerState.PLAYING) {
                    lpPlayer.playVideo();
                }
                
                // 2. 음소거 해제 및 부드러운 볼륨 상향(Fade-in) 강제 실행
                lpPlayer.unMute();
                
                // 기존 페이드 함수가 있다면 활용하고, 안전하게 직접 볼륨을 서서히 올립니다.
                if (typeof smoothAudioReveal === 'function') {
                    smoothAudioReveal(lpPlayer);
                } else {
                    // 직접 페이드인 처리
                    var targetVol = typeof lpVolume !== 'undefined' ? lpVolume : 70;
                    var currentV = 0;
                    lpPlayer.setVolume(0);
                    
                    var fTimer = setInterval(function() {
                        currentV += 15;
                        if (currentV >= targetVol) {
                            currentV = targetVol;
                            clearInterval(fTimer);
                        }
                        lpPlayer.setVolume(currentV);
                    }, 30);
                }
                
                console.log("터치/클릭 감지: 오디오 부드러운 시작 강제 실행 완료");
            }
        }

        // 문서 전체의 클릭 및 터치 이벤트 감지 (단 한 번만 실행 후 자동 해제)
        ['click', 'touchstart', 'pointerdown'].forEach(function(eventType) {
            document.addEventListener(eventType, forceWakeUpAudio, { once: true, passive: true });
        });
    })();

function onLpPlayerReady(event) {
        event.target.mute();
        event.target.setVolume(lpVolume);

        var savedTime = parseFloat(sessionStorage.getItem('lp_time'));
        var savedRealTime = parseFloat(sessionStorage.getItem('lp_realtime'));
        var wasPlaying = sessionStorage.getItem('lp_playing');
        var now = Date.now();

        if (wasPlaying === 'true' && savedTime && savedRealTime) {
            var timePassed = (now - savedRealTime) / 1000;
            if (timePassed > 0 && timePassed < 3600) savedTime += (timePassed + SYNC_LATENCY);
        }
        
        if (savedTime) event.target.seekTo(savedTime);
        
        if (wasPlaying === 'true') {
            event.target.playVideo();
            if (lpIsPcBackNav) {
                enableTouchToWake(event.target);
                lpIsPcBackNav = false; 
            }
            lpDeck.classList.add('is-playing');
            setTimeout(function() { lpTonearm.style.transition = 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)'; }, 100);
        } else {
            event.target.pauseVideo();
        }

        if(checkInterval) clearInterval(checkInterval);
        checkInterval = setInterval(function(){
            if(lpPlayer && typeof lpPlayer.getCurrentTime === 'function' && lpIsPlaying) {
                var cTime = lpPlayer.getCurrentTime();
                var dTime = lpPlayer.getDuration();
                
                sessionStorage.setItem('lp_time', cTime);
                if (dTime > 0) sessionStorage.setItem('lp_total_duration', dTime);
                
                sessionStorage.setItem('lp_playing', 'true');
                sessionStorage.setItem('lp_realtime', Date.now());
            }
        }, 1000);
    }

    window.addEventListener('beforeunload', function() {
        lpIsNavigating = true; 
        var isReallyPlaying = lpIsPlaying || (sessionStorage.getItem('lp_playing') === 'true');
        if (isReallyPlaying) {
            var style = window.getComputedStyle(lpVinyl);
            var matrix = new WebKitCSSMatrix(style.transform);
            var angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
       
             if (angle < 0) angle += 360;
            var visualOffset = (angle / 360) * 3000;
            sessionStorage.setItem('lp_spin_base', Date.now() - visualOffset);
            sessionStorage.setItem('lp_angle', angle.toFixed(2));
            sessionStorage.setItem('lp_playing', 'true'); 
        } else {
            sessionStorage.removeItem('lp_angle');
      
             sessionStorage.setItem('lp_playing', 'false');
        }
        if (lpPlayer) { 
            try { lpPlayer.mute(); lpPlayer.setVolume(0); } catch(e){} 
        }
    });
    
    function onLpPlayerStateChange(event) {
        if (event.data == YT.PlayerState.ENDED) {
            var nextIndex = Math.floor(Math.random() * lpPlaylist.length);
            sessionStorage.setItem('lp_index', nextIndex);
            sessionStorage.setItem('lp_playing', 'true'); 
            sessionStorage.removeItem('lp_time'); 
            
            changeLpSong(nextIndex); 
            return;
        }

        if (lpIsNavigating) return;

        if (event.data == YT.PlayerState.PLAYING) {
            if (sessionStorage.getItem('lp_playing') === 'false') { 
                sessionStorage.setItem('lp_playing', 'true');
            }
            lpIsPlaying = true; 
            setLpState(true);
            lpPlayBtn.innerHTML = '<i class="lp-pause-icon"></i>'; 
            
            if (event.target.isMuted()) {
                if (document.hidden) {
                    smoothAudioReveal(event.target);
                } else {
                    setTimeout(function() { smoothAudioReveal(event.target); }, 150);
                }
            }
        } 
        else if (event.data == YT.PlayerState.PAUSED) {
            if (!lpIsNavigating) lpIsPlaying = false;
        }
    }

    function handlePlayClick() {
        lpIsRestoring = false;
        if (lpIsPlaying) {
            lpIsPlaying = false; 
            sessionStorage.setItem('lp_playing', 'false');
            setLpState(false);
            lpPlayBtn.innerHTML = "&#9654;";
            if(lpPlayer) {
                smoothAudioVanish(lpPlayer, function() { if(lpPlayer.pauseVideo) lpPlayer.pauseVideo(); });
            }
        } else {
            lpIsPlaying = true;
            sessionStorage.setItem('lp_playing', 'true');
            if (!sessionStorage.getItem('lp_spin_base')) {
                sessionStorage.setItem('lp_spin_base', Date.now());
            }
            setLpState(true);
            setTimeout(function() { 
                if (lpPlayer && typeof lpPlayer.playVideo === 'function') {
                    lpPlayer.mute(); lpPlayer.setVolume(0);
                    lpPlayer.playVideo();
                    setTimeout(function() { smoothAudioReveal(lpPlayer); }, 200);
          
                } else { performEmergencyRebuild(); }
            }, 300);
        }
    }

    function setLpState(playing) {
        if (playing) {
            lpDeck.classList.add('is-playing');
            if (lpLed) lpLed.classList.add('is-on');
            if (!lpIsRestoring) {
                if (!lpVinyl.classList.contains('spinning')) {
                    lpVinyl.style.transition = 'none';
                    lpVinyl.style.transform = ''; 
                    lpVinyl.style.animation = '';
                    var currentDelay = lpVinyl.style.animationDelay;
                    if (!currentDelay || currentDelay === '0s') {
                        lpVinyl.style.animationDelay = '0s';
                        void lpVinyl.offsetWidth;
                    }
                }
            } else {
                lpIsRestoring = false;
            }
            lpVinyl.classList.add('spinning');
            lpPlayBtn.innerHTML = '<i class="lp-pause-icon"></i>';
        } else {
            stopLpSmoothly();
            if (lpLed) lpLed.classList.remove('is-on');
            lpDeck.classList.remove('is-playing');
            lpPlayBtn.innerHTML = "&#9654;";
            if (lpTonearm) {
                lpTonearm.style.transform = '';
                setTimeout(() => { lpTonearm.style.transition = ''; }, 50); 
            }
        }
    }

    function stopLpSmoothly() {
        sessionStorage.removeItem('lp_spin_base');
        if (!lpVinyl) return;
        const style = window.getComputedStyle(lpVinyl);
        const matrix = new WebKitCSSMatrix(style.transform);
        let currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        if (currentAngle < 0) currentAngle += 360;

        lpVinyl.style.transition = 'none';
        lpVinyl.style.transform = `rotate(${currentAngle}deg)`;
        lpVinyl.classList.remove('spinning');
        lpVinyl.style.animation = 'none';
        lpVinyl.style.animationDelay = '0s';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                let remaining = 360 - currentAngle;
                let linearDuration = remaining / 120;
                let duration = linearDuration + 0.5;
                if (duration < 0.6) duration 
                = 0.6;
                lpVinyl.style.transition = `transform ${duration}s cubic-bezier(0, 0, 0.2, 1)`;
                lpVinyl.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    if (!lpVinyl.classList.contains('spinning')) {
                  
                        lpVinyl.style.transition = 'none';
                        lpVinyl.style.transform = 'rotate(0deg)';
                    }
                }, duration * 1000 + 50);
            });
        });
    }

    function closeLpModal() {
        if (lpModal.classList.contains('is-closing') || !lpModal.classList.contains('is-open')) return;
        lpModal.classList.add('is-closing');
        setTimeout(function() {
            lpModal.classList.remove('is-open');
            lpModal.classList.remove('is-closing');
        }, 250);
    }

    document.addEventListener("DOMContentLoaded", function() {
        lpPlayBtn.onclick = handlePlayClick;
        lpCloseBtn.onclick = function() { lpWidget.classList.add('lp-collapsed'); sessionStorage.setItem('lp_collapsed', 'true'); };
        lpExpandBtn.onclick = function() { lpWidget.classList.remove('lp-collapsed'); sessionStorage.setItem('lp_collapsed', 'false'); };
        
        var lpModalClose = document.getElementById('lp-modal-close');
        if(lpModalClose) { 
            lpModalClose.onclick = function(e) { e.stopPropagation(); closeLpModal(); }; 
      
        }
        var lpArea = document.querySelector('.lp-record-area');
        lpArea.onclick = function(e) {
            e.stopPropagation();
            if (lpModal.classList.contains('is-open')) closeLpModal(); else lpModal.classList.add('is-open');
        };
        document.addEventListener('click', function() { if (lpModal.classList.contains('is-open')) closeLpModal(); });
        lpModal.onclick = function(e) { e.stopPropagation();
        };
    });

    document.addEventListener('click', function(e) {
        var anchor = e.target.closest('a');
        if (!anchor) return;
        var href = anchor.getAttribute('href');
        var target = anchor.getAttribute('target');
        
        if (href && href.indexOf('#') !== 0 && href.indexOf('javascript') === -1 && target !== '_blank') {
             sessionStorage.setItem('lp_valid_nav', Date.now().toString());
        }

 
        if (lpIsPlaying && lpPlayer && href && href.indexOf('#') !== 0 && href.indexOf('javascript') === -1 && target !== '_blank') {
            e.preventDefault();
            var moveTimer = setTimeout(function() { window.location.href = href; }, 800); 
            smoothAudioVanish(lpPlayer, function() {
                clearTimeout(moveTimer);
           
             window.location.href = href;
            });
        }
    });

    document.addEventListener('click', function(e) {

        var shouldBePlaying = sessionStorage.getItem('lp_playing') === 'true';
        
        if (shouldBePlaying && lpPlayer && typeof lpPlayer.getPlayerState === 'function') {
            var state = lpPlayer.getPlayerState();

            if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
                lpPlayer.playVideo();
                setLpState(true); 
                console.log("클릭 감지: 음악 재생 복구");
            }
        }

        if (shouldBePlaying && !lpPlayer) {
            performEmergencyRebuild();
        }
    });
