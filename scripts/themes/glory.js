/**
 * 【品类二：同人向 ·《全职高手》荣耀官方论坛】
 * 视觉风格：荣耀官方论坛 · 深空暗金电竞风 UI (glory-gold)
 * 包含：荣耀圣剑双翼徽章、六边形电竞装甲头像、各大公会阵营标签、黑底白字海报组件、全职固定标准封面
 */

const fs = require('fs');
const path = require('path');
const { formatInlineMarkdown, splitCoverTitleLines } = require('./common');

const GLORY_THEME = {
  category: 'glory',
  id: 'glory-gold',
  label: '荣耀鎏金（全职高手·荣耀官方论坛专属配色）',
  isGloryTheme: true,
  paperBg: '#080C15',
  inkColor: '#E2E8F0',
  inkMuted: '#94A3B8',
  markerSolid: '#D99B26',
  markerDeep: '#A82E22',
  markerSoft: '#FFF0C2',
  highlighter: 'rgba(255, 206, 84, 0.58)',
  darkCardFill: '#182438',
  darkCardShadow: '#D99B26',
  darkAccent: '#F5C451',
  topbarBg: '#162338',
  topbarBorder: '#D99B26',
  topbarText: '#F8F4E6',
  topbarAccent: '#F5C451',
};

const MAJIA_AUTHORS = new Set([
  '风城追剧人',
  '夜雨声烦烦烦',
  '暗无天日_今天也在加班',
  '魔剑士不语',
]);

/**
 * 判断一篇论坛体 Markdown 是否属于《全职高手》荣耀品类
 */
function isGloryContent(boardName = '', mdContent = '') {
  return (
    boardName.includes('荣耀') ||
    mdContent.includes('荣耀官方论坛') ||
    mdContent.includes('一叶之秋') ||
    mdContent.includes('唐三打') ||
    mdContent.includes('君莫笑')
  );
}

/**
 * 《全职高手》官方原版【荣耀 GLORY】徽章 SVG（中心机械齿轮 + 六芒星法阵 + 分层机械黄金双翼 + X形交叉双剑）
 */
