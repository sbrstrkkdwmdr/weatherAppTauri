import * as fs from '@tauri-apps/api/fs';
import * as tpath from '@tauri-apps/api/path';
import * as chartjs from 'chart.js';
import moment from 'moment';
import * as testData from './data';
import * as func from './func';
import * as types from './types';

chartjs.Chart.register(...chartjs.registerables);
let chart: chartjs.Chart;

export function daySummary(data: types.weatherData, main: HTMLElement, location: types.geoLocale | types.mapLocation, dataTime: moment.Moment, tabMain: HTMLElement) {
    const rn = moment().utcOffset(Math.floor(data.utc_offset_seconds / 60));
    main.innerHTML = '';
    const today = data.current_weather!;
    const daily = data.daily!;
    const hourly = data.hourly!;

    const todayIndex = daily.time.indexOf(rn.format("YYYY-MM-DD")); //day pos
    let pos = hourly.time.indexOf(rn.format("YYYY-MM-DD[T]HH:00")); //hr pos

    //stuff that isnt the table
    const nonTable = document.createElement('div');

    const fullName =
        (location as types.geoLocale)?.country
            ?
            func.genTitleName(location as types.geoLocale)
            : [location.name, ''];
    const fullTitleDiv = document.createElement('div');
    fullTitleDiv.id = 'contentHeading';
    const placeTitle = document.createElement('h2');
    placeTitle.innerHTML = 'Weather for ' + fullName[0];
    fullTitleDiv.appendChild(placeTitle);

    const subTitle = document.createElement('p');
    subTitle.innerHTML = fullName[1] ?? '';
    fullTitleDiv.appendChild(subTitle);

    const coordParagraph = document.createElement('p');
    coordParagraph.innerHTML = func.formatCoords(location);
    fullTitleDiv.appendChild(coordParagraph);

    nonTable.appendChild(fullTitleDiv);

    const smolTxt = document.createElement('p');
    smolTxt.innerHTML = rn.format('[Last updated] YYYY-MM-DD, HH:mm:ss') + '</br>';
    smolTxt.className = 'smol';
    nonTable.appendChild(smolTxt);

    const dayTitle = document.createElement('h3');
    dayTitle.id = 'dayTitle';
    dayTitle.innerHTML = `Local time is ${moment().utcOffset(Math.floor(data.utc_offset_seconds / 60))
        .format("ddd, DD MMM YYYY HH:mm:ss Z")}</br>`;
    if (moment().utcOffset(Math.floor(data.utc_offset_seconds / 60)).format("ddd, DD MMM YYYY HH:00")
        != dataTime.format("ddd, DD MMM YYYY HH:00")
    ) {
        dayTitle.innerHTML += `Selected time is ${dataTime.format("ddd, DD MMM YYYY HH:00:00 Z")}\n`;
    }
    //live update cur time
    setInterval(async () => {
        const localTime = moment().utcOffset(Math.floor(data.utc_offset_seconds / 60))
            .format("ddd, DD MMM YYYY HH:mm:ss Z");
        dayTitle.innerHTML = `Local time is ${localTime}</br>`;
        if (moment().utcOffset(Math.floor(data.utc_offset_seconds / 60)).format("ddd, DD MMM YYYY HH:00")
            != dataTime.format("ddd, DD MMM YYYY HH:00")
        ) {
            dayTitle.innerHTML += `Selected time is ${dataTime.format("ddd, DD MMM YYYY HH:00:00") + dataTime.utcOffset(Math.floor(data.utc_offset_seconds / 60)).format(' Z')}\n`;
        }
    }, testData.clockDelay);

    nonTable.appendChild(dayTitle);

    main.appendChild(nonTable);
    dayInfo(data, nonTable, dataTime.clone());

    dayTitle.addEventListener('click', () => {
        daySummary(data, main, location, rn, tabMain);
        const items = document.getElementsByClassName('dayCarouselItem');
        for (const item of items) {
            if (item.innerHTML.includes(rn.format('YYYY-MM-DD'))) {
                item.classList.add('dayCarouselSelected');
            } else {
                item.classList.remove('dayCarouselSelected');
            }
        }
    });
}

/**
 * gets info for the current/selected day
 */
