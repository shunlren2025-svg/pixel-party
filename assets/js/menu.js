(function () {
  var games = window.PIXEL_PARTY_GAMES || [];
  var grid = document.getElementById("game-grid");
  var search = document.getElementById("game-search");
  var buttons = document.getElementById("category-buttons");
  var resultCount = document.getElementById("result-count");
  var libraryCount = document.getElementById("library-count");
  var activeCategory = "All";
  var popularity = window.PixelPartyPopularity;

  if (libraryCount) {
    libraryCount.textContent = games.length + " games/sites";
  }

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

  function sceneShapes(scene) {
    var shapes = {
      tetris: "<rect x='38' y='22' width='26' height='26' fill='#55a7ff'/><rect x='64' y='22' width='26' height='26' fill='#55a7ff'/><rect x='64' y='48' width='26' height='26' fill='#ff6b9a'/><rect x='90' y='48' width='26' height='26' fill='#ff6b9a'/>",
      snake: "<path d='M20 70 C42 38 72 96 104 46 C122 18 146 32 156 54' fill='none' stroke='#48d6a3' stroke-width='16' stroke-linecap='round'/><circle cx='156' cy='54' r='6' fill='#f7f9ff'/><circle cx='35' cy='34' r='8' fill='#f7c75b'/>",
      tiles: "<rect x='23' y='24' width='44' height='44' rx='8' fill='#f7c75b'/><rect x='75' y='24' width='44' height='44' rx='8' fill='#75e0ff'/><rect x='49' y='76' width='44' height='44' rx='8' fill='#ff6b9a'/><text x='45' y='54' font-size='20' font-weight='900' fill='#111'>2</text><text x='91' y='54' font-size='20' font-weight='900' fill='#111'>4</text><text x='62' y='106' font-size='20' font-weight='900' fill='#111'>8</text>",
      mine: "<circle cx='76' cy='62' r='34' fill='#f7c75b'/><path d='M46 38 L106 92 M104 36 L45 91' stroke='#7b4725' stroke-width='10' stroke-linecap='round'/><rect x='112' y='34' width='28' height='58' rx='8' fill='#8b96a8'/>",
      minecraft: "<rect x='0' y='0' width='180' height='70' fill='#75e0ff'/><rect x='0' y='70' width='180' height='50' fill='#48d65f'/><rect x='30' y='58' width='42' height='42' fill='#48d65f'/><rect x='30' y='86' width='42' height='28' fill='#9b6544'/><rect x='84' y='46' width='36' height='54' fill='#8b96a8'/><rect x='120' y='74' width='38' height='26' fill='#9b6544'/>",
      bricks: "<rect x='16' y='24' width='34' height='16' fill='#ff6b9a'/><rect x='54' y='24' width='34' height='16' fill='#f7c75b'/><rect x='92' y='24' width='34' height='16' fill='#75e0ff'/><rect x='35' y='46' width='34' height='16' fill='#48d6a3'/><rect x='73' y='46' width='34' height='16' fill='#ff715b'/><rect x='58' y='95' width='64' height='10' fill='#f7f9ff'/><circle cx='92' cy='78' r='9' fill='#f7c75b'/>",
      space: "<circle cx='126' cy='32' r='14' fill='#75e0ff'/><path d='M74 20 L108 100 L74 86 L40 100 Z' fill='#f7f9ff'/><circle cx='41' cy='38' r='5' fill='#f7c75b'/><circle cx='138' cy='86' r='7' fill='#ff6b9a'/>",
      flappy: "<rect x='38' y='48' width='34' height='28' fill='#f7c75b'/><rect x='90' y='0' width='26' height='46' fill='#48d6a3'/><rect x='90' y='84' width='26' height='46' fill='#48d6a3'/><rect x='130' y='0' width='26' height='68' fill='#55a7ff'/><rect x='130' y='96' width='26' height='34' fill='#55a7ff'/>",
      memory: "<rect x='32' y='24' width='42' height='56' rx='8' fill='#ff6b9a'/><rect x='82' y='24' width='42' height='56' rx='8' fill='#75e0ff'/><rect x='57' y='72' width='42' height='56' rx='8' fill='#f7c75b'/><text x='46' y='60' font-size='26' font-weight='900' fill='#fff'>A</text>",
      minefield: "<g fill='#22221e' stroke='#3a3b33'><rect x='32' y='24' width='30' height='30'/><rect x='64' y='24' width='30' height='30'/><rect x='96' y='24' width='30' height='30'/><rect x='32' y='56' width='30' height='30'/><rect x='64' y='56' width='30' height='30'/><rect x='96' y='56' width='30' height='30'/></g><text x='72' y='80' font-size='30' font-weight='900' fill='#ff715b'>*</text>",
      connect: "<rect x='28' y='22' width='120' height='80' rx='12' fill='#1a5aaa'/><circle cx='55' cy='48' r='12' fill='#ff715b'/><circle cx='88' cy='48' r='12' fill='#f7c75b'/><circle cx='121' cy='48' r='12' fill='#ff715b'/><circle cx='55' cy='78' r='12' fill='#0d1119'/><circle cx='88' cy='78' r='12' fill='#f7c75b'/><circle cx='121' cy='78' r='12' fill='#0d1119'/>",
      runner: "<rect x='28' y='0' width='34' height='120' fill='rgba(255,255,255,.12)'/><rect x='73' y='0' width='34' height='120' fill='rgba(255,255,255,.18)'/><rect x='118' y='0' width='34' height='120' fill='rgba(255,255,255,.12)'/><rect x='82' y='78' width='18' height='22' fill='#f7c75b'/><rect x='35' y='24' width='20' height='28' fill='#ff715b'/>",
      platform: "<rect x='20' y='92' width='50' height='10' fill='#48d6a3'/><rect x='88' y='66' width='48' height='10' fill='#48d6a3'/><rect x='48' y='42' width='44' height='10' fill='#48d6a3'/><rect x='56' y='68' width='18' height='22' fill='#75e0ff'/><rect x='118' y='38' width='14' height='14' fill='#f7c75b'/>",
      word: "<rect x='22' y='25' width='54' height='24' rx='8' fill='#f7c75b'/><rect x='86' y='58' width='64' height='24' rx='8' fill='#75e0ff'/><text x='34' y='43' font-size='14' font-weight='900' fill='#111'>PIXEL</text><text x='98' y='76' font-size='14' font-weight='900' fill='#111'>POP</text>",
      reaction: "<rect x='28' y='24' width='124' height='74' rx='14' fill='#48d6a3'/><text x='58' y='72' font-size='30' font-weight='900' fill='#071018'>GO</text>",
      pong: "<rect x='30' y='26' width='8' height='70' fill='#f7f9ff'/><rect x='142' y='34' width='8' height='70' fill='#f7f9ff'/><circle cx='89' cy='62' r='9' fill='#f7c75b'/><path d='M90 0 V120' stroke='rgba(255,255,255,.2)' stroke-width='4' stroke-dasharray='8 8'/>",
      roulette: "<rect x='18' y='34' width='144' height='64' rx='14' fill='#3a2a22'/><circle cx='58' cy='66' r='19' fill='#111'/><circle cx='58' cy='66' r='8' fill='#ff715b'/><rect x='92' y='50' width='48' height='12' rx='6' fill='#f7c75b'/><rect x='92' y='72' width='48' height='12' rx='6' fill='#d9dde8'/>",
      vault: "<rect x='42' y='22' width='96' height='82' rx='12' fill='#8b96a8'/><circle cx='90' cy='62' r='24' fill='#22221e'/><circle cx='90' cy='62' r='8' fill='#f7c75b'/><path d='M90 38 V86 M66 62 H114' stroke='#f7c75b' stroke-width='6'/>",
      duel: "<path d='M28 78 L76 44 M152 78 L104 44' stroke='#f7f9ff' stroke-width='12' stroke-linecap='round'/><circle cx='54' cy='36' r='12' fill='#75e0ff'/><circle cx='126' cy='36' r='12' fill='#ff6b9a'/>",
      dice: "<rect x='42' y='30' width='42' height='42' rx='8' fill='#f7f9ff'/><rect x='94' y='50' width='42' height='42' rx='8' fill='#f7c75b'/><circle cx='56' cy='44' r='4' fill='#111'/><circle cx='70' cy='58' r='4' fill='#111'/><circle cx='108' cy='64' r='4' fill='#111'/><circle cx='122' cy='78' r='4' fill='#111'/>",
      cards: "<rect x='48' y='28' width='44' height='62' rx='8' fill='#f7f9ff' transform='rotate(-8 48 28)'/><rect x='86' y='30' width='44' height='62' rx='8' fill='#ff715b' transform='rotate(10 86 30)'/><text x='61' y='66' font-size='28' font-weight='900' fill='#111'>A</text>",
      maze: "<path d='M28 92 H68 V62 H48 V32 H132 V62 H104 V92 H150' fill='none' stroke='#75e0ff' stroke-width='10' stroke-linejoin='round'/><circle cx='30' cy='92' r='8' fill='#48d6a3'/><rect x='142' y='84' width='18' height='18' fill='#ff6b9a'/>",
      ghost: "<path d='M58 92 V50 C58 28 122 28 122 50 V92 L110 82 L98 92 L86 82 L74 92 Z' fill='#f7f9ff'/><circle cx='78' cy='56' r='5' fill='#111'/><circle cx='102' cy='56' r='5' fill='#111'/>",
      racer: "<path d='M52 0 C20 42 20 78 52 120 M128 0 C160 42 160 78 128 120' fill='none' stroke='rgba(255,255,255,.35)' stroke-width='8'/><rect x='72' y='70' width='34' height='22' rx='6' fill='#ff715b'/><rect x='80' y='52' width='18' height='18' fill='#75e0ff'/>",
      bubble: "<circle cx='52' cy='55' r='24' fill='#75e0ff' opacity='.85'/><circle cx='105' cy='42' r='16' fill='#48d6a3' opacity='.9'/><circle cx='122' cy='82' r='26' fill='#ff6b9a' opacity='.78'/>",
      rhythm: "<rect x='30' y='78' width='24' height='22' fill='#ff6b9a'/><rect x='66' y='48' width='24' height='52' fill='#f7c75b'/><rect x='102' y='28' width='24' height='72' fill='#75e0ff'/><circle cx='135' cy='40' r='9' fill='#48d6a3'/>",
      tower: "<rect x='54' y='84' width='72' height='18' fill='#75e0ff'/><rect x='62' y='62' width='58' height='18' fill='#48d6a3'/><rect x='72' y='40' width='44' height='18' fill='#f7c75b'/><rect x='84' y='18' width='28' height='18' fill='#ff6b9a'/>",
      fishing: "<path d='M0 82 C30 68 60 96 90 82 C120 68 150 96 180 82 V120 H0 Z' fill='#55a7ff'/><path d='M82 32 C120 32 122 70 108 76' fill='none' stroke='#f7f9ff' stroke-width='5'/><path d='M112 78 L140 66 L140 90 Z' fill='#f7c75b'/>",
      asteroid: "<circle cx='70' cy='62' r='34' fill='#8b96a8'/><circle cx='58' cy='52' r='7' fill='#3a3b33'/><circle cx='82' cy='78' r='9' fill='#3a3b33'/><path d='M124 28 L148 68 L118 62 Z' fill='#75e0ff'/>",
      orbit: "<circle cx='90' cy='60' r='16' fill='#f7c75b'/><ellipse cx='90' cy='60' rx='62' ry='28' fill='none' stroke='#75e0ff' stroke-width='6'/><circle cx='144' cy='60' r='9' fill='#ff6b9a'/>",
      tilesky: "<rect x='36' y='28' width='38' height='38' rx='8' fill='#75e0ff'/><rect x='84' y='28' width='38' height='38' rx='8' fill='#ff6b9a'/><rect x='60' y='76' width='38' height='38' rx='8' fill='#f7c75b'/>",
      golf: "<rect x='0' y='80' width='180' height='40' fill='#48d6a3'/><circle cx='132' cy='92' r='10' fill='#111'/><circle cx='56' cy='78' r='7' fill='#f7f9ff'/><path d='M58 76 L104 42' stroke='#f7c75b' stroke-width='5'/>",
      bottle: "<rect x='76' y='30' width='26' height='66' rx='10' fill='#75e0ff'/><rect x='82' y='18' width='14' height='18' rx='4' fill='#f7f9ff'/><path d='M40 98 H140' stroke='#f7c75b' stroke-width='8' stroke-linecap='round'/>",
      doors: "<rect x='38' y='28' width='36' height='70' fill='#7b4725'/><rect x='86' y='28' width='36' height='70' fill='#9b6544'/><rect x='134' y='28' width='20' height='70' fill='#3a2a22'/><circle cx='66' cy='64' r='4' fill='#f7c75b'/>",
      soundboard: "<rect x='28' y='26' width='124' height='78' rx='14' fill='#22221e'/><circle cx='60' cy='64' r='18' fill='#ff6b9a'/><circle cx='102' cy='50' r='12' fill='#75e0ff'/><path d='M120 76 C138 64 138 50 120 38' fill='none' stroke='#f7c75b' stroke-width='6'/>",
      video: "<rect x='30' y='30' width='120' height='68' rx='14' fill='#ff715b'/><path d='M80 50 L112 64 L80 80 Z' fill='#f7f9ff'/>",
      music: "<circle cx='66' cy='78' r='16' fill='#48d6a3'/><path d='M78 76 V30 H124 V62' stroke='#48d6a3' stroke-width='10' fill='none'/><circle cx='124' cy='78' r='16' fill='#48d6a3'/>",
      stream: "<rect x='32' y='28' width='116' height='72' rx='12' fill='#9f7aea'/><rect x='50' y='46' width='80' height='36' fill='#11110f'/><circle cx='90' cy='64' r='12' fill='#75e0ff'/>",
      chat: "<rect x='32' y='30' width='116' height='60' rx='16' fill='#5865f2'/><circle cx='70' cy='60' r='8' fill='#f7f9ff'/><circle cx='110' cy='60' r='8' fill='#f7f9ff'/><path d='M70 92 L54 108 V88' fill='#5865f2'/>",
      wiki: "<rect x='42' y='26' width='96' height='72' rx='8' fill='#f7f9ff'/><text x='62' y='73' font-size='42' font-weight='900' fill='#111'>W</text>"
    };
    return shapes[scene] || "<circle cx='90' cy='60' r='36' fill='#75e0ff'/><text x='90' y='70' text-anchor='middle' font-size='28' font-weight='900' fill='#111'>GO</text>";
  }

  function thumbnail(game) {
    var a = game.colors[0] || "#55a7ff";
    var b = game.colors[1] || "#ff6b9a";
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 120'>" +
      "<defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='" + a + "'/><stop offset='1' stop-color='" + b + "'/></linearGradient></defs>" +
      "<rect width='180' height='120' fill='#0b0d12'/><rect width='180' height='120' fill='url(#g)' opacity='.34'/>" +
      sceneShapes(game.scene) +
      "</svg>";
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function card(game) {
    var link = document.createElement("a");
    var rankClass = game.popularityRank === 1 ? " popular-rank-1" : game.popularityRank <= 5 ? " popular-top-five" : "";
    link.className = "game-card" + rankClass + (game.imageUrl ? " photo-card" : "");
    link.href = game.file;
    link.style.setProperty("--accent-a", game.colors[0]);
    link.style.setProperty("--accent-b", game.colors[1]);
    link.setAttribute("aria-label", "Play " + game.title);
    link.dataset.rank = game.popularityRank;

    var art = document.createElement("div");
    art.className = "game-art";
    var picture = document.createElement("img");
    picture.className = "game-picture";
    picture.alt = game.title + " preview";
    picture.loading = "lazy";
    picture.src = game.imageUrl || thumbnail(game);
    if (game.imageUrl) {
      picture.addEventListener("error", function () {
        picture.src = thumbnail(game);
      }, { once: true });
    }
    art.appendChild(picture);
    if (game.popularityRank <= 5) {
      var badge = document.createElement("div");
      badge.className = "popularity-badge";
      badge.textContent = game.popularityRank === 1 ? "#1 Most Played" : "#" + game.popularityRank + " Top 5";
      art.appendChild(badge);
    }
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
    if (game.sourceLabel) {
      var source = document.createElement("span");
      source.className = "source-pill";
      source.textContent = game.sourceLabel;
      meta.appendChild(source);
    }
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
