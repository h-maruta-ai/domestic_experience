// ==UserScript==
// @name         国内旅行B
// @namespace    http://your-domain.com/
// @version      0.8
// @description  実験用
// @author       h-maruta
// @match        https://www.asahi.com/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    const STORAGE_KEY = 'tampermonkey_ad_shown_at';
    const DELAY_MS = 60000;

    // 既存広告を非表示にするCSS（自分の広告は除外）
    function hideExistingAds() {
        const style = document.createElement('style');
        style.id = 'tampermonkey-ad-blocker';
        style.textContent = `
            /* 一般的な広告セレクタ（自分の広告IDは除外） */
            [id*="ad-"]:not(#tampermonkey-ad-banner),
            [class*="ad-"]:not(#tampermonkey-ad-banner):not(#tampermonkey-ad-banner *),
            [id*="advertisement"]:not(#tampermonkey-ad-banner),
            [class*="advertisement"]:not(#tampermonkey-ad-banner):not(#tampermonkey-ad-banner *),
            [id*="banner"]:not(#tampermonkey-ad-banner),
            [class*="banner"]:not(#tampermonkey-ad-banner):not(#tampermonkey-ad-banner *),
            iframe[src*="ads"],
            iframe[src*="doubleclick"],
            iframe[src*="googlesyndication"],
            .adsbygoogle,
            ins.adsbygoogle,
            
            /* 朝日新聞特有の広告 */
            .ad-container:not(#tampermonkey-ad-banner),
            .ad-wrapper:not(#tampermonkey-ad-banner),
            #ad-area,
            .advertisement-area {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                pointer-events: none !important;
            }
            
            /* 自分の広告は確実に表示 */
            #tampermonkey-ad-banner,
            #tampermonkey-ad-banner * {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
        console.log('既存広告を非表示にしました');
    }

    // 動的に追加される広告も監視して非表示（自分の広告は除外）
    function observeAndHideAds() {
        const adObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.id !== 'tampermonkey-ad-banner') {
                        // 広告っぽい要素をチェック
                        if (node.id && (node.id.includes('ad') || node.id.includes('advertisement'))) {
                            node.style.display = 'none';
                        }
                        if (node.className && typeof node.className === 'string' && 
                            (node.className.includes('ad') || node.className.includes('advertisement'))) {
                            node.style.display = 'none';
                        }
                        // iframe広告
                        if (node.tagName === 'IFRAME' && node.src && 
                            (node.src.includes('ads') || node.src.includes('doubleclick') || 
                             node.src.includes('googlesyndication'))) {
                            node.style.display = 'none';
                        }
                    }
                });
            });
        });
        
        adObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function showAd() {
        if (document.getElementById('tampermonkey-ad-banner')) return;
        const adContainer = document.createElement('div');
        adContainer.id = 'tampermonkey-ad-banner';
        adContainer.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 120px;
            background: #ffffff;
            border-top: 1px solid #ccc;
            z-index: 999999;
            display: flex !important;
            justify-content: center;
            align-items: center;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
            visibility: visible !important;
            opacity: 1 !important;
        `;
        const img = document.createElement('img');
        img.src = 'https://raw.githubusercontent.com/h-maruta-ai/domestic_experience/201bde881fe5ade4feb7a936aeb59791e10deae4/domesticex.png';
        img.alt = '広告バナー';
        img.style.cssText = `
            max-width: 700px;
            max-height: 100px;
            object-fit: contain;
            cursor: pointer;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        img.addEventListener('click', () => {
            window.open('https://www.jalan.net/', '_blank');
        });
        adContainer.appendChild(img);
        document.body.appendChild(adContainer);
        console.log('Tampermonkeyバナーを表示しました');
    }

    function init() {
        // 既存広告を即座に非表示
        hideExistingAds();
        observeAndHideAds();
        
        const shownAt = sessionStorage.getItem(STORAGE_KEY);
        const now = Date.now();
        if (shownAt) {
            const elapsed = now - parseInt(shownAt, 10);
            if (elapsed >= DELAY_MS) {
                showAd();
            } else {
                setTimeout(showAd, DELAY_MS - elapsed);
            }
        } else {
            sessionStorage.setItem(STORAGE_KEY, now.toString());
            setTimeout(() => {
                showAd();
                sessionStorage.setItem(STORAGE_KEY, (Date.now() - DELAY_MS).toString());
            }, DELAY_MS);
        }
    }

    // DOMが読み込まれる前から広告をブロック
    if (document.head) {
        hideExistingAds();
    } else {
        const headObserver = new MutationObserver(() => {
            if (document.head) {
                hideExistingAds();
                headObserver.disconnect();
            }
        });
        headObserver.observe(document.documentElement, { childList: true });
    }

    window.addEventListener('load', init);

    let currentUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            console.log('ページ遷移を検知:', currentUrl);
            
            const existingAd = document.getElementById('tampermonkey-ad-banner');
            if (existingAd) {
                existingAd.remove();
            }
            
            const shownAt = sessionStorage.getItem(STORAGE_KEY);
            if (shownAt && (Date.now() - parseInt(shownAt, 10)) >= DELAY_MS) {
                setTimeout(showAd, 500);
            }
        }
    });
    observer.observe(document, { subtree: true, childList: true });
})();