function getGloryLogoSVG(size = 16, isWatermark = false) {
  const opacityAttr = isWatermark ? 'opacity="0.12"' : '';
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" ${opacityAttr} style="vertical-align: -3px; flex-shrink: 0;">
      <path d="M26 6L94 74M94 6L26 74" stroke="#CBD5E1" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M22 14L34 2M86 2L98 14" stroke="#F5C451" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M44 34L4 16L14 29L2 32L16 41L8 46L26 50L18 56L45 52Z" fill="#F5C451" stroke="#B47B16" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M76 34L116 16L106 29L118 32L104 41L112 46L94 50L102 56L75 52Z" fill="#F5C451" stroke="#B47B16" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="60" cy="40" r="22" fill="#111827" stroke="#F5C451" stroke-width="3" stroke-dasharray="5 3"/>
      <circle cx="60" cy="40" r="18" fill="#0B111E" stroke="#D99B26" stroke-width="1.6"/>
      <polygon points="60,24 73,47 47,47" stroke="#F59E0B" stroke-width="1.5" fill="rgba(245, 158, 11, 0.12)"/>
      <polygon points="60,56 73,33 47,33" stroke="#F59E0B" stroke-width="1.5" fill="rgba(245, 158, 11, 0.12)"/>
      <path d="M60 8L63 22V62L60 74L57 62V22L60 8Z" fill="#F8FAFC" stroke="#D99B26" stroke-width="1.2"/>
      <circle cx="60" cy="40" r="3.2" fill="#EF4444" stroke="#FEF08A" stroke-width="1"/>
    </svg>
  `;
}

let cachedGloryBgDataURI = null;
function getGloryOfficialLogoDataURI() {
  if (cachedGloryBgDataURI !== null) return cachedGloryBgDataURI;
  const candidates = [
    path.join(__dirname, '..', 'assets', 'glory-clean-crest.png'),
    path.resolve(process.cwd(), '工具/assets/glory-clean-crest.png'),
    '/Users/bytedance/Library/Mobile Documents/iCloud~md~obsidian/Documents/职业技术/工具/assets/glory-clean-crest.png',
    path.join(__dirname, '..', 'assets', 'glory-main.jpg'),
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
 * 《全职高手》硬核电竞六边形装甲头像（Hexagon Esports Crest SVG）
 */
function getGloryEsportsAvatarSVG(floor) {
  const author = floor.author || '';
  const hexOuter = 'M18 2L32 10V26L18 34L4 26V10L18 2Z';
  const hexInner = 'M18 4.8L29.5 11.4V24.6L18 31.2L6.5 24.6V11.4L18 4.8Z';

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

  if (author.includes('唐昊') || author.includes('呼啸')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#F5C451" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#1E293B"/>
        <path d="M9 24L22 9M13.5 26L25.5 12M18 27.5L28 16" stroke="#EF4444" stroke-width="2.3" stroke-linecap="square"/>
        <path d="M8 21L15 28L11.5 29.5L6.5 24.5Z" fill="#F5C451"/>
      </svg>`;
  }

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

  if (author.includes('江波涛') || author.includes('魔剑') || author.includes('轮回') || author.includes('枪王')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#38BDF8" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#0C4A6E"/>
        <path d="M18 7L20.8 15.2L29 18L20.8 20.8L18 29L15.2 20.8L7 18L15.2 15.2L18 7Z" fill="#F5C451"/>
        <circle cx="18" cy="18" r="2.2" fill="#0F172A"/>
      </svg>`;
  }

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

  if (author.includes('风城') || author.includes('烟雨')) {
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${hexOuter}" fill="#0F172A" stroke="#C084FC" stroke-width="1.8"/>
        <path d="${hexInner}" fill="#4C1D95"/>
        <path d="M18 8L24 16L18 24L12 16L18 8Z" fill="#E9D5FF" stroke="#F5C451" stroke-width="1.4"/>
        <circle cx="18" cy="16" r="2.2" fill="#F5C451"/>
      </svg>`;
  }

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
 * 获取《全职高手》荣耀论坛专属阵营/角色/战队标签
 */
function getGloryBadgeHTML(floor) {
  const author = floor.author || '';
  let roleClass = 'role-anon';
  if (floor.isOP) roleClass = 'role-op';
  else if (floor.isSpecialUser) roleClass = 'role-special';

  let badgeHTML = '';
  if (floor.isOP) {
    badgeHTML = '<span class="sketch-stamp stamp-op">楼主</span>';
  } else if (floor.isSpecialUser) {
    if (author.includes('孙翔') || author.includes('江波涛') || author.includes('轮回')) {
      badgeHTML = '<span class="sketch-stamp stamp-special">轮回战队</span>';
    } else if (author.includes('唐昊') || author.includes('呼啸')) {
      badgeHTML = '<span class="sketch-stamp stamp-special">呼啸战队</span>';
    } else if (author.includes('叶修') || author.includes('兴欣')) {
      badgeHTML = '<span class="sketch-stamp stamp-special">兴欣战队</span>';
    } else {
      badgeHTML = '<span class="sketch-stamp stamp-special">职业认证</span>';
    }
  } else if (author.includes('风城') || author.includes('烟雨')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">烟雨楼</span>';
  } else if (author.includes('夜雨') || author.includes('索克萨尔') || author.includes('蓝溪阁') || author.includes('拔刀斩') || author.includes('剑客')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">蓝溪阁</span>';
  } else if (author.includes('暗无天日') || author.includes('呼啸')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">呼啸山庄</span>';
  } else if (author.includes('魔剑士') || author.includes('一叶') || author.includes('轮回') || author.includes('枪王')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">轮回谷</span>';
  } else if (author.includes('百花') || author.includes('弹药')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">百花谷</span>';
  } else if (author.includes('霸图') || author.includes('霸气雄图')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">霸气雄图</span>';
  } else if (author.includes('嘉王朝')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">嘉王朝</span>';
  } else if (author.includes('十区') || author.includes('兴欣')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">兴欣公会</span>';
  } else if (author.includes('匿名')) {
    badgeHTML = '<span class="sketch-stamp stamp-guild">匿名老玩家</span>';
  } else {
    const defaultGuilds = ['兴欣公会', '中草堂', '踏破虚空', '义斩天下'];
    badgeHTML = `<span class="sketch-stamp stamp-guild">${defaultGuilds[floor.numInt % defaultGuilds.length]}</span>`;
  }

  return { roleClass, badgeHTML };
}

