https://github.com/dfvips/um-react-electron 的镜像

# Unlock Music 音乐解锁 Electron 应用程序

- 在Electron应用程序中解锁加密的音乐文件。 Unlock encrypted music file in the Electron App.
- 无需依赖浏览器，开箱即可使用。

## 下载地址

https://github.com/CarlGao4/um-react-electron/releases

## 自行构建Electron应用程序

- 环境要求
  - Linux、MacOs
  - python3、nodejs、npm

- 开发环境
   ```sh
   git submodule update --init
   cd um-react
   pnpm install --frozen-lockfile
   cd ../ && npm install
   npm run start / npm run dev
   ```
- 打包
  ```sh
  npm run build
  npm run build:win
  npm run build:mac
  npm run build:linux
  ```
- 前端静态页面构建后的产物可以在 `src/renderer` 目录找到。
- Electron构建后的产物可以在 `release` 目录找到。
