
// ==UserScript==
// @name         蜜柑计划-调试探针 (v4-debug)
// @namespace    http://tampermonkey.net/
// @version      4.0-debug
// @description  用于测试脚本是否能在蜜柑页面成功运行并操作DOM。
// @author       Gemini-Debug
// @match        https://mikanime.tv/*
// @match        https://mikanani.me/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('[GEMINI-DEBUG] 蜜柑调试探针脚本开始运行...');

    function runProbe() {
        console.log('[GEMINI-DEBUG] 正在执行探测...');
        // 使用一个非常通用的选择器来捕获所有可能的番剧卡片
        const animeCards = document.querySelectorAll('.an-bangumi-card-container, .sk-bangumi, .card, .bangumi-poster');

        if (animeCards.length > 0) {
            console.log(`[GEMINI-DEBUG] 成功找到 ${animeCards.length} 个动漫卡片。正在尝试修改背景颜色。`);
            animeCards.forEach((card, index) => {
                // 找到卡片内部的链接，确保它是一个有效的番剧卡片
                if (card.querySelector('a[href^="/Home/Bangumi/"]')) {
                    card.style.backgroundColor = '#FFC0CB'; // 设置为亮粉色
                    console.log(`[GEMINI-DEBUG] 已为卡片 ${index + 1} 设置背景色。`);
                }
            });
        } else {
            console.log('[GEMINI-DEBUG] 未找到任何动漫卡片。');
        }
    }

    // 确保在DOM加载完成后再执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runProbe);
    } else {
        runProbe();
    }

    // 同时，设置一个延时再次运行，以应对页面使用JS动态加载内容的情况
    setTimeout(() => {
        console.log('[GEMINI-DEBUG] 延时探测（2秒后）执行...');
        runProbe();
    }, 2000);

})();
