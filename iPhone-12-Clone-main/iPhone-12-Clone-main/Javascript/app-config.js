$(function () {
    /*
     * アプリごとの設定
     *
     * name: ホーム画面に表示するアプリ名
     * icon: アイコン画像のパスまたはURL
     * page: 開くHTMLファイルの相対パス、またはWebサイトのURL
     *
     * 相対パスは index.html からのパスです。
     */
    const appSettings = {
        appClima: {
            name: "GitHub",
            icon: "./icons/github.png",
            page: "https://github.com/akuseru1"
        },
        appFaceTime: {
            name: "タイピンガーZ",
            icon: "./icons/Typinger_Z.png",
            page: "https://typingerz.com/"
        },
        appCalendario: {
            name: "カレンダー",
            icon: "./icons/calendar.png",
            page: "./apps/calendar.html"
        },
        appReloj: {
            name: "時計",
            icon: "./icons/clock.png",
            page: "./apps/clock.html"
        },
        appFotos: {
            name: "写真",
            icon: "./icons/photos.png",
            page: "./apps/photos.html"
        },
        appMapas: {
            name: "マップ",
            icon: "./icons/maps.png",
            page: "./apps/maps.html"
        },

        appRecordatorios: {
            name: "リマインダー",
            icon: "./icons/reminders.png",
            page: "./apps/reminders.html"
        },
        appFacebook: {
            name: "Facebook",
            icon: "./icons/facebook.png",
            page: "./apps/facebook.html"
        },
        appNotas: {
            name: "メモ",
            icon: "./icons/notes.png",
            page: "./apps/notes.html"
        },
        "appApp Store": {
            name: "App Store",
            icon: "./icons/app-store.png",
            page: "./apps/app-store.html"
        },
        appSalud: {
            name: "ヘルスケア",
            icon: "./icons/health.png",
            page: "./apps/health.html"
        },
        appMensajes: {
            name: "メッセージ",
            icon: "./icons/messages.png",
            page: "./apps/messages.html"
        },
        appConfiguracion: {
            name: "設定",
            icon: "./icons/settings.png",
            page: "./apps/settings.html"
        },
        appBBVA: {
            name: "BBVA",
            icon: "./icons/bbva.png",
            page: "./apps/bbva.html"
        },
        appWhatsApp: {
            name: "WhatsApp",
            icon: "./icons/whatsapp.png",
            page: "./apps/whatsapp.html"
        },
        appCalculadora: {
            name: "計算機",
            icon: "./icons/calculator.png",
            page: "./apps/calculator.html"
        },
        appTwitter: {
            name: "Twitter",
            icon: "./icons/twitter.png",
            page: "./apps/twitter.html"
        },
        appMessenger: {
            name: "Messenger",
            icon: "./icons/messenger.png",
            page: "./apps/messenger.html"
        },
        appBrujula: {
            name: "コンパス",
            icon: "./icons/compass.png",
            page: "./apps/compass.html"
        },
        appSpotify: {
            name: "Spotify",
            icon: "./icons/spotify.png",
            page: "./apps/spotify.html"
        },
        appPinterest: {
            name: "Pinterest",
            icon: "./icons/pinterest.png",
            page: "./apps/pinterest.html"
        },
        "appGoogle Home": {
            name: "Google Home",
            icon: "./icons/google-home.png",
            page: "./apps/google-home.html"
        },
        appLiverpool: {
            name: "Liverpool",
            icon: "./icons/liverpool.png",
            page: "./apps/liverpool.html"
        },
        appMusica: {
            name: "音楽",
            icon: "./icons/music.png",
            page: "./apps/music.html"
        },
        appNetflix: {
            name: "Netflix",
            icon: "./icons/netflix.png",
            page: "./apps/netflix.html"
        },
        "appNotas de voz": {
            name: "ボイスメモ",
            icon: "./icons/voice-memos.png",
            page: "./apps/voice-memos.html"
        },
        appWallet: {
            name: "Wallet",
            icon: "./icons/wallet.png",
            page: "./apps/wallet.html"
        },
        appPodcasts: {
            name: "Podcast",
            icon: "./icons/podcasts.png",
            page: "./apps/podcasts.html"
        },
        appArchivos: {
            name: "ファイル",
            icon: "./icons/files.png",
            page: "./apps/files.html"
        },
        appContactos: {
            name: "連絡先",
            icon: "./icons/contacts.png",
            page: "./apps/contacts.html"
        },
        appYouTube: {
            name: "YouTube",
            icon: "./icons/youtube.png",
            page: "https://www.youtube.com/"
        },
        "appBuscar iPhone": {
            name: "iPhoneを探す",
            icon: "./icons/find-iphone.png",
            page: "./apps/find-iphone.html"
        }
    };

    const appSelector = ".appScreen .wrapperApps .app[data-app]";
    const touchStarts = new Map();
    let lastTouchOpenTime = 0;

    function isEditingHomeScreen() {
        return (
            $(".mainScreen").hasClass("shakingApps") ||
            $(".mainScreen").hasClass("filterBlur")
        );
    }


    function openAppInNewTab($app, event) {
        // カメラは元のカメラ画面を起動
        if ($app.attr("data-app") === "appCamara") {
            return;
        }

        // 編集中、削除ボタンの操作中は遷移しない
        if (
            isEditingHomeScreen() ||
            $(event.target).closest(".removeApp").length
        ) {
            return;
        }

        const page = $app.attr("data-page");
        if (!page) return;

        event.preventDefault();
        event.stopPropagation();
        window.open(page, "_blank", "noopener,noreferrer");
    }

    function applyAppSettings() {
        $(appSelector).each(function () {
            const $app = $(this);
            const setting = appSettings[$app.attr("data-app")];

            if (!setting) {
                return;
            }

            // 表示名を設定
            const $name = $app.find(".nombre");
            if ($name.text() !== setting.name) {
                $name.text(setting.name);
            }

            // アイコン画像を枠内に自動調整して表示
            const $icon = $app.find(".icono");

            if (setting.icon) {
                // 動的アイコンの中身を通常の画像に置き換える
                if ($icon.children().length > 0) {
                    $icon.empty();
                }

                $icon.css({
                    width: "50px",
                    height: "50px",
                    backgroundImage: `url("${setting.icon}")`,
                    backgroundColor: "#fff",
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                });
            }

            // アプリごとの移動先を設定
            $app.attr("data-page", setting.page || "");
        });
    }


    // 初期表示に設定を適用
    applyAppSettings();

    // アプリが再描画された場合にも設定を再適用
    const appsContainer = document.querySelector(".wrapperApps");

    if (appsContainer) {
        const observer = new MutationObserver(function () {
            applyAppSettings();
        });

        observer.observe(appsContainer, {
            childList: true,
            subtree: true
        });
    }

    // PC: マウスのダブルクリックで開く
    $(document).on("dblclick", appSelector, function (event) {
        if (Date.now() - lastTouchOpenTime < 800) {
            return;
        }

        openAppInNewTab($(this), event);
    });

    // タッチ: 押した位置を記録
    $(document).on("pointerdown", appSelector, function (event) {
        const originalEvent = event.originalEvent;

        if (!originalEvent || originalEvent.pointerType !== "touch") {
            return;
        }

        touchStarts.set(originalEvent.pointerId, {
            app: this,
            x: originalEvent.clientX,
            y: originalEvent.clientY
        });
    });

    // タッチ: タップで開く。スワイプ操作は起動しない
    $(document).on("pointerup", function (event) {
        const originalEvent = event.originalEvent;

        if (!originalEvent || originalEvent.pointerType !== "touch") {
            return;
        }

        const start = touchStarts.get(originalEvent.pointerId);
        touchStarts.delete(originalEvent.pointerId);

        if (!start) {
            return;
        }

        const movedX = Math.abs(originalEvent.clientX - start.x);
        const movedY = Math.abs(originalEvent.clientY - start.y);

        // 指が動いた場合はタップではなくスワイプとして扱う
        if (movedX > 12 || movedY > 12) {
            return;
        }

        const $releasedApp = $(event.target).closest(appSelector);

        // 押したアプリと離したアプリが同じ場合だけ起動
        if (!$releasedApp.length || $releasedApp[0] !== start.app) {
            return;
        }

        lastTouchOpenTime = Date.now();
        openAppInNewTab($releasedApp, event);
    });

    // タッチがキャンセルされた場合は記録を破棄
    $(document).on("pointercancel", function (event) {
        const originalEvent = event.originalEvent;

        if (originalEvent) {
            touchStarts.delete(originalEvent.pointerId);
        }
    });
});
// app-config.js の最後に追加
const hardwareRoutes = {
    ".botones .switch": "./apps/settings.html",
    ".botones .vol.up": "./apps/music.html",
    ".botones .vol.down": "./apps/photos.html",
    ".botones .touchID": "./apps/find-iphone.html"
};

Object.entries(hardwareRoutes).forEach(([selector, page]) => {
    $(document).on("click", selector, function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = page;
    });
});