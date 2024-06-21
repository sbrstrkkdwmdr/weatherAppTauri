import * as chartjs from 'chart.js';
import moment from 'moment';
import * as func from './func';
import * as types from './types';

export function daySummary(data: types.weatherData, main: HTMLElement, location: types.geoLocale) {
    main.innerHTML = '';
    const rn = moment().utcOffset(Math.floor(data.utc_offset_seconds / 60));
    const today = data.current_weather!;
    const daily = data.daily!;
    const hourly = data.hourly!;

    const todayIndex = daily.time.indexOf(rn.format("YYYY-MM-DD")); //day pos
    let pos = hourly.time.indexOf(rn.format("YYYY-MM-DD[T]HH:00")); //hr pos

    //stuff that isnt the table
    const nonTable = document.createElement('div');

    const placeTitle = document.createElement('h2');
    placeTitle.innerHTML = 'Weather for ' + func.genSearchName(location);
    nonTable.appendChild(placeTitle);
    const coordParagraph = document.createElement('p');
    coordParagraph.innerHTML = func.formatCoords(location);
    nonTable.appendChild(coordParagraph);

    const smolTxt = document.createElement('p');
    smolTxt.innerHTML = rn.format('[Last updated] YYYY-MM-DD, HH:mm:ss') + '</br>';
    smolTxt.className = 'smol';
    nonTable.appendChild(smolTxt);


    const localTime = moment().utcOffset(Math.floor(data.utc_offset_seconds / 60))
        .format("ddd, DD MMM YYYY HH:mm:ss Z");

    const summary = document.createElement('div');
    summary.id = 'summaryDiv';

    const summaryTable = document.createElement('table');
    summaryTable.id = 'summaryTable';
    summaryTable.insertRow();
    // const summaryTableImg = summaryTable.rows[0].insertCell(); //img
    const summaryTableTemp = summaryTable.rows[0].insertCell(); // temp
    const summaryTableInfo = summaryTable.rows[0].insertCell(); // info
    summaryTable.insertRow();
    const summaryTableWind = summaryTable.rows[1].insertCell(); // wind
    const summaryTableRainSpot = summaryTable.rows[1].insertCell();

    const summaryTableRain = document.createElement('table');
    summaryTableRain.insertRow();
    const summaryTableRainPer = summaryTableRain.rows[0].insertCell(); // rain %
    const summaryTableRainPerTable = summaryTableRain.rows[0].insertCell(); // rain % table
    summaryTableRain.insertRow();
    const summaryTableRainOther = summaryTableRain.rows[1].insertCell(); // other rain
    summaryTableRainOther.colSpan = 2;


    today.is_day == 0 ? '🌒' : '☀';

    const curweather = func.weatherCodeToString(today.weathercode ?? 0);
    summaryTableInfo.innerHTML =
        `Local time is ${localTime}
It is currently ${today.is_day == 0 ? 'night' : 'day'}.
${curweather.icon} ${curweather.string}.
`;

    const temp = {
        cur: today.temperature,
        min: daily.temperature_2m_min![todayIndex],
        max: daily.temperature_2m_max![todayIndex],
    };
    const rain = {
        chance: daily.precipitation_probability_mean![todayIndex],
        rain: daily.rain_sum![todayIndex],
        snow: daily.snowfall_sum![todayIndex],
        showers: daily.showers_sum![todayIndex],
    };
    const wind = {
        cur: today.windspeed,
        dir: func.windToDirection(today.winddirection),
        max: daily.windspeed_10m_max![todayIndex],
        maxGust: daily.windgusts_10m_max![todayIndex],
    };

    summaryTableTemp.innerHTML = `Cur <span id="spanCur">${temp.cur}</span>°C
Min <span id="spanMin">${temp.min}</span>°C 
Max <span id="spanMax">${temp.max}</span>°C`;

    const rainTable = document.createElement('table');
    rainTable.id = 'rainPercent';
    rainTable.insertRow();
    for (let i = 0; i < 10; i++) {
        rainTable.rows[0].insertCell();
        if (i <= Math.floor(rain.chance / 10)) {
            rainTable.rows[0].cells[i].style.backgroundColor = '#00FF00';
        } else {
            rainTable.rows[0].cells[i].style.backgroundColor = '#3c3c3c';
        }
    }
    summaryTableRainPer.innerHTML = `Chance of rain: <span id="spanCur">${rain.chance}%</span>`;
    summaryTableRainPerTable.appendChild(rainTable);
    if (rain.rain > 0) {
        summaryTableRainOther.innerHTML += `Possible rain: <span id="rainfall">${rain.rain}mm</span></br>`;
    }
    if (rain.showers > 0) {
        summaryTableRainOther.innerHTML += `Possible showers: <span id="showers">${rain.showers}mm</span></br>`;
    }
    if (rain.snow > 0) {
        summaryTableRainOther.innerHTML += `Possible snow: <span id="snowfall">${rain.snow}cm</span></br>`;
    }

    summaryTableWind.innerHTML = `Cur <span id="spanCur">${wind.cur}</span>km/h ${wind.dir.emoji}${wind.dir.short}
Max winds: <span id="spanMax">${wind.max}</span>km/h
Max gusts: <span id="spanMax">${wind.maxGust}</span>km/h
`;
    summaryTableRainSpot.appendChild(summaryTableRain);
    summary.appendChild(summaryTable);
    nonTable.appendChild(summary);
    main.appendChild(nonTable);
    // lil table of data
    const dailyTable = document.createElement('table');
    dailyTable.id = 'dailyTable';
    const table = document.createElement('table');
    table.id = 'tableData';
    const timeRow = table.insertRow(); // every 8th -> 0,8,16
    const weatherRow = table.insertRow();
    const tempRow = table.insertRow(); // C° | [num]
    const precipRow = table.insertRow(); // mm | [num] | blue for rain, white for snow, maybe grey 
    const preChRow = table.insertRow(); // %
    const windRow = table.insertRow(); // km/h
    const gustRow = table.insertRow(); // km/h

    timeRow.className = 'timeRow';
    weatherRow.className = 'weatherRow';
    tempRow.className = 'tempRow';
    precipRow.className = 'precipRow';
    preChRow.className = 'preChRow';
    windRow.className = 'windRow';
    gustRow.className = 'gustRow';

    if (pos > 7) {
        pos -= 7;
    }
    console.log(pos);
    console.log(hourly.time.length);
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

        const weatherCode: number = hourly.weathercode?.[pos] ?? 0;
        weatherRow.cells[i].innerHTML = func.weatherCodeToString(weatherCode).icon;

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
            timeRow.cells[i].style.backgroundColor = '#999999';
        } else {
            timeRow.cells[i].style.backgroundColor = '#000000';
            timeRow.cells[i].style.color = '#FFFFFF';
        }

        timeRow.cells[i].innerHTML = kyou.format("HH");

        setTimeout(async () => {
            if (
                (+rn.format("HH") == +kyou.format("HH")) &&
                (+rn.format("DD") == +kyou.format("DD"))
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

                weatherRow.cells[i].scrollIntoView({ inline: "start" });
            }
        }, 100);
        pos++;
    }
    blendCells(timeRow);
    blendCells(tempRow);
    blendCells(precipRow);
    blendCells(preChRow);
    blendCells(windRow);
    blendCells(gustRow);

    const labelTable = document.createElement('table');
    labelTable.id = 'tableLabel';
    labelTable.insertRow().insertCell(0).innerHTML = 'Time';
    labelTable.insertRow().insertCell(0).innerHTML = 'Weather';
    labelTable.insertRow().insertCell(0).innerHTML = 'Temp.';
    labelTable.insertRow().insertCell(0).innerHTML = 'Rain';
    labelTable.insertRow().insertCell(0).innerHTML = 'Chance';
    labelTable.insertRow().insertCell(0).innerHTML = 'Wind';
    labelTable.insertRow().insertCell(0).innerHTML = 'Gust';

    labelTable.rows[0].insertCell(1).innerHTML = '🕐';
    labelTable.rows[1].insertCell(1).innerHTML = '';
    labelTable.rows[2].insertCell(1).innerHTML = '°C';
    labelTable.rows[3].insertCell(1).innerHTML = 'mm';
    labelTable.rows[4].insertCell(1).innerHTML = '%';
    labelTable.rows[5].insertCell(1).innerHTML = 'km/h';
    labelTable.rows[6].insertCell(1).innerHTML = 'km/h';
    // highlight current point in time

    dailyTable.insertRow();
    dailyTable.rows[0].insertCell().appendChild(labelTable);
    const dataContainer = document.createElement('div');
    dataContainer.id = 'tableDiv';
    dataContainer.appendChild(table);
    dailyTable.rows[0].insertCell().appendChild(dataContainer);
    main.appendChild(dailyTable);
}

