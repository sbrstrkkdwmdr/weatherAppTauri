import { fs, path } from "@tauri-apps/api";
import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/api/fs';
import * as window from "@tauri-apps/api/window";
import moment from 'moment';
import Feature from 'ol/Feature';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { useGeographic } from 'ol/proj.js';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, RegularShape, Stroke, Style } from 'ol/style.js';
import * as testData from './data';
import * as func from './func';
import * as generate from './generator';
import * as types from './types';


// enforce minimum aspect ratio
// try catch block to let vite work as intended
try {
    window.getCurrent().setMinSize(new window.PhysicalSize(960, 800))
        .then(x => {
            console.log('set min size');
        });
    window.appWindow.maximize();
    setMaximiseButtonImg();
    const minimiseButton = document
        .getElementById('titlebarMinimize');
    minimiseButton
        .addEventListener('click', () => window.appWindow.minimize());
    const maximiseButton = document
        .getElementById('titlebarMaximize');
    maximiseButton
        .addEventListener('click', () => {
            window.appWindow.toggleMaximize();
            // setMaximiseButtonImg();
        });
    const closeButton =
        document
            .getElementById('titlebarClose');
    closeButton
        .addEventListener('click', () => window.appWindow.close());

    async function setMaximiseButtonImg() {
        (document.getElementById('maximiseImg') as HTMLImageElement).src =
            await window.appWindow.isMaximized() ?
                './titlebar/maximise_in.png' :
                './titlebar/maximise_out.png';
    }
    window.getCurrent().onResized(() => {
        setMaximiseButtonImg();
    });
    (async () => {
        const appDataPath = await path.appDataDir();
        console.log('appdata exists: ' + await fs.exists(appDataPath));
        console.log(appDataPath);
        if (!(await fs.exists(appDataPath))) {
            console.log('Creating dir: ' + appDataPath);
            fs.createDir(appDataPath, { recursive: true });
        }
    })();
} catch (err) { }

let settings: types.settings;

//search bar results handler
document.getElementById('searchButton')!
    .addEventListener('click', async () => {
        console.log('search button click');
        generateResults();
    });

document.getElementById('searchBar')!.addEventListener('keyup', async (e) => {
    if (e.code == 'Enter') {
        console.log('search via enter');
        generateResults();
    }
});

const errmsg = document.getElementById('errmsg') as HTMLDivElement;

async function generateResults() {
    const searchBar = document.getElementById('searchBar') as HTMLInputElement;
    const searchResults = document.getElementById('searchSuggest') as HTMLDivElement;
    errmsg.innerHTML = 'Loading results...';
    const locationData = await func.getLocation(encodeURIComponent(searchBar.value));
    if (locationData?.results?.length > 0) {
        errmsg.innerHTML = '';
        searchResults.innerHTML = '';
        for (const location of locationData.results) {
            console.log('generating results');
            const elem = document.createElement('div');
            elem.innerHTML = func.genSearchName(location);
            elem.className = 'result';
            elem.addEventListener('click', async () => {
                console.log('Getting weather for: ' + location.name + ' ' + location.id);
                errmsg.innerHTML = 'Loading data...';
                let data = await func.getWeather(location.latitude, location.longitude, location);
                if (typeof data == 'string') {
                    errmsg.innerHTML = 'Failed to load weather data for ' + location.name + ' ' + location.id + ' (' + data + ')';
                } else {
                    display(data, location);
                    errmsg.innerHTML = '';
                }
            });
            searchResults.appendChild(elem);
        }
    } else {
        errmsg.innerHTML = `No results found for "${searchBar.value}"`;
    }
};


// only show search results when focused on the search tab
const searchSuggest = document.getElementById("searchSuggest") as HTMLElement;
const searchChildren = document.getElementsByClassName("searchChildren");

const searchQuery = document.getElementById('searchQuery');

const waitTime = 250; // click event ignored if results disappear too quickly

for (let child of searchChildren) {
    child.addEventListener('focus', () => {
        setTimeout(() => {
            searchSuggest.style.height = 'max-content'; // show
        }, waitTime);
    });

    child.addEventListener('blur', () => {
        setTimeout(() => {
            searchSuggest.style.height = '0px'; // dont show
        }, waitTime);
    });
}

// map functionality
useGeographic();

const map = new Map({
    layers: [
        new TileLayer({
            source: new OSM(),
        }),
    ],
    target: 'map',
    view: new View({
        center: [0, 0],
        zoom: 2,
    }),
});

let vectorSource = new VectorSource({

});

let vectorLayer = new VectorLayer({
    source: vectorSource,
    declutter: true,
    map,
});

