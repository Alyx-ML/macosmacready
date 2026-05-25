# Mac OS 9 Local Runtime Assets

Place the licensed Mac OS 9 runtime files in this folder:

- `runtime.js`
- `sheepshaver.wasm`
- `MacOS9.rom`
- `MacOS9.dsk`

`runtime.js` must export `bootMacOS9(options)` or set `window.MacOS9Runtime.boot`.

The boot function receives:

```js
{
  canvas,
  assets: {
    runtime: "./assets/runtime.js",
    wasm: "./assets/sheepshaver.wasm",
    rom: "./assets/MacOS9.rom",
    disk: "./assets/MacOS9.dsk"
  },
  onStatus
}
```
