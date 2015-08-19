goog.provide('ol.layer.VectorTile');

goog.require('ol.layer.Vector');



/**
 * @classdesc
 * Vector tile data that is rendered client-side.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Vector}
 * @param {olx.layer.VectorTileOptions=} opt_options Options.
 * @api
 */
ol.layer.VectorTile = function(opt_options) {

  goog.base(this, /** @type {olx.layer.VectorOptions} */ (opt_options));

};
goog.inherits(ol.layer.VectorTile, ol.layer.Vector);
