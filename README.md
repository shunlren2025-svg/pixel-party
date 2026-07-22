# Pixel Party

Pixel Party is a lightweight static browser arcade and site launcher built for quick Chromebook play. It uses plain HTML, CSS, and JavaScript with no build step and no external libraries.

The main menu tracks game opens in local browser storage. The highest counter becomes the #1 game and gets a 3x3 feature tile on wide screens; the rest of the top five get 2x2 tiles.

Every individual game page shows a 5-second loading screen before the game starts. The loading image lives at `assets/images/loading-face.webp`.

## Games And Sites

- Tetris
- Snake.io
- 2048
- Doge Miner Lite
- Tuff Client MC Launcher with offline block builder
- Cloverpit
- Brick Breaker
- Space Dodger
- Flappy Pixel
- Memory Match
- Minefield
- Connect Four
- Tile Runner
- Platform Hopper
- Word Pop
- Reaction Dash
- Pong
- Buckshot Roulette
- Shell Shuffle
- Vault Roulette
- Neon Duel
- Dice Duel
- Card Shark
- Laser Maze
- Ghost Escape
- Drift Racer
- Bubble Pop
- Rhythm Tap
- Tower Stack
- Pixel Fishing
- Asteroid Miner
- Orbit Jumper
- Sky Tiles
- Mini Golf
- Bottle Flip
- Dungeon Doors
- Speed Clicker
- Meteor Lanes
- Timing Lock
- Lucky Coins
- Maze Keys
- Color Pop
- Soundux download launcher
- YouTube launcher
- Spotify launcher
- Twitch launcher
- Discord launcher
- Wikipedia launcher
- GitHub launcher
- Scratch launcher
- Internet Archive launcher
- Khan Academy launcher
- Coolmath Games launcher

## Publishing

The site is ready for GitHub Pages as static files. Publish the contents of this folder with `index.html` at the site root so the `games/` and `assets/` paths stay intact.

Each game page shows its URL, a download link, a source link, and a real-image search link underneath the game surface. Most downloads are the individual HTML page; keep the `assets/` folder with it if you want the downloaded page to run locally.

The Tuff Client page embeds the TuffNetwork `1.1UT15` Offline WASM release asset from GitHub: `vendor/tuff-client/Tuff_Client_Offline_WASM.html`. The Cloverpit page embeds `https://a4-math.github.io/games/cloverpit.html`. Game pages keep URL, download/copy, source, image, and fullscreen controls underneath the game surface.

The home page includes settings for compact cards, remote image hiding, reduced motion, loading-screen skipping, and play-count resets.

Games that have a known open-source or official project expose that GitHub/source page. Doge Miner, Snake.io, Buckshot Roulette, Soundux, and Tuff Client use the requested GitHub links. Pixel Party-original microgames now show searched GitHub/code references while the lightweight playable code still lives locally in `assets/js/games.js`. Website entries try to load on screen inside their own Pixel Party pages, but some third-party sites may block embedded viewing and still need the full-site button. The game hub uses external searched thumbnails or official website icons for card images, with generated SVG fallbacks if remote images fail to load.

The Buckshot-style games are original lightweight chance games, not downloaded commercial game files. This keeps the project static, safer to host, and easier to load.
