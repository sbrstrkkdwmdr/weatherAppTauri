import { fs } from '@tauri-apps/api';
import axios from 'axios';
import * as chartjs from 'chart.js';
import * as testData from './data';
import * as types from './types';

const test = true;

export async function getLocation(name: string) {
    if (test) {
        return testData.location;
    }
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${name.replaceAll(' ', '+')}&count=10&language=en&format=json`;
    const data = await axios.get(url)
        .then(x => x.data)
        .catch(err => {
            console.log(err);
            return { error: true };
        }
        );
    console.log(data);
    return data as { results: types.geoLocale[]; };
}

export async function getWeather(
    latitude: number,
    longitude: number,
    location: types.geoLocale,
) {
    if (test) {
        return testData.weather;
    } else {
        if (isNaN(latitude) || isNaN(longitude)) {
            return 'error - NaN values given';
        }
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}`
            + "&hourly=temperature_2m,precipitation,rain,pressure_msl,windspeed_10m,windgusts_10m,precipitation_probability,showers,snowfall"
            + "&current_weather=true&forecast_days=6&past_days=1"
            + "&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_probability_mean,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant,weather_code"
            + `&timezone=${location.timezone}`;
        const data = await axios.get(url)
            .then(x => x.data)
            .catch(err => {
                console.log(err);
                return { error: true, reason: "timeout" };
            });
        console.log(data);
        return data as types.weatherData;
    }
}

export function weatherCodeToString(code: number) {
    let string = 'Clear';
    let icon = '';
    switch (code) {
        case 0: default:
            string = 'Clear sky';
            icon = '☀';
            break;
        case 1:
            string = 'Mostly clear';
            icon = '🌤';
            break;
        case 2:
            string = 'Partly Cloudy';
            icon = '⛅';
            break;
        case 3:
            string = 'Overcast';
            icon = '☁';
            break;
        case 45:
            string = 'Fog';
            icon = '🌁';
            break;
        case 48:
            string = 'Fog'; //wtf is deposting rime fog
            icon = '🌁';
            break;
        case 51:
            string = 'Light drizzle';
            icon = '🌧';
            break;
        case 53:
            string = 'Moderate drizzle';
            icon = '🌧';
            break;
        case 55:
            string = 'Heavy drizzle';
            icon = '🌧';
            break;
        case 56:
            string = 'Light freezing drizzle';
            icon = '🌧';
            break;
        case 57:
            string = 'Heavy freezing drizzle';
            icon = '🌧';
            break;
        case 61:
            string = 'Light rain';
            icon = '🌧';
            break;
        case 63:
            string = 'Moderate rain';
            icon = '🌧';
            break;
        case 65:
            string = 'Heavy rain';
            icon = '🌧';
            break;
        case 66:
            string = 'Light freezing rain';
            icon = '🌧';
            break;
        case 67:
            string = 'Heavy freezing rain';
            icon = '🌧';
            break;
        case 71:
            string = 'Light snow';
            icon = '❄';
            break;
        case 73:
            string = 'Moderate snow';
            icon = '❄';
            break;
        case 75:
            string = 'Heavy snow';
            icon = '❄';
            break;
        case 77:
            string = 'Snow grains';
            icon = '❄';
            break;
        case 80:
            string = 'Light showers';
            icon = '🌧';
            break;
        case 81:
            string = 'Moderate showers';
            icon = '🌧';
            break;
        case 82:
            string = 'Heavy showers';
            icon = '🌧';
            break;
        case 85:
            string = 'Light snow showers';
            icon = '❄';
            break;
        case 86:
            string = 'Heavy snow showers';
            icon = '❄';
            break;
        case 95:
            string = 'Thunderstorms';
            icon = '⛈';
            break;
        case 96:
            string = 'Thunderstorms and light hail';
            icon = '⛈';
            break;
        case 99:
            string = 'Thunderstorms and heavy hail';
            icon = '⛈';
            break;
    }
    return {
        string, icon
    };

}

