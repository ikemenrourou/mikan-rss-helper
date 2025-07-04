
# 蜜柑计划 RSS 订阅助手

这是一个油猴脚本，旨在简化为 [qb-rss-manager](https://github.com/Nriver/qb-rss-manager) 项目生成 RSS 订阅规则的过程。它通过在[蜜柑计划](https://mikanime.tv/)网站上添加一个控制面板和勾选框，让你能够轻松选择想要订阅的番剧，并一键生成兼容的 JSON 配置文件。

## ✨ 功能特性

- **可视化操作**: 在蜜柑计划网站的番剧列表页面，为每个番剧卡片添加一个复选框，方便地选择或取消选择。
- **浮动控制面板**: 一个可收缩的浮动面板，用于管理已选中的番剧和配置选项。
- **自定义字幕组**: 支持为所有番剧设置默认的字幕组，也支持为单个番剧单独指定一个或多个字幕组。
- **自动创建目录**: 能够根据番剧名称和季度信息（如 `S1`, `S2`）自动生成下载路径，保持文件结构清晰。
- **状态持久化**: 脚本会记住你选择的番剧、路径设置和字幕组偏好，即使刷新页面或关闭浏览器也不会丢失。
- **一键生成JSON**: 自动生成 `Mikan_Subscription_Rules.json` 文件，可直接导入到 qb-rss-manager 中使用。
- **清空与删除**: 方便地从列表中���除单个番剧，或一键清空所有已选中的项目。

## 🚀 如何安装与使用

1.  **安装油猴 (Tampermonkey)**
    如果你的浏览器还没有安装油猴扩展，请先从以下链接安装：
    - [Chrome 用户](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    - [Firefox 用户](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    - [Edge 用户](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2.  **安装本脚本**
    点击下方的链接进行安装：
    
    [**[点击此处从 Greasy Fork 安装]**](https://greasyfork.org/zh-CN/scripts/YOUR-SCRIPT-ID-HERE)  _(提示: 发布后需要将此链接替换为实际地址)_
    
    或者，你也可以直接从本仓库的 `mikan_rss_helper.user.js` 文件内容进行安装。

3.  **使用方法**
    - 安装脚本后，访问[蜜柑计划](https://mikanime.tv/)网站。
    - 你会看到每个番剧封面的左上角出现了一个复选框。
    - 屏幕右下角会出现一个 “RSS订阅助手” 的控制面板。
    - **勾选**你想要订阅的番剧。
    - 在控制面板中，**设置根目录路径** (例如 `D:\动画`)。
    - （可选）选择默认的字幕组。
    - （可选）为特定番剧点击 ⚙️ 图标，单独设置其字幕组。
    - 点击 **“生成订阅JSON”** 按钮，浏览器将自动下载 `Mikan_Subscription_Rules.json` 文件。
    - 将下载的 JSON 文件导入到你的 qb-rss-manager 中即可。

## 🤝 贡献

欢迎提交问题 (Issues) 或拉取请求 (Pull Requests) 来改进这个项目。

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。
