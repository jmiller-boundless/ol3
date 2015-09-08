goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.layer.VectorTile');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');


// Mapbox access token - request your own at http://mabobox.com
var accessToken =
    'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

var constants = {
  '@sans': '"Open Sans", "Arial Unicode MS"',
  '@land': '#f8f4f0',
  '@water': '#a0c8f0',
  '@admin': '#9e9cab',
  '@admin-opacity': 0.5,
  '@park': '#d8e8c8',
  '@cemetery': '#e0e4dd',
  '@hospital': '#fde',
  '@school': '#f0e8f8',
  '@wood': '#6a4',
  '@building': '#f2eae2',
  '@building_shadow': '#dfdbd7',
  '@aeroway': '#f0ede9',
  '@motorway': '#fc8',
  '@motorway_casing': '#e9ac77',
  '@motorway_tunnel': '#ffdaa6',
  '@main': '#fea',
  '@main_tunnel': '#fff4c6',
  '@street': '#fff',
  '@street_limited': '#f3f3f3',
  '@street_casing': '#cfcdca',
  '@path': '#cba',
  '@rail': '#bbb',
  '@text': '#334',
  '@text_halo': 'rgba(255,255,255,0.8)',
  '@marine_text': '#74aee9',
  '@marine_text_halo': 'rgba(255,255,255,0.7)',
  '@poi_text': '#666',
  '@poi_text_halo': '#ffffff',
  '@maki': '#666',
  '@point_translate': [0, -30],
  '@motorway_width': {
    'base': 1.2,
    'stops': [[6.5, 0], [7, 0.5], [20, 18]]
  },
  '@motorway_casing_width': {
    'base': 1.2,
    'stops': [[5, 0.4], [6, 0.6], [7, 1.5], [20, 22]]
  },
  '@motorway_link_width': {
    'base': 1.2,
    'stops': [[12.5, 0], [13, 1.5], [20, 10]]
  },
  '@motorway_link_casing_width': {
    'base': 1.2,
    'stops': [[12, 1], [13, 3], [20, 13]]
  },
  '@main_width': {
    'base': 1.2,
    'stops': [[6.5, 0], [7, 0.5], [20, 14]]
  },
  '@main_casing_width': {
    'base': 1.2,
    'stops': [[5, 0.1], [6, 0.2], [7, 1.5], [20, 18]]
  },
  '@street_width': {
    'base': 1.2,
    'stops': [[13.5, 0], [14, 2.5], [20, 11.5]]
  },
  '@street_casing_width': {
    'base': 1.2,
    'stops': [[12, 0.5], [13, 1], [14, 4], [20, 15]]
  },
  '@service_casing_width': {
    'base': 1.2,
    'stops': [[15, 1], [16, 4], [20, 11]]
  },
  '@service_width': {
    'base': 1.2,
    'stops': [[15.5, 0], [16, 2], [20, 7.5]]
  },
  '@path_width': {
    'base': 1.2,
    'stops': [[15, 1.2], [20, 4]]
  },
  '@rail_width': {
    'base': 1.4,
    'stops': [[14, 0.4], [15, 0.75], [20, 2]]
  },
  '@rail_hatch_width': {
    'base': 1.4,
    'stops': [[14.5, 0], [15, 3], [20, 8]]
  },
  '@admin_level_3_width': {
    'base': 1,
    'stops': [[4, 0.4], [5, 1], [12, 3]]
  },
  '@admin_level_2_width': {
    'base': 1,
    'stops': [[4, 1.4], [5, 2], [12, 8]]
  }
};

var map;

