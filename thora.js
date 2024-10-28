const apiKey = '3f1cbc20c242e84ad5df89b7884034b4';
let currentUnit = 'metric';
let currentWeatherData = null;
let currentForecastData = null;
let forecastData = [];
let currentPage = 1;
const itemsPerPage = 10; // Show 10 items per page now

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

        // extract first 5 days of forecast data
        forecastData = currentForecastData.list.slice(0, 5);

        displayWeather(currentWeatherData);
        processForecastData(currentForecastData);
        displayForecast();
        updateCharts(currentForecastData); // Update charts with the forecast data
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
            filteredData = [filteredData.reduce((prev, curr) => (prev.temp > curr.temp ? prev : curr))];
            break;
        default:
            break;
    }

    displayForecast(filteredData);
}

function resetFilter() {
    displayForecast();
}

function toggleUnit() {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    document.getElementById('unit-toggle').textContent = `Switch to ${currentUnit === 'metric' ? 'Fahrenheit' : 'Celsius'}`;
    if (currentWeatherData && currentForecastData) {
        fetchWeather(currentWeatherData.name);
    }
}

// Chart Updates
function updateCharts(forecastData) {
    // Extract data for the charts
    const dates = forecastData.map(day => day.date.toLocaleDateString());
    const temps = forecastData.map(day => day.temp);
    const conditions = forecastData.map(day => day.description);

    // Destroy existing charts if they exist
    // if (window.barChart) window.barChart.destroy();
    // if (window.doughnutChart) window.doughnutChart.destroy();
    // if (window.lineChart) window.lineChart.destroy();

    // Temperature Bar Chart
    window.barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Temperature',
                data: temps,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // Weather Conditions Doughnut Chart
    const conditionCounts = conditions.reduce((acc, condition) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
    }, {});

    window.doughnutChart = new Chart(document.getElementById('doughnutChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(conditionCounts),
            datasets: [{
                data: Object.values(conditionCounts),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true
        }
    });

    // Temperature Line Chart
    window.lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Temperature',
                data: temps,
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Call updateCharts after fetching and processing forecast data
async function fetchWeather(city) {
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}`);
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${currentUnit}`);

    if (weatherResponse.ok && forecastResponse.ok) {
        currentWeatherData = await weatherResponse.json();
        currentForecastData = await forecastResponse.json();

        displayWeather(currentWeatherData);
        processForecastData(currentForecastData);
        displayForecast();
        updateCharts(forecastData); // Update charts with the forecast data
    } else {
        alert('City not found!');
    }
}

getLocation();
