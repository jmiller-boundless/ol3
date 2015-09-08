goog.provide('ol.renderer.canvas.VectorTileLayer');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.ViewHint');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj.Units');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.vector');
goog.require('ol.size');
goog.require('ol.source.VectorTile');
goog.require('ol.tilecoord');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.Vector} layer Vector layer.
 */
ol.renderer.canvas.VectorTileLayer = function(layer) {

  goog.base(this, layer);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D();

  /**
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;

  /**
   * @private
   * @type {Array.<ol.VectorTile>}
   */
  this.renderedTiles_ = [];

  /**
   * @private
   * @type {ol.Extent}
   */
  this.tmpExtent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {ol.Size}
   */
  this.tmpSize_ = [NaN, NaN];

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.tmpTransform_ = goog.vec.Mat4.createNumber();

};
goog.inherits(ol.renderer.canvas.VectorTileLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.composeFrame =
    function(frameState, layerState, context) {

  var pixelRatio = frameState.pixelRatio;
  var skippedFeatureUids = layerState.managed ?
      frameState.skippedFeatureUids : {};
  var viewState = frameState.viewState;
  var center = viewState.center;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var rotation = viewState.rotation;
  var source = this.getLayer().getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');

  var transform = this.getTransform(frameState, 0);

  this.dispatchPreComposeEvent(context, frameState, transform);

  var layer = this.getLayer();
  var replayContext;
  if (layer.hasListener(ol.render.EventType.RENDER)) {
    // resize and clear
    this.context_.canvas.width = context.canvas.width;
    this.context_.canvas.height = context.canvas.height;
    replayContext = this.context_;
  } else {
    replayContext = context;
  }
  // for performance reasons, context.save / context.restore is not used
  // to save and restore the transformation matrix and the opacity.
  // see http://jsperf.com/context-save-restore-versus-variable
  var alpha = replayContext.globalAlpha;
  replayContext.globalAlpha = layerState.opacity;

  var tilesToDraw = this.renderedTiles_;
  var tileGrid = source.getTileGrid();

  var currentZ, i, ii, origin, scale, tile, tileExtent, tileSize;
  var tilePixelRatio, tilePixelResolution, tilePixelSize, tileResolution;
  for (i = 0, ii = tilesToDraw.length; i < ii; ++i) {
    tile = tilesToDraw[i];
    currentZ = tile.getTileCoord()[0];
    tileSize = tileGrid.getTileSize(currentZ);
    tilePixelSize = source.getTilePixelSize(currentZ, pixelRatio, projection);
    tilePixelRatio = tilePixelSize[0] /
        ol.size.toSize(tileGrid.getTileSize(currentZ), this.tmpSize_)[0];
    tileResolution = tileGrid.getResolution(currentZ);
    tilePixelResolution = tileResolution / tilePixelRatio;
    if (tile.getProjection().getUnits() == ol.proj.Units.TILE_PIXELS) {
      origin = ol.extent.getTopLeft(tileGrid.getTileCoordExtent(
          tile.getTileCoord(), this.tmpExtent_));
      transform = ol.vec.Mat4.makeTransform2D(this.tmpTransform_,
          pixelRatio * frameState.size[0] / 2,
          pixelRatio * frameState.size[1] / 2,
          pixelRatio * tilePixelResolution / resolution,
          pixelRatio * tilePixelResolution / resolution,
          viewState.rotation,
          (origin[0] - center[0]) / tilePixelResolution,
          (center[1] - origin[1]) / tilePixelResolution);
    }
    tile.getReplayState().replayGroup.replay(replayContext, pixelRatio,
        transform, rotation, skippedFeatureUids);
  }

  if (replayContext != context) {
    this.dispatchRenderEvent(replayContext, frameState, transform);
    context.drawImage(replayContext.canvas, 0, 0);
  }
  replayContext.globalAlpha = alpha;

  this.dispatchPostComposeEvent(context, frameState, transform);
};


/**
 * @param {ol.VectorTile} tile Tile.
 * @param {ol.layer.VectorTile} layer Vector tile layer.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {boolean} Success.
 */
ol.renderer.canvas.VectorTileLayer.prototype.createReplayGroup = function(tile,
    layer, resolution, pixelRatio) {
  var revision = layer.getRevision();
  var renderOrder = layer.getRenderOrder();
  if (!goog.isDef(renderOrder)) {
    renderOrder = ol.renderer.vector.defaultOrder;
  }

  var replayState = tile.getReplayState();
  if (!replayState.dirty &&
      replayState.renderedResolution == resolution &&
      replayState.renderedRevision == revision &&
      replayState.renderedRenderOrder == renderOrder) {
    return false;
  }

  // FIXME dispose of old replayGroup in post render
  goog.dispose(replayState.replayGroup);
  replayState.replayGroup = null;
  replayState.dirty = false;

  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');
  var tileGrid = source.getTileGrid();
  var pixelSpace = tile.getProjection().getUnits() == ol.proj.Units.TILE_PIXELS;
  var extent = pixelSpace ?
      [0, 0].concat(source.getTilePixelSize(
          tileGrid.getZForResolution(resolution), pixelRatio,
              tile.getProjection())) :
      tileGrid.getTileCoordExtent(tile.getTileCoord());
  var tileResolution = pixelSpace ? source.getTilePixelRatio() : resolution;
  var replayGroup = new ol.render.canvas.ReplayGroup(
      ol.renderer.vector.getTolerance(tileResolution, pixelRatio), extent,
      tileResolution, layer.getRenderBuffer());

  /**
   * @param {ol.Feature} feature Feature.
   * @this {ol.renderer.canvas.VectorTileLayer}
   */
  function renderFeature(feature) {
    var styles;
    if (goog.isDef(feature.getStyleFunction())) {
      styles = feature.getStyleFunction().call(feature, resolution);
    } else if (goog.isDef(layer.getStyleFunction())) {
      styles = layer.getStyleFunction()(feature, resolution);
    }
    if (goog.isDefAndNotNull(styles)) {
      var dirty = this.renderFeature(
          feature, tileResolution, pixelRatio, styles, replayGroup);
      replayState.dirty = replayState.dirty || dirty;
      this.dirty_ = this.dirty_ || replayState.dirty;
    }
  }

  var features = tile.getFeatures();
  if (!goog.isNull(renderOrder)) {
    goog.array.sort(features, renderOrder);
  }
  goog.array.forEach(features, renderFeature, this);

  replayGroup.finish();

  replayState.renderedResolution = resolution;
  replayState.renderedRevision = revision;
  replayState.renderedRenderOrder = renderOrder;
  replayState.replayGroup = replayGroup;

  return true;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.forEachFeatureAtCoordinate =
    function(coordinate, frameState, callback, thisArg) {
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var layer = this.getLayer();
  var layerState = frameState.layerStates[goog.getUid(layer)];
  /** @type {Object.<string, boolean>} */
  var features = {};

  var replayables = this.renderedTiles_;
  var found, tileSpaceCoordinate;
  var i, ii, origin, replayGroup, source;
  var tile, tileCoord, tileExtent, tilePixelRatio, tileResolution, tileSize;
  for (i = 0, ii = replayables.length; i < ii; ++i) {
    tile = replayables[i];
    tileCoord = tile.getTileCoord();
    source = layer.getSource();
    goog.asserts.assertInstanceof(source, ol.source.VectorTile,
        'Source is an ol.source.VectorTile');
    tileExtent = source.getTileGrid().getTileCoordExtent(tileCoord);
    if (!ol.extent.containsCoordinate(tileExtent, coordinate)) {
      continue;
    }
    if (tile.getProjection().getUnits() === ol.proj.Units.TILE_PIXELS) {
      origin = ol.extent.getTopLeft(
          source.getTileGrid().getTileCoordExtent(tileCoord));
      tilePixelRatio = source.getTilePixelRatio();
      tileResolution = resolution / tilePixelRatio;
      tileSize = ol.size.toSize(
          source.getTileGrid().getTileSize(tileCoord[0]));
      tileSpaceCoordinate = [
        (coordinate[0] - origin[0]) / tileResolution,
        (origin[1] - coordinate[1]) / tileResolution
      ];
      resolution = tilePixelRatio;
    } else {
      tileSpaceCoordinate = coordinate;
    }
    replayGroup = tile.getReplayState().replayGroup;
    found = found || replayGroup.forEachFeatureAtCoordinate(
        tileSpaceCoordinate, resolution, rotation,
        layerState.managed ? frameState.skippedFeatureUids : {},
        /**
         * @param {ol.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          goog.asserts.assert(goog.isDef(feature), 'received a feature');
          var key = goog.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        });
  }
  return found;
};


/**
 * Handle changes in image style state.
 * @param {goog.events.Event} event Image style change event.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.handleStyleImageChange_ =
    function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.prepareFrame =
    function(frameState, layerState) {
  var layer = /** @type {ol.layer.Vector} */ (this.getLayer());
  goog.asserts.assertInstanceof(layer, ol.layer.VectorTile,
      'layer is an instance of ol.layer.VectorTile');

  var animating = frameState.viewHints[ol.ViewHint.ANIMATING];
  var interacting = frameState.viewHints[ol.ViewHint.INTERACTING];
  var updateWhileAnimating = layer.getUpdateWhileAnimating();
  var updateWhileInteracting = layer.getUpdateWhileInteracting();

  if (!this.dirty_ && (!updateWhileAnimating && animating) ||
      (!updateWhileInteracting && interacting)) {
    return true;
  }

  var extent = frameState.extent;
  if (goog.isDef(layerState.extent)) {
    extent = ol.extent.getIntersection(extent, layerState.extent);
  }
  if (ol.extent.isEmpty(extent)) {
    // Return false to prevent the rendering of the layer.
    return false;
  }

  var viewState = frameState.viewState;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var pixelRatio = frameState.pixelRatio;

  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');
  var tileGrid = source.getTileGrid();
  var z = tileGrid.getZForResolution(resolution);
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, resolution);
  this.updateUsedTiles(frameState.usedTiles, source, z, tileRange);
  this.manageTilePyramid(frameState, source, tileGrid, pixelRatio,
      projection, extent, z, layer.getPreload());
  this.scheduleExpireCache(frameState, source);
  this.updateAttributions(
      frameState.attributions, source.getAttributions());
  this.updateLogos(frameState, source);

  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var findLoadedTiles = this.createLoadedTileFinder(source, tilesToDrawByZ);

  var useInterimTilesOnError = layer.getUseInterimTilesOnError();

  var tmpExtent = this.tmpExtent_;
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, fullyLoaded, tile, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tile = source.getTile(z, x, y, pixelRatio, projection);
      tileState = tile.getState();
      if (tileState == ol.TileState.LOADED ||
          tileState == ol.TileState.EMPTY ||
          (tileState == ol.TileState.ERROR && !useInterimTilesOnError)) {
        tilesToDrawByZ[z][ol.tilecoord.toString(tile.tileCoord)] = tile;
        continue;
      }

      fullyLoaded = tileGrid.forEachTileCoordParentTileRange(
          tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
      if (!fullyLoaded) {
        childTileRange = tileGrid.getTileCoordChildTileRange(
            tile.tileCoord, tmpTileRange, tmpExtent);
        if (!goog.isNull(childTileRange)) {
          findLoadedTiles(z + 1, childTileRange);
        }
      }

    }
  }

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);
  var replayables = [];
  var i, ii, currentZ, tileCoordKey, tilesToDraw;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    currentZ = zs[i];
    tilesToDraw = tilesToDrawByZ[currentZ];
    for (tileCoordKey in tilesToDraw) {
      tile = tilesToDraw[tileCoordKey];
      if (tile.getState() == ol.TileState.LOADED) {
        replayables.push(tile);
      }
    }
  }

  for (i = 0, ii = replayables.length; i < ii; ++i) {
    tile = replayables[i];
    this.dirty_ = this.createReplayGroup(tile, layer, resolution, pixelRatio) ||
        this.dirty_;
  }

  this.renderedTiles_ = replayables;

  return true;
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Array.<ol.style.Style>} styles Array of styles
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
ol.renderer.canvas.VectorTileLayer.prototype.renderFeature =
    function(feature, resolution, pixelRatio, styles, replayGroup) {
  if (!goog.isDefAndNotNull(styles)) {
    return false;
  }
  var i, ii, loading = false;
  for (i = 0, ii = styles.length; i < ii; ++i) {
    loading = ol.renderer.vector.renderFeature(
        replayGroup, feature, styles[i],
        ol.renderer.vector.getSquaredTolerance(resolution, pixelRatio),
        this.handleStyleImageChange_, this) || loading;
  }
  return loading;
};
