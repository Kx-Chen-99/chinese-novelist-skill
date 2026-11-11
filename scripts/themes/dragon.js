/**
 * 【品类三：同人向 ·《龙族》卡塞尔学院·守夜人讨论区】
 * 视觉风格：卡塞尔学院 · 半朽世界树暗夜墨绿鎏金终端风 UI (cassell-forum)
 * 包含：半朽世界树校徽 (Yggdrasil)、诺玛/EVA系统终端、狮心会/学生会/风纪委员会阵营铭牌、卡塞尔标准封面
 */

const { formatInlineMarkdown, splitCoverTitleLines } = require('./common');

const DRAGON_THEME = {
  category: 'dragon',
  id: 'cassell-forum',
  label: '守夜人讨论区（龙族·卡塞尔学院半朽世界树暗金墨绿终端风）',
  isDragonTheme: true,
  paperBg: '#07110D',
  inkColor: '#E2ECE8',
  inkMuted: '#8FA89E',
  markerSolid: '#D4AF37',
  markerDeep: '#991B1B',
  markerSoft: '#FEF3C7',
  highlighter: 'rgba(212, 175, 55, 0.22)',
  darkCardFill: '#0D1F18',
  darkCardShadow: '#D4AF37',
  darkAccent: '#F3C65F',
  topbarBg: '#0B1914',
  topbarBorder: '#D4AF37',
  topbarText: '#F4F1EA',
  topbarAccent: '#F3C65F',
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

/**
 * 判断一篇论坛体 Markdown 是否属于《龙族》卡塞尔守夜人讨论区品类
 */
function isDragonContent(boardName = '', mdContent = '') {
  return (
    boardName.includes('卡塞尔') ||
    boardName.includes('守夜人') ||
    mdContent.includes('守夜人讨论区') ||
    mdContent.includes('卡塞尔学院') ||
    mdContent.includes('路明非') ||
    mdContent.includes('楚子航') ||
    mdContent.includes('恺撒')
  );
}

function isSpecialDragonAuthor(author = '') {
  const clean = String(author || '').trim();
  if (SPECIAL_DRAGON_AUTHORS.has(clean)) return true;
  return (
    clean.includes('管理员') ||
    clean.includes('教授') ||
    clean.includes('系统终端') ||
    clean === '村雨' ||
    clean === '狄克推多' ||
    clean === '守夜人'
  );
}

/**
 * 卡塞尔学院校徽【半朽的世界树 Yggdrasil】纯矢量 SVG
 * 左半侧繁茂枝叶与生命果实，右半侧枯枝苍劲，外环秘党双圈炼金铭文环与十字星芒
 */
function getYggdrasilCrestSVG(size = 18, isWatermark = false) {
  const opacityAttr = isWatermark ? 'opacity="0.14"' : '';
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" ${opacityAttr} style="vertical-align: -3px; flex-shrink: 0;">
      <!-- 外层秘党炼金双环 -->
      <circle cx="60" cy="60" r="54" stroke="#D4AF37" stroke-width="2.4"/>
      <circle cx="60" cy="60" r="48" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="4 3"/>
      <circle cx="60" cy="60" r="43" fill="#07120E" stroke="rgba(52, 211, 153, 0.35)" stroke-width="1"/>
      <!-- 炼金几何背景八角星芒 -->
      <polygon points="60,14 71,49 106,60 71,71 60,106 49,71 14,60 49,49" stroke="rgba(212, 175, 55, 0.25)" stroke-width="1" fill="rgba(16, 185, 129, 0.04)"/>
      <!-- 中轴线（半生半朽分界） -->
      <line x1="60" y1="16" x2="60" y2="104" stroke="rgba(212, 175, 55, 0.28)" stroke-width="0.9" stroke-dasharray="2 2"/>
      <!-- 世界树主干与盘绕根系 -->
      <path d="M60 32V82" stroke="#D4AF37" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M58 46V80" stroke="#F3C65F" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M60 78C53 84 44 89 35 90M60 80C55 88 49 94 42 96M60 78C67 84 76 89 85 90M60 80C65 88 71 94 78 96" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round"/>
      <!-- 左半侧：繁茂枝叶（秘林翠绿 + 鎏金叶脉） -->
      <path d="M60 56C50 52 40 44 34 34M60 46C52 40 45 33 41 25M60 64C49 62 39 57 31 49" stroke="#F3C65F" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="34" cy="34" r="6" fill="#10B981" stroke="#F3C65F" stroke-width="1.2"/>
      <circle cx="42" cy="25" r="5.5" fill="#059669" stroke="#F3C65F" stroke-width="1.2"/>
      <circle cx="30" cy="48" r="5.5" fill="#10B981" stroke="#F3C65F" stroke-width="1.2"/>
      <circle cx="46" cy="39" r="6.5" fill="#34D399" stroke="#D4AF37" stroke-width="1.2"/>
      <circle cx="52" cy="28" r="5" fill="#10B981" stroke="#D4AF37" stroke-width="1.1"/>
      <circle cx="39" cy="56" r="4.5" fill="#059669" stroke="#D4AF37" stroke-width="1.1"/>
      <!-- 右半侧：枯朽枝桠（苍劲折线古铜金） -->
      <path d="M60 54L74 42L85 30M74 42L86 44M60 44L71 31L77 22M60 63L75 56L88 53M75 56L83 64" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter"/>
      <!-- 顶部秘党龙瞳冠冕星 -->
      <polygon points="60,15 62.5,21 69,21.5 64,25.5 65.5,32 60,28.5 54.5,32 56,25.5 51,21.5 57.5,21" fill="#F3C65F"/>
      <circle cx="60" cy="55" r="3" fill="#DC2626" stroke="#FEF08A" stroke-width="0.9"/>
    </svg>
  `;
}

/**
 * 页面背景正中央的《龙族·卡塞尔学院半朽世界树》大幅水印
 */
function getDragonPageBgWatermarkHTML() {
  return `
    <div class="dragon-page-bg-logo">
      ${getYggdrasilCrestSVG(250, true)}
    </div>
  `;
}

/**
 * 守夜人讨论区专属纹章头像（SVG）
 */
function getDragonAvatarSVG(floor) {
  const author = floor.author || '';
  const shieldOuter = 'M18 2L31 7V18C31 26.5 25.2 32.2 18 34.5C10.8 32.2 5 26.5 5 18V7L18 2Z';
  const shieldInner = 'M18 4.8L28.5 8.8V17.8C28.5 24.8 23.8 29.6 18 31.6C12.2 29.6 7.5 24.8 7.5 17.8V8.8L18 4.8Z';

  // 1. 楼主 / 新闻部 / 芬格尔
  if (floor.isOP || author.includes('芬格尔') || author.includes('新闻部')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${shieldOuter}" fill="#091812" stroke="#F3C65F" stroke-width="1.8"/>
        <path d="${shieldInner}" fill="#112A20"/>
        <path d="M18 9V26M18 15L12 11M18 17L24 12M18 21L13 18" stroke="#34D399" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="18" cy="10" r="2.2" fill="#F3C65F"/>
      </svg>`;
  }

  // 2. 楚子航 / 村雨 / 狮心会
  if (author.includes('村雨') || author.includes('楚子航') || author.includes('狮心会')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${shieldOuter}" fill="#180A0A" stroke="#F3C65F" stroke-width="1.8"/>
        <path d="${shieldInner}" fill="#450A0A"/>
        <path d="M11 26L25 9" stroke="#F8FAFC" stroke-width="2.3" stroke-linecap="round"/>
        <path d="M14 20L19 25" stroke="#F3C65F" stroke-width="2" stroke-linecap="round"/>
        <circle cx="18" cy="18" r="2.4" fill="#EF4444" stroke="#FEF08A" stroke-width="0.8"/>
      </svg>`;
  }

  // 3. 恺撒 / 狄克推多 / 学生会 / 安珀馆 / 诺顿馆
  if (author.includes('狄克推多') || author.includes('恺撒') || author.includes('安珀馆') || author.includes('诺顿馆')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${shieldOuter}" fill="#0B1528" stroke="#F3C65F" stroke-width="1.8"/>
        <path d="${shieldInner}" fill="#1E3A8A"/>
        <path d="M10 22L13 12L18 17L23 12L26 22H10Z" fill="#F3C65F" stroke="#FEF08A" stroke-width="1"/>
        <rect x="10" y="23.5" width="16" height="2" fill="#F3C65F"/>
      </svg>`;
  }

  // 4. 曼施坦因 / 守夜人 / 教授
  if (author.includes('曼施坦因') || author.includes('守夜人') || author.includes('教授')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${shieldOuter}" fill="#1F1209" stroke="#F3C65F" stroke-width="1.8"/>
        <path d="${shieldInner}" fill="#3B1D0A"/>
        <path d="M18 8V27M11 13H25" stroke="#F3C65F" stroke-width="2" stroke-linecap="round"/>
        <polygon points="11,14 8.5,20 13.5,20" fill="#FDE68A"/>
        <polygon points="25,14 22.5,20 27.5,20" fill="#FDE68A"/>
      </svg>`;
  }

  // 5. EVA 系统终端
  if (author.includes('EVA') || author.includes('系统')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${shieldOuter}" fill="#041E19" stroke="#34D399" stroke-width="1.8"/>
        <path d="${shieldInner}" fill="#064E3B"/>
        <polygon points="18,8 26,18 18,28 10,18" stroke="#6EE7B7" stroke-width="1.6" fill="rgba(52, 211, 153, 0.18)"/>
        <circle cx="18" cy="18" r="3" fill="#34D399"/>
      </svg>`;
  }

  // 6. 匿名用户 / 普通卡塞尔学生
  const borderCol = floor.isAnon ? '#64748B' : '#D4AF37';
  const innerFill = floor.isAnon ? '#13201B' : '#0F291E';
  return `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${shieldOuter}" fill="#08130E" stroke="${borderCol}" stroke-width="1.6"/>
      <path d="${shieldInner}" fill="${innerFill}"/>
      <path d="M18 10V25M18 15L13 12M18 17L23 14" stroke="${borderCol}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="18" cy="18" r="2" fill="#34D399"/>
    </svg>`;
}

