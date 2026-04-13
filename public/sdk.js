/**
 * Taedong Translate SDK v1.0.0
 * Floating language switcher + DOM translation engine
 * Usage: <script src="https://taedong-translate.vercel.app/sdk.js"
 *           data-api-key="td_tr_xxx"
 *           async></script>
 */
(function () {
  "use strict";

  // ─── Constants ────────────────────────────────────────────────────────────
  var API_BASE = (function () {
    var tag =
      document.currentScript ||
      (function () {
        var s = document.getElementsByTagName("script");
        for (var i = 0; i < s.length; i++)
          if (s[i].src && s[i].src.indexOf("sdk.js") !== -1) return s[i];
      })();
    if (tag && tag.src) {
      try {
        var u = new URL(tag.src);
        return u.origin;
      } catch (e) {}
    }
    return "https://taedong-translate.vercel.app";
  })();
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes — 플랫폼 설정 변경 빠르게 반영
  var COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    siteId: null,
    apiKey: null,
    config: null, // { locales, languages, defaultLocale, messages }
    currentLocale: null,
    sourceLocale: "ko",
    widget: null,
    observer: null,
    isTranslating: false,
    originalTexts: [], // [{ node, originalText }]
    showWidget: true,
    position: "bottom-right",
  };

  // ─── Utility: Cookie ──────────────────────────────────────────────────────
  function setCookie(name, value, maxAge) {
    var expires = maxAge ? "; max-age=" + maxAge : "";
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      expires +
      "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    var prefix = name + "=";
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i].trim();
      if (c.indexOf(prefix) === 0) {
        return decodeURIComponent(c.substring(prefix.length));
      }
    }
    return null;
  }

  // ─── Utility: LocalStorage cache ─────────────────────────────────────────
  function cacheKey(locale) {
    return "taedong_tr_cache_" + state.siteId + "_" + locale;
  }

  function saveCache(locale, messages) {
    try {
      var entry = { ts: Date.now(), messages: messages };
      localStorage.setItem(cacheKey(locale), JSON.stringify(entry));
    } catch (e) {
      // Silently ignore storage errors (private browsing, quota exceeded)
    }
  }

  function loadCache(locale) {
    try {
      var raw = localStorage.getItem(cacheKey(locale));
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) {
        localStorage.removeItem(cacheKey(locale));
        return null;
      }
      return entry.messages;
    } catch (e) {
      return null;
    }
  }

  // ─── Utility: Flatten nested message object ───────────────────────────────
  function flattenMessages(obj, prefix) {
    var result = {};
    prefix = prefix || "";
    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      var fullKey = prefix ? prefix + "." + key : key;
      if (
        obj[key] !== null &&
        typeof obj[key] === "object" &&
        !Array.isArray(obj[key])
      ) {
        var nested = flattenMessages(obj[key], fullKey);
        for (var nk in nested) {
          if (nested.hasOwnProperty(nk)) result[nk] = nested[nk];
        }
      } else {
        result[fullKey] = String(obj[key]);
      }
    }
    return result;
  }

  // Build reverse map: sourceValue → translationKey
  // And forward map: translationKey → targetValue
  function buildTranslationMaps(sourceMessages, targetMessages) {
    var sourceFlat = flattenMessages(sourceMessages);
    var targetFlat = flattenMessages(targetMessages);

    // sourceValue → targetValue
    var lookup = {};
    for (var key in sourceFlat) {
      if (!sourceFlat.hasOwnProperty(key)) continue;
      var srcVal = sourceFlat[key].trim();
      var tgtVal = targetFlat[key];
      if (srcVal && tgtVal && srcVal !== tgtVal) {
        lookup[srcVal] = tgtVal;
      }
    }
    return lookup;
  }

  // ─── DOM Walker ───────────────────────────────────────────────────────────
  var SKIP_TAGS = {
    SCRIPT: 1,
    STYLE: 1,
    NOSCRIPT: 1,
    IFRAME: 1,
    CODE: 1,
    PRE: 1,
    TEXTAREA: 1,
    INPUT: 1,
    SELECT: 1,
  };

  function walkTextNodes(root, callback) {
    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          var parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          var tag = parent.nodeName;
          if (SKIP_TAGS[tag]) return NodeFilter.FILTER_REJECT;
          if (node.nodeValue && node.nodeValue.trim())
            return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_SKIP;
        },
      },
      false,
    );
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) {
      nodes.push(node);
    }
    // Process collected nodes (avoid live NodeList mutation issues)
    for (var i = 0; i < nodes.length; i++) {
      callback(nodes[i]);
    }
  }

  // ─── Translation Engine ───────────────────────────────────────────────────
  function applyTranslation(lookup) {
    if (!lookup || !document.body) return;

    // Restore originals first (if switching between languages)
    restoreOriginals();

    state.originalTexts = [];
    state.isTranslating = true;

    // Pause observer during translation to avoid feedback loops
    if (state.observer) state.observer.disconnect();

    walkTextNodes(document.body, function (node) {
      var original = node.nodeValue;
      var trimmed = original.trim();
      if (!trimmed) return;

      var translated = translateText(trimmed, lookup);
      if (translated !== trimmed) {
        state.originalTexts.push({ node: node, originalText: original });
        // Preserve surrounding whitespace
        var leading = original.match(/^\s*/)[0];
        var trailing = original.match(/\s*$/)[0];
        node.nodeValue = leading + translated + trailing;
      }
    });

    state.isTranslating = false;

    // Restart observer
    if (state.observer) {
      state.observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function translateText(text, lookup) {
    // Direct match
    if (lookup[text]) return lookup[text];

    // Partial replacement: find all source strings within the text
    var result = text;
    // Sort by length descending to match longer phrases first
    var keys = Object.keys(lookup).sort(function (a, b) {
      return b.length - a.length;
    });
    for (var i = 0; i < keys.length; i++) {
      var src = keys[i];
      if (result.indexOf(src) !== -1) {
        result = result.split(src).join(lookup[src]);
      }
    }
    return result;
  }

  function restoreOriginals() {
    for (var i = 0; i < state.originalTexts.length; i++) {
      var item = state.originalTexts[i];
      if (item.node && item.node.parentNode) {
        item.node.nodeValue = item.originalText;
      }
    }
    state.originalTexts = [];
  }

  // ─── MutationObserver for SPA navigation ─────────────────────────────────
  function setupObserver(lookup) {
    if (state.observer) state.observer.disconnect();

    state.observer = new MutationObserver(function (mutations) {
      if (state.isTranslating) return;
      if (!lookup) return;
      if (!state.currentLocale || state.currentLocale === state.sourceLocale)
        return;

      var newNodes = [];
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            newNodes.push(node);
          }
        }
      }

      if (newNodes.length === 0) return;

      state.isTranslating = true;
      for (var k = 0; k < newNodes.length; k++) {
        walkTextNodes(newNodes[k], function (textNode) {
          var original = textNode.nodeValue;
          var trimmed = original.trim();
          if (!trimmed) return;
          var translated = translateText(trimmed, lookup);
          if (translated !== trimmed) {
            state.originalTexts.push({
              node: textNode,
              originalText: original,
            });
            var leading = original.match(/^\s*/)[0];
            var trailing = original.match(/\s*$/)[0];
            textNode.nodeValue = leading + translated + trailing;
          }
        });
      }
      state.isTranslating = false;
    });

    state.observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Locale Switching ─────────────────────────────────────────────────────
  function setLocale(code) {
    if (!state.config) return;
    var lang = findLanguage(code);
    if (!lang) return;

    state.currentLocale = code;
    setCookie("NEXT_LOCALE", code, COOKIE_MAX_AGE);
    setCookie("locale", code, COOKIE_MAX_AGE);

    if (code === state.sourceLocale || lang.isSource) {
      restoreOriginals();
      if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
      }
      updateWidgetUI();
      return;
    }

    var messages = state.config.messages;
    var sourceMessages = messages[state.sourceLocale] || messages["ko"] || {};
    var targetMessages = messages[code] || {};

    // Check cache first
    var cachedTarget = loadCache(code);
    if (cachedTarget) {
      targetMessages = cachedTarget;
    } else {
      saveCache(code, targetMessages);
    }

    var lookup = buildTranslationMaps(sourceMessages, targetMessages);
    applyTranslation(lookup);
    setupObserver(lookup);
    updateWidgetUI();
  }

  function findLanguage(code) {
    if (!state.config || !state.config.languages) return null;
    for (var i = 0; i < state.config.languages.length; i++) {
      if (state.config.languages[i].code === code)
        return state.config.languages[i];
    }
    return null;
  }

  // ─── API Fetch ────────────────────────────────────────────────────────────
  function fetchConfig(callback) {
    var cached = loadCache("__config__");
    if (cached) {
      callback(null, cached);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_BASE + "/api/sites/config", true);
    xhr.setRequestHeader("Authorization", "Bearer " + state.apiKey);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 8000;

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          saveCache("__config__", data);
          callback(null, data);
        } catch (e) {
          callback(new Error("Invalid JSON response"));
        }
      } else {
        callback(new Error("API error: " + xhr.status));
      }
    };

    xhr.onerror = function () {
      callback(new Error("Network error"));
    };
    xhr.ontimeout = function () {
      callback(new Error("Request timeout"));
    };

    try {
      xhr.send();
    } catch (e) {
      callback(e);
    }
  }

  // ─── Widget CSS ───────────────────────────────────────────────────────────
  var WIDGET_CSS = [
    "#td-tr-widget {",
    "  position: fixed;",
    "  z-index: 9999;",
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    "  font-size: 13px;",
    "  line-height: 1;",
    "}",
    "#td-tr-widget.td-bottom-right { bottom: 20px; right: 20px; }",
    "#td-tr-widget.td-bottom-left  { bottom: 20px; left: 20px; }",
    "#td-tr-widget.td-top-right    { top: 20px; right: 20px; }",
    "#td-tr-widget.td-top-left     { top: 20px; left: 20px; }",
    "#td-tr-btn {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 6px;",
    "  padding: 10px 14px;",
    "  background: #ffffff;",
    "  border: 1px solid #e5e7eb;",
    "  border-radius: 12px;",
    "  box-shadow: 0 2px 12px rgba(0,0,0,0.12);",
    "  cursor: pointer;",
    "  user-select: none;",
    "  white-space: nowrap;",
    "  transition: box-shadow 0.2s ease;",
    "  min-height: 40px;",
    "  min-width: 56px;",
    "  justify-content: center;",
    "}",
    "#td-tr-btn:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.16); }",
    "#td-tr-btn .td-globe {",
    "  font-size: 16px;",
    "  line-height: 1;",
    "}",
    "#td-tr-btn .td-code {",
    "  font-weight: 600;",
    "  color: #111827;",
    "  font-size: 12px;",
    "  letter-spacing: 0.05em;",
    "  text-transform: uppercase;",
    "}",
    "#td-tr-btn .td-caret {",
    "  font-size: 10px;",
    "  color: #9ca3af;",
    "  transition: transform 0.2s ease;",
    "}",
    "#td-tr-widget.td-open #td-tr-btn .td-caret { transform: rotate(180deg); }",
    "#td-tr-dropdown {",
    "  position: absolute;",
    "  bottom: calc(100% + 8px);",
    "  right: 0;",
    "  background: #ffffff;",
    "  border: 1px solid #e5e7eb;",
    "  border-radius: 12px;",
    "  box-shadow: 0 8px 32px rgba(0,0,0,0.14);",
    "  overflow: hidden;",
    "  min-width: 160px;",
    "  max-height: 0;",
    "  opacity: 0;",
    "  transition: max-height 0.25s ease, opacity 0.2s ease;",
    "  pointer-events: none;",
    "}",
    "#td-tr-widget.td-bottom-left #td-tr-dropdown,",
    "#td-tr-widget.td-top-left #td-tr-dropdown {",
    "  right: auto;",
    "  left: 0;",
    "}",
    "#td-tr-widget.td-top-right #td-tr-dropdown,",
    "#td-tr-widget.td-top-left #td-tr-dropdown {",
    "  bottom: auto;",
    "  top: calc(100% + 8px);",
    "}",
    "#td-tr-widget.td-open #td-tr-dropdown {",
    "  max-height: 320px;",
    "  opacity: 1;",
    "  pointer-events: auto;",
    "}",
    ".td-lang-item {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 10px;",
    "  padding: 10px 16px;",
    "  cursor: pointer;",
    "  transition: background 0.15s ease;",
    "  color: #374151;",
    "  min-height: 44px;",
    "}",
    ".td-lang-item:hover { background: #f9fafb; }",
    ".td-lang-item.td-active {",
    "  color: #f97316;",
    "  font-weight: 600;",
    "  background: #fff7ed;",
    "}",
    ".td-lang-item.td-active::after {",
    '  content: "✓";',
    "  margin-left: auto;",
    "  font-size: 12px;",
    "}",
    ".td-lang-code {",
    "  font-size: 11px;",
    "  font-weight: 700;",
    "  text-transform: uppercase;",
    "  letter-spacing: 0.06em;",
    "  color: inherit;",
    "  min-width: 28px;",
    "}",
    ".td-lang-name { font-size: 13px; color: inherit; }",
    ".td-divider { height: 1px; background: #f3f4f6; margin: 2px 0; }",
    ".td-branding {",
    "  padding: 6px 16px;",
    "  font-size: 10px;",
    "  color: #d1d5db;",
    "  text-align: right;",
    "  letter-spacing: 0.03em;",
    "}",
  ].join("\n");

  // ─── Widget Build ─────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("td-tr-styles")) return;
    var style = document.createElement("style");
    style.id = "td-tr-styles";
    style.textContent = WIDGET_CSS;
    document.head.appendChild(style);
  }

  function buildWidget() {
    if (!state.showWidget) return;
    if (!state.config || !state.config.languages) return;

    injectStyles();

    var posClass = "td-" + state.position.replace(/-/g, "-");

    var container = document.createElement("div");
    container.id = "td-tr-widget";
    container.className = posClass;

    // Main button
    var btn = document.createElement("div");
    btn.id = "td-tr-btn";
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("tabindex", "0");

    var globe = document.createElement("span");
    globe.className = "td-globe";
    globe.textContent = "🌐";

    var codeSpan = document.createElement("span");
    codeSpan.className = "td-code";
    codeSpan.textContent = (
      state.currentLocale || state.sourceLocale
    ).toUpperCase();

    var caret = document.createElement("span");
    caret.className = "td-caret";
    caret.textContent = "▾";

    btn.appendChild(globe);
    btn.appendChild(codeSpan);
    btn.appendChild(caret);

    // Dropdown
    var dropdown = document.createElement("div");
    dropdown.id = "td-tr-dropdown";
    dropdown.setAttribute("role", "listbox");

    var langs = state.config.languages;
    for (var i = 0; i < langs.length; i++) {
      var lang = langs[i];
      var item = document.createElement("div");
      item.className =
        "td-lang-item" +
        (lang.code === state.currentLocale ? " td-active" : "");
      item.setAttribute("role", "option");
      item.setAttribute("data-code", lang.code);
      item.setAttribute("tabindex", "0");

      var codeEl = document.createElement("span");
      codeEl.className = "td-lang-code";
      codeEl.textContent = lang.code.toUpperCase();

      var nameEl = document.createElement("span");
      nameEl.className = "td-lang-name";
      nameEl.textContent = lang.name;

      item.appendChild(codeEl);
      item.appendChild(nameEl);
      dropdown.appendChild(item);
    }

    // Divider + branding
    var divider = document.createElement("div");
    divider.className = "td-divider";
    var branding = document.createElement("div");
    branding.className = "td-branding";
    branding.textContent = "by Taedong Translate";
    dropdown.appendChild(divider);
    dropdown.appendChild(branding);

    container.appendChild(btn);
    container.appendChild(dropdown);
    document.body.appendChild(container);

    state.widget = container;

    // Event: toggle dropdown
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = container.classList.contains("td-open");
      container.classList.toggle("td-open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });

    btn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });

    // Event: select language
    dropdown.addEventListener("click", function (e) {
      var item = e.target.closest(".td-lang-item");
      if (!item) return;
      var code = item.getAttribute("data-code");
      if (code) {
        container.classList.remove("td-open");
        btn.setAttribute("aria-expanded", "false");
        setLocale(code);
      }
    });

    dropdown.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        var item = e.target.closest(".td-lang-item");
        if (item) item.click();
      }
    });

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (state.widget && !state.widget.contains(e.target)) {
        state.widget.classList.remove("td-open");
        var b = document.getElementById("td-tr-btn");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });
  }

  function updateWidgetUI() {
    if (!state.widget) return;
    var codeSpan = state.widget.querySelector(".td-code");
    if (codeSpan) {
      codeSpan.textContent = (
        state.currentLocale || state.sourceLocale
      ).toUpperCase();
    }
    var items = state.widget.querySelectorAll(".td-lang-item");
    for (var i = 0; i < items.length; i++) {
      var code = items[i].getAttribute("data-code");
      if (code === state.currentLocale) {
        items[i].classList.add("td-active");
      } else {
        items[i].classList.remove("td-active");
      }
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function getScriptTag() {
    // Try currentScript first
    if (document.currentScript) return document.currentScript;
    // Fallback: find by src
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf("sdk.js") !== -1) {
        return scripts[i];
      }
    }
    return null;
  }

  function readScriptAttributes() {
    var tag = getScriptTag();
    if (!tag) return false;
    state.apiKey = tag.getAttribute("data-api-key");
    state.siteId = state.apiKey; // API 키가 사이트 식별자 역할
    state.showWidget = tag.getAttribute("data-widget") !== "false";
    var pos = tag.getAttribute("data-position");
    if (pos && /^(bottom-right|bottom-left|top-right|top-left)$/.test(pos)) {
      state.position = pos;
    }
    return !!state.apiKey;
  }

  function detectSavedLocale() {
    return getCookie("NEXT_LOCALE") || getCookie("locale") || null;
  }

  function init() {
    if (!readScriptAttributes()) {
      console.warn("[TaedongTranslate] Missing data-site-id or data-api-key");
      return;
    }

    fetchConfig(function (err, config) {
      if (err) {
        console.warn("[TaedongTranslate] Config fetch failed:", err.message);
        return;
      }

      state.config = config;

      // Detect source locale from languages array
      if (config.languages) {
        for (var i = 0; i < config.languages.length; i++) {
          if (config.languages[i].isSource) {
            state.sourceLocale = config.languages[i].code;
            break;
          }
        }
      }

      // Determine initial locale
      var savedLocale = detectSavedLocale();
      state.currentLocale =
        savedLocale || config.defaultLocale || state.sourceLocale;

      // Build widget
      buildWidget();

      // Auto-apply saved locale
      if (state.currentLocale && state.currentLocale !== state.sourceLocale) {
        setLocale(state.currentLocale);
      }
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  window.TaedongTranslate = {
    setLocale: function (code) {
      setLocale(code);
    },
    getLocale: function () {
      return state.currentLocale;
    },
    destroy: function () {
      if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
      }
      restoreOriginals();
      if (state.widget && state.widget.parentNode) {
        state.widget.parentNode.removeChild(state.widget);
        state.widget = null;
      }
      var styles = document.getElementById("td-tr-styles");
      if (styles && styles.parentNode) {
        styles.parentNode.removeChild(styles);
      }
      state.currentLocale = state.sourceLocale;
    },
  };

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
