# Phoenix configuration

This is my personal [Phoenix](https://github.com/kasper/phoenix) configuration, written in TypeScript. I also created [typings](https://github.com/mafredri/phoenix-typings) for it, feel free to use them.

## Key bindings

The definition of `hyper` and `hyperShift` can be found in [src/config.ts](src/config.ts).

### Basic bindings

* `hyper + Left` (Left portion of screen, cycles through 1/2, 1/3, 1/4 on repeat)
* `hyper + Right` (Right portion of screen, cycles through 1/2, 1/3, 1/4 on repeat)
* `hyper + Up` (Top half of screen height, keeps current width)
* `hyper + Down` (Bottom half of screen height, keeps current width)
* `hyper + Return` (Toggle maximize, remembers unmaximized position)
* `hyper + Tab` (Jump to next screen whilst keeping relative size and placement)
* `hyper + Delete` (Minimize focused window)
* `hyperShift + Left` (Move window to left edge of screen)
* `hyperShift + Right` (Move window to right edge of screen)
* `hyperShift + Up` (Move window to top edge of screen)
* `hyperShift + Down` (Move window to bottom edge of screen)
* `hyperShift + Return` (Toggle window fullscreen, i.e. separate space)
* `hyperShift + Space` (Move window to center of screen)
* `hyperShift + Tab` (Jump to previous screen whilst keeping relative size and placement)

Use combos of the key bindings to further place the windows:

* `hyper + Left` + `hyper + Down` (Bottom left corner of screen)
* `hyper + Enter` + `hyper + Up` (Top half of screen, full width)

I've optimized the key bindings for my common use-case, showing two windows on one screen and moving windows between screens.

### Misc bindings

* `hyper + a` (Toggle mouse action mode, then hold hyper + move mouse to move window)
* `hyper + c` (Start coffee timer, defaults to 8 minutes)
* `hyper + p` (Show window information in a modal)
* `hyperShift + a` (Toggle mouse action mode, then hold hyperShift + move mouse to resize window)
* `§` (Show or hide the last used Terminal window)
* `Cmd + §` (Cycle between Terminal windows)
* `Cmd + Escape` (Cycle between windows of current application, including minimized and windows on a different screen)
* `Cmd + Shift + Escape` (Same as `Cmd + Escape` except in reverse order)
* `Cmd + h` (Hides the focused app or all visible apps if held down)

## Misc features

* Support disabling / re-enabling all current keybindings via [src/key.ts](src/key.ts) (used by scanner)

## Building

```
git clone https://github.com/mafredri/phoenix-config.git
cd phoenix-config
pnpm install
pnpm run build
```

This produces two files that can be used as Phoenix configuration:

* `out/phoenix.js` - minified production build
* `out/phoenix.debug.js` - unminified with inline source maps

For development, run `pnpm start` to watch for changes and rebuild automatically.

Run `pnpm typecheck` to type-check the code.

## Debugging

In a terminal, run:

```console
$ log stream --process Phoenix
```

Anything logged via logger (`import log from './logger';`) will show up as human friendly output in the terminal. `Phoenix.log` can also be used, but it only supports strings, much of the heavy lifting is already done by logger to create a similar experience to `console.log` in the browser.

You can also read about [Attaching to Web Inspector for Debugging](https://github.com/kasper/phoenix/wiki/Attaching-to-Web-Inspector-for-Debugging) in the Phoenix wiki. This gives access to true `console.log` and ability to use `debugger` statements in your code.
