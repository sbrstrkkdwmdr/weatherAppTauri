import * as chartjs from 'chart.js';
import moment from 'moment';
import * as func from './func';
import * as types from './types';

export function daySummary(data: types.weatherData, main: HTMLElement) {

}

export function graph(data: types.weatherData, main: HTMLElement) {
}

export function week(data: types.weatherData, main: HTMLElement) {
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

    dayRow.className = 'rowDay';
    timeRow.className = 'rowTime';
    weatherRow.className = 'rowWeather';
    tempRow.className = 'rowTemp';
    precipRow.className = 'rowPrecip';
    preChRow.className = 'rowPreCh';
    windRow.className = 'rowWind';
    gustRow.className = 'rowGust';

    const rn = moment();
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

        // console.log(pos);
        const kyou = moment(hourly?.time[i]!);
        const sunrise = moment(data.daily?.sunrise![Math.floor(i / 24)]);
        const sunset = moment(data.daily?.sunset![Math.floor(i / 24)]);
        // console.log(sunrise);
        // console.log(kyou);
        // console.log(sunset);


        if (kyou.isAfter(sunrise) && kyou.isBefore(sunset)) {
            timeRow.cells[pos].style.backgroundColor = '#999999';
        } else {
            timeRow.cells[pos].style.backgroundColor = '#000000';
            timeRow.cells[pos].style.color = '#FFFFFF';
        }
        if (
            (+rn.format("HH") <= +kyou.format("HH") + (hrSeperator - 1)) &&
            (+rn.format("HH") > +kyou.format("HH")) &&
            (+rn.format("DD") == +kyou.format("DD"))
        ) {
            weatherRow.cells[pos].style.backgroundColor = '#15ff00';
            timeRow.cells[pos].style.backgroundColor = '#15ff00';
            weatherRow.cells[pos].style.color = '#000000';
            timeRow.cells[pos].style.color = '#000000';
        }

        if (i % (hrSeperator) == 0) {
            timeRow.cells[pos].innerHTML = kyou.format("HH");
            if (i % 24 == 0) {
                const daySep = 24 / hrSeperator;
                dayRow.insertCell().colSpan = daySep;
                dayRow.cells[pos / daySep].innerHTML = kyou.format("ddd, YYYY-MM-DD");
            }
        }

        const weatherCode: number = data.hourly?.weathercode?.[i] ?? 0;
        weatherRow.cells[pos].innerHTML = func.weatherCodeToString(weatherCode).icon;

        tempRow.cells[pos].innerHTML = '' + data.hourly!.temperature_2m![i];
        cellColour(tempRow.cells[pos], data.hourly!.temperature_2m![i], 'temp', tempRow.cells[pos - 1]);

        const precipitation = data.hourly!.precipitation![i] == 0 ? '' : data.hourly!.precipitation![i];
        const precipitationChance = data.hourly!.precipitation_probability![i] == 0 ? '' : data.hourly!.precipitation_probability![i];
        precipRow.cells[pos].innerHTML = '' + precipitation;
        preChRow.cells[pos].innerHTML = '' + precipitationChance;
        cellColour(precipRow.cells[pos], data.hourly!.precipitation![i], 'rain', precipRow.cells[pos - 1]);
        cellColour(preChRow.cells[pos], data.hourly!.precipitation_probability![i], 'rainchance', preChRow.cells[pos - 1]);

        windRow.cells[pos].innerHTML = '' + data.hourly!.windspeed_10m![i];
        gustRow.cells[pos].innerHTML = '' + data.hourly!.windgusts_10m![i];

        cellColour(windRow.cells[pos], data.hourly!.windspeed_10m![i], 'wind', windRow.cells[pos - 1]);
        cellColour(gustRow.cells[pos], data.hourly!.windgusts_10m![i], 'wind', gustRow.cells[pos - 1]);

    }
    blendCells(tempRow);
    blendCells(precipRow);
    blendCells(preChRow);
    blendCells(windRow);
    blendCells(gustRow);

    const labelTable = document.createElement('table');
    labelTable.id = 'tableLabel';
    labelTable.insertRow().insertCell(0).innerHTML = ' ';
    labelTable.insertRow().insertCell(0).innerHTML = 'Time';
    labelTable.insertRow().insertCell(0).innerHTML = ' ';
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
    weeklyTable.rows[0].insertCell().appendChild(table);
    main.appendChild(weeklyTable);
}

/**
 * calculate cell colour based off of the number given
 */
function cellColour(cell: HTMLTableCellElement, value: number, type: 'wind' | 'temp' | 'rain' | 'rainchance', prev?: HTMLTableCellElement) {
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
    }
    grads.push(row.cells[row.cells.length - 1].style.backgroundColor);

    for (const cell of row.cells) {
        cell.style.backgroundColor = '#FFFFFF00';
    }
    console.log(grads);
    row.style.backgroundImage = `linear-gradient(to right, ${grads.join(', ')})`;
}