export function dayInfo(data: types.weatherData, main: HTMLElement, dataTime: moment.Moment) {
    const today = data.current_weather!;
    const daily = data.daily!;
    const hourly = data.hourly!;

    // const rn = moment().utcOffset(Math.floor(data.utc_offset_seconds / 60));
    const todayIndex = daily.time.indexOf(dataTime.format("YYYY-MM-DD"));
    const hourIndex = hourly.time.indexOf(dataTime.format('YYYY-MM-DD[T]HH') + ':00') ?? 12;
    let todayHourIndex = hourly.time.indexOf(dataTime.format("YYYY-MM-DD") + 'T12:00') ?? 12;

    if (todayHourIndex < 12) {
        todayHourIndex = 12;
    } else if (todayHourIndex > hourly.time.length - 12) {
        todayHourIndex = hourly.time.length - 12;
    }


    const summary = document.createElement('div');
    summary.id = 'summaryDiv';

    const weatherImg = document.createElement('img');
    weatherImg.src = './weatherState/' + (daily.weathercode![todayIndex] ?? today.weathercode ?? 0) + '.png';

    const bgurl = `url(./backgrounds/${func.weatherToBackground(daily.weathercode![todayIndex] ?? 0)})`;
    document.getElementById('backgroundTemp').style.backgroundImage =
        'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7) ),' + bgurl;
    setTimeout(() => {
        document.getElementById('background').style.backgroundImage =
            'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7) ),' + bgurl;
    }, 50);

    const temp = {
        cur: hourly.temperature_2m![hourIndex],
        min: daily.temperature_2m_min![todayIndex],
        max: daily.temperature_2m_max![todayIndex],
        app: {
            cur: hourly.apparent_temperature![hourIndex],
            min: daily.apparent_temperature_max![todayIndex],
            max: daily.apparent_temperature_min![todayIndex],
        }
    };
    const rain = {
        chance: daily.precipitation_probability_mean![todayIndex],
        rain: daily.rain_sum![todayIndex],
        snow: daily.snowfall_sum![todayIndex],
        showers: daily.showers_sum![todayIndex],
    };
    const wind = {
        cur: hourly.windspeed_10m![hourIndex],
        dir: func.windToDirection(hourly.wind_direction_10m![hourIndex]),
        max: daily.windspeed_10m_max![todayIndex],
        maxGust: daily.windgusts_10m_max![todayIndex],
    };

    const visibilityList = hourly.visibility.slice(todayHourIndex - 12, todayHourIndex + 11);
    const pressureList = hourly.pressure_msl.slice(todayHourIndex - 12, todayHourIndex + 11);
    const humidityList = hourly.relative_humidity_2m.slice(todayHourIndex - 12, todayHourIndex + 11);

    const thirdRowData = [
        {
            name: 'Visibility',
            min: visibilityList.sort((a, b) => a - b)[0],
            max: visibilityList.sort((a, b) => b - a)[0],
            data: visibilityList,
            units: 'm'
        },
        {
            name: 'Pressure',
            min: pressureList.sort((a, b) => a - b)[0],
            max: pressureList.sort((a, b) => b - a)[0],
            data: pressureList,
            units: 'hPa'
        },
        {
            name: 'Humidity',
            min: humidityList.sort((a, b) => a - b)[0],
            max: humidityList.sort((a, b) => b - a)[0],
            data: humidityList,
            units: '%'
        },
        {
            name: 'UV Index',
            index: daily.uv_index_max[todayIndex],
            clearSky: daily.uv_index_clear_sky_max[todayIndex],
            units: ''
        },
    ];

    // first row
    const firstRow = document.createElement('div');
    firstRow.className = 'summaryCarouselRow';
    firstRow.appendChild(weatherImg);

    //second row
    const secondRow = document.createElement('div');
    secondRow.className = 'summaryCarouselRow';

    const tempDiv = document.createElement('div');
    tempDiv.className = 'summaryCarouselItem';
    tempDiv.innerHTML = `<span class="spanTitle">Temperature</span>
Cur <span class="spanCur">${temp.cur}</span>°C
Feels like <span class="spanCur">${temp.app.cur}</span>°C
Max <span class="spanMax">${temp.max}</span>°C
Min <span class="spanMin">${temp.min}</span>°C`;
    tempDiv.addEventListener('click', () => {
        dataChartPopup(
            [{ name: 'Temperature', num: hourly.temperature_2m }],
             hourly.time, hourIndex, ['#84ff6b']);
    });
    secondRow.appendChild(tempDiv);

    const rainDiv = document.createElement('div');
    rainDiv.className = 'summaryCarouselItem';
    const rainTable = document.createElement('table');
    rainTable.id = 'rainPercent';
    rainTable.insertRow();
    for (let i = 0; i < 10; i++) {
        rainTable.rows[0].insertCell();
        if (i < Math.round(rain.chance / 10)) {
            rainTable.rows[0].cells[i].style.backgroundColor = '#00FF00';
        } else {
            rainTable.rows[0].cells[i].style.backgroundColor = '#3c3c3c';
        }
    }
    let rainTxt = `<span class="spanTitle">Rainfall</span>
Chance: <span class="spanCur">${rain.chance}%</span></br>`;
    if (rain.rain > 0) {
        rainTxt += `Rain: <span id="rainfall">${rain.rain}mm</span></br>`;
    }
    if (rain.showers > 0) {
        rainTxt += `Showers: <span id="showers">${rain.showers}mm</span></br>`;
    }
    if (rain.snow > 0) {
        rainTxt += `Snow: <span id="snowfall">${rain.snow}cm</span></br>`;
    }
    rainDiv.innerHTML = rainTxt;
    rainDiv.appendChild(rainTable);
    rainDiv.addEventListener('click', () => {
        dataChartPopup([
            { name: 'Rain', num: hourly.rain },
            { name: 'Showers', num: hourly.showers },
            { name: 'Snow', num: hourly.snowfall },
        ], hourly.time, hourIndex,
            ['#84ff6b', '#69b0f1', '#69b0f1', '#b6cef1']
        );
    });
    secondRow.appendChild(rainDiv);

    const windDiv = document.createElement('div');
    windDiv.className = 'summaryCarouselItem';

    windDiv.innerHTML = `<span class="spanTitle">Wind</span>
Cur <span class="spanCur">${wind.cur}</span>km/h ${wind.dir.emoji}${wind.dir.short}
Max winds: <span class="spanMax">${wind.max}</span>km/h
Max gusts: <span class="spanMax">${wind.maxGust}</span>km/h
`;
    windDiv.addEventListener('click', () => {
        dataChartPopup([
            { name: 'Wind speed', num: hourly.windspeed_10m },
            { name: 'Gust speed', num: hourly.windgusts_10m },
        ], hourly.time, hourIndex,
            ['#84ff6b', '#f16969',]
        );
    });
    secondRow.appendChild(windDiv);

    //third row
    const thirdRow = document.createElement('div');
    thirdRow.className = 'summaryCarouselRow';
    for (const item of thirdRowData) {
        const elem = document.createElement('div');
        elem.className = 'summaryCarouselItem';
        if (item.hasOwnProperty('clearSky')) {
            elem.innerHTML = `<span class="spanTitle">${item.name}</span>
Index <span class="spanMax">${item.index}</span>${item.units}
Clear Sky Index <span class="spanMax">${item.clearSky}</span>${item.units}`;
            elem.addEventListener('click', () => {
                dataChartPopup([
                    { name: 'UV Index', num: daily.uv_index_max },
                    { name: 'Clear Sky UV Index', num: daily.uv_index_clear_sky_max },
                ], daily.time, todayIndex,
                    ['#84ff6b',]
                );
            });
        } else {
            elem.innerHTML = `<span class="spanTitle">${item.name}</span>
Max <span class="spanMax">${item.max}</span>${item.units}
Min <span class="spanMin">${item.min}</span>${item.units}`;
            elem.addEventListener('click', () => {
                dataChartPopup([
                    { name: item.name, num: item.data },
                ], hourly.time, hourIndex,
                    ['#84ff6b',]
                );
            });
        }
        thirdRow.appendChild(elem);
    }
    summary.appendChild(firstRow);
    summary.appendChild(secondRow);
    summary.appendChild(thirdRow);
    main.appendChild(summary);
}

