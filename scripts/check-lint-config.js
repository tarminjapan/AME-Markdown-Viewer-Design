const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
let violations = [];

function findNullValues(obj, prefix) {
  const results = [];
  for (const [key, value] of Object.entries(obj)) {
    const pathStr = prefix ? `${prefix}.${key}` : key;
    if (value === null) {
      results.push(pathStr);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      results.push(...findNullValues(value, pathStr));
    }
  }
  return results;
}

function checkJsonForNull(filePath, name) {
  const content = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(content);
  const nulls = findNullValues(json, "");
  if (nulls.length > 0) {
    violations.push({
      file: name,
      detail: `null values found at: ${nulls.join(", ")}`,
    });
  }
}

function checkStylelintrc() {
  const jsonCandidates = [".stylelintrc.json"];
  const jsCandidates = [
    ".stylelintrc.js",
    ".stylelintrc.cjs",
    "stylelint.config.js",
    "stylelint.config.cjs",
    "stylelint.config.mjs",
  ];

  for (const name of jsonCandidates) {
    const filePath = path.join(rootDir, name);
    if (fs.existsSync(filePath)) {
      checkJsonForNull(filePath, name);
    }
  }

  for (const name of jsCandidates) {
    const filePath = path.join(rootDir, name);
    if (fs.existsSync(filePath)) {
      try {
        const exported = require(filePath);
        const obj = exported.default || exported;
        const nulls = findNullValues(obj, "");
        if (nulls.length > 0) {
          violations.push({
            file: name,
            detail: `null values found at: ${nulls.join(", ")}`,
          });
        }
      } catch {
        violations.push({
          file: name,
          detail: "unable to load config for null check",
        });
      }
    }
  }
}

function checkMarkdownlintConfig() {
  const filePath = path.join(rootDir, ".markdownlint.json");
  if (!fs.existsSync(filePath)) return;

  checkJsonForNull(filePath, ".markdownlint.json");

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
  const jsonCandidates = [".prettierrc", ".prettierrc.json"];
  const jsCandidates = [".prettierrc.js"];

  for (const name of jsonCandidates) {
    const filePath = path.join(rootDir, name);
    if (fs.existsSync(filePath)) {
      checkJsonForNull(filePath, name);
    }
  }

  for (const name of jsCandidates) {
    const filePath = path.join(rootDir, name);
    if (fs.existsSync(filePath)) {
      try {
        const exported = require(filePath);
        const obj = exported.default || exported;
        const nulls = findNullValues(obj, "");
        if (nulls.length > 0) {
          violations.push({
            file: name,
            detail: `null values found at: ${nulls.join(", ")}`,
          });
        }
      } catch {
        violations.push({
          file: name,
          detail: "unable to load config for null check",
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
