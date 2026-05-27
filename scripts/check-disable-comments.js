const fs = require("fs");
const path = require("path");

const PATTERNS = [
  { regex: /<!--\s*markdownlint-disable\b/, tool: "markdownlint", scope: "md" },
  { regex: /<!--\s*markdownlint-enable\b/, tool: "markdownlint", scope: "md" },
  { regex: /<!--\s*markdownlint-capture\b/, tool: "markdownlint", scope: "md" },
  { regex: /<!--\s*markdownlint-restore\b/, tool: "markdownlint", scope: "md" },
  { regex: /\/\*\s*stylelint-disable\b/, tool: "stylelint", scope: "css" },
  { regex: /\/\*\s*stylelint-enable\b/, tool: "stylelint", scope: "css" },
  { regex: /stylelint-disable-line\b/, tool: "stylelint", scope: "css" },
  { regex: /stylelint-disable-next-line\b/, tool: "stylelint", scope: "css" },
  { regex: /<!--\s*prettier-ignore\s*-->/, tool: "prettier", scope: "md" },
  { regex: /\/\*\s*prettier-ignore\s*\*\//, tool: "prettier", scope: "css" },
];

const MD_EXTS = [".md", ".markdown"];
const CSS_EXTS = [".css"];
const DOTFILES_MD = [".cursorrules", ".windsurfrules"];

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      files.push(...walkDir(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function isMdFile(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  return MD_EXTS.includes(ext) || DOTFILES_MD.includes(base);
}

function isCssFile(filePath) {
  return CSS_EXTS.includes(path.extname(filePath).toLowerCase());
}

function matchesScope(pattern, filePath) {
  if (pattern.scope === "all") return isMdFile(filePath) || isCssFile(filePath);
  if (pattern.scope === "md") return isMdFile(filePath);
  if (pattern.scope === "css") return isCssFile(filePath);
  return false;
}

const rootDir = path.resolve(__dirname, "..");
const allFiles = walkDir(rootDir);
let violations = [];

for (const file of allFiles) {
  if (!isMdFile(file) && !isCssFile(file)) continue;

  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");

  for (const pattern of PATTERNS) {
    if (!matchesScope(pattern, file)) continue;
    for (let i = 0; i < lines.length; i++) {
      if (pattern.regex.test(lines[i])) {
        const relPath = path.relative(rootDir, file);
        violations.push({
          file: relPath,
          line: i + 1,
          tool: pattern.tool,
          content: lines[i].trim(),
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error("ERROR: lint-disable comments are prohibited.\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.tool}] ${v.content}`);
  }
  console.error(
    `\n${violations.length} violation(s) found. ` +
      "Remove all lint-disable / prettier-ignore comments."
  );
  process.exit(1);
} else {
  console.log("OK: No lint-disable or prettier-ignore comments found.");
  process.exit(0);
}