/**
 * adds row of days to select beneath main day info
 */
export function dayCarousel(data: types.weatherData, main: HTMLElement, dataTime: moment.Moment, location: types.geoLocale | types.mapLocation, dayMain: HTMLElement, tabMain: HTMLElement) {
    main.innerHTML = '';
    const daily = data.daily!;
    const carousel = document.createElement('div');
    carousel.className = 'dayCarousel';
    const rn = moment().utcOffset(Math.floor(data.utc_offset_seconds / 60));
    for (let i = 0; i < daily.time.length; i++) {
        const item = document.createElement('div');
        item.className = 'dayCarouselItem';
        const time = moment(daily.time[i] + moment().utcOffset(Math.floor(data.utc_offset_seconds / 60)).format('[T]HH:00'));
        const head = document.createElement('h3');
        head.innerHTML = time.format("ddd, YYYY-MM-DD");
        item.appendChild(head);

        const weatherCheck = func.weatherCodeToString(daily.weather_code[i]);
        if (weatherCheck.string !== 'Clear') {
            const img = document.createElement('img');
            img.src = './weatherState/' + daily.weathercode[i] + '.png';
            item.appendChild(img);
        }

        const temperature = document.createElement('p');
        temperature.innerHTML = `Min <span class="spanMin">${daily.temperature_2m_min[i]}</span>°C
Max <span class="spanMax">${daily.temperature_2m_max[i]}</span>°C`;
        temperature.className = 'dayCarouselTemp';
        item.appendChild(temperature);

        const weather = document.createElement('p');
        weather.innerHTML = weatherCheck.string;
        weather.className = 'dayCarouselWeather';
        item.appendChild(weather);

        if (dataTime.format('YYYY-MM-DD') == time.format('YYYY-MM-DD')) {
            item.classList.add('dayCarouselSelected');
        }

        item.addEventListener('click', e => {
            daySummary(data, dayMain, location, time, tabMain);
            for (const child of carousel.children) {
                child.classList.remove('dayCarouselSelected');
            }
            item.classList.add('dayCarouselSelected');
            tabsUpdateTime(document.getElementById('dataTable#1') as HTMLTableElement, time, 1);
            tabsUpdateTime(document.getElementById('dataTable#4') as HTMLTableElement, time, 4);
        });

        carousel.appendChild(item);
    }

    main.appendChild(carousel);
}

