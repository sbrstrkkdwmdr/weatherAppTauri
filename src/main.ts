import * as func from './func';


(document.querySelector('#clickTest') as HTMLDivElement)?.addEventListener('click', async () => {
    console.log('wassup')
    const fdata = await func.getLocation('Melbourne')
    const testing = fdata.results[0]
    const sdata = await func.getWeather(testing.latitude, testing.longitude, testing)
    const elem = document.getElementById('data') as HTMLDivElement;
    const text = JSON.stringify(sdata)
    elem.innerHTML = text
})
