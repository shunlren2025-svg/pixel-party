window.PIXEL_PARTY_GAMES = [
  {
    id: "tetris",
    title: "Tetris",
    category: "Puzzle",
    tags: ["Puzzle", "Arcade"],
    icon: "[]",
    colors: ["#55a7ff", "#ff6b9a"],
    description: "Stack falling blocks, clear lines, and jump out whenever.",
    file: "games/tetris.html"
  },
  {
    id: "snake-io",
    title: "Snake.io",
    category: "Arcade",
    tags: ["Arcade", "Action"],
    icon: "o",
    colors: ["#48d6a3", "#f7c75b"],
    description: "Fast snake arena with snacks and simple bot traffic.",
    file: "games/snake-io.html"
  },
  {
    id: "2048",
    title: "2048",
    category: "Puzzle",
    tags: ["Puzzle", "Numbers"],
    icon: "2048",
    colors: ["#f7c75b", "#55a7ff"],
    description: "Slide, merge, and build the biggest tile.",
    file: "games/2048.html"
  },
  {
    id: "doge-miner",
    title: "Doge Miner Lite",
    category: "Clicker",
    tags: ["Clicker", "Idle"],
    icon: "D",
    colors: ["#ffcc66", "#ff715b"],
    description: "Tap to mine coins and buy low-stress upgrades.",
    file: "games/doge-miner.html"
  },
  {
    id: "tuff-client",
    title: "Tuff Client MC Launcher",
    category: "Adventure",
    tags: ["Launcher", "Sandbox"],
    icon: "MC",
    colors: ["#75e0ff", "#48d6a3"],
    description: "A light launcher page with an offline block-builder mini game.",
    file: "games/tuff-client.html"
  },
  {
    id: "brick-breaker",
    title: "Brick Breaker",
    category: "Arcade",
    tags: ["Arcade", "Action"],
    icon: "===",
    colors: ["#ff6b9a", "#f7c75b"],
    description: "Bounce the ball, clear bricks, restart instantly.",
    file: "games/brick-breaker.html"
  },
  {
    id: "space-dodger",
    title: "Space Dodger",
    category: "Action",
    tags: ["Action", "Arcade"],
    icon: "^",
    colors: ["#55a7ff", "#9f7aea"],
    description: "Dodge falling asteroids in quick survival runs.",
    file: "games/space-dodger.html"
  },
  {
    id: "flappy-pixel",
    title: "Flappy Pixel",
    category: "Arcade",
    tags: ["Arcade", "Skill"],
    icon: "<>",
    colors: ["#48d6a3", "#55a7ff"],
    description: "Tap through gates with a tiny square flyer.",
    file: "games/flappy-pixel.html"
  },
  {
    id: "memory-match",
    title: "Memory Match",
    category: "Memory",
    tags: ["Memory", "Puzzle"],
    icon: "OO",
    colors: ["#ff6b9a", "#75e0ff"],
    description: "Flip cards and match all pairs.",
    file: "games/memory-match.html"
  },
  {
    id: "minefield",
    title: "Minefield",
    category: "Puzzle",
    tags: ["Puzzle", "Strategy"],
    icon: "*",
    colors: ["#f7c75b", "#48d6a3"],
    description: "Minesweeper-style clearing with quick rounds.",
    file: "games/minefield.html"
  },
  {
    id: "connect-four",
    title: "Connect Four",
    category: "Strategy",
    tags: ["Strategy", "Board"],
    icon: "oo",
    colors: ["#55a7ff", "#ff715b"],
    description: "Two-player local drops on a separate page.",
    file: "games/connect-four.html"
  },
  {
    id: "tile-runner",
    title: "Tile Runner",
    category: "Parkour",
    tags: ["Parkour", "Action"],
    icon: "__",
    colors: ["#48d6a3", "#f7c75b"],
    description: "Hop lanes and dodge gaps in short parkour bursts.",
    file: "games/tile-runner.html"
  },
  {
    id: "platform-hopper",
    title: "Platform Hopper",
    category: "Parkour",
    tags: ["Parkour", "Skill"],
    icon: "--",
    colors: ["#75e0ff", "#ff6b9a"],
    description: "Jump between platforms and grab stars.",
    file: "games/platform-hopper.html"
  },
  {
    id: "word-pop",
    title: "Word Pop",
    category: "Skill",
    tags: ["Skill", "Typing"],
    icon: "Aa",
    colors: ["#f7c75b", "#75e0ff"],
    description: "Type falling words before they hit the floor.",
    file: "games/word-pop.html"
  },
  {
    id: "reaction-dash",
    title: "Reaction Dash",
    category: "Skill",
    tags: ["Skill", "Arcade"],
    icon: "!",
    colors: ["#ff715b", "#48d6a3"],
    description: "Wait for green, then click as fast as you can.",
    file: "games/reaction-dash.html"
  },
  {
    id: "pong",
    title: "Pong",
    category: "Arcade",
    tags: ["Arcade", "Two Player"],
    icon: "|o",
    colors: ["#55a7ff", "#f7c75b"],
    description: "Classic paddle rallies for one or two players.",
    file: "games/pong.html"
  }
];

(function () {
  var key = "pixel-party:play-counts";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function write(counts) {
    try {
      localStorage.setItem(key, JSON.stringify(counts));
    } catch (error) {
      return false;
    }
    return true;
  }

  function get(id) {
    var counts = read();
    return Number(counts[id] || 0);
  }

  function record(id) {
    var counts = read();
    counts[id] = Number(counts[id] || 0) + 1;
    write(counts);
    return counts[id];
  }

  function decorate(games) {
    var counts = read();
    var ranked = games.map(function (game, index) {
      return {
        id: game.id,
        index: index,
        plays: Number(counts[game.id] || 0)
      };
    }).sort(function (a, b) {
      return b.plays - a.plays || a.index - b.index;
    });
    var byId = {};
    ranked.forEach(function (item, index) {
      byId[item.id] = {
        plays: item.plays,
        rank: index + 1
      };
    });
    return games.map(function (game) {
      var stats = byId[game.id] || { plays: 0, rank: games.length };
      return Object.assign({}, game, {
        plays: stats.plays,
        popularityRank: stats.rank
      });
    });
  }

  window.PixelPartyPopularity = {
    decorate: decorate,
    get: get,
    read: read,
    record: record
  };
}());
