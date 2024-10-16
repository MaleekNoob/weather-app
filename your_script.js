
document.getElementById('getWeatherButton').addEventListener('click', () => {
  const city = document.getElementById('cityInput').value.trim();
  const errorElement = document.getElementById('error');
  
  if (city === "") {
    errorElement.textContent = "Please enter a city name.";
    return;
  }

  // Clear previous error and hide weather container
  errorElement.textContent = "";
  document.getElementById('weather-container').style.display = 'none';

  // Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key
  const apiKey = '3f1cbc20c242e84ad5df89b7884034b4';
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('City not found');
      }
      return response.json();
    })
    .then(data => {
      // Update the DOM with fetched data
      document.getElementById('heading-city').textContent = data.name;
      document.getElementById('temperature').textContent = data.main.temp;
      document.getElementById('description').textContent = data.weather[0].description;

      const iconCode = data.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      document.getElementById('icon').src = iconUrl;
      document.getElementById('icon').alt = data.weather[0].description;

      // Show the weather container
      document.getElementById('weather-container').style.display = 'block';
    })
    .catch(error => {
      errorElement.textContent = error.message;
    });
});
