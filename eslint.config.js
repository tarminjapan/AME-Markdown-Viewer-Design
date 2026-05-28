const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["scripts/check-*.js", "eslint.config.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    files: ["scripts/**/*.user.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        GM: "readonly",
        GM_addStyle: "readonly",
        GM_deleteValue: "readonly",
        GM_getResourceText: "readonly",
        GM_getResourceURL: "readonly",
        GM_getValue: "readonly",
        GM_info: "readonly",
        GM_listValues: "readonly",
        GM_log: "readonly",
        GM_openInTab: "readonly",
        GM_registerMenuCommand: "readonly",
        GM_setClipboard: "readonly",
        GM_setValue: "readonly",
        GM_xmlhttpRequest: "readonly",
        unsafeWindow: "readonly",
      },
    },
  },
];
