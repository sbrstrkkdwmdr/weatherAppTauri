import moment from 'moment';
import * as func from './func';
import * as generate from './generator';
import * as types from './types';

//search bar results handler
document.getElementById('searchButton')
    ?.addEventListener('click', async () => {
        console.log('search button click');
        generateResults();
    });

document.getElementById('searchBar')?.addEventListener('keyup', async (e) => {
    if (e.code == 'Enter') {
        console.log('search via enter');
        generateResults();
    }
});

async function generateResults() {
    const searchBar = document.getElementById('searchBar') as HTMLInputElement;
    const locationData = await func.getLocation(searchBar.value);
    const searchResults = document.getElementById('searchSuggest') as HTMLDivElement;
    searchResults.innerHTML = '';
    for (const location of locationData.results) {
        const elem = document.createElement('div');
        elem.innerHTML = func.genSearchName(location);
        elem.className = 'result';
        elem.addEventListener('click', async () => {
            console.log(location.name, location.id);
            let data = await func.getWeather(location.latitude, location.longitude, location);
            display(data, location);
        });
        searchResults.appendChild(elem);
    }
};


// only show search results when focused on the search tab
const searchSuggest = document.getElementById("searchSuggest") as HTMLElement;
const searchChildren = document.getElementsByClassName("searchChildren");
searchSuggest.style.height = '0px';

for (let child of searchChildren) {
    child.addEventListener('focus', () => {
        searchSuggest.style.height = 'max-content'; // show
    });

    child.addEventListener('blur', () => {
        searchSuggest.style.height = '0px'; // dont show
    });
}

// updating clock
setInterval(() => {
    const title = document.getElementById('title') as HTMLHeadingElement;
    const rn = moment();
    title.innerHTML = rn.format('[It is currently] dddd, YYYY-MM-DD, HH:mm:ss');
}, 500);

async function display(data: types.weatherData | string, location:types.geoLocale) {
    if (typeof data == 'string') {
        (document.getElementById('title') as HTMLHeadingElement).innerHTML = 'There was an error trying find the weather at location NaN,NaN';
    } else {
        generate.daySummary(data, document.getElementById('contentDay') as HTMLDivElement, location);
        generate.week(data, document.getElementById('contentWeek') as HTMLDivElement);
    }
}