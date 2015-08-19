goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');
goog.require('ol.tilegrid.TileGrid');


var accessToken =
    'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        tileGrid: new ol.tilegrid.TileGrid({
          origin: [-20037508.342789244, 20037508.342789244],
          resolutions: [
            156543.03392804097,
            4891.96981025128,
            152.8740565703525,
            4.777314267823516
          ],
          tileSize: 4096
        }),
        tileLoadFunction: function(tile, src) {
          tile.getImage().src = 'data/icon.png';
        },
        url: 'http://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
            '{z}/{x}/{y}.vector.pbf?access_token=' + accessToken
      })
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
