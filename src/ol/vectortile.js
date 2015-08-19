goog.provide('ol.VectorTile');

goog.require('goog.array');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileLoadFunctionType');
goog.require('ol.TileState');



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {ol.format.Feature} format Feature format.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 */
ol.VectorTile = function(tileCoord, state, src, format, tileLoadFunction) {

  goog.base(this, tileCoord, state);

  /**
   * @private
   * @type {ol.format.Feature}
   */
  this.format_ = format;

  /**
   * @private
   * @type {Array.<ol.Feature>}
   */
  this.features_ = null;

  /**
   * @private
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction_ = tileLoadFunction;

};
goog.inherits(ol.VectorTile, ol.Tile);


/**
 * @inheritDoc
 */
ol.VectorTile.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
};


/**
 * Get the feature format assigned for reading this tile's features.
 * @return {ol.format.Feature} Feature format.
 * @api
 */
ol.VectorTile.prototype.getFormat = function() {
  return this.format_;
};


/**
 * @inheritDoc
 * @api
 */
ol.VectorTile.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * @inheritDoc
 */
ol.VectorTile.prototype.getKey = function() {
  return this.url;
};


/**
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @param {ol.proj.Projection} projection Projection.
 */
ol.VectorTile.prototype.load = function(tileGrid, projection) {
  this.tileLoadFunction_(this, this.url);
  this.loader_(tileGrid.getTileCoordExtent(this.tileCoord),
      tileGrid.getResolution(this.tileCoord[0]), projection);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 */
ol.VectorTile.prototype.setFeatures = function(features) {
  this.features_ = features;
};


/**
 * Set the feeature loader for reading this tile's features.
 * @param {ol.FeatureLoader} loader Feature loader.
 * @api
 */
ol.VectorTile.prototype.setLoader = function(loader) {
  this.loader_ = loader;
};
