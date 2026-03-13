# Go Dispatch Proxy GUI (Remix)

A modern Windows GUI for [go-dispatch-proxy](https://github.com/extremecoders-re/go-dispatch-proxy) built with Electron.

## Important: Download go-dispatch-proxy

Before running, you must download the go-dispatch-proxy binary:

1. Download from: https://github.com/extremecoders-re/go-dispatch-proxy/releases
2. Extract `go-dispatch-proxy.exe` 
3. Place it in the **root folder** of this project

## Features

- Network interface selection with ratio control
- SSH Tunnel mode support
- Proxy start/stop controls
- Minimize to system tray
- Auto-start on launch
- Customizable listen host and port

## What is go-dispatch-proxy?

Go Dispatch Proxy creates a **SOCKS5 proxy** that dynamically distributes traffic across multiple network interfaces based on configurable ratios. This is useful for:
- Split tunneling
- Bandwidth aggregation
- Load balancing across connections

## How to Use

Since this is a **SOCKS5 proxy**, you need to configure your application to use it:

### Browser Settings
- Firefox: Settings → Network Settings → Manual proxy configuration → SOCKS5 Host: 127.0.0.1, Port: 8081
- System-wide: Windows Settings → Network & Internet → Proxy → Manual proxy setup

### Applications
- Telegram
- uTorrent
- SSH clients
- Any app supporting SOCKS5 proxy

## Installation

```bash
# Clone the repository
git clone https://github.com/HoAnTrieu/go-dispatch-proxy-GUI-remix
cd go-dispatch-proxy-GUI-remix

# Download go-dispatch-proxy.exe and place in root folder

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

# Don't forget to copy go-dispatch-proxy.exe to the dist folder
```

## Usage

1. Download and place `go-dispatch-proxy.exe` in the project root
2. Select **Direct Connection** mode to use network interfaces, or **SSH Tunnel** mode for SSH tunnels
3. Choose network interfaces and set ratio (1-10)
4. Configure listen host/port (default: 127.0.0.1:8081)
5. Click **Start Proxy**
6. Configure your application to use SOCKS5 proxy at 127.0.0.1:8081

## Credits

- Original GUI: [Steeve Lefort](https://github.com/steevelefort/go-dispatch-proxy-gui)
- go-dispatch-proxy: [extremecoders-re](https://github.com/extremecoders-re/go-dispatch-proxy)

## License

MIT
