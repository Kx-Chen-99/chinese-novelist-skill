/**
 * 【品类三：同人向 ·《龙族》卡塞尔学院·守夜人讨论区】
 * 严格对齐用户指定参考图：
 * - 封面（图1）：暗夜雾中卡塞尔古堡钟楼 + 黄金瞳黑龙 + 卡塞尔学院官方圆形半朽世界树校徽 + 深靛蓝鎏金标题牌
 * - 内页（图2）：深靛蓝校徽导航顶栏 + 守夜人论坛绿字副标 + 红笔刷下划线大标题 + 暖米白网格纸底 + 胶带斜贴便签楼层卡（左侧方形阵营头像 + 右侧金字楼层号/深蓝昵称/正文）
 */

const fs = require('fs');
const path = require('path');
const { formatInlineMarkdown } = require('./common');

const DRAGON_THEME = {
  category: 'dragon',
  id: 'cassell-forum',
  label: '守夜人论坛（卡塞尔学院官方校徽封面 + 便签拼贴内页）',
  isDragonTheme: true,
};

const DRAGON_PRESET_THEMES = {
  'cassell-forum': DRAGON_THEME,
};

const SPECIAL_DRAGON_AUTHORS = new Set([
  '芬格尔（管理员）',
  '芬格尔',
  '村雨',
  '狄克推多',
  '索尼克',
  '守夜人',
  '剑桥折刀',
  '格陵兰阴影',
  '格尔德·鲁道夫·曼施坦因（教授）',
  '格尔德·鲁道夫·曼施坦因',
  'EVA（系统终端）',
  'EVA',
]);

function isDragonContent(boardName = '', mdContent = '') {
  return (
    boardName.includes('卡塞尔') ||
    boardName.includes('守夜人') ||
    mdContent.includes('守夜人讨论区') ||
    mdContent.includes('卡塞尔学院') ||
    mdContent.includes('路明非')
  );
}

function isSpecialDragonAuthor(author = '') {
  const clean = String(author || '').trim();
  if (SPECIAL_DRAGON_AUTHORS.has(clean)) return true;
  return clean.includes('管理员') || clean.includes('教授') || clean.includes('系统终端');
}

const assetCache = {};
function getAssetDataURI(fileName) {
  if (assetCache[fileName] !== undefined) return assetCache[fileName];
  const candidates = [
    path.join(__dirname, '..', 'assets', fileName),
    path.resolve(process.cwd(), '工具/assets', fileName),
    path.join('/Users/bytedance/Library/Mobile Documents/iCloud~md~obsidian/Documents/职业技术/工具/assets', fileName),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const ext = p.endsWith('.png') ? 'png' : 'jpeg';
        const b64 = fs.readFileSync(p).toString('base64');
        assetCache[fileName] = `data:image/${ext};base64,${b64}`;
        return assetCache[fileName];
      }
    } catch (_) {}
  }
  assetCache[fileName] = '';
  return '';
}

function getDragonAvatarHTML(floor) {
  const author = floor.author || '';
  let file = 'avatar-student.png';

  if (floor.isOP || author.includes('新闻部') || author.includes('芬格尔') || author.includes('守夜人') || author.includes('曼施坦因') || author.includes('EVA')) {
    file = 'avatar-op.png';
  } else if (floor.isAnon || author.includes('匿名')) {
    file = 'avatar-anon.png';
  } else if (author.includes('诺顿馆') || author.includes('狄克推多') || author.includes('恺撒') || author.includes('圣殿')) {
    file = 'avatar-union.png';
  } else if (author.includes('狮心会') || author.includes('村雨') || author.includes('楚子航') || author.includes('装备部')) {
    file = 'avatar-lion.png';
  } else {
    file = 'avatar-student.png';
  }

  const uri = getAssetDataURI(file);
  return `<img src="${uri}" class="dragon-avatar-img" alt="avatar" />`;
}

