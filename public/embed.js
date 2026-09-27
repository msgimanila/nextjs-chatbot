/**
 * Embed this chatbot on ANY website by adding one script tag before </body>:
 *
 *   <script src="https://YOUR-DEPLOYED-DOMAIN.com/embed.js" async></script>
 *
 * That's it — no other setup needed on the host site. This script creates
 * a small floating iframe in the bottom-right corner that loads the /widget
 * route from wherever this file itself is hosted, and resizes it between a
 * small button and a full chat panel based on messages from that page.
 */
(function () {
  if (window.__chatWidgetLoaded) return;
  window.__chatWidgetLoaded = true;

  // Figure out which domain this script was loaded from, so the iframe
  // points at the same deployed chatbot app (no config needed on the host
  // site — it "just works" from the <script src> alone).
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var origin;
  try {
    origin = new URL(currentScript.src).origin;
  } catch (e) {
    console.error("Chat widget: could not determine host origin.", e);
    return;
  }

  var CLOSED = { width: "76px", height: "76px" };
  var OPEN_DESKTOP = { width: "400px", height: "560px" };

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/widget";
  iframe.title = "Chat";
  iframe.setAttribute(
    "style",
    [
      "position:fixed",
      "bottom:16px",
      "right:16px",
      "border:none",
      "background:transparent",
      "z-index:2147483647",
      "width:" + CLOSED.width,
      "height:" + CLOSED.height,
      "transition:width 0.15s ease, height 0.15s ease",
      "color-scheme:light",
    ].join(";")
  );

  document.body.appendChild(iframe);

  function isMobile() {
    return window.innerWidth < 480;
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    if (!event.data || event.data.type !== "chat-widget-resize") return;

    if (event.data.open) {
      if (isMobile()) {
        iframe.style.width = "100vw";
        iframe.style.height = "100vh";
        iframe.style.bottom = "0";
        iframe.style.right = "0";
      } else {
        iframe.style.width = OPEN_DESKTOP.width;
        iframe.style.height = OPEN_DESKTOP.height;
        iframe.style.bottom = "16px";
        iframe.style.right = "16px";
      }
    } else {
      iframe.style.width = CLOSED.width;
      iframe.style.height = CLOSED.height;
      iframe.style.bottom = "16px";
      iframe.style.right = "16px";
    }
  });
})();
