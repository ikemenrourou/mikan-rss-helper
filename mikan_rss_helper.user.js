// ==UserScript==
// @name         蜜柑计划RSS订阅助手 (v6.7)
// @namespace    http://tampermonkey.net/
// @version      6.7
// @description  [v6.7 最终兼容与调试版] 在蜜柑计划网站上通过勾选番剧，一键生成用于M-Team、qBittorrent等下载器的RSS订阅规则JSON文件。支持为每个作品单独设置字幕组，并能自动识别季度创建文件夹，并新增删除和清空功能。
// @author       Gemini
// @match        https://mikanime.tv/*
// @match        https://mikanani.me/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    console.log('[GEMINI-SCRIPT-V6.7] Script execution started.');

    // --- 预设字幕组 ---
    const PREFERRED_SUBGROUPS = {
        'ANi': '583',
        '北宇治字幕组': '611',
        'KiraraPost': '615',
        'LoliHouse': '370',
        '喵萌奶茶屋': '382'
    };

    // --- 样式 ---
    GM_addStyle(`
        .gm-panel-v6 { position: fixed; bottom: 20px; right: 20px; width: 380px; max-height: 90vh; background-color: #f0f8ff; border: 1px solid #b0c4de; border-radius: 8px; z-index: 9999; display: flex; flex-direction: column; font-size: 14px; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.3s ease-in-out; }
        .gm-panel-v6.collapsed { transform: translateX(calc(100% - 50px)); }
        .gm-panel-v6-header { padding: 10px 15px; background-color: #4682b4; color: white; font-weight: bold; border-top-left-radius: 8px; border-top-right-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .gm-panel-v6-header .toggle-btn { font-size: 20px; transform: rotate(0deg); transition: transform 0.3s; }
        .gm-panel-v6.collapsed .toggle-btn { transform: rotate(180deg); }
        .gm-panel-v6-content { padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .gm-panel-v6 .gm-section { display: flex; flex-direction: column; gap: 10px; }
        .gm-panel-v6 .gm-section-title { font-weight: bold; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .gm-panel-v6 input[type="text"] { padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
        .gm-panel-v6 .gm-subgroup-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .gm-panel-v6 .gm-subgroup-options label { display: flex; align-items: center; gap: 5px; cursor: pointer; }
        .gm-panel-v6 .gm-selected-list { list-style: none; padding: 0; margin: 0; max-height: 250px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; background: #fff; }
        .gm-panel-v6 .gm-selected-list li { padding: 5px 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .gm-panel-v6 .gm-selected-list li:last-child { border-bottom: none; }
        .gm-panel-v6 .gm-anime-item-header { display: flex; justify-content: space-between; align-items: center; flex-grow: 1; }
        .gm-panel-v6 .gm-anime-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; }
        .gm-panel-v6 .gm-anime-settings-btn { cursor: pointer; font-size: 16px; padding: 2px 5px; margin-left: 5px; }
        .gm-panel-v6 .gm-anime-delete-btn { cursor: pointer; font-size: 16px; padding: 2px 5px; color: #dc3545; margin-left: 5px; }
        .gm-panel-v6 .gm-per-anime-subs { display: none; background: #e6f2ff; padding: 8px; margin-top: 5px; border-radius: 4px; grid-template-columns: repeat(2, 1fr); gap: 5px; }
        .gm-panel-v6 .gm-button { padding: 10px 15px; background-color: #5cb85c; color: white; border: none; border-radius: 5px; cursor: pointer; text-align: center; font-weight: bold; transition: background-color 0.2s; }
        .gm-panel-v6 .gm-button:hover { background-color: #4cae4c; }
        .gm-panel-v6 .gm-button:disabled { background-color: #aaa; cursor: not-allowed; }
        .gm-panel-v6 .gm-clear-all-btn { background-color: #6c757d; margin-top: 10px; }
        .gm-panel-v6 .gm-clear-all-btn:hover { background-color: #5a6268; }
        .gm-checkbox-container-v6 { position: absolute; top: 2px; left: 2px; z-index: 1000; background: rgba(0,0,0,0.6); border-radius: 4px; padding: 2px; }
        .gm-checkbox-container-v6 input { width: 18px; height: 18px; cursor: pointer; }
    `);

    // --- 状态管理 ---
    const state = {
        selectedAnimes: new Map(JSON.parse(GM_getValue('selectedAnimes', '[]'))),
        savePathRoot: GM_getValue('savePathRoot', 'P:\\2025新番'),
        releaseDate: GM_getValue('releaseDate', ''), // New: Custom release date
        defaultSubgroups: new Set(GM_getValue('defaultSubgroups', ['583']))
    };

    function persistState() {
        const serializedAnimes = Array.from(state.selectedAnimes.entries()).map(([id, data]) => {
            return [id, { id: data.id, title: data.title, subgroups: Array.from(data.subgroups) }];
        });
        GM_setValue('selectedAnimes', JSON.stringify(serializedAnimes));
        GM_setValue('savePathRoot', state.savePathRoot);
        GM_setValue('releaseDate', state.releaseDate); // New: Persist release date
        GM_setValue('defaultSubgroups', Array.from(state.defaultSubgroups));
    }

    // --- UI ---
    function createPanel() {
        const panel = document.createElement('div');
        panel.className = 'gm-panel-v6';
        const subgroupOptionsHTML = Object.entries(PREFERRED_SUBGROUPS).map(([name, id]) =>
            `<label title="${name}"><input type="checkbox" class="gm-default-sub-checkbox" value="${id}" ${state.defaultSubgroups.has(id) ? 'checked' : ''}><span>${name}</span></label>`
        ).join('');

        panel.innerHTML = `
            <div class="gm-panel-v6-header"><span>RSS订阅助手 v6.7</span><span class="toggle-btn">◀</span></div>
            <div class="gm-panel-v6-content">
                <div class="gm-section"><label for="gm-save-path" class="gm-section-title">根目录路径</label><input type="text" id="gm-save-path" placeholder="例如: P:\新番下载"></div>
                <div class="gm-section"><label for="gm-release-date" class="gm-section-title">发布日期 (可选)</label><input type="text" id="gm-release-date" placeholder="例如: 2025年7月新番"></div>
                <div class="gm-section"><label class="gm-section-title">默认字幕组</label><div class="gm-subgroup-options">${subgroupOptionsHTML}</div></div>
                <div class="gm-section"><label class="gm-section-title">已选作品 (<span id="gm-selected-count">0</span>)</label><ul class="gm-selected-list" id="gm-selected-list"><li>尚未选择任何作品</li></ul></div>
                <div class="gm-section">
                    <button id="gm-generate-btn" class="gm-button" disabled>生成订阅JSON</button>
                    <button id="gm-clear-all-btn" class="gm-button gm-clear-all-btn" disabled>清空已选</button>
                </div>
            </div>`;
        document.body.appendChild(panel);

        const savePathInput = panel.querySelector('#gm-save-path');
        savePathInput.value = state.savePathRoot;
        savePathInput.addEventListener('change', e => { state.savePathRoot = e.target.value; persistState(); });

        const releaseDateInput = panel.querySelector('#gm-release-date');
        releaseDateInput.value = state.releaseDate;
        releaseDateInput.addEventListener('change', e => { state.releaseDate = e.target.value; persistState(); });

        panel.querySelectorAll('.gm-default-sub-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', e => {
                e.target.checked ? state.defaultSubgroups.add(e.target.value) : state.defaultSubgroups.delete(e.target.value);
                persistState();
            });
        });

        panel.querySelector('.gm-panel-v6-header').addEventListener('click', () => panel.classList.toggle('collapsed'));
        panel.querySelector('#gm-generate-btn').addEventListener('click', generateJSON);
        panel.querySelector('#gm-clear-all-btn').addEventListener('click', clearAllSelectedAnimes);
    }

    function updateSelectedListUI() {
        const list = document.getElementById('gm-selected-list');
        const countSpan = document.getElementById('gm-selected-count');
        const generateBtn = document.getElementById('gm-generate-btn');
        const clearAllBtn = document.getElementById('gm-clear-all-btn');
        if (!list) return;

        list.innerHTML = '';
        countSpan.textContent = state.selectedAnimes.size;

        if (state.selectedAnimes.size === 0) {
            list.innerHTML = '<li>尚未选择任何作品</li>';
            generateBtn.disabled = true;
            clearAllBtn.disabled = true;
        } else {
            state.selectedAnimes.forEach((anime, id) => {
                const perAnimeSubsHTML = Object.entries(PREFERRED_SUBGROUPS).map(([name, subId]) =>
                    `<label><input type="checkbox" class="gm-per-anime-sub-checkbox" data-anime-id="${id}" value="${subId}" ${anime.subgroups.has(subId) ? 'checked' : ''}><span>${name}</span></label>`
                ).join('');

                const item = document.createElement('li');
                item.innerHTML = `
                    <div class="gm-anime-item-header">
                        <span class="gm-anime-title" title="${anime.title}">${anime.title}</span>
                        <span class="gm-anime-settings-btn" data-anime-id="${id}" title="单独设置字幕组">⚙️</span>
                        <span class="gm-anime-delete-btn" data-anime-id="${id}" title="从列表中删除">✖</span>
                    </div>
                    <div class="gm-per-anime-subs">${perAnimeSubsHTML}</div>
                `;
                list.appendChild(item);
            });

            list.querySelectorAll('.gm-anime-settings-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    const subOptions = e.target.closest('.gm-anime-item-header').nextElementSibling;
                    subOptions.style.display = subOptions.style.display === 'grid' ? 'none' : 'grid';
                });
            });

            list.querySelectorAll('.gm-anime-delete-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    const animeId = e.target.dataset.animeId;
                    deleteSelectedAnime(animeId);
                });
            });

            list.querySelectorAll('.gm-per-anime-sub-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', e => {
                    const animeId = e.target.dataset.animeId;
                    const subId = e.target.value;
                    const animeData = state.selectedAnimes.get(animeId);
                    if (animeData) {
                        e.target.checked ? animeData.subgroups.add(subId) : animeData.subgroups.delete(subId);
                        persistState();
                    }
                });
            });

            generateBtn.disabled = false;
            clearAllBtn.disabled = false;
        }
        updatePageCheckboxes(); // Ensure page checkboxes reflect current state
    }

    function deleteSelectedAnime(id) {
        state.selectedAnimes.delete(id);
        persistState();
        updateSelectedListUI();
    }

    function clearAllSelectedAnimes() {
        if (confirm('确定要清空所有已选择的作品吗？')) {
            state.selectedAnimes.clear();
            persistState();
            updateSelectedListUI();
        }
    }

    // New function to update checkboxes on the main page
    function updatePageCheckboxes() {
        document.querySelectorAll('.gm-checkbox-container-v6 input[type="checkbox"]').forEach(checkbox => {
            // Find the associated anime ID. This might require traversing up the DOM.
            let id = null;
            const container = checkbox.closest('li, .sk-bangumi, .an-bangumi-card-container');
            if (container) {
                const link = container.querySelector('a[href^="/Home/Bangumi/"]');
                if (link) {
                    const idMatch = link.href.match(/\/(\d+)$/);
                    if (idMatch) id = idMatch[1];
                } else {
                    const dataIdElement = container.querySelector('[data-bangumiid]');
                    if (dataIdElement) id = dataIdElement.dataset.bangumiid;
                }
            }
            if (id) {
                checkbox.checked = state.selectedAnimes.has(id);
            }
        });
    }

    // --- 核心逻辑 ---
    function injectCheckboxes() {
        console.log('[GEMINI-SCRIPT-V6.7] Starting injectCheckboxes...');
        // Select all li elements. This is the most common container for anime items.
        const potentialAnimeContainers = document.querySelectorAll('li');
        console.log(`[GEMINI-SCRIPT-V6.7] Found ${potentialAnimeContainers.length} potential <li> containers.`);

        potentialAnimeContainers.forEach((container, index) => {
            if (container.dataset.gmV6Processed) { // Use a consistent processed flag
                console.log(`[GEMINI-SCRIPT-V6.7] Container ${index}: Already processed. Skipping.`);
                return;
            }

            let id = null;
            let title = null;
            let foundSource = 'none';

            // --- Attempt 1 (New Priority): Find a[href^="/Home/Bangumi/"] (for released items) ---
            const link = container.querySelector('a[href^="/Home/Bangumi/"]');
            if (link) {
                const idMatch = link.href.match(/\/(\d+)$/);
                if (idMatch) {
                    id = idMatch[1];
                    title = (link.getAttribute('title') || link.textContent || '').trim();
                    if (id && title) {
                        foundSource = 'link';
                        console.log(`[GEMINI-SCRIPT-V6.7] Container ${index}: Found via link. ID: ${id}, Title: ${title}`);
                    } else {
                        console.log(`[GEMINI-SCRIPT-V6.7] Container ${index}: Found link but failed to get ID/Title. ID: ${id}, Title: ${title}`);
                    }
                }
            }

            // --- Attempt 2 (New Fallback): Find data-bangumiid (for greyed-out/unreleased items) ---
            // Only try this if ID/Title not found yet from the link
            if (!id || !title) {
                const dataIdElement = container.querySelector('[data-bangumiid]');
                if (dataIdElement) {
                    id = dataIdElement.dataset.bangumiid;
                    // Try to get title from a more general element within an-info-group, avoiding .date-text
                    const infoGroup = container.querySelector('.an-info-group');
                    if (infoGroup) {
                        const potentialTitleElement = infoGroup.querySelector('span:not(.date-text), div:not(.date-text)');
                        if (potentialTitleElement && potentialTitleElement.textContent.trim().length > 0) {
                            title = potentialTitleElement.textContent.trim();
                        } else {
                            title = infoGroup.textContent.trim();
                            title = title.replace(/\d{4}\/\d{2}\/\d{2} 更新/, '').trim();
                            title = title.replace(/\d{4}年\d{2}月\d{2}日 更新/, '').trim();
                        }
                    }

                    if (id && title) {
                        foundSource = 'data-bangumiid';
                        console.log(`[GEMINI-SCRIPT-V6.7] Container ${index}: Found via data-bangumiid. ID: ${id}, Title: ${title}`);
                    } else {
                        console.log(`[GEMINI-SCRIPT-V6.7] Container ${index}: Found data-bangumiid but failed to get title. ID: ${id}, Title: ${title}`);
                    }
                }
            }

            if (!id || !title) {
                console.log(`[GEMINI-SCRIPT-V6.7] Container ${index}: Could not extract ID or title from any source. Skipping. Container HTML:`, container.outerHTML);
                return; // Skip if ID or title cannot be reliably extracted
            }

            // Mark as processed and set position
            container.style.position = 'relative';
            container.dataset.gmV6Processed = 'true'; // Use a consistent flag name

            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'gm-checkbox-container-v6'; // Keep consistent class name
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = state.selectedAnimes.has(id);
            checkbox.title = `选择: ${title}`;

            checkbox.addEventListener('click', e => e.stopPropagation());
            checkbox.addEventListener('change', e => {
                e.stopPropagation();
                if (e.target.checked) {
                    state.selectedAnimes.set(id, { id: id, title: title, subgroups: new Set(state.defaultSubgroups) });
                } else {
                    state.selectedAnimes.delete(id);
                }
                persistState();
                updateSelectedListUI();
            });

            checkboxContainer.appendChild(checkbox);
            container.appendChild(checkboxContainer);
            console.log(`[GEMINI-SCRIPT-V6.7] Successfully injected checkbox for ID: ${id}, Title: ${title} (Source: ${foundSource})`);
        });
    }

    function parseSeason(title) {
        const patterns = [
            { regex: /(?:第)([\u4e00-\u9fa5\d]+)(?:季|期)/, map: { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 } },
            { regex: /(?<![a-zA-Z])(S|Season\s*)(\d{1,2})(?![a-zA-Z])/i, group: 2 },
            { regex: /(?:\s)(II|III|IV|V|VI|VII|VIII)$/, map: { 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8 } }
        ];

        for (const p of patterns) {
            const match = title.match(p.regex);
            if (match) {
                let seasonNum;
                if (p.group) {
                    seasonNum = parseInt(match[p.group], 10);
                } else {
                    const key = match[1];
                    seasonNum = p.map[key] || parseInt(key, 10);
                }
                if (!isNaN(seasonNum)) {
                    let cleanTitle = title.replace(match[0], '').trim();
                    cleanTitle = cleanTitle.replace(/(?:\s*-\s*|\s+)(?:第[一二三四五六七八九十]+季|S\d+|Season\s*\d+|II|III|IV|V|VI|VII|VIII)$/i, '').trim();
                    return { cleanTitle: cleanTitle, season: 'S' + seasonNum };
                }
            }
        }
        return { cleanTitle: title, season: 'S1' };
    }

    function generateJSON() {
        if (state.selectedAnimes.size === 0) return alert('请先选择至少一部作品！');
        if (!state.savePathRoot) return alert('请填写根目录路径！');

        const rules = Array.from(state.selectedAnimes.values()).flatMap(anime => {
            if (anime.subgroups.size === 0) {
                console.warn(`[GEMINI-SCRIPT-V6.7] 作品 "${anime.title}" 没有选择任何字幕组，已跳过。`);
                return [];
            }
            const { cleanTitle, season } = parseSeason(anime.title);
            return Array.from(anime.subgroups).map(subgroupId => {
                const subGroupName = Object.keys(PREFERRED_SUBGROUPS).find(key => PREFERRED_SUBGROUPS[key] === subgroupId) || subgroupId;
                const series_name = anime.subgroups.size > 1 ? `${anime.title} - ${subGroupName}` : anime.title;
                const safeTitle = cleanTitle.replace(/[/\\?%*:|"<>]|\.$/g, '_');
                const savePath = state.savePathRoot + '\\' + safeTitle + '\\' + season;

                return {
                    release_date: state.releaseDate,
                    series_name: series_name,
                    mustContain: "",
                    mustNotContain: "",
                    rename_offset: "",
                    savePath: savePath,
                    affectedFeeds: `https://mikanani.me/RSS/Bangumi?bangumiId=${anime.id}&subgroupid=${subgroupId}`,
                    assignedCategory: "",
                    bangumiId: anime.id,
                    subgroupid: subgroupId,
                    filter: "",
                    exclusion: "",
                    mustContain: "",
                    mustNotContain: "",
                    enable: true,
                    download_all: false
                };
            });
        });

        if (rules.length === 0) return alert('没有生成任何有效规则。请确保每个选中的作品都至少选择了一个字幕组。！');

        const finalJson = {
            version: "v1",
            data_group: {
                name: "默认分组",
                data: rules
            }
        };

        const blob = new Blob([JSON.stringify(finalJson, null, 4)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Mikan_Subscription_Rules.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // --- 初始化 ---
    function run() {
        try {
            createPanel();
            state.selectedAnimes.forEach(anime => { anime.subgroups = new Set(anime.subgroups); });
            updateSelectedListUI();
            injectCheckboxes();
            const observer = new MutationObserver(() => injectCheckboxes());
            observer.observe(document.body, { childList: true, subtree: true });
        } catch (e) {
            console.error('[GEMINI-SCRIPT-V6.7] An error occurred during initialization:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

})();