export function tabs(data: types.weatherData, main: HTMLElement, dataTime: moment.Moment, dayMain: HTMLElement, location: types.geoLocale | types.mapLocation) {
    document.getElementById('tabButtons')
        .style.display = '';

    main.innerHTML = '';
    // dayRow(data, main, dataTime);
    weekRow(data, main, dataTime, 4, dayMain, location);
    weekRow(data, main, dataTime, 1, dayMain, location);

    // const dailyButton = document.getElementById('tabRowDaily');
    const weeklyButton = document.getElementById('tabRowWeekly');
    const fullButton = document.getElementById('tabRowFull');
    // const days = document.getElementById('dailyTable');
    const weeks = document.getElementById('weeklyTable#4');
    const full = document.getElementById('weeklyTable#1');
    // days.style.display = '';
    weeks.style.display = 'none';
    full.style.display = 'none';
    // if (dailyButton.classList.contains('tabRowCurrent')) {
    //     selectClassTab(dailyButton, [weeklyButton, fullButton], 'tabRowCurrent');
    //     divTab(days, [weeks, full]);
    //     tabsScrollTo(days);

    // }
    if (weeklyButton.classList.contains('tabRowCurrent')) {
        selectClassTab(weeklyButton, [fullButton], 'tabRowCurrent');
        divTab(weeks, [full]);
        tabsScrollTo(weeks);
    } else {
        selectClassTab(fullButton, [weeklyButton], 'tabRowCurrent');
        divTab(full, [weeks]);
        tabsScrollTo(full);
    }
    // dailyButton.addEventListener('click', (e) => {
    //     selectClassTab(dailyButton, [weeklyButton, fullButton], 'tabRowCurrent');
    //     divTab(days, [weeks, full]);
    //     tabsScrollTo(days);
    // });
    weeklyButton.addEventListener('click', (e) => {
        selectClassTab(weeklyButton, [fullButton], 'tabRowCurrent');
        divTab(weeks, [full]);
        tabsScrollTo(weeks);
    });
    fullButton.addEventListener('click', (e) => {
        selectClassTab(fullButton, [weeklyButton], 'tabRowCurrent');
        divTab(full, [weeks]);
        tabsScrollTo(full);
    });
}
/**
 * generate small graph table for hourly weather info
 */
