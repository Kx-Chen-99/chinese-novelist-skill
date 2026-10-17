# 第二阶段：规划 + 二次确认

> **前置条件**：本阶段使用 Phase 1 Layer 3 用户确认的小说标题。标题信息从对话上下文中获取，用于命名项目目录、写入大纲文件头和写作计划 JSON。

执行以下步骤：

1. **询问存放地址并创建项目文件夹**：在创建项目前，先使用 `AskUserQuestion`（或直接询问）向用户确认小说项目的存放目录（默认推荐 `./小说/{Layer 3 确认的标题}/`，文件夹名**只保留小说名，不带时间戳**）。同时在项目文件夹内创建 `正文/` 子文件夹，所有章节正文文件统一存放在 `正文/` 目录下。
2. **生成人物档案**：创建 `00-人物档案.md`，使用 [character-template.md](../guides/character-template.md) 模板，参考 [character-building.md](../guides/character-building.md) 创建主角、反派、配角档案。**人物档案必须详细**：每个角色的性格核心、致命缺陷、说话风格/口头禅、恐惧/弱项、背景故事都要具体到可以直接指导写作的程度
3. **生成大纲**：创建 `01-大纲.md`，使用 [outline-template.md](../guides/outline-template.md) 模板，参考 [plot-structures.md](../guides/plot-structures.md) 填入完整的章节规划。**大纲必须以人物驱动情节** 参照 `00-人物档案.md`，确保情节服务于人物成长弧线
3.5. **生成文风基准**：创建 `03-文风基准.md`，包含四部分：
   - **文风指纹**：对话占比目标（默认 35%-45%）、句子节奏（短句为主、动作段≤10字）、段落呼吸、叙述距离、描写倾向，基于 Layer 2 已有的基调/风格参考/目标读者生成
   - **基准段落**：2 段体现目标文风的正文范例（各 500-800 字）。用户在问答中提供过喜欢的作品片段则直接采用
   - **负面清单**：引用 [chapter-guide.md](../guides/chapter-guide.md)「AI 写作痕迹清除」条目
   - **本书校准段落**：（初始为空，第 1 章完成后由 Phase 3 回填）
4. **生成写作计划**：创建 `02-写作计划.json`，基于大纲内容填充，结构如下：
   ```json
   {
     "version": 1,
     "novelName": "[小说名称]",
     "projectPath": "./小说/[小说名称]",
     "totalChapters": [章节数],
     "minWordsPerChapter": 3000,
     "maxWordsPerChapter": null,
     "createdAt": "[ISO时间]",
     "updatedAt": "[ISO时间]",
     "status": "planning",
     "writingMode": "[serial|subagent-parallel|agent-teams|viral-short-12k]",
     "chapters": [
       {
         "chapterNumber": 1,
         "title": "[章节标题]",
         "filePath": "正文/第01章-[章节标题].md",
         "status": "pending",
         "wordCount": null,
         "wordCountPass": null,
         "retryCount": 0
       }
     ]
   }
   ```

   > **🔥 12000字一镜到底爆款短篇模式（`viral-short-12k`）专属规划规则**：
   > 当用户在 Q8 选择「12000字一镜到底爆款短篇」时：
   > - `01-大纲.md` 采用**三幕精确规划**（第一幕 2000字：前200字强钩子+人物建立+推动事件；第二幕 8500字：多线发展+6000字中点重大转折+困境升级+3~4个情感爆点；第三幕 1500字：高潮对决+最后1000字终极揭示+多重收束+价值升华），并规划好 3 个大悬念与每 800 字一个的小悬念节奏点。
   > - `02-写作计划.json` 中设置 `"totalChapters": 1`、`"minWordsPerChapter": 11500`、`"maxWordsPerChapter": 12500`、`"writingMode": "viral-short-12k"`，单章 `filePath` 设为 `"正文/全文.md"`。
   > - 确认规划后无需再询问串行/并行模式，直接进入第三阶段的「12000字一镜到底爆款短篇模式」创作。

完成后，执行以下两步：

**1. 展示规划摘要并请求确认**

向用户展示规划摘要（小说名称、总章数、目标字数、主要人物、文风基准来源）并请求确认。

**2. 写作模式选择**（用户确认规划后）

使用 `AskUserQuestion` 询问：

```
Question: 选择写作模式
Options:
- 逐章串行（主 Agent 自己逐章写，全程无中断，适合短中篇）
- 子Agent并行（分批派生子 Agent 并行写作，大纲驱动连贯性，适合中长篇）
- Agent Teams（Claude Code 多 Agent 协作模式，Agent 间可通讯，需手动开启）
```

用户选择后：
- 更新 `02-写作计划.json` 的 `writingMode` 字段
- 更新 `status` 为 `"in_progress"`
- 进入第三阶段：疯狂创作 → 详见 [phase3-writing.md](phase3-writing.md)