/**
 * 渲染全职高手黑底白字红章大字报组件（按需调用）
 */
function renderGloryPosterHTML(posterKey, pIdx) {
  const POSTER_DATA = {
    'official-1': {
      badge: 'GLORY OFFICIAL // 荣耀官方公告 01',
      title: '《荣耀》没有涨价',
      isGiant: false,
      accentColor: '#EF4444',
      lines: [
        '“刹那”是一种全新的点卡回馈品级序列，它对应的礼匣初始定价即为 400 点卡积分。',
        '这是它首次推出，一经推出就已经确定此价格。',
        '刹那品级包含无属性流光纪念披风，推出频率极低，2026 年仅推出一次。',
      ],
      slogan: '“荣耀无限，此爱不变。”',
      stamp: '荣耀运营部',
    },
    'official-2': {
      badge: 'GLORY OFFICIAL // 荣耀官方公告 02',
      title: '《荣耀》想赚钱。',
      isGiant: true,
      accentColor: '#EF4444',
      lines: [
        '只有赚到足够的钱，我们才能扩大产能，持续稳定地升级神之领域服务器，打磨更好的美术品质，开发更新颖的副本内容。',
        '这个荣耀的世界，才能长长久久。',
      ],
      slogan: '“荣耀无限，此爱不变。”',
      stamp: '荣耀运营部',
    },
    'official-3': {
      badge: 'GLORY OFFICIAL // 荣耀官方公告 03',
      title: '《荣耀》没有变。',
      isGiant: false,
      accentColor: '#EF4444',
      lines: [
        '主创团队没有变（制作人 / 主笔、主美、主程都没有变）。十年点卡收费不卖数值的设计理念没有变。',
        '至少在荣耀的世界里，我们所拥有的爱与理解都是真的，且不会改变。被夸了就高高兴兴地做，被骂了也坚守本心。',
      ],
      slogan: '“荣耀无限，此爱不变。”',
      stamp: '荣耀运营部',
    },
    'xingxin': {
      badge: 'XINGXIN GUILD // 神之领域·兴欣公会',
      title: '《兴欣公会》也想赚钱。',
      isGiant: true,
      accentColor: '#DC2626',
      lines: [
        '只有赚到足够的稀有材料和金币，我们才能给公会仓库填满 75 级材料，才能给前线抢野图 BOSS 的斥候兄弟报销点卡和红蓝药水，才能交得起兴欣大本营八月份的空调电费。',
        '这个属于兴欣的草根公会，才能长长久久。',
      ],
      slogan: '“兴欣无限，网费不变。”',
      stamp: '一起做大做强',
    },
    'yizhan': {
      badge: 'YIZHAN GUILD // 神之领域·义斩天下',
      title: '《义斩天下》不想赚钱。',
      isGiant: true,
      accentColor: '#F5C451',
      lines: [
        '啊？在荣耀里建公会还能赚钱的吗？',
        '我们公会管理层开会研究三年了，建公会不是每个月给全体会员免费报销点卡、每天发满级药水、高价从散人手里收购稀有材料、纯往里砸钱听个响的福利项目吗？怎么你们都在聊赚钱？',
      ],
      slogan: '“义斩无限，预算不变。”',
      stamp: '钞能力认证',
    },
    'lanxige': {
      badge: 'LANXIGE GUILD // 神之领域·蓝溪阁',
      title: '《蓝溪阁》想抢BOSS。',
      isGiant: true,
      accentColor: '#38BDF8',
      lines: [
        '总会长春易老没有变，五大高手没有变，每次把野图 BOSS 辛辛苦苦打到最后百分之五血量就被人截胡的命运也没有变。',
        '被抢了就擦干眼泪继续开荒，抢到了就高高兴兴回城分赃。',
      ],
      slogan: '“蓝溪无限，背锅不变。”',
      stamp: '老春已批:发',
    },
    'baqixiongtu': {
      badge: 'BAQIXIONGTU GUILD // 神之领域·霸气雄图',
      title: '《霸气雄图》想清场。',
      isGiant: true,
      accentColor: '#EF4444',
      lines: [
        '只有把野图周围的闲杂人等全部清场，我们才能稳定产出稀有材料，才能不用天天半夜三点被兴欣那帮土匪偷袭。',
        '这个属于霸气雄图的刷怪点，才能长长久久。',
      ],
      slogan: '“霸图无限，清场不变。”',
      stamp: '会长蒋游亲批',
    },
    'zhongcaotang': {
      badge: 'ZHONGCAOTANG GUILD // 神之领域·中草堂',
      title: '《中草堂》想种药。',
      isGiant: true,
      accentColor: '#22C55E',
      lines: [
        '只有种出足够的稀有草药，我们才能供得起俱乐部炼制满级药剂，天南星和车前子才不用天天吃速效救心丸。',
        '这片神之领域的药圃，才能长长久久。',
      ],
      slogan: '“中草无限，种地不变。”',
      stamp: '药圃重地禁踩',
    },
    'baihuagu': {
      badge: 'BAIHUAGU GUILD // 神之领域·百花谷',
      title: '《百花谷》想炸图。',
      isGiant: true,
      accentColor: '#F472B6',
      lines: [
        '只有攒够足够的绚烂手雷和冰晶弹药，我们才能把周围抢怪的土匪全炸上天，让整个野图连一只蚊子都看不清。',
        '这片绚烂的百花盛景，才能长长久久。',
      ],
      slogan: '“百花无限，手雷不变。”',
      stamp: '显卡燃烧警告',
    },
    'lunhui': {
      badge: 'LUNHUI GUILD // 神之领域·轮回公会',
      title: '《轮回公会》想刷本。',
      isGiant: true,
      accentColor: '#38BDF8',
      lines: [
        '我们会长三界六道平时话不多，俱乐部楼上那位更是惜字如金。',
        '总之我们没有别的诉求，就是想安安静静、没人捣乱地刷完今晚的 75 级十人副本。',
      ],
      slogan: '“轮回无限，沉默不变。”',
      stamp: '三界六道认证',
    },
    'huxiao': {
      badge: 'HUXIAO GUILD // 神之领域·呼啸山庄',
      title: '《呼啸山庄》想偷袭。',
      isGiant: true,
      accentColor: '#F97316',
      lines: [
        '正面排队等刷新是不可能的。只有趁你们打得两败俱伤时从背后摸上来拍黑砖，我们才能用最少的点卡拿最多的掉落。',
        '这股属于流氓的优良传统，才能长长久久。',
      ],
      slogan: '“呼啸无限，板砖不变。”',
      stamp: '背后小心黑砖',
    },
    'tapoxukong': {
      badge: 'TAPOXUKONG GUILD // 神之领域·踏破虚空',
      title: '《踏破虚空》想传送。',
      isGiant: true,
      accentColor: '#A855F7',
      lines: [
        '只有攒够足够的吟唱法力值，我们的鬼阵才能铺满整个复活点，把路过的散人和友商统统传送进岩浆坑里。',
        '这座虚空鬼阵，才能长长久久。',
      ],
      slogan: '“虚空无限，鬼阵不变。”',
      stamp: '落地即进岩浆',
    },
    'mushi': {
      badge: 'GLORY PLAYER // 神之领域·治疗玩家自制',
      title: '《脆皮牧师》想加血。',
      isGiant: false,
      accentColor: '#FBBF24',
      lines: ['只有你们走位别那么风骚、别老往 BOSS 红圈里踩，我的法力值才能长长久久。'],
      slogan: '“牧师无限，放生不变。”',
      stamp: '再乱跑就放生',
    },
    'shihuang': {
      badge: 'GLORY PLAYER // 神之领域·野生拾荒党自制',
      title: '《拾荒人》想捡漏。',
      isGiant: false,
      accentColor: '#94A3B8',
      lines: ['只有各大公会打架打得再凶一点、掉的装备再多一点，我在复活点旁边蹲草丛的事业才能长长久久。'],
      slogan: '“拾荒无限，手速不变。”',
      stamp: '草丛常驻嘉宾',
    },
    'yingjiesheng': {
      badge: 'GLORY PLAYER // 神之领域·苦命打工人自制',
      title: '《应届生》想赚钱。',
      isGiant: false,
      accentColor: '#38BDF8',
      lines: ['只有赚到足够的工资，我才能交得起房租、充得起 30 块钱一张的荣耀标准点卡。'],
      slogan: '“牛马无限，穷鬼不变。”',
      stamp: '真实破防现场',
    },
  };

  const data = POSTER_DATA[posterKey];
  if (!data) return '';

  const linesHTML = data.lines.map((l) => `<div class="gp-line">${l}</div>`).join('');
  return `
    <div class="floor-p glory-poster-card ${data.isGiant ? 'gp-giant' : ''}" data-p-idx="${pIdx}" style="--gp-accent: ${data.accentColor};">
      <div class="gp-bg-crest">${getGloryLogoSVG(84, true)}</div>
      <div class="gp-top-bar">
        <span class="gp-badge">${getGloryLogoSVG(11)} ${data.badge}</span>
      </div>
      <div class="gp-headline">${data.title}</div>
      <div class="gp-body">${linesHTML}</div>
      <div class="gp-footer">
        <span class="gp-slogan">${data.slogan}</span>
        <span class="gp-red-stamp">${data.stamp}</span>
      </div>
    </div>
  `;
}

