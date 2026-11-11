#!/usr/bin/env node
/**
 * 小红书「论坛体小说」高清图片渲染引擎（模块化多品类架构）
 *
 * 品类模块目录：./themes/
 *   - themes/oc.js     : 【OC 原创】手绘草稿手账风 UI（7套预设色系 + 随机/自定义色系）
 *   - themes/glory.js  : 【全职高手】荣耀官方论坛·深空暗金电竞风 UI (glory-gold)
 *   - themes/common.js : 公共 Markdown 行内格式化与标题切分工具
 *   - themes/index.js  : 品类注册表与路由（后续新增其他背景品类只需在 themes/ 下新增文件并注册）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { formatInlineMarkdown } = require('./themes/common');
const { PRESET_THEMES, ocModule, gloryModule, dragonModule, resolveThemeAndCategory } = require('./themes');

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

  const isGloryForum = gloryModule.isGloryContent(boardName, mdContent);
  const isDragonForum = dragonModule.isDragonContent(boardName, mdContent);
  const floors = [];
  const systemNotices = [];

  for (const rawBlock of blocks) {
    const blockLines = rawBlock.split('\n');
    let currentFloor = null;

    for (let i = 0; i < blockLines.length; i++) {
      const trimmed = blockLines[i].trim();
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
          isSpecialUser = !isOP && (rawAuthor.endsWith('V') || /^(轮回|呼啸|兴欣|蓝雨|微草|霸图|烟雨|百花)-/.test(rawAuthor));
          isMajia = !isOP && !isSpecialUser && gloryModule.MAJIA_AUTHORS.has(rawAuthor);
          isAnon = !isOP && !isSpecialUser;
        } else if (isDragonForum) {
          isSpecialUser = !isOP && dragonModule.isSpecialDragonAuthor(rawAuthor);
          isAnon = rawAuthor === '匿名用户' || rawAuthor.startsWith('匿名');
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
        if (quoteText) currentFloor.quotes.push(quoteText);
        continue;
      }
      currentFloor.paragraphs.push(trimmed);
    }
  }

  for (const f of floors) {
    if (isGloryForum) {
      const transformed = [];
      const hasOfficialPosters = f.paragraphs.some((p) => p.includes('黑底白字红章三连海报'));
      const hasXingxinPoster = f.paragraphs.some((p) => p.includes('《兴欣公会也想赚钱》黑底白字海报'));
      const hasYizhanPoster = f.paragraphs.some((p) => p.includes('《义斩天下不想赚钱》黑底白字海报'));
      const hasBaqiPoster = f.paragraphs.some((p) => p.includes('《霸气雄图想清场》黑底白字海报'));
      const hasLanxigePoster = f.paragraphs.some((p) => p.includes('《蓝溪阁想抢BOSS》黑底白字海报'));
      const hasGuildCollectionPosters = f.paragraphs.some((p) => p.includes('五张黑底白字海报合集'));
      const hasMushiPoster = f.paragraphs.some((p) => p.includes('《脆皮牧师想加血》黑底白字海报'));
      const hasShihuangPoster = f.paragraphs.some((p) => p.includes('《拾荒人想捡漏》黑底白字海报'));
      const hasYingjieshengPoster = f.paragraphs.some((p) => p.includes('《应届生想赚钱》黑底白字海报'));

      for (const p of f.paragraphs) {
        if (p.startsWith('（备注：') && p.includes('生成')) {
          if (hasXingxinPoster) transformed.push('[[POSTER:xingxin]]');
          if (hasYizhanPoster) transformed.push('[[POSTER:yizhan]]');
          if (hasBaqiPoster) transformed.push('[[POSTER:baqixiongtu]]');
          if (hasGuildCollectionPosters) {
            transformed.push(
              '[[POSTER:zhongcaotang]]',
              '[[POSTER:baihuagu]]',
              '[[POSTER:lunhui]]',
              '[[POSTER:huxiao]]',
              '[[POSTER:tapoxukong]]'
            );
          }
          if (hasMushiPoster) transformed.push('[[POSTER:mushi]]');
          if (hasShihuangPoster) transformed.push('[[POSTER:shihuang]]');
          if (hasYingjieshengPoster) transformed.push('[[POSTER:yingjiesheng]]');
          continue;
        }
        if (hasOfficialPosters && p.startsWith('第一张大字报：')) {
          transformed.push('[[POSTER:official-1]]');
          continue;
        }
        if (hasOfficialPosters && p.startsWith('第二张大字报：')) {
          transformed.push('[[POSTER:official-2]]');
          continue;
        }
        if (hasOfficialPosters && p.startsWith('第三张大字报：')) {
          transformed.push('[[POSTER:official-3]]');
          continue;
        }
        if (hasXingxinPoster && p.startsWith('底下配文写着：')) continue;
        if (hasYizhanPoster && p.startsWith('上面写着：')) continue;
        if (hasLanxigePoster && p.startsWith('底下小字写得跟血泪控诉书似的：')) {
          transformed.push('[[POSTER:lanxige]]');
          continue;
        }
        if (hasMushiPoster && p.startsWith('《脆皮牧师》想加血。')) continue;
        if (hasShihuangPoster && p.startsWith('《拾荒人》想捡漏。')) continue;
        if (hasYingjieshengPoster && p.startsWith('《应届生》想赚钱。')) continue;
        transformed.push(p);
      }
      f.paragraphs = transformed;
    }

    if (!f.isOP && f.paragraphs.length > 1) {
      const merged = [];
      for (const p of f.paragraphs) {
        if (
          merged.length > 0 &&
          !p.startsWith('[[POSTER:') &&
          !merged[merged.length - 1].startsWith('[[POSTER:') &&
          merged[merged.length - 1].length + p.length <= 46
        ) {
          merged[merged.length - 1] += ' ' + p;
        } else {
          merged.push(p);
        }
      }
      f.paragraphs = merged;
    }
  }

  return { boardName, title: title || '匿名树洞求助帖', floors, systemNotices, isGloryForum };
}

function renderFloorSliceHTML(floor, slice, theme, handler) {
  const { roleClass, badgeHTML } = handler.getBadgeHTML(floor);
  const avatarSVG = handler.getAvatarSVG(floor, theme);

  const quotesHTML = (slice.quotes || [])
    .map((q) => `<div class="floor-quote">↳ ${formatInlineMarkdown(q, floor.isSpecialUser)}</div>`)
    .join('');

  const paragraphsHTML = (slice.paragraphs || [])
    .map((p, pIdx) => {
      const posterMatch = p.match(/^\[\[POSTER:([a-z0-9-]+)\]\]$/);
      if (posterMatch && handler.renderGloryPosterHTML) {
        return handler.renderGloryPosterHTML(posterMatch[1], pIdx);
      }
      return `<p class="floor-p" data-p-idx="${pIdx}">${formatInlineMarkdown(p, floor.isSpecialUser)}</p>`;
    })
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

async function measureAndPaginate(page, parsed, titleTag, cleanTitle, theme, handler, fontSize, lineHeight, cardGap) {
  const fullFloorHTMLs = parsed.floors
    .map((f, idx) =>
      renderFloorSliceHTML(f, { isCont: false, quotes: f.quotes, paragraphs: f.paragraphs, sliceId: `f-${idx}` }, theme, handler)
    )
    .join('\n');

  const allSysHTML = parsed.systemNotices
    .map((s) => `<div class="system-notice">[封帖归档] ${formatInlineMarkdown(s, true)}</div>`)
    .join('\n');

  const css = handler.buildCSS(theme, fontSize, lineHeight, cardGap);
  const pageMeta = handler.getPageMeta(parsed, cleanTitle);

  const measureHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${css}</style>
    </head>
    <body>
      ${ocModule.buildGlobalSketchSVGDefs()}
      <div class="xhs-card" id="measure-card" style="height: auto; max-height: none; overflow: visible;">
        <div class="notebook-header" id="m-topbar">
          <span class="nb-left">${pageMeta.topbarLeftHTML}</span>
          <span class="nb-right">Page 01 / 01</span>
        </div>
        <div class="hero-memo-card" id="m-hero">
          <div class="washi-tape"></div>
          <div class="hero-sketch-box"></div>
          ${pageMeta.heroWatermarkHTML}
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
          <span>${pageMeta.footerLeftText}</span>
          <div class="sketch-doodle-line"></div>
          <span>${pageMeta.footerNextText}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(measureHTML, { waitUntil: 'load' });

  const metrics = await page.evaluate(() => {
    const topbarH = document.getElementById('m-topbar').getBoundingClientRect().height + 6;
    const heroH = document.getElementById('m-hero').getBoundingClientRect().height + 8;
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
      return { totalH: rect.height, chromeH: boxChrome + quotesH, contChromeH: boxChrome, pHeights };
    });

    return { topbarH, heroH, bottomH, sysH, floorDetails };
  });

  // 预留充足的上下内边距与跨浏览器折行安全余量（48px），写不下时自动按自然段断开并在下一页续写（#XXL (续)），绝不硬塞导致底部被切
  const usableCardH = 500 - 48 - metrics.topbarH - metrics.bottomH;
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

    if (usedH + gapBefore + detail.totalH <= maxH) {
      currentSlices.push({ floorIdx: i, isCont: false, quotes: floor.quotes, paragraphs: floor.paragraphs });
      usedH += gapBefore + detail.totalH;
      continue;
    }

    const remainingH = maxH - usedH - gapBefore;
    const firstSliceMinH = detail.chromeH + (detail.pHeights[0] || 0);
    if (currentSlices.length > 0 && (remainingH < firstSliceMinH || i === parsed.floors.length - 1)) {
      pushPage();
      maxH = getCurrentMaxH();
      if (detail.totalH <= maxH) {
        currentSlices.push({ floorIdx: i, isCont: false, quotes: floor.quotes, paragraphs: floor.paragraphs });
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

      if (currentSlices.length > 0 && usedH + g + baseChrome + detail.pHeights[pCursor] > maxH) {
        pushPage();
        maxH = getCurrentMaxH();
      }

      const actualGap = currentSlices.length > 0 ? cardGap : 0;
      let sliceH = baseChrome;
      const sliceParas = [];
      while (
        pCursor < floor.paragraphs.length &&
        (sliceParas.length === 0 || usedH + actualGap + sliceH + detail.pHeights[pCursor] <= maxH)
      ) {
        sliceH += detail.pHeights[pCursor];
        sliceParas.push(floor.paragraphs[pCursor]);
        pCursor++;
      }

      currentSlices.push({ floorIdx: i, isCont, quotes: isCont ? [] : floor.quotes, paragraphs: sliceParas });
      usedH += actualGap + sliceH;
      isCont = true;

      if (pCursor < floor.paragraphs.length) {
        pushPage();
      }
    }
  }

  if (currentSlices.length > 0) {
    const maxH = getCurrentMaxH();
    if (metrics.sysH > 0 && usedH + cardGap + metrics.sysH > maxH && currentSlices.length > 1) {
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

  return { pages, css, allSysHTML, pageMeta };
}

async function generateXHSImages(mdFilePath, customOutDir, options = {}) {
  const absMdPath = path.resolve(mdFilePath);
  if (!fs.existsSync(absMdPath)) {
    throw new Error(`找不到文件: ${absMdPath}`);
  }

  const mdContent = fs.readFileSync(absMdPath, 'utf8');
  const parsed = parseForumMarkdown(mdContent);
  const { theme, handler } = resolveThemeAndCategory(options, mdContent);

  if (parsed.floors.length === 0) {
    throw new Error('未能从 Markdown 文件中解析出任何楼层（需形如 **【0L 楼主】**）。');
  }

  const novelName = path.basename(absMdPath, path.extname(absMdPath));
  const defaultRepoRoot = '/Users/bytedance/Library/Mobile Documents/iCloud~md~obsidian/Documents/职业技术/小红书论坛体图库';
  const repoNovelDir = path.join(defaultRepoRoot, novelName);
  const outDir = customOutDir ? path.resolve(customOutDir) : repoNovelDir;
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
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();

  const targetFont = options.fontSize || 15.5;
  const preset = { fontSize: targetFont, lineHeight: 1.45, cardGap: 6 };

  const { pages, css, allSysHTML, pageMeta } = await measureAndPaginate(
    page,
    parsed,
    titleTag,
    cleanTitle,
    theme,
    handler,
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

  const cardsHTMLList = targetIndices.map((pageIdx) => {
    const p = pages[pageIdx];
    const isPage1 = pageIdx === 0;
    const pageNumStr = String(pageIdx + 1).padStart(2, '0');
    const totalNumStr = String(totalPages).padStart(2, '0');

    const heroHTML = isPage1
      ? `<div class="hero-memo-card">
           <div class="washi-tape"></div>
           <div class="hero-sketch-box"></div>
           ${pageMeta.heroWatermarkHTML}
           <div class="hero-content">
             <span class="sketch-topic-tag">#${formatInlineMarkdown(titleTag)}</span>
             <span class="title-text">${formatInlineMarkdown(cleanTitle)}</span>
           </div>
         </div>`
      : '';

    const pageFloorsHTML = p.slices
      .map((s, sIdx) =>
        renderFloorSliceHTML(parsed.floors[s.floorIdx], { ...s, sliceId: `p${pageIdx}-s${sIdx}` }, theme, handler)
      )
      .join('\n');

    const sysBlock = p.includeSys ? allSysHTML : '';
    const endingCardBlock = p.showEndingCard
      ? `<div class="ending-archive-card">
           <div class="ending-left">
             <div class="ending-title">${pageMeta.endingTitleText}</div>
             <div class="ending-stats">${pageMeta.endingStatsText}</div>
           </div>
           <div class="ending-stamp">${pageMeta.endingStampText}</div>
         </div>`
      : '';

    return `
      <div class="xhs-card" id="card-page-${pageIdx + 1}">
        ${pageMeta.pageBgWatermarkHTML}
        <div class="notebook-header">
          <span class="nb-left">${pageMeta.topbarLeftHTML}</span>
          <span class="nb-right">${pageNumStr} / ${totalNumStr}</span>
        </div>
        ${heroHTML}
        <div class="floors-container">
          ${pageFloorsHTML}
          ${sysBlock}
          ${endingCardBlock}
        </div>
        <div class="sketch-footer">
          <span>${pageMeta.footerLeftText}</span>
          <div class="sketch-doodle-line"></div>
          <span>${pageIdx + 1 === totalPages ? pageMeta.footerEndText : pageMeta.footerNextText}</span>
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
  let renderedCoverHTML = '';
  if (options.coverOnly || options.withCover || !isPartialRender) {
    renderedCoverHTML = handler.renderCoverCardHTML(parsed, titleTag, cleanTitle, theme);
    const coverFullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>
        ${ocModule.buildGlobalSketchSVGDefs()}
        ${renderedCoverHTML}
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
          ${ocModule.buildGlobalSketchSVGDefs()}
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
            flex-direction: column;
            gap: 24px;
            align-items: center;
          }
          .xhs-card {
            box-shadow: 6px 6px 0px rgba(0,0,0,0.35);
            outline: 2px solid #362D26;
          }
        </style>
      </head>
      <body>
        ${ocModule.buildGlobalSketchSVGDefs()}
        <div class="preview-header">
          <h2>✎ 小红书 3:4 单列预览（${theme.label} · 共 ${totalPages} 张）</h2>
        </div>
        <div class="preview-grid">
          ${renderedCoverHTML}
          ${cardsHTMLList.join('\n')}
        </div>
      </body>
      </html>
    `;
    fs.writeFileSync(previewHTMLPath, previewHTML, 'utf8');
  }

  await browser.close();

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
    if (path.resolve(outDir) !== path.resolve(repoNovelDir)) {
      for (const f of fs.readdirSync(outDir)) {
        if (f.endsWith('.png') || f === 'preview.html') {
          fs.copyFileSync(path.join(outDir, f), path.join(repoNovelDir, f));
        }
      }
    }
  }

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
    category: handler.categoryId,
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
  console.log('✎ 可用主题色系 (--theme=名称)：');
  for (const [k, v] of Object.entries(PRESET_THEMES)) {
    console.log(`  - ${k.padEnd(15)} : [${v.category || 'oc'}] ${v.label}`);
  }
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
  console.error('用法: node 生成小红书论坛体图片.js <markdown文件路径> [输出目录] [--theme=glory-gold|warm-orange|--random]');
  process.exit(1);
}

generateXHSImages(posArgs[0], posArgs[1], options).catch((err) => {
  console.error('生成失败:', err.message);
  process.exit(1);
});
