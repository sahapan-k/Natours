/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicGFha2t1bmciLCJhIjoiY2t2N3FudnN2MXdvMzMwcXA4aHJyaHNyYiJ9.Hm0_1VziFItL_zUdYl2LRA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/paakkung/ckv7wlj4990ea14o8i9awmurg',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((location) => {
    const element = document.createElement('div');
    element.className = 'marker';

    new mapboxgl.Marker({
      element: element,
      anchor: 'bottom',
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
