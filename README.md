# weatherAppTauri

a simple weather app developed using Vite and Tauri

[![typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://github.com/microsoft/TypeScript)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
[![open-meteo](https://img.shields.io/badge/openmeteo-FF8800?style=for-the-badge&logoColor=white)](https://open-meteo.com/)
[![OpenLayers](https://img.shields.io/badge/OpenLayers-1F6B75?style=for-the-badge&logo=openlayers&logoColor=white)](https://openlayers.org/)
</br>

[![license](https://img.shields.io/github/license/sbrstrkkdwmdr/weatherAppTauri?label=license)](https://github.com/sbrstrkkdwmdr/weatherAppTauri/blob/master/LICENSE)
[![lastcommit](https://img.shields.io/github/last-commit/sbrstrkkdwmdr/weatherAppTauri)](https://github.com/sbrstrkkdwmdr/weatherAppTauri)
[![changelog](https://img.shields.io/badge/Changelog-E05735)](https://github.com/sbrstrkkdwmdr/weatherAppTauri/blob/master/changelog.md)</br>

## Running the app

### Release

Download the latest release from [the releases page](https://github.com/sbrstrkkdwmdr/weatherAppTauri/releases)</br>
Run the `.exe` file</br>
There may be a Microsoft Defender warning pop-up

### From source

Run `npm i` to install all dependencies </br>
Run `npm run dev`</br>
*There may be inconsistencies between running it this way compared to the app itself* </br>

### Building/compiling

Run `npm run tb` </br>
The `.exe` should be in `./src-tauri/target/release/<appname>.exe`

### Building/compiling debug version

*This version has console and element inspector enabled* </br>
Run `npm run tbd` </br>
The `.exe` should be in `./src-tauri/target/debug/<appname>.exe` </br>

## credits

| Source | Usage |
| --- | --- |
| [Open-Meteo](https://open-meteo.com/) | Weather API |
| [OpenLayers](https://openlayers.org/) | Map API |
| [pixabay](https://pixabay.com/) | Background images |