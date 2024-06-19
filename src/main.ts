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
        elem.innerHTML = genSearchName(location);
        elem.className = 'result';
        elem.addEventListener('click', async () => {
            console.log(location.name, location.id);
            let data = await func.getWeather(location.latitude, location.longitude, location);
            display(data);
        });
        searchResults.appendChild(elem);
    }
};

/**
 * format name for search results
 */
function genSearchName(data: types.geoLocale): string {
    let base = `${data.name}, ${data.country}`;
    if (data?.admin1 || data?.admin2 || data?.admin3 || data?.admin4) {
        const extras = [];
        data?.admin4 ? extras.push(data.admin4) : '';
        data?.admin3 ? extras.push(data.admin3) : '';
        data?.admin2 ? extras.push(data.admin2) : '';
        data?.admin1 ? extras.push(data.admin1) : '';
        base += ' (' + extras.join(', ') + ')';
    }
    return base;
}

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

async function display(data: types.weatherData | string) {
    if (typeof data == 'string') {
        (document.getElementById('title') as HTMLHeadingElement).innerHTML = 'There was an error trying find the weather at location NaN,NaN';
    } else {
        generate.week(data, document.getElementById('contentWeek') as HTMLDivElement);
    }
}