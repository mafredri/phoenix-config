# Phoenix configuration

This is my personal [Phoenix](kasper/phoenix) configuration, written in TypeScript. I also created [typings](https://github.com/mafredri/phoenix-typings) for it, feel free to use them.

## Basic key bindings

* `hyper + Left` (Left half of screen)
* `hyper + Right` (Right half of screen)
* `hyper + Up` (Top half of screen height, keeps current width)
* `hyper + Down` (Bottom half of screen height, keeps current width)
* `hyper + Enter` (Toggle maximize, remembers unmaximized position)
* `hyper + Tab` (Jump to next screen whilst keeping relative size and placement)

Use combos of the key bindings to further place the windows:

* `hyper + Left` + `hyper + Down` (Bottom left corner of screen)
* `hyper + Enter` + `hyper + Up` (Top half of screen, full width)

I've optimized the key bindings for my common use-case, showing two windows on one screen and moving windows between screens.

## Building

```
npm install -g typescript typings

git clone https://github.com/mafredri/phoenix-config.git
cd phoenix-config
npm install && typings install

tsc
```

The TypeScript compiler (`tsc`) will produce `out/phoenix.js` that can be used as Phoenix configuration. 

## License

The MIT License.