function buildGloryEsportsCSS(theme, fontSize = 15.5, lineHeight = 1.45, cardGap = 6) {
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
    /* 375px 手机原生宽度 + 高度自适应 (3x 导出为 1125px 宽高清图) */
    .xhs-card {
      width: 375px;
      height: auto;
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
    #card-cover {
      height: 500px;
    }
    /* 页面背景正中央的《全职高手·荣耀 GLORY》大幅官方正版徽章水印 */
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
    /* 楼层卡片列表容器：禁止 flex-shrink 压缩导致末行被裁切 */
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
    /* 单个楼层：无方框纯横线分隔（背景全透明，仅底部细横线隔开） */
    .floor-item {
      position: relative;
      padding: 5px 4px 6px 4px;
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
    .glory-poster-card {
      position: relative;
      background: #04060A;
      border: 1.2px solid rgba(245, 196, 81, 0.45);
      border-top: 2.5px solid var(--gp-accent, #EF4444);
      border-radius: 3px;
      padding: 7px 10px 7px 10px;
      margin: 4px 0;
      text-align: center;
      overflow: hidden;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.65);
    }
    .gp-bg-crest {
      position: absolute;
      right: -6px;
      bottom: -8px;
      pointer-events: none;
      opacity: 0.75;
      z-index: 0;
    }
    .gp-top-bar {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: center;
      margin-bottom: 3px;
    }
    .gp-badge {
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.6px;
      color: #94A3B8;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .gp-headline {
      position: relative;
      z-index: 1;
      font-size: 18px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: 0.8px;
      line-height: 1.25;
      margin: 2px 0 5px 0;
      text-shadow: 0 1px 6px rgba(255, 255, 255, 0.14);
    }
    .glory-poster-card.gp-giant .gp-headline {
      font-size: 20.5px;
      letter-spacing: 1px;
    }
    .gp-body {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 2.5px;
      margin-bottom: 5px;
    }
    .gp-line {
      font-size: 11px;
      line-height: 1.35;
      color: #CBD5E1;
      font-weight: 500;
    }
    .gp-footer {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding-top: 4px;
      border-top: 1px dashed rgba(255, 255, 255, 0.12);
    }
    .gp-slogan {
      font-size: 11px;
      font-weight: 800;
      color: #FDE68A;
      letter-spacing: 0.4px;
    }
    .gp-red-stamp {
      font-size: 8.5px;
      font-weight: 900;
      color: #FECACA;
      background: rgba(185, 28, 28, 0.32);
      border: 1px solid #EF4444;
      padding: 0.5px 4px;
      border-radius: 2px;
      letter-spacing: 0.5px;
    }
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
    .ending-archive-card {
      margin-top: 6px;
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
    /* ==================== 全职高手固定标准封面 (00-封面.png) ==================== */
    #card-cover {
      width: 375px;
      height: 500px;
      background-color: #080C15;
      background-image: none;
      padding: 16px;
      border-top: none;
      display: flex;
    }
    .glory-cover-outer-frame {
      flex: 1;
      border: 1.5px solid #D99B26;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 28px 18px 24px 18px;
      background-color: #080C15;
    }
    .glory-cover-outer-frame::before {
      content: "";
      position: absolute;
      inset: 5px;
      border: 0.5px solid rgba(217, 155, 38, 0.35);
      pointer-events: none;
    }
    .glory-cover-top-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .glory-cover-top-meta {
      font-family: "DIN Alternate", "SF Mono", monospace;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #D99B26;
    }
    .glory-cover-center-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      margin: auto 0;
    }
    .glory-cover-topic-pill {
      background-color: #DC2626;
      color: #FFFFFF;
      font-size: 11.5px;
      font-weight: 800;
      padding: 3px 10px;
      letter-spacing: 1px;
      border-radius: 2px;
    }
    .glory-cover-main-title {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .glory-cover-title-line-1 {
      font-size: 35px;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.25;
      letter-spacing: 1px;
      white-space: nowrap;
    }
    .glory-cover-title-line-2 {
      font-size: 40px;
      font-weight: 900;
      color: #F5C451;
      line-height: 1.25;
      letter-spacing: 1px;
      white-space: nowrap;
    }
    .glory-cover-divider-line {
      width: 48px;
      height: 2px;
      background-color: #D99B26;
      margin: 2px 0;
    }
    .glory-cover-sub-text {
      font-size: 13px;
      font-weight: 500;
      color: #94A3B8;
      line-height: 1.6;
      max-width: 268px;
    }
    .glory-cover-bottom-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 14px;
      border-top: 1px solid rgba(217, 155, 38, 0.28);
      font-size: 11px;
      font-weight: 600;
      color: #94A3B8;
    }
    .glory-cover-footer-tag {
      color: #F5C451;
      font-family: "DIN Alternate", "SF Mono", monospace;
      letter-spacing: 0.8px;
    }
  `;
}

function getGloryCoverSubText(parsed, cleanTitle) {
  if (cleanTitle.includes('想赚钱')) {
    return '“只有赚到足够的点卡钱，神之领域才能长长久久。荣耀无限，此爱不变。”';
  }
  if (cleanTitle.includes('后会友期')) {
    return '“我是被钉在耻辱柱上的人，我能去哪儿啊……我画地为牢啊，孙翔。”';
  }
  for (const f of parsed.floors) {
    for (const p of f.paragraphs) {
      const m = p.match(/「([^」]{10,42})」/);
      if (m) return `“${m[1]}”`;
    }
  }
  return '“荣耀再玩十年也不会腻。神之领域灌水区年度精华热帖归档。”';
}

function getGloryCoverCrestSVG(size = 82) {
  return `
    <svg width="${size}" height="${Math.round(size * 0.68)}" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 6L94 74M94 6L26 74" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
      <path d="M22 14L34 2M86 2L98 14" stroke="#D99B26" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M44 34L4 16L14 29L2 32L16 41L8 46L26 50L18 56L45 52Z" fill="#D99B26" stroke="#92620E" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M76 34L116 16L106 29L118 32L104 41L112 46L94 50L102 56L75 52Z" fill="#D99B26" stroke="#92620E" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="60" cy="40" r="22" fill="#0B0F19" stroke="#D99B26" stroke-width="2.8" stroke-dasharray="5 3"/>
      <circle cx="60" cy="40" r="18" fill="#080C15" stroke="#B47B16" stroke-width="1.5"/>
      <polygon points="60,24 73,47 47,47" stroke="#D99B26" stroke-width="1.4" fill="none"/>
      <polygon points="60,56 73,33 47,33" stroke="#D99B26" stroke-width="1.4" fill="none"/>
      <path d="M60 8L63 22V62L60 74L57 62V22L60 8Z" fill="#F8FAFC" stroke="#D99B26" stroke-width="1.1"/>
      <circle cx="60" cy="40" r="3.2" fill="#DC2626"/>
    </svg>
  `;
}

function renderGloryCoverCardHTML(parsed, titleTag, cleanTitle) {
  const opFloor = parsed.floors.find((f) => f.isOP) || parsed.floors[0];
  const { line1, line2, size1, size2 } = splitCoverTitleLines(cleanTitle);
  const subText = getGloryCoverSubText(parsed, cleanTitle);

  return `
    <div class="xhs-card" id="card-cover">
      <div class="glory-cover-outer-frame">
        <div class="glory-cover-top-header">
          ${getGloryCoverCrestSVG(82)}
          <div class="glory-cover-top-meta">GLORY OFFICIAL FORUM · 神之领域</div>
        </div>

        <div class="glory-cover-center-hero">
          <div class="glory-cover-topic-pill">#${formatInlineMarkdown(titleTag)} 灌水区精华热帖</div>
          <div class="glory-cover-main-title">
            <div class="glory-cover-title-line-1" style="font-size: ${size1}px;">${formatInlineMarkdown(line1)}</div>
            <div class="glory-cover-title-line-2" style="font-size: ${size2}px;">${formatInlineMarkdown(line2)}</div>
          </div>
          <div class="glory-cover-divider-line"></div>
          <div class="glory-cover-sub-text">${formatInlineMarkdown(subText)}</div>
        </div>

        <div class="glory-cover-bottom-footer">
          <span>楼主：${formatInlineMarkdown(opFloor.author)}</span>
          <span class="glory-cover-footer-tag">${parsed.floors.length - 1} REPLIES &gt;&gt;&gt;</span>
        </div>
      </div>
    </div>
  `;
}

function getGloryPageMeta(parsed, cleanTitle) {
  return {
    topbarLeftHTML: `${getGloryLogoSVG(15)}<span class="glory-badge-pill">GLORY</span><span>${formatInlineMarkdown(parsed.boardName)}</span>`,
    footerLeftText: '⚔ GLORY · 荣耀官方论坛水区',
    footerNextText: 'NEXT >>>',
    footerEndText: '[ GG · END ]',
    endingTitleText: '⚔ 荣耀官方论坛 · 水区传奇热帖归档',
    endingStatsText: cleanTitle.includes('想赚钱')
      ? `共 ${parsed.floors.length - 1} 条回帖 · 荣耀无限，此爱不变`
      : `共 ${parsed.floors.length - 1} 条回帖 · 第七赛季双子星大型真香现场`,
    endingStampText: '版主加精锁定',
    pageBgWatermarkHTML: getGloryPageBgWatermarkHTML(),
    heroWatermarkHTML: `<div class="glory-watermark">${getGloryLogoSVG(56, true)}</div>`,
  };
}

module.exports = {
  categoryId: 'glory',
  categoryName: '全职高手（荣耀官方论坛·深空暗金电竞风）',
  GLORY_THEME,
  MAJIA_AUTHORS,
  isGloryContent,
  getGloryLogoSVG,
  getGloryPageBgWatermarkHTML,
  getAvatarSVG: getGloryEsportsAvatarSVG,
  getBadgeHTML: getGloryBadgeHTML,
  renderGloryPosterHTML,
  buildCSS: buildGloryEsportsCSS,
  renderCoverCardHTML: renderGloryCoverCardHTML,
  getPageMeta: getGloryPageMeta,
};
