import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
import json
import uuid
import os
import shutil

# --- 核心转换逻辑 ---
def convert_and_update_feeds(source_file_path, target_file_path, log_widget):
    """
    读取Mikan订阅规则，转换格式，并更新到qBittorrent的feeds.json。
    通过log_widget记录操作日志。
    此版本兼容两种不同的Mikan JSON导出格式。
    """
    def log(message):
        """辅助函数，用于在GUI文本框中打印日志。"""
        log_widget.config(state=tk.NORMAL)
        log_widget.insert(tk.END, message + "\n")
        log_widget.see(tk.END) # 滚动到最新日志
        log_widget.config(state=tk.DISABLED)
        log_widget.update_idletasks()

    log("--- 开始转换 ---")

    # --- 步骤 1: 读取并解析源JSON文件 ---
    try:
        with open(source_file_path, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
        log(f"✅ 成功读取源文件: {os.path.basename(source_file_path)}")
    except Exception as e:
        log(f"❌ 错误: 读取或解析源文件时出错: {e}")
        messagebox.showerror("错误", f"读取源文件失败: {e}")
        return

    # --- 步骤 2: 读取现有的 feeds.json 文件 (如果存在) ---
    target_feeds = {}
    if os.path.exists(target_file_path):
        # 创建备份
        try:
            backup_path = target_file_path + '.bak'
            shutil.copy2(target_file_path, backup_path)
            log(f"ℹ️ 已将当前配置文件备份到: {backup_path}")
        except Exception as e:
            log(f"⚠️ 警告: 备份文件失败: {e}")

        try:
            with open(target_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if content:
                    target_feeds = json.loads(content)
                    log(f"✅ 成功读取现有的qBittorrent配置文件。")
                else:
                    log(f"ℹ️ 目标文件为空，将创建新内容。")
        except json.JSONDecodeError:
             log(f"⚠️ 警告: 目标文件格式不正确，将创建新文件。")
             target_feeds = {}
    else:
        log(f"ℹ️ 目标文件不存在，将自动创建。")

    # --- 步骤 3: 自动检测格式提取、转换、合并数据 ---
    added_count = 0
    skipped_count = 0
    
    subscription_list = []
    # **新增逻辑: 自动检测JSON格式**
    # 格式一: 新的 config.json 格式 (data_dump -> data_groups)
    if 'data_dump' in source_data and 'data_groups' in source_data['data_dump']:
        log("ℹ️ 检测到 'config.json' (data_groups) 格式。")
        all_groups = source_data.get('data_dump', {}).get('data_groups', [])
        for group in all_groups:
            subscription_list.extend(group.get('data', []))
    # 格式二: 旧的 Mikan_Subscription_Rules.json 格式 (data_group)
    elif 'data_group' in source_data:
        log("ℹ️ 检测到 'Mikan_Subscription_Rules.json' (data_group) 格式。")
        subscription_list = source_data.get('data_group', {}).get('data', [])
    # 未知格式
    else:
        log("❌ 错误: 无法识别的JSON文件格式。")
        messagebox.showerror("文件格式错误", "无法识别的JSON文件格式。请确保选择了正确的 Mikan 导出文件。")
        return

    for item in subscription_list:
        series_name = item.get('series_name')
        feed_url = item.get('affectedFeeds')

        # 跳过内容为空的条目
        if series_name and feed_url:
            if series_name not in target_feeds:
                new_uid = f"{{{str(uuid.uuid4())}}}"
                target_feeds[series_name] = {"uid": new_uid, "url": feed_url}
                log(f"  [+] 新增: {series_name}")
                added_count += 1
            else:
                log(f"  [*] 跳过 (已存在): {series_name}")
                skipped_count += 1
        else:
            # 不再提示数据不完整的条目，因为文件中可能有很多空行
            pass

    # --- 步骤 4: 将更新后的完整内容写回 feeds.json 文件 ---
    if added_count > 0:
        try:
            os.makedirs(os.path.dirname(target_file_path), exist_ok=True)
            with open(target_file_path, 'w', encoding='utf-8') as f:
                json.dump(target_feeds, f, indent=4, ensure_ascii=False)
            
            summary_message = f"操作完成！\n\n新增 {added_count} 个订阅。\n跳过 {skipped_count} 个已存在的订阅。\n\n请现在启动qBittorrent查看结果。"
            log("\n" + "="*40)
            log("🎉 操作完成！")
            log(f"✅ 成功写入 {added_count} 个新订阅到目标文件。")
            log("="*40)
            messagebox.showinfo("成功", summary_message)
        except Exception as e:
            log(f"❌ 错误: 写入最终文件时失败: {e}")
            messagebox.showerror("写入失败", f"无法写入目标文件，请检查路径和文件权限。\n\n{e}")
    else:
        log("\n" + "="*40)
        log("ℹ️ 所有订阅都已存在，无需新增。")
        log("="*40)
        messagebox.showinfo("提示", "没有需要新增的订阅，所有条目都已存在于目标文件中。")

# --- GUI部分 (无变化) ---
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Mikan RSS 转换工具 for qBittorrent (兼容版)")
        self.geometry("600x450")
        self.resizable(False, False)

        # --- 变量 ---
        self.source_file = tk.StringVar()
        self.target_file = tk.StringVar()

        # 尝试自动填充qBittorrent的默认路径
        default_qb_path = os.path.join(os.getenv('APPDATA', ''), 'qBittorrent', 'rss', 'feeds.json')
        if os.path.exists(os.path.dirname(default_qb_path)):
             self.target_file.set(default_qb_path)

        # --- UI 组件 ---
        main_frame = tk.Frame(self, padx=10, pady=10)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 1. 源文件选择
        source_frame = tk.LabelFrame(main_frame, text="1. 选择 Mikan 导出的 .json 文件", padx=10, pady=10)
        source_frame.pack(fill=tk.X, pady=5)

        source_entry = tk.Entry(source_frame, textvariable=self.source_file, state='readonly', width=70)
        source_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

        source_button = tk.Button(source_frame, text="浏览...", command=self.select_source_file)
        source_button.pack(side=tk.LEFT)

        # 2. 目标文件选择
        target_frame = tk.LabelFrame(main_frame, text="2. 确认 qBittorrent feeds.json 文件路径", padx=10, pady=10)
        target_frame.pack(fill=tk.X, pady=5)

        target_entry = tk.Entry(target_frame, textvariable=self.target_file, width=70)
        target_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

        target_button = tk.Button(target_frame, text="浏览...", command=self.select_target_file)
        target_button.pack(side=tk.LEFT)

        # 3. 执行按钮
        self.run_button = tk.Button(main_frame, text="开始转换", command=self.run_conversion, state=tk.DISABLED, bg="#4CAF50", fg="white", font=('Helvetica', 10, 'bold'))
        self.run_button.pack(pady=10, fill=tk.X, ipady=5)

        # 4. 日志输出
        log_frame = tk.LabelFrame(main_frame, text="日志输出", padx=10, pady=10)
        log_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.log_widget = scrolledtext.ScrolledText(log_frame, wrap=tk.WORD, state=tk.DISABLED, height=10)
        self.log_widget.pack(fill=tk.BOTH, expand=True)

    def select_source_file(self):
        filepath = filedialog.askopenfilename(
            title="请选择 Mikan 导出的 JSON 文件",
            filetypes=(("JSON files", "*.json"), ("All files", "*.*" ))
        )
        if filepath:
            self.source_file.set(filepath)
            self.check_button_state()

    def select_target_file(self):
        filepath = filedialog.asksaveasfilename(
            title="请选择或确认 qBittorrent feeds.json 路径",
            initialfile="feeds.json",
            defaultextension=".json",
            filetypes=(("JSON files", "*.json"),)
        )
        if filepath:
            self.target_file.set(filepath)
            self.check_button_state()

    def check_button_state(self):
        """检查是否两个路径都已选择，以激活按钮。"""
        if self.source_file.get() and self.target_file.get():
            self.run_button.config(state=tk.NORMAL)
        else:
            self.run_button.config(state=tk.DISABLED)

    def run_conversion(self):
        source = self.source_file.get()
        target = self.target_file.get()

        if not os.path.exists(source):
            messagebox.showerror("错误", "源文件路径无效，请重新选择。")
            return
            
        # 警告用户需要关闭qBittorrent
        if not messagebox.askokcancel("重要提示", "请确保您已经完全关闭了qBittorrent（包括系统托盘图标）。\n\n点击“确定”以继续。"):
            return

        # 清空日志
        self.log_widget.config(state=tk.NORMAL)
        self.log_widget.delete('1.0', tk.END)
        self.log_widget.config(state=tk.DISABLED)
        
        convert_and_update_feeds(source, target, self.log_widget)

# --- 运行程序 ---
if __name__ == "__main__":
    app = App()
    app.mainloop()
