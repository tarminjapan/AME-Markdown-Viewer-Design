// ==UserScript==
// @name         AME Markdown Viewer — Copy Code Button
// @namespace    https://github.com/tarminjapan/AME-Markdown-Viewer-Design
// @version      2.0.0
// @description  Add a copy button to every code block + load Google Web Fonts (bypass CSP).
// @author       tarminjapan
// @match        *://*/*.md*
// @match        file:///*.md*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      fonts.googleapis.com
// @connect      fonts.gstatic.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  if (!location.pathname.toLowerCase().endsWith(".md")) return;

  var FONT_SOURCES = [
    "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap",
    "https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap",
    "https://fonts.googleapis.com/css2?family=BIZ+UDGothic:wght@400;700&display=swap",
  ];

  function gmFetchText(url) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: "GET",
        url: url,
        headers: { "User-Agent": navigator.userAgent },
        responseType: "text",
        onload: function (res) {
          if (res.status >= 200 && res.status < 300) {
            resolve(res.responseText);
          } else {
            reject(new Error("HTTP " + res.status));
          }
        },
        onerror: reject,
        ontimeout: reject,
      });
    });
  }

  function gmFetchDataURL(url) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: "GET",
        url: url,
        responseType: "blob",
        onload: function (res) {
          if (res.status >= 200 && res.status < 300) {
            var reader = new FileReader();
            reader.onloadend = function () {
              resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(res.response);
          } else {
            reject(new Error("HTTP " + res.status));
          }
        },
        onerror: reject,
        ontimeout: reject,
      });
    });
  }

  function inlineFontURLs(css) {
    var urlRegex = /url\(["']?(https?:\/\/[^)"'\s]+)["']?\)/g;
    var urls = [];
    var m;
    while ((m = urlRegex.exec(css)) !== null) {
      if (urls.indexOf(m[1]) === -1) urls.push(m[1]);
    }
    if (!urls.length) return Promise.resolve(css);

    return Promise.all(
      urls.map(function (u) {
        return gmFetchDataURL(u)
          .then(function (dataUrl) {
            return { from: u, to: dataUrl };
          })
          .catch(function () {
            return { from: u, to: u };
          });
      }),
    ).then(function (replacements) {
      var result = css;
      replacements.forEach(function (r) {
        result = result.split(r.from).join(r.to);
      });
      return result;
    });
  }

  function loadFonts() {
    Promise.all(
      FONT_SOURCES.map(function (url) {
        return gmFetchText(url)
          .then(inlineFontURLs)
          .catch(function () {
            return "";
          });
      }),
    ).then(function (cssParts) {
      var css = cssParts.join("\n");
      if (css) GM_addStyle(css);
    });
  }

  loadFonts();

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
