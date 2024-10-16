// Your API key
const apiKey = 'meri_key';

// Latitude and Longitude for the location
const lat = '33.6844';  // Example: Latitude for Islamabad
const lon = '73.0479';  // Example: Longitude for Islamabad

// Fetch weather data from OpenWeather API
function getWeatherForecast() {
    const exclude = 'minutely,hourly'; // Example: Excluding minute and hourly data
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${exclude}&appid=${apiKey}`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        displayWeather(data);
    })
    .catch(error => console.error('Error fetching weather data:', error));
}

// Display weather data on the webpage
function displayWeather(data) {
    const weatherDiv = document.getElementById('weather');
    const currentWeather = data.current;
    const forecast = data.daily;

    weatherDiv.innerHTML = `
    <h2>Current Weather:</h2>
    <p>Temperature: ${Math.round(currentWeather.temp - 273.15)} °C</p>
    <p>Weather: ${currentWeather.weather[0].description}</p>
    <h2>7-Day Forecast:</h2>
    `;

    forecast.forEach((day, index) => {
    if (index < 7) {
        const date = new Date(day.dt * 1000).toDateString();
        weatherDiv.innerHTML += `
        <p><strong>${date}</strong></p>
        <p>Temperature: Day - ${Math.round(day.temp.day - 273.15)} °C, Night - ${Math.round(day.temp.night - 273.15)} °C</p>
        <p>Weather: ${day.weather[0].description}</p>
        `;
    }
    });
}

// Call the function to get weather forecast
getWeatherForecast();