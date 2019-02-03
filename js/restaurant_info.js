let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        keyboard: false,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiaHBkeSIsImEiOiJjanJkYnR4ajcwMnE1NGJtamlzMm16M2V5In0.vcw6AbTEzC1GVTtpV9_wJQ',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);

      removeMapsAttributionFromTabOrder();
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

let removeMapsAttributionFromTabOrder = function(){
    removeFromTabOrder(document.getElementsByClassName("leaflet-control-attribution")[0].children);
    removeFromTabOrder(document.getElementsByClassName("leaflet-control-zoom-in"));
    removeFromTabOrder(document.getElementsByClassName("leaflet-control-zoom-out"));
}
let removeFromTabOrder = function(elements){
    if(!elements) return;
    for (var i = 0; i < elements.length; i++) {
        elements[i].setAttribute('tabindex', '-1');
    }
}
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute('aria-label', 'restaurants name: ' + restaurant.name);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label', 'address: ' + restaurant.address);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = "Restaurant: " + restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSetUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.setAttribute('aria-label', 'cuisine type: ' + restaurant.cuisine_type);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');

  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);
    row.setAttribute('tabindex', '0');

    let times = operatingHours[key].split(',');
    const time = document.createElement('td');
    time.classList.add('times');
    for(let i = 0; i < times.length; i++){
        let timeDiv = document.createElement('div');
        timeDiv.classList.add('timeDiv');
        let innerHtml = times[i];
        if((i + 1) < times.length){
            innerHtml += ", ";
        }
        timeDiv.innerHTML = innerHtml;
        time.appendChild(timeDiv);
    }
    // times.forEach(t => {
    //   let timeDiv = document.createElement('div');
    //
    //   timeDiv.innerHTML = t;
    //   time.appendChild(timeDiv);
    // })
    // time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.classList.add('review-item');
  li.setAttribute('tabindex', '0');

  const reviewMeta = document.createElement('div');
  reviewMeta.classList.add('review-meta');
  const name = document.createElement('p');
  name.classList.add('reviewer');
  name.innerHTML = review.name;
  reviewMeta.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  reviewMeta.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  reviewMeta.appendChild(rating);
  li.appendChild(reviewMeta);

  const reviewText = document.createElement('div');
  reviewText.classList.add('review-text');
  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  reviewText.appendChild(comments);
  li.appendChild(reviewText);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
