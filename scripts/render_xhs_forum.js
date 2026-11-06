#!/usr/bin/env node
/**
 * 小红书「论坛体小说」高清图片生成器 (手绘草稿手账风 · 多色系/随机配色 · 移动端大字版)
 *
 * 视觉风格（去 AI 感 · 纯正手绘草稿本风）：
 *   1. 彻底摒弃 AI 模板常见的光泽渐变、模糊阴影、胶囊按钮与系统 Emoji。
 *   2. 采用 SVG 手绘钢笔抖动滤镜 (feTurbulence + feDisplacementMap) 渲染卡片线框、胶带与印章，
 *      每一根线条都有真实的钢笔手绘不规则感，而正文文字保持 100% 锐利清晰。
 *   3. 方格草稿纸底纹 + 马克笔平涂错位硬阴影 + 手绘和纸胶带 + 荧光笔半涂抹台词高亮 + 简笔画涂鸦头像。
 *   4. 默认采用「暖杏甜橘 (warm-orange)」色系，同时支持 7 套预设色系、--random 随机色系与 --color 自定义色系。
 *
 * 用法示例：
 *   node "./工具/生成小红书论坛体图片.js" "./小说/咬痕与匿名帖/咬痕与匿名帖.md"
 *   node "./工具/生成小红书论坛体图片.js" "./小说/咬痕与匿名帖/咬痕与匿名帖.md" --theme=mist-blue
 *   node "./工具/生成小红书论坛体图片.js" "./小说/咬痕与匿名帖/咬痕与匿名帖.md" --random
 *   node "./工具/生成小红书论坛体图片.js" "./小说/咬痕与匿名帖/咬痕与匿名帖.md" --color=#D96B43
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadPlaywright() {
  const candidates = [
    'playwright',
    '/Users/bytedance/.nvm/versions/node/v24.14.1/lib/node_modules/@playwright/cli/node_modules/playwright',
  ];
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    candidates.push(path.join(globalRoot, 'playwright'));
    candidates.push(path.join(globalRoot, '@playwright/cli/node_modules/playwright'));
  } catch (_) {}

  for (const modPath of candidates) {
    try {
      return require(modPath);
    } catch (_) {}
  }
  throw new Error('未找到 playwright 模块，请检查 Node 环境。');
}

function hexToHue(hex) {
  let clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return Math.round(h * 360);
}

/**
 * 根据色相角 (Hue 0~360) 生成全套「手绘草稿水彩/马克笔」配色方案
 */
function createSketchThemeFromHue(hue, customMeta = {}) {
  const h = ((Math.round(hue) % 360) + 360) % 360;

  return {
    id: customMeta.id || `hue-${h}`,
    label: customMeta.label || `手绘自定义色系 (Hue=${h}°)`,
    // 草稿纸底色与方格线颜色
    paperBg: customMeta.paperBg || `hsl(${h}, 38%, 96.2%)`,
    gridLine: customMeta.gridLine || `hsla(${h}, 28%, 76%, 0.38)`,
    marginLine: customMeta.marginLine || `hsla(${h}, 55%, 68%, 0.42)`,
    // 钢笔墨水主色（深暖褐/炭黑，不用死黑）
    inkColor: customMeta.inkColor || '#362E29',
    inkMuted: customMeta.inkMuted || '#7A6E65',
    // 马克笔主色与高光色
    markerSolid: customMeta.markerSolid || `hsl(${h}, 76%, 62%)`,
    markerDeep: customMeta.markerDeep || `hsl(${h}, 72%, 38%)`,
    markerSoft: customMeta.markerSoft || `hsl(${h}, 82%, 88%)`,
    highlighter: customMeta.highlighter || `hsla(${h}, 90%, 74%, 0.52)`,
    // 卡片填充与硬错位阴影
    opCardFill: customMeta.opCardFill || `hsl(${h}, 65%, 97.8%)`,
    opShadow: customMeta.opShadow || `hsl(${h}, 62%, 80%)`,
    anonCardFill: '#FFFEFC',
    anonShadow: customMeta.anonShadow || `hsl(${h}, 26%, 85%)`,
    // 和纸胶带颜色
    tapeBg: customMeta.tapeBg || `hsla(${h}, 78%, 78%, 0.62)`,
    tapeStripe: customMeta.tapeStripe || `hsla(${h}, 70%, 58%, 0.25)`,
    // 男主深色炭笔速写卡
    darkCardFill: customMeta.darkCardFill || '#282422',
    darkCardShadow: customMeta.darkCardShadow || `hsl(${h}, 45%, 72%)`,
    darkAccent: customMeta.darkAccent || '#F6AD55',
  };
}

/**
 * 7 套内置手绘水彩/马克笔主题色系（默认 warm-orange 暖杏甜橘）
 */
const PRESET_THEMES = {
  'warm-orange': createSketchThemeFromHue(22, {
    id: 'warm-orange',
    label: '暖杏甜橘（默认手账暖调）',
    paperBg: '#FAF4EB',
    gridLine: 'rgba(210, 190, 168, 0.38)',
    marginLine: 'rgba(235, 145, 105, 0.35)',
    inkColor: '#362D26',
    inkMuted: '#7D6F63',
    markerSolid: '#F27D42',
    markerDeep: '#B84A18',
    markerSoft: '#FFE3CE',
    highlighter: 'rgba(255, 182, 130, 0.52)',
    opCardFill: '#FFFDF9',
    opShadow: '#F2C09E',
    anonShadow: '#E5D8C7',
    tapeBg: 'rgba(255, 190, 145, 0.58)',
    tapeStripe: 'rgba(230, 115, 55, 0.22)',
    darkCardFill: '#2A2522',
    darkCardShadow: '#D8B89E',
    darkAccent: '#F8B462',
  }),
  'mist-blue': createSketchThemeFromHue(206, {
    id: 'mist-blue',
    label: '雾凇冰蓝（冷白钢笔速写）',
  }),
  'rose-quartz': createSketchThemeFromHue(345, {
    id: 'rose-quartz',
    label: '微醺烟粉（干枯玫瑰手账）',
  }),
  'matcha-sage': createSketchThemeFromHue(145, {
    id: 'matcha-sage',
    label: '竹影青提（森系水彩草稿）',
  }),
  'taro-purple': createSketchThemeFromHue(262, {
    id: 'taro-purple',
    label: '暮山香芋（灰紫钢笔手札）',
  }),
  'caramel-latte': createSketchThemeFromHue(32, {
    id: 'caramel-latte',
    label: '焦糖拿铁（复古牛皮纸风）',
    paperBg: '#F6EFE4',
  }),
  'berry-wine': createSketchThemeFromHue(356, {
    id: 'berry-wine',
    label: '浆果红酒（复古红黑手账）',
  }),
  'glory-gold': {
    id: 'glory-gold',
    label: '荣耀鎏金（全职高手·荣耀官方论坛专属配色）',
    isGloryTheme: true,
    // 战术羊皮白底纸 + 浅金蓝坐标网格
    paperBg: '#F6F4EE',
    gridLine: 'rgba(30, 50, 92, 0.08)',
    marginLine: 'rgba(212, 160, 42, 0.35)',
    // 钢笔墨水主色（深邃玄铁蓝黑）
    inkColor: '#1B2536',
    inkMuted: '#5A677D',
    // 荣耀鎏金 + 斗神绯红马克笔色
    markerSolid: '#D99B26',
    markerDeep: '#A82E22',
    markerSoft: '#FFF0C2',
    highlighter: 'rgba(255, 206, 84, 0.58)',
    // 楼主卡片（暖白鎏金）与普通水友卡片（清爽剑白+深蓝灰硬阴影）
    opCardFill: '#FFFDF7',
    opShadow: '#E2B857',
    anonCardFill: '#FFFFFF',
    anonShadow: '#C5D0E0',
    // 荣耀深蓝鎏金斜纹胶带
    tapeBg: 'rgba(27, 43, 72, 0.85)',
    tapeStripe: 'rgba(217, 155, 38, 0.42)',
    // 职业选手实名认证卡（荣耀皇家深蓝黑金卡）
    darkCardFill: '#182438',
    darkCardShadow: '#D99B26',
    darkAccent: '#F5C451',
    // 荣耀深蓝顶栏配色
    topbarBg: '#162338',
    topbarBorder: '#D99B26',
    topbarText: '#F8F4E6',
    topbarAccent: '#F5C451',
  },
};