/**
 * converts an angle to a wind direction (north, north east, north east east whatever)
 * @returns direction the wind is coming from 
*/
export function windToDirection(angle: number, reverse?: boolean) {
    //thank you chatGPT

    // Define an array of wind directions in clockwise order
    const directions = [
        { name: 'North', travels: 'South', emoji: '⬇', short: 'N', },
        { name: 'North-Northeast', travels: 'South-Southwest', emoji: '↙', short: 'NNE', },
        { name: 'Northeast', travels: 'Southwest', emoji: '↙', short: 'NE', },
        { name: 'East-Northeast', travels: 'West-Southwest', emoji: '↙', short: 'ENE', },
        { name: 'East', travels: 'West', emoji: '⬅', short: 'E', },
        { name: 'East-Southeast', travels: 'West-Northwest', emoji: '↖', short: 'ESE', },
        { name: 'Southeast', travels: 'Northwest', emoji: '↖', short: 'SE', },
        { name: 'South-Southeast', travels: 'North-Northwest', emoji: '↖', short: 'SSE', },
        { name: 'South', travels: 'North', emoji: '⬆', short: 'S', },
        { name: 'South-Southwest', travels: 'North-Northeast', emoji: '↗', short: 'SSW', },
        { name: 'Southwest', travels: 'Northeast', emoji: '↗', short: 'SW', },
        { name: 'West-Southwest', travels: 'East-Northeast', emoji: '↗', short: 'WSW', },
        { name: 'West', travels: 'East', emoji: '➡', short: 'W', },
        { name: 'West-Northwest', travels: 'East-Southeast', emoji: '↘', short: 'WNW', },
        { name: 'Northwest', travels: 'Southeast', emoji: '↘', short: 'NW', },
        { name: 'North-Northwest', travels: 'South-Southeast', emoji: '↘', short: 'NNW', },
        { name: 'North', travels: 'South', emoji: '⬇', short: 'N', },
        { name: 'North-Northeast', travels: 'South-Southwest', emoji: '↙', short: 'NNE', },
        { name: 'Northeast', travels: 'Southwest', emoji: '↙', short: 'NE', },
        { name: 'East-Northeast', travels: 'West-Southwest', emoji: '↙', short: 'ENE', },
        { name: 'East', travels: 'West', emoji: '⬅', short: 'E', },
        { name: 'East-Southeast', travels: 'West-Northwest', emoji: '↖', short: 'ESE', },
        { name: 'Southeast', travels: 'Northwest', emoji: '↖', short: 'SE', },
        { name: 'South-Southeast', travels: 'North-Northwest', emoji: '↖', short: 'SSE', },
        { name: 'South', travels: 'North', emoji: '⬆', short: 'S', },
        { name: 'South-Southwest', travels: 'North-Northeast', emoji: '↗', short: 'SSW', },
        { name: 'Southwest', travels: 'Northeast', emoji: '↗', short: 'SW', },
        { name: 'West-Southwest', travels: 'East-Northeast', emoji: '↗', short: 'WSW', },
        { name: 'West', travels: 'East', emoji: '➡', short: 'W', },
        { name: 'West-Northwest', travels: 'East-Southeast', emoji: '↘', short: 'WNW', },
        { name: 'Northwest', travels: 'Southeast', emoji: '↘', short: 'NW', },
        { name: 'North-Northwest', travels: 'South-Southeast', emoji: '↘', short: 'NNW', },
    ];

    // Normalize the angle to the range 0 to 359 degrees
    const normalizedAngle = (angle % 360 + 360) % 360;

    // Calculate the index corresponding to the wind direction
    const index =
        reverse == true ? Math.floor(normalizedAngle / 22.5) + directions.length / 4 :
            Math.floor(normalizedAngle / 22.5);

    // Retrieve the wind direction from the array
    return directions[index];
}

/**
 * format name for search results
 */
export function genSearchName(data: types.geoLocale): string {
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

/**
 * format name for web page
 */
export function genTitleName(data: types.geoLocale): string[] {
    let base = [`${data.name}, ${data.country}`];
    if (data?.admin1 || data?.admin2 || data?.admin3 || data?.admin4) {
        const extras = [];
        data?.admin4 ? extras.push(data.admin4) : '';
        data?.admin3 ? extras.push(data.admin3) : '';
        data?.admin2 ? extras.push(data.admin2) : '';
        data?.admin1 ? extras.push(data.admin1) : '';
        base.push(extras.join(', '))
    }
    return base;
}

export function formatCoords(data: types.geoLocale): string {
    let latSide: 'N' | 'S' = 'N';
    let lonSide: 'E' | 'W' = 'E';

    if (data.latitude < 0) {
        latSide = 'S';
    }
    if (data.longitude < 0) {
        lonSide = 'W';
    }
    return `(${Math.abs(data.latitude) + latSide}, ${Math.abs(data.longitude) + lonSide})`;
}