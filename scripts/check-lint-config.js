const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
let violations = [];

function checkStylelintrc() {
  const candidates = [
    ".stylelintrc.json",
    ".stylelintrc.yaml",
    ".stylelintrc.yml",
    ".stylelintrc.js",
    ".stylelintrc.cjs",
    "stylelint.config.js",
    "stylelint.config.cjs",
    "stylelint.config.mjs",
  ];

  for (const name of candidates) {
    const filePath = path.join(rootDir, name);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (/:\s*null\b/.test(content)) {
        violations.push({
          file: name,
          detail: "contains rule(s) set to null (disabled)",
        });
      }
    }
  }
}

function checkMarkdownlintConfig() {
  const filePath = path.join(rootDir, ".markdownlint.json");
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(content);

  for (const [key, value] of Object.entries(json)) {
    if (value === false) {
      violations.push({
        file: ".markdownlint.json",
        detail: `rule "${key}" is disabled (false)`,
      });
    }
  }
}

function checkPrettierrc() {
  const candidates = [".prettierrc", ".prettierrc.json", ".prettierrc.js"];
  for (const name of candidates) {
    const filePath = path.join(rootDir, name);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (/:\s*null\b/.test(content)) {
        violations.push({
          file: name,
          detail: "contains option(s) set to null (disabled)",
        });
      }
    }
  }
}

checkStylelintrc();
checkMarkdownlintConfig();
checkPrettierrc();

if (violations.length > 0) {
  console.error("ERROR: lint config with disabled rules is prohibited.\n");
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.detail}`);
  }
  console.error(
    `\n${violations.length} violation(s) found. ` +
      "Remove all disabled/null rules from config files."
  );
  process.exit(1);
} else {
  console.log("OK: No disabled lint rules in config files.");
  process.exit(0);
}