function getDragonBadgeHTML(floor) {
  const author = floor.author || '';
  let roleClass = 'role-anon';
  if (floor.isOP) roleClass = 'role-op';
  else if (floor.isSpecialUser) roleClass = 'role-special';

  let badgeHTML = '';
  if (floor.isOP) {
    badgeHTML = '<span class="sketch-stamp stamp-op">楼主</span>';
  } else if (author.includes('芬格尔')) {
    badgeHTML = '<span class="sketch-stamp stamp-op">管理员</span>';
  } else if (author.includes('守夜人')) {
    badgeHTML = '<span class="sketch-stamp stamp-op">副校长</span>';
  } else if (author.includes('曼施坦因')) {
    badgeHTML = '<span class="sketch-stamp stamp-op">风纪主任</span>';
  } else if (author.includes('EVA')) {
    badgeHTML = '<span class="sketch-stamp stamp-op">系统终端</span>';
  }

  return { roleClass, badgeHTML };
}

/**
 * 图2专属楼层卡片渲染（左上斜贴胶带 + 左侧方形头像 + 右侧金字楼层号与昵称 + 正文）
 */
function renderDragonFloorSliceHTML(floor, slice) {
  const { roleClass, badgeHTML } = getDragonBadgeHTML(floor);
  const avatarHTML = getDragonAvatarHTML(floor);

  let cleanAuthor = floor.author || '';
  if (cleanAuthor.includes('（管理员）') || cleanAuthor.includes('（教授）') || cleanAuthor.includes('（系统终端）')) {
    cleanAuthor = cleanAuthor.replace(/（.*?）/g, '').trim();
  }

  const quotesHTML = (slice.quotes || [])
    .map((q) => `<div class="floor-quote">↳ ${formatInlineMarkdown(q, false)}</div>`)
    .join('');

  const paragraphsHTML = (slice.paragraphs || [])
    .map((p, pIdx) => `<p class="floor-p" data-p-idx="${pIdx}">${formatInlineMarkdown(p, false)}</p>`)
    .join('');

  const floorLabel = slice.isCont ? `${floor.floorNum} (续)` : floor.floorNum;

  return `
    <div class="floor-item ${roleClass}" data-slice-id="${slice.sliceId || ''}">
      <div class="floor-tape"></div>
      <div class="floor-row">
        <div class="avatar">${avatarHTML}</div>
        <div class="floor-main">
          <div class="floor-header">
            <span class="floor-num">${floorLabel}</span>
            <span class="author-name">${formatInlineMarkdown(cleanAuthor, false)}</span>
            ${badgeHTML}
          </div>
          <div class="floor-body">
            ${quotesHTML}
            ${paragraphsHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildDragonForumCSS(theme, fontSize = 14.5, lineHeight = 1.42, cardGap = 8) {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background: #E5E0D5;
      font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
      color: #24272D;
    }
    /* 375px 手机原生宽度 + 高度自适应（图2 暖米白方格手账纸底） */
    .xhs-card {
      width: 375px;
      height: auto;
      background-color: #F5F2EA;
      background-image:
        linear-gradient(to right, rgba(185, 178, 165, 0.26) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(185, 178, 165, 0.26) 1px, transparent 1px);
      background-size: 16px 16px;
      padding: 0 12px 10px 12px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    /* 顶部深靛蓝导航栏（左：卡塞尔官方圆形校徽 + 金色面包屑，右：页码） */
    .notebook-header {
      height: 36px;
      margin: 0 -12px 8px -12px;
      padding: 0 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(90deg, #1B2436 0%, #253147 100%);
      border-bottom: 1.5px solid #B89452;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
      flex-shrink: 0;
      position: relative;
      z-index: 4;
    }
    .nb-left {
      font-family: "Songti SC", "STSong", "PingFang SC", serif;
      font-size: 11px;
      font-weight: 700;
      color: #E2C481;
      letter-spacing: 0.2px;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .nav-crest-img {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
      flex-shrink: 0;
    }
    .nb-right {
      font-family: "DIN Alternate", "SF Mono", monospace;
      font-size: 10.5px;
      font-weight: 700;
      color: #C4A564;
      flex-shrink: 0;
    }
    /* 首页顶部栏目头（守夜人论坛 + 投票专区 + 大标题 + 红色手绘下划线） */
    .hero-memo-card {
      position: relative;
      margin-bottom: 9px;
      padding: 0 2px 4px 2px;
      flex-shrink: 0;
      z-index: 2;
    }
    .hero-sketch-box,
    .washi-tape,
    .dragon-watermark {
      display: none;
    }
    .dragon-forum-banner {
      padding-bottom: 5px;
      margin-bottom: 6px;
      border-bottom: 1px solid #DED8CA;
    }
    .dragon-forum-name {
      font-family: "Songti SC", "STSong", "PingFang SC", serif;
      font-size: 16.5px;
      font-weight: 900;
      color: #2E5840;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }
    .dragon-forum-sub {
      font-size: 10px;
      font-weight: 500;
      color: #8C877E;
      margin-top: 2px;
    }
    .dragon-post-title-wrap {
      position: relative;
      padding-bottom: 5px;
    }
    .dragon-post-title {
      font-size: 14.8px;
      font-weight: 850;
      color: #1D2127;
      line-height: 1.35;
      letter-spacing: 0.1px;
    }
    .dragon-red-underline {
      display: block;
      width: 240px;
      height: 6px;
      margin-top: 2px;
    }
    /* 楼层便签列表容器 */
    .floors-container {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: ${cardGap}px;
      overflow: visible;
      position: relative;
      z-index: 2;
    }
    /* 单个楼层便签卡片（复刻图2：米白纸条 + 左上斜贴胶带 + 左侧方形头像 + 右侧内容） */
    .floor-item {
      position: relative;
      padding: 8px 10px 8px 9px;
      background: #FAF8F2;
      border: 1px solid #E5DFD2;
      border-radius: 2px;
      box-shadow: 0 2px 5px rgba(30, 35, 45, 0.07);
      min-height: 58px;
    }
    .floor-item.role-op {
      background: #F9F3E4;
      border-left: 3.5px solid #C69B4B;
    }
    .floor-item.role-special {
      background: #F8F4EA;
      border-left: 3px solid #9B3B3B;
    }
    /* 左上角斜贴半透明和纸胶带 */
    .floor-tape {
      position: absolute;
      top: -4px;
      left: 5px;
      width: 30px;
      height: 10px;
      background: rgba(228, 220, 202, 0.78);
      border: 0.5px solid rgba(198, 188, 168, 0.42);
      transform: rotate(-28deg);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      pointer-events: none;
      z-index: 3;
    }
    .floor-row {
      display: flex;
      align-items: flex-start;
      gap: 9px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      margin-top: 1px;
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    .dragon-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .floor-main {
      flex: 1;
      min-width: 0;
    }
    .floor-header {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 5px;
      margin-bottom: 3px;
    }
    .floor-num {
      font-family: "PingFang SC", "Helvetica Neue", sans-serif;
      font-size: 12.5px;
      font-weight: 850;
      color: #C3923E;
      flex-shrink: 0;
    }
    .author-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #1D2B44;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sketch-stamp {
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 2px;
      line-height: 1.2;
      flex-shrink: 0;
    }
    .stamp-op {
      background: linear-gradient(180deg, #E6C77E 0%, #D1AB56 100%);
      color: #4A3208;
      border: 0.5px solid #B88E39;
    }
    .floor-body {
      padding-left: 0;
    }
    .floor-quote {
      padding: 2px 6px;
      margin-bottom: 3px;
      font-size: 12px;
      color: #5C626B;
      background: rgba(220, 214, 200, 0.38);
      border-left: 2px solid #C3923E;
    }
    .floor-p {
      font-size: ${fontSize}px;
      font-weight: 450;
      line-height: ${lineHeight};
      color: #23262C;
      margin-bottom: 2.5px;
      letter-spacing: 0.1px;
      word-break: break-word;
    }
    .floor-p:last-child {
      margin-bottom: 0;
    }
    .marker-highlight {
      background: rgba(230, 198, 120, 0.35);
      color: #3B2806;
      padding: 0 1px;
      border-radius: 2px;
      font-weight: 600;
    }
    .inline-code {
      font-size: ${Math.round((fontSize - 0.8) * 10) / 10}px;
      background: rgba(46, 88, 64, 0.1);
      color: #1E4631;
      border-radius: 2px;
      padding: 0 3px;
      font-weight: 650;
    }
    .mention {
      color: #9B2C2C;
      font-weight: 700;
    }
    .system-notice {
      padding: 6px 10px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: #4A3208;
      background: #F4E8C6;
      border: 1px solid #C69B4B;
      border-radius: 2px;
    }
    .ending-archive-card {
      margin-top: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1E2738;
      color: #E2C481;
      border-left: 3px solid #C69B4B;
      border-radius: 2px;
    }
    .ending-title { font-size: 11px; font-weight: 800; color: #E2C481; }
    .ending-stats { font-size: 9.5px; color: #A0AEC0; }
    .ending-stamp { background: #9B2C2C; color: #FFF; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 2px; }
    /* 底部栏与右下角卡塞尔圆形校徽小标 */
    .sketch-footer {
      height: 18px;
      margin-top: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      font-weight: 600;
      color: #7B766D;
      padding: 0 2px;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }
    .sketch-doodle-line {
      flex: 1;
      margin: 0 8px;
      height: 1px;
      background: #DDD6C7;
    }
    .footer-corner-crest {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      vertical-align: middle;
      margin-left: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.25);
    }
    /* ==================== 封面（图1 + 卡塞尔学院官方圆形校徽） ==================== */
    #card-cover {
      width: 375px;
      height: 500px;
      padding: 0;
      background: #0D131F;
      position: relative;
      overflow: hidden;
    }
    .dragon-cover-full-img {
      width: 375px;
      height: 500px;
      object-fit: cover;
      display: block;
    }
  `;
}

