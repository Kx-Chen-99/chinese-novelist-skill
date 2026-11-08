/**
 * 论坛体主题品类注册中心 (Theme Registry)
 * - oc    : OC 原创（手绘草稿手账风 UI）
 * - glory : 《全职高手》同人（荣耀官方论坛·深空暗金电竞风 UI）
 * 后续新增其他 IP/背景品类时，只需在此注册模块即可。
 */

const ocModule = require('./oc');
const gloryModule = require('./glory');

const PRESET_THEMES = {
  ...ocModule.OC_PRESET_THEMES,
  'glory-gold': gloryModule.GLORY_THEME,
};

function resolveThemeAndCategory(options = {}, mdContent = '') {
  if (options.theme === 'glory-gold') {
    return { theme: gloryModule.GLORY_THEME, handler: gloryModule };
  }
  if (options.color) {
    const hue = ocModule.hexToHue(options.color);
    return {
      theme: ocModule.createSketchThemeFromHue(hue, {
        id: `custom-${options.color}`,
        label: `自定义手绘色号 (${options.color} -> Hue=${hue}°)`,
      }),
      handler: ocModule,
    };
  }
  if (options.hue !== null && options.hue !== undefined && !Number.isNaN(options.hue)) {
    return {
      theme: ocModule.createSketchThemeFromHue(options.hue, {
        id: `hue-${options.hue}`,
        label: `自定义手绘色相 (Hue=${options.hue}°)`,
      }),
      handler: ocModule,
    };
  }
  if (options.random || options.theme === 'random') {
    const randomHue = Math.floor(Math.random() * 360);
    return {
      theme: ocModule.createSketchThemeFromHue(randomHue, {
        id: `random-hue-${randomHue}`,
        label: `随机生成手绘色系 (可通过 --hue=${randomHue} 复现)`,
      }),
      handler: ocModule,
    };
  }
  if (options.theme && PRESET_THEMES[options.theme]) {
    const t = PRESET_THEMES[options.theme];
    return { theme: t, handler: t.isGloryTheme ? gloryModule : ocModule };
  }
  if (gloryModule.isGloryContent('', mdContent)) {
    return { theme: gloryModule.GLORY_THEME, handler: gloryModule };
  }
  return { theme: ocModule.OC_PRESET_THEMES['warm-orange'], handler: ocModule };
}

module.exports = {
  PRESET_THEMES,
  ocModule,
  gloryModule,
  resolveThemeAndCategory,
};
