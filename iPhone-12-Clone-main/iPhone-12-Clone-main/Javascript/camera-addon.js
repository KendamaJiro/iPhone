$(function () {
    "use strict";

    // 保存先フォルダー内に作成するサブフォルダー名
    const CAPTURE_FOLDER_NAME = "iPhoneCaptures";

    // 長押しを動画撮影として認識する時間
    const HOLD_TO_RECORD_MS = 400;

    // タッチ端末で写真撮影と判定するダブルタップ間隔
    const TOUCH_DOUBLE_TAP_MS = 300;

    let cameraStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let saveDirectoryHandle = null;
    let recordingTimer = null;
    let activePointerId = null;
    let recordingStarted = false;
    let lastTouchTapTime = 0;
    let facingMode = "environment";

    const cameraAppSelector = '.app[data-app="appCamara"]';

    // 元の script.js のカメラ起動イベントを解除し、このコードで置き換える
    $("body").off("click", cameraAppSelector);

    // app-config.js にカメラの遷移設定がある場合は、page を空にすること。
    // ここでも、生成済みのカメラアプリに遷移先があれば消す。
    $(cameraAppSelector).attr("data-page", "");

    // カメラ画面用CSSをこのファイルから追加
    if (!document.getElementById("cameraAddonStyles")) {
        $("<style>", {
            id: "cameraAddonStyles",
            text: `
                .cameraAddon {
                    position: absolute;
                    inset: 0;
                    z-index: 20;
                    display: flex;
                    flex-direction: column;
                    padding: 28px 12px 20px;
                    box-sizing: border-box;
                    color: #fff;
                    background: #000;
                }
                .cameraAddon[hidden] {
                    display: none;
                }
                .cameraAddon .cameraAddonTop,
                .cameraAddon .cameraAddonControls {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                .cameraAddon button {
                    border: 0;
                    border-radius: 8px;
                    padding: 9px 11px;
                    color: #fff;
                    background: #333;
                    font: inherit;
                    cursor: pointer;
                }
                .cameraAddon .cameraAddonPreview {
                    flex: 1;
                    width: 100%;
                    min-height: 0;
                    margin: 12px 0;
                    background: #111;
                    object-fit: cover;
                }
                .cameraAddon .cameraAddonControls {
                    justify-content: center;
                    min-height: 64px;
                }
                .cameraAddon .cameraShutter {
                    width: 56px;
                    height: 56px;
                    padding: 0;
                    border: 4px solid #fff;
                    border-radius: 50%;
                    background: #fff;
                    touch-action: none;
                    user-select: none;
                    -webkit-user-select: none;
                }
                .cameraAddon .cameraShutter.recording {
                    background: #e33;
                    transform: scale(.88);
                }
                .cameraAddon .cameraHint {
                    min-height: 16px;
                    color: #ddd;
                    font-size: 10px;
                    text-align: center;
                }
            `
        }).appendTo("head");
    }

    function getCameraScreen() {
        let $screen = $(".cameraAddon");

        if (!$screen.length) {
            $screen = $(`
                <div class="cameraAddon" hidden>
                    <div class="cameraAddonTop">
                        <button type="button" class="cameraChooseFolder">
                            保存先を選択
                        </button>
                        <button type="button" class="cameraClose">
                            閉じる
                        </button>
                    </div>

                    <video class="cameraAddonPreview"
                           autoplay
                           playsinline
                           muted></video>

                    <div class="cameraHint">
                        写真: ダブルクリック / ダブルタップ ・ 動画: シャッターを長押し
                    </div>

                    <div class="cameraAddonControls">
                        <button type="button"
                                class="cameraShutter"
                                aria-label="ダブルクリックまたはダブルタップで写真撮影、長押しで動画撮影">
                        </button>
                    </div>
                </div>
            `);

            $(".mainScreen").append($screen);
        }

        return $screen;
    }

    async function startCamera() {
        const video = getCameraScreen().find(".cameraAddonPreview")[0];

        if (!navigator.mediaDevices?.getUserMedia) {
            alert("カメラを使うにはHTTPSまたはlocalhostでこのページを開いてください。");
            return;
        }

        stopCameraStream();

        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { facingMode: { ideal: facingMode } }
            });

            video.srcObject = cameraStream;
            await video.play();
        } catch (error) {
            console.error("カメラを起動できませんでした:", error);
            alert("カメラを起動できません。ブラウザーのカメラ・マイク権限を確認してください。");
        }
    }

    function stopCameraStream() {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            cameraStream = null;
        }

        const video = document.querySelector(".cameraAddonPreview");
        if (video) video.srcObject = null;
    }

    function openCamera() {
        const $screen = getCameraScreen();

        $screen.prop("hidden", false);
        $(".statusBar").addClass("onlyLed camActiv");

        startCamera();
    }

    function closeCamera() {
        clearTimeout(recordingTimer);
        recordingTimer = null;
        activePointerId = null;

        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }

        recordingStarted = false;
        $(".cameraShutter").removeClass("recording");
        stopCameraStream();

        $(".cameraAddon").prop("hidden", true);
        $(".statusBar").removeClass("onlyLed camActiv");
    }

    function createFilename(extension) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        return `iphone-capture-${timestamp}.${extension}`;
    }

    async function saveCapture(blob, filename) {
        if (saveDirectoryHandle) {
            try {
                const permission = await saveDirectoryHandle.requestPermission({
                    mode: "readwrite"
                });

                if (permission === "granted") {
                    const folder = await saveDirectoryHandle.getDirectoryHandle(
                        CAPTURE_FOLDER_NAME,
                        { create: true }
                    );

                    const fileHandle = await folder.getFileHandle(filename, {
                        create: true
                    });

                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return;
                }
            } catch (error) {
                console.error("選択したフォルダーへの保存に失敗しました:", error);
                alert("フォルダーへの保存に失敗したため、通常のダウンロードに切り替えます。");
            }
        }

        // フォルダー指定が未対応の場合はブラウザーのダウンロード先へ保存
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function chooseSaveFolder() {
        if (!window.showDirectoryPicker) {
            alert("このブラウザーは保存先フォルダーの選択に対応していません。通常のダウンロード先に保存します。");
            return;
        }

        try {
            // 選択した場所の中に iPhoneCaptures フォルダーを作成して保存
            saveDirectoryHandle = await window.showDirectoryPicker({
                mode: "readwrite"
            });

            $(".cameraChooseFolder").text("保存先選択済み");
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("保存先を選択できませんでした:", error);
                alert("保存先フォルダーを選択できませんでした。");
            }
        }
    }

    async function takePhoto() {
        const video = document.querySelector(".cameraAddonPreview");

        if (!video?.videoWidth || !video?.videoHeight) {
            alert("カメラ映像の準備ができていません。");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                alert("写真を作成できませんでした。");
                return;
            }

            await saveCapture(blob, createFilename("jpg"));
        }, "image/jpeg", 0.92);
    }

    function getSupportedVideoType() {
        if (!window.MediaRecorder) return "";

        const types = [
            "video/mp4",
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm"
        ];

        return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
    }

    function startRecording() {
        if (!cameraStream) {
            alert("カメラが起動していません。");
            return false;
        }

        if (!window.MediaRecorder) {
            alert("このブラウザーは動画録画に対応していません。");
            return false;
        }

        recordedChunks = [];

        try {
            const mimeType = getSupportedVideoType();
            mediaRecorder = new MediaRecorder(
                cameraStream,
                mimeType ? { mimeType } : undefined
            );

            mediaRecorder.addEventListener("dataavailable", (event) => {
                if (event.data?.size) recordedChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", async () => {
                if (!recordedChunks.length) return;

                const type = mediaRecorder.mimeType || "video/webm";
                const extension = type.includes("mp4") ? "mp4" : "webm";
                const blob = new Blob(recordedChunks, { type });

                await saveCapture(blob, createFilename(extension));
                recordedChunks = [];
            }, { once: true });

            mediaRecorder.start();
            recordingStarted = true;
            $(".cameraShutter").addClass("recording");
            return true;
        } catch (error) {
            console.error("録画を開始できませんでした:", error);
            alert("動画録画を開始できませんでした。");
            return false;
        }
    }

    function stopRecording() {
        clearTimeout(recordingTimer);
        recordingTimer = null;
        activePointerId = null;

        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }

        recordingStarted = false;
        $(".cameraShutter").removeClass("recording");
    }

    function switchCamera() {
        facingMode = facingMode === "environment" ? "user" : "environment";
        startCamera();
    }

    // カメラアプリを押すと、この追加カメラ画面を開く
    $("body").on("click.cameraAddon", cameraAppSelector, function (event) {
        event.preventDefault();
        event.stopPropagation();
        openCamera();
    });

    $("body").on("click.cameraAddon", ".cameraChooseFolder", chooseSaveFolder);
    $("body").on("click.cameraAddon", ".cameraClose", closeCamera);
    $("body").on("click.cameraAddon", ".cameraAddon .toggleCam", switchCamera);

    // PC: シャッターをダブルクリックして写真を撮る
    $("body").on("dblclick.cameraAddon", ".cameraShutter", function (event) {
        event.preventDefault();

        // タッチ操作後に発生する合成ダブルクリックは無視
        if (Date.now() - lastTouchTapTime < 700) return;

        takePhoto();
    });

    // マウス・タッチ: シャッター長押しで録画開始
    $("body").on("pointerdown.cameraAddon", ".cameraShutter", function (event) {
        const original = event.originalEvent || event;

        if (original.pointerType === "mouse" && original.button !== 0) return;

        activePointerId = original.pointerId;
        recordingStarted = false;

        clearTimeout(recordingTimer);
        recordingTimer = setTimeout(() => {
            if (activePointerId === original.pointerId) {
                startRecording();
            }
        }, HOLD_TO_RECORD_MS);
    });

    // 長押しを離したら録画停止。タッチはダブルタップで写真撮影
    $(document).on("pointerup.cameraAddon", function (event) {
        const original = event.originalEvent || event;

        if (activePointerId === null || original.pointerId !== activePointerId) {
            return;
        }

        const wasRecording = recordingStarted;
        const wasTouch = original.pointerType === "touch";

        clearTimeout(recordingTimer);
        recordingTimer = null;

        if (wasRecording) {
            stopRecording();
            return;
        }

        activePointerId = null;

        if (wasTouch) {
            const now = Date.now();

            if (now - lastTouchTapTime <= TOUCH_DOUBLE_TAP_MS) {
                lastTouchTapTime = 0;
                takePhoto();
            } else {
                lastTouchTapTime = now;
            }
        }
    });

    $(document).on("pointercancel.cameraAddon", function (event) {
        const original = event.originalEvent || event;

        if (activePointerId === original.pointerId) {
            stopRecording();
        }
    });
});