export function dayRow(data: types.weatherData, main: HTMLElement, dataTime: moment.Moment) {
    const daily = data.daily!;
    const hourly = data.hourly!;

    let pos = hourly.time.indexOf(dataTime.format("YYYY-MM-DD[T]HH:00"));

    const dailyTable = document.createElement('table');
    dailyTable.id = 'dailyTable';
    dailyTable.className = 'tabbedTable';
    const table = document.createElement('table');
    table.className = 'tableData';
    const dayRow = table.insertRow();
    const timeRow = table.insertRow();
    const weatherRow = table.insertRow();
    const tempRow = table.insertRow(); // C° | [num]
    const precipRow = table.insertRow(); // mm | [num] | blue for rain, white for snow, maybe grey 
    const preChRow = table.insertRow(); // %
    const windRow = table.insertRow(); // km/h
    const gustRow = table.insertRow(); // km/h

    dayRow.className = 'dayRow';
    dayRow.style.backgroundColor = '#1f1f1f' + testData.transparencyHex;
    timeRow.className = 'timeRow';
    weatherRow.className = 'weatherRow';
    weatherRow.style.backgroundColor = '#1f1f1f' + testData.transparencyHex;
    tempRow.className = 'tempRow';
    precipRow.className = 'precipRow';
    preChRow.className = 'preChRow';
    windRow.className = 'windRow';
    gustRow.className = 'gustRow';

    if (pos > 7) {
        pos -= 7;
    }
    if (hourly.time.length - pos < 24) {
        pos -= 24 - (hourly.time.length - pos);
    }
    for (let i = 0; i < 24; i++) {
        weatherRow.insertCell();
        tempRow.insertCell();
        precipRow.insertCell();
        preChRow.insertCell();
        windRow.insertCell();
        gustRow.insertCell();
        timeRow.insertCell();

        const kyou = moment(hourly.time[pos]!);
        const sunrise = moment(daily.sunrise![Math.floor(pos / 24)]);
        const sunset = moment(daily.sunset![Math.floor(pos / 24)]);

        const weatherCode: number = hourly.weathercode?.[pos] ?? hourly.weather_code?.[pos] ?? 0;
        // weatherRow.cells[i].innerHTML = func.weatherCodeToString(weatherCode).icon;
        const weatherImg = document.createElement('img');
        weatherImg.src = `./weatherState/${weatherCode}.png`;
        weatherRow.cells[i].appendChild(weatherImg);

        tempRow.cells[i].innerHTML = '' + hourly.temperature_2m![pos];
        cellColour(tempRow.cells[i], hourly.temperature_2m![pos], 'temp');

        const precipitation = hourly.precipitation![pos] == 0 ? '' : hourly.precipitation![pos];
        const precipitationChance = hourly.precipitation_probability![pos] == 0 ? '' : hourly.precipitation_probability![pos];
        precipRow.cells[i].innerHTML = '' + precipitation;
        preChRow.cells[i].innerHTML = '' + precipitationChance;
        cellColour(precipRow.cells[i], hourly.precipitation![pos], 'rain');
        cellColour(preChRow.cells[i], hourly.precipitation_probability![pos], 'rainchance');

        windRow.cells[i].innerHTML = '' + hourly.windspeed_10m![pos];
        gustRow.cells[i].innerHTML = '' + hourly.windgusts_10m![pos];

        cellColour(windRow.cells[i], hourly.windspeed_10m![pos], 'wind');
        cellColour(gustRow.cells[i], hourly.windgusts_10m![pos], 'wind');

        if (kyou.isAfter(sunrise) && kyou.isBefore(sunset)) {
            timeRow.cells[i].style.backgroundColor = '#FFD800' + testData.transparencyHex;
            // timeRow.cells[i].style.color = '#000000';
        } else {
            timeRow.cells[i].style.backgroundColor = '#510077' + testData.transparencyHex;
            // timeRow.cells[i].style.color = '#FFFFFF';
        }
        timeRow.cells[i].innerHTML = kyou.format("HH");

        if (i % 24 == 0) {
            dayRow.insertCell().colSpan = 24;
            dayRow.cells[i].innerHTML = kyou.format("ddd, YYYY-MM-DD");
        }

        setTimeout(async () => {
            if (
                (+dataTime.format("HH") == +kyou.format("HH")) &&
                (+dataTime.format("DD") == +kyou.format("DD"))
            ) {
                const bg = '#ff000044';
                const curtimcl = 'currentTimeCell';

                weatherRow.cells[i].style.backgroundColor = bg;
                timeRow.cells[i].style.backgroundColor = bg;
                tempRow.cells[i].style.backgroundColor = bg;
                precipRow.cells[i].style.backgroundColor = bg;
                preChRow.cells[i].style.backgroundColor = bg;
                windRow.cells[i].style.backgroundColor = bg;
                gustRow.cells[i].style.backgroundColor = bg;

                timeRow.cells[i].className = curtimcl;
                weatherRow.cells[i].className = curtimcl;
                tempRow.cells[i].className = curtimcl;
                precipRow.cells[i].className = curtimcl;
                preChRow.cells[i].className = curtimcl;
                windRow.cells[i].className = curtimcl;
                gustRow.cells[i].className = curtimcl;

                // weatherRow.cells[i].scrollIntoView({ inline: "start" });
            }
        }, 100);
        pos++;
    }

    const labelTable = document.createElement('table');
    labelTable.id = 'tableLabel';
    labelTable.insertRow().insertCell(0).innerHTML = 'Day';
    labelTable.insertRow().insertCell(0).innerHTML = 'Time';
    labelTable.insertRow().insertCell(0).innerHTML = 'Weather';
    labelTable.insertRow().insertCell(0).innerHTML = 'Temp.';
    labelTable.insertRow().insertCell(0).innerHTML = 'Rain';
    labelTable.insertRow().insertCell(0).innerHTML = 'Chance';
    labelTable.insertRow().insertCell(0).innerHTML = 'Wind';
    labelTable.insertRow().insertCell(0).innerHTML = 'Gust';

    labelTable.rows[0].insertCell(1).innerHTML = '';
    labelTable.rows[1].insertCell(1).innerHTML = '🕐';
    labelTable.rows[2].insertCell(1).innerHTML = '';
    labelTable.rows[2].className = 'weatherRow';
    labelTable.rows[3].insertCell(1).innerHTML = '°C';
    labelTable.rows[4].insertCell(1).innerHTML = 'mm';
    labelTable.rows[5].insertCell(1).innerHTML = '%';
    labelTable.rows[6].insertCell(1).innerHTML = 'km/h';
    labelTable.rows[7].insertCell(1).innerHTML = 'km/h';
    // highlight current point in time

    dailyTable.insertRow();
    dailyTable.rows[0].insertCell().appendChild(labelTable);
    const dataContainer = document.createElement('div');
    dataContainer.className = 'tableDiv';
    dataContainer.appendChild(table);
    dailyTable.rows[0].insertCell().appendChild(dataContainer);
    main.appendChild(dailyTable);

    blendCells(timeRow);
    blendCells(tempRow);
    blendCells(precipRow);
    blendCells(preChRow);
    blendCells(windRow);
    blendCells(gustRow);
}

/**
 * creates weather table
 */
