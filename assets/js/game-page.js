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
  window.PixelPartyGames[gameId](root, game);

  var stage = root.querySelector(".game-stage");
  if (stage) {
    var url = window.location.href;
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
    download.href = url;
    download.download = game.id + ".html";
    download.textContent = "Download";
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
    actions.append(download, copy);
    panel.append(count, field, actions);
    stage.appendChild(panel);
  }
}());
