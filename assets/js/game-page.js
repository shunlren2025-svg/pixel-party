(function () {
  var gameId = document.body.dataset.gameId || window.PP_GAME_ID;
  var game = (window.PIXEL_PARTY_GAMES || []).find(function (item) {
    return item.id === gameId;
  });
  var root = document.getElementById("game-root");

  if (!root || !game || !window.PixelPartyGames || !window.PixelPartyGames[gameId]) {
    if (root) root.textContent = "This game could not be loaded.";
    return;
  }

  document.title = game.title + " - Pixel Party";
  var plays = window.PixelPartyPopularity ? window.PixelPartyPopularity.record(game.id) : 0;

  function loadingImageUrl() {
    var script = document.querySelector('script[src$="game-page.js"]');
    if (!script) return "../assets/images/loading-face.webp";
    return new URL("../images/loading-face.webp", script.src).href;
  }

  function showLoading(next) {
    var loader = document.createElement("section");
    loader.className = "loading-screen";

    var image = document.createElement("img");
    image.className = "loading-image";
    image.src = loadingImageUrl();
    image.alt = "";

    var bar = document.createElement("div");
    bar.className = "loading-bar";
    var fill = document.createElement("div");
    fill.className = "loading-fill";
    bar.appendChild(fill);

    loader.append(image, bar);
    root.replaceChildren(loader);
    setTimeout(next, 5000);
  }

  function addAccessPanel(stage) {
    function absoluteUrl(href) {
      try {
        return new URL(href, window.location.href).href;
      } catch (error) {
        return href;
      }
    }

    var url = absoluteUrl(game.playUrl || game.externalUrl || window.location.href);
    var panel = document.createElement("div");
    panel.className = "access-panel";

    var count = document.createElement("div");
    count.className = "access-count";
    count.textContent = (plays === 1 ? "1 play" : plays + " plays") + " on this browser";

    var field = document.createElement("label");
    field.className = "access-url-wrap";
    var label = document.createElement("span");
    label.textContent = "URL";
    var input = document.createElement("input");
    input.className = "access-url";
    input.readOnly = true;
    input.value = url;
    input.addEventListener("focus", function () {
      input.select();
    });
    field.append(label, input);

    var actions = document.createElement("div");
    actions.className = "access-actions";
    var download = document.createElement("a");
    download.className = "small-btn";
    if (game.downloadUrl) {
      download.href = game.downloadUrl;
      download.target = "_blank";
      download.rel = "noopener";
      download.textContent = game.downloadLabel || "Download";
    } else {
      download.href = window.location.href;
      download.download = game.id + ".html";
      download.textContent = "Download Page";
    }
    var copy = document.createElement("button");
    copy.className = "small-btn";
    copy.type = "button";
    copy.textContent = "Copy URL";
    copy.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          copy.textContent = "Copied";
          setTimeout(function () { copy.textContent = "Copy URL"; }, 1200);
        }).catch(function () {
          input.focus();
        });
      } else {
        input.focus();
      }
    });
    var fullscreen = document.createElement("button");
    fullscreen.className = "small-btn";
    fullscreen.type = "button";
    fullscreen.textContent = "Fullscreen";
    fullscreen.addEventListener("click", function () {
      var target = stage.closest(".game-layout") || stage;
      if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
      }
      if (target.requestFullscreen) {
        target.requestFullscreen();
      }
    });
    document.addEventListener("fullscreenchange", function () {
      fullscreen.textContent = document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen";
    });

    function addLink(labelText, href) {
      var link = document.createElement("a");
      link.className = "small-btn";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = labelText;
      actions.appendChild(link);
    }

    actions.append(download, copy, fullscreen);
    if (game.sourceUrl && game.sourceUrl !== game.downloadUrl) addLink(game.sourceLabel || "Source", game.sourceUrl);
    if (game.imageSourceUrl) addLink("Image Source", game.imageSourceUrl);
    if (game.imageSearchUrl) addLink("Real Images", game.imageSearchUrl);
    panel.append(count, field, actions);
    stage.appendChild(panel);
  }

  showLoading(function () {
    window.PixelPartyGames[gameId](root, game);
    var stage = root.querySelector(".game-stage");
    if (stage) addAccessPanel(stage);
  });
}());
