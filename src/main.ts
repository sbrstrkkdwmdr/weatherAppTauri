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
import * as func from './func';
import * as generate from './generator';
import * as types from './types';

// enforce minimum aspect ratio
window.getCurrent().setMinSize(new window.PhysicalSize(960, 800))
    .then(x => {
        console.log('set min size');
    })
    ;

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

    const mapLocation:types.mapLocation = {
        latitude: curcoordinates[0],
        longitude: curcoordinates[1],
        name: `${curcoordinates[0]?.toFixed(3)}, ${curcoordinates[1]?.toFixed(3)}`
    }

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
}, 500);

async function display(data: types.weatherData | string, location: types.geoLocale | types.mapLocation) {
    if (typeof data == 'string') {
        (document.getElementById('title') as HTMLHeadingElement).innerHTML = 'There was an error trying find the weather at location NaN,NaN';
    } else {
        try {
            generate.daySummary(data, document.getElementById('contentDay') as HTMLDivElement, location);
            generate.week(data, document.getElementById('contentWeek') as HTMLDivElement);
            errmsg.innerHTML = '';
            console.log(data);
        } catch (err) {
            errmsg.innerHTML = `There was an error trying to find weather data at location ${func.formatCoords(location)}`;
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
    }
}