export function graph(data: types.weatherData, main: HTMLElement) {
}

export function week(data: types.weatherData, main: HTMLElement) {
    main.innerHTML = '';
    const weeklyTable = document.createElement('table');
    weeklyTable.id = 'weeklyTable';
    const table = document.createElement('table');
    table.id = 'tableData';
    const dayRow = table.insertRow(); // ie day yyyy-mm-dd
    const timeRow = table.insertRow(); // every 8th -> 0,8,16
    const weatherRow = table.insertRow();
    const tempRow = table.insertRow(); // C° | [num]
    const precipRow = table.insertRow(); // mm | [num] | blue for rain, white for snow, maybe grey 
    const preChRow = table.insertRow(); // %
    const windRow = table.insertRow(); // km/h
    const gustRow = table.insertRow(); // km/h

    dayRow.className = 'dayRow';
    timeRow.className = 'timeRow';
    weatherRow.className = 'weatherRow';
    tempRow.className = 'tempRow';
    precipRow.className = 'precipRow';
    preChRow.className = 'preChRow';
    windRow.className = 'windRow';
    gustRow.className = 'gustRow';

    const rn = moment().utcOffset(Math.floor(data.utc_offset_seconds / 60));
    // cell bg darkness determined by time of day maybe

    const hourly = data.hourly!;
    const hrSeperator = 4; // do every x hours. make sure its factors of 8 or 24
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

        const weatherCode: number = data.hourly?.weathercode?.[i] ?? 0;
        weatherRow.cells[pos].innerHTML = func.weatherCodeToString(weatherCode).icon;

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
            timeRow.cells[pos].style.backgroundColor = '#999999';
        } else {
            timeRow.cells[pos].style.backgroundColor = '#000000';
            timeRow.cells[pos].style.color = '#FFFFFF';
        }

        if (i % (hrSeperator) == 0) {
            timeRow.cells[pos].innerHTML = kyou.format("HH");
            if (i % 24 == 0) {
                const daySep = 24 / hrSeperator;
                dayRow.insertCell().colSpan = daySep;
                dayRow.cells[pos / daySep].innerHTML = kyou.format("ddd, YYYY-MM-DD");
            }
        }

        setTimeout(async () => {
            if (
                ((+rn.format("HH") < +kyou.format("HH") + (hrSeperator / 2)) &&
                    (+rn.format("HH") >= +kyou.format("HH") - (hrSeperator / 2)) &&
                    (+rn.format("DD") == +kyou.format("DD"))) ||
                ((+kyou.format("HH") == 0) &&
                    (+rn.format("HH") < 24 + (hrSeperator / 2)) &&
                    (+rn.format("HH") >= 24 - (hrSeperator / 2)) &&
                    (+rn.format("DD") + 1 == +kyou.format("DD")))
            ) {
                const bg = '#ff000044';
                const curtimcl = 'currentTimeCell';
                timeRow.cells[pos].style.backgroundColor = bg;
                weatherRow.cells[pos].style.backgroundColor = bg;
                tempRow.cells[pos].style.backgroundColor = bg;
                precipRow.cells[pos].style.backgroundColor = bg;
                preChRow.cells[pos].style.backgroundColor = bg;
                windRow.cells[pos].style.backgroundColor = bg;
                gustRow.cells[pos].style.backgroundColor = bg;

                timeRow.cells[pos].className = curtimcl;
                weatherRow.cells[pos].className = curtimcl;
                tempRow.cells[pos].className = curtimcl;
                precipRow.cells[pos].className = curtimcl;
                preChRow.cells[pos].className = curtimcl;
                windRow.cells[pos].className = curtimcl;
                gustRow.cells[pos].className = curtimcl;

                weatherRow.cells[pos].scrollIntoView({ inline: "start" });
            }
        }, 100);
    }
    blendCells(timeRow);
    blendCells(tempRow);
    blendCells(precipRow);
    blendCells(preChRow);
    blendCells(windRow);
    blendCells(gustRow);

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
    labelTable.rows[3].insertCell(1).innerHTML = '°C';
    labelTable.rows[4].insertCell(1).innerHTML = 'mm';
    labelTable.rows[5].insertCell(1).innerHTML = '%';
    labelTable.rows[6].insertCell(1).innerHTML = 'km/h';
    labelTable.rows[7].insertCell(1).innerHTML = 'km/h';
    // highlight current point in time

    weeklyTable.insertRow();
    weeklyTable.rows[0].insertCell().appendChild(labelTable);
    const dataContainer = document.createElement('div'); //for scrolling
    dataContainer.id = 'tableDiv';
    dataContainer.appendChild(table);
    weeklyTable.rows[0].insertCell().appendChild(dataContainer);
    main.appendChild(weeklyTable);
}

/**
 * calculate cell colour based off of the number given
 */
function cellColour(cell: HTMLTableCellElement, value: number, type: 'wind' | 'temp' | 'rain' | 'rainchance',) {
    let main = '#FFFFFF';
    switch (type) {
        case 'wind': {
            switch (true) {
                case value <= 0:
                    main = '#FFFFFF';
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
                    main = '#FFFFFF';
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
                    main = '#FFFFFF';
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
                    main = '#FFFFFF';
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
    cell.style.backgroundColor = main;
}

/**
 * blend all backgrounds together
 */
function blendCells(row: HTMLTableRowElement, start?: number, end?: number) {
    const grads = [row.cells[0].style.backgroundColor];
    for (const cell of row.cells) {
        grads.push(cell.style.backgroundColor);
        grads.push(cell.style.backgroundColor);
    }
    grads.push(row.cells[row.cells.length - 1].style.backgroundColor);

    for (const cell of row.cells) {
        if (!cell.className.includes('ignore')) {
            cell.style.backgroundColor = '#FFFFFF00';
        }
    }
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