function resolveTheme(options = {}, mdContent = '') {
  if (options.color) {
    const hue = hexToHue(options.color);
    return createSketchThemeFromHue(hue, {
      id: `custom-${options.color}`,
      label: `自定义手绘色号 (${options.color} -> Hue=${hue}°)`,
    });
  }
  if (options.hue !== null && options.hue !== undefined && !Number.isNaN(options.hue)) {
    return createSketchThemeFromHue(options.hue, {
      id: `hue-${options.hue}`,
      label: `自定义手绘色相 (Hue=${options.hue}°)`,
    });
  }
  if (options.random || options.theme === 'random') {
    const randomHue = Math.floor(Math.random() * 360);
    return createSketchThemeFromHue(randomHue, {
      id: `random-hue-${randomHue}`,
      label: `随机生成手绘色系 (可通过 --hue=${randomHue} 复现)`,
    });
  }
  if (options.theme && PRESET_THEMES[options.theme]) {
    return PRESET_THEMES[options.theme];
  }
  const mdThemeMatch = mdContent.match(/<!--\s*theme:\s*([a-zA-Z0-9-#]+)\s*-->/);
  if (mdThemeMatch) {
    const val = mdThemeMatch[1].trim();
    if (PRESET_THEMES[val]) return PRESET_THEMES[val];
    if (val.startsWith('#')) return createSketchThemeFromHue(hexToHue(val));
  }
  // 若帖子版块或内容属于《全职高手》荣耀论坛，自动启用荣耀鎏金主题
  if (mdContent.includes('荣耀官方论坛') || mdContent.includes('一叶之秋') || mdContent.includes('唐三打')) {
    return PRESET_THEMES['glory-gold'];
  }
  // 默认使用暖杏甜橘
  return PRESET_THEMES['warm-orange'];
}

function parseForumMarkdown(mdContent) {
  let boardName = '内部论坛 > 树洞互助区';
  let title = '';
  const blocks = mdContent.replace(/\r\n/g, '\n').split(/\n---\n/);

  const headerBlock = blocks[0] || '';
  const headerLines = headerBlock.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of headerLines) {
    const clean = line.replace(/^\*\*|\*\*$/g, '').trim();
    if (clean.startsWith('【') && clean.endsWith('】') && !clean.includes('0L')) {
      boardName = clean.slice(1, -1).trim();
    } else if (clean.startsWith('标题：') || clean.startsWith('标题:')) {
      title = clean.replace(/^标题[：:]\s*/, '').trim();
    }
  }

  const isGloryForum =
    boardName.includes('荣耀') || mdContent.includes('一叶之秋') || mdContent.includes('唐三打');

  const MAJIA_AUTHORS = new Set([
    '风城追剧人',
    '夜雨声烦烦烦',
    '暗无天日_今天也在加班',
    '魔剑士不语',
  ]);

  const floors = [];
  const systemNotices = [];

  for (const rawBlock of blocks) {
    const blockLines = rawBlock.split('\n');
    let currentFloor = null;

    for (let i = 0; i < blockLines.length; i++) {
      const rawLine = blockLines[i];
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('<!--')) continue;

      const sysMatch =
        trimmed.match(/^>\s*\*\*【(.*?)】\*\*$/) ||
        trimmed.match(/^\*\*【(本帖已被.*?)】\*\*$/);
      if (sysMatch && !currentFloor) {
        systemNotices.push(sysMatch[1].trim());
        continue;
      }

      const floorMatch = trimmed.match(/^\*\*【(\d+L(?:\s*（主楼）|\s*\(主楼\))?)\s+(.+?)】\*\*(?:[｜|]\s*(.+))?$/);
      if (floorMatch) {
        const floorNum = floorMatch[1].replace(/（主楼）|\(主楼\)/g, '').trim();
        let rawAuthor = floorMatch[2].trim();
        const timeText = floorMatch[3] ? floorMatch[3].trim() : '';

        let isOP = false;
        if (rawAuthor.includes('（楼主）') || rawAuthor.includes('(楼主)')) {
          isOP = true;
          rawAuthor = rawAuthor.replace(/（楼主）|\(楼主\)/g, '').trim();
        }

        let isAnon = false;
        let isSpecialUser = false;
        let isMajia = false;

        if (isGloryForum) {
          // 荣耀论坛模式：带 V 认证或战队前缀的实名选手为深蓝黑金卡，职业选手小号带马甲章，其余水友为普通白卡
          isSpecialUser = !isOP && (rawAuthor.endsWith('V') || /^(轮回|呼啸|兴欣|蓝雨|微草|霸图|烟雨|百花)-/.test(rawAuthor));
          isMajia = !isOP && !isSpecialUser && MAJIA_AUTHORS.has(rawAuthor);
          isAnon = !isOP && !isSpecialUser;
        } else {
          isAnon = rawAuthor === '匿名用户' || rawAuthor.startsWith('匿名');
          isSpecialUser = !isOP && !isAnon;
        }

        currentFloor = {
          floorNum,
          numInt: parseInt(floorNum, 10) || 0,
          author: rawAuthor,
          timeText,
          isOP,
          isAnon,
          isSpecialUser,
          isMajia,
          isGloryForum,
          quotes: [],
          paragraphs: [],
        };
        floors.push(currentFloor);
        continue;
      }

      if (!currentFloor) continue;

      if (sysMatch) {
        systemNotices.push(sysMatch[1].trim());
        continue;
      }

      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '').trim();
        if (quoteText) {
          currentFloor.quotes.push(quoteText);
        }
        continue;
      }

      currentFloor.paragraphs.push(trimmed);
    }
  }

  for (const f of floors) {
    if (!f.isOP && f.paragraphs.length > 1) {
      const merged = [];
      for (const p of f.paragraphs) {
        if (merged.length > 0 && merged[merged.length - 1].length + p.length <= 46) {
          merged[merged.length - 1] += ' ' + p;
        } else {
          merged.push(p);
        }
      }
      f.paragraphs = merged;
    }
  }

  return {
    boardName,
    title: title || '匿名树洞求助帖',
    floors,
    systemNotices,
    isGloryForum,
  };
}

function formatInlineMarkdown(text, isSpecialCard = false) {
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/`(.+?)`/g, '<span class="inline-code">$1</span>');
  escaped = escaped.replace(/@([^\s，。！？、：；]+)/g, '<span class="mention">@$1</span>');

  if (!isSpecialCard) {
    escaped = escaped.replace(/「([^」]+)」/g, '<span class="marker-highlight">「$1」</span>');
  }

  return escaped;
}

/**
 * 《全职高手》官方原版【荣耀 GLORY】徽章 SVG（依据官方设定图还原：中心机械齿轮 + 六芒星法阵 + 分层机械黄金双翼 + X形交叉双剑）
 */
function getGloryLogoSVG(size = 16, isWatermark = false) {
  const opacityAttr = isWatermark ? 'opacity="0.12"' : '';
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" ${opacityAttr} style="vertical-align: -3px; flex-shrink: 0;">
      <!-- X形交叉银色西洋双剑 (Sword Blades & Hilts) -->
      <path d="M26 6L94 74M94 6L26 74" stroke="#CBD5E1" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M22 14L34 2M86 2L98 14" stroke="#F5C451" stroke-width="2.5" stroke-linecap="round"/>
      <!-- 左右分层机械黄金双翼 (Layered Mechanical Golden Wings) -->
      <path d="M44 34L4 16L14 29L2 32L16 41L8 46L26 50L18 56L45 52Z" fill="#F5C451" stroke="#B47B16" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M76 34L116 16L106 29L118 32L104 41L112 46L94 50L102 56L75 52Z" fill="#F5C451" stroke="#B47B16" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- 中心机械齿轮外环 (Central Mechanical Gear) -->
      <circle cx="60" cy="40" r="22" fill="#111827" stroke="#F5C451" stroke-width="3" stroke-dasharray="5 3"/>
      <circle cx="60" cy="40" r="18" fill="#0B111E" stroke="#D99B26" stroke-width="1.6"/>
      <!-- 内部发光六芒星法阵 (Inner Glowing Hexagram) -->
      <polygon points="60,24 73,47 47,47" stroke="#F59E0B" stroke-width="1.5" fill="rgba(245, 158, 11, 0.12)"/>
      <polygon points="60,56 73,33 47,33" stroke="#F59E0B" stroke-width="1.5" fill="rgba(245, 158, 11, 0.12)"/>
      <!-- 中心圣剑纵贯 -->
      <path d="M60 8L63 22V62L60 74L57 62V22L60 8Z" fill="#F8FAFC" stroke="#D99B26" stroke-width="1.2"/>
      <circle cx="60" cy="40" r="3.2" fill="#EF4444" stroke="#FEF08A" stroke-width="1"/>
    </svg>
  `;
}

let cachedGloryBgDataURI = null;
function getGloryOfficialLogoDataURI() {
  if (cachedGloryBgDataURI !== null) return cachedGloryBgDataURI;
  const candidates = [
    path.join(__dirname, 'assets', 'glory-clean-crest.png'),
    path.join(__dirname, 'assets', 'glory-main.jpg'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const ext = p.endsWith('.png') ? 'png' : 'jpeg';
        const b64 = fs.readFileSync(p).toString('base64');
        cachedGloryBgDataURI = `data:image/${ext};base64,${b64}`;
        return cachedGloryBgDataURI;
      }
    } catch (_) {}
  }
  cachedGloryBgDataURI = '';
  return cachedGloryBgDataURI;
}

/**
 * 页面背景正中央的大幅《全职高手·荣耀 GLORY》官方正版标志水印
 */
function getGloryPageBgWatermarkHTML() {
  const dataURI = getGloryOfficialLogoDataURI();
  if (dataURI) {
    return `
      <div class="glory-page-bg-logo">
        <img src="${dataURI}" alt="GLORY" class="glory-bg-img" />
      </div>
    `;
  }
  return `
    <div class="glory-page-bg-logo">
      ${getGloryLogoSVG(260, true)}
    </div>
  `;
}

/**
 * 《全职高手》硬核电竞六边形装甲头像（Hexagon Esports Crest SVG，零手绘感）
 */
function getGloryEsportsAvatarSVG(floor) {
  const author = floor.author || '';
  const hexOuter = 'M18 2L32 10V26L18 34L4 26V10L18 2Z';
  const hexInner = 'M18 4.8L29.5 11.4V24.6L18 31.2L6.5 24.6V11.4L18 4.8Z';

  // 1. 斗神一叶之秋 / 孙翔 / 楼主（赤红鎏金六边形 + 战矛却邪）
  if (author.includes('孙翔') || floor.isOP || author.includes('一叶')) {
    const bgFill = floor.isSpecialUser ? '#8B1E1E' : '#182438';
    const accent = '#F5C451';
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="${accent}" stroke-width="1.8"/>
        <path d="${hexInner}" fill="${bgFill}"/>
        <path d="M10 26L25 11" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="square"/>
        <path d="M27.5 8.5L20.5 11L25 15.5L27.5 8.5Z" fill="${accent}"/>
        <path d="M15 15L21 21" stroke="${accent}" stroke-width="1.8"/>
        <rect x="9.5" y="11.5" width="3" height="3" transform="rotate(45 9.5 11.5)" fill="${accent}"/>
      </svg>`;
  }

  // 2. 第一流氓唐三打 / 唐昊 / 呼啸山庄（暗夜黑红六边形 + 血祭绝魂三道钢爪）
  if (author.includes('唐昊') || author.includes('呼啸')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#F5C451" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#1E293B"/>
        <path d="M9 24L22 9M13.5 26L25.5 12M18 27.5L28 16" stroke="#EF4444" stroke-width="2.3" stroke-linecap="square"/>
        <path d="M8 21L15 28L11.5 29.5L6.5 24.5Z" fill="#F5C451"/>
      </svg>`;
  }

  // 3. 兴欣-叶修V（兴欣赤金六边形 + 千机伞机械几何纹章）
  if (author.includes('叶修') || author.includes('兴欣')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#F5C451" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#991B1B"/>
        <path d="M8 18.5L18 10L28 18.5L18 16.5L8 18.5Z" fill="#F5C451"/>
        <path d="M18 8V27.5" stroke="#FFFFFF" stroke-width="2.2"/>
        <path d="M14.5 25.5H21.5" stroke="#F5C451" stroke-width="1.8"/>
      </svg>`;
  }

  // 4. 轮回 / 江波涛 / 枪王（深海蓝金六边形 + 波动十字星芒/双枪）
  if (author.includes('江波涛') || author.includes('魔剑') || author.includes('轮回') || author.includes('枪王')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#38BDF8" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#0C4A6E"/>
        <path d="M18 7L20.8 15.2L29 18L20.8 20.8L18 29L15.2 20.8L7 18L15.2 15.2L18 7Z" fill="#F5C451"/>
        <circle cx="18" cy="18" r="2.2" fill="#0F172A"/>
      </svg>`;
  }

  // 5. 蓝雨 / 黄少天 / 索克萨尔 / 蓝溪阁（冰蓝六边形 + 冰雨光剑）
  if (author.includes('夜雨') || author.includes('索克萨尔') || author.includes('蓝溪阁')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#60A5FA" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#1E3A8A"/>
        <path d="M18 6L20 11V24H16V11L18 6Z" fill="#E0F2FE"/>
        <path d="M11 23H25L23 25.5H13L11 23Z" fill="#F5C451"/>
        <rect x="16.8" y="25.5" width="2.4" height="4.5" fill="#F5C451"/>
      </svg>`;
  }

  // 6. 百花谷（绯红六边形 + 繁花十字准星）
  if (author.includes('百花')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#F472B6" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#831843"/>
        <circle cx="18" cy="18" r="6" stroke="#F5C451" stroke-width="1.8"/>
        <path d="M18 9V27M9 18H27" stroke="#FBCFE8" stroke-width="1.6"/>
        <circle cx="18" cy="18" r="2" fill="#F5C451"/>
      </svg>`;
  }

  // 7. 烟雨 / 楚云秀（紫金六边形 + 元素法杖晶石）
  if (author.includes('风城') || author.includes('烟雨')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#C084FC" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#4C1D95"/>
        <path d="M18 8L24 16L18 24L12 16L18 8Z" fill="#E9D5FF" stroke="#F5C451" stroke-width="1.4"/>
        <circle cx="18" cy="16" r="2.2" fill="#F5C451"/>
      </svg>`;
  }

  // 8. 霸图 / 嘉世 / 通用神之领域水友（黑金六边形 + 荣耀账号卡芯片纹章）
  return `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${hexOuter}" fill="#0F172A" stroke="#D99B26" stroke-width="1.8"/>
      <path d="${hexInner}" fill="#1E293B"/>
      <rect x="9" y="12" width="18" height="12" rx="1.5" fill="#0F172A" stroke="#F5C451" stroke-width="1.5"/>
      <path d="M9 16H27" stroke="#D99B26" stroke-width="1.5"/>
      <rect x="11.5" y="18.2" width="3.5" height="3.5" fill="#EF4444"/>
      <path d="M17 19H24M17 21.5H22" stroke="#E2E8F0" stroke-width="1.3"/>
    </svg>`;
}

