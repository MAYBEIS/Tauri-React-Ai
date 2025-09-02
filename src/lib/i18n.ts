/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02 17:07:48
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 17:09:56
 * @FilePath: \Tauri-React-Ai\src\lib\i18n.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言资源文件
import enTranslation from '../locales/en/translation.json';
import zhTranslation from '../locales/zh/translation.json';

const resources = {
  en: {
    translation: enTranslation
  },
  zh: {
    translation: zhTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh', // 默认语言
    fallbackLng: 'en', // 备用语言
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;