var hexRegEx = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
function alphaColor(hex, alpha) {
  if (hex.length == 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  var result = hexRegEx.exec(hex);
  result.unshift();
  result[0] = parseInt(result[1], 16);
  result[1] = parseInt(result[2], 16);
  result[2] = parseInt(result[3], 16);
  result[3] = alpha;
  return result;
}

function base(value) {
  return value.base;
}

var polygon = new ol.style.Style({
  fill: new ol.style.Fill({
    color: ''
  })
});
var filledPolygon = new ol.style.Style({
  fill: new ol.style.Fill({
    color: ''
  }),
  stroke: new ol.style.Stroke({
    color: '',
    width: 1
  })
});
var line = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '',
    width: 1
  })
});
var text = new ol.style.Style({
  text: new ol.style.Text({
    text: '',
    fill: new ol.style.Fill({
      color: ''
    }),
    stroke: new ol.style.Stroke({
      color: '',
      width: 1
    })
  })
});
var styles = [];
function styleFunction(feature, resolution) {
  var length = 0;
  var layer = feature.get('layer');
  var cls = feature.get('class');
  var type = feature.get('type');
  var scalerank = feature.get('scalerank');
  var labelrank = feature.get('labelrank');
  var adminLevel = feature.get('admin_level');
  var maritime = feature.get('maritime');
  var disputed = feature.get('disputed');
  var geom = feature.getGeometry().getType();
  var zoom = map.getView().getZoom();
  if (layer == 'landuse' && cls == 'park') {
    polygon.getFill().setColor(constants['@park']);
    styles[length++] = polygon;
  } else if (layer == 'landuse' && cls == 'cemetery') {
    polygon.getFill().setColor(constants['@cemetery']);
    styles[length++] = polygon;
  } else if (layer == 'landuse' && cls == 'hospital') {
    polygon.getFill().setColor(constants['@hospital']);
    styles[length++] = polygon;
  } else if (layer == 'landuse' && cls == 'school') {
    polygon.getFill().setColor(constants['@school']);
    styles[length++] = polygon;
  } else if (layer == 'landuse' && cls == 'wood') {
    polygon.getFill().setColor(alphaColor(constants['@wood'], 0.1));
    styles[length++] = polygon;
  } else if (layer == 'waterway' &&
      cls != 'river' && cls != 'stream' && cls != 'canal') {
    line.getStroke().setColor(constants['@water']);
    line.getStroke().setWidth(1.3);
    styles[length++] = line;
  } else if (layer == 'waterway' && cls == 'river') {
    line.getStroke().setColor(constants['@water']);
    line.getStroke().setWidth(1.2);
    styles[length++] = line;
  } else if (layer == 'waterway' && (cls == 'stream' || cls == 'canal')) {
    line.getStroke().setColor(constants['@water']);
    line.getStroke().setWidth(1.3);
    styles[length++] = line;
  } else if (layer == 'water') {
    polygon.getFill().setColor(constants['@water']);
    styles[length++] = polygon;
  } else if (layer == 'aeroway' && geom == 'Polygon') {
    polygon.getFill().setColor(alphaColor(constants['@aeroway'], 0.7));
    styles[length++] = polygon;
  } else if (layer == 'aeroway' && geom == 'LineString' && zoom >= 11) {
    line.getStroke().setColor(constants['@aeroway']);
    line.getStroke().setWidth(1.2);
    styles[length++] = line;
  } else if (layer == 'building') {
    filledPolygon.getFill().setColor(constants['@building']);
    filledPolygon.getStroke().setColor(constants['@building_shadow']);
    filledPolygon.getStroke().setWidth(1);
    styles[length++] = filledPolygon;
  } else if (layer == 'tunnel' && cls == 'motorway_link') {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@motorway_link_casing_width']));
    styles[length++] = line;
  } else if (layer == 'tunnel' && cls == 'service') {
    line.getStroke().setColor(constants['@street_casing']);
    line.getStroke().setWidth(base(constants['@service_casing_width']));
    styles[length++] = line;
  } else if (layer == 'tunnel' &&
      (cls == 'street' || cls == 'street_limited')) {
    line.getStroke().setColor(constants['@street_casing']);
    line.getStroke().setWidth(base(constants['@street_casing_width']));
    styles[length++] = line;
  } else if (layer == 'tunnel' && cls == 'main') {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@main_casing_width']));
    styles[length++] = line;
  } else if (layer == 'tunnel' && cls == 'motorway') {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@motorway_casing_width']));
    styles[length++] = line;
  } else if (layer == 'tunnel' && cls == 'path') {
    line.getStroke().setColor(constants['@path']);
    line.getStroke().setWidth(base(constants['@path_width']));
    styles[length++] = line;
  } else if (layer == 'tunnel' && cls == 'major_rail') {
    line.getStroke().setColor(constants['@rail']);
    line.getStroke().setWidth(base(constants['@rail_width']));
    styles[length++] = line;
  } else if (layer == 'road' && cls == 'motorway_link') {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@motorway_link_casing_width']));
    styles[length++] = line;
  } else if (layer == 'road' && (cls == 'street' || cls == 'street_limited') &&
      geom == 'LineString') {
    line.getStroke().setColor(constants['@street_casing']);
    line.getStroke().setWidth(base(constants['@street_casing_width']));
    styles[length++] = line;
  } else if (layer == 'road' && cls == 'main') {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@main_casing_width']));
    styles[length++] = line;
  } else if (layer == 'road' && cls == 'motorway' && zoom >= 5) {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@motorway_casing_width']));
    styles[length++] = line;
  } else if (layer == 'road' && cls == 'path') {
    line.getStroke().setColor(constants['@path']);
    line.getStroke().setWidth(base(constants['@path_width']));
    styles[length++] = line;
  } else if (layer == 'road' && cls == 'major_rail') {
    line.getStroke().setColor(constants['@rail']);
    line.getStroke().setWidth(base(constants['@rail_width']));
    styles[length++] = line;
  } else if (layer == 'bridge' && cls == 'motorway_link') {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@motorway_link_casing_width']));
    styles[length++] = line;
  } else if (layer == 'bridge' && cls == 'motorway') {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@motorway_casing_width']));
    styles[length++] = line;
  } else if (layer == 'bridge' && cls == 'service') {
    line.getStroke().setColor(constants['@street_casing']);
    line.getStroke().setWidth(base(constants['@service_casing_width']));
    styles[length++] = line;
  } else if (layer == 'bridge' &&
      (cls == 'street' || cls == 'street_limited')) {
    line.getStroke().setColor(constants['@street_casing']);
    line.getStroke().setWidth(base(constants['@street_casing_width']));
    styles[length++] = line;
  } else if (layer == 'bridge' && cls == 'main') {
    line.getStroke().setColor(constants['@motorway_casing']);
    line.getStroke().setWidth(base(constants['@main_casing_width']));
    styles[length++] = line;
  } else if (layer == 'bridge' && cls == 'path') {
    line.getStroke().setColor(constants['@path']);
    line.getStroke().setWidth(base(constants['@path_width']));
    styles[length++] = line;
  } else if (layer == 'bridge' && cls == 'major_rail') {
    line.getStroke().setColor(constants['@rail']);
    line.getStroke().setWidth(base(constants['@rail_width']));
    styles[length++] = line;
  } else if (layer == 'admin' && adminLevel >= 3 && maritime === 0) {
    line.getStroke().setColor(constants['@admin']);
    line.getStroke().setWidth(base(constants['@admin_level_3_width']));
    styles[length++] = line;
  } else if (layer == 'admin' && adminLevel == 2 &&
      disputed === 0 && maritime === 0) {
    line.getStroke().setColor(constants['@admin']);
    line.getStroke().setWidth(base(constants['@admin_level_2_width']));
    styles[length++] = line;
  } else if (layer == 'admin' && adminLevel == 2 &&
      disputed === 1 && maritime === 0) {
    line.getStroke().setColor(constants['@admin']);
    line.getStroke().setWidth(base(constants['@admin_level_2_width']));
    styles[length++] = line;
  } else if (layer == 'admin' && adminLevel >= 3 && maritime === 1) {
    line.getStroke().setColor(constants['@water']);
    line.getStroke().setWidth(base(constants['@admin_level_3_width']));
    styles[length++] = line;
  } else if (layer == 'admin' && adminLevel == 2 && maritime === 1) {
    line.getStroke().setColor(constants['@water']);
    line.getStroke().setWidth(base(constants['@admin_level_2_width']));
    styles[length++] = line;
  } else if (layer == 'country_label' && scalerank === 1) {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('bold 11px ' + constants['@sans']);
    text.getText().getFill().setColor(constants['@text']);
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(2);
    styles[length++] = text;
  } else if (layer == 'country_label' && scalerank === 2 && zoom >= 3) {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('bold 10px ' + constants['@sans']);
    text.getText().getFill().setColor(constants['@text']);
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(2);
    styles[length++] = text;
  } else if (layer == 'country_label' && scalerank === 3 && zoom >= 4) {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('bold 9px ' + constants['@sans']);
    text.getText().getFill().setColor(constants['@text']);
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(2);
    styles[length++] = text;
  } else if (layer == 'country_label' && scalerank === 4 && zoom >= 5) {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('bold 8px ' + constants['@sans']);
    text.getText().getFill().setColor(constants['@text']);
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(2);
    styles[length++] = text;
  } else if (layer == 'marine_label' && labelrank === 1 && geom == 'Point') {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('italic 11px ' + constants['@sans']);
    text.getText().getFill().setColor(constants['@marine_text']);
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(0.75);
    styles[length++] = text;
  } else if (layer == 'marine_label' && labelrank === 2 && geom == 'Point') {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('italic 11px ' + constants['@sans']);
    text.getText().getFill().setColor(constants['@marine_text']);
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(0.75);
    styles[length++] = text;
  } else if (layer == 'marine_label' && labelrank === 3 && geom == 'Point') {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('italic 10px ' + constants['@sans']);
    text.getText().getFill().setColor(constants['@marine_text']);
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(0.75);
    styles[length++] = text;
  } else if (layer == 'marine_label' && labelrank === 4 && geom == 'Point') {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('italic 9px ' + constants['@sans']);
    text.getText().getFill().setColor(constants['@marine_text']);
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(0.75);
    styles[length++] = text;
  } else if (layer == 'place_label' && type == 'city' && zoom >= 7) {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('11px ' + constants['@sans']);
    text.getText().getFill().setColor('#333');
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(1.2);
    styles[length++] = text;
  } else if (layer == 'place_label' && type == 'town' && zoom >= 9) {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('9px ' + constants['@sans']);
    text.getText().getFill().setColor('#333');
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(1.2);
    styles[length++] = text;
  } else if (layer == 'place_label' && type == 'village' && zoom >= 12) {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('8px ' + constants['@sans']);
    text.getText().getFill().setColor('#333');
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(1.2);
    styles[length++] = text;
  } else if (layer == 'place_label' && zoom >= 13 &&
      (type == 'hamlet' || type == 'suburb' || type == 'neighbourhood')) {
    text.getText().setText(feature.get('name_en'));
    text.getText().setFont('bold 9px "Arial Narrow"');
    text.getText().getFill().setColor('#633');
    text.getText().getStroke().setColor(constants['@text_halo']);
    text.getText().getStroke().setWidth(1.2);
    styles[length++] = text;
  }
  styles.length = length;
  return styles;
}

map = new ol.Map({
  layers: [
    new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        format: new ol.format.MVT(),
        tileGrid: ol.tilegrid.createXYZ({maxZoom: 22}),
        tilePixelRatio: 16,
        tileUrlFunction: function(tileCoord) {
          return ('http://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
              '{z}/{x}/{y}.vector.pbf?access_token=' + accessToken)
              .replace('{z}', String(tileCoord[0]))
              .replace('{x}', String(tileCoord[1]))
              .replace('{y}', String(-tileCoord[2] - 1))
              .replace('{a-d}', 'abcd'.substr(
                  ((tileCoord[1] << tileCoord[0]) + tileCoord[2]) % 4, 1));
        }
      }),
      style: styleFunction
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [1823849, 6143760],
    zoom: 11
  })
});
