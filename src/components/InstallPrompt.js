import React, { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaShareSquare } from 'react-icons/fa';
import './InstallPrompt.css';

const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

const DISMISS_KEY = 'bgmi_install_dismissed';
const DISMISS_DAYS = 7;

const wasDismissedRecently = () => {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        if (isStandalone() || wasDismissedRecently()) return;

        if (isIOS()) {
            const t = setTimeout(() => setShowIOSGuide(true), 2500);
            return () => clearTimeout(t);
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShowBanner(true), 2500);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setShowBanner(false);
        if (outcome === 'accepted') {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
        }
    };

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setShowBanner(false);
        setShowIOSGuide(false);
    };

    if (!showBanner && !showIOSGuide) return null;

    return (
        <>
            {/* Android / Chrome — bottom banner */}
            {showBanner && (
                <div className="install-banner">
                    <div className="install-banner__icon">
                        <FaDownload />
                    </div>
                    <div className="install-banner__text">
                        <p className="install-banner__title">Install BGMI Tourney</p>
                        <p className="install-banner__sub">Fast access · Works offline</p>
                    </div>
                    <button className="install-banner__btn" onClick={handleInstall}>
                        Install
                    </button>
                    <button className="install-banner__close" onClick={dismiss} aria-label="Dismiss">
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* iOS Safari — modal guide */}
            {showIOSGuide && (
                <div className="install-ios-overlay" onClick={dismiss}>
                    <div className="install-ios-box" onClick={(e) => e.stopPropagation()}>
                        <button className="install-ios-close" onClick={dismiss}>
                            <FaTimes />
                        </button>
                        <div className="install-ios-icon-wrap">
                            <img src="/logo192.png" alt="BGMI Tourney" className="install-ios-icon" />
                        </div>
                        <p className="install-ios-title">Install BGMI Tourney</p>
                        <p className="install-ios-sub">Add to your home screen for the best experience</p>
                        <ol className="install-ios-steps">
                            <li>
                                Tap <FaShareSquare className="install-ios-share-icon" /> <strong>Share</strong> in Safari's toolbar
                            </li>
                            <li>
                                Scroll and tap <strong>"Add to Home Screen"</strong>
                            </li>
                            <li>
                                Tap <strong>"Add"</strong> to install
                            </li>
                        </ol>
                        <div className="install-ios-arrow-wrap">
                            <span className="install-ios-arrow">▼</span>
                            <span className="install-ios-arrow-label">Tap Share below</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
