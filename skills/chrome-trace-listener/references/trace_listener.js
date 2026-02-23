() => {
  const KEY = "__ltTrace";
  if (window[KEY]?.installed) {
    return {
      installed: true,
      reused: true,
      count: window[KEY].status().count,
      maxEvents: window[KEY].status().maxEvents,
    };
  }

  const state = {
    installed: true,
    startedAt: Date.now(),
    maxEvents: 1500,
    seq: 0,
    events: [],
    listeners: [],
    observer: null,
    origFetch: window.fetch,
    xhrOpen: XMLHttpRequest.prototype.open,
    xhrSend: XMLHttpRequest.prototype.send,
  };

  const now = () => ({ t: Date.now(), p: Number(performance.now().toFixed(1)) });

  const trim = (value, limit = 240) => {
    const str = String(value ?? "");
    return str.length <= limit ? str : `${str.slice(0, limit)}...`;
  };

  const safeJsonPreview = (body) => {
    if (body == null) return null;
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        return trim(JSON.stringify(parsed));
      } catch {
        return trim(body);
      }
    }
    if (typeof body === "object") {
      try {
        return trim(JSON.stringify(body));
      } catch {
        return "[unserializable-object]";
      }
    }
    return trim(body);
  };

  const nodeLabel = (node) => {
    if (!node || !node.nodeType) return null;
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      return parent ? nodeLabel(parent) : "#text";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return String(node.nodeName || "node").toLowerCase();

    const el = node;
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const classes = (el.className && typeof el.className === "string")
      ? `.${el.className.trim().split(/\s+/).slice(0, 3).join(".")}`
      : "";
    return `${tag}${id}${classes}`;
  };

  const activeSummary = () => {
    const el = document.activeElement;
    if (!el) return null;
    return {
      node: nodeLabel(el),
      tag: el.tagName?.toLowerCase() || null,
      isContentEditable: !!el.isContentEditable,
      inputType: el.getAttribute?.("type") || null,
    };
  };

  const addEvent = (type, detail = {}) => {
    state.seq += 1;
    state.events.push({ seq: state.seq, type, ...now(), detail });
    if (state.events.length > state.maxEvents) {
      state.events.splice(0, state.events.length - state.maxEvents);
    }
  };

  const captureEvent = (evt) => {
    const base = {
      eventType: evt.type,
      target: nodeLabel(evt.target),
      active: activeSummary(),
      defaultPrevented: !!evt.defaultPrevented,
      isTrusted: !!evt.isTrusted,
    };

    if (evt.type.startsWith("pointer") || evt.type === "click" || evt.type.startsWith("mouse")) {
      base.pointerType = evt.pointerType || null;
      base.button = typeof evt.button === "number" ? evt.button : null;
      base.client = {
        x: typeof evt.clientX === "number" ? evt.clientX : null,
        y: typeof evt.clientY === "number" ? evt.clientY : null,
      };
    }

    if (evt.type.startsWith("touch")) {
      base.touchCount = evt.touches?.length ?? evt.changedTouches?.length ?? 0;
    }

    if (evt.type === "keydown") {
      base.key = evt.key;
      base.code = evt.code;
    }

    if (evt.type === "beforeinput" || evt.type === "input") {
      base.inputType = evt.inputType || null;
      base.data = trim(evt.data || "", 60);
    }

    if (evt.type === "selectionchange") {
      const sel = document.getSelection?.();
      if (sel) {
        base.selection = {
          isCollapsed: sel.isCollapsed,
          anchor: nodeLabel(sel.anchorNode),
          focus: nodeLabel(sel.focusNode),
          text: trim(sel.toString(), 80),
        };
      }
    }

    addEvent(`ui:${evt.type}`, base);
  };

  const uiEvents = [
    "touchstart",
    "touchend",
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "click",
    "focusin",
    "focusout",
    "selectionchange",
    "keydown",
    "beforeinput",
    "input",
  ];

  uiEvents.forEach((eventName) => {
    const handler = (evt) => captureEvent(evt);
    const target = eventName === "selectionchange" ? document : document;
    target.addEventListener(eventName, handler, true);
    state.listeners.push([target, eventName, handler, true]);
  });

  const navHandler = () => {
    addEvent("nav:location", {
      href: location.href,
      hash: location.hash,
      active: activeSummary(),
    });
  };

  window.addEventListener("hashchange", navHandler, true);
  window.addEventListener("popstate", navHandler, true);
  state.listeners.push([window, "hashchange", navHandler, true]);
  state.listeners.push([window, "popstate", navHandler, true]);

  state.observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (!(record.target instanceof Element)) return;
      if (record.attributeName !== "class") return;
      const el = record.target;
      const had = (record.oldValue || "").split(/\s+/).includes("deep-link-target");
      const has = el.classList.contains("deep-link-target");
      if (had === has) return;

      addEvent("dom:deep-link-target", {
        target: nodeLabel(el),
        hasClass: has,
        pageHash: location.hash,
        active: activeSummary(),
      });
    });
  });

  state.observer.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["class"],
  });

  const shouldTraceRequest = (url) => {
    if (!url) return false;
    return url.includes("/rest/v1/pages") || url.includes("/rest/v1/trackers");
  };

  window.fetch = async (...args) => {
    const input = args[0];
    const init = args[1] || {};
    const url = typeof input === "string" ? input : input?.url || "";
    const method = (init.method || input?.method || "GET").toUpperCase();
    const bodyPreview = safeJsonPreview(init.body);

    const trace = shouldTraceRequest(url) && ["PATCH", "POST", "PUT", "DELETE"].includes(method);
    if (trace) {
      addEvent("net:fetch:request", {
        method,
        url: trim(url, 300),
        bodyPreview,
      });
    }

    try {
      const response = await state.origFetch.call(window, ...args);
      if (trace) {
        addEvent("net:fetch:response", {
          method,
          url: trim(url, 300),
          status: response.status,
          ok: response.ok,
        });
      }
      return response;
    } catch (err) {
      if (trace) {
        addEvent("net:fetch:error", {
          method,
          url: trim(url, 300),
          error: trim(err?.message || err),
        });
      }
      throw err;
    }
  };

  XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
    this.__ltTraceMeta = {
      method: String(method || "GET").toUpperCase(),
      url: String(url || ""),
    };
    return state.xhrOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function patchedSend(body) {
    const meta = this.__ltTraceMeta || { method: "GET", url: "" };
    const trace = shouldTraceRequest(meta.url) && ["PATCH", "POST", "PUT", "DELETE"].includes(meta.method);

    if (trace) {
      addEvent("net:xhr:request", {
        method: meta.method,
        url: trim(meta.url, 300),
        bodyPreview: safeJsonPreview(body),
      });
      this.addEventListener("loadend", () => {
        addEvent("net:xhr:response", {
          method: meta.method,
          url: trim(meta.url, 300),
          status: this.status,
        });
      });
    }

    return state.xhrSend.call(this, body);
  };

  const api = {
    installed: true,
    clear() {
      state.events = [];
      state.seq = 0;
      return { ok: true };
    },
    status() {
      return {
        installed: true,
        startedAt: state.startedAt,
        count: state.events.length,
        maxEvents: state.maxEvents,
        active: activeSummary(),
        href: location.href,
      };
    },
    get(options = {}) {
      const limit = Math.max(1, Math.min(2000, Number(options.limit || 200)));
      return {
        status: api.status(),
        events: state.events.slice(-limit),
      };
    },
    uninstall() {
      state.listeners.forEach(([target, eventName, handler, capture]) => {
        target.removeEventListener(eventName, handler, capture);
      });
      state.listeners = [];

      if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
      }

      window.fetch = state.origFetch;
      XMLHttpRequest.prototype.open = state.xhrOpen;
      XMLHttpRequest.prototype.send = state.xhrSend;

      delete window[KEY];
      return { ok: true };
    },
  };

  window[KEY] = api;

  addEvent("trace:installed", {
    href: location.href,
    hash: location.hash,
    active: activeSummary(),
  });

  return {
    installed: true,
    reused: false,
    count: 1,
    maxEvents: state.maxEvents,
  };
};