/**
 * 获取《龙族》守夜人讨论区专属社团/权限胶囊标签
 */
function getDragonBadgeHTML(floor) {
  const author = floor.author || '';
  let roleClass = 'role-anon';
  if (floor.isOP) roleClass = 'role-op';
  else if (floor.isSpecialUser) roleClass = 'role-special';

  let badgeHTML = '';
  if (floor.isOP) {
    badgeHTML = '<span class="sketch-stamp stamp-op">楼主 · 新闻部</span>';
  } else if (author.includes('EVA') || author.includes('系统终端')) {
    badgeHTML = '<span class="sketch-stamp stamp-eva">诺玛主控终端</span>';
  } else if (author.includes('守夜人')) {
    badgeHTML = '<span class="sketch-stamp stamp-special">副校长 · 最高管理员</span>';
  } else if (author.includes('芬格尔')) {
    badgeHTML = '<span class="sketch-stamp stamp-special">新闻部 · 管理员</span>';
  } else if (author.includes('曼施坦因')) {
    badgeHTML = '<span class="sketch-stamp stamp-special">风纪委员会主任</span>';
  } else if (author === '村雨') {
    badgeHTML = '<span class="sketch-stamp stamp-special">狮心会会长 · 超A级</span>';
  } else if (author === '狄克推多') {
    badgeHTML = '<span class="sketch-stamp stamp-special">学生会主席 · A级</span>';
  } else if (author.includes('狮心会')) {
    badgeHTML = '<span class="sketch-stamp stamp-lion">狮心会</span>';
  } else if (author.includes('安珀馆') || author.includes('诺顿馆')) {
    badgeHTML = '<span class="sketch-stamp stamp-union">学生会</span>';
  } else if (author.includes('装备部')) {
    badgeHTML = '<span class="sketch-stamp stamp-dept">装备部</span>';
  } else if (author.includes('炼金')) {
    badgeHTML = '<span class="sketch-stamp stamp-dept">炼金化学部</span>';
  } else if (author.includes('圣殿骑士')) {
    badgeHTML = '<span class="sketch-stamp stamp-dept">圣殿骑士团</span>';
  } else if (author.includes('古籍区') || author.includes('钟楼') || author.includes('芝加哥') || author.includes('1区')) {
    badgeHTML = '<span class="sketch-stamp stamp-dept">卡塞尔学生</span>';
  } else if (floor.isAnon) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">匿名通道</span>';
  } else {
    badgeHTML = '<span class="sketch-stamp stamp-dept">卡塞尔学生</span>';
  }

  return { roleClass, badgeHTML };
}

