# Pixel Party

Pixel Party is a lightweight static browser arcade built for quick Chromebook play. It uses plain HTML, CSS, and JavaScript with no build step and no external libraries.

The main menu tracks game opens in local browser storage. The highest counter becomes the #1 game and gets a 3x3 feature tile on wide screens; the rest of the top five get 2x2 tiles.

## Games

- Tetris
- Snake.io
- 2048
- Doge Miner Lite
- Tuff Client MC Launcher with offline block builder
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

## Publishing

The site is ready for GitHub Pages as static files. Publish the contents of this folder with `index.html` at the site root so the `games/` and `assets/` paths stay intact.

Each game page shows its current URL and a download link underneath the game surface. The download is the individual HTML page; keep the `assets/` folder with it if you want the downloaded page to run locally.

The Tuff Client page intentionally does not bundle third-party Minecraft/Eaglercraft code. Paste the launcher URL into that page or update it in `assets/js/games.js`.
