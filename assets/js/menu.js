(function () {
  var games = window.PIXEL_PARTY_GAMES || [];
  var grid = document.getElementById("game-grid");
  var search = document.getElementById("game-search");
  var buttons = document.getElementById("category-buttons");
  var resultCount = document.getElementById("result-count");
  var activeCategory = "All";
  var popularity = window.PixelPartyPopularity;

  var categories = ["All"].concat(Array.from(new Set(games.map(function (game) {
    return game.category;
  }))).sort(function (a, b) {
    return a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b);
  }));

  function makeButton(category) {
    var button = document.createElement("button");
    button.className = "chip" + (category === activeCategory ? " active" : "");
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", function () {
      activeCategory = category;
      renderButtons();
      renderGames();
    });
    return button;
  }

  function renderButtons() {
    buttons.replaceChildren();
    categories.forEach(function (category) {
      buttons.appendChild(makeButton(category));
    });
  }

  function matchesSearch(game, query) {
    if (!query) return true;
    var haystack = [game.title, game.category, game.description].concat(game.tags).join(" ").toLowerCase();
    return haystack.includes(query);
  }

  function formatPlays(count) {
    return count === 1 ? "1 play" : count + " plays";
  }

  function distributeHighlights(list) {
    var top = list.filter(function (game) {
      return game.popularityRank <= 5;
    }).sort(function (a, b) {
      return a.popularityRank - b.popularityRank;
    });
    var rest = list.filter(function (game) {
      return game.popularityRank > 5;
    });
    var out = [];
    var topIndex = 0;
    if (top[topIndex]) out.push(top[topIndex++]);
    while (rest.length || topIndex < top.length) {
      if (rest.length) out.push(rest.shift());
      if (rest.length) out.push(rest.shift());
      if (top[topIndex]) out.push(top[topIndex++]);
    }
    return out;
  }

  function card(game) {
    var link = document.createElement("a");
    var rankClass = game.popularityRank === 1 ? " popular-rank-1" : game.popularityRank <= 5 ? " popular-top-five" : "";
    link.className = "game-card" + rankClass;
    link.href = game.file;
    link.style.setProperty("--accent-a", game.colors[0]);
    link.style.setProperty("--accent-b", game.colors[1]);
    link.setAttribute("aria-label", "Play " + game.title);
    link.dataset.rank = game.popularityRank;

    var art = document.createElement("div");
    art.className = "game-art";
    if (game.popularityRank <= 5) {
      var badge = document.createElement("div");
      badge.className = "popularity-badge";
      badge.textContent = game.popularityRank === 1 ? "#1 Most Played" : "#" + game.popularityRank + " Top 5";
      art.appendChild(badge);
    }
    var icon = document.createElement("div");
    icon.className = "game-icon";
    icon.textContent = game.icon;
    art.appendChild(icon);

    var body = document.createElement("div");
    body.className = "card-body";
    var title = document.createElement("h3");
    title.textContent = game.title;
    var desc = document.createElement("p");
    desc.textContent = game.description;
    var meta = document.createElement("div");
    meta.className = "card-meta";
    var plays = document.createElement("span");
    plays.className = "play-count";
    plays.textContent = formatPlays(game.plays);
    var rank = document.createElement("span");
    rank.textContent = "#" + game.popularityRank;
    meta.append(plays, rank);
    var tagRow = document.createElement("div");
    tagRow.className = "tag-row";
    game.tags.forEach(function (tag) {
      var span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      tagRow.appendChild(span);
    });
    body.append(title, desc, meta, tagRow);
    link.append(art, body);
    return link;
  }

  function renderGames() {
    var query = search.value.trim().toLowerCase();
    var rankedGames = popularity ? popularity.decorate(games) : games.map(function (game, index) {
      return Object.assign({}, game, { plays: 0, popularityRank: index + 1 });
    });
    var filtered = rankedGames.filter(function (game) {
      return (activeCategory === "All" || game.category === activeCategory) && matchesSearch(game, query);
    });
    var display = distributeHighlights(filtered);

    grid.replaceChildren();
    if (!display.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No games matched that search.";
      grid.appendChild(empty);
    } else {
      display.forEach(function (game) {
        grid.appendChild(card(game));
      });
    }
    resultCount.textContent = filtered.length + " shown";
  }

  search.addEventListener("input", renderGames);
  renderButtons();
  renderGames();
}());
