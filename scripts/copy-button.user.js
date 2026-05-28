// ==UserScript==
// @name         AME Markdown Viewer — Copy Code Button
// @namespace    https://github.com/tarminjapan/AME-Markdown-Viewer-Design
// @version      1.0.0
// @description  Add a copy button to every code block in Markdown Viewer.
// @author       tarminjapan
// @match        *://*/*
// @resource     COPY_BUTTON_CSS https://raw.githubusercontent.com/tarminjapan/AME-Markdown-Viewer-Design/main/themes/Cyber-Flat/copy-button.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  GM_addStyle(GM_getResourceText("COPY_BUTTON_CSS"));

  var CONTAINER_SELECTOR =
    ".markdown-preview, .markdown-body, article, main, body";

  var FEEDBACK_DURATION = 2000;

  function fallbackCopyText(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    var ok;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }

    document.body.removeChild(textarea);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      });
    }
    return Promise.resolve(fallbackCopyText(text));
  }

  function setButtonState(button, state) {
    button.classList.remove("copied", "failed");

    if (state === "copied") {
      button.textContent = "COPIED";
      button.classList.add("copied");
      button.setAttribute("aria-label", "コードをコピーしました");
      button.setAttribute("title", "コードをコピーしました");
    } else if (state === "failed") {
      button.textContent = "FAILED";
      button.classList.add("failed");
      button.setAttribute("aria-label", "コードのコピーに失敗しました");
      button.setAttribute("title", "コードのコピーに失敗しました");
    } else {
      button.textContent = "COPY";
      button.setAttribute("aria-label", "コードをコピー");
      button.setAttribute("title", "コードをコピー");
    }
  }

  function createCopyButton(preBlock) {
    if (!(preBlock instanceof HTMLPreElement)) {
      return;
    }
    if (
      preBlock.parentElement &&
      preBlock.parentElement.classList.contains("code-block-wrapper")
    ) {
      return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";

    preBlock.parentNode.insertBefore(wrapper, preBlock);
    wrapper.appendChild(preBlock);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code-button";
    setButtonState(button, "idle");

    var timeoutId = null;

    button.addEventListener("click", function () {
      var code = preBlock.querySelector("code");
      var text = code ? code.textContent : preBlock.textContent;

      if (!text || !text.trim()) {
        return;
      }

      copyText(text)
        .then(function (ok) {
          if (!ok) {
            throw new Error("Copy failed");
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          setButtonState(button, "copied");
          timeoutId = setTimeout(function () {
            setButtonState(button, "idle");
            timeoutId = null;
          }, FEEDBACK_DURATION);
        })
        .catch(function () {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          setButtonState(button, "failed");
          timeoutId = setTimeout(function () {
            setButtonState(button, "idle");
            timeoutId = null;
          }, FEEDBACK_DURATION);
        });
    });

    wrapper.appendChild(button);
  }

  function initializeNode(root) {
    if (!(root instanceof Element)) {
      return;
    }
    if (root.matches("pre")) {
      createCopyButton(root);
    } else {
      root.querySelectorAll("pre").forEach(createCopyButton);
    }
  }

  function init() {
    var container = document.querySelector(CONTAINER_SELECTOR) || document.body;
    initializeNode(container);

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            initializeNode(node);
          }
        });
      });
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
