(function () {
  "use strict";

  var Games = {};
  var storePrefix = "pixel-party:";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(text, title, onClick) {
    var node = el("button", "small-btn", text);
    node.type = "button";
    if (title) node.title = title;
    node.addEventListener("click", onClick);
    return node;
  }

  function layout(root, game) {
    root.innerHTML = "";
    var wrap = el("div", "game-layout");
    var stage = el("section", "game-stage");
    var side = el("aside", "side-panel");
    var title = el("h1", "", game.title);
    var desc = el("p", "", game.description);
    var scoreGrid = el("div", "score-grid");
    var controls = el("div", "quick-actions");
    var help = el("p", "", "");
    side.append(title, desc, scoreGrid, controls, help);
    wrap.append(stage, side);
    root.appendChild(wrap);

    return {
      stage: stage,
      side: side,
      controls: controls,
      help: help,
      stat: function (label, value) {
        var pill = el("div", "score-pill");
        var name = el("span", "", label);
        var strong = el("strong", "", value);
        pill.append(name, strong);
        scoreGrid.appendChild(pill);
        return {
          set: function (next) {
            strong.textContent = next;
          }
        };
      }
    };
  }

  function makeCanvas(stage, width, height, portrait) {
    var canvas = el("canvas", "game-canvas" + (portrait ? " portrait-canvas" : ""));
    canvas.width = width;
    canvas.height = height;
    stage.appendChild(canvas);
    return {
      canvas: canvas,
      ctx: canvas.getContext("2d")
    };
  }

  function keyControls(handler) {
    document.addEventListener("keydown", function (event) {
      var tag = event.target && event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      handler(event);
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(max) {
    return Math.floor(Math.random() * max);
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = rand(i + 1);
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function loop(draw) {
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(40, now - last) / 1000;
      last = now;
      draw(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function storageGet(key, fallback) {
    try {
      var raw = localStorage.getItem(storePrefix + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(storePrefix + key, JSON.stringify(value));
    } catch (error) {
      return false;
    }
    return true;
  }

  function drawBackdrop(ctx, width, height) {
    ctx.fillStyle = "#080806";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,.06)";
    for (var x = 0; x < width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (var y = 0; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function overlay(ctx, width, height, title, subtitle) {
    ctx.fillStyle = "rgba(8,11,16,.72)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f7f9ff";
    ctx.font = "900 34px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, width / 2, height / 2 - 10);
    ctx.fillStyle = "#a8b2c7";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.fillText(subtitle, width / 2, height / 2 + 24);
  }

  Games.tetris = function (root, game) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var linesStat = ui.stat("Lines", "0");
    ui.help.textContent = "";
    var kit = makeCanvas(ui.stage, 300, 600, true);
    var ctx = kit.ctx;
    var cols = 10;
    var rows = 20;
    var size = 30;
    var colors = ["", "#55a7ff", "#48d6a3", "#f7c75b", "#ff6b9a", "#9f7aea", "#ff715b", "#75e0ff"];
    var shapes = [
      [[1, 1, 1, 1]],
      [[2, 0, 0], [2, 2, 2]],
      [[0, 0, 3], [3, 3, 3]],
      [[4, 4], [4, 4]],
      [[0, 5, 5], [5, 5, 0]],
      [[0, 6, 0], [6, 6, 6]],
      [[7, 7, 0], [0, 7, 7]]
    ];
    var board;
    var piece;
    var score;
    var lines;
    var gameOver;

    function reset() {
      board = Array.from({ length: rows }, function () {
        return Array(cols).fill(0);
      });
      score = 0;
      lines = 0;
      gameOver = false;
      spawn();
      updateStats();
      draw();
    }

    function updateStats() {
      scoreStat.set(score);
      linesStat.set(lines);
    }

    function spawn() {
      var matrix = shapes[rand(shapes.length)].map(function (row) {
        return row.slice();
      });
      piece = { x: 3, y: 0, matrix: matrix };
      if (collides(piece.x, piece.y, piece.matrix)) gameOver = true;
    }

    function collides(px, py, matrix) {
      for (var y = 0; y < matrix.length; y++) {
        for (var x = 0; x < matrix[y].length; x++) {
          if (!matrix[y][x]) continue;
          var bx = px + x;
          var by = py + y;
          if (bx < 0 || bx >= cols || by >= rows || (by >= 0 && board[by][bx])) return true;
        }
      }
      return false;
    }

    function rotate(matrix) {
      return matrix[0].map(function (_, i) {
        return matrix.map(function (row) {
          return row[i];
        }).reverse();
      });
    }

    function lockPiece() {
      piece.matrix.forEach(function (row, y) {
        row.forEach(function (value, x) {
          if (value && piece.y + y >= 0) board[piece.y + y][piece.x + x] = value;
        });
      });
      var cleared = 0;
      board = board.filter(function (row) {
        if (row.every(Boolean)) {
          cleared++;
          return false;
        }
        return true;
      });
      while (board.length < rows) board.unshift(Array(cols).fill(0));
      if (cleared) {
        lines += cleared;
        score += [0, 100, 300, 500, 800][cleared];
      }
      spawn();
      updateStats();
    }

    function move(dx, dy) {
      if (gameOver) return;
      if (!collides(piece.x + dx, piece.y + dy, piece.matrix)) {
        piece.x += dx;
        piece.y += dy;
      } else if (dy) {
        lockPiece();
      }
      draw();
    }

    function rotatePiece() {
      if (gameOver) return;
      var next = rotate(piece.matrix);
      if (!collides(piece.x, piece.y, next)) piece.matrix = next;
      draw();
    }

    function hardDrop() {
      if (gameOver) return;
      while (!collides(piece.x, piece.y + 1, piece.matrix)) piece.y++;
      lockPiece();
      draw();
    }

    function drawCell(x, y, value) {
      ctx.fillStyle = colors[value];
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    }

    function draw() {
      drawBackdrop(ctx, 300, 600);
      board.forEach(function (row, y) {
        row.forEach(function (value, x) {
          if (value) drawCell(x, y, value);
        });
      });
      if (piece) {
        piece.matrix.forEach(function (row, y) {
          row.forEach(function (value, x) {
            if (value) drawCell(piece.x + x, piece.y + y, value);
          });
        });
      }
      if (gameOver) overlay(ctx, 300, 600, "Game Over", "Press New to play again");
    }

    ui.controls.append(
      button("New", "Start a new game", reset),
      button("←", "Move left", function () { move(-1, 0); }),
      button("→", "Move right", function () { move(1, 0); }),
      button("↓", "Move down", function () { move(0, 1); }),
      button("Rotate", "Rotate", rotatePiece),
      button("Drop", "Drop", hardDrop)
    );
    keyControls(function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1, 0); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1, 0); }
      if (event.key === "ArrowDown") { event.preventDefault(); move(0, 1); }
      if (event.key === "ArrowUp") { event.preventDefault(); rotatePiece(); }
      if (event.code === "Space") { event.preventDefault(); hardDrop(); }
    });
    reset();
    setInterval(function () {
      if (!gameOver) move(0, 1);
    }, 620);
  };

  Games["snake-io"] = function (root, game) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Length", "3");
    var bestStat = ui.stat("Snacks", "0");
    ui.help.textContent = "";
    var kit = makeCanvas(ui.stage, 600, 600, false);
    var ctx = kit.ctx;
    var cells = 24;
    var cell = 25;
    var snake;
    var dir;
    var nextDir;
    var food;
    var snacks;
    var bots;
    var dead;

    function reset() {
      snake = [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      food = placeFood();
      snacks = 0;
      dead = false;
      bots = [
        { body: [{ x: 17, y: 4 }, { x: 17, y: 3 }, { x: 17, y: 2 }], dir: { x: 0, y: 1 }, color: "#ff6b9a" },
        { body: [{ x: 18, y: 18 }, { x: 19, y: 18 }, { x: 20, y: 18 }], dir: { x: -1, y: 0 }, color: "#f7c75b" }
      ];
      draw();
    }

    function placeFood() {
      return { x: rand(cells), y: rand(cells) };
    }

    function setDir(x, y) {
      if (dir.x + x === 0 && dir.y + y === 0) return;
      nextDir = { x: x, y: y };
    }

    function hitsList(point, list) {
      return list.some(function (item) {
        return item.x === point.x && item.y === point.y;
      });
    }

    function updateBot(bot) {
      if (Math.random() < .25) {
        var turns = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        bot.dir = turns[rand(turns.length)];
      }
      var head = bot.body[0];
      var next = {
        x: (head.x + bot.dir.x + cells) % cells,
        y: (head.y + bot.dir.y + cells) % cells
      };
      bot.body.unshift(next);
      while (bot.body.length > 5) bot.body.pop();
    }

    function tick() {
      if (dead) return;
      dir = nextDir;
      var head = snake[0];
      var next = {
        x: (head.x + dir.x + cells) % cells,
        y: (head.y + dir.y + cells) % cells
      };
      if (hitsList(next, snake) || bots.some(function (bot) { return hitsList(next, bot.body); })) {
        dead = true;
        draw();
        return;
      }
      snake.unshift(next);
      if (next.x === food.x && next.y === food.y) {
        snacks++;
        food = placeFood();
      } else {
        snake.pop();
      }
      bots.forEach(updateBot);
      scoreStat.set(snake.length);
      bestStat.set(snacks);
      draw();
    }

    function drawDot(point, color) {
      ctx.fillStyle = color;
      ctx.fillRect(point.x * cell + 3, point.y * cell + 3, cell - 6, cell - 6);
    }

    function draw() {
      drawBackdrop(ctx, 600, 600);
      drawDot(food, "#f7c75b");
      bots.forEach(function (bot) {
        bot.body.forEach(function (part) {
          drawDot(part, bot.color);
        });
      });
      snake.forEach(function (part, index) {
        drawDot(part, index ? "#48d6a3" : "#75e0ff");
      });
      if (dead) overlay(ctx, 600, 600, "Tagged Out", "Press New for another run");
    }

    ui.controls.append(
      button("New", "Start a new run", reset),
      button("↑", "Up", function () { setDir(0, -1); }),
      button("←", "Left", function () { setDir(-1, 0); }),
      button("↓", "Down", function () { setDir(0, 1); }),
      button("→", "Right", function () { setDir(1, 0); })
    );
    keyControls(function (event) {
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") { event.preventDefault(); setDir(0, -1); }
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") { event.preventDefault(); setDir(0, 1); }
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); setDir(-1, 0); }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); setDir(1, 0); }
    });
    reset();
    setInterval(tick, 110);
  };

  Games["2048"] = function (root, game) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var bestStat = ui.stat("Best", storageGet("2048-best", 0));
    ui.help.textContent = "";
    var boardNode = el("div", "board-2048");
    ui.stage.appendChild(boardNode);
    var board;
    var score;
    var best = storageGet("2048-best", 0);

    function reset() {
      board = Array.from({ length: 4 }, function () {
        return Array(4).fill(0);
      });
      score = 0;
      addTile();
      addTile();
      render();
    }

    function emptyCells() {
      var cells = [];
      board.forEach(function (row, y) {
        row.forEach(function (value, x) {
          if (!value) cells.push({ x: x, y: y });
        });
      });
      return cells;
    }

    function addTile() {
      var cells = emptyCells();
      if (!cells.length) return;
      var pick = cells[rand(cells.length)];
      board[pick.y][pick.x] = Math.random() < .9 ? 2 : 4;
    }

    function mergeLine(line) {
      var values = line.filter(Boolean);
      var out = [];
      for (var i = 0; i < values.length; i++) {
        if (values[i] === values[i + 1]) {
          out.push(values[i] * 2);
          score += values[i] * 2;
          i++;
        } else {
          out.push(values[i]);
        }
      }
      while (out.length < 4) out.push(0);
      return out;
    }

    function move(direction) {
      var before = JSON.stringify(board);
      if (direction === "left") {
        board = board.map(mergeLine);
      }
      if (direction === "right") {
        board = board.map(function (row) {
          return mergeLine(row.slice().reverse()).reverse();
        });
      }
      if (direction === "up" || direction === "down") {
        var next = Array.from({ length: 4 }, function () {
          return Array(4).fill(0);
        });
        for (var x = 0; x < 4; x++) {
          var line = [];
          for (var y = 0; y < 4; y++) line.push(board[y][x]);
          if (direction === "down") line.reverse();
          var merged = mergeLine(line);
          if (direction === "down") merged.reverse();
          for (var yy = 0; yy < 4; yy++) next[yy][x] = merged[yy];
        }
        board = next;
      }
      if (JSON.stringify(board) !== before) addTile();
      if (score > best) {
        best = score;
        storageSet("2048-best", best);
      }
      render();
    }

    function render() {
      boardNode.replaceChildren();
      board.forEach(function (row) {
        row.forEach(function (value) {
          var tile = el("div", "tile-2048", value || "");
          var depth = value ? Math.min(10, Math.log2(value)) : 0;
          tile.style.background = value ? "hsl(" + (45 + depth * 18) + " 84% " + Math.max(45, 84 - depth * 4) + "%)" : "#1d2635";
          tile.style.color = value >= 128 ? "#f7f9ff" : "#11151d";
          boardNode.appendChild(tile);
        });
      });
      scoreStat.set(score);
      bestStat.set(best);
    }

    ui.controls.append(
      button("New", "New 2048 board", reset),
      button("↑", "Up", function () { move("up"); }),
      button("←", "Left", function () { move("left"); }),
      button("↓", "Down", function () { move("down"); }),
      button("→", "Right", function () { move("right"); })
    );
    keyControls(function (event) {
      if (event.key === "ArrowUp") { event.preventDefault(); move("up"); }
      if (event.key === "ArrowDown") { event.preventDefault(); move("down"); }
      if (event.key === "ArrowLeft") { event.preventDefault(); move("left"); }
      if (event.key === "ArrowRight") { event.preventDefault(); move("right"); }
    });
    reset();
  };

  Games["doge-miner"] = function (root, game) {
    var ui = layout(root, game);
    var coinStat = ui.stat("Coins", "0");
    var cpsStat = ui.stat("Coins/sec", "0");
    ui.help.textContent = "";
    var wrap = el("div", "clicker-wrap");
    var doge = el("button", "doge-button", "DOGE");
    doge.type = "button";
    var shop = el("div", "shop-grid");
    wrap.append(doge, shop);
    ui.stage.appendChild(wrap);
    var state = storageGet("doge", { coins: 0, miners: 0, drills: 0, rockets: 0 });

    function cps() {
      return state.miners * .5 + state.drills * 2.5 + state.rockets * 12;
    }

    function price(base, count) {
      return Math.floor(base * Math.pow(1.38, count));
    }

    function save() {
      storageSet("doge", state);
    }

    function buy(key, base) {
      var cost = price(base, state[key]);
      if (state.coins < cost) return;
      state.coins -= cost;
      state[key]++;
      save();
      render();
    }

    function render() {
      coinStat.set(Math.floor(state.coins));
      cpsStat.set(cps().toFixed(1));
      shop.replaceChildren();
      [
        ["miners", "Helper miner", 15, "+0.5 coins/sec"],
        ["drills", "Tiny drill", 80, "+2.5 coins/sec"],
        ["rockets", "Moon rocket", 420, "+12 coins/sec"]
      ].forEach(function (item) {
        var row = el("div", "shop-row");
        var copy = el("div");
        copy.append(el("strong", "", item[1] + " x" + state[item[0]]), el("p", "", item[3]));
        row.append(copy, button(price(item[2], state[item[0]]) + " coins", "Buy upgrade", function () {
          buy(item[0], item[2]);
        }));
        shop.appendChild(row);
      });
    }

    doge.addEventListener("click", function () {
      state.coins += 1 + state.miners * .05;
      save();
      render();
    });
    ui.controls.append(button("Reset", "Reset saved progress", function () {
      state = { coins: 0, miners: 0, drills: 0, rockets: 0 };
      save();
      render();
    }));
    setInterval(function () {
      state.coins += cps();
      save();
      render();
    }, 1000);
    render();
  };

  Games["brick-breaker"] = function (root, game) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var livesStat = ui.stat("Lives", "3");
    ui.help.textContent = "";
    var kit = makeCanvas(ui.stage, 640, 480, false);
    var canvas = kit.canvas;
    var ctx = kit.ctx;
    var paddle;
    var ball;
    var bricks;
    var score;
    var lives;
    var left = false;
    var right = false;

    function reset() {
      paddle = { x: 270, y: 444, w: 100, h: 14 };
      ball = { x: 320, y: 300, vx: 190, vy: -210, r: 8 };
      score = 0;
      lives = 3;
      bricks = [];
      for (var y = 0; y < 5; y++) {
        for (var x = 0; x < 9; x++) {
          bricks.push({ x: 42 + x * 62, y: 46 + y * 28, w: 52, h: 18, alive: true, color: ["#55a7ff", "#48d6a3", "#f7c75b", "#ff6b9a", "#75e0ff"][y] });
        }
      }
      renderStats();
    }

    function renderStats() {
      scoreStat.set(score);
      livesStat.set(lives);
    }

    function loseLife() {
      lives--;
      ball = { x: 320, y: 300, vx: 180, vy: -210, r: 8 };
      if (lives <= 0) reset();
      renderStats();
    }

    function update(dt) {
      if (left) paddle.x -= 360 * dt;
      if (right) paddle.x += 360 * dt;
      paddle.x = clamp(paddle.x, 0, 640 - paddle.w);
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x < ball.r || ball.x > 640 - ball.r) ball.vx *= -1;
      if (ball.y < ball.r) ball.vy *= -1;
      if (ball.y > 500) loseLife();
      if (ball.x > paddle.x && ball.x < paddle.x + paddle.w && ball.y + ball.r > paddle.y && ball.y < paddle.y + paddle.h) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 5;
      }
      bricks.forEach(function (brick) {
        if (!brick.alive) return;
        if (ball.x > brick.x && ball.x < brick.x + brick.w && ball.y > brick.y && ball.y < brick.y + brick.h) {
          brick.alive = false;
          ball.vy *= -1;
          score += 10;
          renderStats();
        }
      });
      if (bricks.every(function (brick) { return !brick.alive; })) reset();
    }

    function draw() {
      drawBackdrop(ctx, 640, 480);
      bricks.forEach(function (brick) {
        if (!brick.alive) return;
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      });
      ctx.fillStyle = "#f7f9ff";
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.fillStyle = "#f7c75b";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ui.controls.append(button("New", "Restart", reset));
    keyControls(function (event) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); left = true; }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); right = true; }
    });
    document.addEventListener("keyup", function (event) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") left = false;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") right = false;
    });
    canvas.addEventListener("pointermove", function (event) {
      var rect = canvas.getBoundingClientRect();
      paddle.x = clamp((event.clientX - rect.left) / rect.width * 640 - paddle.w / 2, 0, 640 - paddle.w);
    });
    reset();
    loop(function (dt) {
      update(dt);
      draw();
    });
  };

  Games["space-dodger"] = function (root, game) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Time", "0.0");
    var bestStat = ui.stat("Best", storageGet("space-best", 0).toFixed(1));
    ui.help.textContent = "";
    var kit = makeCanvas(ui.stage, 600, 600, false);
    var ctx = kit.ctx;
    var player;
    var rocks;
    var keys = {};
    var time;
    var best = storageGet("space-best", 0);
    var dead;
    var spawnTimer;

    function reset() {
      player = { x: 280, y: 520, w: 32, h: 32 };
      rocks = [];
      time = 0;
      spawnTimer = 0;
      dead = false;
    }

    function update(dt) {
      if (dead) return;
      time += dt;
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnTimer = Math.max(.18, .55 - time * .01);
        rocks.push({ x: rand(560), y: -40, s: 20 + rand(36), v: 120 + rand(160) + time * 4 });
      }
      var speed = 300;
      if (keys.left) player.x -= speed * dt;
      if (keys.right) player.x += speed * dt;
      if (keys.up) player.y -= speed * dt;
      if (keys.down) player.y += speed * dt;
      player.x = clamp(player.x, 0, 600 - player.w);
      player.y = clamp(player.y, 0, 600 - player.h);
      rocks.forEach(function (rock) {
        rock.y += rock.v * dt;
        if (player.x < rock.x + rock.s && player.x + player.w > rock.x && player.y < rock.y + rock.s && player.y + player.h > rock.y) {
          dead = true;
          if (time > best) {
            best = time;
            storageSet("space-best", best);
          }
        }
      });
      rocks = rocks.filter(function (rock) {
        return rock.y < 650;
      });
      scoreStat.set(time.toFixed(1));
      bestStat.set(best.toFixed(1));
    }

    function draw() {
      drawBackdrop(ctx, 600, 600);
      ctx.fillStyle = "#75e0ff";
      ctx.beginPath();
      ctx.moveTo(player.x + 16, player.y);
      ctx.lineTo(player.x + 32, player.y + 32);
      ctx.lineTo(player.x, player.y + 32);
      ctx.closePath();
      ctx.fill();
      rocks.forEach(function (rock) {
        ctx.fillStyle = "#ff715b";
        ctx.fillRect(rock.x, rock.y, rock.s, rock.s);
      });
      if (dead) overlay(ctx, 600, 600, "Crashed", "Press New to dodge again");
    }

    ui.controls.append(button("New", "Start over", reset));
    keyControls(function (event) {
      var key = event.key.toLowerCase();
      if (event.key === "ArrowLeft" || key === "a") { event.preventDefault(); keys.left = true; }
      if (event.key === "ArrowRight" || key === "d") { event.preventDefault(); keys.right = true; }
      if (event.key === "ArrowUp" || key === "w") { event.preventDefault(); keys.up = true; }
      if (event.key === "ArrowDown" || key === "s") { event.preventDefault(); keys.down = true; }
    });
    document.addEventListener("keyup", function (event) {
      var key = event.key.toLowerCase();
      if (event.key === "ArrowLeft" || key === "a") keys.left = false;
      if (event.key === "ArrowRight" || key === "d") keys.right = false;
      if (event.key === "ArrowUp" || key === "w") keys.up = false;
      if (event.key === "ArrowDown" || key === "s") keys.down = false;
    });
    reset();
    loop(function (dt) {
      update(dt);
      draw();
    });
  };

  Games["flappy-pixel"] = function (root, game) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var bestStat = ui.stat("Best", storageGet("flappy-best", 0));
    ui.help.textContent = "";
    var kit = makeCanvas(ui.stage, 480, 640, true);
    var canvas = kit.canvas;
    var ctx = kit.ctx;
    var bird;
    var pipes;
    var score;
    var best = storageGet("flappy-best", 0);
    var dead;
    var timer;

    function reset() {
      bird = { x: 105, y: 280, vy: 0, s: 24 };
      pipes = [];
      score = 0;
      dead = false;
      timer = 0;
    }

    function flap() {
      if (dead) {
        reset();
      }
      bird.vy = -290;
    }

    function update(dt) {
      if (dead) return;
      timer -= dt;
      if (timer <= 0) {
        timer = 1.45;
        var gapY = 130 + rand(320);
        pipes.push({ x: 520, gap: gapY, passed: false });
      }
      bird.vy += 760 * dt;
      bird.y += bird.vy * dt;
      pipes.forEach(function (pipe) {
        pipe.x -= 155 * dt;
        if (!pipe.passed && pipe.x + 52 < bird.x) {
          pipe.passed = true;
          score++;
          if (score > best) {
            best = score;
            storageSet("flappy-best", best);
          }
        }
        var inX = bird.x + bird.s > pipe.x && bird.x < pipe.x + 52;
        var inGap = bird.y > pipe.gap - 78 && bird.y + bird.s < pipe.gap + 78;
        if (inX && !inGap) dead = true;
      });
      if (bird.y < 0 || bird.y + bird.s > 640) dead = true;
      pipes = pipes.filter(function (pipe) { return pipe.x > -60; });
      scoreStat.set(score);
      bestStat.set(best);
    }

    function draw() {
      drawBackdrop(ctx, 480, 640);
      pipes.forEach(function (pipe) {
        ctx.fillStyle = "#48d6a3";
        ctx.fillRect(pipe.x, 0, 52, pipe.gap - 78);
        ctx.fillRect(pipe.x, pipe.gap + 78, 52, 640);
      });
      ctx.fillStyle = "#f7c75b";
      ctx.fillRect(bird.x, bird.y, bird.s, bird.s);
      if (dead) overlay(ctx, 480, 640, "Bonk", "Tap to restart");
    }

    ui.controls.append(button("Hop", "Hop", flap), button("New", "Restart", reset));
    keyControls(function (event) {
      if (event.code === "Space" || event.key === "ArrowUp") {
        event.preventDefault();
        flap();
      }
    });
    canvas.addEventListener("pointerdown", flap);
    reset();
    loop(function (dt) {
      update(dt);
      draw();
    });
  };

  Games["memory-match"] = function (root, game) {
    var ui = layout(root, game);
    var moveStat = ui.stat("Moves", "0");
    var matchStat = ui.stat("Pairs", "0/8");
    ui.help.textContent = "";
    var boardNode = el("div", "memory-board");
    ui.stage.appendChild(boardNode);
    var cards;
    var open;
    var locked;
    var moves;
    var matches;

    function reset() {
      cards = shuffle(["A", "A", "B", "B", "C", "C", "D", "D", "E", "E", "F", "F", "G", "G", "H", "H"]).map(function (value) {
        return { value: value, open: false, done: false };
      });
      open = [];
      locked = false;
      moves = 0;
      matches = 0;
      render();
    }

    function flip(index) {
      if (locked || cards[index].open || cards[index].done) return;
      cards[index].open = true;
      open.push(index);
      if (open.length === 2) {
        moves++;
        if (cards[open[0]].value === cards[open[1]].value) {
          cards[open[0]].done = true;
          cards[open[1]].done = true;
          matches++;
          open = [];
        } else {
          locked = true;
          setTimeout(function () {
            cards[open[0]].open = false;
            cards[open[1]].open = false;
            open = [];
            locked = false;
            render();
          }, 650);
        }
      }
      render();
    }

    function render() {
      boardNode.replaceChildren();
      cards.forEach(function (card, index) {
        var node = el("button", "memory-card", card.open || card.done ? card.value : "");
        node.type = "button";
        node.style.background = card.done ? "#48d6a3" : card.open ? "#f7c75b" : "#1b2230";
        node.addEventListener("click", function () {
          flip(index);
        });
        boardNode.appendChild(node);
      });
      moveStat.set(moves);
      matchStat.set(matches + "/8");
    }

    ui.controls.append(button("New", "Shuffle again", reset));
    reset();
  };

  Games.minefield = function (root, game) {
    var ui = layout(root, game);
    var flagStat = ui.stat("Flags", "0");
    var safeStat = ui.stat("Safe", "0/71");
    ui.help.textContent = "";
    var boardNode = el("div", "mine-board");
    ui.stage.appendChild(boardNode);
    var cells;
    var mode = "reveal";
    var lost;
    var started;

    function reset() {
      cells = Array.from({ length: 81 }, function () {
        return { mine: false, shown: false, flag: false, count: 0 };
      });
      mode = "reveal";
      lost = false;
      started = false;
      render();
    }

    function neighbors(index) {
      var x = index % 9;
      var y = Math.floor(index / 9);
      var out = [];
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var nx = x + dx;
          var ny = y + dy;
          if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) out.push(ny * 9 + nx);
        }
      }
      return out;
    }

    function seed(first) {
      var banned = new Set([first].concat(neighbors(first)));
      var placed = 0;
      while (placed < 10) {
        var index = rand(81);
        if (!banned.has(index) && !cells[index].mine) {
          cells[index].mine = true;
          placed++;
        }
      }
      cells.forEach(function (cell, index) {
        cell.count = neighbors(index).filter(function (next) {
          return cells[next].mine;
        }).length;
      });
      started = true;
    }

    function reveal(index) {
      if (lost || cells[index].flag || cells[index].shown) return;
      if (!started) seed(index);
      cells[index].shown = true;
      if (cells[index].mine) {
        lost = true;
        cells.forEach(function (cell) { cell.shown = true; });
      } else if (cells[index].count === 0) {
        neighbors(index).forEach(reveal);
      }
      render();
    }

    function flag(index) {
      if (lost || cells[index].shown) return;
      cells[index].flag = !cells[index].flag;
      render();
    }

    function render() {
      boardNode.replaceChildren();
      var flags = 0;
      var safe = 0;
      cells.forEach(function (cell, index) {
        if (cell.flag) flags++;
        if (cell.shown && !cell.mine) safe++;
        var node = el("button", "mine-cell", "");
        node.type = "button";
        if (cell.shown) {
          node.style.background = cell.mine ? "#ff715b" : "#263349";
          node.textContent = cell.mine ? "*" : cell.count || "";
        } else if (cell.flag) {
          node.style.background = "#f7c75b";
          node.style.color = "#11151d";
          node.textContent = "F";
        }
        node.addEventListener("click", function () {
          mode === "flag" ? flag(index) : reveal(index);
        });
        node.addEventListener("contextmenu", function (event) {
          event.preventDefault();
          flag(index);
        });
        boardNode.appendChild(node);
      });
      flagStat.set(flags + "/10");
      safeStat.set(safe + "/71");
    }

    ui.controls.append(
      button("New", "New minefield", reset),
      button("Reveal Mode", "Reveal cells", function () { mode = "reveal"; }),
      button("Flag Mode", "Place flags", function () { mode = "flag"; })
    );
    reset();
  };

  Games["connect-four"] = function (root, game) {
    var ui = layout(root, game);
    var turnStat = ui.stat("Turn", "Red");
    var winStat = ui.stat("Winner", "-");
    ui.help.textContent = "";
    var boardNode = el("div", "connect-board");
    ui.stage.appendChild(boardNode);
    var board;
    var player;
    var winner;

    function reset() {
      board = Array.from({ length: 6 }, function () {
        return Array(7).fill(0);
      });
      player = 1;
      winner = 0;
      render();
    }

    function drop(col) {
      if (winner) return;
      for (var y = 5; y >= 0; y--) {
        if (!board[y][col]) {
          board[y][col] = player;
          if (checkWin(y, col, player)) winner = player;
          player = player === 1 ? 2 : 1;
          render();
          return;
        }
      }
    }

    function count(y, x, dy, dx, value) {
      var total = 0;
      y += dy;
      x += dx;
      while (y >= 0 && y < 6 && x >= 0 && x < 7 && board[y][x] === value) {
        total++;
        y += dy;
        x += dx;
      }
      return total;
    }

    function checkWin(y, x, value) {
      return [[1, 0], [0, 1], [1, 1], [1, -1]].some(function (dir) {
        return 1 + count(y, x, dir[0], dir[1], value) + count(y, x, -dir[0], -dir[1], value) >= 4;
      });
    }

    function render() {
      boardNode.replaceChildren();
      for (var y = 0; y < 6; y++) {
        for (var x = 0; x < 7; x++) {
          var cell = el("button", "connect-cell");
          cell.type = "button";
          var value = board[y][x];
          cell.style.background = value === 1 ? "#ff715b" : value === 2 ? "#f7c75b" : "#0d1119";
          cell.addEventListener("click", drop.bind(null, x));
          boardNode.appendChild(cell);
        }
      }
      turnStat.set(player === 1 ? "Red" : "Gold");
      winStat.set(winner ? (winner === 1 ? "Red" : "Gold") : "-");
    }

    ui.controls.append(button("New", "Clear board", reset));
    reset();
  };

  Games["tile-runner"] = function (root, game) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var bestStat = ui.stat("Best", storageGet("runner-best", 0));
    ui.help.textContent = "";
    var kit = makeCanvas(ui.stage, 540, 680, true);
    var ctx = kit.ctx;
    var lane;
    var obstacles;
    var score;
    var best = storageGet("runner-best", 0);
    var dead;
    var timer;

    function reset() {
      lane = 1;
      obstacles = [];
      score = 0;
      timer = 0;
      dead = false;
    }

    function move(delta) {
      if (dead) return;
      lane = clamp(lane + delta, 0, 2);
    }

    function update(dt) {
      if (dead) return;
      score += dt * 10;
      timer -= dt;
      if (timer <= 0) {
        timer = Math.max(.38, .9 - score * .003);
        obstacles.push({ lane: rand(3), y: -70, h: 58, speed: 210 + score * 2 });
      }
      obstacles.forEach(function (ob) { ob.y += ob.speed * dt; });
      obstacles = obstacles.filter(function (ob) { return ob.y < 740; });
      obstacles.forEach(function (ob) {
        if (ob.lane === lane && ob.y + ob.h > 560 && ob.y < 624) {
          dead = true;
          if (Math.floor(score) > best) {
            best = Math.floor(score);
            storageSet("runner-best", best);
          }
        }
      });
      scoreStat.set(Math.floor(score));
      bestStat.set(best);
    }

    function draw() {
      drawBackdrop(ctx, 540, 680);
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = i === lane ? "rgba(72,214,163,.18)" : "rgba(255,255,255,.04)";
        ctx.fillRect(30 + i * 160, 0, 140, 680);
      }
      obstacles.forEach(function (ob) {
        ctx.fillStyle = "#ff715b";
        ctx.fillRect(42 + ob.lane * 160, ob.y, 116, ob.h);
      });
      ctx.fillStyle = "#f7c75b";
      ctx.fillRect(64 + lane * 160, 560, 72, 64);
      if (dead) overlay(ctx, 540, 680, "Missed Tile", "Press New");
    }

    ui.controls.append(
      button("New", "Restart run", reset),
      button("←", "Left lane", function () { move(-1); }),
      button("→", "Right lane", function () { move(1); })
    );
    keyControls(function (event) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); move(1); }
    });
    reset();
    loop(function (dt) {
      update(dt);
      draw();
    });
  };

  Games["platform-hopper"] = function (root, game) {
    var ui = layout(root, game);
    var starStat = ui.stat("Stars", "0");
    var bestStat = ui.stat("Best", storageGet("hopper-best", 0));
    ui.help.textContent = "";
    var kit = makeCanvas(ui.stage, 640, 480, false);
    var ctx = kit.ctx;
    var player;
    var keys = {};
    var stars;
    var best = storageGet("hopper-best", 0);
    var platforms = [
      { x: 20, y: 430, w: 150 },
      { x: 220, y: 360, w: 120 },
      { x: 420, y: 300, w: 150 },
      { x: 120, y: 240, w: 130 },
      { x: 350, y: 170, w: 120 },
      { x: 90, y: 110, w: 100 }
    ];

    function reset() {
      player = { x: 54, y: 390, vx: 0, vy: 0, w: 24, h: 32, grounded: false };
      stars = [{ x: 260, y: 328 }, { x: 470, y: 268 }, { x: 155, y: 208 }, { x: 382, y: 138 }, { x: 125, y: 78 }];
      renderStats();
    }

    function renderStats() {
      var collected = 5 - stars.length;
      starStat.set(collected + "/5");
      bestStat.set(best);
      if (collected > best) {
        best = collected;
        storageSet("hopper-best", best);
      }
    }

    function jump() {
      if (player.grounded) {
        player.vy = -390;
        player.grounded = false;
      }
    }

    function update(dt) {
      player.vx = 0;
      if (keys.left) player.vx = -220;
      if (keys.right) player.vx = 220;
      player.vy += 760 * dt;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.x = clamp(player.x, 0, 640 - player.w);
      player.grounded = false;
      platforms.forEach(function (platform) {
        var above = player.y + player.h <= platform.y + 12;
        if (above && player.y + player.h + player.vy * dt >= platform.y && player.x + player.w > platform.x && player.x < platform.x + platform.w) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
        }
      });
      stars = stars.filter(function (star) {
        return !(player.x < star.x + 18 && player.x + player.w > star.x && player.y < star.y + 18 && player.y + player.h > star.y);
      });
      if (player.y > 520) reset();
      renderStats();
    }

    function draw() {
      drawBackdrop(ctx, 640, 480);
      ctx.fillStyle = "#48d6a3";
      platforms.forEach(function (platform) {
        ctx.fillRect(platform.x, platform.y, platform.w, 12);
      });
      ctx.fillStyle = "#f7c75b";
      stars.forEach(function (star) {
        ctx.fillRect(star.x, star.y, 18, 18);
      });
      ctx.fillStyle = "#75e0ff";
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    ui.controls.append(
      button("New", "Restart", reset),
      button("←", "Left", function () { keys.left = true; setTimeout(function () { keys.left = false; }, 150); }),
      button("Jump", "Jump", jump),
      button("→", "Right", function () { keys.right = true; setTimeout(function () { keys.right = false; }, 150); })
    );
    keyControls(function (event) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); keys.left = true; }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); keys.right = true; }
      if (event.key === "ArrowUp" || event.code === "Space" || event.key.toLowerCase() === "w") { event.preventDefault(); jump(); }
    });
    document.addEventListener("keyup", function (event) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = false;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = false;
    });
    reset();
    loop(function (dt) {
      update(dt);
      draw();
    });
  };

  Games["word-pop"] = function (root, game) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var livesStat = ui.stat("Lives", "3");
    ui.help.textContent = "";
    var wrap = el("div", "word-game");
    var arena = el("div", "word-arena");
    var input = el("input", "word-input");
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = "type word + Enter";
    wrap.append(arena, input);
    ui.stage.appendChild(wrap);
    var words = ["pixel", "party", "snake", "block", "jump", "dash", "coin", "laser", "tile", "combo", "arcade", "quick"];
    var active;
    var score;
    var lives;
    var timer;
    var running;

    function reset() {
      active = [];
      score = 0;
      lives = 3;
      timer = 0;
      running = true;
      input.value = "";
      input.focus();
      render();
    }

    function spawnWord() {
      active.push({ text: words[rand(words.length)], x: 20 + rand(460), y: -30, speed: 34 + rand(38) + score });
    }

    function update(dt) {
      if (!running) return;
      timer -= dt;
      if (timer <= 0) {
        timer = Math.max(.7, 1.35 - score * .02);
        spawnWord();
      }
      active.forEach(function (word) { word.y += word.speed * dt; });
      var before = active.length;
      active = active.filter(function (word) {
        return word.y < arena.clientHeight - 22;
      });
      lives -= before - active.length;
      if (lives <= 0) running = false;
      render();
    }

    function render() {
      arena.replaceChildren();
      active.forEach(function (word) {
        var chip = el("div", "word-chip", word.text);
        chip.style.left = word.x + "px";
        chip.style.top = word.y + "px";
        arena.appendChild(chip);
      });
      if (!running) {
        var done = el("div", "empty-state", "Game over. Press New.");
        done.style.position = "absolute";
        done.style.inset = "20px";
        arena.appendChild(done);
      }
      scoreStat.set(score);
      livesStat.set(Math.max(0, lives));
    }

    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      var value = input.value.trim().toLowerCase();
      var index = active.findIndex(function (word) {
        return word.text === value;
      });
      if (index >= 0) {
        active.splice(index, 1);
        score++;
      }
      input.value = "";
      render();
    });
    ui.controls.append(button("New", "Restart words", reset));
    reset();
    loop(update);
  };

  Games["reaction-dash"] = function (root, game) {
    var ui = layout(root, game);
    var lastStat = ui.stat("Last", "-");
    var bestStat = ui.stat("Best", storageGet("reaction-best", "-"));
    ui.help.textContent = "";
    var target = el("button", "doge-button", "START");
    target.type = "button";
    target.style.background = "#1b2230";
    ui.stage.appendChild(target);
    var state = "idle";
    var readyAt = 0;
    var timeout;
    var best = storageGet("reaction-best", null);

    function setTarget(text, color) {
      target.textContent = text;
      target.style.background = color;
    }

    function start() {
      clearTimeout(timeout);
      state = "waiting";
      setTarget("WAIT", "#ff715b");
      timeout = setTimeout(function () {
        state = "ready";
        readyAt = performance.now();
        setTarget("GO", "#48d6a3");
      }, 800 + rand(2200));
    }

    target.addEventListener("click", function () {
      if (state === "idle") {
        start();
      } else if (state === "waiting") {
        clearTimeout(timeout);
        state = "idle";
        lastStat.set("Too soon");
        setTarget("START", "#1b2230");
      } else if (state === "ready") {
        var time = Math.round(performance.now() - readyAt);
        state = "idle";
        lastStat.set(time + " ms");
        if (!best || time < best) {
          best = time;
          storageSet("reaction-best", best);
        }
        bestStat.set(best + " ms");
        setTarget("START", "#1b2230");
      }
    });
    ui.controls.append(button("New", "Start a new reaction test", start));
    bestStat.set(best ? best + " ms" : "-");
  };

  Games.pong = function (root, game) {
    var ui = layout(root, game);
    var leftStat = ui.stat("Left", "0");
    var rightStat = ui.stat("Right", "0");
    ui.help.textContent = "";
    var kit = makeCanvas(ui.stage, 640, 420, false);
    var ctx = kit.ctx;
    var left;
    var right;
    var ball;
    var keys = {};
    var score;

    function resetBall(dir) {
      ball = { x: 320, y: 210, vx: dir * 230, vy: (Math.random() - .5) * 180, r: 8 };
    }

    function reset() {
      left = { x: 24, y: 160, w: 12, h: 84 };
      right = { x: 604, y: 160, w: 12, h: 84 };
      score = { left: 0, right: 0 };
      resetBall(Math.random() < .5 ? -1 : 1);
      renderStats();
    }

    function renderStats() {
      leftStat.set(score.left);
      rightStat.set(score.right);
    }

    function paddleHit(paddle) {
      return ball.x + ball.r > paddle.x && ball.x - ball.r < paddle.x + paddle.w && ball.y > paddle.y && ball.y < paddle.y + paddle.h;
    }

    function update(dt) {
      if (keys.w) left.y -= 310 * dt;
      if (keys.s) left.y += 310 * dt;
      if (keys.up) right.y -= 310 * dt;
      if (keys.down) right.y += 310 * dt;
      if (!keys.up && !keys.down) right.y += (ball.y - (right.y + right.h / 2)) * dt * 2.2;
      left.y = clamp(left.y, 0, 420 - left.h);
      right.y = clamp(right.y, 0, 420 - right.h);
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.y < ball.r || ball.y > 420 - ball.r) ball.vy *= -1;
      if (paddleHit(left)) {
        ball.vx = Math.abs(ball.vx) + 10;
        ball.vy += (ball.y - (left.y + left.h / 2)) * 5;
      }
      if (paddleHit(right)) {
        ball.vx = -Math.abs(ball.vx) - 10;
        ball.vy += (ball.y - (right.y + right.h / 2)) * 5;
      }
      if (ball.x < -20) {
        score.right++;
        resetBall(1);
      }
      if (ball.x > 660) {
        score.left++;
        resetBall(-1);
      }
      renderStats();
    }

    function draw() {
      drawBackdrop(ctx, 640, 420);
      ctx.fillStyle = "#f7f9ff";
      ctx.fillRect(left.x, left.y, left.w, left.h);
      ctx.fillRect(right.x, right.y, right.w, right.h);
      ctx.fillStyle = "#f7c75b";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ui.controls.append(button("New", "Reset score", reset));
    keyControls(function (event) {
      var key = event.key.toLowerCase();
      if (key === "w") keys.w = true;
      if (key === "s") keys.s = true;
      if (event.key === "ArrowUp") { event.preventDefault(); keys.up = true; }
      if (event.key === "ArrowDown") { event.preventDefault(); keys.down = true; }
    });
    document.addEventListener("keyup", function (event) {
      var key = event.key.toLowerCase();
      if (key === "w") keys.w = false;
      if (key === "s") keys.s = false;
      if (event.key === "ArrowUp") keys.up = false;
      if (event.key === "ArrowDown") keys.down = false;
    });
    reset();
    loop(function (dt) {
      update(dt);
      draw();
    });
  };

  function chanceGame(root, game, config) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var livesStat = ui.stat("Lives", "3");
    var roundStat = ui.stat("Round", "1");
    var wrap = el("div", "micro-wrap");
    var display = el("div", "micro-display");
    var shells = el("div", "micro-shells");
    wrap.append(display, shells);
    ui.stage.appendChild(wrap);
    var score = 0;
    var lives = 3;
    var round = 1;
    var deck = [];
    var peeked = false;

    function newDeck() {
      var danger = Math.min(4, 1 + Math.floor(round / 2));
      deck = [];
      for (var i = 0; i < 6; i++) deck.push(i < danger ? "hot" : "safe");
      deck = shuffle(deck);
      peeked = false;
    }

    function render(message) {
      scoreStat.set(score);
      livesStat.set(lives);
      roundStat.set(round);
      display.textContent = message || config.prompt;
      shells.replaceChildren();
      deck.forEach(function (_, index) {
        var slot = el("div", "micro-shell", index === 0 && peeked ? deck[0].toUpperCase() : "?");
        slot.style.background = index === 0 && peeked ? deck[0] === "hot" ? "#ff715b" : "#48d6a3" : "";
        shells.appendChild(slot);
      });
    }

    function reset() {
      score = 0;
      lives = 3;
      round = 1;
      newDeck();
      render();
    }

    function drawShell() {
      if (lives <= 0) return;
      if (!deck.length) {
        round++;
        newDeck();
      }
      var next = deck.shift();
      if (next === "hot") {
        lives--;
        render(lives ? "Hot shell. You lost a life." : "Table wins. Press New.");
      } else {
        score++;
        render("Safe shell. Banked a point.");
      }
      if (!deck.length && lives > 0) {
        round++;
        newDeck();
      }
    }

    function peek() {
      if (peeked || !deck.length) return;
      peeked = true;
      render(deck[0] === "hot" ? "Scanner sees danger first." : "Scanner sees safe first.");
    }

    ui.controls.append(
      button("Draw", "Draw the next shell", drawShell),
      button("Scan", "Reveal the next shell once", peek),
      button("New", "Restart", reset)
    );
    reset();
  }

  function timingGame(root, game, config) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var streakStat = ui.stat("Streak", "0");
    var wrap = el("div", "micro-wrap");
    var meter = el("div", "timing-meter");
    var zone = el("div", "timing-zone");
    var pin = el("div", "timing-pin");
    meter.append(zone, pin);
    var display = el("div", "micro-display", config.prompt);
    wrap.append(display, meter);
    ui.stage.appendChild(wrap);
    var value = 0;
    var dir = 1;
    var score = 0;
    var streak = 0;

    function hit() {
      if (value > 42 && value < 58) {
        score += 1 + streak;
        streak++;
        display.textContent = config.hit;
      } else {
        streak = 0;
        display.textContent = config.miss;
      }
      scoreStat.set(score);
      streakStat.set(streak);
    }

    ui.controls.append(button("Hit", "Try the timing window", hit), button("New", "Reset", function () {
      score = 0;
      streak = 0;
      display.textContent = config.prompt;
      scoreStat.set(score);
      streakStat.set(streak);
    }));
    loop(function (dt) {
      value += dir * dt * (55 + streak * 4);
      if (value >= 100 || value <= 0) dir *= -1;
      value = clamp(value, 0, 100);
      pin.style.left = value + "%";
    });
  }

  function gridGame(root, game, config) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var livesStat = ui.stat("Lives", "3");
    var board = el("div", "micro-grid");
    ui.stage.appendChild(board);
    var player;
    var goal;
    var hazards;
    var score;
    var lives;

    function reset() {
      player = { x: 0, y: 0 };
      goal = { x: 4, y: 4 };
      hazards = [{ x: 2, y: 1 }, { x: 3, y: 3 }, { x: 1, y: 4 }];
      score = 0;
      lives = 3;
      render();
    }

    function same(a, b) {
      return a.x === b.x && a.y === b.y;
    }

    function move(dx, dy) {
      player.x = clamp(player.x + dx, 0, 4);
      player.y = clamp(player.y + dy, 0, 4);
      if (hazards.some(function (hazard) { return same(hazard, player); })) {
        lives--;
        player = { x: 0, y: 0 };
      }
      if (same(player, goal)) {
        score++;
        goal = { x: rand(5), y: rand(5) };
        hazards = hazards.map(function () { return { x: rand(5), y: rand(5) }; });
      }
      if (lives <= 0) reset();
      render();
    }

    function render() {
      board.replaceChildren();
      for (var y = 0; y < 5; y++) {
        for (var x = 0; x < 5; x++) {
          var cell = el("div", "micro-cell");
          var point = { x: x, y: y };
          if (same(point, player)) {
            cell.textContent = "P";
            cell.style.background = "#75e0ff";
          } else if (same(point, goal)) {
            cell.textContent = "G";
            cell.style.background = "#48d6a3";
          } else if (hazards.some(function (hazard) { return same(hazard, point); })) {
            cell.textContent = "X";
            cell.style.background = "#ff715b";
          }
          board.appendChild(cell);
        }
      }
      scoreStat.set(score);
      livesStat.set(lives);
    }

    ui.controls.append(
      button("New", "Reset", reset),
      button("Up", "Move up", function () { move(0, -1); }),
      button("Left", "Move left", function () { move(-1, 0); }),
      button("Down", "Move down", function () { move(0, 1); }),
      button("Right", "Move right", function () { move(1, 0); })
    );
    keyControls(function (event) {
      if (event.key === "ArrowUp") { event.preventDefault(); move(0, -1); }
      if (event.key === "ArrowDown") { event.preventDefault(); move(0, 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1, 0); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1, 0); }
    });
    reset();
  }

  function targetGame(root, game, config) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var livesStat = ui.stat("Lives", "5");
    var kit = makeCanvas(ui.stage, 640, 420, false);
    var canvas = kit.canvas;
    var ctx = kit.ctx;
    var score = 0;
    var lives = 5;
    var target = {};

    function place() {
      target = { x: 50 + rand(540), y: 50 + rand(320), r: 18 + rand(18) };
    }

    function reset() {
      score = 0;
      lives = 5;
      place();
      renderStats();
    }

    function renderStats() {
      scoreStat.set(score);
      livesStat.set(lives);
    }

    function draw() {
      drawBackdrop(ctx, 640, 420);
      ctx.fillStyle = config.color || "#75e0ff";
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f7f9ff";
      ctx.font = "900 18px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(config.prompt, 320, 36);
    }

    canvas.addEventListener("pointerdown", function (event) {
      var rect = canvas.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width * 640;
      var y = (event.clientY - rect.top) / rect.height * 420;
      var hit = Math.hypot(x - target.x, y - target.y) <= target.r;
      if (hit) {
        score++;
      } else {
        lives--;
      }
      if (lives <= 0) reset();
      place();
      renderStats();
    });
    ui.controls.append(button("New", "Reset", reset));
    reset();
    loop(draw);
  }

  function laneGame(root, game, config) {
    var ui = layout(root, game);
    var scoreStat = ui.stat("Score", "0");
    var bestStat = ui.stat("Best", storageGet(game.id + "-best", 0));
    var kit = makeCanvas(ui.stage, 540, 640, true);
    var ctx = kit.ctx;
    var lane = 1;
    var obstacles = [];
    var timer = 0;
    var score = 0;
    var best = storageGet(game.id + "-best", 0);
    var dead = false;

    function reset() {
      lane = 1;
      obstacles = [];
      timer = 0;
      score = 0;
      dead = false;
    }

    function shift(delta) {
      if (dead) return;
      lane = clamp(lane + delta, 0, 2);
    }

    function update(dt) {
      if (dead) return;
      score += dt * 10;
      timer -= dt;
      if (timer <= 0) {
        timer = Math.max(.34, .82 - score * .003);
        obstacles.push({ lane: rand(3), y: -60, h: 54, speed: 210 + score * 2 });
      }
      obstacles.forEach(function (item) { item.y += item.speed * dt; });
      obstacles.forEach(function (item) {
        if (item.lane === lane && item.y + item.h > 520 && item.y < 584) {
          dead = true;
          best = Math.max(best, Math.floor(score));
          storageSet(game.id + "-best", best);
        }
      });
      obstacles = obstacles.filter(function (item) { return item.y < 700; });
      scoreStat.set(Math.floor(score));
      bestStat.set(best);
    }

    function draw() {
      drawBackdrop(ctx, 540, 640);
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = i === lane ? "rgba(117,224,255,.22)" : "rgba(255,255,255,.05)";
        ctx.fillRect(35 + i * 155, 0, 120, 640);
      }
      ctx.fillStyle = "#ff715b";
      obstacles.forEach(function (item) { ctx.fillRect(52 + item.lane * 155, item.y, 86, item.h); });
      ctx.fillStyle = config.color || "#f7c75b";
      ctx.fillRect(68 + lane * 155, 520, 56, 60);
      if (dead) overlay(ctx, 540, 640, "Crashed", "Press New");
    }

    ui.controls.append(button("New", "Reset", reset), button("Left", "Left", function () { shift(-1); }), button("Right", "Right", function () { shift(1); }));
    keyControls(function (event) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); shift(-1); }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); shift(1); }
    });
    reset();
    loop(function (dt) {
      update(dt);
      draw();
    });
  }

  function embeddedWebGame(root, game) {
    var ui = layout(root, game);
    var playerStat = ui.stat("Page", "Loading");
    var buildStat = ui.stat("Build", game.buildLabel || game.releaseAssetName || "Web");
    var frameUrl = game.embedUrl || game.playUrl || game.externalUrl;
    ui.stage.classList.add("embed-stage");

    var shell = el("div", "embed-shell");
    var frame = el("iframe", "game-embed");
    frame.title = game.title + " player";
    frame.src = frameUrl;
    frame.allow = "fullscreen; pointer-lock; clipboard-read; clipboard-write; autoplay; gamepad";
    frame.referrerPolicy = "no-referrer";
    frame.setAttribute("allowfullscreen", "true");
    if (game.frameSandbox) {
      frame.setAttribute("sandbox", game.frameSandbox);
    }
    frame.addEventListener("load", function () {
      playerStat.set("On screen");
    });
    shell.appendChild(frame);
    ui.stage.appendChild(shell);

    ui.controls.append(
      button(game.launchLabel || "Open Full Player", "Open the player in a new tab", function () {
        window.open(frameUrl, "_blank", "noopener");
      }),
      button("Reload Player", "Reload the embedded player", function () {
        frame.src = frameUrl;
      })
    );
    ui.help.textContent = game.playerNote || "";
    buildStat.set(game.buildLabel || game.releaseAssetName || "Web");
  }

  function websiteLauncher(root, game) {
    var ui = layout(root, game);
    var frameUrl = game.embedUrl || game.externalUrl || game.playUrl;
    var pageStat = ui.stat(game.openMode === "download" ? "Download" : "Page", "Ready");

    if (game.openMode === "download") {
      var panel = el("div", "site-launcher");
      var title = el("strong", "", game.title);
      var url = el("input", "access-url");
      url.readOnly = true;
      url.value = game.downloadUrl || game.externalUrl || "";
      var open = button(game.downloadLabel || game.launchLabel || "Open", "Open download page", function () {
        if (game.downloadUrl || game.externalUrl) {
          pageStat.set("Opened");
          window.open(game.downloadUrl || game.externalUrl, "_blank", "noopener");
        }
      });
      panel.append(title, url, open);
      ui.stage.appendChild(panel);
      return;
    }

    ui.stage.classList.add("embed-stage");
    var shell = el("div", "embed-shell website-shell");
    var frame = el("iframe", "game-embed");
    var fallback = el("div", "embed-fallback");
    fallback.append(
      el("strong", "", game.title),
      el("span", "", "If the page stays blank, use the open button in the side panel.")
    );
    frame.title = game.title + " page";
    frame.src = frameUrl;
    frame.allow = "fullscreen; autoplay; clipboard-read; clipboard-write; encrypted-media; picture-in-picture";
    frame.referrerPolicy = "no-referrer";
    frame.setAttribute("allowfullscreen", "true");
    frame.addEventListener("load", function () {
      shell.classList.add("embed-loaded");
      pageStat.set("On screen");
    });
    shell.append(frame, fallback);
    ui.stage.appendChild(shell);
    ui.controls.append(
      button(game.launchLabel || "Open Full Site", "Open in a new tab", function () {
        if (frameUrl) window.open(frameUrl, "_blank", "noopener");
      }),
      button("Reload Page", "Reload the embedded page", function () {
        frame.src = frameUrl;
        pageStat.set("Reloaded");
      })
    );
  }

  var quickConfigs = {
    "buckshot-table": { mode: "chance", prompt: "Count the blanks, scan once, then survive the roulette table." },
    "shell-shuffle": { mode: "chance", prompt: "Track the shell and press your luck." },
    "vault-roulette": { mode: "chance", prompt: "Open vault slots before the alarm bites." },
    "neon-duel": { mode: "chance", prompt: "Choose the next charge and outlast the duel." },
    "dice-duel": { mode: "chance", prompt: "Roll risk, bank points, avoid the hot draw." },
    "card-shark": { mode: "chance", prompt: "Call the odds and build the streak." },
    "laser-maze": { mode: "grid" },
    "ghost-escape": { mode: "grid" },
    "dungeon-doors": { mode: "grid" },
    "maze-keys": { mode: "grid" },
    "drift-racer": { mode: "lane", color: "#ff715b" },
    "orbit-jumper": { mode: "lane", color: "#75e0ff" },
    "meteor-lanes": { mode: "lane", color: "#75e0ff" },
    "bubble-pop": { mode: "target", prompt: "Pop the bubble", color: "#75e0ff" },
    "color-pop": { mode: "target", prompt: "Pop the color", color: "#ff6b9a" },
    "speed-clicker": { mode: "target", prompt: "Hit the marker", color: "#f7c75b" },
    "rhythm-tap": { mode: "timing", prompt: "Tap inside the center beat.", hit: "Clean beat.", miss: "Missed beat." },
    "tower-stack": { mode: "timing", prompt: "Drop on the center line.", hit: "Stacked clean.", miss: "Tower wobbled." },
    "pixel-fishing": { mode: "timing", prompt: "Reel when the marker centers.", hit: "Fish caught.", miss: "It slipped away." },
    "timing-lock": { mode: "timing", prompt: "Stop on the open notch.", hit: "Unlocked.", miss: "Jammed." },
    "lucky-coins": { mode: "chance", prompt: "Flip, bank, and leave before the streak breaks." },
    "asteroid-miner": { mode: "target", prompt: "Crack the asteroid", color: "#8b96a8" },
    "sky-tiles": { mode: "target", prompt: "Hit the lit tile", color: "#ff6b9a" },
    "mini-golf": { mode: "timing", prompt: "Putt at center power.", hit: "Sunk it.", miss: "Rimmed out." },
    "bottle-flip": { mode: "timing", prompt: "Flip at the sweet spot.", hit: "Landed.", miss: "Tipped over." }
  };

  Object.keys(quickConfigs).forEach(function (id) {
    Games[id] = function (root, game) {
      var config = quickConfigs[id];
      if (config.mode === "chance") chanceGame(root, game, config);
      if (config.mode === "timing") timingGame(root, game, config);
      if (config.mode === "grid") gridGame(root, game, config);
      if (config.mode === "target") targetGame(root, game, config);
      if (config.mode === "lane") laneGame(root, game, config);
    };
  });

  ["tuff-client", "cloverpit"].forEach(function (id) {
    Games[id] = embeddedWebGame;
  });

  (window.PIXEL_PARTY_GAMES || []).forEach(function (game) {
    if (!Games[game.id] && game.externalUrl) {
      Games[game.id] = websiteLauncher;
    }
  });

  window.PixelPartyGames = Games;
}());