export function weekRow(data: types.weatherData, main: HTMLElement, dataTime: moment.Moment, hrSeperator: number, dayMain: HTMLElement, location: types.geoLocale | types.mapLocation) {
    const weeklyTable = document.createElement('table');
    weeklyTable.id = 'weeklyTable#' + hrSeperator;
    weeklyTable.className = 'tabbedTable';
    const table = document.createElement('table');
    table.className = 'tableData';
    table.id = 'dataTable#' + hrSeperator;
    const dayRow = table.insertRow();
    const timeRow = table.insertRow();
    const weatherRow = table.insertRow();
    const tempRow = table.insertRow(); // C° | [num]
    const precipRow = table.insertRow(); // mm | [num] | blue for rain, white for snow, maybe grey 
    const preChRow = table.insertRow(); // %
    const windRow = table.insertRow(); // km/h
    const gustRow = table.insertRow(); // km/h

    dayRow.className = 'dayRow';
    dayRow.style.backgroundColor = '#1f1f1f' + testData.transparencyHex;
    timeRow.className = 'timeRow';
    weatherRow.className = 'weatherRow';
    weatherRow.style.backgroundColor = '#1f1f1f' + testData.transparencyHex;
    tempRow.className = 'tempRow';
    precipRow.className = 'precipRow';
    preChRow.className = 'preChRow';
    windRow.className = 'windRow';
    gustRow.className = 'gustRow';

    const hourly = data.hourly!;
    for (let i = 0; i < (hourly.time.length); i += hrSeperator) {
        weatherRow.insertCell();
        tempRow.insertCell();
        precipRow.insertCell();
        preChRow.insertCell();
        windRow.insertCell();
        gustRow.insertCell();
        timeRow.insertCell();
        const pos = (i / hrSeperator); //use pos for cells, i for data

        const kyou = moment(hourly?.time[i]!);
        const sunrise = moment(data.daily?.sunrise![Math.floor(i / 24)]);
        const sunset = moment(data.daily?.sunset![Math.floor(i / 24)]);


        const weatherCode: number = hourly.weathercode?.[i] ?? hourly.weather_code?.[i] ?? 0;
        // weatherRow.cells[pos].innerHTML = func.weatherCodeToString(weatherCode).icon;
        const weatherImg = document.createElement('img');
        weatherImg.src = `./weatherState/${weatherCode}.png`;
        weatherRow.cells[pos].appendChild(weatherImg);

        const curtemp = averageData(data.hourly!.temperature_2m!, i, hrSeperator);
        tempRow.cells[pos].innerHTML = '' + averageData(data.hourly!.temperature_2m!, i, hrSeperator);
        cellColour(tempRow.cells[pos], +curtemp, 'temp');

        const precipitation = averageData(data.hourly!.precipitation!, i, hrSeperator) == '0.0' ? '' : averageData(data.hourly!.precipitation!, i, hrSeperator);
        const precipitationChance = averageData(data.hourly!.precipitation_probability!, i, hrSeperator) == '0.0' ? '' : averageData(data.hourly!.precipitation_probability!, i, hrSeperator);
        precipRow.cells[pos].innerHTML = '' + precipitation;
        preChRow.cells[pos].innerHTML = '' + precipitationChance;
        cellColour(precipRow.cells[pos], +precipitation, 'rain');
        cellColour(preChRow.cells[pos], +precipitationChance, 'rainchance');

        const wind = averageData(data.hourly!.windspeed_10m!, i, hrSeperator);
        const gust = averageData(data.hourly!.windgusts_10m!, i, hrSeperator);
        windRow.cells[pos].innerHTML = '' + wind;
        gustRow.cells[pos].innerHTML = '' + gust;

        cellColour(windRow.cells[pos], +wind, 'wind');
        cellColour(gustRow.cells[pos], +gust, 'wind');

        if (kyou.isAfter(sunrise) && kyou.isBefore(sunset)) {
            timeRow.cells[pos].style.backgroundColor = '#FFD800' + testData.transparencyHex;
            // timeRow.cells[pos].style.color = '#000000';
        } else {
            timeRow.cells[pos].style.backgroundColor = '#510077' + testData.transparencyHex;
            // timeRow.cells[pos].style.color = '#FFFFFF';
        }

        if (i % (hrSeperator) == 0) {
            timeRow.cells[pos].innerHTML = kyou.format("HH");
            if (i % 24 == 0) {
                const daySep = 24 / hrSeperator;
                dayRow.insertCell().colSpan = daySep;
                dayRow.cells[pos / daySep].innerHTML = kyou.format("ddd, YYYY-MM-DD");
            }
        }
        timeRow.cells[pos].id = 'cell' + kyou.format("YYYY-MM-DD[T]HH:00");

        timeRow.cells[pos].addEventListener('click', () => {
            daySummary(data, dayMain, location, kyou, main);
            const items = document.getElementsByClassName('dayCarouselItem');
            for (const item of items) {
                if (item.innerHTML.includes(kyou.format('YYYY-MM-DD'))) {
                    item.classList.add('dayCarouselSelected');
                } else {
                    item.classList.remove('dayCarouselSelected');
                }
            }
            tabsUpdateTime(table, kyou, hrSeperator);
        });

        //highlight current time cells
        setTimeout(async () => {
            tabsUpdateTime(table, dataTime, hrSeperator);
        }, 100);
    }
    const labelTable = document.createElement('table');
    labelTable.className = 'tableLabel';
    labelTable.insertRow().insertCell(0).innerHTML = 'Day';
    labelTable.insertRow().insertCell(0).innerHTML = 'Time';
    labelTable.insertRow().insertCell(0).innerHTML = 'Weather';
    labelTable.insertRow().insertCell(0).innerHTML = 'Temp.';
    labelTable.insertRow().insertCell(0).innerHTML = 'Rain';
    labelTable.insertRow().insertCell(0).innerHTML = 'Chance';
    labelTable.insertRow().insertCell(0).innerHTML = 'Wind';
    labelTable.insertRow().insertCell(0).innerHTML = 'Gust';

    labelTable.rows[0].insertCell(1).innerHTML = '';
    labelTable.rows[1].insertCell(1).innerHTML = '🕐';
    labelTable.rows[2].insertCell(1).innerHTML = '';
    labelTable.rows[2].className = 'weatherRow';
    labelTable.rows[3].insertCell(1).innerHTML = '°C';
    labelTable.rows[4].insertCell(1).innerHTML = 'mm';
    labelTable.rows[5].insertCell(1).innerHTML = '%';
    labelTable.rows[6].insertCell(1).innerHTML = 'km/h';
    labelTable.rows[7].insertCell(1).innerHTML = 'km/h';
    // highlight current point in time

    weeklyTable.insertRow();
    weeklyTable.rows[0].insertCell().appendChild(labelTable);
    const dataContainer = document.createElement('div'); //for scrolling (just having the table by itself wont work)
    dataContainer.className = 'tableDiv';
    dataContainer.appendChild(table);
    weeklyTable.rows[0].insertCell().appendChild(dataContainer);
    main.appendChild(weeklyTable);
    blendCells(timeRow);
    blendCells(tempRow);
    blendCells(precipRow);
    blendCells(preChRow);
    blendCells(windRow);
    blendCells(gustRow);
}