/**
 * 获取《全职高手》荣耀论坛专属阵营/角色/战队电竞标签
 */
function getGloryFactionBadgeHTML(floor) {
  const author = floor.author || '';
  if (floor.isOP) {
    return '<span class="sketch-stamp stamp-op">楼主</span>';
  }
  if (floor.isSpecialUser) {
    if (author.includes('孙翔') || author.includes('江波涛') || author.includes('轮回')) {
      return '<span class="sketch-stamp stamp-special">轮回战队</span>';
    }
    if (author.includes('唐昊') || author.includes('呼啸')) {
      return '<span class="sketch-stamp stamp-special">呼啸战队</span>';
    }
    if (author.includes('叶修') || author.includes('兴欣')) {
      return '<span class="sketch-stamp stamp-special">兴欣战队</span>';
    }
    return '<span class="sketch-stamp stamp-special">职业认证</span>';
  }
  if (author.includes('风城') || author.includes('烟雨')) return '<span class="sketch-stamp stamp-guild">烟雨楼</span>';
  if (author.includes('夜雨') || author.includes('索克萨尔') || author.includes('蓝溪阁')) return '<span class="sketch-stamp stamp-guild">蓝溪阁</span>';
  if (author.includes('暗无天日') || author.includes('呼啸')) return '<span class="sketch-stamp stamp-guild">呼啸山庄</span>';
  if (author.includes('魔剑士') || author.includes('一叶') || author.includes('轮回') || author.includes('枪王')) return '<span class="sketch-stamp stamp-guild">轮回谷</span>';
  if (author.includes('百花')) return '<span class="sketch-stamp stamp-guild">百花谷</span>';
  if (author.includes('霸图')) return '<span class="sketch-stamp stamp-guild">霸气雄图</span>';
  if (author.includes('嘉王朝')) return '<span class="sketch-stamp stamp-guild">嘉王朝</span>';
  const defaultGuilds = ['兴欣公会', '中草堂', '踏破虚空', '义斩天下'];
  return `<span class="sketch-stamp stamp-guild">${defaultGuilds[floor.numInt % defaultGuilds.length]}</span>`;
}

/**
 * 头像渲染路由（荣耀模式走硬核六边形电竞装甲徽章，其他模式保留通用图标）
 */
