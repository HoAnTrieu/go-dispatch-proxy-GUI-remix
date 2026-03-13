# Go Dispatch Proxy GUI (Remix)

A modern Windows GUI for [go-dispatch-proxy](https://github.com/extremecoders-re/go-dispatch-proxy) built with Electron.

## Features

- Network interface selection with ratio control
- SSH Tunnel mode support
- Proxy start/stop controls
- Minimize to system tray
- Auto-start on launch
- Customizable listen host and port

## Requirements

- Node.js
- go-dispatch-proxy.exe binary (included)

## Installation

```bash
# Clone the repository
git clone https://github.com/HoAnTrieu/go-dispatch-proxy-GUI-remix
cd go-dispatch-proxy-GUI-remix

# Install dependencies
npm install

# Run the app
npm start
```

## Build Standalone .exe

```bash
# Install electron-packager if needed
npm install electron-packager -g

# Build for Windows
npx electron-packager . go-dispatch-proxy-gui --platform=win32 --arch=x64 --icon=icons/win/app.ico --out=dist
```

## Usage

1. Select **Direct Connection** mode to use network interfaces, or **SSH Tunnel** mode for SSH tunnels
2. Choose network interfaces and set ratio (1-10)
3. Configure listen host/port (default: 127.0.0.1:8081)
4. Click **Start Proxy**

## License

MIT
