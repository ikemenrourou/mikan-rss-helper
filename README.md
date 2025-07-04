# 蜜柑计划 RSS 订阅助手

这是一个包含油猴脚本和辅助工具的项目，旨在帮助用户更方便地从[蜜柑计划](https://mikanime.tv/)网站订阅番剧，并解决 `qb-rss-manager` 可能遇到的 RSS 导入问题。

## 文件说明

- `mikan_rss_helper.user.js`: **核心油猴脚本**。在蜜柑计划网站添加控制面板，用于选择番剧并生成订阅规则的 `.json` 文件。
- `import_rss_to_qb.py`: **辅助工具**。一个图形界面的 Python 小程序，用于将油猴脚本生成的 `.json` 文件中的 RSS 源导入到 qBittorrent 中。

---

## 1. 油猴脚本: `mikan_rss_helper.user.js`

### 功能

- 在蜜柑计划网站的番剧列表页面，为每个番剧卡片添加一个复选框。
- 提供一个浮动控制面板，用于管理已选作品和下载设置。
- 支持为所有番剧设置默认字幕组，也支持为单个番剧单独指定字幕组。
- 能够根据番剧名称和季度信息自动生成下载路径。
- 一键生成 `Mikan_Subscription_Rules.json` 文件，该文件可被下述的辅助工具使用。

### 如何安装 (手动)

1.  **安装油猴 (Tampermonkey)**：如果你的浏览器还未安装，请先从官方渠道安装：[Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) | [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)。
2.  **打开脚本文件**：在本 GitHub 仓库中，点击打开 `mikan_rss_helper.user.js` 文件。
3.  **复制内容**：点击右上角的 “Raw” 按钮，然后按 `Ctrl+A` 全选，`Ctrl+C` 复制全部代码。
4.  **新建脚本**：打开浏览器右上角的油猴扩展图标，点击“管理面板”，然后点击“+”号标签页来创建一个新脚本。
5.  **粘贴代码**：将编辑器里预设的内容全部删除，然后按 `Ctrl+V` 将刚才复制的代码粘贴进去。
6.  **保存脚本**：点击编辑器上方的“文件”菜单，然后选择“保存”。

安装完成后，访问蜜柑计划网站即可看到效果。

---

## 2. 辅助工具: `import_rss_to_qb.py`

### 用途

本工具主要为了解决一个特定问题：一些用户（比如作者本人）在使用 [qb-rss-manager](https://github.com/Nriver/qb-rss-manager) 项目时，其“自动导入RSS订阅源到qBittorrent”的功能可能无法正常工作。如果你也遇到了这个问题，可以使用这个小工具来手动完成导入。

### 如何��用

1.  **运行环境**：确保你的电脑上安装了 Python。如果没有，可以从 [Python 官网](https://www.python.org/) 下载并安装。
2.  **下载脚本**：下载本仓库中的 `import_rss_to_qb.py` 文件。
3.  **运行脚本**：直接双击 `import_rss_to_qb.py` 文件，会弹出一个图形界面窗口。
4.  **选择源文件**：在程序窗口中，点击第一个“浏览...”按钮，选择你刚刚用油猴脚本生成的 `Mikan_Subscription_Rules.json` 文件。
5.  **确认目标文件**：程序会自动尝试定位你电脑上 qBittorrent 的 `feeds.json` 文件路径。通常你不需要修改它，除非你的 qBittorrent 安装在非常特殊的位置。
6.  **执行导入**：**在操作前，请务必完全关闭 qBittorrent (包括系统托盘里的图标)**。然后点击“开始转换”按钮。
7.  **完成**：程序会将新的 RSS 源添加进去。现在你可以重新启动 qBittorrent 查看结果了。