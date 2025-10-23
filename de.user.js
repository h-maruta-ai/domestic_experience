// ==UserScript==
// @name         国内旅行B
// @namespace    http://your-domain.com/
// @version      0.6
// @description  実験用
// @author       h-maruta
// @match        https://www.asahi.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'tampermonkey_ad_shown_at';
    const DELAY_MS = 60000;

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
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
        `;

        const img = document.createElement('img');
        img.src = 'https://raw.githubusercontent.com/h-maruta-ai/domestic_experience/f77644c86a4e601055ab28b02673a01e23f358e6/domesticex.png';
        img.alt = '広告バナー';
        img.style.cssText = `
            max-width: 700px;
            max-height: 100px;
            object-fit: contain;
            cursor: pointer;
        `;

        img.addEventListener('click', () => {
            window.open('https://www.jalan.net/', '_blank');
        });

        adContainer.appendChild(img);
        document.body.appendChild(adContainer);

        console.log('Tampermonkeyバナーを表示しました');
    }

    function init() {
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