map.on('click', async (e) => {
    const curcoordinates = e.coordinate.reverse();
    //lon lat
    console.log(curcoordinates);
    //TO DO --- click functionality

    const mapLocation: types.mapLocation = {
        latitude: curcoordinates[0],
        longitude: curcoordinates[1],
        name: `${curcoordinates[0]?.toFixed(3)}, ${curcoordinates[1]?.toFixed(3)}`
    };

    let data = await func.getWeather(curcoordinates[0], curcoordinates[1], mapLocation);
    if (typeof data == 'string') {
        errmsg.innerHTML = 'Failed to load weather data for ' + curcoordinates[0] + ' ' + curcoordinates[1];
    } else {
        display(data, mapLocation);
        errmsg.innerHTML = '';
    }

});

// updating clock
setInterval(() => {
    const title = document.getElementById('title') as HTMLHeadingElement;
    const rn = moment();
    title.innerHTML = rn.format('[It is currently] dddd, YYYY-MM-DD, HH:mm:ss');
}, testData.clockDelay);

async function display(data: types.weatherData | string, location: types.geoLocale | types.mapLocation) {
    if (typeof data == 'string') {
        (document.getElementById('title') as HTMLHeadingElement).innerHTML = 'There was an error trying find the weather at location NaN,NaN';
    } else {
        try {
            const rn = moment().utcOffset(Math.floor(data.utc_offset_seconds / 60));

            const dayDiv = document.getElementById('contentDay') as HTMLDivElement;
            const carouselDiv = document.getElementById('contentCarousel') as HTMLDivElement;;
            const tabDiv = document.getElementById('tabContent') as HTMLDivElement;

            generate.locationSummary(data, dayDiv, location, rn, tabDiv);
            generate.dayCarousel(data, carouselDiv, rn, location, dayDiv, tabDiv);
            generate.tabs(data, tabDiv, rn, dayDiv, location);
            errmsg.innerHTML = '';
            console.log(data);
        } catch (err) {
            errmsg.innerHTML = `There was an error trying to find weather data at location ${func.formatCoords(location.latitude, location.longitude)}`;
        }
        vectorSource.clear();
        const point: Feature = new Feature({
            geometry: new Point([location.longitude, location.latitude]),
            name: location.name,
            style: new Circle({
                fill: new Fill({ color: [163, 94, 212, 50] }),
                stroke: new Stroke({ color: 'white', width: 1 }),
                radius: 7.5,
            }),
        });
        vectorSource.addFeature(point);
        map.getView().animate({
            duration: 2500,
            center: [location.longitude, location.latitude],
            rotation: 0,
            zoom: 4
        });
        setTimeout(() => {
            map.getView().animate({
                duration: 1250,
                center: [location.longitude, location.latitude],
                rotation: 0,
                zoom: 7
            });
        }, 2500);

        const saveLocationButton = document.getElementById('settingsSaveLocation');
        saveLocationButton.addEventListener('click', async () => {
            console.log('saving location');
            settings.defaultLocation = location;
            await storeSettings(settings);
        });
    }
}

(() => {
    console.log('aaa');
    // const chartContainer = document.getElementById('chartContainer');
    const chartMain = document.getElementById('chartPopup');
    const mainContent = document.getElementById('mainContent');
    // chartContainer.style.transform = "translateY(-3000px)";
    chartMain.style.transform = "translateY(-100vh)";
    // chartMain.style.display = 'none';
    setTimeout(async () => {
        mainContent.addEventListener('click', () => {
            if (chartMain.style.transform == "translateY(0px)") {
                chartMain.style.transform = "translateY(-100vh)";
                setTimeout(() => {
                    chartMain.innerHTML = '';
                }, 500);
            }
        });
        settings = await fetchSettings();
        console.log('checking if default location');
        if (settings.defaultLocation) {
            const location = settings.defaultLocation;
            console.log('Getting weather for: ' + location.name);
            errmsg.innerHTML = 'Loading data...';
            let data = await func.getWeather(location.latitude, location.longitude, location);
            if (typeof data == 'string') {
                errmsg.innerHTML = 'Failed to load weather data for ' + location.name + ' (' + data + ')';
            } else {
                display(data, location);
                errmsg.innerHTML = '';
            }
        } else {
            console.log('no default location found');
        }
        const clearLocationButton = document.getElementById('settingsClearLocation');
        clearLocationButton.addEventListener('click', e => {
            settings.defaultLocation = null;
            storeSettings(settings);
        });
    }, 1000);
})();

async function fetchSettings() {
    let data: types.settings;
    const filePath = await path.appDataDir();
    if (await exists(filePath + 'appSettings.json')) {
        const ctn = await readTextFile(filePath + 'appSettings.json');
        console.log("found settings");
        console.log(ctn);
        data = JSON.parse(ctn);
    } else {
        console.log('settings do not exist - generating default');
        data = {
            defaultLocation: null
        };
        await storeSettings(data);
    }
    return data;
}

async function storeSettings(data: types.settings) {
    const filePath = await path.appDataDir();
    console.log('saving data...');
    console.log(filePath + 'appSettings.json');
    await writeTextFile(filePath + 'appSettings.json', JSON.stringify(data, null, 2));
}