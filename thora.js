const apiKey = '3f1cbc20c242e84ad5df89b7884034b4';
let currentUnit = 'metric';
let currentWeatherData = null;
let currentForecastData = null;
let forecastData = [];
let currentPage = 1;
const itemsPerPage = 5;

document.getElementById('get-weather').addEventListener('click', () => fetchWeather(document.getElementById('city-input').value));
document.getElementById('unit-toggle').addEventListener('click', toggleUnit);

function getLocation() {
    const locationStatus = document.getElementById('location-status');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            success => {
                const latitude = success.coords.latitude;
                const longitude = success.coords.longitude;

                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`)
                    .then(response => response.json())
                    .then(data => {
                        locationStatus.textContent = `Weather for your current location: ${data.name}`;
                        fetchWeather(data.name);
                    })
                    .catch(error => {
                        console.error('Error fetching location from geolocation:', error);
                        fallbackToIPGeolocation(locationStatus);
                    });
            },
            error => {
                console.error('Error getting geolocation:', error);
                fallbackToIPGeolocation(locationStatus);
            }
        );
    } else {
        fallbackToIPGeolocation(locationStatus);
    }
}

function fallbackToIPGeolocation(locationStatus) {
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            const ipAddress = data.ip;
            return fetch(`http://ipinfo.io/${ipAddress}/json`);
        })
        .then(response => response.json())
        .then(data => {
            locationStatus.textContent = `Weather for your approximate location: ${data.city}`;
            fetchWeather(data.city);
        })
        .catch(error => {
            console.error('Error fetching location from IP:', error);
            locationStatus.textContent = 'Unable to determine location. Please enter a city name.';
        });
}

async function fetchWeather(city) {
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}`);
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${currentUnit}`);

    if (weatherResponse.ok && forecastResponse.ok) {
        currentWeatherData = await weatherResponse.json();
        currentForecastData = await forecastResponse.json();

        displayWeather(currentWeatherData);
        processForecastData(currentForecastData);
        displayForecast();
        updateCharts(currentForecastData);
    } else {
        alert('City not found!');
    }
}

function displayWeather(data) {
    document.getElementById('weather-city').textContent = data.name;
    document.getElementById('weather-description').textContent = data.weather[0].description;
    document.getElementById('temperature').textContent = `Temperature: ${data.main.temp.toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `Wind Speed: ${data.wind.speed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}`;
    document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

function processForecastData(data) {
    forecastData = data.list.map(item => ({
        date: new Date(item.dt * 1000),
        temp: item.main.temp,
        description: item.weather[0].description,
        rain: item.rain && item.rain['3h'] ? item.rain['3h'] : 0
    }));
}

function displayForecast(filteredData = forecastData) {
    const tableBody = document.querySelector('#weatherTable tbody');
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    pageData.forEach(day => {
        const row = `<tr>
            <td>${day.date.toLocaleDateString()}</td>
            <td>${day.temp.toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'}</td>
            <td>${day.description}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    updatePagination(filteredData.length);
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}

function changePage(direction) {
    const totalPages = Math.ceil(forecastData.length / itemsPerPage);
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    displayForecast();
}

function applyFilter(filterType) {
    let filteredData = [...forecastData];

    switch (filterType) {
        case 'asc':
            filteredData.sort((a, b) => a.temp - b.temp);
            break;
        case 'desc':
            filteredData.sort((a, b) => b.temp - a.temp);
            break;
        case 'rain':
            filteredData = filteredData.filter(day => day.rain > 0);
            break;
        case 'highest':
            filteredData = [filteredData.reduce((max, day) => max.temp > day.temp ? max : day)];
            break;
    }

    currentPage = 1;
    displayForecast(filteredData);
}

function resetFilter() {
    currentPage = 1;
    displayForecast();
}

function updateCharts(data) {
    const temperatures = data.list.slice(0, 5).map(day => day.main.temp);
    const labels = data.list.slice(0, 5).map(day => new Date(day.dt * 1000).toLocaleDateString());
    const weatherConditions = data.list.slice(0, 5).map(day => day.weather[0].main);

    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (°${currentUnit === 'metric' ? 'C' : 'F'})`,
                data: temperatures,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            animation: { delay: 1000 },
            scales: { y: { beginAtZero: true } }
        }
    });

    new Chart(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: {
            labels: [...new Set(weatherConditions)],
            datasets: [{
                label: 'Weather Conditions',
                data: weatherConditions.map(condition => weatherConditions.filter(c => c === condition).length),
                backgroundColor: ['#f39c12', '#1abc9c', '#3498db', '#e74c3c'],
            }]
        },
        options: { animation: { delay: 1500 } }
    });

    new Chart(document.getElementById('lineChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (°${currentUnit === 'metric' ? 'C' : 'F'})`,
                data: temperatures,
                fill: false,
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2
            }]
        },
        options: {
            animation: { duration: 1000 },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function toggleUnit() {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    document.getElementById('unit-toggle').textContent = `Switch to ${currentUnit === 'metric' ? 'Fahrenheit' : 'Celsius'}`;
    
    if (currentWeatherData && currentForecastData) {
        fetchWeather(city); // Re-fetch data with new unit
    }
}

// Call getLocation when the page loads
window.onload = getLocation;