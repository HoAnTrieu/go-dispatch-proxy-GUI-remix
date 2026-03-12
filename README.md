# Go Dispatch Proxy GUI - Build Instructions

A simple GUI for go-dispatch-proxy built with Electron.

**Don't forget to download and copy "go-dispatch-proxy.exe" in the project root directory.**

## Credits

- Original proxy: https://github.com/extremecoders-re/go-dispatch-proxy
- Original GUI: https://github.com/steevelefort/go-dispatch-proxy-gui

## Prerequisites

- Node.js installed (https://nodejs.org/)
- npm installed (comes with Node.js)

## To Run the App

```bash
cd go-dispatch-proxy-GUI-remix
npm install
npm start
```

## To Package as .exe

1. Install electron-packager:
```bash
npm install electron-packager --save-dev
```

2. Package the app:
```bash
npx electron-packager . go-dispatch-proxy-gui --platform=win32 --arch=x64
```

3. Copy go-dispatch-proxy.exe to the output folder:
```bash
copy go-dispatch-proxy.exe go-dispatch-proxy-gui-win32-x64\
```

4. Run the packaged exe:
```
go-dispatch-proxy-gui-win32-x64\go-dispatch-proxy-gui.exe
```

## Usage

1. Add your network interfaces (IP addresses) with ratio weights
2. Set listen port (default 9000)
3. Click "Start Proxy"
4. Configure your apps to use SOCKS5 proxy at 127.0.0.1:9000

## Files Included

- `main.js` - Electron main process
- `preload.js` - Preload script
- `renderer.js` - UI logic
- `index.html` - Main HTML
- `style.css` - Styles
- `go-dispatch-proxy.exe` - The proxy binary (download from https://github.com/extremecoders-re/go-dispatch-proxy)
- `node_modules/` - Dependencies