/**
 * calculate cell colour based off of the number given
 */
function cellColour(cell: HTMLTableCellElement, value: number, type: 'wind' | 'temp' | 'rain' | 'rainchance',) {
    let main = testData.zeroColour;
    switch (type) {
        case 'wind': {
            switch (true) {
                case value <= 0:
                    break;
                case value < 10:
                    main = '#0094FF';
                    break;
                case value >= 10 && value < 20:
                    main = '#00FF90';
                    break;
                case value >= 20 && value < 30:
                    main = '#4CFF00';
                    break;
                case value >= 30 && value < 40:
                    main = '#B6FF00';
                    break;
                case value >= 40 && value < 50:
                    main = '#FFD800';
                    break;
                case value >= 50 && value < 60:
                    main = '#FF6A00';
                    break;
                case value >= 60:
                    main = '#FF0000';
                    break;
            }
        }
            break;
        case 'temp': {
            switch (true) {
                case value <= 0:
                    break;
                case value < 10:
                    main = '#0094FF';
                    break;
                case value >= 10 && value < 15:
                    main = '#00FF90';
                    break;
                case value >= 15 && value < 20:
                    main = '#4CFF00';
                    break;
                case value >= 20 && value < 25:
                    main = '#FFD800';
                    break;
                case value >= 25 && value < 30:
                    main = '#FF6A00';
                    break;
                case value >= 30:
                    main = '#FF0000';
                    break;
            }
        }
            break;
        case 'rain': {
            switch (true) {
                case value <= 0:
                    break;
                case value < 0.5:
                    main = '#0094FF';
                    break;
                case value >= 0.5 && value < 2:
                    main = '#00FF90';
                    break;
                case value >= 2 && value < 4:
                    main = '#4CFF00';
                    break;
                case value >= 4 && value < 8:
                    main = '#FFD800';
                    break;
                case value >= 8 && value < 50:
                    main = '#FF6A00';
                    break;
                case value >= 50:
                    main = '#FF0000';
                    break;
            }
        }
            break;
        case 'rainchance': {
            switch (true) {
                case value <= 0:
                    break;
                case value < 6:
                    main = '#0094FF';
                    break;
                case value >= 6 && value < 12.5:
                    main = '#00FF90';
                    break;
                case value >= 12.5 && value < 25:
                    main = '#4CFF00';
                    break;
                case value >= 25 && value < 50:
                    main = '#FFD800';
                    break;
                case value >= 50 && value < 75:
                    main = '#FF6A00';
                    break;
                case value >= 75:
                    main = '#FF0000';
                    break;
            }
        }
            break;
    }
    main += main == testData.zeroColour ? '' : testData.transparencyHex; //add transparency
    cell.style.backgroundColor = main;
}

/**
 * blend all backgrounds together
 */