function renderDragonHeroHTML(titleTag, cleanTitle) {
  const fullTitle = titleTag && titleTag !== '树洞' ? `【${titleTag}】${cleanTitle}` : cleanTitle;
  return `
    <div class="hero-memo-card" id="m-hero">
      <div class="dragon-forum-banner">
        <div class="dragon-forum-name">守夜人论坛</div>
        <div class="dragon-forum-sub">校园生活 / 投票专区</div>
      </div>
      <div class="dragon-post-title-wrap">
        <div class="dragon-post-title">${formatInlineMarkdown(fullTitle)}</div>
        <svg class="dragon-red-underline" viewBox="0 0 240 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4.2C58 1.8 142 1.5 238 3.6" stroke="#C84B4B" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M12 5.2C75 3.2 155 3.0 218 4.6" stroke="#C84B4B" stroke-opacity="0.55" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  `;
}

function renderDragonCoverCardHTML() {
  const coverURI = getAssetDataURI('dragon-cover-with-crest.jpg');
  return `
    <div class="xhs-card" id="card-cover">
      <img src="${coverURI}" class="dragon-cover-full-img" alt="cover" />
    </div>
  `;
}

function getDragonPageMeta(parsed) {
  const crestURI = getAssetDataURI('cassell-official-crest.png');
  return {
    topbarLeftHTML: `<img src="${crestURI}" class="nav-crest-img" alt="crest" /><span>${formatInlineMarkdown(parsed.boardName)}</span>`,
    footerLeftText: '守夜人讨论区 · 灌水版',
    footerNextText: `NEXT >>> <img src="${crestURI}" class="footer-corner-crest" alt="crest" />`,
    footerEndText: `[ LOCKED ] <img src="${crestURI}" class="footer-corner-crest" alt="crest" />`,
    endingTitleText: '守夜人讨论区 · 灌水版热帖归档',
    endingStatsText: `共 ${parsed.floors.length - 1} 条回帖 · EVA 校验通过`,
    endingStampText: '守夜人锁定',
    pageBgWatermarkHTML: '',
    heroWatermarkHTML: '',
  };
}

module.exports = {
  categoryId: 'dragon',
  categoryName: '龙族（卡塞尔学院官方校徽封面 + 便签拼贴内页）',
  DRAGON_THEME,
  DRAGON_PRESET_THEMES,
  SPECIAL_DRAGON_AUTHORS,
  isDragonContent,
  isSpecialDragonAuthor,
  getAvatarSVG: getDragonAvatarHTML,
  getBadgeHTML: getDragonBadgeHTML,
  renderFloorSliceHTML: renderDragonFloorSliceHTML,
  renderHeroHTML: renderDragonHeroHTML,
  buildCSS: buildDragonForumCSS,
  renderCoverCardHTML: renderDragonCoverCardHTML,
  getPageMeta: getDragonPageMeta,
};