function getHandDrawnAvatarSVG(floor, theme) {
  const ink = theme.inkColor;

  if (theme.isGloryTheme || floor.isGloryForum) {
    return getGloryEsportsAvatarSVG(floor);
  }

  if (floor.isOP) {
    // 楼主：手绘简笔画小柑橘 + 叶子 + 三道脸红斜线
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="21" r="10" fill="${theme.markerSoft}"/>
        <path d="M18 11C11.5 11.2 8.2 15.8 8.5 21.5C8.8 27.2 13.2 30.5 19 30.2C24.8 29.9 28.5 25.8 28.2 20.2C27.9 14.6 23.8 10.8 18 11Z" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M18 11C18.2 8.2 21.5 6.2 24.2 7.5C23.5 9.8 20.5 11.2 18 11Z" fill="#88C070" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="14.5" cy="19.8" r="1.3" fill="${ink}"/>
        <circle cx="21.8" cy="19.5" r="1.3" fill="${ink}"/>
        <path d="M16.8 22.2C17.6 23.1 19.1 23 19.8 22" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M11.5 22L12.5 23.2M13 22L14 23.2M23 21.5L24 22.8" stroke="${theme.markerSolid}" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (floor.isSpecialUser) {
    // 男主小号：手绘速写小黑豹（左耳带小缺口）+ 金色眼神
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 28L9.5 10.5L14.5 15.2H21.5L26.5 10.2L28 28Z" fill="#1F1B18" stroke="#F4EFE6" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M9.2 12.8L11.8 13.5" stroke="#2A2522" stroke-width="2.2"/>
        <circle cx="14.8" cy="20.5" r="1.7" fill="${theme.darkAccent}"/>
        <circle cx="21.2" cy="20.5" r="1.7" fill="${theme.darkAccent}"/>
        <path d="M13.5 18.2L16.2 19.2M22.5 18.2L19.8 19.2" stroke="#F4EFE6" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    `;
  }

  // 吃瓜群众：4 种简笔画火柴人/涂鸦小表情轮换
  const styleIdx = floor.numInt % 4;
  const spotColors = ['#FFE4C4', '#DCEEF2', '#E8E2F4', '#E2F0CB'];
  const spot = spotColors[styleIdx];

  if (styleIdx === 0) {
    // 简笔画小猫耳涂鸦
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="19.5" cy="20.5" r="9.5" fill="${spot}"/>
        <path d="M10 17L11.5 10.5L15.8 14.2C17.2 13.8 19 13.8 20.5 14.2L24.8 10.2L26.2 17C27.5 20.5 26.2 26.8 21.5 28.2C16.8 29.5 12.2 28.2 10.5 24.8C9.2 22.2 9.5 19 10 17Z" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="15" cy="20.5" r="1.2" fill="${ink}"/>
        <circle cx="21" cy="20.5" r="1.2" fill="${ink}"/>
        <path d="M17.2 22.5L18.2 23.3L19.2 22.5" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`;
  } else if (styleIdx === 1) {
    // 简笔画圆框眼镜吃瓜小人
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17" cy="20" r="9.5" fill="${spot}"/>
        <path d="M18 10.5C12.5 10.8 9.2 15.2 9.5 20.8C9.8 26.2 14.2 29.2 19.2 28.8C24.5 28.4 27.5 24.2 27.2 19.2C26.9 14.2 23.2 10.2 18 10.5Z" stroke="${ink}" stroke-width="1.6"/>
        <circle cx="14.5" cy="19.5" r="2.8" stroke="${ink}" stroke-width="1.4"/>
        <circle cx="21.5" cy="19.5" r="2.8" stroke="${ink}" stroke-width="1.4"/>
        <path d="M17.3 19.5H18.7" stroke="${ink}" stroke-width="1.4"/>
        <circle cx="18" cy="24.2" r="1.3" stroke="${ink}" stroke-width="1.3"/>
      </svg>`;
  } else if (styleIdx === 2) {
    // 简笔画垂耳小兔涂鸦
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="19" cy="21" r="9" fill="${spot}"/>
        <path d="M14 13.5C11.2 13.8 8.5 18.5 9.5 22.5C10.2 25 11.8 23.5 12.2 21M22 13.5C24.8 13.8 27.5 18.5 26.5 22.5C25.8 25 24.2 23.5 23.8 21" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="18" cy="20.5" r="7.5" fill="#FFFEFC" stroke="${ink}" stroke-width="1.6"/>
        <circle cx="15.5" cy="19.8" r="1.2" fill="${ink}"/>
        <circle cx="20.5" cy="19.8" r="1.2" fill="${ink}"/>
        <path d="M17 22.2C17.6 22.8 18.4 22.8 19 22.2" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`;
  } else {
    // 简笔画呆毛吃瓜小人
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17.5" cy="20.5" r="9.5" fill="${spot}"/>
        <path d="M18 11.5C16.5 8.2 19.5 6.5 21 8.5" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M18 11.5C12.8 11.8 9.5 15.8 9.8 21C10.1 26.2 14.2 29 19 28.8C23.8 28.6 27.2 24.8 26.8 19.8C26.4 14.8 22.8 11.2 18 11.5Z" stroke="${ink}" stroke-width="1.6"/>
        <path d="M14 19.2H16M20 19.2H22" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M16.2 23.2C17.2 24 19.2 24 20.2 23" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>
      </svg>`;
  }
}

function renderFloorSliceHTML(floor, slice, theme) {
  let roleClass = 'role-anon';
  let badgeHTML = '';

  const isGlory = Boolean(theme.isGloryTheme || floor.isGloryForum);

  if (isGlory) {
    if (floor.isOP) {
      roleClass = 'role-op';
    } else if (floor.isSpecialUser) {
      roleClass = 'role-special';
    } else {
      roleClass = 'role-anon';
    }
    badgeHTML = getGloryFactionBadgeHTML(floor);
  } else {
    if (floor.isOP) {
      roleClass = 'role-op';
      badgeHTML = '<span class="sketch-stamp stamp-op">楼主</span>';
    } else if (floor.isSpecialUser) {
      roleClass = 'role-special';
      badgeHTML = '<span class="sketch-stamp stamp-special">刚注册</span>';
    } else {
      roleClass = 'role-anon';
      badgeHTML = '';
    }
  }

  const avatarSVG = getHandDrawnAvatarSVG(floor, theme);

  const quotesHTML = (slice.quotes || [])
    .map((q) => `<div class="floor-quote">↳ ${formatInlineMarkdown(q, floor.isSpecialUser)}</div>`)
    .join('');

  const paragraphsHTML = (slice.paragraphs || [])
    .map((p, pIdx) => `<p class="floor-p" data-p-idx="${pIdx}">${formatInlineMarkdown(p, floor.isSpecialUser)}</p>`)
    .join('');

  const baseLabel = floor.floorNum === '0L' ? '#0L 主楼' : `#${floor.floorNum}`;
  const floorLabel = slice.isCont ? `${baseLabel} (续)` : baseLabel;

  return `
    <div class="floor-item ${roleClass}" data-slice-id="${slice.sliceId || ''}">
      <div class="sketch-border-layer"></div>
      <div class="floor-content-layer">
        <div class="floor-header">
          <div class="floor-user">
            <div class="avatar">${avatarSVG}</div>
            <span class="author-name">${formatInlineMarkdown(floor.author, floor.isSpecialUser)}</span>
            ${badgeHTML}
          </div>
          <div class="floor-meta">
            <span class="floor-num">${floorLabel}</span>
          </div>
        </div>
        <div class="floor-body">
          ${quotesHTML}
          ${paragraphsHTML}
        </div>
      </div>
    </div>
  `;
}

/**
 * 全局公用 SVG 滤镜（让边框、胶带、印章产生真实的钢笔手绘微抖动，而文字不受影响）
 */
function buildGlobalSketchSVGDefs() {
  return `
    <svg width="0" height="0" style="position:absolute; pointer-events:none;">
      <defs>
        <filter id="sketch-wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    </svg>
  `;
}

function buildGloryEsportsCSS(theme, fontSize = 15.5, lineHeight = 1.48, cardGap = 7) {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background: #060911;
      font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
      color: #E2E8F0;
    }
    /* 375x500 手机原生视口 (3x 导出为 1125x1500 高清图)：荣耀深空暗金背景 + 中心巨幅荣耀Logo */
    .xhs-card {
      width: 375px;
      height: 500px;
      background-color: #080C15;
      background-image:
        radial-gradient(circle at 50% 52%, rgba(245, 196, 81, 0.11) 0%, rgba(15, 23, 42, 0.04) 52%, transparent 75%),
        linear-gradient(180deg, rgba(16, 24, 42, 0.85) 0%, rgba(8, 12, 21, 0.98) 100%);
      padding: 8px 10px 7px 10px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      border-top: 2px solid rgba(245, 196, 81, 0.75);
    }
    /* 页面背景正中央的《全职高手·荣耀 GLORY》大幅官方正版徽章水印（适中低透明度） */
    .glory-page-bg-logo {
      position: absolute;
      top: 52%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 355px;
      height: 220px;
      pointer-events: none;
      z-index: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      mix-blend-mode: screen;
      opacity: 0.24;
    }
    .glory-bg-img {
      width: 345px;
      height: auto;
      object-fit: contain;
      filter: contrast(1.28) brightness(0.95);
      -webkit-mask-image: radial-gradient(ellipse 68% 62% at 50% 50%, #000 55%, rgba(0,0,0,0.45) 82%, transparent 98%);
      mask-image: radial-gradient(ellipse 68% 62% at 50% 50%, #000 55%, rgba(0,0,0,0.45) 82%, transparent 98%);
    }
    /* 顶部极简荣耀论坛导航条 */
    .notebook-header {
      height: 24px;
      margin-bottom: 6px;
      padding: 0 4px 3px 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: transparent;
      border-bottom: 1px solid rgba(245, 196, 81, 0.28);
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }
    .nb-left {
      font-size: 11px;
      font-weight: 700;
      color: #CBD5E1;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .glory-badge-pill {
      display: inline-block;
      background: #F5C451;
      color: #080C15;
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
      color: #D99B26;
    }
    .glory-watermark {
      display: none;
    }
    /* 首页主楼极简标题栏（无外框，仅底部细金线分隔） */
    .hero-memo-card {
      position: relative;
      margin-top: 0;
      margin-bottom: 6px;
      padding: 6px 4px 8px 4px;
      flex-shrink: 0;
      z-index: 2;
    }
    .hero-sketch-box {
      position: absolute;
      inset: 0;
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(245, 196, 81, 0.32);
      z-index: 0;
    }
    .washi-tape {
      display: none;
    }
    .hero-content {
      position: relative;
      z-index: 1;
    }
    .sketch-topic-tag {
      display: inline-block;
      background: #DC2626;
      color: #FFFBEB;
      border-radius: 2px;
      font-size: 10.5px;
      font-weight: 800;
      padding: 0.5px 5px;
      margin-right: 6px;
      vertical-align: 1px;
    }
    .title-text {
      font-size: ${Math.round((fontSize + 1.2) * 10) / 10}px;
      font-weight: 850;
      line-height: 1.36;
      color: #FFFFFF;
    }
    /* 楼层卡片列表容器 */
    .floors-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: ${cardGap}px;
      overflow: hidden;
      position: relative;
      z-index: 2;
    }
    /* 单个楼层：无方框纯横线分隔（背景全透明，仅底部细横线隔开） */
    .floor-item {
      position: relative;
      padding: 6px 4px 8px 4px;
    }
    .sketch-border-layer {
      position: absolute;
      inset: 0;
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(245, 196, 81, 0.22);
      border-radius: 0;
      z-index: 0;
    }
    .floor-item.role-op .sketch-border-layer {
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(245, 196, 81, 0.32);
    }
    .floor-item.role-special .sketch-border-layer {
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(239, 68, 68, 0.4);
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
      padding-bottom: 0;
      border-bottom: none;
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
      color: #93C5FD;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .role-op .author-name {
      color: #F5C451;
      font-weight: 800;
    }
    .role-special .author-name {
      color: #FDE047;
      font-weight: 800;
    }
    /* 极简无边框胶囊标签 */
    .sketch-stamp {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 2px;
      line-height: 1.2;
      display: inline-block;
      white-space: nowrap;
      flex-shrink: 0;
      border: none;
    }
    .stamp-op {
      background: rgba(245, 196, 81, 0.2);
      color: #FDE68A;
    }
    .stamp-special {
      background: rgba(220, 38, 38, 0.35);
      color: #FECACA;
    }
    .stamp-guild {
      background: rgba(148, 163, 184, 0.14);
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
      color: #D99B26;
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
      border-left: 2px solid rgba(245, 196, 81, 0.5);
    }
    .floor-p {
      font-size: ${fontSize}px;
      font-weight: 450;
      -webkit-text-stroke: 0.1px currentColor;
      line-height: ${lineHeight};
      color: #E2E8F0;
      margin-bottom: 3.5px;
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
    /* 简洁金字高亮（去掉厚重底框） */
    .marker-highlight {
      color: #FDE68A;
      background: rgba(245, 196, 81, 0.12);
      padding: 0 1px;
      border-radius: 2px;
      font-weight: 600;
    }
    .inline-code {
      font-family: "SF Mono", "Menlo", monospace;
      font-size: ${Math.round((fontSize - 1) * 10) / 10}px;
      background: rgba(245, 196, 81, 0.14);
      color: #FCD34D;
      border-radius: 2px;
      padding: 0 4px;
      font-weight: 600;
    }
    .mention {
      color: #F87171;
      font-weight: 700;
    }
    /* 极简封帖提示条 */
    .system-notice {
      position: relative;
      padding: 5px 10px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: #F5C451;
      background: rgba(15, 23, 38, 0.8);
      border: 1px solid rgba(245, 196, 81, 0.35);
      border-radius: 3px;
    }
    /* 尾页极简归档栏 */
    .ending-archive-card {
      margin-top: auto;
      position: relative;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(14, 20, 32, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-left: 2.5px solid #F5C451;
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
      color: #F5C451;
    }
    .ending-stats {
      font-size: 10px;
      font-weight: 500;
      color: #94A3B8;
    }
    .ending-stamp {
      background: rgba(245, 196, 81, 0.15);
      border: 1px solid rgba(245, 196, 81, 0.5);
      color: #FDE68A;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 2px;
    }
    /* 底部极简状态条 */
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
      background: rgba(255, 255, 255, 0.08);
    }
    /* ==================== 极简电竞封面 (00-封面.png) ==================== */
    .cover-Wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2px 0;
      position: relative;
      z-index: 2;
    }
    .cover-hero-card {
      position: relative;
      margin-top: 2px;
      padding: 12px 13px 10px 13px;
    }
    .cover-hero-box {
      position: absolute;
      inset: 0;
      background: rgba(14, 20, 34, 0.45);
      border: none;
      border-bottom: 1px solid rgba(245, 196, 81, 0.28);
      border-radius: 0;
      z-index: 0;
    }
    .cover-washi {
      display: none;
    }
    .cover-hero-inner {
      position: relative;
      z-index: 1;
    }
    .cover-tags-row {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .cover-tag {
      background: rgba(220, 38, 38, 0.85);
      color: #FFFBEB;
      border-radius: 2px;
      font-size: 10px;
      font-weight: 800;
      padding: 1px 6px;
    }
    .cover-tag.tag-outline {
      background: rgba(255, 255, 255, 0.08);
      color: #CBD5E1;
      border: none;
    }
    .cover-main-title {
      font-size: 20.5px;
      font-weight: 900;
      line-height: 1.35;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .cover-meta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 10.5px;
      font-weight: 600;
      color: #94A3B8;
    }
    .cover-cp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 2px 0;
    }
    .cp-note {
      position: relative;
      padding: 9px 10px;
    }
    .cp-note-box {
      position: absolute;
      inset: 0;
      background: rgba(14, 20, 34, 0.45);
      border: none;
      border-top: 2px solid #EF4444;
      border-radius: 0;
      z-index: 0;
    }
    .cp-note-right .cp-note-box {
      background: rgba(14, 20, 34, 0.45);
      border: none;
      border-top: 2px solid #F5C451;
    }
    .cp-note-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 4.5px;
    }
    .cp-top {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cp-avatar {
      width: 26px;
      height: 26px;
      flex-shrink: 0;
    }
    .cp-avatar svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .cp-name-wrap {
      display: flex;
      flex-direction: column;
    }
    .cp-name {
      font-size: 12px;
      font-weight: 800;
      color: #F87171;
    }
    .cp-note-right .cp-name {
      color: #F5C451;
    }
    .cp-role {
      font-size: 9.5px;
      font-weight: 600;
      color: #94A3B8;
    }
    .cp-desc {
      font-size: 10px;
      font-weight: 700;
      color: #FCA5A5;
      background: rgba(220, 38, 38, 0.15);
      padding: 1px 5px;
      border-radius: 2px;
      align-self: flex-start;
    }
    .cp-note-right .cp-desc {
      background: rgba(245, 196, 81, 0.15);
      color: #FDE68A;
    }
    .cp-quote {
      font-size: 11px;
      line-height: 1.38;
      color: #E2E8F0;
      font-weight: 500;
    }
    .cover-highlights-box {
      position: relative;
      padding: 8px 11px;
    }
    .cover-hl-border {
      position: absolute;
      inset: 0;
      background: rgba(14, 20, 34, 0.45);
      border: none;
      border-top: 1px solid rgba(245, 196, 81, 0.28);
      border-radius: 0;
      z-index: 0;
    }
    .cover-hl-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cover-hl-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #F5C451;
    }
    .cover-hl-item {
      font-size: 11.5px;
      line-height: 1.36;
      color: #CBD5E1;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
}

function buildPageCSS(theme, fontSize = 15.6, lineHeight = 1.48, cardGap = 7) {
  const isGlory = Boolean(theme.isGloryTheme);
  if (isGlory) {
    return buildGloryEsportsCSS(theme, fontSize, lineHeight, cardGap);
  }
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background: #1B2230;
      font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Hiragino Sans GB", sans-serif;
      color: ${theme.inkColor};
    }
    /* 375x500 手机原生视口 (3x 导出为 1125x1500 高清图)：方格手账草稿本底纸 */
    .xhs-card {
      width: 375px;
      height: 500px;
      background-color: ${theme.paperBg};
      background-image:
        linear-gradient(${theme.gridLine} 1px, transparent 1px),
        linear-gradient(90deg, ${theme.gridLine} 1px, transparent 1px);
      background-size: 18px 18px;
      background-position: -1px -1px;
      padding: 8px 11px 7px 11px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    /* 顶部眉栏（荣耀模式下采用深蓝色荣耀官方论坛鎏金顶栏） */
    .notebook-header {
      height: ${isGlory ? '26px' : '22px'};
      margin-bottom: 5px;
      padding: ${isGlory ? '0 8px' : '0 2px 3px 2px'};
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: ${isGlory ? theme.topbarBg : 'transparent'};
      border-bottom: ${isGlory ? `2px solid ${theme.topbarBorder}` : `1.5px dashed ${theme.inkMuted}`};
      border-radius: ${isGlory ? '6px 6px 2px 2px' : '0'};
      box-shadow: ${isGlory ? '0 1.5px 0 rgba(217, 155, 38, 0.25)' : 'none'};
      flex-shrink: 0;
    }
    .nb-left {
      font-size: 11px;
      font-weight: 800;
      color: ${isGlory ? theme.topbarText : theme.inkMuted};
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .glory-badge-pill {
      display: inline-block;
      background: linear-gradient(135deg, #F5C451 0%, #D99B26 100%);
      color: #162338;
      font-size: 9px;
      font-weight: 900;
      padding: 0.5px 4px;
      border-radius: 3px;
      letter-spacing: 0.5px;
      margin-right: 1px;
    }
    .nb-right {
      font-family: "Bradley Hand", "Chalkboard SE", "Comic Sans MS", "PingFang SC", monospace;
      font-size: 11.5px;
      font-weight: 800;
      color: ${isGlory ? theme.topbarAccent : theme.inkColor};
    }
    .glory-watermark {
      position: absolute;
      right: 6px;
      bottom: 4px;
      pointer-events: none;
      z-index: 0;
    }
    /* 首页手绘便签大标题卡（带顶部手绘和纸胶带） */
    .hero-memo-card {
      position: relative;
      margin-top: 3px;
      margin-bottom: 8px;
      padding: 12px 13px 10px 13px;
      flex-shrink: 0;
    }
    .hero-sketch-box {
      position: absolute;
      inset: 0;
      background: #FFFDF9;
      border: 1.8px solid ${theme.inkColor};
      border-radius: 14px 4px 12px 5px / 5px 12px 4px 14px;
      box-shadow: 3px 3px 0px ${theme.opShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    /* 顶部半透明斜纹手绘和纸胶带 */
    .washi-tape {
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(-1.8deg);
      width: 76px;
      height: 14px;
      background-color: ${theme.tapeBg};
      background-image: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        ${theme.tapeStripe} 4px,
        ${theme.tapeStripe} 8px
      );
      border-left: 1.5px dotted rgba(255,255,255,0.7);
      border-right: 1.5px dotted rgba(255,255,255,0.7);
      filter: url(#sketch-wobble);
      z-index: 2;
    }
    .hero-content {
      position: relative;
      z-index: 1;
    }
    .sketch-topic-tag {
      display: inline-block;
      background: ${theme.markerSoft};
      color: ${theme.markerDeep};
      border: 1.4px solid ${theme.inkColor};
      border-radius: 8px 3px 7px 3px / 3px 7px 3px 8px;
      font-size: 11px;
      font-weight: 800;
      padding: 0.5px 6px;
      margin-right: 5px;
      vertical-align: 1px;
      transform: rotate(-1.5deg);
    }
    .title-text {
      font-size: ${Math.round((fontSize + 0.6) * 10) / 10}px;
      font-weight: 800;
      line-height: 1.38;
      color: ${theme.inkColor};
    }
    /* 楼层草稿框列表容器 */
    .floors-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: ${cardGap}px;
      overflow: hidden;
      padding-right: 3px;
      padding-bottom: 3px;
    }
    /* 单个楼层容器：将手绘抖动线框层与锐利文字层分离 */
    .floor-item {
      position: relative;
      padding: 8px 12px 8.5px 12px;
    }
    .sketch-border-layer {
      position: absolute;
      inset: 0;
      background: ${theme.anonCardFill};
      border: 1.5px solid ${theme.inkColor};
      border-radius: 10px 18px 12px 16px / 16px 10px 18px 12px;
      box-shadow: 2.5px 2.5px 0px ${theme.anonShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    .floor-item.role-op .sketch-border-layer {
      background: ${theme.opCardFill};
      border: 1.7px solid ${theme.inkColor};
      border-radius: 16px 8px 15px 9px / 9px 16px 8px 15px;
      box-shadow: 3px 3px 0px ${theme.opShadow};
    }
    .floor-item.role-special .sketch-border-layer {
      background: ${theme.darkCardFill};
      border: 1.8px solid ${theme.inkColor};
      border-radius: 8px 14px 9px 15px / 14px 9px 15px 8px;
      box-shadow: 3px 3px 0px ${theme.darkCardShadow};
    }
    .floor-content-layer {
      position: relative;
      z-index: 1;
    }
    .floor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 3.5px;
    }
    .floor-user {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .avatar {
      width: 23px;
      height: 23px;
      flex-shrink: 0;
    }
    .avatar svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .author-name {
      font-size: 13px;
      font-weight: 700;
      color: #5C5046;
    }
    .role-op .author-name {
      color: ${theme.markerDeep};
      font-weight: 800;
    }
    .role-special .author-name {
      color: #F7F3EB;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    /* 手绘小印章标签（无 Emoji） */
    .sketch-stamp {
      font-size: 9.5px;
      font-weight: 800;
      padding: 0.5px 5px;
      border: 1.2px solid ${theme.inkColor};
      border-radius: 4px 7px 3px 6px / 6px 3px 7px 4px;
      line-height: 1.25;
      display: inline-block;
    }
    .stamp-op {
      background: ${theme.markerSoft};
      color: ${theme.markerDeep};
      transform: rotate(-1.5deg);
    }
    .stamp-special {
      background: ${theme.darkAccent};
      color: #1F1B18;
      border-color: #F7F3EB;
      transform: rotate(1deg);
    }
    .stamp-note {
      background: #F3EDE2;
      color: #5C5046;
      border-style: dashed;
    }
    .floor-num {
      font-family: "Bradley Hand", "Chalkboard SE", "Comic Sans MS", monospace;
      font-size: 11.5px;
      font-weight: 700;
      color: ${theme.inkMuted};
    }
    .role-op .floor-num {
      color: ${theme.markerDeep};
    }
    .role-special .floor-num {
      color: ${theme.darkAccent};
    }
    .floor-body {
      padding-left: 0;
    }
    .floor-quote {
      padding: 1.5px 7px;
      margin-bottom: 3.5px;
      font-size: 12.5px;
      font-weight: 600;
      color: ${theme.inkMuted};
      border-left: 2px dashed ${theme.inkMuted};
    }
    .floor-p {
      font-size: ${fontSize}px;
      font-weight: 450;
      -webkit-text-stroke: 0.12px currentColor;
      line-height: ${lineHeight};
      color: ${theme.inkColor};
      margin-bottom: 3.5px;
      letter-spacing: 0.12px;
      word-break: break-word;
    }
    .floor-p:last-child {
      margin-bottom: 0;
    }
    .role-special .floor-p {
      color: #F7F3EB;
      font-weight: 600;
      -webkit-text-stroke: 0.15px currentColor;
      letter-spacing: 0.25px;
    }
    /* 手绘马克笔半高涂抹高亮（真实手账感） */
    .marker-highlight {
      background: linear-gradient(
        104deg,
        transparent 0.5%,
        ${theme.highlighter} 2%,
        ${theme.highlighter} 97%,
        transparent 99%
      );
      background-position: 0 58%;
      background-size: 100% 52%;
      background-repeat: no-repeat;
      font-weight: 600;
      padding: 0 1px;
    }
    .inline-code {
      font-family: "Bradley Hand", "Chalkboard SE", "SF Mono", monospace;
      font-size: ${Math.round((fontSize - 0.8) * 10) / 10}px;
      background: ${theme.markerSoft};
      color: ${theme.inkColor};
      border-bottom: 1.5px solid ${theme.markerSolid};
      padding: 0 4px;
      font-weight: 700;
    }
    .mention {
      color: ${theme.markerDeep};
      font-weight: 700;
      text-decoration: underline wavy ${theme.markerSolid} 1px;
      text-underline-offset: 2px;
    }
    /* 手绘封帖虚线框 */
    .system-notice {
      position: relative;
      padding: 6px 10px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: ${theme.inkColor};
      background: ${theme.markerSoft};
      border: 1.6px dashed ${theme.inkColor};
      border-radius: 8px 12px 9px 11px;
    }
    /* 尾页手绘印章归档便签 */
    .ending-archive-card {
      margin-top: auto;
      position: relative;
      padding: 7px 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #FFFDF9;
      border: 1.5px dashed ${theme.inkMuted};
      border-radius: 10px 6px 12px 7px;
    }
    .ending-left {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .ending-title {
      font-size: 12.5px;
      font-weight: 800;
      color: ${theme.markerDeep};
    }
    .ending-stats {
      font-size: 10.5px;
      font-weight: 600;
      color: ${theme.inkMuted};
    }
    .ending-stamp {
      border: 1.8px solid ${theme.markerDeep};
      color: ${theme.markerDeep};
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      transform: rotate(-6deg);
      box-shadow: inset 0 0 0 1px ${theme.markerSoft};
      letter-spacing: 0.5px;
    }
    /* 底部手绘涂鸦页脚 */
    .sketch-footer {
      height: 13px;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 600;
      color: ${theme.inkMuted};
      padding: 0 2px;
      flex-shrink: 0;
    }
    .sketch-doodle-line {
      flex: 1;
      margin: 0 8px;
      height: 4px;
      border-bottom: 1.3px dotted ${theme.inkMuted};
      opacity: 0.55;
    }
    /* ==================== 专属手绘封面 (00-封面.png) 样式 ==================== */
    .cover-Wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 4px 2px 4px 2px;
    }
    .cover-hero-card {
      position: relative;
      margin-top: 4px;
      padding: 13px 14px 11px 14px;
    }
    .cover-hero-box {
      position: absolute;
      inset: 0;
      background: #FFFDF9;
      border: 2px solid ${theme.inkColor};
      border-radius: 16px 6px 14px 7px / 7px 14px 6px 16px;
      box-shadow: 4px 4px 0px ${theme.opShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    .cover-washi {
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%) rotate(-2deg);
      width: 96px;
      height: 16px;
      background-color: ${theme.tapeBg};
      background-image: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        ${theme.tapeStripe} 4px,
        ${theme.tapeStripe} 8px
      );
      border-left: 1.5px dotted rgba(255,255,255,0.75);
      border-right: 1.5px dotted rgba(255,255,255,0.75);
      filter: url(#sketch-wobble);
      z-index: 2;
    }
    .cover-hero-inner {
      position: relative;
      z-index: 1;
    }
    .cover-tags-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .cover-tag {
      background: ${theme.markerSoft};
      color: ${theme.markerDeep};
      border: 1.4px solid ${theme.inkColor};
      border-radius: 7px 3px 6px 4px;
      font-size: 11px;
      font-weight: 800;
      padding: 1px 7px;
      transform: rotate(-1deg);
    }
    .cover-tag.tag-outline {
      background: #FFFEFC;
      color: ${theme.inkColor};
      border-style: dashed;
      transform: rotate(1deg);
    }
    .cover-main-title {
      font-size: 18.5px;
      font-weight: 900;
      line-height: 1.34;
      color: ${theme.inkColor};
      letter-spacing: 0.2px;
      margin-bottom: 8px;
    }
    .cover-meta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1.4px dashed ${theme.inkMuted};
      font-size: 11.5px;
      font-weight: 700;
      color: ${theme.inkMuted};
    }
    /* 双人设手绘便签对撞区 */
    .cover-cp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 2px 0;
    }
    .cp-note {
      position: relative;
      padding: 10px 10px 10px 10px;
    }
    .cp-note-left {
      transform: rotate(-1.4deg);
    }
    .cp-note-right {
      transform: rotate(1.4deg);
    }
    .cp-note-box {
      position: absolute;
      inset: 0;
      background: ${theme.opCardFill};
      border: 1.7px solid ${theme.inkColor};
      border-radius: 12px 6px 14px 8px;
      box-shadow: 3px 3px 0px ${theme.opShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    .cp-note-right .cp-note-box {
      background: ${theme.darkCardFill};
      box-shadow: 3px 3px 0px ${theme.darkCardShadow};
    }
    .cp-note-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .cp-top {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cp-avatar {
      width: 30px;
      height: 30px;
      flex-shrink: 0;
    }
    .cp-avatar svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .cp-name-wrap {
      display: flex;
      flex-direction: column;
    }
    .cp-name {
      font-size: 12.5px;
      font-weight: 800;
      color: ${theme.markerDeep};
    }
    .cp-note-right .cp-name {
      color: #F7F3EB;
    }
    .cp-role {
      font-size: 10px;
      font-weight: 700;
      color: ${theme.inkMuted};
    }
    .cp-note-right .cp-role {
      color: ${theme.darkAccent};
    }
    .cp-desc {
      font-size: 11.5px;
      font-weight: 700;
      color: ${theme.inkColor};
      background: ${theme.markerSoft};
      padding: 2px 6px;
      border-radius: 4px;
      align-self: flex-start;
    }
    .cp-note-right .cp-desc {
      background: rgba(248, 180, 98, 0.18);
      color: ${theme.darkAccent};
    }
    .cp-quote {
      font-size: 11.5px;
      line-height: 1.42;
      color: #4A3F37;
      font-weight: 600;
    }
    .cp-note-right .cp-quote {
      color: #E6DEC8;
    }
    /* 底部神评摘录速览框 */
    .cover-highlights-box {
      position: relative;
      padding: 9px 11px;
    }
    .cover-hl-border {
      position: absolute;
      inset: 0;
      background: #FFFEFC;
      border: 1.5px dashed ${theme.inkColor};
      border-radius: 10px 14px 9px 12px;
      box-shadow: 2.5px 2.5px 0px ${theme.anonShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    .cover-hl-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 4.5px;
    }
    .cover-hl-title {
      font-size: 11px;
      font-weight: 800;
      color: ${theme.markerDeep};
      margin-bottom: 1px;
    }
    .cover-hl-item {
      font-size: 12px;
      line-height: 1.38;
      color: ${theme.inkColor};
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
}

async function measureAndPaginate(page, parsed, titleTag, cleanTitle, theme, fontSize, lineHeight, cardGap) {
  const fullFloorHTMLs = parsed.floors
    .map((f, idx) =>
      renderFloorSliceHTML(
        f,
        {
          isCont: false,
          quotes: f.quotes,
          paragraphs: f.paragraphs,
          sliceId: `f-${idx}`,
        },
        theme
      )
    )
    .join('\n');

  const allSysHTML = parsed.systemNotices
    .map((s) => `<div class="system-notice">[封帖归档] ${formatInlineMarkdown(s, true)}</div>`)
    .join('\n');

  const css = buildPageCSS(theme, fontSize, lineHeight, cardGap);
  const isGlory = Boolean(theme.isGloryTheme || parsed.isGloryForum);
  const topbarLeftHTML = isGlory
    ? `${getGloryLogoSVG(15)}<span class="glory-badge-pill">GLORY</span><span>${formatInlineMarkdown(parsed.boardName)}</span>`
    : `✎ ${formatInlineMarkdown(parsed.boardName)}`;
  const footerLeftText = isGlory ? '⚔ GLORY · 荣耀官方论坛水区' : '白塔手札 · 树洞记录';

  const measureHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${css}</style>
    </head>
    <body>
      ${buildGlobalSketchSVGDefs()}
      <div class="xhs-card" id="measure-card" style="height: auto;">
        <div class="notebook-header" id="m-topbar">
          <span class="nb-left">${topbarLeftHTML}</span>
          <span class="nb-right">Page 01 / 01</span>
        </div>
        <div class="hero-memo-card" id="m-hero">
          <div class="washi-tape"></div>
          <div class="hero-sketch-box"></div>
          ${isGlory ? `<div class="glory-watermark">${getGloryLogoSVG(56, true)}</div>` : ''}
          <div class="hero-content">
            <span class="sketch-topic-tag">#${formatInlineMarkdown(titleTag)}</span>
            <span class="title-text">${formatInlineMarkdown(cleanTitle)}</span>
          </div>
        </div>
        <div class="floors-container" id="m-floors">
          ${fullFloorHTMLs}
          <div id="m-sys-wrapper">${allSysHTML}</div>
        </div>
        <div class="sketch-footer" id="m-bottom">
          <span>${footerLeftText}</span>
          <div class="sketch-doodle-line"></div>
          <span>next ↝</span>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(measureHTML, { waitUntil: 'load' });

  const metrics = await page.evaluate(() => {
    const topbarH = document.getElementById('m-topbar').getBoundingClientRect().height + 5;
    const heroH = document.getElementById('m-hero').getBoundingClientRect().height + 11;
    const bottomH = document.getElementById('m-bottom').getBoundingClientRect().height + 4;
    const sysH = document.getElementById('m-sys-wrapper').getBoundingClientRect().height;

    const floorEls = Array.from(document.querySelectorAll('.floor-item'));
    const floorDetails = floorEls.map((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const padTop = parseFloat(style.paddingTop) || 0;
      const padBottom = parseFloat(style.paddingBottom) || 0;

      const headerEl = el.querySelector('.floor-header');
      const headerRect = headerEl.getBoundingClientRect();
      const headerStyle = window.getComputedStyle(headerEl);
      const headerH = headerRect.height + (parseFloat(headerStyle.marginBottom) || 0);

      const quoteEls = Array.from(el.querySelectorAll('.floor-quote'));
      const quotesH = quoteEls.reduce((acc, q) => {
        const qr = q.getBoundingClientRect();
        const qs = window.getComputedStyle(q);
        return acc + qr.height + (parseFloat(qs.marginBottom) || 0);
      }, 0);

      const pEls = Array.from(el.querySelectorAll('.floor-p'));
      const pHeights = pEls.map((p, idx) => {
        const pr = p.getBoundingClientRect();
        const ps = window.getComputedStyle(p);
        const mb = idx < pEls.length - 1 ? parseFloat(ps.marginBottom) || 0 : 0;
        return pr.height + mb;
      });

      const boxChrome = padTop + padBottom + headerH;

      return {
        totalH: rect.height,
        chromeH: boxChrome + quotesH,
        contChromeH: boxChrome,
        pHeights,
      };
    });

    return { topbarH, heroH, bottomH, sysH, floorDetails };
  });

  const usableCardH = 500 - 18 - metrics.topbarH - metrics.bottomH;
  const page1MaxH = usableCardH - metrics.heroH;
  const otherPageMaxH = usableCardH;

  const pages = [];
  let currentSlices = [];
  let usedH = 0;

  const getCurrentMaxH = () => (pages.length === 0 ? page1MaxH : otherPageMaxH);
  const pushPage = () => {
    if (currentSlices.length > 0) {
      pages.push({ slices: currentSlices, includeSys: false });
      currentSlices = [];
      usedH = 0;
    }
  };

  for (let i = 0; i < parsed.floors.length; i++) {
    const floor = parsed.floors[i];
    const detail = metrics.floorDetails[i];
    let maxH = getCurrentMaxH();
    const gapBefore = currentSlices.length > 0 ? cardGap : 0;

    if (usedH + gapBefore + detail.totalH <= maxH + 5) {
      currentSlices.push({
        floorIdx: i,
        isCont: false,
        quotes: floor.quotes,
        paragraphs: floor.paragraphs,
      });
      usedH += gapBefore + detail.totalH;
      continue;
    }

    const remainingH = maxH - usedH - gapBefore;
    const firstSliceMinH = detail.chromeH + (detail.pHeights[0] || 0);
    if (currentSlices.length > 0 && remainingH < firstSliceMinH) {
      pushPage();
      maxH = getCurrentMaxH();
      if (detail.totalH <= maxH + 5) {
        currentSlices.push({
          floorIdx: i,
          isCont: false,
          quotes: floor.quotes,
          paragraphs: floor.paragraphs,
        });
        usedH += detail.totalH;
        continue;
      }
    }

    let pCursor = 0;
    let isCont = false;
    while (pCursor < floor.paragraphs.length) {
      maxH = getCurrentMaxH();
      const g = currentSlices.length > 0 ? cardGap : 0;
      const baseChrome = isCont ? detail.contChromeH : detail.chromeH;

      if (currentSlices.length > 0 && usedH + g + baseChrome + detail.pHeights[pCursor] > maxH + 3) {
        pushPage();
        maxH = getCurrentMaxH();
      }

      const actualGap = currentSlices.length > 0 ? cardGap : 0;
      let sliceH = baseChrome;
      const sliceParas = [];
      while (
        pCursor < floor.paragraphs.length &&
        (sliceParas.length === 0 || usedH + actualGap + sliceH + detail.pHeights[pCursor] <= maxH + 3)
      ) {
        sliceH += detail.pHeights[pCursor];
        sliceParas.push(floor.paragraphs[pCursor]);
        pCursor++;
      }

      currentSlices.push({
        floorIdx: i,
        isCont,
        quotes: isCont ? [] : floor.quotes,
        paragraphs: sliceParas,
      });
      usedH += actualGap + sliceH;
      isCont = true;

      if (pCursor < floor.paragraphs.length) {
        pushPage();
      }
    }
  }

  if (currentSlices.length > 0) {
    const maxH = getCurrentMaxH();
    if (metrics.sysH > 0 && usedH + cardGap + metrics.sysH > maxH + 6 && currentSlices.length > 1) {
      const moveCount = currentSlices.length >= 3 ? 2 : 1;
      const movedSlices = currentSlices.splice(-moveCount);
      pages.push({ slices: currentSlices, includeSys: false });
      pages.push({ slices: movedSlices, includeSys: true, showEndingCard: true });
    } else {
      pages.push({
        slices: currentSlices,
        includeSys: true,
        showEndingCard: usedH + cardGap + metrics.sysH + 62 <= maxH,
      });
    }
  }

  return { pages, css, allSysHTML };
}

/**
 * 渲染专属手绘草稿风小红书封面卡 (00-封面.png)
 */
function renderCoverCardHTML(parsed, titleTag, cleanTitle, theme) {
  const isGlory = Boolean(theme.isGloryTheme || parsed.isGloryForum);
  const opFloor = parsed.floors.find((f) => f.isOP) || parsed.floors[0];
  const specialFloor = parsed.floors.find((f) => f.isSpecialUser) || {
    author: isGlory ? '轮回-孙翔V' : '用户0719',
    isSpecialUser: true,
    isGloryForum: isGlory,
    numInt: 28,
  };

  const opAvatarSVG = getHandDrawnAvatarSVG(opFloor, theme);
  const specialAvatarSVG = getHandDrawnAvatarSVG(specialFloor, theme);

  // 对标题中的核心钩子词自动加荧光笔涂抹高亮
  let highlightedTitle = formatInlineMarkdown(cleanTitle);
  for (const kw of ['锁在屋里三天', '唐昊和孙翔', '后会友期']) {
    if (highlightedTitle.includes(kw)) {
      highlightedTitle = highlightedTitle.replace(
        kw,
        `<span class="marker-highlight">${kw}</span>`
      );
    }
  }

  if (isGlory) {
    const tangAvatarSVG = getHandDrawnAvatarSVG(
      { author: '呼啸-唐昊V', isSpecialUser: true, isGloryForum: true, numInt: 63 },
      theme
    );
    const sunAvatarSVG = getHandDrawnAvatarSVG(
      { author: '轮回-孙翔V', isSpecialUser: true, isGloryForum: true, numInt: 62 },
      theme
    );

    return `
      <div class="xhs-card" id="card-cover">
        ${getGloryPageBgWatermarkHTML()}
        <div class="notebook-header">
          <span class="nb-left">${getGloryLogoSVG(15)}<span class="glory-badge-pill">GLORY</span><span>${formatInlineMarkdown(parsed.boardName)}</span></span>
          <span class="nb-right">SERVER: 神之领域</span>
        </div>
        <div class="cover-Wrap">
          <div class="cover-hero-card">
            <div class="cover-washi"></div>
            <div class="cover-hero-box"></div>
            <div class="glory-watermark">${getGloryLogoSVG(72, true)}</div>
            <div class="cover-hero-inner">
              <div class="cover-tags-row">
                <span class="cover-tag">#${formatInlineMarkdown(titleTag)}</span>
                <span class="cover-tag tag-outline">#全职高手</span>
                <span class="cover-tag tag-outline">#后会友期</span>
                <span class="cover-tag tag-outline">#第七赛季双子星</span>
              </div>
              <div class="cover-main-title">《${highlightedTitle}》</div>
              <div class="cover-meta-bar">
                <span>OP：${formatInlineMarkdown(opFloor.author)}</span>
                <span>REPLIES: ${parsed.floors.length - 1} · STATUS: 精华锁定</span>
              </div>
            </div>
          </div>

          <div class="cover-cp-grid">
            <div class="cp-note cp-note-left">
              <div class="cp-note-box"></div>
              <div class="cp-note-inner">
                <div class="cp-top">
                  <div class="cp-avatar">${tangAvatarSVG}</div>
                  <div class="cp-name-wrap">
                    <span class="cp-name">呼啸-唐昊V</span>
                    <span class="cp-role">ID: 唐三打 · 第一流氓</span>
                  </div>
                </div>
                <div class="cp-desc">银武: 血祭绝魂 // 口嫌体直</div>
                <div class="cp-quote">“我是被钉在耻辱柱上的人，我能去哪儿啊……是我自己在画地为牢，孙翔。”</div>
              </div>
            </div>

            <div class="cp-note cp-note-right">
              <div class="cp-note-box"></div>
              <div class="cp-note-inner">
                <div class="cp-top">
                  <div class="cp-avatar">${sunAvatarSVG}</div>
                  <div class="cp-name-wrap">
                    <span class="cp-name">轮回-孙翔V</span>
                    <span class="cp-role">ID: 一叶之秋 · 斗神</span>
                  </div>
                </div>
                <div class="cp-desc">银武: 战矛却邪 // AI查词典</div>
                <div class="cp-quote">“画地为牢是什么意思？唐昊饿了？给他点桶双人香辣炸鸡备注不要香菜！”</div>
              </div>
            </div>
          </div>

          <div class="cover-highlights-box">
            <div class="cover-hl-border"></div>
            <div class="cover-hl-inner">
              <div class="cover-hl-title">⚔ GLORY FORUM // 水区高赞神评：</div>
              <div class="cover-hl-item">▸ #11L：唐昊你管这叫不熟？这写的是《孙翔临床护理说明书》吧！</div>
              <div class="cover-hl-item">▸ #23L 夜雨声烦烦烦：第七赛季全明星他俩还在巷口分吃同一根烤肠！</div>
              <div class="cover-hl-item">▸ #39L：唐昊在火堆边演苦情剧，孙翔在桌下查AI词典点香辣炸鸡桶！</div>
            </div>
          </div>
        </div>
        <div class="sketch-footer">
          <span>⚔ GLORY CLIENT · 神之领域水区</span>
          <div class="sketch-doodle-line"></div>
          <span>SWIPE >>></span>
        </div>
      </div>
    `;
  }

  return `
    <div class="xhs-card" id="card-cover">
      <div class="notebook-header">
        <span class="nb-left">✎ ${formatInlineMarkdown(parsed.boardName)}</span>
        <span class="nb-right">COVER · 全文完结</span>
      </div>
      <div class="cover-Wrap">
        <div class="cover-hero-card">
          <div class="cover-washi"></div>
          <div class="cover-hero-box"></div>
          <div class="cover-hero-inner">
            <div class="cover-tags-row">
              <span class="cover-tag">#${formatInlineMarkdown(titleTag)}</span>
              <span class="cover-tag tag-outline">#向导哨兵</span>
              <span class="cover-tag tag-outline">#纯正论坛体</span>
            </div>
            <div class="cover-main-title">《${highlightedTitle}》</div>
            <div class="cover-meta-bar">
              <span>楼主：${formatInlineMarkdown(opFloor.author)}</span>
              <span>共 ${parsed.floors.length - 1} 条回帖 · 已锁帖珍藏</span>
            </div>
          </div>
        </div>

        <div class="cover-cp-grid">
          <div class="cp-note cp-note-left">
            <div class="cp-note-box"></div>
            <div class="cp-note-inner">
              <div class="cp-top">
                <div class="cp-avatar">${opAvatarSVG}</div>
                <div class="cp-name-wrap">
                  <span class="cp-name">${formatInlineMarkdown(opFloor.author)}</span>
                  <span class="cp-role">楼主 · B级医疗向导</span>
                </div>
              </div>
              <div class="cp-desc">温柔迟钝 · 实心木头</div>
              <div class="cp-quote">“他拽着我手腕咬了半小时，我摸他额头有点发烫，就往他嘴里塞了颗橘子糖……”</div>
            </div>
          </div>

          <div class="cp-note cp-note-right">
            <div class="cp-note-box"></div>
            <div class="cp-note-inner">
              <div class="cp-top">
                <div class="cp-avatar">${specialAvatarSVG}</div>
                <div class="cp-name-wrap">
                  <span class="cp-name">${formatInlineMarkdown(specialFloor.author)}</span>
                  <span class="cp-role">刚注册 · 顶楼S+哨兵</span>
                </div>
              </div>
              <div class="cp-desc">阴湿偏执 · 暗恋筑巢</div>
              <div class="cp-quote">“不准打报告。没有嫌淡，不准换人。喜糖让后勤备了，帖子锁了，别看她了。”</div>
            </div>
          </div>
        </div>

        <div class="cover-highlights-box">
          <div class="cover-hl-border"></div>
          <div class="cover-hl-inner">
            <div class="cover-hl-title">✎ 楼内高赞吃瓜热评：</div>
            <div class="cover-hl-item">↳ #1L：精神体是黑豹还关人三天，除了顶楼那位活阎王还有谁？！</div>
            <div class="cover-hl-item">↳ #12L：什么防走丢环，那是他提前给你定制的全塔唯一旧伤理疗环！</div>
            <div class="cover-hl-item">↳ #38L：二十七根旧发圈收在床头……姐妹他暗恋你五年在筑巢啊！</div>
          </div>
        </div>
      </div>
      <div class="sketch-footer">
        <span>白塔手札 · 匿名树洞</span>
        <div class="sketch-doodle-line"></div>
        <span>左滑看全楼吃瓜 ↝</span>
      </div>
    </div>
  `;
}

async function generateXHSImages(mdFilePath, customOutDir, options = {}) {
  const absMdPath = path.resolve(mdFilePath);
  if (!fs.existsSync(absMdPath)) {
    throw new Error(`找不到文件: ${absMdPath}`);
  }

  const mdContent = fs.readFileSync(absMdPath, 'utf8');
  const parsed = parseForumMarkdown(mdContent);
  const theme = resolveTheme(options, mdContent);

  if (parsed.floors.length === 0) {
    throw new Error('未能从 Markdown 文件中解析出任何楼层（需形如 **【0L 楼主】**）。');
  }

  const novelName = path.basename(absMdPath, path.extname(absMdPath));
  const defaultRepoRoot = '/Users/bytedance/Library/Mobile Documents/iCloud~md~obsidian/Documents/职业技术/小红书论坛体图库';
  const repoNovelDir = path.join(defaultRepoRoot, novelName);

  const outDir = customOutDir
    ? path.resolve(customOutDir)
    : repoNovelDir;

  fs.mkdirSync(outDir, { recursive: true });

  let titleTag = '树洞';
  let cleanTitle = parsed.title;
  const tagMatch = cleanTitle.match(/^【(.+?)】\s*(.+)$/);
  if (tagMatch) {
    titleTag = tagMatch[1];
    cleanTitle = tagMatch[2];
  }

  const pw = loadPlaywright();
  const browser = await pw.chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 375, height: 500 },
    deviceScaleFactor: 3, // 输出 1125x1500 高清图 (3:4)
  });
  const page = await context.newPage();

  const targetFont = options.fontSize || 15.5;
  const preset = {
    fontSize: targetFont,
    lineHeight: 1.48,
    cardGap: 7,
  };

  const { pages, css, allSysHTML } = await measureAndPaginate(
    page,
    parsed,
    titleTag,
    cleanTitle,
    theme,
    preset.fontSize,
    preset.lineHeight,
    preset.cardGap
  );
  const totalPages = pages.length;
  const targetIndices = options.pageNum
    ? [Math.max(0, Math.min(totalPages - 1, options.pageNum - 1))]
    : options.onlyFirstPage
      ? [0]
      : pages.map((_, i) => i);

  const isGlory = Boolean(theme.isGloryTheme || parsed.isGloryForum);
  const topbarLeftHTML = isGlory
    ? `${getGloryLogoSVG(15)}<span class="glory-badge-pill">GLORY</span><span>${formatInlineMarkdown(parsed.boardName)}</span>`
    : `✎ ${formatInlineMarkdown(parsed.boardName)}`;
  const footerLeftText = isGlory ? '⚔ GLORY · 荣耀官方论坛水区' : '白塔手札 · 匿名树洞';
  const endingTitleText = isGlory ? '⚔ 荣耀官方论坛 · 水区传奇热帖归档' : '✎ 白塔树洞 · 匿名手札归档';
  const endingStatsText = isGlory
    ? `共 ${parsed.floors.length - 1} 条回帖 · 第七赛季双子星大型真香现场`
    : `共 ${parsed.floors.length - 1} 条回帖 · 后勤喜糖派发中`;
  const endingStampText = isGlory ? '版主加精锁定' : '已封帖珍藏';

  const cardsHTMLList = targetIndices.map((pageIdx) => {
    const p = pages[pageIdx];
    const isPage1 = pageIdx === 0;
    const pageNumStr = String(pageIdx + 1).padStart(2, '0');
    const totalNumStr = String(totalPages).padStart(2, '0');

    const heroHTML = isPage1
      ? `<div class="hero-memo-card">
           <div class="washi-tape"></div>
           <div class="hero-sketch-box"></div>
           ${isGlory ? `<div class="glory-watermark">${getGloryLogoSVG(56, true)}</div>` : ''}
           <div class="hero-content">
             <span class="sketch-topic-tag">#${formatInlineMarkdown(titleTag)}</span>
             <span class="title-text">${formatInlineMarkdown(cleanTitle)}</span>
           </div>
         </div>`
      : '';

    const pageFloorsHTML = p.slices
      .map((s, sIdx) =>
        renderFloorSliceHTML(
          parsed.floors[s.floorIdx],
          {
            ...s,
            sliceId: `p${pageIdx}-s${sIdx}`,
          },
          theme
        )
      )
      .join('\n');

    const sysBlock = p.includeSys ? allSysHTML : '';
    const endingCardBlock = p.showEndingCard
      ? `<div class="ending-archive-card">
           <div class="ending-left">
             <div class="ending-title">${endingTitleText}</div>
             <div class="ending-stats">${endingStatsText}</div>
           </div>
           <div class="ending-stamp">${endingStampText}</div>
         </div>`
      : '';

    return `
      <div class="xhs-card" id="card-page-${pageIdx + 1}">
        ${isGlory ? getGloryPageBgWatermarkHTML() : ''}
        <div class="notebook-header">
          <span class="nb-left">${topbarLeftHTML}</span>
          <span class="nb-right">${pageNumStr} / ${totalNumStr}</span>
        </div>
        ${heroHTML}
        <div class="floors-container">
          ${pageFloorsHTML}
          ${sysBlock}
          ${endingCardBlock}
        </div>
        <div class="sketch-footer">
          <span>${footerLeftText}</span>
          <div class="sketch-doodle-line"></div>
          <span>${pageIdx + 1 === totalPages ? '[ GG · END ]' : (isGlory ? 'NEXT >>>' : 'swipe ↝')}</span>
        </div>
      </div>
    `;
  });

  const isPartialRender = Boolean(options.onlyFirstPage || options.pageNum || options.coverOnly);
  if (!isPartialRender) {
    for (const existingFile of fs.readdirSync(outDir)) {
      if (/^\d+\.png$/.test(existingFile)) {
        fs.unlinkSync(path.join(outDir, existingFile));
      }
    }
  }

  const generatedFiles = [];

  // 渲染专属手绘封面 (00-封面.png)
  if (options.coverOnly || options.withCover || !isPartialRender) {
    const coverCardHTML = renderCoverCardHTML(parsed, titleTag, cleanTitle, theme);
    const coverFullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>
        ${buildGlobalSketchSVGDefs()}
        ${coverCardHTML}
      </body>
      </html>
    `;
    await page.setContent(coverFullHTML, { waitUntil: 'load' });
    const coverPath = path.join(outDir, '00-封面.png');
    const coverEl = await page.$('.xhs-card');
    await coverEl.screenshot({ path: coverPath });
    generatedFiles.push(coverPath);
  }

  if (!options.coverOnly) {
    for (let idx = 0; idx < cardsHTMLList.length; idx++) {
      const realPageNum = targetIndices[idx] + 1;
      const singlePageHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>${css}</style>
        </head>
        <body>
          ${buildGlobalSketchSVGDefs()}
          ${cardsHTMLList[idx]}
        </body>
        </html>
      `;
      await page.setContent(singlePageHTML, { waitUntil: 'load' });
      const fileName = options.customPrefix
        ? `${options.customPrefix}.png`
        : `${String(realPageNum).padStart(2, '0')}.png`;
      const filePath = path.join(outDir, fileName);
      const cardEl = await page.$('.xhs-card');
      await cardEl.screenshot({ path: filePath });
      generatedFiles.push(filePath);
    }
  }

  {
    const previewHTMLPath = path.join(outDir, 'preview.html');
    const previewHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${formatInlineMarkdown(cleanTitle)} - 预览 (${cardsHTMLList.length}/${totalPages}张)</title>
        <style>
          ${css}
          body {
            padding: 32px;
            background: #262320;
          }
          .preview-header {
            color: #F7F3EB;
            margin-bottom: 24px;
            text-align: center;
          }
          .preview-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            justify-content: center;
          }
          .xhs-card {
            box-shadow: 6px 6px 0px rgba(0,0,0,0.35);
            border: 2px solid #362D26;
          }
        </style>
      </head>
      <body>
        ${buildGlobalSketchSVGDefs()}
        <div class="preview-header">
          <h2>✎ 小红书 3:4 手绘草稿手账风预览（${theme.label} · 共 ${totalPages} 张）</h2>
        </div>
        <div class="preview-grid">
          ${cardsHTMLList.join('\n')}
        </div>
      </body>
      </html>
    `;
    fs.writeFileSync(previewHTMLPath, previewHTML, 'utf8');
  }

  await browser.close();

  // 自动将源小说目录下的 .md 与 .json 文件同步备份到私密图库对应小说文件夹下（确保 md 文件一同上传至 GitHub）
  const srcNovelDir = path.dirname(absMdPath);
  if (fs.existsSync(defaultRepoRoot)) {
    fs.mkdirSync(repoNovelDir, { recursive: true });
    if (path.resolve(srcNovelDir) !== path.resolve(repoNovelDir)) {
      for (const f of fs.readdirSync(srcNovelDir)) {
        if (f.endsWith('.md') || f.endsWith('.json')) {
          fs.copyFileSync(path.join(srcNovelDir, f), path.join(repoNovelDir, f));
        }
      }
    }
    // 如果指定了 customOutDir 且不同于私密图库目录，自动同步图片到私密图库对应小说文件夹下
    if (path.resolve(outDir) !== path.resolve(repoNovelDir)) {
      for (const f of fs.readdirSync(outDir)) {
        if (f.endsWith('.png') || f === 'preview.html') {
          fs.copyFileSync(path.join(outDir, f), path.join(repoNovelDir, f));
        }
      }
    }
  }

  // 全量生成完成（非单页预览）或显式指定 --push 时，自动提交并推送到 GitHub 私密图库仓库
  let gitPushStatus = 'skipped';
  if ((options.push || !isPartialRender) && !options.noPush && fs.existsSync(path.join(defaultRepoRoot, '.git'))) {
    try {
      execSync(`git -C "${defaultRepoRoot}" add "${novelName}"`, { stdio: 'pipe' });
      const statusOut = execSync(`git -C "${defaultRepoRoot}" status --porcelain "${novelName}"`, { encoding: 'utf8' }).trim();
      if (statusOut) {
        execSync(`git -C "${defaultRepoRoot}" commit -m "feat(${novelName}): update Xiaohongshu forum images (${totalPages} pages)"`, { stdio: 'pipe' });
        execSync(`git -C "${defaultRepoRoot}" push origin main`, { stdio: 'pipe' });
        gitPushStatus = 'pushed';
      } else {
        gitPushStatus = 'up-to-date';
      }
    } catch (pushErr) {
      gitPushStatus = `failed: ${pushErr.message}`;
    }
  }

  console.log(JSON.stringify({
    status: 'success',
    themeId: theme.id,
    themeName: theme.label,
    source: absMdPath,
    outputDir: outDir,
    repoDir: repoNovelDir,
    gitPushStatus,
    totalPages,
    mobileFontSizePt: preset.fontSize,
    totalFloors: parsed.floors.length,
    files: generatedFiles,
  }, null, 2));
}

const rawArgs = process.argv.slice(2);
if (rawArgs.includes('--list-themes')) {
  console.log('✎ 可用手绘预设色系 (--theme=名称)：');
  for (const [k, v] of Object.entries(PRESET_THEMES)) {
    console.log(`  - ${k.padEnd(15)} : ${v.label}`);
  }
  console.log('\n🎲 随机或自定义手绘色系：');
  console.log('  - --random 或 --theme=random : 随机生成一套手绘水彩/马克笔色系');
  console.log('  - --color=#HEX色号           : 根据任意十六进制颜色生成手绘配色');
  console.log('  - --hue=0~360                : 根据任意色相角生成手绘配色');
  process.exit(0);
}

const getArgVal = (prefix) => {
  const found = rawArgs.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
};

const options = {
  theme: getArgVal('--theme='),
  color: getArgVal('--color='),
  hue: getArgVal('--hue=') !== null ? parseFloat(getArgVal('--hue=')) : null,
  fontSize: getArgVal('--font=') !== null ? parseFloat(getArgVal('--font=')) : null,
  pageNum: getArgVal('--page=') !== null ? parseInt(getArgVal('--page='), 10) : null,
  random: rawArgs.includes('--random'),
  onlyFirstPage: rawArgs.includes('--first-only'),
  coverOnly: rawArgs.includes('--cover-only'),
  withCover: rawArgs.includes('--with-cover'),
  push: rawArgs.includes('--push'),
  noPush: rawArgs.includes('--no-push'),
  customPrefix: getArgVal('--prefix='),
};

const posArgs = rawArgs.filter((a) => !a.startsWith('--'));

if (posArgs.length < 1) {
  console.error('用法: node 生成小红书论坛体图片.js <markdown文件路径> [输出目录] [--theme=warm-orange|--random|--color=#HEX]');
  process.exit(1);
}

generateXHSImages(posArgs[0], posArgs[1], options).catch((err) => {
  console.error('生成失败:', err.message);
  process.exit(1);
});