function blendCells(row: HTMLTableRowElement, start?: number, end?: number) {
    const grads = [row.cells[0].style.backgroundColor + ' 10px'];
    for (let i = 1; i < row.cells.length; i++) {
        if (i == row.cells.length - 1) break;
        grads.push(row.cells[i].style.backgroundColor /* + '' + ((i + 1) * 10) + 'px' */);
    }
    grads.push(row.cells[row.cells.length - 1].style.backgroundColor + ` ${row.scrollWidth - 10}px`);

    for (const cell of row.cells) {
        if (!cell.className.includes('ignore')) {
            cell.style.backgroundColor = '#FFFFFF00';
        }
    }
    // console.log(grads[0]);
    // console.log(grads[grads.length - 1]);
    row.style.backgroundImage = `linear-gradient(to right, ${grads.join(', ')})`;
}

/**
 * gets mean number 
 */
function averageData(data: number[], position: number, range: number) {
    if (range % 2 == 0) {
        let distance = range / 2;
        const init: number[][] = [];
        for (let i = -distance; i < distance; i++) {
            const tempArr: number[] = [];
            if (data[position + i]) {
                tempArr.push(data[position + i]);
            }
            if (data[position + i + 1]) {
                tempArr.push(data[position + i + 1]);
            }
            if (tempArr.length !== 0) {
                init.push(tempArr);
            }
        }
        const arr = init.map(x => x.reduce((a, b) => b + a, 0) / 2);
        return (arr.reduce((a, b) => b + a, 0) / range).toFixed(1);
    } else {
        let distance = (range - 1) / 2;
        const arr: number[] = [];
        for (let i = -distance; i <= distance; i++) {
            arr.push(data[position + i]);
        }
        return (arr.reduce((a, b) => b + a, 0) / range).toFixed(1);
    }
}

/**
 * used for tab buttons.
 * highlight the selected tab button and un-highlight the others
 */
function selectClassTab(select: HTMLElement, remove: HTMLElement[], className: string) {
    select.classList.add(className);
    for (const elem of remove) {
        elem.classList.remove(className);
    }
}

/**
 * used for switching content
 * show selected div and hide the others
 */
function divTab(select: HTMLElement, remove: HTMLElement[]) {
    select.style.display = '';
    for (const elem of remove) {
        elem.style.display = 'none';
    }
}

function tabsScrollTo(elem: HTMLElement) {
    setTimeout(() => {

        try {
            console.log(elem.getElementsByClassName('currentTimeCell'));
            elem.getElementsByClassName('currentTimeCell').item(0).scrollIntoView({ inline: 'start' });
        } catch (err) {
            console.log(err);
        }
    }, 500);
}

function tabsUpdateTime(table: HTMLTableElement, dataTime: moment.Moment, hrSeperator: number) {
    console.log('testing!!');
    for (let i = 0; i < table.rows[1].cells.length; i++) {
        const cell = table.rows[1].cells[i];
        const kyou = moment(cell.id.replace('cell', ''));
        if (((+dataTime.format("HH") < +kyou.format("HH") + (hrSeperator / 2)) &&
            (+dataTime.format("HH") >= +kyou.format("HH") - (hrSeperator / 2)) &&
            (+dataTime.format("DD") == +kyou.format("DD"))) ||
            ((+kyou.format("HH") == 0) &&
                (+dataTime.format("HH") < 24 + (hrSeperator / 2)) &&
                (+dataTime.format("HH") >= 24 - (hrSeperator / 2)) &&
                (+dataTime.format("DD") + 1 == +kyou.format("DD")))) {
            for (const row of table.rows) {
                if (row.className != 'dayRow') {
                    row.cells[i].style.backgroundColor = '#ff000044';
                    row.cells[i].className = 'currentTimeCell';
                }
            }
            cell.scrollIntoView({ inline: "start" });
        } else {
            for (const row of table.rows) {
                if (row.className != 'dayRow') {
                    row.cells[i].style.backgroundColor = '';
                    row.cells[i].className = '';
                }
            }
        }
    }
}

/**
 * data charts
 */
function dataChartPopup(data: { name: string, num: number[]; }[], labels: string[], index?: number, colours?: string[]) {
    const main = document.getElementsByClassName('chartContainer')[0] as HTMLElement;
    main.style.display = '';
    const canvas = document.getElementById('chart') as HTMLCanvasElement;
    canvas.innerHTML = '';
    let i = -1;
    chart?.destroy();
    chart = new chartjs.Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: data.map(x => {
                i++;
                return {
                    label: x.name,
                    data: x.num,
                    fill: false,
                    borderColor: colours[i] ?? testData.chartColours[i],
                };
            })
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            },
            elements: {
                point: {
                    radius: customRadius,
                }
            }
        }
    });
    chart.canvas.style.height = '75vh';
    chart.canvas.style.width = '75vw';
    main.appendChild(canvas);
    function customRadius(ctx: any) {
        return ctx.dataIndex === index ? 10 : 2;
    }
    console.log('wahhh');
}