function splitDragonCoverTitle(cleanTitle) {
  const raw = String(cleanTitle || '').trim();
  const quoteMatch = raw.match(/^(.*?[“"][^”"]+[”"])\s*(.+)$/);
  if (quoteMatch) {
    const line1 = quoteMatch[1].trim();
    const line2 = quoteMatch[2].trim();
    const size1 = line1.length <= 9 ? 31 : 27;
    const size2 = line2.length <= 7 ? 38 : 32;
    return { line1, line2, size1, size2 };
  }
  return splitCoverTitleLines(raw);
}

function buildDragonForumCSS(theme, fontSize = 15.5, lineHeight = 1.45, cardGap = 6) {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background: #050C09;
      font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
      color: #E2ECE8;
    }
    /* 375px 手机原生宽度 + 高度自适应 (3x 导出为 1125px 宽超清图) */
    .xhs-card {
      width: 375px;
      height: auto;
      background-color: #07110D;
      background-image:
        radial-gradient(circle at 50% 48%, rgba(16, 185, 129, 0.09) 0%, rgba(212, 175, 55, 0.05) 45%, transparent 76%),
        linear-gradient(180deg, rgba(11, 26, 20, 0.92) 0%, rgba(7, 17, 13, 0.99) 100%);
      padding: 8px 10px 7px 10px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      border-top: 2px solid rgba(212, 175, 55, 0.82);
    }
    #card-cover {
      height: 500px;
    }
    /* 页面背景正中央的《卡塞尔学院·半朽世界树》水印 */
    .dragon-page-bg-logo {
      position: absolute;
      top: 52%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 320px;
      height: 260px;
      pointer-events: none;
      z-index: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.9;
    }
    /* 顶部守夜人讨论区导航条 */
    .notebook-header {
      height: 24px;
      margin-bottom: 6px;
      padding: 0 4px 3px 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: transparent;
      border-bottom: 1px solid rgba(212, 175, 55, 0.32);
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }
    .nb-left {
      font-size: 10.5px;
      font-weight: 700;
      color: #CBD5E1;
      letter-spacing: 0.2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .cassell-badge-pill {
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37 0%, #B48A1E 100%);
      color: #07110D;
      font-size: 8.5px;
      font-weight: 900;
      padding: 0.5px 4px;
      border-radius: 2px;
      letter-spacing: 0.5px;
      margin-right: 1px;
    }
    .nb-right {
      font-family: "DIN Alternate", "Avenir Next Condensed", "SF Mono", "PingFang SC", monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #D4AF37;
    }
    /* 首页主楼标题栏（深色学院终端边框 + 红色置顶热帖标签） */
    .hero-memo-card {
      position: relative;
      margin-top: 0;
      margin-bottom: 6px;
      padding: 6px 6px 8px 6px;
      flex-shrink: 0;
      z-index: 2;
      background: rgba(13, 31, 24, 0.65);
      border-left: 2.5px solid #D4AF37;
      border-bottom: 1px solid rgba(212, 175, 55, 0.35);
    }
    .hero-sketch-box,
    .washi-tape,
    .dragon-watermark {
      display: none;
    }
    .hero-content {
      position: relative;
      z-index: 1;
    }
    .sketch-topic-tag {
      display: inline-block;
      background: #991B1B;
      border: 1px solid #EF4444;
      color: #FEF2F2;
      border-radius: 2px;
      font-size: 10px;
      font-weight: 800;
      padding: 0.5px 5px;
      margin-right: 6px;
      vertical-align: 1px;
    }
    .title-text {
      font-size: ${Math.round((fontSize + 1.0) * 10) / 10}px;
      font-weight: 850;
      line-height: 1.36;
      color: #FFFFFF;
    }
    /* 楼层容器 */
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
    /* 单个楼层：学院终端极简横线分隔 */
    .floor-item {
      position: relative;
      padding: 5px 4px 6px 4px;
    }
    .sketch-border-layer {
      position: absolute;
      inset: 0;
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 0;
      z-index: 0;
    }
    .floor-item.role-op .sketch-border-layer {
      background: rgba(212, 175, 55, 0.03);
      border-bottom: 1px solid rgba(212, 175, 55, 0.36);
    }
    .floor-item.role-special .sketch-border-layer {
      background: rgba(153, 27, 27, 0.06);
      border-bottom: 1px solid rgba(239, 68, 68, 0.42);
    }
    .floor-content-layer {
      position: relative;
      z-index: 1;
    }
    .floor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: nowrap;
      gap: 6px;
      margin-bottom: 3px;
    }
    .floor-user {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 5px;
      min-width: 0;
      overflow: hidden;
    }
    .avatar {
      width: 19px;
      height: 19px;
      flex-shrink: 0;
    }
    .avatar svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .author-name {
      font-size: 12.5px;
      font-weight: 750;
      color: #6EE7B7;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .role-op .author-name {
      color: #F3C65F;
      font-weight: 800;
    }
    .role-special .author-name {
      color: #FDE047;
      font-weight: 800;
    }
    .sketch-stamp {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 2px;
      line-height: 1.2;
      display: inline-block;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .stamp-op {
      background: rgba(212, 175, 55, 0.22);
      border: 0.5px solid rgba(243, 198, 95, 0.55);
      color: #FDE68A;
    }
    .stamp-special {
      background: rgba(185, 28, 28, 0.38);
      border: 0.5px solid rgba(248, 113, 113, 0.6);
      color: #FECACA;
    }
    .stamp-eva {
      background: rgba(5, 150, 105, 0.35);
      border: 0.5px solid #34D399;
      color: #A7F3D0;
    }
    .stamp-lion {
      background: rgba(153, 27, 27, 0.25);
      color: #FCA5A5;
    }
    .stamp-union {
      background: rgba(30, 58, 138, 0.45);
      color: #93C5FD;
    }
    .stamp-dept {
      background: rgba(16, 185, 129, 0.14);
      color: #A7F3D0;
    }
    .stamp-guild {
      background: rgba(148, 163, 184, 0.13);
      color: #94A3B8;
    }
    .floor-meta {
      flex-shrink: 0;
      white-space: nowrap;
    }
    .floor-num {
      font-family: "DIN Alternate", "SF Mono", monospace;
      font-size: 10.5px;
      font-weight: 700;
      color: #64748B;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .role-op .floor-num,
    .role-special .floor-num {
      color: #D4AF37;
    }
    .floor-body {
      padding-left: 0;
    }
    .floor-quote {
      padding: 2px 7px;
      margin-bottom: 3.5px;
      font-size: 12.5px;
      font-weight: 500;
      color: #94A3B8;
      background: rgba(255, 255, 255, 0.03);
      border-left: 2px solid rgba(212, 175, 55, 0.55);
    }
    .floor-p {
      font-size: ${fontSize}px;
      font-weight: 450;
      -webkit-text-stroke: 0.1px currentColor;
      line-height: ${lineHeight};
      color: #E2ECE8;
      margin-bottom: 2.5px;
      letter-spacing: 0.15px;
      word-break: break-word;
    }
    .floor-p:last-child {
      margin-bottom: 0;
    }
    .role-op .floor-p,
    .role-special .floor-p {
      color: #F8FAFC;
    }
    .marker-highlight {
      color: #FDE68A;
      background: rgba(212, 175, 55, 0.14);
      padding: 0 1px;
      border-radius: 2px;
      font-weight: 600;
    }
    .inline-code {
      font-family: "SF Mono", "Menlo", monospace;
      font-size: ${Math.round((fontSize - 1) * 10) / 10}px;
      background: rgba(212, 175, 55, 0.15);
      color: #F3C65F;
      border-radius: 2px;
      padding: 0 4px;
      font-weight: 600;
    }
    .mention {
      color: #F87171;
      font-weight: 700;
    }
    .system-notice {
      position: relative;
      padding: 5px 10px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: #F3C65F;
      background: rgba(11, 28, 21, 0.88);
      border: 1px solid rgba(212, 175, 55, 0.42);
      border-radius: 3px;
    }
    .ending-archive-card {
      margin-top: 6px;
      position: relative;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(11, 26, 20, 0.85);
      border: 1px solid rgba(212, 175, 55, 0.22);
      border-left: 2.5px solid #D4AF37;
      border-radius: 3px;
    }
    .ending-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ending-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #F3C65F;
    }
    .ending-stats {
      font-size: 10px;
      font-weight: 500;
      color: #8FA89E;
    }
    .ending-stamp {
      background: rgba(153, 27, 27, 0.28);
      border: 1px solid rgba(239, 68, 68, 0.55);
      color: #FECACA;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 2px;
    }
    .sketch-footer {
      height: 15px;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      font-weight: 600;
      color: #64748B;
      padding: 0 2px;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }
    .sketch-doodle-line {
      flex: 1;
      margin: 0 8px;
      height: 1px;
      background: rgba(212, 175, 55, 0.14);
    }
    /* ==================== 《龙族》卡塞尔守夜人讨论区专属封面 (00-封面.png) ==================== */
    #card-cover {
      width: 375px;
      height: 500px;
      background-color: #07110D;
      background-image:
        radial-gradient(circle at 50% 32%, rgba(16, 185, 129, 0.12) 0%, rgba(212, 175, 55, 0.06) 42%, transparent 72%);
      padding: 16px;
      border-top: none;
      display: flex;
    }
    .dragon-cover-outer-frame {
      flex: 1;
      border: 1.5px solid #D4AF37;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 26px 18px 22px 18px;
      background-color: rgba(7, 17, 13, 0.92);
    }
    .dragon-cover-outer-frame::before {
      content: "";
      position: absolute;
      inset: 5px;
      border: 0.5px solid rgba(212, 175, 55, 0.38);
      pointer-events: none;
    }
    .dragon-cover-corner {
      position: absolute;
      width: 10px;
      height: 10px;
      border-color: #F3C65F;
      pointer-events: none;
    }
    .dragon-cover-top-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .dragon-cover-top-meta {
      font-family: "DIN Alternate", "SF Mono", monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.8px;
      color: #D4AF37;
    }
    .dragon-cover-top-sub {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 2.5px;
      color: #34D399;
      margin-top: -4px;
    }
    .dragon-cover-center-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 14px;
      margin: auto 0;
    }
    .dragon-cover-topic-pill {
      background: linear-gradient(90deg, #7F1D1D 0%, #991B1B 50%, #7F1D1D 100%);
      border: 1px solid #EF4444;
      color: #FEF2F2;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 11px;
      letter-spacing: 1px;
      border-radius: 2px;
    }
    .dragon-cover-main-title {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .dragon-cover-title-line-1 {
      font-size: 31px;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.25;
      letter-spacing: 0.8px;
      white-space: nowrap;
    }
    .dragon-cover-title-line-2 {
      font-size: 38px;
      font-weight: 900;
      color: #F3C65F;
      line-height: 1.25;
      letter-spacing: 1px;
      white-space: nowrap;
    }
    .dragon-cover-divider-line {
      width: 56px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #D4AF37, transparent);
      margin: 2px 0;
    }
    .dragon-cover-sub-text {
      font-size: 12.5px;
      font-weight: 500;
      color: #94A3B8;
      line-height: 1.6;
      max-width: 278px;
    }
    .dragon-cover-bottom-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 13px;
      border-top: 1px solid rgba(212, 175, 55, 0.28);
      font-size: 11px;
      font-weight: 600;
      color: #8FA89E;
    }
    .dragon-cover-footer-tag {
      color: #F3C65F;
      font-family: "DIN Alternate", "SF Mono", monospace;
      letter-spacing: 0.8px;
    }
  `;
}

function getDragonCoverSubText(parsed, cleanTitle = '') {
  if (cleanTitle.includes('矿工')) {
    return '“咱不能拿业余的爱好，去挑战人家让人腿软的本职工作。”';
  }
  for (const f of parsed.floors) {
    for (const p of f.paragraphs) {
      const m = p.match(/「([^」]{12,42})」/);
      if (m) return `“${m[1]}”`;
    }
  }
  return '“守夜人讨论区年度红色置顶热帖 · 诺玛主控终端全量归档。”';
}

function renderDragonCoverCardHTML(parsed, titleTag, cleanTitle) {
  const opFloor = parsed.floors.find((f) => f.isOP) || parsed.floors[0];
  const { line1, line2, size1, size2 } = splitDragonCoverTitle(cleanTitle);
  const subText = getDragonCoverSubText(parsed, cleanTitle);

  return `
    <div class="xhs-card" id="card-cover">
      <div class="dragon-cover-outer-frame">
        <div class="dragon-cover-top-header">
          ${getYggdrasilCrestSVG(82, false)}
          <div class="dragon-cover-top-meta">CASSELL COLLEGE · 守夜人讨论区</div>
          <div class="dragon-cover-top-sub">NIGHT WATCHER FORUM // NORMA SYSTEM</div>
        </div>

        <div class="dragon-cover-center-hero">
          <div class="dragon-cover-topic-pill">🔥 #${formatInlineMarkdown(titleTag)} · 灌水版红色置顶</div>
          <div class="dragon-cover-main-title">
            <div class="dragon-cover-title-line-1" style="font-size: ${size1}px;">${formatInlineMarkdown(line1)}</div>
            <div class="dragon-cover-title-line-2" style="font-size: ${size2}px;">${formatInlineMarkdown(line2)}</div>
          </div>
          <div class="dragon-cover-divider-line"></div>
          <div class="dragon-cover-sub-text">${formatInlineMarkdown(subText)}</div>
        </div>

        <div class="dragon-cover-bottom-footer">
          <span>楼主：${formatInlineMarkdown(opFloor.author)}</span>
          <span class="dragon-cover-footer-tag">${parsed.floors.length - 1} REPLIES &gt;&gt;&gt;</span>
        </div>
      </div>
    </div>
  `;
}

function getDragonPageMeta(parsed) {
  return {
    topbarLeftHTML: `${getYggdrasilCrestSVG(15, false)}<span class="cassell-badge-pill">CASSELL</span><span>${formatInlineMarkdown(parsed.boardName)}</span>`,
    footerLeftText: '🌳 NIGHT WATCHER · 卡塞尔守夜人讨论区',
    footerNextText: 'NEXT >>>',
    footerEndText: '[ LOCKED BY WATCHER ]',
    endingTitleText: '🌳 守夜人讨论区 · 灌水版传奇热帖归档',
    endingStatsText: `共 ${parsed.floors.length - 1} 条回帖 · 诺玛系统校验通过`,
    endingStampText: '守夜人锁定',
    pageBgWatermarkHTML: getDragonPageBgWatermarkHTML(),
    heroWatermarkHTML: `<div class="dragon-watermark"></div>`,
  };
}

module.exports = {
  categoryId: 'dragon',
  categoryName: '龙族（卡塞尔学院·守夜人讨论区暗金墨绿终端风）',
  DRAGON_THEME,
  SPECIAL_DRAGON_AUTHORS,
  isDragonContent,
  isSpecialDragonAuthor,
  getYggdrasilCrestSVG,
  getDragonPageBgWatermarkHTML,
  getAvatarSVG: getDragonAvatarSVG,
  getBadgeHTML: getDragonBadgeHTML,
  buildCSS: buildDragonForumCSS,
  renderCoverCardHTML: renderDragonCoverCardHTML,
  getPageMeta: getDragonPageMeta,
};
