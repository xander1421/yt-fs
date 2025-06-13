(function () {
    'use strict';

    const STORAGE_KEY = 'ytTabFS';
    const CSS_CLASS = 'yt-tabfs-enabled';
    const BUTTON_ID = 'yt-tabfs-button';
    var StateManager;
    (function (StateManager) {
        function load() {
            try {
                return sessionStorage.getItem(STORAGE_KEY) === '1';
            }
            catch {
                return false;
            }
        }
        StateManager.load = load;
        function save(isEnabled) {
            try {
                if (isEnabled) {
                    sessionStorage.setItem(STORAGE_KEY, '1');
                }
                else {
                    sessionStorage.removeItem(STORAGE_KEY);
                }
            }
            catch {
            }
        }
        StateManager.save = save;
        function getState() {
            return load();
        }
        StateManager.getState = getState;
        function setState(isEnabled) {
            save(isEnabled);
        }
        StateManager.setState = setState;
    })(StateManager || (StateManager = {}));
    var DOMOverlay;
    (function (DOMOverlay) {
        function enable() {
            console.log('[YT-TabFS] DOMOverlay.enable() called');
            const htmlElement = document.documentElement;
            if (!htmlElement.classList.contains(CSS_CLASS)) {
                htmlElement.classList.add(CSS_CLASS);
                console.log('[YT-TabFS] Added yt-tabfs-enabled class to html element');
            }
            else {
                console.log('[YT-TabFS] yt-tabfs-enabled class already present');
            }
        }
        DOMOverlay.enable = enable;
        function disable() {
            console.log('[YT-TabFS] DOMOverlay.disable() called');
            const htmlElement = document.documentElement;
            if (htmlElement.classList.contains(CSS_CLASS)) {
                htmlElement.classList.remove(CSS_CLASS);
                console.log('[YT-TabFS] Removed yt-tabfs-enabled class from html element');
            }
            else {
                console.log('[YT-TabFS] yt-tabfs-enabled class not present');
            }
        }
        DOMOverlay.disable = disable;
        function isEnabled() {
            return document.documentElement.classList.contains(CSS_CLASS);
        }
        DOMOverlay.isEnabled = isEnabled;
        function toggle() {
            const willBeEnabled = !isEnabled();
            if (willBeEnabled) {
                enable();
            }
            else {
                disable();
            }
            StateManager.setState(willBeEnabled);
            return willBeEnabled;
        }
        DOMOverlay.toggle = toggle;
    })(DOMOverlay || (DOMOverlay = {}));
    var ToggleButton;
    (function (ToggleButton) {
        let buttonElement = null;
        function create() {
            const button = document.createElement('button');
            button.id = BUTTON_ID;
            button.className = 'ytp-button yt-tabfs-button';
            button.innerHTML = 'TF';
            button.title = 'Toggle Tab-Fullscreen (Alt+T)';
            button.setAttribute('aria-label', 'Toggle Tab-Fullscreen');
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[YT-TabFS] Button clicked');
                const currentState = StateManager.getState();
                console.log('[YT-TabFS] Current state before toggle:', currentState);
                const newState = !currentState;
                StateManager.setState(newState);
                console.log('[YT-TabFS] New state after toggle:', newState);
                if (newState) {
                    console.log('[YT-TabFS] Enabling tab-fullscreen');
                    DOMOverlay.enable();
                }
                else {
                    console.log('[YT-TabFS] Disabling tab-fullscreen');
                    DOMOverlay.disable();
                }
                updateButtonState(button, newState);
            });
            const initialState = StateManager.getState();
            updateButtonState(button, initialState);
            buttonElement = button;
            return button;
        }
        ToggleButton.create = create;
        function updateButtonState(button, isEnabled) {
            console.log('[YT-TabFS] Updating button state to:', isEnabled);
            if (isEnabled) {
                button.classList.add('yt-tabfs-active');
            }
            else {
                button.classList.remove('yt-tabfs-active');
            }
        }
        function setActive(isActive) {
            if (buttonElement) {
                updateButtonState(buttonElement, isActive);
            }
        }
        ToggleButton.setActive = setActive;
        function getElement() {
            return buttonElement;
        }
        ToggleButton.getElement = getElement;
    })(ToggleButton || (ToggleButton = {}));
    var UIInjector;
    (function (UIInjector) {
        let injected = false;
        let lastInjectionTime = 0;
        const INJECTION_DEBOUNCE = 1000;
        function inject() {
            const now = Date.now();
            if (injected && (now - lastInjectionTime) < INJECTION_DEBOUNCE) {
                return true;
            }
            const controlsContainer = document.querySelector('.ytp-chrome-controls .ytp-left-controls');
            if (!controlsContainer) {
                console.log('[YT-TabFS] Looking for controls container: false');
                return false;
            }
            console.log('[YT-TabFS] Looking for controls container: true');
            if (document.getElementById(BUTTON_ID)) {
                injected = true;
                lastInjectionTime = now;
                return true;
            }
            const button = ToggleButton.create();
            controlsContainer.appendChild(button);
            console.log('[YT-TabFS] Button inserted into controls');
            const initialState = StateManager.getState();
            console.log('[YT-TabFS] Initial state from storage:', initialState);
            if (initialState) {
                console.log('[YT-TabFS] Applying initial tab-fullscreen state');
                DOMOverlay.enable();
            }
            injected = true;
            lastInjectionTime = now;
            return true;
        }
        UIInjector.inject = inject;
        function initOnce() {
            const pathname = window.location.pathname;
            console.log('[YT-TabFS] initOnce called, pathname:', pathname);
            if (pathname !== '/watch') {
                return;
            }
            const now = Date.now();
            if (injected && (now - lastInjectionTime) < INJECTION_DEBOUNCE) {
                console.log('[YT-TabFS] Already injected recently, skipping');
                return;
            }
            if (inject()) {
                console.log('[YT-TabFS] Successfully injected button');
            }
            else {
                console.log('[YT-TabFS] Failed to inject button');
            }
        }
        UIInjector.initOnce = initOnce;
        function reinjectIfMissing() {
            if (!document.getElementById(BUTTON_ID)) {
                injected = false;
                inject();
            }
        }
        UIInjector.reinjectIfMissing = reinjectIfMissing;
        function isInjected() {
            return injected;
        }
        UIInjector.isInjected = isInjected;
    })(UIInjector || (UIInjector = {}));
    var ObserverGuard;
    (function (ObserverGuard) {
        let observer = null;
        function start() {
            if (observer)
                return;
            observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        UIInjector.reinjectIfMissing();
                    }
                }
            });
            const ytdApp = document.querySelector('ytd-app');
            if (ytdApp) {
                observer.observe(ytdApp, { childList: true, subtree: false });
            }
        }
        ObserverGuard.start = start;
        function stop() {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        }
        ObserverGuard.stop = stop;
    })(ObserverGuard || (ObserverGuard = {}));
    var EventBridge;
    (function (EventBridge) {
        let nativeFullscreenWasActive = false;
        let tabFsStateBeforeNative = false;
        function initShortcuts() {
            if (typeof chrome !== 'undefined' && chrome.commands) {
                chrome.commands.onCommand.addListener((command) => {
                    if (command === 'toggle-tabfs') {
                        const isEnabled = DOMOverlay.toggle();
                        ToggleButton.setActive(isEnabled);
                    }
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key === 't' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
                    if (location.pathname === '/watch' &&
                        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                        e.preventDefault();
                        const isEnabled = DOMOverlay.toggle();
                        ToggleButton.setActive(isEnabled);
                    }
                }
            });
        }
        EventBridge.initShortcuts = initShortcuts;
        function initFullscreenWatcher() {
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        if (target === document.documentElement) {
                            handleYouTubeFullscreen();
                        }
                    }
                }
            });
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
        EventBridge.initFullscreenWatcher = initFullscreenWatcher;
        function handleFullscreenChange() {
            const isNativeFullscreen = !!document.fullscreenElement;
            if (isNativeFullscreen && !nativeFullscreenWasActive) {
                nativeFullscreenWasActive = true;
                tabFsStateBeforeNative = DOMOverlay.isEnabled();
                if (tabFsStateBeforeNative) {
                    DOMOverlay.disable();
                    ToggleButton.setActive(false);
                }
            }
            else if (!isNativeFullscreen && nativeFullscreenWasActive) {
                nativeFullscreenWasActive = false;
                if (tabFsStateBeforeNative) {
                    DOMOverlay.enable();
                    ToggleButton.setActive(true);
                }
            }
        }
        function handleYouTubeFullscreen() {
            const hasYtFullscreen = document.documentElement.classList.contains('ytp-fullscreen');
            if (hasYtFullscreen && !nativeFullscreenWasActive) {
                nativeFullscreenWasActive = true;
                tabFsStateBeforeNative = DOMOverlay.isEnabled();
                if (tabFsStateBeforeNative) {
                    DOMOverlay.disable();
                    ToggleButton.setActive(false);
                }
            }
            else if (!hasYtFullscreen && nativeFullscreenWasActive) {
                nativeFullscreenWasActive = false;
                if (tabFsStateBeforeNative) {
                    DOMOverlay.enable();
                    ToggleButton.setActive(true);
                }
            }
        }
    })(EventBridge || (EventBridge = {}));
    function initOnce() {
        const pathname = window.location.pathname;
        console.log('[YT-TabFS] initOnce called, pathname:', pathname);
        if (pathname !== '/watch') {
            return;
        }
        if (UIInjector.inject()) {
            console.log('[YT-TabFS] Successfully injected button');
        }
        else {
            console.log('[YT-TabFS] Failed to inject button');
        }
    }
    function init() {
        EventBridge.initShortcuts();
        EventBridge.initFullscreenWatcher();
        ObserverGuard.start();
        initOnce();
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(initOnce, 100);
            }
        }).observe(document, { subtree: true, childList: true });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }
    else {
        init();
    }

})();
//# sourceMappingURL=content.js.map
