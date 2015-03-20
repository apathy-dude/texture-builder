(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var gamejs = require('gamejs');
var menuBuilder = require('./src/menuBuilder');
var plumb = require('./src/jsPlumbInstance');
var conn = require('./src/connectors');

var layerControl = require('./src/layers/component/control');
var numberComponent = require('./src/layers/component/numberInput');
var layerOptions = require('./src/layers');

//Preload image and sound assets
gamejs.preload(require('./src/images'));

var BORDER_WIDTH = 1;

var wrapper;
var surface;

var layers = {};

var OUTPUT_ID = 'output';

function onchange(e) {
    function runHandle(listeners) {
        for(var l in listeners) {
            if(listeners[l] instanceof Object && !(listeners[l] instanceof Function))
                runHandle(listeners[l]);
            else if(listeners[l] instanceof Function && l === 'handle')
                listeners[l]();
        }
    }

    for(var l in layers)
        runHandle(layers[l].listeners);

    surface = renderSurface(layers);
}

function outputLayer() {
    var menu = menuBuilder([285, 150], 'metal');
    menu.children[1].innerHTML = 'Output';
    var menuCenter = menu.children[4];
    menu.id = OUTPUT_ID;

    var listeners = {
        size: {}
    };

    var controls = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        var addLayerDiv = (function() {
            var zIndex = 1;
            var div = document.createElement('div');
            div.innerHTML = 'Add: ';

            var title = (function() {
                var div = document.createElement('div');
                div.innerHTML = 'Add Layer';

                return div;
            })();

            var type = (function() {
                var select = document.createElement('select');

                function createOption(name, value) {
                    var option = document.createElement('option');
                    option.innerHTML = name;
                    option.value = value;
                    return option;
                }

                for(var l in layerOptions)
                    select.appendChild(createOption(layerOptions[l].name, l));

                return select;
            })();

            var add = (function() {
                var button = document.createElement('input');
                button.type = 'button';
                button.value = '+';
                button.style.marginLeft = '16px';

                button.onclick = function(e) {
                    var t = layerOptions[type.value];
                    var lay = t.layer(onchange, layerControl(layers, onchange));
                    layers[lay.div.id] = lay;

                    lay.div.style.zIndex = zIndex * 2;
                    for(var c in lay.connectors)
                        lay.connectors[c].canvas.style.zIndex = zIndex * 2 + 1;
                    zIndex++;

                    wrapper.appendChild(lay.div);
                    plumb.repaintEverything(); //TODO: find way to only update source

                    onchange(e);
                };

                return button;
            })();

            div.appendChild(type);
            div.appendChild(add);

            return div;
        })();

        var size = numberComponent(listeners.size, onchange, 'Size: ', 64, 8);

        var exportImage = (function() {
            var button = document.createElement('input');
            button.type = 'button';
            button.value = 'Export';

            button.onclick = function(e) {
                if(surface)
                    window.open(surface._canvas.toDataURL());
            };

            return button;
        })();

        div.appendChild(addLayerDiv);
        div.appendChild(size);
        div.appendChild(exportImage);

        return div;
    })();

    menuCenter.appendChild(controls);

    function render(data, size) {
        if(surface)
            surface.clear();

        if(obj.inputLayer) {
            var surf = data.inputLayer.render(obj.inputLayer, size);
            if(surf)
                surface = surf;
        }

        return surface;
    }

    function addSource(data, source, target) {
        data.inputLayer = source;
    }

    function removeSource(data, target) {
        data.inputLayer = undefined;
    }

    var obj = { div: menu, listeners: listeners, inputLayer: undefined, render: render, addSource: addSource, removeSource: removeSource };

    return obj;
}

function renderSurface(layers) {
    if(!layers || !layers[OUTPUT_ID])
        return false;

    var size = layers[OUTPUT_ID].listeners.size.value();

    return layers[OUTPUT_ID].render(layers[OUTPUT_ID], size);
}

function render(surface) {
    if(!surface)
        return;

    var display = gamejs.display.getSurface();
    display.clear();
    var width = display.getSize()[0];
    var height = display.getSize()[1];

    var size = surface.getSize();

    for(var xMod = 0; xMod * size[0] < width; xMod ++)
        for(var yMod = 0; yMod * size[1] < height; yMod ++)
            display.blit(surface, [xMod * size[0], yMod * size[1]]);
}

gamejs.ready(function() {
    var wrapper = document.getElementById('gjs-canvas-wrapper');

    //document.getElementById('gjs-fullscreen-toggle').style.display = 'block';
    wrapper.style.display = 'block';

    var width = window.innerWidth - BORDER_WIDTH * 2;
    var height = window.innerHeight - BORDER_WIDTH * 2;

    //gamejs.display.setMode([width, height], gamejs.display.FULLSCREEN);
    gamejs.display.setMode([width, height]);

    jsPlumb.bind('ready', function() {
        var output = outputLayer();
        layers[output.div.id] = output;
        wrapper.appendChild(output.div);
        var out = plumb.addEndpoint(OUTPUT_ID, conn.target, conn.targetMid);

        // Hard coding zIndex
        output.div.style.zIndex = 0;
        out.canvas.style.zIndex = 1;

        plumb.bind('click', function(conn) {
            plumb.detach(conn);
        });

        plumb.bind('connection', function(conn) {
            var source = layers[conn.sourceId];
            layers[conn.targetId].addSource(layers[conn.targetId], source, conn.targetEndpoint.id, conn.connection.id);
            onchange();
        });

        plumb.bind('beforeDetach', function(conn) {
            var target = layers[conn.targetId];
            if(target)
                target.removeSource(target, conn.id);
            onchange();
        });
    });
});

gamejs.onTick(function() {
    if(!surface)
        surface = renderSurface(surface, layers);

    if(!wrapper)
        wrapper = document.getElementById('gjs-canvas-wrapper');

    render(surface);
});

},{"./src/connectors":53,"./src/images":54,"./src/jsPlumbInstance":55,"./src/layers":56,"./src/layers/component/control":58,"./src/layers/component/numberInput":59,"./src/menuBuilder":68,"gamejs":2}],2:[function(require,module,exports){
var matrix = require('./gamejs/math/matrix');
var objects = require('./gamejs/utils/objects');
var Callback = require('./gamejs/utils/callback').Callback;

/**
 * @fileoverview  `gamejs.ready()` is maybe the most important function as it kickstarts your app:
 *
 *     var gamejs = require('gamejs');
 *     ready(function() {
 *         gamejs.logging.info('I am ready!')
 *     });
 *
 * If you use images or sounds preload all assets with `gamejs.preload(['./files/foo.png'])` before calling `ready()`.
 *
 * Also in this module is the `Rect` class which is generally useful when dealing with Surfaces and simple rectangles (e.g. for collisions).
 */
// preloading stuff
var gamejs = exports;
var RESOURCES = {};
/**
 * @ignore
 */
exports.thread = require('./gamejs/thread');


/**
 * ReadyFn is called once all modules and assets are loaded.
 * @param {Function} callbackFunction the function to be called once gamejs finished loading
 * @name ready
 */
if (gamejs.thread.inWorker === true) {
   exports.ready = function(readyFn) {
      require('./gamejs/thread')._ready();
      gamejs.init();
      readyFn();
   };
} else {
   exports.ready = function(readyFn) {

      var getMixerProgress = null;
      var getImageProgress = null;

      // init time instantly - we need it for preloaders
      gamejs.time.init();

      // 2.
      function _ready() {
         if (!document.body) {
            return window.setTimeout(_ready, 50);
         }
         getImageProgress = gamejs.image.preload(RESOURCES);
         try {
            getMixerProgress = gamejs.audio.preload(RESOURCES);
         } catch (e) {
            gamejs.debug('Error loading audio files ', e);
         }
         window.setTimeout(_readyResources, 50);
      }

      // 3.
      function _readyResources() {
         if (getImageProgress() < 1 || getMixerProgress() < 1) {
            return window.setTimeout(_readyResources, 100);
         }
         gamejs.display.init();
         gamejs.image.init();
         gamejs.audio.init();
         gamejs.event.init();
         gamejs.math.random.init();
         readyFn();
      }

      // 1.
      window.setTimeout(_ready, 13);

      function getLoadProgress() {
         if (getImageProgress) {
            return (0.5 * getImageProgress()) + (0.5 * getMixerProgress());
         }
         return 0.1;
      }

      return getLoadProgress;
   };
}

/**
 * Initialize all gamejs modules. This is automatically called
 * by `gamejs.ready()`.
 * @returns {Object} the properties of this objecte are the moduleIds that failed, they value are the exceptions
 * @ignore
 */
exports.init = function() {
   var errorModules = {};
   ['time', 'display', 'image', 'audio', 'event'].forEach(function(moduleName) {
      try {
         gamejs[moduleName].init();
      } catch (e) {
         errorModules[moduleName] = e.toString();
      }
   });
   return errorModules;
};

var resourceBaseHref = function() {
    return (window.$g && window.$g.resourceBaseHref) || document.location.href;
};

/**
 * Preload resources.
 * @param {Array} resources list of resources paths
 * @name preload
 */
var preload = exports.preload = function(resources) {
   var uri = require('./gamejs/utils/uri');
   var baseHref = resourceBaseHref();
   resources.forEach(function(res) {
      RESOURCES[res] = uri.resolve(baseHref, res);
   }, this);
   return;
};

/**
 * The function passed to `onTick` will continously be called at a
 * frequency determined by the browser (typically between 1 and 60 times per second).
 * @param {Function} callbackFunction the function you want to be called
 * @param {Function} callbackScope optional scope for the function call
 */
exports.onTick = function(fn, scope) {
  /** ignore **/
  exports.time._CALLBACKS.push(new Callback(fn, scope));
};

/**
 * Normalize various ways to specify a Rect into {left, top, width, height} form.
 * @ignore
 *
 */
var normalizeRectArguments = exports.normalizeRectArguments = function () {
   var left = 0;
   var top = 0;
   var width = 0;
   var height = 0;

   if (arguments.length === 2) {
      if (arguments[0] instanceof Array && arguments[1] instanceof Array) {
         left = arguments[0][0];
         top = arguments[0][1];
         width = arguments[1][0];
         height = arguments[1][1];
      } else {
         left = arguments[0];
         top = arguments[1];
      }
   } else if (arguments.length === 1 && arguments[0] instanceof Array) {
      left = arguments[0][0];
      top = arguments[0][1];
      width = arguments[0][2];
      height = arguments[0][3];
   } else if (arguments.length === 1 && arguments[0] instanceof Rect) {
      left = arguments[0].left;
      top = arguments[0].top;
      width = arguments[0].width;
      height = arguments[0].height;
   } else if (arguments.length === 4) {
      left = arguments[0];
      top = arguments[1];
      width = arguments[2];
      height = arguments[3];
   } else {
      throw new Error('not a valid rectangle specification');
   }
   return {left: left || 0, top: top || 0, width: width || 0, height: height || 0};
};


/**
 * Creates a Rect. Rects are used to hold rectangular areas. There are a couple
 * of convinient ways to create Rects with different arguments and defaults.
 *
 * Any function that requires a `gamejs.Rect` argument also accepts any of the
 * constructor value combinations `Rect` accepts.
 *
 * Rects are used a lot. They are good for collision detection, specifying
 * an area on the screen (for blitting) or just to hold an objects position.
 *
 * The Rect object has several virtual attributes which can be used to move and align the Rect:
 *
 *   top, left, bottom, right
 *   topleft, bottomleft, topright, bottomright
 *   center
 *   width, height
 *   w,h
 *
 * All of these attributes can be assigned to.
 * Assigning to width or height changes the dimensions of the rectangle; all other
 * assignments move the rectangle without resizing it. Notice that some attributes
 * are Numbers and others are pairs of Numbers.
 *
 * @example
 * new Rect([left, top]) // width & height default to 0
 * new Rect(left, top) // width & height default to 0
 * new Rect(left, top, width, height)
 * new Rect([left, top], [width, height])
 * new Rect(oldRect) // clone of oldRect is created
 *
 * @property {Number} right
 * @property {Number} bottom
 * @property {Number} center
 * @constructor
 * @param {Array|gamejs.Rect} position Array holding left and top coordinates
 * @param {Array} dimensions Array holding width and height
 */
var Rect = exports.Rect = function() {

   var args = normalizeRectArguments.apply(this, arguments);

   /**
    * Left, X coordinate
    * @type Number
    */
   this.left = args.left;

   /**
    * Top, Y coordinate
    * @type Number
    */
   this.top = args.top;

   /**
    * Width of rectangle
    * @type Number
    */
   this.width = args.width;

   /**
    * Height of rectangle
    * @type Number
    */
   this.height = args.height;

   return this;
};

objects.accessors(Rect.prototype, {
   /**
    * Bottom, Y coordinate
    * @name Rect.prototype.bottom
    * @type Number
    */
   'bottom': {
      get: function() {
         return this.top + this.height;
      },
      set: function(newValue) {
         this.top = newValue - this.height;
         return;
      }
   },
   /**
    * Right, X coordinate
    * @name Rect.prototype.right
    * @type Number
    */
   'right': {
      get: function() {
         return this.left + this.width;
      },
      set: function(newValue) {
         this.left = newValue - this.width;
      }
   },
   /**
    * Center Position. You can assign a rectangle form.
    * @name Rect.prototype.center
    * @type Array
    */
   'center': {
      get: function() {
         return [this.left + (this.width / 2) | 0,
                 this.top + (this.height / 2) | 0
                ];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.left = args.left - (this.width / 2) | 0;
         this.top = args.top - (this.height / 2) | 0;
         return;
      }
   },
   /**
    * Top-left Position. You can assign a rectangle form.
    * @name Rect.prototype.topleft
    * @type Array
    */
   'topleft': {
      get: function() {
         return [this.left, this.top];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.left = args.left;
         this.top = args.top;
         return;
      }
   },
   /**
    * Bottom-left Position. You can assign a rectangle form.
    * @name Rect.prototype.bottomleft
    * @type Array
    */
   'bottomleft': {
      get: function() {
         return [this.left, this.bottom];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.left = args.left;
         this.bottom = args.top;
         return;
      }
   },
   /**
    * Top-right Position. You can assign a rectangle form.
    * @name Rect.prototype.topright
    * @type Array
    */
   'topright': {
      get: function() {
         return [this.right, this.top];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.right = args.left;
         this.top = args.top;
         return;
      }
   },
   /**
    * Bottom-right Position. You can assign a rectangle form.
    * @name Rect.prototype.bottomright
    * @type Array
    */
   'bottomright': {
      get: function() {
         return [this.right, this.bottom];
      },
      set: function() {
         var args = normalizeRectArguments.apply(this, arguments);
         this.right = args.left;
         this.bottom = args.top;
         return;
      }
   },
   /**
    * Position x value, alias for `left`.
    * @name Rect.prototype.y
    * @type Array
    */
   'x': {
      get: function() {
         return this.left;
      },
      set: function(newValue) {
         this.left = newValue;
         return;
      }
   },
   /**
    * Position y value, alias for `top`.
    * @name Rect.prototype.y
    * @type Array
    */
   'y': {
      get: function() {
         return this.top;
      },
      set: function(newValue) {
         this.top = newValue;
         return;
      }
   }
});

/**
 * Move returns a new Rect, which is a version of this Rect
 * moved by the given amounts. Accepts any rectangle form.
 * as argument.
 *
 * @param {Number|gamejs.Rect} x amount to move on x axis
 * @param {Number} y amount to move on y axis
 */
Rect.prototype.move = function() {
   var args = normalizeRectArguments.apply(this, arguments);
   return new Rect(this.left + args.left, this.top + args.top, this.width, this.height);
};

/**
 * Move this Rect in place - not returning a new Rect like `move(x, y)` would.
 *
 * `moveIp(x,y)` or `moveIp([x,y])`
 *
 * @param {Number|gamejs.Rect} x amount to move on x axis
 * @param {Number} y amount to move on y axis
 */
Rect.prototype.moveIp = function() {
   var args = normalizeRectArguments.apply(this, arguments);
   this.left += args.left;
   this.top += args.top;
   return;
};

/**
 * Return the area in which this Rect and argument Rect overlap.
 *
 * @param {gamejs.Rect} Rect to clip this one into
 * @returns {gamejs.Rect} new Rect which is completely inside the argument Rect,
 * zero sized Rect if the two rectangles do not overlap
 */
Rect.prototype.clip = function(rect) {
   if(!this.collideRect(rect)) {
      return new Rect(0,0,0,0);
   }

   var x, y, width, height;

   // Left
   if ((this.left >= rect.left) && (this.left < rect.right)) {
      x = this.left;
   } else if ((rect.left >= this.left) && (rect.left < this.right)) {
      x = rect.left;
   }

   // Right
   if ((this.right > rect.left) && (this.right <= rect.right)) {
      width = this.right - x;
   } else if ((rect.right > this.left) && (rect.right <= this.right)) {
      width = rect.right - x;
   }

   // Top
   if ((this.top >= rect.top) && (this.top < rect.bottom)) {
      y = this.top;
   } else if ((rect.top >= this.top) && (rect.top < this.bottom)) {
      y = rect.top;
   }

   // Bottom
   if ((this.bottom > rect.top) && (this.bottom <= rect.bottom)) {
     height = this.bottom - y;
   } else if ((rect.bottom > this.top) && (rect.bottom <= this.bottom)) {
     height = rect.bottom - y;
   }
   return new Rect(x, y, width, height);
};

/**
 * Join two rectangles
 *
 * @param {gamejs.Rect} union with this rectangle
 * @returns {gamejs.Rect} rectangle containing area of both rectangles
 */
Rect.prototype.union = function(rect) {
   var x, y, width, height;

   x = Math.min(this.left, rect.left);
   y = Math.min(this.top, rect.top);
   width = Math.max(this.right, rect.right) - x;
   height = Math.max(this.bottom, rect.bottom) - y;
   return new Rect(x, y, width, height);
};

/**
 * Grow or shrink the rectangle size
 *
 * @param {Number} amount to change in the width
 * @param {Number} amount to change in the height
 * @returns {gamejs.Rect} inflated rectangle centered on the original rectangle's center
 */
Rect.prototype.inflate = function(x, y) {
    var copy = this.clone();

    copy.inflateIp(x, y);

    return copy;
};

/**
 * Grow or shrink this Rect in place - not returning a new Rect like `inflate(x, y)` would.
 *
 * @param {Number} amount to change in the width
 * @param {Number} amount to change in the height
 */
Rect.prototype.inflateIp = function(x, y) {
    // Use Math.floor here to deal with rounding of negative numbers the
    // way this relies on.
    this.left -= Math.floor(x / 2);
    this.top -= Math.floor(y / 2);
    this.width += x;
    this.height += y;
};

/**
 * Check for collision with a point.
 *
 * `collidePoint(x,y)` or `collidePoint([x,y])` or `collidePoint(new Rect(x,y))`
 *
 * @param {Array|gamejs.Rect} point the x and y coordinates of the point to test for collision
 * @returns {Boolean} true if the point collides with this Rect
 */
Rect.prototype.collidePoint = function() {
   var args = normalizeRectArguments.apply(this, arguments);
   return (this.left <= args.left && args.left <= this.right) &&
       (this.top <= args.top && args.top <= this.bottom);
};

/**
 * Check for collision with a Rect.
 * @param {gamejs.Rect} rect the Rect to test check for collision
 * @returns {Boolean} true if the given Rect collides with this Rect
 */
Rect.prototype.collideRect = function(rect) {
   return !(this.left > rect.right || this.right < rect.left ||
      this.top > rect.bottom || this.bottom < rect.top);
};

/**
 * @param {Array} pointA start point of the line
 * @param {Array} pointB end point of the line
 * @returns true if the line intersects with the rectangle
 * @see http://stackoverflow.com/questions/99353/how-to-test-if-a-line-segment-intersects-an-axis-aligned-rectange-in-2d/293052#293052
 *
 */
Rect.prototype.collideLine = function(p1, p2) {
   var x1 = p1[0];
   var y1 = p1[1];
   var x2 = p2[0];
   var y2 = p2[1];

   function linePosition(point) {
      var x = point[0];
      var y = point[1];
      return (y2 - y1) * x + (x1 - x2) * y + (x2 * y1 - x1 * y2);
   }

   var relPoses = [[this.left, this.top],
                   [this.left, this.bottom],
                   [this.right, this.top],
                   [this.right, this.bottom]
                  ].map(linePosition);

   var noNegative = true;
   var noPositive = true;
   var noZero = true;
   relPoses.forEach(function(relPos) {
      if (relPos > 0) {
         noPositive = false;
      } else if (relPos < 0) {
         noNegative = false;
      } else if (relPos === 0) {
         noZero = false;
      }
   }, this);

   if ( (noNegative || noPositive) && noZero) {
      return false;
   }
   return !((x1 > this.right && x2 > this.right) ||
            (x1 < this.left && x2 < this.left) ||
            (y1 < this.top && y2 < this.top) ||
            (y1 > this.bottom && y2 > this.bottom)
            );
};

/**
 * @returns {String} Like "[x, y][w, h]"
 */
Rect.prototype.toString = function() {
   return ["[", this.left, ",", this.top, "]"," [",this.width, ",", this.height, "]"].join("");
};

/**
 * @returns {gamejs.Rect} A new copy of this rect
 */
Rect.prototype.clone = function() {
   return new Rect(this);
};

/**
 * @ignore
 */
exports.event = require('./gamejs/event');
/**
 * @ignore
 */
exports.font = require('./gamejs/font');
/**
 * @ignore
 */
exports.http = require('./gamejs/http');
/**
 * @ignore
 */
exports.image = require('./gamejs/image');
/**
 * @ignore
 */
exports.audio = require('./gamejs/audio');
/**
 * @ignore
 */
exports.graphics = require('./gamejs/graphics');

/**
 * @ignore
 */
exports.logging = require('./gamejs/logging');

/**
 * @ignore
 */
exports.math = {
   matrix: require('./gamejs/math/matrix'),
   vectors: require('./gamejs/math/vectors'),
   angles: require('./gamejs/math/angles'),
   binaryheap: require('./gamejs/math/binaryheap'),
   random: require('./gamejs/math/random'),
   noise: require('./gamejs/math/noise'),
};

/**
 * @ignore
 */
exports.utils = {
   arrays: require('./gamejs/utils/arrays'),
   objects: require('./gamejs/utils/objects'),
   uri: require('./gamejs/utils/uri'),
   strings: require('./gamejs/utils/strings'),
   xml: require('./gamejs/utils/xml'),
   base64: require('./gamejs/utils/base64')
};
/**
 * @ignore
 */
exports.display = require('./gamejs/display');
/**
 * @ignore
 */
exports.pathfinding = require('./gamejs/pathfinding');


/**
 * @ignore
 */
exports.tiledmap = require('./gamejs/tiledmap');


/**
 * @ignore
 */
exports.time = require('./gamejs/time');

/**
 * @ignore
 */
exports.pixelcollision = require('./gamejs/pixelcollision');
},{"./gamejs/audio":3,"./gamejs/display":4,"./gamejs/event":5,"./gamejs/font":6,"./gamejs/graphics":7,"./gamejs/http":8,"./gamejs/image":9,"./gamejs/logging":10,"./gamejs/math/angles":11,"./gamejs/math/binaryheap":12,"./gamejs/math/matrix":13,"./gamejs/math/noise":14,"./gamejs/math/random":15,"./gamejs/math/vectors":16,"./gamejs/pathfinding":17,"./gamejs/pixelcollision":18,"./gamejs/thread":19,"./gamejs/tiledmap":20,"./gamejs/time":21,"./gamejs/utils/arrays":22,"./gamejs/utils/base64":23,"./gamejs/utils/callback":24,"./gamejs/utils/objects":25,"./gamejs/utils/strings":26,"./gamejs/utils/uri":27,"./gamejs/utils/xml":28}],3:[function(require,module,exports){
var gamejs = require('../gamejs');

/**
 * @fileoverview Playing sounds with the html5 audio tag. Audio files must be preloaded
 * with the usual `gamejs.preload()` function. Ogg, wav and webm supported.
 *
 */

var CACHE = {};

/**
 * need to export preloading status for require
 * @ignore
 */
var _PRELOADING = false;

/**
 * @ignore
 */
var NUM_CHANNELS = 8;

/**
 * Sets the number of available channels for the mixer. The default value is 8.
 */
exports.setNumChannels = function(count) {
   NUM_CHANNELS = parseInt(count, 10) || NUM_CHANNELS;
};

exports.getNumChannels = function() {
   return NUM_CHANNELS;
};

/**
 * put all audios on page in cache
 * if same domain as current page, remove common href-prefix
 * @ignore
 */
exports.init = function() {
   var audios = Array.prototype.slice.call(document.getElementsByTagName("audio"), 0);
   addToCache(audios);
   return;
};

/**
 * Preload the audios into cache
 * @param {String[]} List of audio URIs to load
 * @returns {Function} which returns 0-1 for preload progress
 * @ignore
 */
exports.preload = function(audioUrls, showProgressOrImage) {
   var countTotal = 0;
   var countLoaded = 0;

   function incrementLoaded() {
      countLoaded++;
      if (countLoaded == countTotal) {
         _PRELOADING = false;
      }
   }

   function getProgress() {
      return countTotal > 0 ? countLoaded / countTotal : 1;
   }

   function successHandler() {
      addToCache(this);
      incrementLoaded();
   }
   function errorHandler() {
      incrementLoaded();
      throw new Error('Error loading ' + this.src);
   }

   for (var key in audioUrls) {
      if (key.indexOf('wav') == -1 && key.indexOf('ogg') == -1 && key.indexOf('webm') == -1) {
         continue;
      }
      countTotal++;
      var audio = new Audio();
      audio.addEventListener('canplay', successHandler, true);
      audio.addEventListener('error', errorHandler, true);
      audio.src = audioUrls[key];
      audio.gamejsKey = key;
      audio.load();
   }
   if (countTotal > 0) {
      _PRELOADING = true;
   }
   return getProgress;
};

/**
 * @ignore
 */
exports.isPreloading = function() {
   return _PRELOADING;
};

/**
 * @param {dom.ImgElement} audios the <audio> elements to put into cache
 * @ignore
 */
function addToCache(audios) {
   if (!(audios instanceof Array)) {
      audios = [audios];
   }

   var docLoc = document.location.href;
   audios.forEach(function(audio) {
      CACHE[audio.gamejsKey] = audio;
   });
   return;
}

/**
 * Sounds can be played back.
 * @constructor
 * @param {String|dom.AudioElement} uriOrAudio the uri of <audio> dom element
 *                of the sound
 */
exports.Sound = function Sound(uriOrAudio) {
   var cachedAudio;
   if (typeof uriOrAudio === 'string') {
      cachedAudio = CACHE[uriOrAudio];
   } else {
      cachedAudio = uriOrAudio;
   }
   if (!cachedAudio) {
      // TODO sync audio loading
      throw new Error('Missing "' + uriOrAudio + '", gamejs.preload() all audio files before loading');
   }

   var channels = [];
   var i = NUM_CHANNELS;
   while (i-->0) {
      var audio = new Audio();
      audio.preload = "auto";
      audio.loop = false;
      audio.src = cachedAudio.src;
      channels.push(audio);
   }
   /**
    * start the sound
    * @param {Boolean} loop whether the audio should loop for ever or not
    */
   this.play = function(loop) {
      channels.some(function(audio) {
         if (audio.ended || audio.paused) {
            audio.loop = !!loop;
            audio.play();
            return true;
         }
         return false;
      });
   };

   /**
    * Stop the sound.
    * This will stop the playback of this Sound on any active Channels.
    */
   this.stop = function() {
      channels.forEach(function(audio) {
         audio.stop();
      });
   };

   /**
    * Set volume of this sound
    * @param {Number} value volume from 0 to 1
    */
   this.setVolume = function(value) {
      channels.forEach(function(audio) {
         audio.volume = value;
      });
   };

   /**
    * @returns {Number} the sound's volume from 0 to 1
    */
   this.getVolume = function() {
      return channels[0].volume;
   };

   /**
    * @returns {Number} Duration of this sound in seconds
    */
   this.getLength = function() {
      return channels[0].duration;
   };

   return this;
};

},{"../gamejs":2}],4:[function(require,module,exports){
var Surface = require('./graphics').Surface;

/**
 * @fileoverview Methods to create, access and manipulate the display Surface.
 *
 * You can just grab the canvas element whether it exists in the DOM or not (GameJs
 * will create it if necessary):
 *
 *     var display = gamejs.display.getSurface();
 *
 * If you need to resize the canvas - although it is recommended to style it with CSS - you can
 * call the `setMode()` function, which conviniently returns the new display surface:
 *
 *     newDisplay = gamejs.display.setMode([800, 600]);
 *
 * ### Browser window gets resized
 *
 * When the canvas size is configured with CSS, the display surface might change when
 * the browser window is resized. GameJs will internally deal with this and recreate
 * the the display surface with the new size.
 *
 * You will typically not have to worry about this but if you want to get informed
 * about a display resize, you can register a callback with `gamejs.event.onDisplayResize`.
 *
 *
 * ### Flags
 *
 * For advanced uses you can set a few modes which additionally change how the display
 * behaves with regards to pixel smoothing and whether you want a fullscreen canvas with
 * or withouth the mouse pointer locked inside the window (for endless mouse movement in
 * all directions).
 *
 *
 * `gamejs.display.setMode()` understands three flags:
 *
 *   * gamejs.display.FULLSCREEN
 *   * gamejs.display.DISABLE_SMOOTHING
 *   * gamejs.display.POINTERLOCK (implies FULLSCREEN)
 *
 * For example:
 *      // disable smoothing
 *      gamejs.display.setMode([800, 600], gamejs.display.DISABLE_SMOOTHING);
 *      // disable smoothing and fullscreen
 *      gamejs.display.setMode(
               [800, 600],
               gamejs.display.DISABLE_SMOOTHING | gamejs.display.FULLSCREEN
         );
 *
 * ### Fullscreen mode
 *
 * When `setMode()` is called with the fullscreen flag then the fullscreen mode can be enabled by the
 * player by clicking on the DOM element with id "gjs-fullscreen-toggle". Browser security requires
 * that a user enables fullscreen with a "gesture" (e.g., clicking a button) and we can not enable fullscreen
 * in code.
 *
 * Fullscreen mode can be exited by many keys, e.g., anything window manager related (ALT-TAB) or ESC. A lot
 * of keys will trigger a browser information popup explaining how fullscreen mode can be exited.
 *
 * The following keys are "whitelisted" in fullscreen mode and will not trigger such a browser popup:
 *
 *  * left arrow, right arrow, up arrow, down arrow
 *  * space
 *  * shift, control, alt
 *  * page up, page down
 *  * home, end, tab, meta
 *
 *
 * ### Relevant DOM node ids accessed by this module
 *
 * You can provide your own tags with those ids
 *
 *   * gjs-canvas - the display surface
 *   * gjs-loader - loading bar
 *   * gjs-fullscreen-toggle a clickable element to enable fullscreen
 *   * gjs-canvas-wrapper this wrapper is added when in fullscreen mode
 *
 */

var CANVAS_ID = "gjs-canvas";
var LOADER_ID = "gjs-loader";
var SURFACE = null;

/**
 * Pass this flag to `gamejs.display.setMode(resolution, flags)` to disable
 * pixel smoothing; this is, for example, useful for retro-style, low resolution graphics
 * where you don't want the browser to smooth them when scaling & drawing.
 */
var DISABLE_SMOOTHING = exports.DISABLE_SMOOTHING = 2;
var FULLSCREEN = exports.FULLSCREEN = 4;
var POINTERLOCK = exports.POINTERLOCK = 8;

var _flags = 0;

/**
 * @returns {document.Element} the canvas dom element
 * @ignore
 */
var getCanvas = exports._getCanvas = function() {
   var displayCanvas = document.getElementById(CANVAS_ID);
   if (!displayCanvas) {
      displayCanvas = document.createElement("canvas");
      displayCanvas.setAttribute("id", CANVAS_ID);
      document.body.appendChild(displayCanvas);
   }
   return displayCanvas;
};


var getFullScreenToggle = function() {
   var fullScreenButton = document.getElementById('gjs-fullscreen-toggle');
   if (!fullScreenButton) {
      // before canvas
      fullScreenButton = document.createElement('button');
      fullScreenButton.innerHTML = 'Fullscreen';
      fullScreenButton.id = 'gjs-fullscreen-toggle';
      var canvas = getCanvas();
      canvas.parentNode.insertBefore(fullScreenButton, canvas);
      canvas.parentNode.insertBefore(document.createElement('br'), canvas);

   }
   return fullScreenButton;
};

var fullScreenChange = function(event) {
   var gjsEvent ={
      type: isFullScreen() ? require('./event').DISPLAY_FULLSCREEN_ENABLED :
                        require('./event').DISPLAY_FULLSCREEN_DISABLED

   };
   if (isFullScreen()) {
      if (_flags & POINTERLOCK) {
         enablePointerLock();
      }
   }
   require('./event')._triggerCallbacks(gjsEvent);
};

exports.hasPointerLock = function() {
   return !!(document.pointerLockElement ||
      document.webkitFullscreenElement ||
      document.mozFullscreenElement ||
      document.mozFullScreenElement);
};

function onResize(event) {
   var canvas = getCanvas();
   SURFACE._canvas.width = canvas.clientWidth;
   SURFACE._canvas.height = canvas.clientHeight;
   require('./event')._triggerCallbacks({
      type: require('./event').DISPLAY_RESIZE
   });
}

/**
 * Create the master Canvas plane.
 * @ignore
 */
exports.init = function() {
   // create canvas element if not yet present
   var canvas = getCanvas();
   if (!canvas.getAttribute('tabindex')) {
      // to be focusable, tabindex must be set
      canvas.setAttribute("tabindex", 1);
      canvas.focus();
   }
   // remove loader if any;
   var $loader = document.getElementById(LOADER_ID);
   if ($loader) {
      $loader.style.display = "none";
   }
   var $displaySurface = document.getElementById(CANVAS_ID);
   if ($displaySurface) {
      $displaySurface.style.display = 'block';
   }
   // hook into resize
   window.addEventListener("resize", onResize, false);
   return;
};

var isFullScreen = exports.isFullscreen = function() {
   return (document.fullScreenElement || document.mozFullScreen || document.webkitIsFullScreen || document.webkitDisplayingFullscreen);
};

/**
 * Switches the display window normal browser mode and fullscreen.
 * @ignore
 * @returns {Boolean} true if operation was successfull, false otherwise
 */
var enableFullScreen = function(event) {
   var wrapper = document.getElementById('gjs-canvas-wrapper');
   wrapper.requestFullScreen = wrapper.requestFullScreen || wrapper.mozRequestFullScreen || wrapper.webkitRequestFullScreen;
   if (!wrapper.requestFullScreen) {
      return false;
   }
   // @xbrowser chrome allows keboard input onl if ask for it (why oh why?)
   if (Element.ALLOW_KEYBOARD_INPUT) {
      wrapper.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
   } else {
      wrapper.requestFullScreen();
   }
   return true;
};

var enablePointerLock = function() {
   var wrapper = getCanvas();
   wrapper.requestPointerLock = wrapper.requestPointerLock || wrapper.mozRequestPointerLock || wrapper.webkitRequestPointerLock;
   if (wrapper.requestPointerLock) {
      wrapper.requestPointerLock();
   }
};

/** @ignore **/
exports._hasFocus = function() {
   return document.activeElement == getCanvas();
};

/**
 * Set the width and height of the Display. Conviniently this will
 * return the actual display Surface - the same as calling [gamejs.display.getSurface()](#getSurface)
 * later on.
 * @param {Array} dimensions [width, height] of the display surface
 * @param {Number} flags gamejs.display.DISABLE_SMOOTHING | gamejs.display.FULLSCREEN | gamejs.display.POINTERLOCK
 */
exports.setMode = function(dimensions, flags) {
   SURFACE = null;
   var canvas = getCanvas();
   canvas.width = canvas.clientWidth = dimensions[0];
   canvas.height = canvas.clientHeight = dimensions[1];

   _flags = _flags || flags;
   // @ xbrowser firefox allows pointerlock only if fullscreen
   if (_flags & POINTERLOCK) {
      _flags = _flags | FULLSCREEN;
   }
   if (_flags & FULLSCREEN) {
      // attach fullscreen toggle checkbox
      var fullScreenToggle = getFullScreenToggle();
      fullScreenToggle.removeEventListener('click', enableFullScreen, false);
      fullScreenToggle.addEventListener('click', enableFullScreen, false);
      // @@ xbrowser
      document.removeEventListener('fullScreenchange',fullScreenChange, false);
      document.removeEventListener('webkitfullscreenchange',fullScreenChange, false);
      document.removeEventListener('mozfullscreenchange',fullScreenChange, false);
      document.addEventListener('fullscreenchange', fullScreenChange, false);
      document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
      document.addEventListener('mozfullscreenchange', fullScreenChange, false);
   }
   return getSurface(dimensions);
};

/**
 * Set the Caption of the Display (document.title)
 * @param {String} title the title of the app
 * @param {gamejs.Image} icon FIXME implement favicon support
 */
exports.setCaption = function(title, icon) {
   document.title = title;
};

/** @ignore **/
exports._isSmoothingEnabled = function() {
   return !(_flags & DISABLE_SMOOTHING);
};

/**
 * The Display (the canvas element) is most likely not in the top left corner
 * of the browser due to CSS styling. To calculate the mouseposition within the
 * canvas we need this offset.
 * @see gamejs/event
 * @ignore
 *
 * @returns {Array} [x, y] offset of the canvas
 */

exports._getCanvasOffset = function() {
   var boundRect = getCanvas().getBoundingClientRect();
   return [boundRect.left, boundRect.top];
};

/**
 * Drawing on the Surface returned by `getSurface()` will draw on the screen.
 * @returns {gamejs.Surface} the display Surface
 */
var getSurface = exports.getSurface = function(dimensions) {
   if (SURFACE === null) {
      var canvas = getCanvas();
      if (dimensions === undefined) {
         dimensions = [canvas.clientWidth, canvas.clientHeight];
      }
      SURFACE = new Surface(dimensions);
      SURFACE._canvas = canvas;
      SURFACE._canvas.width = dimensions[0];
      SURFACE._canvas.height = dimensions[1];
      SURFACE._context = canvas.getContext('2d');
      if (!(_flags & DISABLE_SMOOTHING)) {
         SURFACE._smooth();
      } else {
         SURFACE._noSmooth();
      }
   }
   return SURFACE;
};

},{"./event":5,"./graphics":7}],5:[function(require,module,exports){
var display = require('./display');
var Callback = require('./utils/callback').Callback;

/**
 * @fileoverview
 * Deal with mouse and keyboard events.
 *
 * You can either handle all events in one callback with `gamejs.event.onEvent()`:
 *
 *     gamejs.onEvent(function(event) {
 *        if (event.type === gamejs.event.MOUSE_UP) {
 *          gamejs.logging.info(event.pos, event.button);
 *        } else if (event.type === gamejs.event.KEY_UP) {
 *          gamejs.logging.info(event.key);
 *        }
 *     });
 *
 * Or recieve more specific callbacks, e.g. only for `KEY\_UP` with  `gamejs.event.onKeyUp()`:
 *
 *     gamejs.onKeyUp(function(event) {
 *          gamejs.logging.info(event.key);
 *     });
 *
 * All events passed to your callback are instances of `gamejs.event.Event` and have a `type` property to help
 * you distinguish between the different events. This `type` property is set to one of those constants:
 *
 *  * gamejs.event.MOUSE\_UP
 *  * gamejs.event.MOUSE\_MOTION
 *  * gamejs.event.MOUSE\_DOWN
 *  * gamejs.event.KEY\_UP
 *  * gamejs.event.KEY\_DOWN
 *  * gamejs.event.DISPLAY\_FULLSCREEN\_ENABLED
 *  * gamejs.event.DISPLAY\_FULLSCREEN\_DISABLED
 *  * gamejs.event.QUIT
 *  * gamejs.event.MOUSE_WHEEL
 *  * gamejs.event.TOUCH\_DOWN
 *  * gamejs.event.TOUCH\_UP
 *  * gamejs.event.TOUCH\_MOTION
 *
 * ### Keyboard constants
 *
 * There are also a lot of keyboard constants for ASCII. Those are all prefixed with `K\_`, e.g. `gamejs.event.K\_a` would be the "a"
 * key and `gamejs.event.K_SPACE` is the spacebar.
 *
 * ## Touch events
 *
 * Touch events do not have a single position but for all `TOUCH\_*` events you get an array of
 * `touches`, which each have their own `pos` attribute and a unique `identifier` for tracking
 * this touch across multiple `TOUCH\_MOTION` events.
 *
 * ## User defined events
 *
 * All user defined events can have the value of `gamejs.event.USEREVENT` or higher.
 * Make sure your custom event ids follow this system.
 *
 * @example
 *     gamejs.onEvent(function(event) {
 *        if (event.type === gamejs.event.MOUSE_UP) {
 *          gamejs.logging.log(event.pos, event.button);
 *        } else if (event.type === gamejs.event.KEY_UP) {
 *          gamejs.logging.log(event.key);
 *        }
 *     });
 *
 */

var _CALLBACKS = [];

/** @ignore **/
var _triggerCallbacks = exports._triggerCallbacks = function() {
  var args = arguments;
  _CALLBACKS.forEach(function(cb) {
    if (cb.type === 'all' || args[0].type === cb.type) {
      cb.callback.apply(cb.scope, args);
    }
  });
};

/*
exports.onQuit(callback)
exports.onVisiblityChange(callback)
*/

/**
 * Pass a callback function to be called when Fullscreen is enabled or disabled.
 * Inspect `event.type` to distinguis between entering and exiting fullscreen.
 *
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onFullscreen = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
   _CALLBACKS.push({
      callback: callback,
      scope: scope,
      type: exports.DISPLAY_FULLSCREEN_ENABLED
   });
   _CALLBACKS.push({
      callback: callback,
      scope: scope,
      type: exports.DISPLAY_FULLSCREEN_DISABLED
   });
};

/**
 * The function passsed to `onEvent` will be called whenever
 * any event (mouse, keyboard, etc) was triggered.
 *
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onEvent = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: 'all'
  });
};


/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onDisplayResize = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   };

  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.DISPLAY_RESIZE
  });
}

/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onMouseMotion = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.MOUSE_MOTION
  });
};

/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onMouseUp = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.MOUSE_UP
  });
};

/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onMouseDown = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.MOUSE_DOWN
  });
};

/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onTouchMotion = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.TOUCH_MOTION
  });
};

/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onTouchUp = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.TOUCH_UP
  });
};

/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onTouchDown = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.TOUCH_DOWN
  });
};

/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onKeyDown = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.KEY_DOWN
  });
};

/**
 * @param {Function} callback to be called
 * @param {Object} scope within which the callback should be called. It's `this` during invocation. (optional)
 */
exports.onKeyUp = function(callback, scope) {
   if (typeof(callback) !== 'function') {
      throw new Error('Callback must be a function');
   }
  _CALLBACKS.push({
    callback: callback,
    scope: scope,
    type: exports.KEY_UP
  });
};

// key constants
exports.K_UP = 38;
exports.K_DOWN = 40;
exports.K_RIGHT = 39;
exports.K_LEFT = 37;

exports.K_SPACE = 32;
exports.K_BACKSPACE = 8;
exports.K_TAB = 9;
exports.K_ENTER = 13;
exports.K_SHIFT = 16;
exports.K_CTRL = 17;
exports.K_ALT = 18;
exports.K_ESC = 27;

exports.K_0 = 48;
exports.K_1 = 49;
exports.K_2 = 50;
exports.K_3 = 51;
exports.K_4 = 52;
exports.K_5 = 53;
exports.K_6 = 54;
exports.K_7 = 55;
exports.K_8 = 56;
exports.K_9 = 57;
exports.K_a = 65;
exports.K_b = 66;
exports.K_c = 67;
exports.K_d = 68;
exports.K_e = 69;
exports.K_f = 70;
exports.K_g = 71;
exports.K_h = 72;
exports.K_i = 73;
exports.K_j = 74;
exports.K_k = 75;
exports.K_l = 76;
exports.K_m = 77;
exports.K_n = 78;
exports.K_o = 79;
exports.K_p = 80;
exports.K_q = 81;
exports.K_r = 82;
exports.K_s = 83;
exports.K_t = 84;
exports.K_u = 85;
exports.K_v = 86;
exports.K_w = 87;
exports.K_x = 88;
exports.K_y = 89;
exports.K_z = 90;

exports.K_KP1 = 97;
exports.K_KP2 = 98;
exports.K_KP3 = 99;
exports.K_KP4 = 100;
exports.K_KP5 = 101;
exports.K_KP6 = 102;
exports.K_KP7 = 103;
exports.K_KP8 = 104;
exports.K_KP9 = 105;

// event type constants
exports.NOEVENT = 0;
exports.NUMEVENTS = 32000;

exports.DISPLAY_FULLSCREEN_ENABLED = 300;
exports.DISPLAY_FULLSCREEN_DISABLED = 301;
exports.DISPLAY_RESIZE = 302;

exports.QUIT = 0;
exports.KEY_DOWN = 1;
exports.KEY_UP = 2;
exports.MOUSE_MOTION = 3;
exports.MOUSE_UP = 4;
exports.MOUSE_DOWN = 5;
exports.MOUSE_WHEEL = 6;
exports.TOUCH_UP = 7;
exports.TOUCH_DOWN = 8;
exports.TOUCH_MOTION = 9;
exports.USEREVENT = 2000;



/**
 * Properties of the `event` object argument passed to the callbacks.
 * @class
 */

exports.Event = function() {
    /**
     * The type of the event. e.g., gamejs.event.QUIT, KEYDOWN, MOUSEUP.
     */
    this.type = null;
    /**
     * key the keyCode of the key. compare with gamejs.event.K_a, gamejs.event.K_b,...
     */
    this.key = null;
    /**
     * relative movement for a mousemove event
     */
    this.rel = null;
    /**
     * the number of the mousebutton pressed
     */
    this.button = null;
    /**
     * pos the position of the event for mouse events
     */
    this.pos = null;
};

/**
 * @ignore
 */
exports.init = function() {

   var lastPos = [];

   // anonymous functions as event handlers = memory leak, see MDC:elementAddEventListener

   function onMouseDown (ev) {
      var canvasOffset = display._getCanvasOffset();
      _triggerCallbacks({
         'type': exports.MOUSE_DOWN,
         'pos': [ev.clientX - canvasOffset[0], ev.clientY - canvasOffset[1]],
         'button': ev.button,
         'shiftKey': ev.shiftKey,
         'ctrlKey': ev.ctrlKey,
         'metaKey': ev.metaKey
      });
   }

   function onMouseUp (ev) {
      var canvasOffset = display._getCanvasOffset();
      _triggerCallbacks({
         'type':exports.MOUSE_UP,
         'pos': [ev.clientX - canvasOffset[0], ev.clientY - canvasOffset[1]],
         'button': ev.button,
         'shiftKey': ev.shiftKey,
         'ctrlKey': ev.ctrlKey,
         'metaKey': ev.metaKey
      });
   }

   function onKeyDown (ev) {
      var key = ev.keyCode || ev.which;
      _triggerCallbacks({
         'type': exports.KEY_DOWN,
         'key': key,
         'shiftKey': ev.shiftKey,
         'ctrlKey': ev.ctrlKey,
         'metaKey': ev.metaKey
      });

      // if the display has focus, we surpress default action
      // for most keys
      if (display._hasFocus() && (!ev.ctrlKey && !ev.metaKey &&
         ((key >= exports.K_LEFT && key <= exports.K_DOWN) ||
         (key >= exports.K_0    && key <= exports.K_z) ||
         (key >= exports.K_KP1  && key <= exports.K_KP9) ||
         key === exports.K_SPACE ||
         key === exports.K_TAB ||
         key === exports.K_ENTER)) ||
         key === exports.K_ALT) {
        ev.preventDefault();
      }
   }

   function onKeyUp (ev) {
      _triggerCallbacks({
         'type': exports.KEY_UP,
         'key': ev.keyCode,
         'shiftKey': ev.shiftKey,
         'ctrlKey': ev.ctrlKey,
         'metaKey': ev.metaKey
      });
   }

   function onMouseMove (ev) {
      var canvasOffset = display._getCanvasOffset();
      var currentPos = [ev.clientX - canvasOffset[0], ev.clientY - canvasOffset[1]];
      var relativePos = [];
      if (lastPos.length) {
         relativePos = [
            lastPos[0] - currentPos[0],
            lastPos[1] - currentPos[1]
         ];
      }
      _triggerCallbacks({
         'type': exports.MOUSE_MOTION,
         'pos': currentPos,
         'rel': relativePos,
         'buttons': null, // FIXME, fixable?
         'timestamp': ev.timeStamp,
         'movement': [ev.movementX       ||
                      ev.mozMovementX    ||
                      ev.webkitMovementX || 0,
                      ev.movementY       ||
                      ev.mozMovementY    ||
                      ev.webkitMovementY || 0
                      ]
      });
      lastPos = currentPos;
      return;
   }

   function onMouseScroll(ev) {
      var canvasOffset = display._getCanvasOffset();
      var currentPos = [ev.clientX - canvasOffset[0], ev.clientY - canvasOffset[1]];
      _triggerCallbacks({
         type: exports.MOUSE_WHEEL,
         pos: currentPos,
         delta: ev.detail || (- ev.wheelDeltaY / 40)
      });
      return;
   }

   function onBeforeUnload (ev) {
      _triggerCallbacks({
         'type': exports.QUIT
      });
      return;
   };

   // convert a w3c touch event into gamejs event
   function w3cTouchConvert(touchList) {
      var canvasOffset = display._getCanvasOffset();
      var tList = [];
      for (var i = 0; i < touchList.length; i++) {
         var touchEvent = touchList.item(i);
         tList.push({
            identifier: touchEvent.identifier,
            pos: [touchEvent.clientX - canvasOffset[0], touchEvent.clientY - canvasOffset[1]]
         });
      }
      return tList;
   }

   function onTouchDown(ev) {
      var canvasOffset = display._getCanvasOffset();
      var changedTouches = w3cTouchConvert(ev.changedTouches);
      _triggerCallbacks({
         'type': exports.TOUCH_DOWN,
         'touches': changedTouches
      });
   };

   function onTouchUp(ev) {
      var changedTouches = w3cTouchConvert(ev.changedTouches);
      _triggerCallbacks({
         'type': exports.TOUCH_UP,
         'touches': changedTouches,
      });
   }
   function onTouchMotion(ev) {
      var changedTouches = w3cTouchConvert(ev.changedTouches);
      _triggerCallbacks({
         'type': exports.TOUCH_MOTION,
         'touches': changedTouches
      });
      ev.preventDefault();
   }

   // IE does not support addEventListener on document itself
   // FX events don't reach body if mouse outside window or on menubar
   var canvas = display._getCanvas();
   document.addEventListener('mousedown', onMouseDown, false);
   document.addEventListener('mouseup', onMouseUp, false);
   document.addEventListener('keydown', onKeyDown, false);
   document.addEventListener('keyup', onKeyUp, false);
   document.addEventListener('mousemove', onMouseMove, false);
   canvas.addEventListener('mousewheel', onMouseScroll, false);
   // MOZFIX
   // https://developer.mozilla.org/en/Code_snippets/Miscellaneous#Detecting_mouse_wheel_events
   canvas.addEventListener('DOMMouseScroll', onMouseScroll, false);
   canvas.addEventListener('beforeunload', onBeforeUnload, false);
   // touchs
   canvas.addEventListener("touchstart", onTouchDown, false);
   canvas.addEventListener("touchend", onTouchUp, false);
   canvas.addEventListener("touchcancel", onTouchUp, false);
   canvas.addEventListener("touchleave", onTouchUp, false);
   canvas.addEventListener("touchmove", onTouchMotion, false);

};

},{"./display":4,"./utils/callback":24}],6:[function(require,module,exports){
var Surface = require('./graphics').Surface;
var objects = require('./utils/objects');

/**
 * @fileoverview Methods for creating Font objects which can render text
 * to a Surface.
 *
 * @example
 * var font = new Font('20px monospace');
 * // render text - this returns a surface with the text written on it.
 * var helloSurface = font.render('Hello World')
 */

/**
 * Create a Font to draw on the screen. The Font allows you to
 * `render()` text. Rendering text returns a Surface which
 * in turn can be put on screen.
 *
 * @constructor
 * @property {Number} fontHeight the line height of this Font
 *
 * @param {String} fontSettings a css font definition, e.g., "20px monospace"
 * @param {STring} backgroundColor valid #rgb string, "#ff00cc"
 */
var Font = exports.Font = function(fontSettings, backgroundColor) {
    /**
     * @ignore
     */
   this.sampleSurface = new Surface([10,10]);
   this.sampleSurface.context.font = fontSettings;
   this.sampleSurface.context.textAlign = 'start';
   // http://diveintohtml5.org/canvas.html#text
   this.sampleSurface.context.textBaseline = 'bottom';
   this.backgroundColor = backgroundColor || false;
   return this;
};

/**
 * Returns a Surface with the given text on it.
 * @param {String} text the text to render
 * @param {String} color a valid #RGB String, "#ffcc00"
 * @returns {gamejs.Surface} Surface with the rendered text on it.
 */
Font.prototype.render = function(text, color) {
   var dims = this.size(text);
   var surface = new Surface(dims);
   var ctx = surface.context;
   ctx.save();
   if ( this.backgroundColor ) {
       ctx.fillStyle = this.backgroundColor;
       ctx.fillRect(0, 0, surface.rect.width, surface.rect.height);
   }
   ctx.font = this.sampleSurface.context.font;
   ctx.textBaseline = this.sampleSurface.context.textBaseline;
   ctx.textAlign = this.sampleSurface.context.textAlign;
   ctx.fillStyle = ctx.strokeStyle = color || "#000000";
   ctx.fillText(text, 0, surface.rect.height, surface.rect.width);
   ctx.restore();
   return surface;
};

/**
 * Determine the width and height of the given text if rendered
 * with this Font.
 * @param {String} text the text to measure
 * @returns {Array} the [width, height] of the text if rendered with this Font
 */
Font.prototype.size = function(text) {
   var metrics = this.sampleSurface.context.measureText(text);
   // FIXME measuretext is buggy, make extra wide
   return [metrics.width, this.fontHeight];
};

/**
 * Height of the font in pixels.
 */
objects.accessors(Font.prototype, {
   'fontHeight': {
      get: function() {
         // Returns an approximate line height of the text
         // »This version of the specification does not provide a way to obtain
         // the bounding box dimensions of the text.«
         // see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-measuretext
         return this.sampleSurface.context.measureText('M').width * 1.5;
      }
   }

});

},{"./graphics":7,"./utils/objects":25}],7:[function(require,module,exports){
/**
 * @fileoverview
 * This module holds the important `Surface` class which is the general container for image data.
 *
 *     var surface = new gamejs.graphics.Surface([width, height]);
 *
 * The functions
 * to draw geometric lines like circles, lines, rectangles, etc. are also all in this module:
 *
 *     gamejs.graphics.line(surface, '#ff0000', centerPoint, radius);
 *
 * Each Surface instance has methods to create *a new* rotated, flipped, scaled, etc. instance of itself:
 *
 *     // the original `surface` remains untouched by the
 *     // filp operation. A new Surface instance
 *     // is returned by `flip()`.
 *     var horizontalFlippedSurface = surface.flip(true);
 *
 * If you want to put images (png, jpg) on the screen, also see the `gamejs.image` module and `gamejs.preload()`.
 *
 * There are several ways to specify colors. Whenever the docs says "valid #RGB string"
 * you can pass in any of the following formats: `"#ff00ff"`, `"rgb(255, 0, 255)"` or `"rgba(255, 0, 255, 1)"`.
 *
 * @see gamejs/image
 */
var gamejs = require('../gamejs');
var Rect = gamejs.Rect;
var objects = require('./utils/objects');

/**
 * transform functions
 */
var matrix = require('./math/matrix');
var vectors = require('./math/vectors');

/**
 * A Surface represents a bitmap image with a fixed width and height. The
 * most important feature of a Surface is that they can be `blitted`
 * onto each other.
 *
 * @example
 * new gamejs.graphics.Surface([width, height]);
 * new gamejs.graphics.Surface(width, height);
 * new gamejs.graphics.Surface(rect);
 * @constructor
 *
 * @param {Array} dimensions Array holding width and height
 */
var Surface = exports.Surface = function() {
   var args = gamejs.normalizeRectArguments.apply(this, arguments);
   var width = args.left;
   var height = args.top;
   // unless argument is rect:
   if (arguments.length == 1 && arguments[0] instanceof Rect) {
      width = args.width;
      height = args.height;
   }
   // only for rotatation & scale
   /** @ignore */
   this._matrix = matrix.identity();
   /** @ignore */
    this._canvas = document.createElement("canvas");
    this._canvas.width = width;
    this._canvas.height = height;
    /** @ignore */
    this._blitAlpha = 1.0;

   /** @ignore */
   this._context = this._canvas.getContext('2d');
   // using exports is weird but avoids circular require
   if (gamejs.display._isSmoothingEnabled()) {
      this._smooth();
   } else {
      this._noSmooth();
   }
   return this;
};

/** @ignore */
Surface.prototype._noSmooth = function() {
    // disable image scaling
    // see https://developer.mozilla.org/en/Canvas_tutorial/Using_images#Controlling_image_scaling_behavior
    // and https://github.com/jbuck/processing-js/commit/65de16a8340c694cee471a2db7634733370b941c
    this.context.mozImageSmoothingEnabled = false;
  this.context.webkitImageSmoothingEnabled = false;
   return;
};
/** @ignore */
Surface.prototype._smooth = function() {
  this.context.mozImageSmoothingEnabled = true;
  this.context.webkitImageSmoothingEnabled = true;

};

/**
 * Blits another Surface on this Surface. The destination where to blit to
 * can be given (or it defaults to the top left corner) as well as the
 * Area from the Surface which should be blitted (e.g., for cutting out parts of
 * a Surface).
 *
 * @example
 * // blit flower in top left corner of display
 * displaySurface.blit(flowerSurface);
 *
 * // position flower at 10/10 of display
 * displaySurface.blit(flowerSurface, [10, 10])
 *
 * // ... `dest` can also be a rect whose topleft position is taken:
 * displaySurface.blit(flowerSurface, new gamejs.Rect([10, 10]);
 *
 * // only blit half of the flower onto the display
 * var flowerRect = flowerSurface.rect;
 * flowerRect = new gamejs.Rect([0,0], [flowerRect.width/2, flowerRect.height/2])
 * displaySurface.blit(flowerSurface, [0,0], flowerRect);
 *
 * @param {gamejs.graphics.Surface} src The Surface which will be blitted onto this one
 * @param {gamejs.Rect|Array} dst the Destination x, y position in this Surface.
 *            If a Rect is given, it's top and left values are taken. If this argument
 *            is not supplied the blit happens at [0,0].
 * @param {gamesjs.Rect|Array} area the Area from the passed Surface which
 *            should be blitted onto this Surface.
 * @param {Number} compositionOperation how the source and target surfaces are composited together; one of: source-atop, source-in, source-out, source-over (default), destination-atop, destination-in, destination-out, destination-over, lighter, copy, xor; for an explanation of these values see: http://dev.w3.org/html5/2dcontext/#dom-context-2d-globalcompositeoperation
 * @returns {gamejs.Rect} Rect actually repainted FIXME actually return something?
 */
Surface.prototype.blit = function(src, dest, area, compositeOperation) {

   var rDest, rArea;

   if (dest instanceof Rect) {
      rDest = dest.clone();
      var srcSize = src.getSize();
      if (!rDest.width) {
         rDest.width = srcSize[0];
      }
      if (!rDest.height) {
         rDest.height = srcSize[1];
      }
    } else if (dest && dest instanceof Array && dest.length == 2) {
      rDest = new Rect(dest, src.getSize());
    } else {
      rDest = new Rect([0,0], src.getSize());
    }
   compositeOperation = compositeOperation || 'source-over';

   // area within src to be drawn
   if (area instanceof Rect) {
      rArea = area;
   } else if (area && area instanceof Array && area.length == 2) {
      var size = src.getSize();
      rArea = new Rect(area, [size[0] - area[0], size[1] - area[1]]);
   } else {
      rArea = new Rect([0,0], src.getSize());
   }

   if (isNaN(rDest.left) || isNaN(rDest.top) || isNaN(rDest.width) || isNaN(rDest.height)) {
      throw new Error('[blit] bad parameters, destination is ' + rDest);
   }

   this.context.save();
   this.context.globalCompositeOperation = compositeOperation;
   this.context.globalAlpha = src._blitAlpha;
   this.context.drawImage(src.canvas, rArea.left, rArea.top, rArea.width, rArea.height, rDest.left, rDest.top, rDest.width, rDest.height);
   this.context.restore();
   return;
};

/**
 * @returns {Number[]} the width and height of the Surface
 */
Surface.prototype.getSize = function() {
   return [this.canvas.width, this.canvas.height];
};

/**
 * Obsolte, only here for compatibility.
 * @deprecated
 * @ignore
 * @returns {gamejs.Rect} a Rect of the size of this Surface
 */
Surface.prototype.getRect = function() {
   return new Rect([0,0], this.getSize());
};

/**
 * Fills the whole Surface with a color. Usefull for erasing a Surface.
 * @param {String} CSS color string, e.g. '#0d120a' or '#0f0' or 'rgba(255, 0, 0, 0.5)'
 * @param {gamejs.Rect} a Rect of the area to fill (defauts to entire surface if not specified)
 */
Surface.prototype.fill = function(color, rect) {
   this.context.save();
   this.context.fillStyle = color || "#000000";
   if (rect === undefined) {
       rect = new Rect(0, 0, this.canvas.width, this.canvas.height);
    }

   this.context.fillRect(rect.left, rect.top, rect.width, rect.height);
   this.context.restore();
   return;
};

/**
 * Clear the surface.
 */
Surface.prototype.clear = function(rect) {
   var size = this.getSize();
   rect = rect || new Rect(0, 0, size[0], size[1]);
   this.context.clearRect(rect.left, rect.top, rect.width, rect.height);
   return;
};

objects.accessors(Surface.prototype, {
   /**
    * @type gamejs.Rect
    */
   'rect': {
      get: function() {
         return this.getRect();
      }
   },
   /**
    * @ignore
    */
   'context': {
      get: function() {
         return this._context;
      }
   },
   'canvas': {
      get: function() {
         return this._canvas;
      }
   }
});

/**
 * @returns {gamejs.graphics.Surface} a clone of this surface
 */
Surface.prototype.clone = function() {
  var newSurface = new Surface(this.getRect());
  newSurface.blit(this);
  return newSurface;
};

/**
 * @returns {Number} current alpha value
 */
Surface.prototype.getAlpha = function() {
   return (1 - this._blitAlpha);
};

/**
 * Set the alpha value for the whole Surface. When blitting the Surface on
 * a destination, the pixels will be drawn slightly transparent.
 * @param {Number} alpha value in range 0.0 - 1.0
 * @returns {Number} current alpha value
 */
Surface.prototype.setAlpha = function(alpha) {
   if (isNaN(alpha) || alpha < 0 || alpha > 1) {
      return;
   }

   this._blitAlpha = (1 - alpha);
   return (1 - this._blitAlpha);
};

/**
 * The data must be represented in left-to-right order, row by row top to bottom,
 * starting with the top left, with each pixel's red, green, blue, and alpha components
 * being given in that order for each pixel.
 * @see http://dev.w3.org/html5/2dcontext/#canvaspixelarray
 * @returns {ImageData} an object holding the pixel image data {data, width, height}
 */
Surface.prototype.getImageData = function() {
   var size = this.getSize();
   return this.context.getImageData(0, 0, size[0], size[1]);
};



// FIXME all draw functions must return a minimal rect containing the drawn shape

/**
 * @param {gamejs.graphics.Surface} surface the Surface to draw on
 * @param {String} color valid #RGB string, e.g., "#ff0000"
 * @param {Array} startPos [x, y] position of line start
 * @param {Array} endPos [x, y] position of line end
 * @param {Number} width of the line, defaults to 1
 */
exports.line = function(surface, color, startPos, endPos, width) {
   var ctx = surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = color;
   ctx.lineWidth = width || 1;
   ctx.moveTo(startPos[0], startPos[1]);
   ctx.lineTo(endPos[0], endPos[1]);
   ctx.stroke();
   ctx.restore();
   return;
};

/**
 * Draw connected lines. Use this instead of indiviudal line() calls for
 * better performance
 *
 * @param {gamejs.graphics.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB string, "#ff0000"
 * @param {Boolean} closed if true the last and first point are connected
 * @param {Array} pointlist holding array [x,y] arrays of points
 * @param {Number} width width of the lines, defaults to 1
 */
exports.lines = function(surface, color, closed, pointlist, width) {
   closed = closed || false;
   var ctx = surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = ctx.fillStyle = color;
   ctx.lineWidth = width || 1;
   pointlist.forEach(function(point, idx) {
      if (idx === 0) {
         ctx.moveTo(point[0], point[1]);
      } else {
         ctx.lineTo(point[0], point[1]);
      }
   });
   if (closed) {
      ctx.lineTo(pointlist[0][0], pointlist[0][1]);
   }
   ctx.stroke();
   ctx.restore();
   return;
};

/**
 * Draw a circle on Surface
 *
 * @param {gamejs.graphics.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB String, #ff00cc
 * @param {Array} pos [x, y] position of the circle center
 * @param {Number} radius of the circle
 * @param {Number} width width of the circle, if not given or 0 the circle is filled
 */
exports.circle = function(surface, color, pos, radius, width) {
   if (isNaN(radius)) {
      throw new Error('[circle] radius required argument');
   }
   if (!pos || !(pos instanceof Array)) {
      throw new Error('[circle] pos must be given & array' + pos);
   }

   var ctx = surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = ctx.fillStyle = color;
   ctx.lineWidth = width || 1;
   ctx.arc(pos[0], pos[1], radius, 0, 2*Math.PI, true);
   if (width === undefined || width === 0) {
      ctx.fill();
   } else {
      ctx.stroke();
   }
   ctx.restore();
   return;
};

/**
 * @param {gamejs.graphics.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB String, #ff00cc
 * @param {gamejs.Rect} rect the position and dimension attributes of this Rect will be used
 * @param {Number} width the width of line drawing the Rect, if 0 or not given the Rect is filled.
 */
exports.rect = function(surface, color, rect, width) {
   var ctx =surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = ctx.fillStyle = color;
   if (isNaN(width) || width === 0) {
      ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
   } else {
      ctx.lineWidth = width || 1;
      ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
   }
   ctx.restore();
};

/**
 * @param {gamejs.graphics.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB String, #ff00cc
 * @param {Array} pos [x, y] position of the circle center
 * @param {Number} startAngle, both angles in radians
 * @param {Number} stopAngle
 * @param {Number} radius
 * @param {Number} width the width of line, if 0 or not given the arc is filled.
 */
exports.arc= function(surface, color, pos, startAngle, stopAngle, radius, width) {
   var ctx = surface.context;
   ctx.save();
   ctx.beginPath();
   ctx.strokeStyle = ctx.fillStyle = color;
   ctx.arc(pos[0], pos[1],
            radius,
            startAngle, stopAngle,
            false
         );
   if (isNaN(width) || width === 0) {
      ctx.fill();
   } else {
      ctx.lineWidth = width || 1;
      ctx.stroke();
   }
   ctx.restore();
};

/**
 * Draw a polygon on the surface. The pointlist argument are the vertices
 * for the polygon.
 *
 * @param {gamejs.graphics.Surface} surface the Surface to draw on
 * @param {String} color a valid #RGB String, #ff00cc
 * @param {Array} pointlist array of vertices [x, y] of the polygon
 * @param {Number} width the width of line, if 0 or not given the polygon is filled.
 */
exports.polygon = function(surface, color, pointlist, width) {
   var ctx = surface.context;
   ctx.save();
   ctx.fillStyle = ctx.strokeStyle = color;
   ctx.beginPath();
   pointlist.forEach(function(point, idx) {
      if (idx === 0) {
         ctx.moveTo(point[0], point[1]);
      } else {
         ctx.lineTo(point[0], point[1]);
      }
   });
   ctx.closePath();
   if (isNaN(width) || width === 0) {
      ctx.fill();
   } else {
      ctx.lineWidth = width || 1;
      ctx.stroke();
   }
   ctx.restore();
};

/**
 * Draw a quadratic curve with one control point on the surface.
 * The control point position defines the shape of the quadratic curve.
 *
 * @param {gamejs.graphics.Surface} surface the Surface to draw on
 * @param {String} color valid #RGB string, e.g., "#ff0000"
 * @param {Array} startPos [x, y] the start position for the quadratic curve
 * @param {Array} endPos [x, y] the end position for the quadratic curve
 * @param {Array} controlPos [x, y] position of the control point
 * @param {Number} width of the quadratic curve, defaults to 1
 */
exports.quadraticCurve = function(surface, color, startPos, endPos, controlPos, width) {
   if (!startPos || !(startPos instanceof Array)) {
      throw new Error('[quadratic_curve] startPos must be defined!');
   }
   if (!endPos || !(endPos instanceof Array)) {
      throw new Error('[quadratic_curve] endPos must be defined!');
   }
   if (!controlPos || !(controlPos instanceof Array)) {
      throw new Error('[quadratic_curve] controlPos must be defined!');
   }

   var ctx = surface.context;
   ctx.save();
   ctx.fillStyle = ctx.strokeStyle = color;
   ctx.lineWidth = width || 1;

   ctx.beginPath();
   ctx.moveTo(startPos[0], startPos[1]);
   ctx.quadraticCurveTo(controlPos[0], controlPos[1], endPos[0], endPos[1]);
   ctx.stroke();

   ctx.restore();
};

/**
 * Draw a bezier curve with two control points on the surface.
 * The control point positions define the shape of the bezier curve.
 *
 * @param {gamejs.graphics.Surface} surface the Surface to draw on
 * @param {String} color valid #RGB string, e.g., "#ff0000"
 * @param {Array} startPos [x, y] the start position for the bezier curve
 * @param {Array} endPos [x, y] the end position for the bezier curve
 * @param {Array} ct1Pos [x, y] position of the first control point
 * @param {Array} ct2Pos [x, y] position of the second control point
 * @param {Number} width of the bezier curve, defaults to 1
 */
exports.bezierCurve = function(surface, color, startPos, endPos, ct1Pos, ct2Pos, width) {
   if (!startPos || !(startPos instanceof Array)) {
      throw new Error('[bezier_curve] startPos must be defined!');
   }
   if (!endPos || !(endPos instanceof Array)) {
      throw new Error('[bezier_curve] endPos must be defined!');
   }
   if (!ct1Pos || !(ct1Pos instanceof Array)) {
      throw new Error('[bezier_curve] ct1Pos must be defined!');
   }
   if (!ct2Pos || !(ct2Pos instanceof Array)) {
      throw new Error('[bezier_curve] ct2Pos must be defined!');
   }
   var ctx = surface.context;
   ctx.save();
   ctx.fillStyle = ctx.strokeStyle = color;
   ctx.lineWidth = width || 1;

   ctx.beginPath();
   ctx.moveTo(startPos[0], startPos[1]);
   ctx.bezierCurveTo(ct1Pos[0], ct1Pos[1], ct2Pos[0], ct2Pos[1], endPos[0], endPos[1]);
   ctx.stroke();

   ctx.restore();
};

/**
 * Returns a new surface which holds this surface rotate by angle degrees.
 * Unless rotating by 90 degree increments, the image will be padded larger to hold the new size.
 * @param {angel} angle Clockwise angle by which to rotate
 * @returns {Surface} new, rotated surface
 */
Surface.prototype.rotate = function (angle) {
   var origSize = this.getSize();
   var radians = (angle * Math.PI / 180);
   var newSize = origSize;
   // find new bounding box
   if (angle % 360 !== 0) {
      var rect = this.getRect();
      var points = [
         [-rect.width/2, rect.height/2],
         [rect.width/2, rect.height/2],
         [-rect.width/2, -rect.height/2],
         [rect.width/2, -rect.height/2]
      ];
      var rotPoints = points.map(function(p) {
         return vectors.rotate(p, radians);
      });
      var xs = rotPoints.map(function(p) { return p[0]; });
      var ys = rotPoints.map(function(p) { return p[1]; });
      var left = Math.min.apply(Math, xs);
      var right = Math.max.apply(Math, xs);
      var bottom = Math.min.apply(Math, ys);
      var top = Math.max.apply(Math, ys);
      newSize = [right-left, top-bottom];
   }
   var newSurface = new Surface(newSize);
   var m = matrix.translate(this._matrix, origSize[0]/2, origSize[1]/2);
   m = matrix.rotate(m, radians);
   m = matrix.translate(m, -origSize[0]/2, -origSize[1]/2);
   var offset = [(newSize[0] - origSize[0]) / 2, (newSize[1] - origSize[1]) / 2];
   newSurface.context.save();
   newSurface.context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
   newSurface.blit(this, offset);
   newSurface.context.restore();
   return newSurface;
};

/**
 * Returns a new surface holding the scaled surface.
 * @param {Array} dimensions new [width, height] of surface after scaling
 * @returns {Surface} new, scaled surface
 */
Surface.prototype.scale = function(dims) {
   var width = dims[0];
   var height = dims[1];
   if (width <= 0 || height <= 0) {
      throw new Error('[gamejs.transform.scale] Invalid arguments for height and width', [width, height]);
   }
   var oldDims = this.getSize();
   var ws = width / oldDims[0];
   var hs = height / oldDims[1];
   var newSurface = new Surface([width, height]);
   var originalMatrix = this._matrix.slice(0);
   var m = matrix.scale(matrix.identity(), [ws, hs]);
   newSurface.context.save();
   newSurface.context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
   newSurface.blit(this);
   newSurface.context.restore();
   return newSurface;
};

/**
 * Flip a Surface either vertically, horizontally or both. This returns
 * a new Surface (i.e: nondestructive).
 * @param {Boolean} flipHorizontal
 * @param {Boolean} flipVertical
 * @returns {Surface} new, flipped surface
 */
Surface.prototype.flip = function(flipHorizontal, flipVertical) {
   var dims = this.getSize();
   var newSurface = new Surface(dims);
   var scaleX = 1;
   var scaleY = 1;
   var xPos = 0;
   var yPos = 0;
   if (flipHorizontal === true) {
      scaleX = -1;
      xPos = -dims[0];
   }
   if (flipVertical === true) {
      scaleY = -1;
      yPos = -dims[1];
   }
   newSurface.context.save();
   newSurface.context.scale(scaleX, scaleY);
   newSurface.context.drawImage(this.canvas, xPos, yPos);
   newSurface.context.restore();
   return newSurface;
};


/**
 * Directly copy values from an array into a Surface.
 *
 * This is faster than blitting the `surface` property on a SurfaceArray
 *
 * The array must be the same dimensions as the Surface and will completely
 * replace all pixel values.
 * @param {gamejs.graphics.Surface} surface
 * @param {gamejs.graphics.Surfacearray.SurfaceArray} surfaceArray
 */
exports.blitArray = function(surface, surfaceArray) {
   surface.context.putImageData(surfaceArray.imageData, 0, 0);
   return;
};

/**
 * Fast pixel access. The SurfaceArray can be constructed with a surface whose values
 * are then used to initialize the pixel array.
 *
 * The surface passed as argument is not modified by the SurfaceArray.
 *
 * If an array is used to construct SurfaceArray, the array must describe
 * the dimensions of the SurfaceArray [width, height].
 *
 * @example
 *
 *   // create array from display surface
 *   var srfArray = new SurfaceArray(display);
 *   // direct pixel access
 *   srfArray.set(50, 100, [255, 0, 0, 100]);
 *   console.log(srfArray.get(30, 50));
 *   // blit modified array back to display surface
 *   blitArray(display, srfArray);
 *
 * @param {gamejs.graphics.Surface|Array} surfaceOrDimensions
 * @see http://dev.w3.org/html5/2dcontext/#pixel-manipulation
 */
var SurfaceArray = exports.SurfaceArray = function(surfaceOrDimensions) {
   var size = null;
   var data = null;
   var imageData = null;

   /**
    * Set rgba value at position x, y.
    *
    * For performance reasons this function has only one signature
    * being Number, Number, Array[4].
    *
    * @param {Number} x x position of pixel
    * @param {Number} y y position of pixel
    * @param {Array} rgba [red, green, blue, alpha] values [255, 255, 255, 255] (alpha, the last argument defaults to 255)
    * @throws Error if x, y out of range
    */
   this.set = function(x, y, rgba) {
      var offset = (x * 4) + (y * size[0] * 4);
      /** faster without
      if (offset + 3 >= data.length || x < 0 || y < 0) {
         throw new Error('x, y out of range', x, y);
      }
      **/
      data[offset] = rgba[0];
      data[offset+1] = rgba[1];
      data[offset+2] = rgba[2];
      data[offset+3] = rgba[3] === undefined ? 255 : rgba[3];
      return;
   };

   /**
    * Get rgba value at position xy,
    * @param {Number} x
    * @param {Number} y
    * @returns {Array} [red, green, blue, alpha]
    */
   this.get = function(x, y) {
      var offset = (x * 4) + (y * size[0] * 4);
      return [
         data[offset],
         data[offset+1],
         data[offset+2],
         data[offset+3]
      ];
   };

   /**
    * a new gamejs.graphics.Surface on every access, representing
    * the current state of the SurfaceArray.
    * @type {gamejs.graphics.Surface}
    */
   // for jsdoc only
   this.surface = null;

   objects.accessors(this, {
      surface: {
         get: function() {
            var s = new gamejs.graphics.Surface(size);
            s.context.putImageData(imageData, 0, 0);
            return s;
         }
      },
      imageData: {
         get: function() {
            return imageData;
         }
      }
   });

   this.getSize = function() {
      return size;
   };

   /**
    * constructor
    */
   if (surfaceOrDimensions instanceof Array) {
      size = surfaceOrDimensions;
      imageData = gamejs.display.getSurface().context.createImageData(size[0], size[1]);
      data = imageData.data;
   } else {
      size = surfaceOrDimensions.getSize();
      imageData = surfaceOrDimensions.getImageData(0, 0, size[0], size[1]);
      data = imageData.data;
   }
   return this;
};

},{"../gamejs":2,"./math/matrix":13,"./math/vectors":16,"./utils/objects":25}],8:[function(require,module,exports){
/**
 * @fileoverview Make synchronous http requests to your game's serverside component.
 *
 * If you configure a ajax base URL you can make http requests to your
 * server using those functions.

 * The most high-level functions are `load()` and `save()` which take
 * and return a JavaScript object, which they will send to / recieve from
 * the server-side in JSON format.
 *
 *
 */

/**
 * Response object returned by http functions `get` and `post`. This
 * class is not instantiable.
 *
 * @param{String} responseText
 * @param {String} responseXML
 * @param {Number} status
 * @param {String} statusText
 */
exports.Response = function() {
   /**
    * @param {String} header
    */
   this.getResponseHeader = function(header)  {
   };
   throw new Error('response class not instantiable');
};

/**
 * Make http request to server-side
 * @param {String} method http method
 * @param {String} url
 * @param {String|Object} data
 * @param {String|Object} type "Accept" header value
 * @return {Response} response
 */
var ajax = exports.ajax = function(method, url, data, type) {
   data = data || null;
   var response = new XMLHttpRequest();
   response.open(method, url, false);
   if (type) {
      response.setRequestHeader("Accept", type);
   }
   if (data instanceof Object) {
      data = JSON.stringify(data);
      response.setRequestHeader('Content-Type', 'application/json');
   }
   response.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
   response.send(data);
   return response;
};

/**
 * Make http GET request to server-side
 * @param {String} url
 */
var get = exports.get = function(url) {
   return ajax('GET', url);
};

/**
 * Make http POST request to server-side
 * @param {String} url
 * @param {String|Object} data
 * @param {String|Object} type "Accept" header value
 * @returns {Response}
 */
var post = exports.post = function(url, data, type) {
   return ajax('POST', url, data, type);
};

function stringify(response) {
   /* jshint ignore:start */
   return eval('(' + response.responseText + ')');
   /* jshint ignore:end */
}

function ajaxBaseHref() {
    return (window.$g && window.$g.ajaxBaseHref) || './';
}

/**
 * Load an object from the server-side.
 * @param {String} url
 * @return {Object} the object loaded from the server
 */
exports.load = function(url) {
   return stringify(get(ajaxBaseHref() + url));
};

/**
 * Send an object to a server-side function.
 * @param {String} url
 * @param {String|Object} data
 * @param {String|Object} type "Accept" header value
 * @returns {Object} the response object
 */
exports.save = function(url, data, type) {
   return stringify(post(ajaxBaseHref() + url, {payload: data}, type));
};

},{}],9:[function(require,module,exports){
var gamejs = require('../gamejs');

/**
 * @fileoverview Load images as Surfaces.
 *
 * Sounds & Images are loaded relative to your game's html page
 * (the html which includes the GameJs code) or relative to the
 * property `window.$g.resourceBaseHref`
 * if it is set.
 *
 *
 */

var CACHE = {};

/**
 * need to export preloading status for require
 * @ignore
 */
var _PRELOADING = false;

/**
 * Load image and return it on a Surface.
 *
 * All images must be preloaded before they can be used.
 * @example

 *     gamejs.preload(["./images/ship.png", "./images/sunflower.png"]);
 *     // ...later...
 *     display.blit(gamejs.image.load('images/ship.png'))
 *
 * @param {String|dom.Image} uriOrImage resource uri for image
 * @returns {gamejs.graphics.Surface} surface with the image on it.
 */
exports.load = function(key) {
   var img;
   if (typeof key === 'string') {
      img = CACHE[key];
      if (!img) {
			throw new Error('Missing "' + key + '", gamejs.preload() all images before trying to load them.');
      }
   } else {
      img = key;
   }
   var canvas = document.createElement('canvas');
   // IEFIX missing html5 feature naturalWidth/Height
   canvas.width = img.naturalWidth || img.width;
   canvas.height = img.naturalHeight || img.height;
   var context = canvas.getContext('2d');
   context.drawImage(img, 0, 0);
   img.getSize = function() { return [img.naturalWidth, img.naturalHeight]; };
   var surface = new gamejs.graphics.Surface(img.getSize());
   // NOTE hack setting protected _canvas directly
   surface._canvas = canvas;
   surface._context = context;
   return surface;
};


/**
 * add all images on the currrent page into cache
 * @ignore
 */
exports.init = function() {
   return;
};

/**
 * preload the given img URIs
 * @returns {Function} which returns 0-1 for preload progress
 * @ignore
 */
exports.preload = function(imgIdents) {

   var countLoaded = 0;
   var countTotal = 0;

   function incrementLoaded() {
      countLoaded++;
      if (countLoaded == countTotal) {
         _PRELOADING = false;
      }
      if (countLoaded % 10 === 0) {
         gamejs.logging.debug('gamejs.image: preloaded  ' + countLoaded + ' of ' + countTotal);
      }
   }

   function getProgress() {
      return countTotal > 0 ? countLoaded / countTotal : 1;
   }

   function successHandler() {
      addToCache(this);
      incrementLoaded();
   }
   function errorHandler() {
      incrementLoaded();
      throw new Error('Error loading ' + this.src);
   }

   var key;
   for (key in imgIdents) {
      var lowerKey = key.toLowerCase();
      if (lowerKey.indexOf('.png') == -1 &&
            lowerKey.indexOf('.jpg') == -1 &&
            lowerKey.indexOf('.jpeg') == -1 &&
            lowerKey.indexOf('.svg') == -1 &&
            lowerKey.indexOf('.gif') == -1) {
         continue;
      }
      var img = new Image();
      img.addEventListener('load', successHandler, true);
      img.addEventListener('error', errorHandler, true);
      img.src = imgIdents[key];
      img.gamejsKey = key;
      countTotal++;
   }
   if (countTotal > 0) {
      _PRELOADING = true;
   }
   return getProgress;
};

/**
 * add the given <img> dom elements into the cache.
 * @private
 */
var addToCache = function(img) {
   CACHE[img.gamejsKey] = img;
   return;
};

},{"../gamejs":2}],10:[function(require,module,exports){

/**
 * @fileoverview Static methods for logging and setting the log level. All logging functions (`info()`, `debug()`, etc.) take
 * any number of arguments and will print them in one line.
 *
 */

var DEBUG_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
var debugLevel = 2;
var gamejs = require('../gamejs');

/**
 * set logLevel as string or number
 *   * 0 = info
 *   * 1 = warn
 *   * 2 = error
 *   * 3 = fatal
 *
 * @example
 * gamejs.setLogLevel(0); // debug
 * gamejs.setLogLevel('error'); // equal to setLogLevel(2)
 */
exports.setLogLevel = function(logLevel) {
   if (typeof logLevel === 'string' && DEBUG_LEVELS.indexOf(logLevel)) {
      debugLevel = DEBUG_LEVELS.indexOf(logLevel);
   } else if (typeof logLevel === 'number') {
      debugLevel = logLevel;
   } else {
      throw new Error('invalid logLevel ', logLevel, ' Must be one of: ', DEBUG_LEVELS);
   }
   return debugLevel;
};

/**
 * Log a msg to the console if console is enable
 * @param {String} message,... the msg to log
 */
var log = exports.log = function() {

   if (gamejs.thread.inWorker === true) {
      gamejs.thread._logMessage.apply(null, arguments);
      return;
   }

   // IEFIX can't call apply on console
   var args = Array.prototype.slice.apply(arguments, [0]);
   args.unshift(Date.now());
   if (window.console !== undefined && console.log.apply) {
      console.log.apply(console, args);
   }
};
/**
 * @param {String} message,... to log
 */
exports.debug = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('debug')) {
      log.apply(this, arguments);
   }
};
/**
 * @param {String} message,... to log
 */
exports.info = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('info')) {
      log.apply(this, arguments);
   }
};
/**
 * @param {String} message,... to log
 */
exports.warn = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('warn')) {
      log.apply(this, arguments);
   }
};
/**
 * @param {String} message,... to log
 */
exports.error = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('error')) {
      log.apply(this, arguments);
   }
};
/**
 * @param {String} message to log
 */
exports.fatal = function() {
   if (debugLevel <= DEBUG_LEVELS.indexOf('fatal')) {
      log.apply(this, arguments);
   }
};

},{"../gamejs":2}],11:[function(require,module,exports){
/**
 * @fileoverview Degrees and radians.
 *
 */

/**
 *
 * absolute angle to relative angle, in degrees
 * @param {Number} absolute angle in degrees
 * @returns {Number} relative angle in degrees
 */
exports.normaliseDegrees=function(degrees){
    degrees=degrees % 360;
    if(degrees<0) {
        degrees+=360;
    }
    return degrees;
};

/**
 *
 * absolute angle to relative angle, in radians
 * @param {Number} absolute angle in radians
 * @returns {Number} relative angle in radians
 */
exports.normaliseRadians=function(radians){
    radians=radians % (2*Math.PI);
    if(radians<0) {
        radians+=(2*Math.PI);
    }
    return radians;
};

/**
 *
 * convert radians to degrees
 * @param {Number} radians
 * @returns {Number} degrees
 */
exports.degrees=function(radians) {
    return radians*(180/Math.PI);
};

/**
 *
 * convert degrees to radians
 * @param {Number} degrees
 * @returns {Number} radians
 */
exports.radians=function(degrees) {
    return degrees*(Math.PI/180);
};

},{}],12:[function(require,module,exports){
/**
 * @fileoverview Binary Heap implementation from Eloquent JavaScript
 *
 * @see http://eloquentjavascript.net/appendix2.html
 */
var BinaryHeap = exports.BinaryHeap = function(scoreFunction){
   /**
    * @ignore
    */
   this.content = [];
   /**
    * @ignore
    */
   this.scoreFunction = scoreFunction;
   return this;
};

/**
 * Add element to heap.
 * @param {Object} element
 */
BinaryHeap.prototype.push = function(element) {
   this.content.push(element);
   this.sinkDown(this.content.length - 1);
   return;
};

/**
 * Return first element from heap.
 * @param {Object} element
 * @returns {Object} element
 */
BinaryHeap.prototype.pop = function() {
   // Store the first element so we can return it later.
   var result = this.content[0];
   // Get the element at the end of the array.
   var end = this.content.pop();
   // If there are any elements left, put the end element at the
   // start, and let it bubble up.
   if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
   }
   return result;
};

/**
 * Remove the given element from the heap.
 * @param {Object} element
 * @throws {Error} if node not found
 * @returns true if the node was round and removed or fals otherwise
 */
BinaryHeap.prototype.remove = function(node) {
   // To remove a value, we must search through the array to find
   // it.
   var isFound = this.content.some(function(cNode, idx) {
      if (cNode == node) {
         var end = this.content.pop();
         if (idx != this.content.length) {
            this.content[idx] = end;
            if (this.scoreFunction(end) < this.scoreFunction(node)) {
               this.sinkDown(idx);
            } else {
               this.bubbleUp(idx);
            }
         }
         return true;
      }
      return false;
   }, this);
   return isFound;
};

/**
 * Number of elements in heap.
 */
BinaryHeap.prototype.size = function() {
   return this.content.length;
};

/**
 * @ignore
 */
BinaryHeap.prototype.sinkDown = function(idx) {
   // Fetch the element that has to be sunk
   var element = this.content[idx];
   // When at 0, an element can not sink any further.
   while (idx > 0) {
      // Compute the parent element's index, and fetch it.
      var parentIdx = Math.floor((idx + 1) / 2) - 1;
      var parent = this.content[parentIdx];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
         this.content[parentIdx] = element;
         this.content[idx] = parent;
         // Update 'n' to continue at the new position.
         idx = parentIdx;
      // Found a parent that is less, no need to sink any further.
      } else {
         break;
      }
   }
   return;
};

/**
 * @ignore
 */
BinaryHeap.prototype.bubbleUp = function(idx) {
   // Look up the target element and its score.
   var length = this.content.length;
   var element = this.content[idx];
   var elemScore = this.scoreFunction(element);

   while(true) {
      // Compute the indices of the child elements.
      var child2Idx = (idx + 1) * 2;
      var child1Idx= child2Idx - 1;
      // This is used to store the new position of the element,
      // if any.
      var swapIdx = null;
      // If the first child exists (is inside the array)...
      var child1Score;
      if (child1Idx < length) {
         // Look it up and compute its score.
         var child1 = this.content[child1Idx];
         child1Score = this.scoreFunction(child1);
         // If the score is less than our element's, we need to swap.
         if (child1Score < elemScore) {
            swapIdx = child1Idx;
         }
      }
      // Do the same checks for the other child.
      if (child2Idx < length) {
         var child2 = this.content[child2Idx];
         var child2Score = this.scoreFunction(child2);
         if (child2Score < (swapIdx === null ? elemScore : child1Score)) {
            swapIdx = child2Idx;
         }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swapIdx !== null) {
         this.content[idx] = this.content[swapIdx];
         this.content[swapIdx] = element;
         idx = swapIdx;
      // Otherwise, we are done.
      } else {
         break;
      }
   }
   return;
};

},{}],13:[function(require,module,exports){
/**
 * @fileoverview Matrix manipulation, used by GameJs itself. You
 * probably do not need this unless you manipulate a Context's transformation
 * matrix yourself.
 */

// correct way to do scale, rotate, translate
// *  gamejs.utils.matrix will be used in gamejs.transforms, modifing the surfaces.matrix
// * this matrix must be applied to the context in Surface.draw()

/**
 * @returns {Array} [1, 0, 0, 1, 0, 0]
 */
var identiy = exports.identity = function () {
   return [1, 0, 0, 1, 0, 0];
};

/**
 * @param {Array} matrix
 * @param {Array} matrix
 * @returns {Array} matrix sum
 */
var add = exports.add = function(m1, m2) {
   return [
      m1[0] + m2[0],
      m1[1] + m2[1],
      m1[2] + m2[2],
      m1[3] + m2[3],
      m1[4] + m2[4],
      m1[5] + m2[5],
      m1[6] + m2[6]
   ];
};

/**
 * @param {Array} matrix A
 * @param {Array} matrix B
 * @returns {Array} matrix product
 */
var multiply = exports.multiply = function(m1, m2) {
   return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
   ];
};

/**
 * @param {Array} matrix
 * @param {Number} dx
 * @param {Number} dy
 * @returns {Array} translated matrix
 */
var translate = exports.translate = function(m1, dx, dy) {
   return multiply(m1, [1, 0, 0, 1, dx, dy]);
};

/**
 * @param {Array} matrix
 * @param {Number} angle in radians
 * @returns {Array} rotated matrix
 */
var rotate = exports.rotate = function(m1, angle) {
   // radians
   var sin = Math.sin(angle);
   var cos = Math.cos(angle);
   return multiply(m1, [cos, sin, -sin, cos, 0, 0]);
};

/**
 * @param {Array} matrix
 * @returns {Number} rotation in radians
 */
var rotation = exports.rotation = function(m1) {
      return Math.atan2(m1[1], m1[0]);
};

/**
 * @param {Array} matrix
 * @param {Array} vector [a, b]
 * @returns {Array} scaled matrix
 */
var scale = exports.scale = function(m1, svec) {
   var sx = svec[0];
   var sy = svec[1];
   return multiply(m1, [sx, 0, 0, sy, 0, 0]);
};

},{}],14:[function(require,module,exports){
/**
 * @fileoverview
 * A noise generator comparable to Perlin noise, which is useful
 * for generating procedural content.
 *
 * This implementation provides 2D and 3D noise:
 *
 *    var simplex = new Simplex();
 *    simplex.get(2, 4);
 *    simple.get3d(1, 2, 4);
 *
 * You can optionally
 * pass a seedable pseudo-random number generator to its constructor. This
 * generator object is assumed to have a `random()` method; `Math` is used
 * per default:
 *
 *     var Alea = require('gamejs/math/random').Alea;
 *     var simplex = new Simplex(new Alea());
 *
 * Also see `gamejs/math/random` for a seedable pseudo random number generator
 *
 * @see gamejs/utils/prng
 */

// Ported to JS by by zz85 <https://github.com/zz85> from Stefan
// Gustavson's java implementation
// <http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf>
// Read Stefan's excellent paper for details on how this code works.
//
// Sean McCullough banksean@gmail.com

/**
 * @param {Object} randomNumberGenerator the random number generator to use; most provide `random()` method
 * @usage
 *  var simplex = new gamejs.noise.Simplex();
 *  simplex.get(x, y);
 *  // or for 3d noise
 *  simple.get(x, y, y);
 */

var Simplex = exports.Simplex = function(r) {
  if (r === undefined) {
    r = Math;
  }
  /** @ignore */
  this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
               [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
               [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  /** @ignore */
  this.p = [];
  var i;
  for (i=0; i<256; i++) {
   this.p[i] = Math.floor(r.random()*256);
  }
  // To remove the need for index wrapping, double the permutation table length
  /** @ignore */
  this.perm = [];
  for(i=0; i<512; i++) {
    this.perm[i]=this.p[i & 255];
  }

  // A lookup table to traverse the simplex around a given point in 4D.
  // Details can be found where this table is used, in the 4D noise method.
  /** @ignore */
  this.simplex = [
    [0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],
    [0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],
    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],
    [1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],
    [1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],
    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],
    [2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],
    [2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]];
};

/** @ignore */
Simplex.prototype.dot = function(g, x, y) {
   return g[0]*x + g[1]*y;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @returns {Number} noise for given position, in range [-1, 1]
 */
Simplex.prototype.get = function(xin, yin) {
  var n0, n1, n2; // Noise contributions from the three corners
  // Skew the input space to determine which simplex cell we're in
  var F2 = 0.5*(Math.sqrt(3.0)-1.0);
  var s = (xin+yin)*F2; // Hairy factor for 2D
  var i = Math.floor(xin+s);
  var j = Math.floor(yin+s);
  var G2 = (3.0-Math.sqrt(3.0))/6.0;
  var t = (i+j)*G2;
  var X0 = i-t; // Unskew the cell origin back to (x,y) space
  var Y0 = j-t;
  var x0 = xin-X0; // The x,y distances from the cell origin
  var y0 = yin-Y0;
  // For the 2D case, the simplex shape is an equilateral triangle.
  // Determine which simplex we are in.
  var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
  if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1)
  else {i1=0; j1=1;} // upper triangle, YX order: (0,0)->(0,1)->(1,1)
  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
  // c = (3-sqrt(3))/6
  var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
  var y1 = y0 - j1 + G2;
  var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
  var y2 = y0 - 1.0 + 2.0 * G2;
  // Work out the hashed gradient indices of the three simplex corners
  var ii = i & 255;
  var jj = j & 255;
  var gi0 = this.perm[ii+this.perm[jj]] % 12;
  var gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
  var gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
  // Calculate the contribution from the three corners
  var t0 = 0.5 - x0*x0-y0*y0;
  if(t0<0) {
    n0 = 0.0;
  } else {
    t0 *= t0;
    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); // (x,y) of grad3 used for 2D gradient
  }
  var t1 = 0.5 - x1*x1-y1*y1;
  if(t1<0) {
    n1 = 0.0;
  } else {
    t1 *= t1;
    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
  }
  var t2 = 0.5 - x2*x2-y2*y2;
  if(t2<0) {
    n2 = 0.0;
  } else {
    t2 *= t2;
    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
  }
  // Add contributions from each corner to get the final noise value.
  // The result is scaled to return values in the interval [-1,1].
  return 70.0 * (n0 + n1 + n2);
};


/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} y
 * @returns {Number} noise for given position, in range [-1, 1]
 */
Simplex.prototype.get3d = function(xin, yin, zin) {
  var n0, n1, n2, n3; // Noise contributions from the four corners
  // Skew the input space to determine which simplex cell we're in
  var F3 = 1.0/3.0;
  var s = (xin+yin+zin)*F3; // Very nice and simple skew factor for 3D
  var i = Math.floor(xin+s);
  var j = Math.floor(yin+s);
  var k = Math.floor(zin+s);
  var G3 = 1.0/6.0; // Very nice and simple unskew factor, too
  var t = (i+j+k)*G3;
  var X0 = i-t; // Unskew the cell origin back to (x,y,z) space
  var Y0 = j-t;
  var Z0 = k-t;
  var x0 = xin-X0; // The x,y,z distances from the cell origin
  var y0 = yin-Y0;
  var z0 = zin-Z0;
  // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
  // Determine which simplex we are in.
  var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
  var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
  if(x0>=y0) {
    if(y0>=z0)
      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order
      else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order
    }
  else { // x0<y0
    if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order
    else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order
    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order
  }
  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
  // c = 1/6.
  var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
  var y1 = y0 - j1 + G3;
  var z1 = z0 - k1 + G3;
  var x2 = x0 - i2 + 2.0*G3; // Offsets for third corner in (x,y,z) coords
  var y2 = y0 - j2 + 2.0*G3;
  var z2 = z0 - k2 + 2.0*G3;
  var x3 = x0 - 1.0 + 3.0*G3; // Offsets for last corner in (x,y,z) coords
  var y3 = y0 - 1.0 + 3.0*G3;
  var z3 = z0 - 1.0 + 3.0*G3;
  // Work out the hashed gradient indices of the four simplex corners
  var ii = i & 255;
  var jj = j & 255;
  var kk = k & 255;
  var gi0 = this.perm[ii+this.perm[jj+this.perm[kk]]] % 12;
  var gi1 = this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]] % 12;
  var gi2 = this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]] % 12;
  var gi3 = this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]] % 12;
  // Calculate the contribution from the four corners
  var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
  if(t0<0) {
    n0 = 0.0;
  } else {
    t0 *= t0;
    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0);
  }
  var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
  if(t1<0) {
    n1 = 0.0;
  } else {
    t1 *= t1;
    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1);
  }
  var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
  if(t2<0) {
    n2 = 0.0;
  } else {
    t2 *= t2;
    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2);
  }
  var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
  if(t3<0) {
    n3 = 0.0;
  } else {
    t3 *= t3;
    n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3);
  }
  // Add contributions from each corner to get the final noise value.
  // The result is scaled to stay just inside [-1,1]
  return 32.0*(n0 + n1 + n2 + n3);
};

},{}],15:[function(require,module,exports){
/**
 * @fileoverview A seedable random-number generator.
 *
 * A generator is initialized by GameJs and can be used with the
 * static functions of this module:
 *
 *    gamejs.random.choose([1,2,4]);
 *    // integet between and including 2 and 5
 *    gamejs.random.integer(2, 5);
 *
 * You can re-initialize this generator with a different seed by
 * calling `gamejs.utils.prng.init(seed)` after which the static
 * functions in this module will use the new seed.
 *
 * @usage
 *  var prng = require('gamejs/math/random');
 *  prng.random(); // 0.6765871671959758
 *  prng.integer(2, 10); // 5
 *  prng.choose([1,2,3,4,5]); // 3
 */
// From http://baagoe.com/en/RandomMusings/javascript/
// Johannes Baagøe <baagoe@baagoe.com>, 2010
// API modified by Simon Oberhammer <simon@nekapuzer.at>, 2012
// discussion of the used algorithms <http://baagoe.org/en/w/index.php/Better_random_numbers_for_javascript>


/** @ignore **/
var Mash = function Mash() {
  var n = 0xefc8249d;
  this.hash = function(data) {
    data = data.toString();
    var i;
    for (i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  this.version = 'Mash 0.9';
  return this;
};

/**
 * A seedable pseudo-random number generator.
 * @param {Number|String} seed the seed for generating the numbers
 *
 * @usage
 *  var prng = require('gamejs/math/random');
 *  var seed = 'gamejs';
 *  var alea = new prng.Alea(seed);
 *  alea.random(); // 0.6765871671959758
 *  alea.random(); // 0.15881546027958393
 *
 *  // generator with the same seed will generate the same sequence
 *  // of numbers:
 *  var aleaTwo = new prng.Alea(seed);
 *  aleaTwo.random(); // 0.6765871671959758
 *  aleaTwo.random(); // 0.15881546027958393
 */
var Alea = exports.Alea = function Alea() {
   var args = Array.prototype.slice.call(arguments);
   var s0 = 0;
   var s1 = 0;
   var s2 = 0;
   var c = 1;
   if (args.length === 0 || !args[0]) {
     args = [Date.now()];
   }
   var mash = new Mash();
   s0 = mash.hash(' ');
   s1 = mash.hash(' ');
   s2 = mash.hash(' ');

   var i;
   for (i = 0; i < args.length; i++) {
     s0 -= mash.hash(args[i]);
     if (s0 < 0) {
       s0 += 1;
     }
     s1 -= mash.hash(args[i]);
     if (s1 < 0) {
       s1 += 1;
     }
     s2 -= mash.hash(args[i]);
     if (s2 < 0) {
       s2 += 1;
     }
   }
   mash = null;

   /**
    * @returns {Number} the next random number as determined by the seed
    */
   this.random = function() {
     var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
     s0 = s1;
     s1 = s2;
     s2 = t - (c = t | 0);
     return s2;
   };
   this.integer = function(min, max) {
     return min + parseInt(this.random() * (max-min+1), 10);
   };
   this.vector = function(min, max) {
      return [this.integer(min[0], max[0]), this.integer(min[1], max[1])];
   };
   this.choose = function(items) {
      return items[this.integer(0, items.length-1)];
   };
   return this;
};

// alea instance per gamejs instance
var alea = null;

/**
 * @param {Number} min
 * @param {Number} max
 * @returns {Number} random integer between min and max
 */
var integer = exports.integer = function(min, max){
    return alea.integer(min, max);
};

/**
 * @param {Array} minVector 2 integers, the minimum vector
 * @param {Array} maxVector 2 integers, the maximum vector
 * @returns {Array} a random vector [min[0]<=x<=max[0], min[1]<=y<=max[1]]
 */
exports.vector = function(min, max){
    return alea.vector(min, max);
};

/**
 * @param {Array} items
 * @returns {Object} random item from items list
 */
exports.choose = function(items){
    return alea.choose(items);
};

/**
 * @returns {Number} next random float between 0 and 1
 */
exports.random = function() {
  return alea.random();
};

/**
 * Re-initialize the per instance random number generator used
 * in the static functions on this module (e.g. vector())
 * @param {Number|String} seed
 */
exports.init = function(seed) {
  alea = new Alea(seed);
};
},{}],16:[function(require,module,exports){
/**
 * Vector operations.

 */
var angles = require('./angles');

/**
 * @param {Array} origin point [b0, b1]
 * @param {Array} target point [b0, b1]
 * @returns {Number} distance between two points
 */
exports.distance = function(a, b) {
   return len(subtract(a, b));
};

/**
 * subtracts vectors [a0, a1] - [a0, a1]
 * @param {Array} a
 * @param {Array} b
 * @returns {Array} vector
 */
var subtract = exports.subtract = function(a, b) {
   return [a[0] - b[0], a[1] - b[1]];
};

/**
 * adds vectors [a0, a1] - [a0, a1]
 * @param {Array} a vector
 * @param {Array} b vector
 * @returns {Array} vector
 */
var add = exports.add = function(a, b) {
   return [a[0] + b[0], a[1] + b[1]];
};

/**
 * multiply vector with scalar or other vector
 * @param {Array} vector [v0, v1]
 * @param {Number|Array} vector or number
 * @returns {Number|Array} result
 */
var multiply = exports.multiply = function(a, s) {
   if (typeof s === 'number') {
      return [a[0] * s, a[1] * s];
   }

   return [a[0] * s[0], a[1] * s[1]];
};

/**
 * @param {Array} a vector
 * @param {Number} s
 */
exports.divide = function(a, s) {
   if (typeof s === 'number') {
      return [a[0] / s, a[1] / s];
   }
   throw new Error('only divide by scalar supported');
};

/**
 * @param {Array} vector [v0, v1]
 * @returns {Number} length of vector
 */
var len = exports.len = function(v) {
   return Math.sqrt(v[0]*v[0] + v[1]*v[1]);
};

/**
 *
 * normalize vector to unit vector
 * @param {Array} vector [v0, v1]
 * @returns {Array} unit vector [v0, v1]
 */
var unit = exports.unit = function(v) {
   var l = len(v);
   if(l) {
      return [v[0] / l, v[1] / l];
   }
   return [0, 0];
};

/**
 *
 * rotate vector
 * @param {Array} vector [v0, v1]
 * @param {Number} angle to rotate vector by, radians. can be negative
 * @returns {Array} rotated vector [v0, v1]
 */
exports.rotate=function(v, angle){
   angle=angles.normaliseRadians(angle);
   return [v[0]* Math.cos(angle)-v[1]*Math.sin(angle),
           v[0]* Math.sin(angle)+v[1]*Math.cos(angle)];

};

/**
 *
 * calculate vector dot product
 * @param {Array} vector [v0, v1]
 * @param {Array} vector [v0, v1]
 * @returns {Number} dot product of v1 and v2
 */
var dot = exports.dot=function(v1, v2){
   return (v1[0] * v2[0]) + (v1[1] * v2[1]);
};

/**
 *
 * calculate angle between vectors
 * @param {Array} vector [v0, v1]
 * @param {Array} vector [v0, v1]
 * @returns {Number} angle between v1 and v2 in radians
 */
exports.angle=function(v1, v2){
   var perpDot = v1[0] * v2[1] - v1[1] * v2[0];
   return Math.atan2(perpDot, dot(v1,v2));
};

/**
 * @returns {Array} vector with max length as specified.
 */
exports.truncate = function(v, maxLength) {
   if (len(v) > maxLength) {
      return multiply(unit(v), maxLength);
   }
   return v;
};


/**
 * @returns the center of multipled 2d points
 * @param {Array} first point
 * @param {Array} second point
 * @param {Array} ...
 */
exports.centroid = function() {
   var args = Array.prototype.slice.apply(arguments, [0]);
   var c = [0,0];
   args.forEach(function(p) {
      c[0] += parseInt(p[0], 10);
      c[1] += parseInt(p[1], 10);
   });
   var len = args.length;
   return [
      c[0] / len,
      c[1] / len
   ];
};

},{"./angles":11}],17:[function(require,module,exports){
/**
 * @fileoverview
 * A* path finding algorithm
 *
 * Use the `findRoute(map, from, to, [timeout])` function to get the linked list
 * leading `from` a point `to` another on the given `map`.
 *
 * The map must implement the interface `gamejs.pathfinding.Map`. This
 * class already holds an example implementation for debugging use.
 *
 * Optionally, the search is cancelled after `timeout` in millseconds.
 *
 * If there is no route `null` is returned.
 *
 * @see http://en.wikipedia.org/wiki/A*_search_algorithm
 * @see http://eloquentjavascript.net/chapter7.html
 */
var BinaryHeap = require('./math/binaryheap').BinaryHeap;

/**
 * helper function for A*
 */
function ReachedList(hashFn) {
   var list = {};

   this.store = function(point, route) {
      list[hashFn(point)] = route;
      return;
   };

   this.find = function(point) {
      return list[hashFn(point)];
   };
   return this;
}


/** A* search function.
 *
 * This function expects a `Map` implementation and the origin and destination
 * points given. If there is a path between the two it will return the optimal
 * path as a linked list. If there is no path it will return null.
 *
 * The linked list is in reverse order: the first item is the destination and
 * the path to the origin follows.
 *
 * @param {Map} map map instance, must follow interface defined in {Map}
 * @param {Array} origin
 * @param {Array} destination
 * @param {Number} timeout milliseconds after which search should be canceled
 * @returns {Object} the linked list leading from `to` to `from` (sic!).
 **/
exports.findRoute = function(map, from, to, timeout) {
   var open = new BinaryHeap(routeScore);
   var hashFn = typeof map.hash === 'function' ? map.hash : defaultHash;
   var reached = new ReachedList(hashFn);

   function routeScore(route) {
      if (route.score === undefined) {
         route.score = map.estimatedDistance(route.point, to) + route.length;
      }
      return route.score;
   }
   function addOpenRoute(route) {
      open.push(route);
      reached.store(route.point, route);
   }

   function processNewPoints(direction) {
      var known = reached.find(direction);
      var newLength = route.length + map.actualDistance(route.point, direction);
      if (!known || known.length > newLength){
         if (known) {
            open.remove(known);
         }
         addOpenRoute({
            point: direction,
            from: route,
            length: newLength
         });
      }
   }
   var startMs = Date.now();
   var route = null;
   addOpenRoute({
      point: from,
      from: null,
      length: 0
   });
   var equalsFn = typeof map.equals === 'function' ? map.equals : defaultEquals;
   while (open.size() > 0 && (!timeout || Date.now() - startMs < timeout)) {
      route = open.pop();
      if (equalsFn(to, route.point)) {
         return route;
      }
      map.adjacent(route.point).forEach(processNewPoints);
   } // end while
   return null;
};

var defaultEquals = function(a, b) {
   return a[0] === b[0] && a[1] === b[1];
};

var defaultHash = function(a) {
   return a[0] + '-' + a[1];
};

/**
 * This is the interface for a Map that can be passed to the `findRoute()`
 * function. `Map` is not instantiable - see the unit tests for an example
 * implementation of Map.
 */
var Map = exports.Map = function() {
   throw new Error('not instantiable, this is an interface');
};

/**
 * @param {Array} origin
 * @returns {Array} list of points accessible from given Point
 */
Map.prototype.adjacent = function(origin) {
};

/**
 * @param {Object} a one of the points ot test for equality
 * @param {Object} b ... the other point
 * @returns Wheter the two points are equal.
 */
Map.prototype.equals = defaultEquals;

/**
 * @param {Object} a point
 * @returns {String} hash for the point
 */
Map.prototype.hash = defaultHash;

/**
 * Estimated lower bound distance between two points.
 * @param {Object} pointA
 * @param {Object} pointB
 * @returns {Number} the estimated distance between two points
 */
Map.prototype.estimatedDistance = function(pointA, pointB) {
   return 1;
};

/**
 * Actual distance between two points.
 * @param {Object} pointA
 * @param {Object} pointB
 * @returns {Number} the actual distance between two points
 */
Map.prototype.actualDistance = function(pointA, pointB) {
   return 1;
};

},{"./math/binaryheap":12}],18:[function(require,module,exports){
var gamejs = require('../gamejs');
var objects = require('./utils/objects');

/**
 * @fileoverview Image mask. Usefull for pixel perfect collision detection:
 *
 * @example
 * var unitMask = new Maks(unitSurface, collisionThresholdAlphaValue);
 * var spearMask = new Maks(unitSurface, collisionThresholdAlphaValue);
 * var collide = unitMask.overlap(spearMask);
 */


/**
 * Creates an image mask from the given Surface. The alpha of each pixel is checked
 * to see if it is greater than the given threshold. If it is greater then
 * that pixel is set as not colliding.
 *
 * @param {Surface} surface used for image mask
 * @param {Number} threshold 0 to 255. defaults to: 255, fully transparent
 *
 */
var Mask = exports.Mask = function(surface, threshold) {
   /**
    * @ignore
    */
   this._bits = [];

   threshold = (threshold && (255 - threshold)) || 255;
   var imgData = surface.getImageData().data;
   var dims = surface.getSize();
   /**
    * @ignore
    */
   this.width = dims[0];
   /**
    * @ignore
    */
   this.height = dims[1];

   var i,j;
   for (i=0;i<this.width;i++) {
      this._bits[i] = [];
      for (j=0;j<this.height;j++) {
         this._bits[i][j] = false;
      }
   }
   for (i=0;i<imgData.length;i += 4) {
      // y: pixel # / width
      var y = parseInt((i / 4) / dims[0], 10);
      // x: pixel # % width
      var x = parseInt((i / 4) % dims[0], 10);
      var alpha = imgData[i+3];
      if (alpha >= threshold) {
         this.setAt(x, y);
      }
   }
   return;
};

/**
 * @param {gamejs.mask.Mask} otherMask
 * @param {Array} offset [x,y]
 * @returns the overlapping rectangle or null if there is no overlap;
 */
Mask.prototype.overlapRect = function(otherMask, offset) {
   var arect = this.rect;
   var brect = otherMask.rect;
   if (offset) {
      brect.moveIp(offset);
   }
   // bounding box intersect
   if (!brect.collideRect(arect)) {
      return null;
   }
   var xStart = Math.max(arect.left, brect.left);
   var xEnd = Math.min(arect.right, brect.right);

   var yStart = Math.max(arect.top, brect.top);
   var yEnd = Math.min(arect.bottom, brect.bottom);

   return new gamejs.Rect([xStart, yStart], [xEnd - xStart, yEnd - yStart]);
};

/**
 *
 * @returns True if the otherMask overlaps with this map.
 * @param {Mask} otherMask
 * @param {Array} offset
 */
Mask.prototype.overlap = function(otherMask, offset) {
   var overlapRect = this.overlapRect(otherMask, offset);
   if (overlapRect === null) {
      return false;
   }

   var arect = this.rect;
   var brect = otherMask.rect;
   if (offset) {
      brect.moveIp(offset);
   }

   var count = 0;
   var x,y;
   for (y=overlapRect.top; y<=overlapRect.bottom; y++) {
      for (x=overlapRect.left; x<=overlapRect.right; x++) {
         if (this.getAt(x - arect.left, y - arect.top) &&
             otherMask.getAt(x - brect.left, y - brect.top)) {
             return true;
         }
      }
   }
   // NOTE this should not happen because either we bailed out
   // long ago because the rects do not overlap or there is an
   // overlap and we should not have gotten this far.
   // throw new Error("Maks.overlap: overlap detected but could not create mask for it.");
   return false;
};

/**
 * @param {gamejs.mask.Mask} otherMask
 * @param {Array} offset [x,y]
 * @returns the number of overlapping pixels
 */
Mask.prototype.overlapArea = function(otherMask, offset) {
   var overlapRect = this.overlapRect(otherMask, offset);
   if (overlapRect === null) {
      return 0;
   }

   var arect = this.rect;
   var brect = otherMask.rect;
   if (offset) {
      brect.moveIp(offset);
   }

   var count = 0;
   var x,y;
   for (y=overlapRect.top; y<=overlapRect.bottom; y++) {
      for (x=overlapRect.left; x<=overlapRect.right; x++) {
         if (this.getAt(x - arect.left, y - arect.top) &&
             otherMask.getAt(x - brect.left, y - brect.top)) {
             count++;
         }
      }
   }
   return count;
};

/**
 * @param {gamejs.mask.Mask} otherMask
 * @param {Array} offset [x,y]
 * @returns a mask of the overlapping pixels
 */
Mask.prototype.overlapMask = function(otherMask, offset) {
   var overlapRect = this.overlapRect(otherMask, offset);
   if (overlapRect === null) {
      return 0;
   }

   var arect = this.rect;
   var brect = otherMask.rect;
   if (offset) {
      brect.moveIp(offset);
   }

   var mask = new Mask(new gamejs.graphics.Surface([overlapRect.width, overlapRect.height]));
   var x,y;
   for (y=overlapRect.top; y<=overlapRect.bottom; y++) {
      for (x=overlapRect.left; x<=overlapRect.right; x++) {
         if (this.getAt(x - arect.left, y - arect.top) &&
             otherMask.getAt(x - brect.left, y - brect.top)) {
             mask.setAt(x, y);
         }
      }
   }
   return mask;
};

/**
 * Set bit at position.
 * @param {Number} x
 * @param {Number} y
 */
Mask.prototype.setAt = function(x, y) {
   this._bits[x][y] = true;
};

/**
 * Get bit at position.
 *
 * @param {Number} x
 * @param {Number} y
 */
Mask.prototype.getAt = function(x, y) {
   x = parseInt(x, 10);
   y = parseInt(y, 10);
   if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return false;
   }
   return this._bits[x][y];
};


/**
 * Flip the bits in this map.
 */
Mask.prototype.invert = function() {
   this._bits = this._bits.map(function(row) {
      return row.map(function(b) {
         return !b;
      });
   });
};

/**
 * @returns {Array} the dimensions of the map
 */
Mask.prototype.getSize = function() {
   return [this.width, this.height];
};

objects.accessors(Mask.prototype, {
   /**
    * Rect of this Mask.
    */
   'rect': {
      get: function() {
         return new gamejs.Rect([0, 0], [this.width, this.height]);
      }
   },
   /**
    * @returns {Number} number of set pixels in this mask.
    */
   'length': {
      get: function() {
         var c = 0;
         this._bits.forEach(function(row) {
            row.forEach(function(b) {
               if (b) {
                  c++;
               }
            });
         });
         return c;
      }
   }
});

},{"../gamejs":2,"./utils/objects":25}],19:[function(require,module,exports){
var gamejs = require('../gamejs');
var uri = require('./utils/uri');
var Callback = require('./utils/callback').Callback;

/**
 * ignore
 */
var _EVENTS = exports._EVENTS = {
   RESULT: 1001,
   ALIVE: 1002,
   LOG: 1004
};

/**
 * @fileoverview
 *
 * gamejs.worker makes it more convinient to work with W3C WebWorkers by providing a way to run
 * CommonJs modules inside of them. GameJs also provides the typically `gamejs.ready()` and
 * event loop to facilitate communication between workers and the main application.
 *
 * See the `examples/workers` directory for a running example.
 *
 * Create a worker with the main module "foo-worker" (see below for how the worker's module looks like):
 *
 *     var fooWorker = new Worker('./foo-worker');
 *     // Send a message to your worker.
 *     // The Message doesn't have to be a string but it
 *     // must be `JSON.stringify()`-able
 *     fooWorker.post("foobar");
 *
 * You can also recieve messages from the worker:
 *
 *     // recieve events from the worker
 *     fooWorker.onEvent(function(event) {
 *         if(event.timestamp > ...)
 *      });
 *
 * And this is how the above referenced "foo-worker" module would looke like. As usual, we need a
 * `gamejs.ready()` to get started and within that we bind an event handler:
 *
 *     var gamejs = require('gamejs');
 *     gamejs.ready(function() {
 *         gamejs.event.onEvent(function(event) {
 *              var plaintext = fastCrack(event.password)
 *              ....
 *          });
 *     });
 *
 * Our event worker could do expensive calculations (seperate and not blocking the main game) when
 * recieving an event. Once the result is caculated, it can be sent back to the main application
 * with `gamejs.thread.post()`:
 *
 *     gamejs.thread.post({
 *        info: "important message from worker",
 *        timestamp: 12232435234
 *      });
 *
 * The main application would in turn recieve an event posted like this from `fooWorker.onEvent`, as seen above.
 *
 * This module is useful for expensive algorithms where the result does not have to available instantiously
 * (e.g., path-finding) or for continous logic which can be
 * calculated seperately from the rendering loop, and which only needs to feed back into the model of the rendering every
 * now and then (e.g. physics) The main draw back of the `Worker` model is that
 * you can only communicate with them via text messages (typically JSON.stringify()ed messages).
 */

/**
 * true if this GameJs instance is being executed within a WebWorker
 * @type Boolean
 */
var inWorker = exports.inWorker = (this.importScripts !== undefined);

/**
 * executed in scope of worker
 * @ignore
 */
exports._ready = function() {
   self.onmessage = function(event) {
      gamejs.event._triggerCallbacks(event.data);
   };
   self.postMessage({
     type: _EVENTS.ALIVE
   });
};

/**
 * Send an event back to the main script.
 * @param {Object} data to be sent back to main script
 */
exports.post = function(data) {
  if (inWorker) {
    self.postMessage({
       type: _EVENTS.RESULT,
       data: data
    });
  } else {
    throw new Error('gamejs.postMessage only available in a thread/worker module');
  }
};

/**
 * Send message to main context for logging
 * @ignore
 **/
exports._logMessage = function() {
   var args = [];
   Array.prototype.forEach.call(arguments, function(a) {
     args.push(a);
   });
   self.postMessage({
      type: _EVENTS.LOG,
      arguments: args
   });
};


/**
  * executed in scope of worker before user's main module
  * @ignore
  */
var workerPrefix = function workerPrefix() {
   __scripts.forEach(function(script) {
      try {
         importScripts(script);
      } catch (e) {
         // can't help the worker
      }
   });
};

/**
 * Setup a worker which has `require()` defined
 * @ignore
 **/
var create = function(workerModuleId) {
   var moduleRoot = uri.resolve(document.location.href, window.require.getModuleRoot());
   var initialScripts = [];
   Array.prototype.slice.apply(document.getElementsByTagName('script'), [0]).forEach(function(script) {
      if (script.src) {
         initialScripts.push(script.src);
      }
   });

   var URL = window.URL || window.webkitURL;
   var prefixString = workerPrefix.toString();
   // don't be afraid...
   prefixString = prefixString.substring(prefixString.indexOf("{") + 1, prefixString.lastIndexOf("}"));
   var blob = new Blob([
      'var __scripts = ["' + initialScripts.join('","') + '"];',
      prefixString,
      ';self.require.setModuleRoot("' + moduleRoot + '");',
      'self.require.run("'+ workerModuleId +'");'
   ], {type: 'application\/javascript'});

   var blobURL = URL.createObjectURL(blob);
   return new Worker(blobURL);
};

/**
 * The `Worker` constructor takes only one argument: a module id. This module
 * will be executed inside the newly created Worker. It is effectively the
 * main module of the Worker.
 *
 * Inside a Worker, you can use `require()` to import other scripts or
 * GameJs modules.
 *
 * **Note:** A Worker does not have access to the browser's `document`. So
 * a lot of GameJs modules - everything related to drawing to the canvas -
 * do not work in the Worker.
 *
 * You can use `gamejs.time.*`, `gamejs.utils.*`, `gamejs.event.*` and probably others
 * (as well as any module you write yourself for this purpose, of course).
 *
 * @param {String} moduleId The Worker's main module id. The main module will be executed in the worker
 */
exports.Worker = function(moduleId) {
   // FIXME id should be unchangeable
   /**
    * Unique id of this worker
    * @property {Number}
    */
   var id = this.id = guid(moduleId);
   var worker = create(moduleId);
   var deadQueue = [];
   var alive = false;
   var self  = this;
   var _CALLBACKS = [];
   var _ERROR_CALLBACKS = [];

   function triggerCallbacks(callbacks, event) {
      callbacks.forEach(function(c) {
         c.trigger(event);
      });
   }

   worker.onmessage = function(event) {
      if (event.data.type === _EVENTS.ALIVE) {
         // if worker says he is alive -> send him the event queue so far
         alive = true;
         deadQueue.forEach(function(data) {
            self.post(data);
         });
      } else if (event.data.type === _EVENTS.LOG) {
         gamejs.logging.log.apply(null, [id].concat(event.data.arguments));
      } else {
         triggerCallbacks(_CALLBACKS, event.data.data);
      }
   };
   worker.onerror = function(event) {
      gamejs.logging.error('Error in worker "' + id + '" line ' + event.lineno + ': ', event.message);
      triggerCallbacks(_ERROR_CALLBACKS, {
         data: event.data,
         worker: self,
         event: event
      });
   };

   this.onEvent = function(fn, scope) {
      _CALLBACKS.push(new Callback(fn, scope));
   };

   this.onError = function(fn, scope) {
      _ERROR_CALLBACKS.push(new Callback(fn, scope));
   };

   /**
    * Send a message to the worker
    *
    * @param {Object} data Payload object which gets sent to the Worker
    */
   this.post = function(data) {
      if (alive) {
         worker.postMessage(data);
      } else {
         deadQueue.push(data);
      }
   };
   return this;
};

/**
 * not a real GUID
 * @ignore
 */
function guid(moduleId) {
   var S4 = function() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
   };
   return moduleId + '@' + (S4()+S4());
}
},{"../gamejs":2,"./utils/callback":24,"./utils/uri":27}],20:[function(require,module,exports){
var gamejs = require('../gamejs');
var objects = require('./utils/objects');
var xml = require('./utils/xml');
var base64 = require('./utils/base64');
var uri = require('./utils/uri');

/**
 * @fileoverview
 * This is a loader for the general purpose tile map editor "Tiled".
 *
 * This module can load all ".tmx" files even if additionally base64 encoded
 * (can be configured in Tiled).
 *
 * This module loads the whole map definition, including the TileSets with
 * all necessary images. For an example on how to render a map loaded with
 * this module, see `examples/tiledmap`.
 *
 * You will typically create a Map instance with `Map(url)` and deal
 * with the layers, tilesets, etc. through the Map instance
 * instead of loading & creating them yourself.
 *
 * Only orthogonol maps are supported (no isometric maps).
 *
 * @see http://www.mapeditor.org/
 * @see https://github.com/bjorn/tiled/wiki/TMX-Map-Format
 */

/**
 * My code is inspired by:
 *   * https://bitbucket.org/maikg/tiled2cocos/
 *   * https://github.com/obiot/melonJS/
 *
 */

/**
 * A Tiled Map holds all layers defined in the tmx file as well
 * as the necessary tiles to render the map.
 * @param {String} url Relative or absolute URL to the tmx file
 */
var Map = exports.Map = function(url) {

   url = uri.resolve(document.location.href, url);
   var xmlDoc = xml.Document.fromURL(url);
   var mapNode = xmlDoc.element('map');

   /**
    * Width of a single tile in pixels
    * @type Number
    */
   this.tileWidth = mapNode.attribute('tilewidth');
   /**
    * Height of a single tile in pixels
    * @type Number
    */
   this.tileHeight = mapNode.attribute('tileheight');
   /**
    * Width of the map in tiles
    * @type Number
    */
   this.width = mapNode.attribute('width');
   /**
    * Height of the map in tiles
    * @type Number
    */
   this.height = mapNode.attribute('height');

   var orientation = mapNode.attribute('orientation');
   if (orientation !== 'orthogonal') {
      throw new Error('only orthogonol maps supported');
   }

   /**
    * Custom properties of the map
    */
   this.properties = {};
   setProperties(this.properties, mapNode);

   /**
    * All tiles of this map.
    * @type {TileSet}
    */
   this.tiles = new TileSets(mapNode, url);
   this.layers = loadLayers(mapNode);
   return this;
};

/**
 * A Tile. Can not be instantiated. Get a Tile by calling `getTile(gid)`
 * on a `TileSets` instance.
 */
var Tile = exports.Tile = function() {
   /**
    * @type {gamejs.graphics.Surface}
    */
   this.surface = null;
   /**
    * @type {Object}
    */
   this.properties = null;
   throw new Error('Can not be instantiated.');
};

/**
 * A TileSets instance holds all tilesets of a map. This class
 * makes it easy to get the image for a certain tile ID. You usually
 * don't care about in which specific TileSet an image is so this
 * class holds them all and deals with the lookup.
 *
 * You don't usually create a `TileSets` instance yourself, instead
 * it is automatically created and attached to a `Map`.
 */
var TileSets = exports.TileSets = function(mapNode, mapUrl) {
   var tileSets = [];

   /**
    * Retrieve the image for a tile ID (gid).
    *
    * @param {Number} gid global tile id to retrieve
    * @returns {gamejs.graphics.Surface} the Surface for the gid
    */
   this.getSurface = function(gid) {
      var tile = this.getTile(gid);
      return tile && tile.surface || null;
   };

   /**
    * @param {Number} gid global tile id
    * @returns {Object} the custom properties of this tile
    */
   this.getProperties = function(gid) {
      var tile = this.getTile(gid);
      return tile && tile.properties || {};
   };

   /**
    * @param {Number} gid global tile id
    * @returns {Object} the Tile object for this gid
    */
   this.getTile = function(gid) {
      var tile = null;
      tileSets.some(function(tileSet, idx) {
         if (tileSet.firstGid <= gid) {
            tile = tileSet.tiles[gid - tileSet.firstGid];
            return true;
         }
         return false;
      }, this);
      return tile;
   };

   var loadTileSet = function(tileSetNode) {
      var tiles = [];
      var tileWidth = tileSetNode.attribute('tilewidth');
      var tileHeight = tileSetNode.attribute('tileheight');
      var spacing = tileSetNode.attribute('spacing') || 0;
      // broken in tiled?
      var margin = 0;

      var imageNode = tileSetNode.element('image');
      var imageAtlasFile = imageNode.attribute('source');
      var imageUrl = uri.makeRelative(uri.resolve(mapUrl, imageAtlasFile));
      var atlas = gamejs.image.load(imageUrl);
      // FIXME set transparency if imageNode.attribute('trans') is set

      var tileNodes = tileSetNode.elements('tile');
      var dims = atlas.getSize();
      var imgSize = new gamejs.Rect([0,0], [tileWidth, tileHeight]);
      var idx = 0;
      var y = 0;
      while (y + tileHeight <= dims[1]) {
         var x = 0;
         while (x + tileWidth <= dims[0]) {
            var tileImage = new gamejs.graphics.Surface(tileWidth, tileHeight);
            var rect = new gamejs.Rect([x, y], [tileWidth, tileHeight]);
            tileImage.blit(atlas, imgSize, rect);
            var tileProperties = {};
            /* jshint ignore:start */
            // function within loop
            tileNodes.some(function(tileNode) {
               if (tileNode.attribute('id') === idx) {
                  setProperties(tileProperties, tileNode);
                  return true;
               }
            }, this);
            /* jshint ignore:end */
            tiles.push({
               surface: tileImage,
               properties: tileProperties
            });
            x += tileWidth + spacing;
            idx++;
         }
         y += tileHeight + spacing;
      }
      return tiles;
   };

   /**
    *
    * constructor
    **/
   mapNode.elements('tileset').forEach(function(tileSetNode) {
      var firstGid = tileSetNode.attribute('firstgid');
      var externalSource = tileSetNode.attribute('source');
      if (externalSource) {
         var tileSetDocument = xml.Document.fromURL(uri.resolve(mapUrl, externalSource));
         tileSetNode = tileSetDocument.element('tileset');
      }
      tileSets.push({
         tiles: loadTileSet(tileSetNode),
         firstGid: firstGid
      });
   });
   tileSets.reverse();

   return this;
};

/**
 * loadLayers
 */
var H_FLIP = 0x80000000;
var V_FLIP = 0x40000000;
var loadLayers = function(mapNode) {
   var layers = [];

   var getGids = function(layerNode) {
      var dataNode = layerNode.element('data');
      var encoding = dataNode.attribute('encoding');
      var compression = dataNode.attribute('compression');
      var data = "";
      dataNode.children().forEach(function(textNode) {
         data += textNode.value();
      });
      var byteData = [];
      if (encoding === 'base64') {
         if (compression) {
            throw new Error('Compression of map data unsupported');
         }
         byteData = base64.decodeAsArray(data, 4);
      } else if (encoding === 'csv') {
         data.trim().split('\n').forEach(function(row) {
            row.split(',', width).forEach(function(entry) {
               byteData.push(parseInt(entry, 10));
            });
         });
      } else {
         // FIXME individual XML tile elements
         throw new Error('individual tile format not supported');
      }
      return byteData;
   };

   var width = mapNode.attribute('width');
   var height = mapNode.attribute('height');
   mapNode.elements('layer').forEach(function(layerNode) {
      // create empty gid matrix
      var gidMatrix = [];
      var i = height;
      while (i-->0) {
         var j = width;
         gidMatrix[i] = [];
         while (j-->0) {
            gidMatrix[i][j] = 0;
         }
      }

      getGids(layerNode).forEach(function(gid, idx) {
         // FIXME flipX/Y currently ignored
         var flipX = gid & H_FLIP;
         var flipY = gid & V_FLIP;
         // clear flags
         gid &= ~(H_FLIP | V_FLIP);
         gidMatrix[parseInt(idx / width, 10)][parseInt(idx % width, 10)] = gid;
      });
      layers.push({
         gids: gidMatrix,
         opacity: layerNode.attribute('opacity'),
         visible: layerNode.attribute('visible'),
         properties: setProperties({}, layerNode)
      });
   });
   return layers;
};

/**
 * set generic <properties><property name="" value="">... on given object
 */
var setProperties = function(object, node) {
   var props = node.element('properties');
   if (!props) {
      return;
   }
   props.elements('property').forEach(function(propertyNode) {
      var name = propertyNode.attribute('name');
      var value = propertyNode.attribute('value');
      object[name] = value;
   });
   return object;
};


/**
 * FIXME explain viewRect (change it to sroll!) and image, mapImage and how to update, redraw
 */
var MapView = exports.MapView = function(map) {

    this.timeout = 0;

    this.layerViews = map.layers.map(function(layer) {
      return new LayerView(layer, {
         tileWidth: map.tileWidth,
         tileHeight: map.tileHeight,
         width: map.width,
         height: map.height,
         tiles: map.tiles
      });
    });
    this.viewRect = new gamejs.Rect([0,0], [map.width * map.tileWidth, map.height*map.tileWidth]);
    this.image = new gamejs.graphics.Surface([this.viewRect.width, this.viewRect.height]);
    this.mapImage = this.image.clone();
    this.redraw();
    return this;
};

MapView.prototype.redraw = function() {
    this.layerViews.forEach(function(layer) {
        layer.draw(this.mapImage);
    }, this);
};

MapView.prototype.draw = function(display, offset) {
  display.blit(this.mapImage, offset || [0,0], this.viewRect);
};



/**
 * LayerView
 * Renders the layer to a big surface.
 */
var LayerView = exports.LayerView = function(layer, opts) {

   this.draw = function(display) {
      display.blit(this.surface);
   };
   /**
    * constructor
    */
   this.surface = new gamejs.graphics.Surface(opts.width * opts.tileWidth, opts.height * opts.tileHeight);
   this.surface.setAlpha(layer.opacity);

   /**
    * Note how below we look up the "gid" of the tile images in the TileSet from the Map
    * ('opt.tiles') to get the actual Surfaces.
    */
   layer.gids.forEach(function(row, i) {
      row.forEach(function(gid, j) {
         if (gid ===0) {
            return;
         }

         var tileSurface = opts.tiles.getSurface(gid);
         if (tileSurface) {
            this.surface.blit(tileSurface,
               new gamejs.Rect([j * opts.tileWidth, i * opts.tileHeight], [opts.tileWidth, opts.tileHeight])
            );
         } else {
            gamejs.log('no gid ', gid, i, j, 'layer', i);
         }
      }, this);
   }, this);
   return this;
};


},{"../gamejs":2,"./utils/base64":23,"./utils/objects":25,"./utils/uri":27,"./utils/xml":28}],21:[function(require,module,exports){
/**
 * @fileoverview
 * Only used by GameJs internally to provide a game loop.
 * @ignore
 */

var Callback = require('./utils/callback').Callback;

var TIMER_LASTCALL = null;
var STARTTIME = null;

/** @ignore **/
var _CALLBACKS = exports._CALLBACKS = [];
// `window` is not accessible in webworker (would lead to TypeError)
// @@ this cross-browser fuckery has to go away ASAP.
var reqAnimationFrame = typeof(window) != 'undefined' ?
                        window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame ||
                        null : null;

var reqAniFrameRecursive = function() {
   perInterval();
   reqAnimationFrame(reqAniFrameRecursive);
};

var triggerCallbacks = function(msDuration) {
   _CALLBACKS.forEach(function(c) {
      c.trigger(msDuration);
   });
};

/**
 * @ignore
 */
exports.init = function() {
   STARTTIME = Date.now();

   if (reqAnimationFrame) {
      reqAnimationFrame(reqAniFrameRecursive);
   } else {
      setInterval(perInterval, 10);
   }
   return;
};

var perInterval = function() {
   var msNow = Date.now();
   triggerCallbacks(msNow - (TIMER_LASTCALL || msNow));
   TIMER_LASTCALL = msNow;
   return;
};

},{"./utils/callback":24}],22:[function(require,module,exports){
/**
 * @fileoverview Utility functions for working with Obiects
 * @param {Object} item
 * @param {Array} array
 * @param {Object} returns removed item or null
 */

exports.remove = function(item, array) {
   var index = array.indexOf(item);
   if (index !== -1) {
      return array.splice(array.indexOf(item), 1);
   }
   return null;
};

/**
 * Shuffles the array *in place*.
 * @see http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */
exports.shuffle = function(array) {
    var len = array.length -1;
    for (var i = len; i > 0; i--) {
        var idx = parseInt(Math.random() * (i + 1), 10);
        var item = array[i];
        array[i] = array[idx];
        array[idx] = item;
    }
    return array;
};

},{}],23:[function(require,module,exports){
/**
 * @fileoverview
 * Base64 encode / decode
 * @author http://www.webtoolkit.info
 */


var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

/**
 * Decodes a base64 encoded string to a string.
 */
var decode = exports.decode = function(input) {
   var output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
   input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

   while (i < input.length) {
      enc1 = keyStr.indexOf(input.charAt(i++));
      enc2 = keyStr.indexOf(input.charAt(i++));
      enc3 = keyStr.indexOf(input.charAt(i++));
      enc4 = keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output.push(String.fromCharCode(chr1));

      if (enc3 != 64) {
         output.push(String.fromCharCode(chr2));
      }
      if (enc4 != 64) {
         output.push(String.fromCharCode(chr3));
      }
   }

   output = output.join('');
   return output;
};

/**
 * Decodes a base64 encoded string into a byte array
 * @param {String} input
 * @param {Array} bytes bytes per character, defaults to 1
 */
exports.decodeAsArray = function(input, bytes) {
   bytes = bytes || 1;
   var decoded = decode(input);
   var len = decoded.length / bytes;
   var array = [];
   var i,j;
   for (i=0; i< len; i++) {
      array[i] = 0;
      for (j = bytes - 1; j >=0; --j) {
         array[i] += decoded.charCodeAt((i * bytes) + j) << (j <<3 );
      }
   }
   return array;
}
;
},{}],24:[function(require,module,exports){
/**
 * @fileoverview
 * Manage a callback with invocation scope. This is used internally by GameJs but might be useful for others.
 */

/**
 * @param {Function} callback
 * @param {Object} scope with which the callback will be triggered
 */
var Callback = exports.Callback = function(fn, scope) {
	this.fn = fn;
	this.fnScope = scope || {};
	return this;
};
/**
 * Any arguments passed to `trigger` will be passed to the callback.
 */
Callback.prototype.trigger = function() {
	this.fn.apply(this.fnScope, arguments);
};
},{}],25:[function(require,module,exports){
/**
 * @fileoverview Utility functions for working with Objects
 */

/**
 * Put a prototype into the prototype chain of another prototype.
 * @param {Object} subClass
 * @param {Object} superClass
 */
exports.extend = function(subClass, superClass) {
   if (subClass === undefined) {
      throw new Error('unknown subClass');
   }
   if (superClass === undefined) {
      throw new Error('unknown superClass');
   }
   var F;
   /* jshint ignore:start */
   F = new Function();
   /* jshint ignore:start */
   F.prototype = superClass.prototype;
   /* jshint ignore:end */
   subClass.prototype = new F();
   subClass.prototype.constructor = subClass;
   subClass.superClass = superClass.prototype;
   subClass.superConstructor = superClass;
   return;
};

/**
 * Creates a new object as the as the keywise union of the provided objects.
 * Whenever a key exists in a later object that already existed in an earlier
 * object, the according value of the earlier object takes precedence.
 * @param {Object} obj... The objects to merge
 */
exports.merge = function() {
   var result = {};
   var i, property;
      for (i = arguments.length; i > 0; --i) {
         var obj = arguments[i - 1];
         for (property in obj) {
            result[property] = obj[property];
         }
      }
   return result;
};

/**
 * fallback for Object.keys
 * @param {Object} obj
 * @returns {Array} list of own properties
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
 */
var keys = exports.keys = function(obj) {
   if (Object.keys) {
      return Object.keys(obj);
   }

   var ret=[],p;
   for (p in obj) {
      if(Object.prototype.hasOwnProperty.call(obj, p)) {
         ret.push(p);
      }
   }
   return ret;
};

/**
 * Create object accessors
 * @param {Object} object The object on which to define the property
 * @param {String} name name of the property
 * @param {Function} get
 * @param {Function} set
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty
 */
var accessor = exports.accessor = function(object, name, get, set) {
   // ECMA5
   if (Object.defineProperty !== undefined) {
      Object.defineProperty(object, name, {
         get: get,
         set: set
      });
   // non-standard
   } else if (Object.prototype.__defineGetter__ !== undefined) {
      object.__defineGetter__(name, get);
      if (set) {
         object.__defineSetter__(name, set);
      }
   }
	return;
};

/**
 * @param {Object} object The object on which to define or modify properties.
 * @param {Object} props An object whose own enumerable properties constitute descriptors for the properties to be defined or modified.
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperties
 */
exports.accessors = function(object, props) {
   keys(props).forEach(function(propKey) {
      accessor(object, propKey, props[propKey].get, props[propKey].set);
   });
   return;
};

},{}],26:[function(require,module,exports){
/**
 * @fileoverview Working with strings
 */

/**
 * Get the longest common segment that two strings
 * have in common, starting at the beginning of the string
 * @param {String} str1 a string
 * @param {String} str2 another string
 * @returns {String} the longest common segment
 */
exports.getCommonPrefix = function getCommonPrefix(str1, str2) {
    if (str1 === null || str2 === null) {
        return null;
    } else if (str1.length > str2.length && str1.indexOf(str2) === 0) {
        return str2;
    } else if (str2.length > str1.length && str2.indexOf(str1) === 0) {
        return str1;
    }
    var length = Math.min(str1.length, str2.length);
    var i;
    for (i = 0; i < length; i++) {
        if (str1[i] != str2[i]) {
            return str1.slice(0, i);
        }
    }
    return str1.slice(0, length);
};
},{}],27:[function(require,module,exports){
/**
 * @fileoverview Utilies for URI handling.
 *
 */

var URI_REGEX = new RegExp(
    '^' +
    '(?:' +
      '([^:/?#.]+)' +                     // scheme - ignore special characters
                                          // used by other URL parts such as :,
                                          // ?, /, #, and .
    ':)?' +
    '(?://' +
      '(?:([^/?#]*)@)?' +                 // userInfo
      '([\\w\\d\\-\\u0100-\\uffff.%]*)' + // domain - restrict to letters,
                                          // digits, dashes, dots, percent
                                          // escapes, and unicode characters.
      '(?::([0-9]+))?' +                  // port
    ')?' +
    '([^?#]+)?' +                         // path
    '(?:\\?([^#]*))?' +                   // query
    '(?:#(.*))?' +                        // fragment
    '$');

/**
 * Resolve path against URI.
 *
 * @param {String} uri
 * @param {String} path to resolve
 */
var resolve = exports.resolve = function(uri, path) {
   var m = match(uri);
   var n = match(path);
   var host = m[1] + '://' + m[3];
   if (n[1]) {
      return path;
   }
   if (m[4]) {
      host = host + ":" + m[4];
   }
   var absolutePath = m[5];
   if (path.charAt(0) !== '/') {
      var lastSlashIndex = absolutePath.lastIndexOf('/');
      absolutePath = absolutePath.substr(0, lastSlashIndex + 1) + path;
   } else {
      absolutePath = path;
   }
   return host + removeDotSegments(absolutePath);

};

/**
 * Try to match an URI against a regex returning the following
 * capture groups:
 *     $1 = http              scheme
 *     $2 = <undefined>       userInfo -\
 *     $3 = www.ics.uci.edu   domain     | authority
 *     $4 = <undefined>       port     -/
 *     $5 = /pub/ietf/uri/    path
 *     $6 = <undefined>       query without ?
 *     $7 = Related           fragment without #
 *
 * @param {String} uri
 */
var match = exports.match = function(uri) {
   return uri.match(URI_REGEX);
};

/**
 * Make an absolute URI relative to document.location.href
 * @param {String} uri
 * @returns The relative URI or the unchanged URI if it's not
 * possible to make it relative to the path of document.location.href.
 */
var makeRelative = exports.makeRelative = function(uri) {
   var docLocPath = resolve(document.location.href, './');
   if (uri.indexOf(docLocPath) === 0) {
      uri = './' + uri.substring(docLocPath.length);
   }
   return uri;
};

/**
 * Removes dot segments in given path component
 */
var removeDotSegments = function(path) {
   if (path == '..' || path == '.') {
      return '';
   }
   var leadingSlash = path.indexOf('/') > -1;

   var segments = path.split('/');
   var out = [];

   var pos;
   for (pos = 0; pos < segments.length; ) {
      var segment = segments[pos++];

      if (segment == '.') {
         if (leadingSlash && pos == segments.length) {
            out.push('');
         }
      } else if (segment == '..') {
         if (out.length > 1 || out.length !== 1 && out[0] !== '') {
            out.pop();
         }
         if (leadingSlash && pos == segments.length) {
            out.push('');
         }
      } else {
         out.push(segment);
         leadingSlash = true;
      }
   }
   return out.join('/');
};

},{}],28:[function(require,module,exports){
/**
 * @fileoverview
 *
 * Provides facilities for parsing a xml String.
 *
 * You will typically get a `gamejs.xml.Document` instance
 * by loading the data with one of the two static
 * `Document.fromString(string)` or `Document.fromUrl(url)`.

 * Querying for `elements(name)` or `children()` will return a
 * new `gamejs.xml.Document` matching your result (or null).
 *
 * Use `attributes(name)` and `value()` to get the data stored
 * in the XML Document.
 */

/**
 * XMLParser
 */
var Parser = exports.Parser = function() {

   var xmlDoc = null;
   var parser = new DOMParser();

   this.parseFromString = function(xmlString) {
      xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      return xmlDoc;
   };

   return this;
};

/**
 * Instantiate with the static functions `Document.fromString()` and `fromURL()`.
 */
var Document = exports.Document = function(xmlDocument) {
   if (!xmlDocument || (!xmlDocument instanceof XMLDocument) ) {
      throw new Error('Need a valid xmlDocument.');
   }
   /** @ignore **/
   this._xmlDocument = xmlDocument;
   return this;
};

/**
 * Returns the first element in the current document whose tag-name matches
 * the given 'name'.
 * @returns gamejs.xml.Document
 */
Document.prototype.element = function(name) {
   var elem = this._xmlDocument.getElementsByTagName(name)[0];
   return elem && new Document(elem) || null;
};

/**
 * Returns all elements in the current document whose tag-name matches
 * the given 'name'.
 * @returns an Array of gamejs.xml.Document
 */
Document.prototype.elements = function(name) {
   var elems = this._xmlDocument.getElementsByTagName(name);
   return Array.prototype.slice.apply(elems, [0]).map(function(elem) {
      return new Document(elem);
   });
};

/**
 * Returns the attribute value of this document.
 *
 * @returns String
 */
Document.prototype.attribute = function(name) {
   var attributeValue = this._xmlDocument.getAttribute(name);
   attributeValue = attributeValue ? attributeValue.trim() : null;
   if (attributeValue === null) {
      return null;
   }
   if (attributeValue.toLowerCase() === 'true') {
      return true;
   }
   if (attributeValue.toLowerCase() === 'false') {
      return false;
   }
   var attributeIntValue = parseInt(attributeValue, 10);
   var attributeFloatValue = parseFloat(attributeValue, 10);
   if (!isNaN(attributeIntValue)) {
      if (attributeFloatValue !== attributeIntValue) {
         return attributeFloatValue;
      }
      return attributeIntValue;
   }
   return attributeValue;
};

/**
 * Returns the nodevalue of the current xml document
 * @returns String
 */
Document.prototype.value = function() {
   return this._xmlDocument.nodeValue;
};

/**
 * Returns all children of this xml document
 * @returns Array of gamejs.xml.Document
 */
Document.prototype.children = function() {
   return Array.prototype.slice.apply(this._xmlDocument.childNodes, [0]).map(function(cNode) {
      return new Document(cNode);
   });
};

/**
 * @returns gamejs.xml.Document
 */
Document.fromString = function(xmlString) {
   var parser = new DOMParser();
   var xmlDoc = parser.parseFromString(xmlString, 'text/xml');
   return new Document(xmlDoc);
};

/**
 * @returns gamejs.xml.Document
 */
Document.fromURL = function(url) {
   var response = new XMLHttpRequest();
   response.open('GET', url, false);
   response.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
   response.setRequestHeader('Content-Type', 'text/xml');
   response.overrideMimeType('text/xml');
   response.send();
   return new Document(response.responseXML);
};

},{}],29:[function(require,module,exports){
/*
 * A fast javascript implementation of simplex noise by Jonas Wagner
 *
 * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
 * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 *
 * Copyright (C) 2012 Jonas Wagner
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
(function () {

var F2 = 0.5 * (Math.sqrt(3.0) - 1.0),
    G2 = (3.0 - Math.sqrt(3.0)) / 6.0,
    F3 = 1.0 / 3.0,
    G3 = 1.0 / 6.0,
    F4 = (Math.sqrt(5.0) - 1.0) / 4.0,
    G4 = (5.0 - Math.sqrt(5.0)) / 20.0;


function SimplexNoise(random) {
    if (!random) random = Math.random;
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 256; i++) {
        this.p[i] = random() * 256;
    }
    for (i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
        this.permMod12[i] = this.perm[i] % 12;
    }

}
SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
                            - 1, 1, 0,
                            1, - 1, 0,

                            - 1, - 1, 0,
                            1, 0, 1,
                            - 1, 0, 1,

                            1, 0, - 1,
                            - 1, 0, - 1,
                            0, 1, 1,

                            0, - 1, 1,
                            0, 1, - 1,
                            0, - 1, - 1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1,
                            0, - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1,
                            1, 0, 1, 1, 1, 0, 1, - 1, 1, 0, - 1, 1, 1, 0, - 1, - 1,
                            - 1, 0, 1, 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, - 1, 0, - 1, - 1,
                            1, 1, 0, 1, 1, 1, 0, - 1, 1, - 1, 0, 1, 1, - 1, 0, - 1,
                            - 1, 1, 0, 1, - 1, 1, 0, - 1, - 1, - 1, 0, 1, - 1, - 1, 0, - 1,
                            1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1, 0,
                            - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1, 0]),
    noise2D: function (xin, yin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin) * F2; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var X0 = i - t; // Unskew the cell origin back to (x,y) space
        var Y0 = j - t;
        var x0 = xin - X0; // The x,y distances from the cell origin
        var y0 = yin - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = permMod12[ii + perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function (xin, yin, zin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0, n1, n2, n3; // Noise contributions from the four corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);
        var t = (i + j + k) * G3;
        var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        var Y0 = j - t;
        var Z0 = k - t;
        var x0 = xin - X0; // The x,y,z distances from the cell origin
        var y0 = yin - Y0;
        var z0 = zin - Z0;
        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // X Y Z order
            else if (x0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // X Z Y order
            else {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // Z X Y order
        }
        else { // x0<y0
            if (y0 < z0) {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Z Y X order
            else if (x0 < z0) {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Y Z X order
            else {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // Y X Z order
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;
        var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
        var y2 = y0 - j2 + 2.0 * G3;
        var z2 = z0 - k2 + 2.0 * G3;
        var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
        var y3 = y0 - 1.0 + 3.0 * G3;
        var z3 = z0 - 1.0 + 3.0 * G3;
        // Work out the hashed gradient indices of the four simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
            t3 *= t3;
            n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function (x, y, z, w) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad4 = this.grad4;

        var n0, n1, n2, n3, n4; // Noise contributions from the five corners
        // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
        var s = (x + y + z + w) * F4; // Factor for 4D skewing
        var i = Math.floor(x + s);
        var j = Math.floor(y + s);
        var k = Math.floor(z + s);
        var l = Math.floor(w + s);
        var t = (i + j + k + l) * G4; // Factor for 4D unskewing
        var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
        var Y0 = j - t;
        var Z0 = k - t;
        var W0 = l - t;
        var x0 = x - X0; // The x,y,z,w distances from the cell origin
        var y0 = y - Y0;
        var z0 = z - Z0;
        var w0 = w - W0;
        // For the 4D case, the simplex is a 4D shape I won't even try to describe.
        // To find out which of the 24 possible simplices we're in, we need to
        // determine the magnitude ordering of x0, y0, z0 and w0.
        // Six pair-wise comparisons are performed between each possible pair
        // of the four coordinates, and the results are used to rank the numbers.
        var rankx = 0;
        var ranky = 0;
        var rankz = 0;
        var rankw = 0;
        if (x0 > y0) rankx++;
        else ranky++;
        if (x0 > z0) rankx++;
        else rankz++;
        if (x0 > w0) rankx++;
        else rankw++;
        if (y0 > z0) ranky++;
        else rankz++;
        if (y0 > w0) ranky++;
        else rankw++;
        if (z0 > w0) rankz++;
        else rankw++;
        var i1, j1, k1, l1; // The integer offsets for the second simplex corner
        var i2, j2, k2, l2; // The integer offsets for the third simplex corner
        var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
        // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
        // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
        // impossible. Only the 24 indices which have non-zero entries make any sense.
        // We use a thresholding to set the coordinates in turn from the largest magnitude.
        // Rank 3 denotes the largest coordinate.
        i1 = rankx >= 3 ? 1 : 0;
        j1 = ranky >= 3 ? 1 : 0;
        k1 = rankz >= 3 ? 1 : 0;
        l1 = rankw >= 3 ? 1 : 0;
        // Rank 2 denotes the second largest coordinate.
        i2 = rankx >= 2 ? 1 : 0;
        j2 = ranky >= 2 ? 1 : 0;
        k2 = rankz >= 2 ? 1 : 0;
        l2 = rankw >= 2 ? 1 : 0;
        // Rank 1 denotes the second smallest coordinate.
        i3 = rankx >= 1 ? 1 : 0;
        j3 = ranky >= 1 ? 1 : 0;
        k3 = rankz >= 1 ? 1 : 0;
        l3 = rankw >= 1 ? 1 : 0;
        // The fifth corner has all coordinate offsets = 1, so no need to compute that.
        var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
        var y1 = y0 - j1 + G4;
        var z1 = z0 - k1 + G4;
        var w1 = w0 - l1 + G4;
        var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
        var y2 = y0 - j2 + 2.0 * G4;
        var z2 = z0 - k2 + 2.0 * G4;
        var w2 = w0 - l2 + 2.0 * G4;
        var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
        var y3 = y0 - j3 + 3.0 * G4;
        var z3 = z0 - k3 + 3.0 * G4;
        var w3 = w0 - l3 + 3.0 * G4;
        var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
        var y4 = y0 - 1.0 + 4.0 * G4;
        var z4 = z0 - 1.0 + 4.0 * G4;
        var w4 = w0 - 1.0 + 4.0 * G4;
        // Work out the hashed gradient indices of the five simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        var ll = l & 255;
        // Calculate the contribution from the five corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
            t0 *= t0;
            n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
            t1 *= t1;
            n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
            t2 *= t2;
            n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
            t3 *= t3;
            n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
        }
        var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
        if (t4 < 0) n4 = 0.0;
        else {
            var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
            t4 *= t4;
            n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
        }
        // Sum up and scale the result to cover the range [-1,1]
        return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }


};

// amd
if (typeof define !== 'undefined' && define.amd) define(function(){return SimplexNoise;});
// browser
else if (typeof window !== 'undefined') window.SimplexNoise = SimplexNoise;
//common js
if (typeof exports !== 'undefined') exports.SimplexNoise = SimplexNoise;
// nodejs
if (typeof module !== 'undefined') {
    module.exports = SimplexNoise;
}

})();

},{}],30:[function(require,module,exports){
"use strict"

var dup = require("dup")
var solve = require("robust-linear-solve")

function dot(a, b) {
  var s = 0.0
  var d = a.length
  for(var i=0; i<d; ++i) {
    s += a[i] * b[i]
  }
  return s
}

function barycentricCircumcenter(points) {
  var N = points.length
  if(N === 0) {
    return []
  }
  
  var D = points[0].length
  var A = dup([points.length+1, points.length+1], 1.0)
  var b = dup([points.length+1], 1.0)
  A[N][N] = 0.0
  for(var i=0; i<N; ++i) {
    for(var j=0; j<=i; ++j) {
      A[j][i] = A[i][j] = 2.0 * dot(points[i], points[j])
    }
    b[i] = dot(points[i], points[i])
  }
  var x = solve(A, b)

  var denom = 0.0
  var h = x[N+1]
  for(var i=0; i<h.length; ++i) {
    denom += h[i]
  }

  var y = new Array(N)
  for(var i=0; i<N; ++i) {
    var h = x[i]
    var numer = 0.0
    for(var j=0; j<h.length; ++j) {
      numer += h[j]
    }
    y[i] =  numer / denom
  }

  return y
}

function circumcenter(points) {
  if(points.length === 0) {
    return []
  }
  var D = points[0].length
  var result = dup([D])
  var weights = barycentricCircumcenter(points)
  for(var i=0; i<points.length; ++i) {
    for(var j=0; j<D; ++j) {
      result[j] += points[i][j] * weights[i]
    }
  }
  return result
}

circumcenter.barycenetric = barycentricCircumcenter
module.exports = circumcenter
},{"dup":31,"robust-linear-solve":32}],31:[function(require,module,exports){
"use strict"

function dupe_array(count, value, i) {
  var c = count[i]|0
  if(c <= 0) {
    return []
  }
  var result = new Array(c), j
  if(i === count.length-1) {
    for(j=0; j<c; ++j) {
      result[j] = value
    }
  } else {
    for(j=0; j<c; ++j) {
      result[j] = dupe_array(count, value, i+1)
    }
  }
  return result
}

function dupe_number(count, value) {
  var result, i
  result = new Array(count)
  for(i=0; i<count; ++i) {
    result[i] = value
  }
  return result
}

function dupe(count, value) {
  if(typeof value === "undefined") {
    value = 0
  }
  switch(typeof count) {
    case "number":
      if(count > 0) {
        return dupe_number(count|0, value)
      }
    break
    case "object":
      if(typeof (count.length) === "number") {
        return dupe_array(count, value, 0)
      }
    break
  }
  return []
}

module.exports = dupe
},{}],32:[function(require,module,exports){
"use strict"

var determinant = require("robust-determinant")

var NUM_EXPAND = 6

function generateSolver(n) {
  var funcName = "robustLinearSolve" + n + "d"
  var code = ["function ", funcName, "(A,b){return ["]
  for(var i=0; i<n; ++i) {
    code.push("det([")
    for(var j=0; j<n; ++j) {
      if(j > 0) {
        code.push(",")
      }
      code.push("[")
      for(var k=0; k<n; ++k) {
        if(k > 0) {
          code.push(",")
        }
        if(k === i) {
          code.push("+b[", j, "]")
        } else {
          code.push("+A[", j, "][", k, "]")
        }
      }
      code.push("]")
    }
    code.push("]),")
  }
  code.push("det(A)]}return ", funcName)
  var proc = new Function("det", code.join(""))
  if(n < 6) {
    return proc(determinant[n])
  }
  return proc(determinant)
}

function robustLinearSolve0d() {
  return [ 0 ]
}

function robustLinearSolve1d(A, b) {
  return [ [ b[0] ], [ A[0][0] ] ]
}

var CACHE = [
  robustLinearSolve0d,
  robustLinearSolve1d
]

function generateDispatch() {
  while(CACHE.length < NUM_EXPAND) {
    CACHE.push(generateSolver(CACHE.length))
  }
  var procArgs = []
  var code = ["function dispatchLinearSolve(A,b){switch(A.length){"]
  for(var i=0; i<NUM_EXPAND; ++i) {
    procArgs.push("s" + i)
    code.push("case ", i, ":return s", i, "(A,b);")
  }
  code.push("}var s=CACHE[A.length];if(!s)s=CACHE[A.length]=g(A.length);return s(A,b)}return dispatchLinearSolve")
  procArgs.push("CACHE", "g", code.join(""))
  var proc = Function.apply(undefined, procArgs)
  module.exports = proc.apply(undefined, CACHE.concat([CACHE, generateSolver]))
  for(var i=0; i<NUM_EXPAND; ++i) {
    module.exports[i] = CACHE[i]
  }
}

generateDispatch()
},{"robust-determinant":38}],33:[function(require,module,exports){
"use strict"

module.exports = compressExpansion

function compressExpansion(e) {
  var m = e.length
  var Q = e[e.length-1]
  var bottom = m
  for(var i=m-2; i>=0; --i) {
    var a = Q
    var b = e[i]
    Q = a + b
    var bv = Q - a
    var q = b - bv
    if(q) {
      e[--bottom] = Q
      Q = q
    }
  }
  var top = 0
  for(var i=bottom; i<m; ++i) {
    var a = e[i]
    var b = Q
    Q = a + b
    var bv = Q - a
    var q = b - bv
    if(q) {
      e[top++] = q
    }
  }
  e[top++] = Q
  e.length = top
  return e
}
},{}],34:[function(require,module,exports){
"use strict"

module.exports = fastTwoSum

function fastTwoSum(a, b, result) {
	var x = a + b
	var bv = x - a
	var av = x - bv
	var br = b - bv
	var ar = a - av
	if(result) {
		result[0] = ar + br
		result[1] = x
		return result
	}
	return [ar+br, x]
}
},{}],35:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var twoSum = require("two-sum")

module.exports = scaleLinearExpansion

function scaleLinearExpansion(e, scale) {
  var n = e.length
  if(n === 1) {
    var ts = twoProduct(e[0], scale)
    if(ts[0]) {
      return ts
    }
    return [ ts[1] ]
  }
  var g = new Array(2 * n)
  var q = [0.1, 0.1]
  var t = [0.1, 0.1]
  var count = 0
  twoProduct(e[0], scale, q)
  if(q[0]) {
    g[count++] = q[0]
  }
  for(var i=1; i<n; ++i) {
    twoProduct(e[i], scale, t)
    var pq = q[1]
    twoSum(pq, t[0], q)
    if(q[0]) {
      g[count++] = q[0]
    }
    var a = t[1]
    var b = q[1]
    var x = a + b
    var bv = x - a
    var y = b - bv
    q[1] = x
    if(y) {
      g[count++] = y
    }
  }
  if(q[1]) {
    g[count++] = q[1]
  }
  if(count === 0) {
    g[count++] = 0.0
  }
  g.length = count
  return g
}
},{"two-product":37,"two-sum":34}],36:[function(require,module,exports){
"use strict"

module.exports = linearExpansionSum

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b
  var bv = x - a
  var av = x - bv
  var br = b - bv
  var ar = a - av
  var y = ar + br
  if(y) {
    return [y, x]
  }
  return [x]
}

function linearExpansionSum(e, f) {
  var ne = e.length|0
  var nf = f.length|0
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], f[0])
  }
  var n = ne + nf
  var g = new Array(n)
  var count = 0
  var eptr = 0
  var fptr = 0
  var abs = Math.abs
  var ei = e[eptr]
  var ea = abs(ei)
  var fi = f[fptr]
  var fa = abs(fi)
  var a, b
  if(ea < fa) {
    b = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    b = fi
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
      fa = abs(fi)
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    a = fi
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
      fa = abs(fi)
    }
  }
  var x = a + b
  var bv = x - a
  var y = b - bv
  var q0 = y
  var q1 = x
  var _x, _bv, _av, _br, _ar
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei
      eptr += 1
      if(eptr < ne) {
        ei = e[eptr]
        ea = abs(ei)
      }
    } else {
      a = fi
      fptr += 1
      if(fptr < nf) {
        fi = f[fptr]
        fa = abs(fi)
      }
    }
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
  }
  while(eptr < ne) {
    a = ei
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
    }
  }
  while(fptr < nf) {
    a = fi
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    } 
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
    }
  }
  if(q0) {
    g[count++] = q0
  }
  if(q1) {
    g[count++] = q1
  }
  if(!count) {
    g[count++] = 0.0  
  }
  g.length = count
  return g
}
},{}],37:[function(require,module,exports){
"use strict"

module.exports = twoProduct

var SPLITTER = +(Math.pow(2, 27) + 1.0)

function twoProduct(a, b, result) {
  var x = a * b

  var c = SPLITTER * a
  var abig = c - a
  var ahi = c - abig
  var alo = a - ahi

  var d = SPLITTER * b
  var bbig = d - b
  var bhi = d - bbig
  var blo = b - bhi

  var err1 = x - (ahi * bhi)
  var err2 = err1 - (alo * bhi)
  var err3 = err2 - (ahi * blo)

  var y = alo * blo - err3

  if(result) {
    result[0] = y
    result[1] = x
    return result
  }

  return [ y, x ]
}
},{}],38:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var robustSum = require("robust-sum")
var robustScale = require("robust-scale")
var compress = require("robust-compress")

var NUM_EXPANDED = 6

function cofactor(m, c) {
  var result = new Array(m.length-1)
  for(var i=1; i<m.length; ++i) {
    var r = result[i-1] = new Array(m.length-1)
    for(var j=0,k=0; j<m.length; ++j) {
      if(j === c) {
        continue
      }
      r[k++] = m[i][j]
    }
  }
  return result
}

function matrix(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = new Array(n)
    for(var j=0; j<n; ++j) {
      result[i][j] = ["m[", i, "][", j, "]"].join("")
    }
  }
  return result
}

function sign(n) {
  if(n & 1) {
    return "-"
  }
  return ""
}

function generateSum(expr) {
  if(expr.length === 1) {
    return expr[0]
  } else if(expr.length === 2) {
    return ["sum(", expr[0], ",", expr[1], ")"].join("")
  } else {
    var m = expr.length>>1
    return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
  }
}

function determinant(m) {
  if(m.length === 2) {
    return ["sum(prod(", m[0][0], ",", m[1][1], "),prod(-", m[0][1], ",", m[1][0], "))"].join("")
  } else {
    var expr = []
    for(var i=0; i<m.length; ++i) {
      expr.push(["scale(", determinant(cofactor(m, i)), ",", sign(i), m[0][i], ")"].join(""))
    }
    return generateSum(expr)
  }
}

function compileDeterminant(n) {
  var proc = new Function("sum", "scale", "prod", "compress", [
    "function robustDeterminant",n, "(m){return compress(", 
      determinant(matrix(n)),
    ")};return robustDeterminant", n].join(""))
  return proc(robustSum, robustScale, twoProduct, compress)
}

var CACHE = [
  function robustDeterminant0() { return [0] },
  function robustDeterminant1(m) { return [m[0][0]] }
]

function generateDispatch() {
  while(CACHE.length < NUM_EXPANDED) {
    CACHE.push(compileDeterminant(CACHE.length))
  }
  var procArgs = []
  var code = ["function robustDeterminant(m){switch(m.length){"]
  for(var i=0; i<NUM_EXPANDED; ++i) {
    procArgs.push("det" + i)
    code.push("case ", i, ":return det", i, "(m);")
  }
  code.push("}\
var det=CACHE[m.length];\
if(!det)\
det=CACHE[m.length]=gen(m.length);\
return det(m);\
}\
return robustDeterminant")
  procArgs.push("CACHE", "gen", code.join(""))
  var proc = Function.apply(undefined, procArgs)
  module.exports = proc.apply(undefined, CACHE.concat([CACHE, compileDeterminant]))
  for(var i=0; i<CACHE.length; ++i) {
    module.exports[i] = CACHE[i]
  }
}

generateDispatch()
},{"robust-compress":33,"robust-scale":35,"robust-sum":36,"two-product":37}],39:[function(require,module,exports){
"use strict"

//High level idea:
// 1. Use Clarkson's incremental construction to find convex hull
// 2. Point location in triangulation by jump and walk

module.exports = incrementalConvexHull

var orient = require("robust-orientation")
var compareCell = require("simplicial-complex").compareCells

function compareInt(a, b) {
  return a - b
}

function Simplex(vertices, adjacent, boundary) {
  this.vertices = vertices
  this.adjacent = adjacent
  this.boundary = boundary
  this.lastVisited = -1
}

Simplex.prototype.flip = function() {
  var t = this.vertices[0]
  this.vertices[0] = this.vertices[1]
  this.vertices[1] = t
  var u = this.adjacent[0]
  this.adjacent[0] = this.adjacent[1]
  this.adjacent[1] = u
}

function GlueFacet(vertices, cell, index) {
  this.vertices = vertices
  this.cell = cell
  this.index = index
}

function compareGlue(a, b) {
  return compareCell(a.vertices, b.vertices)
}

function bakeOrient(d) {
  var code = ["function orient(){var tuple=this.tuple;return test("]
  for(var i=0; i<=d; ++i) {
    if(i > 0) {
      code.push(",")
    }
    code.push("tuple[", i, "]")
  }
  code.push(")}return orient")
  var proc = new Function("test", code.join(""))
  var test = orient[d+1]
  if(!test) {
    test = orient
  }
  return proc(test)
}

var BAKED = []

function Triangulation(dimension, vertices, simplices) {
  this.dimension = dimension
  this.vertices = vertices
  this.simplices = simplices
  this.interior = simplices.filter(function(c) {
    return !c.boundary
  })

  this.tuple = new Array(dimension+1)
  for(var i=0; i<=dimension; ++i) {
    this.tuple[i] = this.vertices[i]
  }

  var o = BAKED[dimension]
  if(!o) {
    o = BAKED[dimension] = bakeOrient(dimension)
  }
  this.orient = o
}

var proto = Triangulation.prototype

//Degenerate situation where we are on boundary, but coplanar to face
proto.handleBoundaryDegeneracy = function(cell, point) {
  var d = this.dimension
  var n = this.vertices.length - 1
  var tuple = this.tuple
  var verts = this.vertices

  //Dumb solution: Just do dfs from boundary cell until we find any peak, or terminate
  var toVisit = [ cell ]
  cell.lastVisited = -n
  while(toVisit.length > 0) {
    cell = toVisit.pop()
    var cellVerts = cell.vertices
    var cellAdj = cell.adjacent
    for(var i=0; i<=d; ++i) {
      var neighbor = cellAdj[i]
      if(!neighbor.boundary || neighbor.lastVisited <= -n) {
        continue
      }
      var nv = neighbor.vertices
      for(var j=0; j<=d; ++j) {
        var vv = nv[j]
        if(vv < 0) {
          tuple[j] = point
        } else {
          tuple[j] = verts[vv]
        }
      }
      var o = this.orient()
      if(o > 0) {
        return neighbor
      }
      neighbor.lastVisited = -n
      if(o === 0) {
        toVisit.push(neighbor)
      }
    }
  }
  return null
}

proto.walk = function(point, random) {
  //Alias local properties
  var n = this.vertices.length - 1
  var d = this.dimension
  var verts = this.vertices
  var tuple = this.tuple

  //Compute initial jump cell
  var initIndex = random ? (this.interior.length * Math.random())|0 : (this.interior.length-1)
  var cell = this.interior[ initIndex ]

  //Start walking
outerLoop:
  while(!cell.boundary) {
    var cellVerts = cell.vertices
    var cellAdj = cell.adjacent

    for(var i=0; i<=d; ++i) {
      tuple[i] = verts[cellVerts[i]]
    }
    cell.lastVisited = n

    //Find farthest adjacent cell
    for(var i=0; i<=d; ++i) {
      var neighbor = cellAdj[i]
      if(neighbor.lastVisited >= n) {
        continue
      }
      var prev = tuple[i]
      tuple[i] = point
      var o = this.orient()
      tuple[i] = prev
      if(o < 0) {
        cell = neighbor
        continue outerLoop
      } else {
        if(!neighbor.boundary) {
          neighbor.lastVisited = n
        } else {
          neighbor.lastVisited = -n
        }
      }
    }
    return
  }

  return cell
}

proto.addPeaks = function(point, cell) {
  var n = this.vertices.length - 1
  var d = this.dimension
  var verts = this.vertices
  var tuple = this.tuple
  var interior = this.interior
  var simplices = this.simplices

  //Walking finished at boundary, time to add peaks
  var tovisit = [ cell ]

  //Stretch initial boundary cell into a peak
  cell.lastVisited = n
  cell.vertices[cell.vertices.indexOf(-1)] = n
  cell.boundary = false
  interior.push(cell)

  //Record a list of all new boundaries created by added peaks so we can glue them together when we are all done
  var glueFacets = []

  //Do a traversal of the boundary walking outward from starting peak
  while(tovisit.length > 0) {
    //Pop off peak and walk over adjacent cells
    var cell = tovisit.pop()
    var cellVerts = cell.vertices
    var cellAdj = cell.adjacent
    var indexOfN = cellVerts.indexOf(n)
    if(indexOfN < 0) {
      continue
    }

    for(var i=0; i<=d; ++i) {
      if(i === indexOfN) {
        continue
      }

      //For each boundary neighbor of the cell
      var neighbor = cellAdj[i]
      if(!neighbor.boundary || neighbor.lastVisited >= n) {
        continue
      }

      var nv = neighbor.vertices

      //Test if neighbor is a peak
      if(neighbor.lastVisited !== -n) {      
        //Compute orientation of p relative to each boundary peak
        var indexOfNeg1 = 0
        for(var j=0; j<=d; ++j) {
          if(nv[j] < 0) {
            indexOfNeg1 = j
            tuple[j] = point
          } else {
            tuple[j] = verts[nv[j]]
          }
        }
        var o = this.orient()

        //Test if neighbor cell is also a peak
        if(o > 0) {
          nv[indexOfNeg1] = n
          neighbor.boundary = false
          interior.push(neighbor)
          tovisit.push(neighbor)
          neighbor.lastVisited = n
          continue
        } else {
          neighbor.lastVisited = -n
        }
      }

      var na = neighbor.adjacent

      //Otherwise, replace neighbor with new face
      var vverts = cellVerts.slice()
      var vadj = cellAdj.slice()
      var ncell = new Simplex(vverts, vadj, true)
      simplices.push(ncell)

      //Connect to neighbor
      var opposite = na.indexOf(cell)
      if(opposite < 0) {
        continue
      }
      na[opposite] = ncell
      vadj[indexOfN] = neighbor

      //Connect to cell
      vverts[i] = -1
      vadj[i] = cell
      cellAdj[i] = ncell

      //Flip facet
      ncell.flip()

      //Add to glue list
      for(var j=0; j<=d; ++j) {
        var uu = vverts[j]
        if(uu < 0 || uu === n) {
          continue
        }
        var nface = new Array(d-1)
        var nptr = 0
        for(var k=0; k<=d; ++k) {
          var vv = vverts[k]
          if(vv < 0 || k === j) {
            continue
          }
          nface[nptr++] = vv
        }
        glueFacets.push(new GlueFacet(nface, ncell, j))
      }
    }
  }

  //Glue boundary facets together
  glueFacets.sort(compareGlue)

  for(var i=0; i+1<glueFacets.length; i+=2) {
    var a = glueFacets[i]
    var b = glueFacets[i+1]
    var ai = a.index
    var bi = b.index
    if(ai < 0 || bi < 0) {
      continue
    }
    a.cell.adjacent[a.index] = b.cell
    b.cell.adjacent[b.index] = a.cell
  }
}

proto.insert = function(point, random) {
  //Add point
  var verts = this.vertices
  verts.push(point)

  var cell = this.walk(point, random)
  if(!cell) {
    return
  }

  //Alias local properties
  var d = this.dimension
  var tuple = this.tuple

  //Degenerate case: If point is coplanar to cell, then walk until we find a non-degenerate boundary
  for(var i=0; i<=d; ++i) {
    var vv = cell.vertices[i]
    if(vv < 0) {
      tuple[i] = point
    } else {
      tuple[i] = verts[vv]
    }
  }
  var o = this.orient(tuple)
  if(o < 0) {
    return
  } else if(o === 0) {
    cell = this.handleBoundaryDegeneracy(cell, point)
    if(!cell) {
      return
    }
  }

  //Add peaks
  this.addPeaks(point, cell)
}

//Extract all boundary cells
proto.boundary = function() {
  var d = this.dimension
  var boundary = []
  var cells = this.simplices
  var nc = cells.length
  for(var i=0; i<nc; ++i) {
    var c = cells[i]
    if(c.boundary) {
      var bcell = new Array(d)
      var cv = c.vertices
      var ptr = 0
      var parity = 0
      for(var j=0; j<=d; ++j) {
        if(cv[j] >= 0) {
          bcell[ptr++] = cv[j]
        } else {
          parity = j&1
        }
      }
      if(parity === (d&1)) {
        var t = bcell[0]
        bcell[0] = bcell[1]
        bcell[1] = t
      }
      boundary.push(bcell)
    }
  }
  return boundary
}

function incrementalConvexHull(points, randomSearch) {
  var n = points.length
  if(n === 0) {
    throw new Error("Must have at least d+1 points")
  }
  var d = points[0].length
  if(n <= d) {
    throw new Error("Must input at least d+1 points")
  }

  //FIXME: This could be degenerate, but need to select d+1 non-coplanar points to bootstrap process
  var initialSimplex = points.slice(0, d+1)

  //Make sure initial simplex is positively oriented
  var o = orient.apply(void 0, initialSimplex)
  if(o === 0) {
    throw new Error("Input not in general position")
  }
  var initialCoords = new Array(d+1)
  for(var i=0; i<=d; ++i) {
    initialCoords[i] = i
  }
  if(o < 0) {
    initialCoords[0] = 1
    initialCoords[1] = 0
  }

  //Create initial topological index, glue pointers together (kind of messy)
  var initialCell = new Simplex(initialCoords, new Array(d+1), false)
  var boundary = initialCell.adjacent
  var list = new Array(d+2)
  for(var i=0; i<=d; ++i) {
    var verts = initialCoords.slice()
    for(var j=0; j<=d; ++j) {
      if(j === i) {
        verts[j] = -1
      }
    }
    var t = verts[0]
    verts[0] = verts[1]
    verts[1] = t
    var cell = new Simplex(verts, new Array(d+1), true)
    boundary[i] = cell
    list[i] = cell
  }
  list[d+1] = initialCell
  for(var i=0; i<=d; ++i) {
    var verts = boundary[i].vertices
    var adj = boundary[i].adjacent
    for(var j=0; j<=d; ++j) {
      var v = verts[j]
      if(v < 0) {
        adj[j] = initialCell
        continue
      }
      for(var k=0; k<=d; ++k) {
        if(boundary[k].vertices.indexOf(v) < 0) {
          adj[j] = boundary[k]
        }
      }
    }
  }

  //Initialize triangles
  var triangles = new Triangulation(d, initialSimplex, list)

  //Insert remaining points
  var useRandom = !!randomSearch
  for(var i=d+1; i<n; ++i) {
    triangles.insert(points[i], useRandom)
  }
  
  //Extract boundary cells
  return triangles.boundary()
}
},{"robust-orientation":45,"simplicial-complex":48}],40:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],41:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"two-product":44,"two-sum":40}],42:[function(require,module,exports){
"use strict"

module.exports = robustSubtract

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b
  var bv = x - a
  var av = x - bv
  var br = b - bv
  var ar = a - av
  var y = ar + br
  if(y) {
    return [y, x]
  }
  return [x]
}

function robustSubtract(e, f) {
  var ne = e.length|0
  var nf = f.length|0
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], -f[0])
  }
  var n = ne + nf
  var g = new Array(n)
  var count = 0
  var eptr = 0
  var fptr = 0
  var abs = Math.abs
  var ei = e[eptr]
  var ea = abs(ei)
  var fi = -f[fptr]
  var fa = abs(fi)
  var a, b
  if(ea < fa) {
    b = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    b = fi
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
      fa = abs(fi)
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    a = fi
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
      fa = abs(fi)
    }
  }
  var x = a + b
  var bv = x - a
  var y = b - bv
  var q0 = y
  var q1 = x
  var _x, _bv, _av, _br, _ar
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei
      eptr += 1
      if(eptr < ne) {
        ei = e[eptr]
        ea = abs(ei)
      }
    } else {
      a = fi
      fptr += 1
      if(fptr < nf) {
        fi = -f[fptr]
        fa = abs(fi)
      }
    }
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
  }
  while(eptr < ne) {
    a = ei
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
    }
  }
  while(fptr < nf) {
    a = fi
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    } 
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
    }
  }
  if(q0) {
    g[count++] = q0
  }
  if(q1) {
    g[count++] = q1
  }
  if(!count) {
    g[count++] = 0.0  
  }
  g.length = count
  return g
}
},{}],43:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36}],44:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"dup":37}],45:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var robustSum = require("robust-sum")
var robustScale = require("robust-scale")
var robustSubtract = require("robust-subtract")

var NUM_EXPAND = 5

var EPSILON     = 1.1102230246251565e-16
var ERRBOUND3   = (3.0 + 16.0 * EPSILON) * EPSILON
var ERRBOUND4   = (7.0 + 56.0 * EPSILON) * EPSILON

function cofactor(m, c) {
  var result = new Array(m.length-1)
  for(var i=1; i<m.length; ++i) {
    var r = result[i-1] = new Array(m.length-1)
    for(var j=0,k=0; j<m.length; ++j) {
      if(j === c) {
        continue
      }
      r[k++] = m[i][j]
    }
  }
  return result
}

function matrix(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = new Array(n)
    for(var j=0; j<n; ++j) {
      result[i][j] = ["m", j, "[", (n-i-1), "]"].join("")
    }
  }
  return result
}

function sign(n) {
  if(n & 1) {
    return "-"
  }
  return ""
}

function generateSum(expr) {
  if(expr.length === 1) {
    return expr[0]
  } else if(expr.length === 2) {
    return ["sum(", expr[0], ",", expr[1], ")"].join("")
  } else {
    var m = expr.length>>1
    return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
  }
}

function determinant(m) {
  if(m.length === 2) {
    return [["sum(prod(", m[0][0], ",", m[1][1], "),prod(-", m[0][1], ",", m[1][0], "))"].join("")]
  } else {
    var expr = []
    for(var i=0; i<m.length; ++i) {
      expr.push(["scale(", generateSum(determinant(cofactor(m, i))), ",", sign(i), m[0][i], ")"].join(""))
    }
    return expr
  }
}

function orientation(n) {
  var pos = []
  var neg = []
  var m = matrix(n)
  var args = []
  for(var i=0; i<n; ++i) {
    if((i&1)===0) {
      pos.push.apply(pos, determinant(cofactor(m, i)))
    } else {
      neg.push.apply(neg, determinant(cofactor(m, i)))
    }
    args.push("m" + i)
  }
  var posExpr = generateSum(pos)
  var negExpr = generateSum(neg)
  var funcName = "orientation" + n + "Exact"
  var code = ["function ", funcName, "(", args.join(), "){var p=", posExpr, ",n=", negExpr, ",d=sub(p,n);\
return d[d.length-1];};return ", funcName].join("")
  var proc = new Function("sum", "prod", "scale", "sub", code)
  return proc(robustSum, twoProduct, robustScale, robustSubtract)
}

var orientation3Exact = orientation(3)
var orientation4Exact = orientation(4)

var CACHED = [
  function orientation0() { return 0 },
  function orientation1() { return 0 },
  function orientation2(a, b) { 
    return b[0] - a[0]
  },
  function orientation3(a, b, c) {
    var l = (a[1] - c[1]) * (b[0] - c[0])
    var r = (a[0] - c[0]) * (b[1] - c[1])
    var det = l - r
    var s
    if(l > 0) {
      if(r <= 0) {
        return det
      } else {
        s = l + r
      }
    } else if(l < 0) {
      if(r >= 0) {
        return det
      } else {
        s = -(l + r)
      }
    } else {
      return det
    }
    var tol = ERRBOUND3 * s
    if(det >= tol || det <= -tol) {
      return det
    }
    return orientation3Exact(a, b, c)
  },
  function orientation4(a,b,c,d) {
    var adx = a[0] - d[0]
    var bdx = b[0] - d[0]
    var cdx = c[0] - d[0]
    var ady = a[1] - d[1]
    var bdy = b[1] - d[1]
    var cdy = c[1] - d[1]
    var adz = a[2] - d[2]
    var bdz = b[2] - d[2]
    var cdz = c[2] - d[2]
    var bdxcdy = bdx * cdy
    var cdxbdy = cdx * bdy
    var cdxady = cdx * ady
    var adxcdy = adx * cdy
    var adxbdy = adx * bdy
    var bdxady = bdx * ady
    var det = adz * (bdxcdy - cdxbdy) 
            + bdz * (cdxady - adxcdy)
            + cdz * (adxbdy - bdxady)
    var permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz)
                  + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz)
                  + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz)
    var tol = ERRBOUND4 * permanent
    if ((det > tol) || (-det > tol)) {
      return det
    }
    return orientation4Exact(a,b,c,d)
  }
]

function slowOrient(args) {
  var proc = CACHED[args.length]
  if(!proc) {
    proc = CACHED[args.length] = orientation(args.length)
  }
  return proc.apply(undefined, args)
}

function generateOrientationProc() {
  while(CACHED.length <= NUM_EXPAND) {
    CACHED.push(orientation(CACHED.length))
  }
  var args = []
  var procArgs = ["slow"]
  for(var i=0; i<=NUM_EXPAND; ++i) {
    args.push("a" + i)
    procArgs.push("o" + i)
  }
  var code = [
    "function getOrientation(", args.join(), "){switch(arguments.length){case 0:case 1:return 0;"
  ]
  for(var i=2; i<=NUM_EXPAND; ++i) {
    code.push("case ", i, ":return o", i, "(", args.slice(0, i).join(), ");")
  }
  code.push("}var s=new Array(arguments.length);for(var i=0;i<arguments.length;++i){s[i]=arguments[i]};return slow(s);}return getOrientation")
  procArgs.push(code.join(""))

  var proc = Function.apply(undefined, procArgs)
  module.exports = proc.apply(undefined, [slowOrient].concat(CACHED))
  for(var i=0; i<=NUM_EXPAND; ++i) {
    module.exports[i] = CACHED[i]
  }
}

generateOrientationProc()
},{"robust-scale":41,"robust-subtract":42,"robust-sum":43,"two-product":44}],46:[function(require,module,exports){
/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

"use strict"; "use restrict";

//Number of bits in an integer
var INT_BITS = 32;

//Constants
exports.INT_BITS  = INT_BITS;
exports.INT_MAX   =  0x7fffffff;
exports.INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
exports.sign = function(v) {
  return (v > 0) - (v < 0);
}

//Computes absolute value of integer
exports.abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
}

//Computes minimum of integers x and y
exports.min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
}

//Computes maximum of integers x and y
exports.max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
}

//Checks if a number is a power of two
exports.isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
}

//Computes log base 2 of v
exports.log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
}

//Computes log base 10 of v
exports.log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
}

//Counts number of bits
exports.popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
exports.countTrailingZeros = countTrailingZeros;

//Rounds to next power of 2
exports.nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
}

//Rounds down to previous power of 2
exports.prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
}

//Computes parity of word
exports.parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
}

var REVERSE_TABLE = new Array(256);

(function(tab) {
  for(var i=0; i<256; ++i) {
    var v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
exports.reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
}

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
exports.interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

//Extracts the nth interleaved component
exports.deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
}


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
exports.interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);
  
  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;
  
  return x | (z << 2);
}

//Extracts nth interleaved component of a 3-tuple
exports.deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
}

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
exports.nextCombination = function(v) {
  var t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
}


},{}],47:[function(require,module,exports){
"use strict"; "use restrict";

module.exports = UnionFind;

function UnionFind(count) {
  this.roots = new Array(count);
  this.ranks = new Array(count);
  
  for(var i=0; i<count; ++i) {
    this.roots[i] = i;
    this.ranks[i] = 0;
  }
}

var proto = UnionFind.prototype

Object.defineProperty(proto, "length", {
  "get": function() {
    return this.roots.length
  }
})

proto.makeSet = function() {
  var n = this.roots.length;
  this.roots.push(n);
  this.ranks.push(0);
  return n;
}

proto.find = function(x) {
  var roots = this.roots;
  while(roots[x] !== x) {
    var y = roots[x];
    roots[x] = roots[y];
    x = y;
  }
  return x;
}

proto.link = function(x, y) {
  var xr = this.find(x)
    , yr = this.find(y);
  if(xr === yr) {
    return;
  }
  var ranks = this.ranks
    , roots = this.roots
    , xd    = ranks[xr]
    , yd    = ranks[yr];
  if(xd < yd) {
    roots[xr] = yr;
  } else if(yd < xd) {
    roots[yr] = xr;
  } else {
    roots[yr] = xr;
    ++ranks[xr];
  }
}
},{}],48:[function(require,module,exports){
"use strict"; "use restrict";

var bits      = require("bit-twiddle")
  , UnionFind = require("union-find")

//Returns the dimension of a cell complex
function dimension(cells) {
  var d = 0
    , max = Math.max
  for(var i=0, il=cells.length; i<il; ++i) {
    d = max(d, cells[i].length)
  }
  return d-1
}
exports.dimension = dimension

//Counts the number of vertices in faces
function countVertices(cells) {
  var vc = -1
    , max = Math.max
  for(var i=0, il=cells.length; i<il; ++i) {
    var c = cells[i]
    for(var j=0, jl=c.length; j<jl; ++j) {
      vc = max(vc, c[j])
    }
  }
  return vc+1
}
exports.countVertices = countVertices

//Returns a deep copy of cells
function cloneCells(cells) {
  var ncells = new Array(cells.length)
  for(var i=0, il=cells.length; i<il; ++i) {
    ncells[i] = cells[i].slice(0)
  }
  return ncells
}
exports.cloneCells = cloneCells

//Ranks a pair of cells up to permutation
function compareCells(a, b) {
  var n = a.length
    , t = a.length - b.length
    , min = Math.min
  if(t) {
    return t
  }
  switch(n) {
    case 0:
      return 0;
    case 1:
      return a[0] - b[0];
    case 2:
      var d = a[0]+a[1]-b[0]-b[1]
      if(d) {
        return d
      }
      return min(a[0],a[1]) - min(b[0],b[1])
    case 3:
      var l1 = a[0]+a[1]
        , m1 = b[0]+b[1]
      d = l1+a[2] - (m1+b[2])
      if(d) {
        return d
      }
      var l0 = min(a[0], a[1])
        , m0 = min(b[0], b[1])
        , d  = min(l0, a[2]) - min(m0, b[2])
      if(d) {
        return d
      }
      return min(l0+a[2], l1) - min(m0+b[2], m1)
    
    //TODO: Maybe optimize n=4 as well?
    
    default:
      var as = a.slice(0)
      as.sort()
      var bs = b.slice(0)
      bs.sort()
      for(var i=0; i<n; ++i) {
        t = as[i] - bs[i]
        if(t) {
          return t
        }
      }
      return 0
  }
}
exports.compareCells = compareCells

function compareZipped(a, b) {
  return compareCells(a[0], b[0])
}

//Puts a cell complex into normal order for the purposes of findCell queries
function normalize(cells, attr) {
  if(attr) {
    var len = cells.length
    var zipped = new Array(len)
    for(var i=0; i<len; ++i) {
      zipped[i] = [cells[i], attr[i]]
    }
    zipped.sort(compareZipped)
    for(var i=0; i<len; ++i) {
      cells[i] = zipped[i][0]
      attr[i] = zipped[i][1]
    }
    return cells
  } else {
    cells.sort(compareCells)
    return cells
  }
}
exports.normalize = normalize

//Removes all duplicate cells in the complex
function unique(cells) {
  if(cells.length === 0) {
    return []
  }
  var ptr = 1
    , len = cells.length
  for(var i=1; i<len; ++i) {
    var a = cells[i]
    if(compareCells(a, cells[i-1])) {
      if(i === ptr) {
        ptr++
        continue
      }
      cells[ptr++] = a
    }
  }
  cells.length = ptr
  return cells
}
exports.unique = unique;

//Finds a cell in a normalized cell complex
function findCell(cells, c) {
  var lo = 0
    , hi = cells.length-1
    , r  = -1
  while (lo <= hi) {
    var mid = (lo + hi) >> 1
      , s   = compareCells(cells[mid], c)
    if(s <= 0) {
      if(s === 0) {
        r = mid
      }
      lo = mid + 1
    } else if(s > 0) {
      hi = mid - 1
    }
  }
  return r
}
exports.findCell = findCell;

//Builds an index for an n-cell.  This is more general than dual, but less efficient
function incidence(from_cells, to_cells) {
  var index = new Array(from_cells.length)
  for(var i=0, il=index.length; i<il; ++i) {
    index[i] = []
  }
  var b = []
  for(var i=0, n=to_cells.length; i<n; ++i) {
    var c = to_cells[i]
    var cl = c.length
    for(var k=1, kn=(1<<cl); k<kn; ++k) {
      b.length = bits.popCount(k)
      var l = 0
      for(var j=0; j<cl; ++j) {
        if(k & (1<<j)) {
          b[l++] = c[j]
        }
      }
      var idx=findCell(from_cells, b)
      if(idx < 0) {
        continue
      }
      while(true) {
        index[idx++].push(i)
        if(idx >= from_cells.length || compareCells(from_cells[idx], b) !== 0) {
          break
        }
      }
    }
  }
  return index
}
exports.incidence = incidence

//Computes the dual of the mesh.  This is basically an optimized version of buildIndex for the situation where from_cells is just the list of vertices
function dual(cells, vertex_count) {
  if(!vertex_count) {
    return incidence(unique(skeleton(cells, 0)), cells, 0)
  }
  var res = new Array(vertex_count)
  for(var i=0; i<vertex_count; ++i) {
    res[i] = []
  }
  for(var i=0, len=cells.length; i<len; ++i) {
    var c = cells[i]
    for(var j=0, cl=c.length; j<cl; ++j) {
      res[c[j]].push(i)
    }
  }
  return res
}
exports.dual = dual

//Enumerates all cells in the complex
function explode(cells) {
  var result = []
  for(var i=0, il=cells.length; i<il; ++i) {
    var c = cells[i]
      , cl = c.length|0
    for(var j=1, jl=(1<<cl); j<jl; ++j) {
      var b = []
      for(var k=0; k<cl; ++k) {
        if((j >>> k) & 1) {
          b.push(c[k])
        }
      }
      result.push(b)
    }
  }
  return normalize(result)
}
exports.explode = explode

//Enumerates all of the n-cells of a cell complex
function skeleton(cells, n) {
  if(n < 0) {
    return []
  }
  var result = []
    , k0     = (1<<(n+1))-1
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i]
    for(var k=k0; k<(1<<c.length); k=bits.nextCombination(k)) {
      var b = new Array(n+1)
        , l = 0
      for(var j=0; j<c.length; ++j) {
        if(k & (1<<j)) {
          b[l++] = c[j]
        }
      }
      result.push(b)
    }
  }
  return normalize(result)
}
exports.skeleton = skeleton;

//Computes the boundary of all cells, does not remove duplicates
function boundary(cells) {
  var res = []
  for(var i=0,il=cells.length; i<il; ++i) {
    var c = cells[i]
    for(var j=0,cl=c.length; j<cl; ++j) {
      var b = new Array(c.length-1)
      for(var k=0, l=0; k<cl; ++k) {
        if(k !== j) {
          b[l++] = c[k]
        }
      }
      res.push(b)
    }
  }
  return normalize(res)
}
exports.boundary = boundary;

//Computes connected components for a dense cell complex
function connectedComponents_dense(cells, vertex_count) {
  var labels = new UnionFind(vertex_count)
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i]
    for(var j=0; j<c.length; ++j) {
      for(var k=j+1; k<c.length; ++k) {
        labels.link(c[j], c[k])
      }
    }
  }
  var components = []
    , component_labels = labels.ranks
  for(var i=0; i<component_labels.length; ++i) {
    component_labels[i] = -1
  }
  for(var i=0; i<cells.length; ++i) {
    var l = labels.find(cells[i][0])
    if(component_labels[l] < 0) {
      component_labels[l] = components.length
      components.push([cells[i].slice(0)])
    } else {
      components[component_labels[l]].push(cells[i].slice(0))
    }
  }
  return components
}

//Computes connected components for a sparse graph
function connectedComponents_sparse(cells) {
  var vertices  = unique(normalize(skeleton(cells, 0)))
    , labels    = new UnionFind(vertices.length)
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i]
    for(var j=0; j<c.length; ++j) {
      var vj = findCell(vertices, [c[j]])
      for(var k=j+1; k<c.length; ++k) {
        labels.link(vj, findCell(vertices, [c[k]]))
      }
    }
  }
  var components        = []
    , component_labels  = labels.ranks
  for(var i=0; i<component_labels.length; ++i) {
    component_labels[i] = -1
  }
  for(var i=0; i<cells.length; ++i) {
    var l = labels.find(findCell(vertices, [cells[i][0]]));
    if(component_labels[l] < 0) {
      component_labels[l] = components.length
      components.push([cells[i].slice(0)])
    } else {
      components[component_labels[l]].push(cells[i].slice(0))
    }
  }
  return components
}

//Computes connected components for a cell complex
function connectedComponents(cells, vertex_count) {
  if(vertex_count) {
    return connectedComponents_dense(cells, vertex_count)
  }
  return connectedComponents_sparse(cells)
}
exports.connectedComponents = connectedComponents

},{"bit-twiddle":46,"union-find":47}],49:[function(require,module,exports){
"use strict"

var ch = require("incremental-convex-hull")
var uniq = require("uniq")

module.exports = triangulate

function LiftedPoint(p, i) {
  this.point = p
  this.index = i
}

function compareLifted(a, b) {
  var ap = a.point
  var bp = b.point
  var d = ap.length
  for(var i=0; i<d; ++i) {
    var s = bp[i] - ap[i]
    if(s) {
      return s
    }
  }
  return 0
}

function triangulate1D(n, points, includePointAtInfinity) {
  if(n === 1) {
    if(includePointAtInfinity) {
      return [ [-1, 0] ]
    } else {
      return []
    }
  }
  var lifted = points.map(function(p, i) {
    return [ p[0], i ]
  })
  lifted.sort(function(a,b) {
    return a[0] - b[0]
  })
  var cells = new Array(n - 1)
  for(var i=1; i<n; ++i) {
    var a = lifted[i-1]
    var b = lifted[i]
    cells[i-1] = [ a[1], b[1] ]
  }
  if(includePointAtInfinity) {
    cells.push(
      [ -1, cells[0][1], ],
      [ cells[n-1][1], -1 ])
  }
  return cells
}

function triangulate(points, includePointAtInfinity) {
  var n = points.length
  if(n === 0) {
    return []
  }
  
  var d = points[0].length
  if(d < 1) {
    return []
  }

  //Special case:  For 1D we can just sort the points
  if(d === 1) {
    return triangulate1D(n, points, includePointAtInfinity)
  }
  
  //Lift points, sort
  var lifted = new Array(n)
  var upper = 1.0
  for(var i=0; i<n; ++i) {
    var p = points[i]
    var x = new Array(d+1)
    var l = 0.0
    for(var j=0; j<d; ++j) {
      var v = p[j]
      x[j] = v
      l += v * v
    }
    x[d] = l
    lifted[i] = new LiftedPoint(x, i)
    upper = Math.max(l, upper)
  }
  uniq(lifted, compareLifted)
  
  //Double points
  n = lifted.length

  //Create new list of points
  var dpoints = new Array(n + d + 1)
  var dindex = new Array(n + d + 1)

  //Add steiner points at top
  var u = (d+1) * (d+1) * upper
  var y = new Array(d+1)
  for(var i=0; i<=d; ++i) {
    y[i] = 0.0
  }
  y[d] = u

  dpoints[0] = y.slice()
  dindex[0] = -1

  for(var i=0; i<=d; ++i) {
    var x = y.slice()
    x[i] = 1
    dpoints[i+1] = x
    dindex[i+1] = -1
  }

  //Copy rest of the points over
  for(var i=0; i<n; ++i) {
    var h = lifted[i]
    dpoints[i + d + 1] = h.point
    dindex[i + d + 1] =  h.index
  }

  //Construct convex hull
  var hull = ch(dpoints, false)
  if(includePointAtInfinity) {
    hull = hull.filter(function(cell) {
      var count = 0
      for(var j=0; j<=d; ++j) {
        var v = dindex[cell[j]]
        if(v < 0) {
          if(++count >= 2) {
            return false
          }
        }
        cell[j] = v
      }
      return true
    })
  } else {
    hull = hull.filter(function(cell) {
      for(var i=0; i<=d; ++i) {
        var v = dindex[cell[i]]
        if(v < 0) {
          return false
        }
        cell[i] = v
      }
      return true
    })
  }

  if(d & 1) {
    for(var i=0; i<hull.length; ++i) {
      var h = hull[i]
      var x = h[0]
      h[0] = h[1]
      h[1] = x
    }
  }

  return hull
}
},{"incremental-convex-hull":39,"uniq":50}],50:[function(require,module,exports){
"use strict"

function unique_pred(list, compare) {
  var ptr = 1
    , len = list.length
    , a=list[0], b=list[0]
  for(var i=1; i<len; ++i) {
    b = a
    a = list[i]
    if(compare(a, b)) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique_eq(list) {
  var ptr = 1
    , len = list.length
    , a=list[0], b = list[0]
  for(var i=1; i<len; ++i, b=a) {
    b = a
    a = list[i]
    if(a !== b) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique(list, compare, sorted) {
  if(list.length === 0) {
    return list
  }
  if(compare) {
    if(!sorted) {
      list.sort(compare)
    }
    return unique_pred(list, compare)
  }
  if(!sorted) {
    list.sort()
  }
  return unique_eq(list)
}

module.exports = unique

},{}],51:[function(require,module,exports){
"use strict"

var triangulate = require("delaunay-triangulate")
var circumcenter = require("circumcenter")
var uniq = require("uniq")

module.exports = voronoi

function compareInt(a, b) {
  return a - b
}

function voronoi1D(points) {
  if(points.length === 1) {
    return {
      cells: [ [-1] ],
      positions: []
    }
  }
  var tagged = points.map(function(p, i) {
    return [ p[0], i ]
  })
  tagged.sort(function(a,b) {
    return a-b
  })
  var cells = new Array(points.length)
  for(var i=0; i<cells.length; ++i) {
    cells[i] = [-1,-1]
  }
  var dualPoints = []
  for(var j=1; j<tagged.length; ++j) {
    var a = tagged[j-1]
    var b = tagged[j]
    var center = 0.5*(a[0]+b[0])
    var n = dualPoints.length
    dualPoints.push([center])
    cells[a[1]][1] = n
    cells[b[1]][0] = n
  }
  cells[tagged[0][1]][1] = 0
  cells[tagged[tagged.length-1][1]][0] = dualPoints.length-1
  return {
    cells: cells,
    positions: dualPoints
  }
}

function voronoi(points) {
  var n = points.length
  if(n === 0) {
    return { cells: [], positions: [] }
  }
  var d = points[0].length
  if(d < 1) {
    return { cells: [], positions: [] }
  }
  if(d === 1) {
    return voronoi1D(points)
  }

  //First delaunay triangulate all points including point at infinity
  var cells = triangulate(points, true)

  //Construct dual points
  var stars = new Array(n)
  for(var i=0; i<n; ++i) {
    stars[i] = []
  }
  var nc = cells.length
  var tuple = new Array(d+1)
  var cellIndex = new Array(nc)
  var dualPoints = []
  for(var i=0; i<nc; ++i) {
    var verts = cells[i]
    var skip = false
    for(var j=0; j<=d; ++j) {
      var v = verts[j]
      if(v < 0) {
        cellIndex[i] = -1
        skip = true
      } else {
        stars[v].push(i)
        tuple[j] = points[v]
      }
    }
    if(skip) {
      continue
    }
    cellIndex[i] = dualPoints.length
    dualPoints.push(circumcenter(tuple))
  }

  //Build dual cells
  var dualCells
  if(d === 2) {
    dualCells = new Array(n)
    for(var i=0; i<n; ++i) {
      var dual = stars[i]
      var c = [ cellIndex[dual[0]] ]
      var s = cells[dual[0]][(cells[dual[0]].indexOf(i)+1) % 3]
      for(var j=1; j<dual.length; ++j) {
        for(var k=1; k<dual.length; ++k) {
          var x = (cells[dual[k]].indexOf(i) + 2) % 3
          if(cells[dual[k]][x] === s) {
            c.push(cellIndex[dual[k]])
            s = cells[dual[k]][(x+2)%3]
            break
          }
        }
      }
      dualCells[i] = c
    }
  } else {
    for(var i=0; i<n; ++i) {
      var s = stars[i]
      for(var j=0; j<s.length; ++j) {
        s[j] = cellIndex[s[j]]
      }
      uniq(s, compareInt)
    }
    dualCells = stars
  }

  //Return the resulting cells
  return {
    cells: dualCells,
    positions: dualPoints
  }
}
},{"circumcenter":30,"delaunay-triangulate":49,"uniq":50}],52:[function(require,module,exports){
var gamejs = require('gamejs');
var voronoiGenerator = require('voronoi-diagram');
var simplexNoise = require('simplex-noise');
var g = gamejs.graphics;
var Surface = g.Surface;
var SurfaceArray = g.SurfaceArray;
var random = gamejs.math.random;

function noise() {
    var width,
        height,
        seed,
        rand,
        minR,
        minG,
        minB,
        minA,
        maxR,
        maxG,
        maxB,
        maxA,
        surface;

    var defaults = {
        min: 0,
        max: 255,
        seed: 0
    };

    if(arguments.length === 6) {
        if(arguments[4] instanceof Array && arguments[5] instanceof Array && arguments[4].length >= 3 && arguments[5].length >= 3) {
            surface = arguments[0];
            width = arguments[1];
            height = arguments[2];
            seed = arguments[3];
            minR = arguments[4][0];
            minG = arguments[4][1];
            minB = arguments[4][2];
            maxR = arguments[5][0];
            maxG = arguments[5][1];
            maxB = arguments[5][2];

            if(arguments[4].length > 3)
                minA = arguments[4][3];

            if(arguments[5].length > 3)
                maxA = arguments[5][3];
        }
        else {
            throw new Error('Improper arguments for noise surface');
        }
    }
    else if(arguments.length === 5) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            seed = arguments[2];
        }
        else {
            width = arguments[1];
            height = arguments[2];
        }

        if(arguments[3] instanceof Array && arguments[4] instanceof Array && arguments[3].length >= 3 && arguments[4].length >= 3) {
            minR = arguments[3][0];
            minG = arguments[3][1];
            minB = arguments[3][2];
            maxR = arguments[4][0];
            maxG = arguments[4][1];
            maxB = arguments[4][2];

            if(arguments[3].length > 3)
                minA = arguments[3][3];

            if(arguments[4].length > 3)
                maxA = arguments[4][3];
        }
        else {
            throw new Error('Improper arguments for noise surface');
        }
    }
    else if(arguments.length === 4) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
        }
        else {
            throw new Error('Improper arguments for noise surface');
        }

        if(arguments[2] instanceof Array && arguments[3] instanceof Array && arguments[2].length >= 3 && arguments[3].length >= 3) {
            minR = arguments[2][0];
            minG = arguments[2][1];
            minB = arguments[2][2];
            maxR = arguments[3][0];
            maxG = arguments[3][1];
            maxB = arguments[3][2];

            if(arguments[2].length > 3)
                minA = arguments[2][3];

            if(arguments[3].length > 3)
                maxA = arguments[3][3];
        }
        else {
            throw new Error('Improper arguments for noise surface');
        }
    }
    else {
        throw new Error('Improper arguments for noise surface');
    }

    minR = minR || defaults.min;
    minG = minG || defaults.min;
    minB = minB || defaults.min;
    minA = minA || defaults.min;

    maxR = maxR || maxR === 0 ? maxR : defaults.max;
    maxG = maxG || maxG === 0 ? maxG : defaults.max;
    maxB = maxB || maxB === 0 ? maxB : defaults.max;
    maxA = maxA || maxA === 0 ? maxA : defaults.max;

    seed = seed || defaults.seed;

    rand = random.Alea(seed);

    surface = new SurfaceArray([width, height]);

    var xPos, yPos, r, g, b, a;
    if(minR === maxR)
        r = minR;
    if(minG === maxG)
        g = minG;
    if(minB === maxB)
        b = minB;
    if(minA === maxA)
        a = minA;
    for(xPos = 0; xPos < width; xPos++) {
        for(yPos = 0; yPos < height; yPos++) {
            if(minR !== maxR)
                r = rand.integer(minR, maxR);
            if(minG !== maxG)
                g = rand.integer(minG, maxG);
            if(minB !== maxB)
                b = rand.integer(minB, maxB);
            if(minA !== maxA)
                a = rand.integer(minA, maxA);
            surface.set(xPos, yPos, [r, g, b, a]);
        }
    }

    return surface.surface;
}

function relative() {
    var width,
        height,
        color,
        source,
        sourceInfo,
        callback,
        surface;

    if(arguments.length === 3) {
        source = arguments[0];
        color = arguments[1];
        callback = arguments[2];
    }
    else {
        throw new Error('Improper arguments for relative surface');
    }

    width = source.getSize()[0];
    height = source.getSize()[1];
    sourceInfo = new SurfaceArray(source);
    surface = new SurfaceArray([width, height]);

    var cbData;
    for(var xPos = 0; xPos < width; xPos++) {
        for(var yPos = 0; yPos < height; yPos++) {
            cbData = callback(xPos, yPos, sourceInfo);
            if(cbData) {
                if(color instanceof Function)
                    surface.set(xPos, yPos, color(xPos, yPos, sourceInfo, cbData));
                else
                    surface.set(xPos, yPos, color);
            }
        }
    }

    return surface.surface;
}

function simplex() {
    var width,
        height,
        seed,
        rand,
        minR,
        minG,
        minB,
        minA,
        maxR,
        maxG,
        maxB,
        maxA,
        x1,
        x2,
        y1,
        y2,
        surface;

    var defaults = {
        min: 0,
        max: 255,
        seed: 0,
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 10
    };

    if(arguments.length === 6) {
        if(arguments[4] instanceof Array && arguments[5] instanceof Array && arguments[4].length >= 5 && arguments[5].length >= 5) {
            surface = arguments[0];
            width = arguments[1];
            height = arguments[2];
            seed = arguments[3];
            minR = arguments[4][0];
            minG = arguments[4][1];
            minB = arguments[4][2];
            x1 = arguments[4][4];
            y1 = arguments[4][5];
            maxR = arguments[5][0];
            maxG = arguments[5][1];
            maxB = arguments[5][2];
            x2 = arguments[5][4];
            y2 = arguments[5][5];

            if(arguments[4].length > 3)
                minA = arguments[4][3];

            if(arguments[5].length > 3)
                maxA = arguments[5][3];
        }
        else {
            throw new Error('Improper arguments for simplex surface');
        }
    }
    else if(arguments.length === 5) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            seed = arguments[2];
        }
        else {
            width = arguments[1];
            height = arguments[2];
        }

        if(arguments[3] instanceof Array && arguments[4] instanceof Array && arguments[3].length >= 5 && arguments[4].length >= 5) {
            minR = arguments[3][0];
            minG = arguments[3][1];
            minB = arguments[3][2];
            x1 = arguments[3][4];
            y1 = arguments[3][5];

            maxR = arguments[4][0];
            maxG = arguments[4][1];
            maxB = arguments[4][2];
            x2 = arguments[4][4];
            y2 = arguments[4][5];

            if(arguments[3].length > 3)
                minA = arguments[3][3];

            if(arguments[4].length > 3)
                maxA = arguments[4][3];
        }
        else {
            throw new Error('Improper arguments for simplex surface');
        }
    }
    else if(arguments.length === 4) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
        }
        else {
            throw new Error('Improper arguments for simplex surface');
        }

        if(arguments[2] instanceof Array && arguments[3] instanceof Array && arguments[2].length >= 5 && arguments[3].length >= 5) {
            minR = arguments[2][0];
            minG = arguments[2][1];
            minB = arguments[2][2];
            x1 = arguments[2][4];
            y1 = arguments[2][5];

            maxR = arguments[3][0];
            maxG = arguments[3][1];
            maxB = arguments[3][2];
            x1 = arguments[3][4];
            y1 = arguments[3][5];

            if(arguments[2].length > 3)
                minA = arguments[2][3];

            if(arguments[3].length > 3)
                maxA = arguments[3][3];
        }
        else {
            throw new Error('Improper arguments for simplex surface');
        }
    }
    else {
        throw new Error('Improper arguments for simplex surface');
    }

    minR = minR || defaults.min;
    minG = minG || defaults.min;
    minB = minB || defaults.min;
    minA = minA || defaults.min;
    x1 = x1 || defaults.x1;
    y1 = y1 || defaults.y1;

    maxR = maxR || maxR === 0 ? maxR : defaults.max;
    maxG = maxG || maxG === 0 ? maxG : defaults.max;
    maxB = maxB || maxB === 0 ? maxB : defaults.max;
    maxA = maxA || maxA === 0 ? maxA : defaults.max;
    x2 = x2 || defaults.x2;
    y2 = y2 || defaults.y2;

    seed = seed || defaults.seed;

    rand = random.Alea(seed);

    surface = new SurfaceArray([width, height]);

    var xPos, yPos;

    function value(min, max, percent) {
        return Math.floor((max - min) * percent + min);
    }

    var pi = Math.PI;
    var cos = Math.cos;
    var sin = Math.sin;
    var noise = new SimplexNoise(rand.random);
    for(xPos = 0; xPos < width; xPos++) {
        for(yPos = 0; yPos < height; yPos++) {
            var s = xPos/width;
            var t = yPos/height;
            var dx = x2 - x1;
            var dy = y2 - y1;

            var nx = x1+cos(s*2*pi) * dx/(2*pi);
            var ny = y1+cos(t*2*pi) * dy/(2*pi);
            var nz = x1+sin(s*2*pi) * dx/(2*pi);
            var nw = y1+sin(t*2*pi) * dy/(2*pi);

            var val = noise.noise4D(nx, ny, nz, nw) + 1;
            val /= 2;

            var r = value(minR, maxR, val);
            var g = value(minG, maxG, val);
            var b = value(minB, maxB, val);
            var a = value(minA, maxA, val);

            surface.set(xPos, yPos, [r, g, b, a]);
        }
    }

    return surface.surface;
}

function solid() {
    var width, height, color, surface;

    if(arguments.length === 4) {
        surface = arguments.length[0];
        width = arguments.length[0];
        height = arguments.length[1];
        color = arguments.length[2];
    }
    else if(arguments.length === 3) {
        surface = arguments.length[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            color = arguments[2];
        }
        else {
            width = arguments[1];
            height = arguments[2];
        }
    }
    else if(arguments.length === 2) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
        }
        else {
            throw new Error('Improper arguments for solid surface');
        }
    }
    else if(arguments.length === 1 && arguments[0] instanceof Array) {
        width = arguments[0][0];
        height = arguments[0][1];
    }
    else {
        throw new Error('Improper arguments for solid surface');
    }

    if(!surface)
        surface = new Surface(width, height);
    else
        surface.clear();

    if(color)
        surface.fill(color);

    return surface;
}

function voronoi() {
    var width,
        height,
        seed,
        pointCount,
        rand,
        points,
        minVec,
        maxVec,
        voronoiLines,
        voronoiLineColor,
        voronoiLineWidth,
        surface;

    var defaults = {
        lineColor: '#000',
        lineWidth: 1,
        seed: 0
    };

    if(arguments.length === 6) {
        surface = arguments[0];
        width = arguments[1];
        height = arguments[2];
        seed = arguments[3];
        pointCount = arguments[4];
        voronoiLineColor = arguments[5];
        voronoiLineWidth = arguments[6];
    }
    else if(arguments.length === 5) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            seed = arguments[2];
            pointCount = arguments[3];
            voronoiLineColor = arguments[4];
            voronoiLineWidth = arguments[5];
        }
        else {
            width = arguments[1];
            height = arguments[2];
            seed = arguments[3];
            pointCount = arguments[4];
            voronoiLineColor = arguments[5];
        }
    }
    else if(arguments.length === 4) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            seed = arguments[2];
            if(arguments[3] instanceof Object) {
                pointCount = arguments[3].points;
                voronoiLineColor = arguments[3].lineColor;
                voronoiLineWidth = arguments[3].lineWidth;
            }
            else {
                pointCount = arguments[3];
                voronoiLineColor = arguments[4];
            }
        }
        else {
            width = arguments[1];
            height = arguments[2];
            seed = arguments[3];
            pointCount = arguments[4];
        }
    }
    else if(arguments.length === 3) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            if(arguments[2] instanceof Object) {
                seed = arguments[2].seed;
                pointCount = arguments[2].points;
                voronoiLineColor = arguments[2].lineColor;
                voronoiLineWidth = arguments[2].lineWidth;
            }
            else {
                seed = arguments[2];
            }
        }
        else {
            width = arguments[1];
            height = arguments[2];
        }
    }
    else if(arguments.length === 2 && arguments[1] instanceof Array) {
        surface = arguments[0];
        width = arguments[1][0];
        height = arguments[1][1];
    }
    else {
        throw new Error('Improper arguments for voronoi surface');
    }

    voronoiLineColor = voronoiLineColor || defaults.lineColor;
    voronoiLineWidth = voronoiLineWidth || defaults.lineWidth;
    seed = seed || defaults.seed;
    pointCount = pointCount || (width + height) / 2;

    surface = solid(surface, width, height);
    rand = random.Alea(seed);
    points = [];

    minVec = [0, 0];
    maxVec = [width, height];

    var i, point, x, y, left, right, up, down;
    for(i = 0; i < pointCount; i++) {
        point = rand.vector(minVec, maxVec);
        x = point[0];
        y = point[1];
        left = x - width;
        right = x + width;
        up = y - height;
        down = y + height;
        points.push([left, up]);
        points.push([x, up]);
        points.push([right, up]);
        points.push([left, y]);
        points.push(point);
        points.push([right, y]);
        points.push([left, down]);
        points.push([x, down]);
        points.push([right, down]);
    }

    voronoiLines = voronoiGenerator(points);

    var vc, cell, c, otherPoint, point1, point2;
    for(vc in voronoiLines.cells) {
        cell = voronoiLines.cells[vc];
        for(c = 0; c < cell.length; c++) {
            otherPoint = c === 0 ? cell.length - 1 : c - 1;

            point1 = cell[c];
            point2 = cell[otherPoint];

            if(point1 === -1 || point2 === -1)
                continue;

            point1 = voronoiLines.positions[point1];
            point2 = voronoiLines.positions[point2];

            g.line(surface, voronoiLineColor, point1, point2, voronoiLineWidth);
        }
    }

    return surface;
}

module.exports = {
    noise: noise,
    relative: relative,
    simplex: simplex,
    solid: solid,
    voronoi: voronoi
};

},{"gamejs":2,"simplex-noise":29,"voronoi-diagram":51}],53:[function(require,module,exports){
module.exports = {
    source: {
        isSource: true,
        maxConnections: -1,
        endpoint: 'Dot',
        anchor: 'Right'
    },
    target: {
        isTarget: true,
        endPoint: 'Dot'
    },
    targetTop: {
        anchor: [ 0, 1/3, 0, 0 ]
    },
    targetBottom: {
        anchor: [ 0, 2/3, 0, 0 ]
    },
    targetMid: {
        anchor: 'Left'
    }
};

},{}],54:[function(require,module,exports){
module.exports = ["images/cursor_pointerFlat_shadow.png","images/grey_arrowDownGrey.png","images/grey_arrow_down.png","images/grey_arrow_up.png","images/menus/glass/center.png","images/menus/glass/corner-cut.png","images/menus/glass/corner-round.png","images/menus/glass/horizontal.png","images/menus/glass/vertical.png","images/menus/metal/center.png","images/menus/metal/corner.png","images/menus/metal/horizontal.png","images/menus/metal/red/half/split.png","images/menus/metal/red/top-left.png","images/menus/metal/red/top-right.png","images/menus/metal/red/top.png","images/menus/metal/vertical.png","images/red_x.png"];
},{}],55:[function(require,module,exports){
var instance = jsPlumb.getInstance({
    Container: 'wrapper',
    Connector: [ 'Bezier', { curviness: 1 } ],
    Anchors: [ 'Right', [ 0, 0.5, 0, 1 ] ],
    ConnectionOverlays: [
        [ 'Arrow', { location: 1 } ]
    ]
});

module.exports = instance;

},{}],56:[function(require,module,exports){
module.exports = [{ name: "blit", layer: require("./layers/blit") },{ name: "noise", layer: require("./layers/noise") },{ name: "rotate", layer: require("./layers/rotate") },{ name: "shadow", layer: require("./layers/shadow") },{ name: "simplex", layer: require("./layers/simplex") },{ name: "solid", layer: require("./layers/solid") },{ name: "voronoi", layer: require("./layers/voronoi") }];
},{"./layers/blit":57,"./layers/noise":62,"./layers/rotate":63,"./layers/shadow":64,"./layers/simplex":65,"./layers/solid":66,"./layers/voronoi":67}],57:[function(require,module,exports){
var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');
var surface;

function addSource(data, source, target, connId) {
    if(target === data.topId) {
        data.topInput = source;
        data.topIn = connId;
    }
    else if(target === data.botId) {
        data.bottomInput = source;
        data.botIn = connId;
    }
}

function removeSource(data, connId) {
    if(connId === data.topIn) {
        data.topInput = undefined;
        data.topIn = undefined;
    }
    else if(connId === data.botIn) {
        data.bottomInput = undefined;
        data.botIn = undefined;
    }
}

function render(data, size) {
    if(!data.topInput && !data.bottomInput)
        data.surface = SurfaceFactory.solid(data.surface, [64, 64]);
    else if(!data.topInput)
        data.surface = data.bottomInput.render(data.bottomInput, size);
    else if(!data.bottomInput)
        data.surface = data.topInput.render(data.topInput, size);
    else {
        data.surface = data.topInput.render(data.topInput, size).clone();
        data.surface.blit(data.bottomInput.render(data.bottomInput, size));
    }

    return data.surface;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([110, 120], 'metal');
    menu.children[1].innerHTML = 'Blit';
    menu.id = guid();
    var div = menu.children[4];

    var listeners = {};

    var obj = {
        div: menu,
        listeners: listeners,
        render: render,
        topInput: undefined,
        bottomInput: undefined,
        addSource: addSource,
        removeSource: removeSource,
        topId: undefined,
        botId: undefined,
        topIn: undefined,
        botIn: undefined,
        surface: null,
        connectors: []
    };

    menu.children[2].appendChild(layerControl(obj));

    var endConn = plumb.addEndpoint(menu, conn.source);
    var topId = plumb.addEndpoint(menu, conn.target, conn.targetTop);
    var botId = plumb.addEndpoint(menu, conn.target, conn.targetBottom);

    obj.connectors.push(endConn);
    obj.connectors.push(topId);
    obj.connectors.push(botId);

    obj.topId = topId.id;
    obj.botId = botId.id;

    return obj;
};

},{"../SurfaceFactory":52,"../connectors":53,"../jsPlumbInstance":55,"../menuBuilder":68,"../util/guid":70}],58:[function(require,module,exports){
var plumb = require('../../jsPlumbInstance');

module.exports = function(layers, onchange) {
    return function(layer) {
        var div = document.createElement('div');
        div.className = 'menu-controls';

        var close = (function() {
            var button = document.createElement('input');
            button.input = 'button';
            button.className = 'close';

            button.onclick = function(e) {
                if(layers[layer.div.id]) {
                    delete layers[layer.div.id];
                    plumb.detachAllConnections(layer.div);
                    plumb.remove(layer.div);
                    onchange(e);
                }
            };

            return button;
        })();

        div.appendChild(close);

        return div;
    };
};


},{"../../jsPlumbInstance":55}],59:[function(require,module,exports){
module.exports = function(listeners, onchange, label, def, min, max) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = label;

    var number = (function(listeners) {
        var num = document.createElement('input');
        num.type = 'number';
        num.value = def;
        num.onchange = onchange;

        listeners.value = function() {
            return Number.parseInt(num.value);
        };

        if(min || max || min === 0 || max === 0) {
            listeners.handle = function() {
                var val = Number.parseInt(num.value);
                if(min || min === 0)
                    if(val < min)
                        num.value = min;

                if(max || max === 0)
                    if (val > max)
                        num.value = max;
            };
        }

        return num;
    })(listeners);

    wrapper.appendChild(number);

    return wrapper;
};

},{}],60:[function(require,module,exports){
module.exports = function(listeners, onchange, label, minVal, maxVal) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = label;

    listeners.min = {};
    listeners.max = {};

    var min = (function(listeners) {
        var number = document.createElement('input');
        number.type = 'number';
        number.value = minVal;
        number.onchange = onchange;

        listeners.value = function() {
            return Number.parseInt(number.value);
        };

        listeners.handle = function() {
            var val = Number.parseInt(number.value);
            if(val < minVal)
                number.value = minVal;
        };

        return number;
    })(listeners.min);

    var max = (function(listeners) {
        var number = document.createElement('input');
        number.type = 'number';
        number.value = maxVal;
        number.onchange = onchange;

        listeners.value = function() {
            return Number.parseInt(number.value);
        };

        listeners.handle = function() {
            var val = Number.parseInt(number.value);
            if(val > maxVal)
                number.value = maxVal;
        };

        return number;
    })(listeners.max);

    var arrow = (function() {
        var text = document.createElement('span');
        text.innerHTML = '-';

        return text;
    })();

    listeners.handle = function() {
        var minVal = Number.parseInt(min.value);
        var maxVal = Number.parseInt(max.value);
        if(minVal > maxVal)
            min.value = max.value;
    };

    wrapper.appendChild(min);
    wrapper.appendChild(arrow);
    wrapper.appendChild(max);

    return wrapper;
};


},{}],61:[function(require,module,exports){
module.exports = function(listeners, onchange, label, def) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = label;
    def = def || '';

    var text = (function(listeners) {
        var text = document.createElement('input');
        text.type = 'text';
        text.value = def;
        text.onchange = onchange;

        listeners.value = function() {
            return text.value;
        };

        return text;
    })(listeners);

    wrapper.appendChild(text);

    return wrapper;
};

},{}],62:[function(require,module,exports){
var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var text = require('./component/textInput');
var numberRange = require('./component/numberRangeInput');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');

function render(data, size) {
    var args = data.listeners;
    var surf = SurfaceFactory.noise(data.surface,
        [size, size],
        args.seed.value(),
        [
            args.red.min.value(),
            args.green.min.value(),
            args.blue.min.value(),
            args.alpha.min.value()
        ],
        [
            args.red.max.value(),
            args.green.max.value(),
            args.blue.max.value(),
            args.alpha.max.value(),
        ]);
    //TODO: remove cache hack
    data.surface = surf;
    return surf;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([350, 193], 'metal');
    menu.children[1].innerHTML = 'Noise';
    menu.id = guid();
    var div = menu.children[4];

    var listeners = {
        seed: {},
        red: {},
        green: {},
        blue: {},
        alpha: {}
    };

    var controls = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        var seedWrapper = text(listeners.seed, onchange, 'Seed: ', '1');

        var redWrapper = numberRange(listeners.red, onchange, 'Red: ', 0, 255);
        var greenWrapper = numberRange(listeners.green, onchange, 'Green: ', 0, 255);
        var blueWrapper = numberRange(listeners.blue, onchange, 'Blue: ', 0, 255);
        var alphaWrapper = numberRange(listeners.alpha, onchange, 'Alpha: ', 0, 255);

        div.appendChild(seedWrapper);
        div.appendChild(redWrapper);
        div.appendChild(greenWrapper);
        div.appendChild(blueWrapper);
        div.appendChild(alphaWrapper);

        return div;
    })();

    var obj = {
        div: menu,
        listeners: listeners,
        render: render,
        connectors: []
    };

    menu.children[2].appendChild(layerControl(obj));
    div.appendChild(controls);

    obj.connectors.push(plumb.addEndpoint(menu, conn.source));

    return obj;
};

},{"../SurfaceFactory":52,"../connectors":53,"../jsPlumbInstance":55,"../menuBuilder":68,"../util/guid":70,"./component/numberRangeInput":60,"./component/textInput":61}],63:[function(require,module,exports){
var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var number = require('./component/numberInput');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');

function addSource(data, source, target, connId) {
    data.source = source;
}

function removeSource(data, connId) {
    data.source = undefined;
}

function render(data, size) {
    if(!data.source)
        data.surface = SurfaceFactory.solid(data.surface, [size, size]);
    else {
        var source = data.source.render(data.source, size).clone();
        data.surface = SurfaceFactory.solid(data.surface, [size * 3, size * 3]);
        data.surface.blit(source, [-size, -size]);
        data.surface.blit(source, [-size, 0]);
        data.surface.blit(source, [-size, size]);
        data.surface.blit(source, [0, -size]);
        data.surface.blit(source, [0, 0]);
        data.surface.blit(source, [0, size]);
        data.surface.blit(source, [size, -size]);
        data.surface.blit(source, [size, 0]);
        data.surface.blit(source, [size, size]);
        source = data.surface.rotate(data.listeners.angle.value());
        data.surface = SurfaceFactory.solid(data.surface, [size, size]);
        data.surface.blit(source, [0, 0], [size, size, size, size]);
    }

    return data.surface;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([350, 193], 'metal');
    menu.children[1].innerHTML = 'Rotate';
    menu.id = guid();
    var div = menu.children[4];

    var listeners = {
        angle: {}
    };

    var controls = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        var angleWrapper = number(listeners.angle, onchange, 'Angle: ', 0, 0, 359);

        div.appendChild(angleWrapper);

        return div;
    })();

    var obj = {
        div: menu,
        listeners: listeners,
        render: render,
        source: undefined,
        addSource: addSource,
        removeSource: removeSource,
        surface: null,
        connectors: []
    };

    menu.children[2].appendChild(layerControl(obj));
    div.appendChild(controls);

    obj.connectors.push(plumb.addEndpoint(menu, conn.target, conn.targetMid));
    obj.connectors.push(plumb.addEndpoint(menu, conn.source));

    return obj;
};

},{"../SurfaceFactory":52,"../connectors":53,"../jsPlumbInstance":55,"../menuBuilder":68,"../util/guid":70,"./component/numberInput":59}],64:[function(require,module,exports){
var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var numberRange = require('./component/numberRangeInput');
var number = require('./component/numberInput');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');

function addSource(data, source, target, connId) {
    data.source = source;
}

function removeSource(data, connId) {
    data.source = undefined;
}

function getDeltaD(xRange, yRange, xVal, yVal) {
    var xRangeMin = xRange.min.value();
    var xRangeMax = xRange.max.value();
    var yRangeMin = yRange.min.value();
    var yRangeMax = yRange.max.value();

    var temp;
    if(xVal < 0) {
        xRangeMax *= -1;
        xRangeMin *= -1;
        xVal *= -1;

        temp = xRangeMax;
        xRangeMax = xRangeMin;
        xRangeMin = temp;
    }

    if(xRangeMin < 0)
        xRangeMin = 0;

    if(yVal < 0) {
        yRangeMax *= -1;
        yRangeMin *= -1;
        yVal *= -1;

        temp = yRangeMax;
        yRangeMax = yRangeMin;
        yRangeMin = temp;
    }

    if(yRangeMin < 0)
        yRangeMin = 0;

    var dXRange = xRangeMax - xRangeMin;
    var dYRange = yRangeMax - yRangeMin;
    var xMod = xVal - xRangeMin;
    var yMod = yVal - yRangeMin;

    var dist = Math.sqrt((xMod * xMod) + (yMod * yMod));
    var rangeDist = Math.sqrt((dXRange * dXRange) + (dYRange * dYRange));

    var dDist = ( 1 - (dist / rangeDist));

    return dDist;
}

function getValue(input, dist) {
    var dIn = input.max.value() - input.min.value();

    return  dist * dIn + input.min.value();
}

function render(data, size) {
    if(!data.source)
        data.surface = SurfaceFactory.solid(data.surface, [size, size]);
    else 
    {
        var input = data.listeners.input;
        var output = data.listeners.output;

        var surf = SurfaceFactory.relative(data.source.render(data.source, size),
            function color(xPos, yPos, sourceInfo, data) {
                var pixel = sourceInfo.get(xPos, yPos);

                var dist = getDeltaD(input.xMod, input.yMod, data.x, data.y);

                var red = getValue(output.red, dist);
                var green = getValue(output.green, dist);
                var blue = getValue(output.blue, dist);
                var alpha = getValue(output.alpha, dist);

                pixel[0] = red;
                pixel[1] = green;
                pixel[2] = blue;
                pixel[3] = alpha;

                return pixel;
            },
            function callback(xPos, yPos, sourceInfo) {
                var d;
                var xMin = Number.parseInt(input.xMod.min.value());
                var xMax = Number.parseInt(input.xMod.max.value());
                var yMin = Number.parseInt(input.yMod.min.value());
                var yMax = Number.parseInt(input.yMod.max.value());

                var minRed = Number.parseInt(input.red.min.value());
                var maxRed = Number.parseInt(input.red.max.value());
                var minGreen = Number.parseInt(input.green.min.value());
                var maxGreen = Number.parseInt(input.green.max.value());
                var minBlue = Number.parseInt(input.blue.min.value());
                var maxBlue = Number.parseInt(input.blue.max.value());
                var minAlpha = Number.parseInt(input.alpha.min.value());
                var maxAlpha = Number.parseInt(input.alpha.max.value());

                var out = false;
                for(var xMulti = xMin; xMulti <= xMax; xMulti++) {
                    for(var yMulti = yMin; yMulti <= yMax; yMulti++) {
                        var yp = yPos + yMulti;
                        var xp = xPos + xMulti;

                        if(yp > size)
                            yp -= size;
                        else if(yp < 0)
                            yp += size;

                        if(xp > size)
                            xp -= size;
                        else if(xp < 0)
                            xp += size;

                        d = sourceInfo.get(xp, yp);
                        if(d[0] >= minRed&&
                            d[0] <= maxRed &&
                            d[1] >= minGreen &&
                            d[1] <= maxGreen &&
                            d[2] >= minBlue &&
                            d[2] <= maxBlue &&
                            d[3] >= minAlpha &&
                            d[3] <= maxAlpha) {
                            var dist = Math.sqrt((xMulti * xMulti) + (yMulti * yMulti));
                            if(!out || out.dist > dist)
                                out = { dist: dist, x: xMulti, y: yMulti };
                        }
                    }
                }

                return out;
            });
        data.surface = surf;
    }

    return data.surface;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([350, 350], 'metal');
    menu.children[1].innerHTML = 'Shadow';
    menu.id = guid();
    var div = menu.children[4];

    var listeners = {
        input: {},
        output: {}
    };

    var controls = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        var input = (function(listeners) {
            var div = document.createElement('div');
            div.innerHTML = 'Input: ';

            listeners.red = {};
            listeners.green = {};
            listeners.blue = {};
            listeners.alpha = {};
            listeners.xMod = {};
            listeners.yMod = {};

            var redWrapper = numberRange(listeners.red, onchange, 'Red: ', 0, 255);
            var greenWrapper = numberRange(listeners.green, onchange, 'Green: ', 0, 255);
            var blueWrapper = numberRange(listeners.blue, onchange, 'Blue: ', 0, 255);
            var alphaWrapper = numberRange(listeners.alpha, onchange, 'Alpha: ', 0, 255);

            var xWrapper = numberRange(listeners.xMod, onchange, 'X Range: ', -64, 64);
            var yWrapper = numberRange(listeners.yMod, onchange, 'Y Range: ', -64, 64);

            div.appendChild(redWrapper);
            div.appendChild(greenWrapper);
            div.appendChild(blueWrapper);
            div.appendChild(alphaWrapper);
            div.appendChild(xWrapper);
            div.appendChild(yWrapper);

            return div;

        })(listeners.input);

        var output = (function(listeners) {
            var div = document.createElement('div');
            div.innerHTML = 'Output: ';

            listeners.red = {};
            listeners.green = {};
            listeners.blue = {};
            listeners.alpha = {};

            var redWrapper = numberRange(listeners.red, onchange, 'Red: ', 0, 255);
            var greenWrapper = numberRange(listeners.green, onchange, 'Green: ', 0, 255);
            var blueWrapper = numberRange(listeners.blue, onchange, 'Blue: ', 0, 255);
            var alphaWrapper = numberRange(listeners.alpha, onchange, 'Alpha: ', 0, 255);

            div.appendChild(redWrapper);
            div.appendChild(greenWrapper);
            div.appendChild(blueWrapper);
            div.appendChild(alphaWrapper);

            return div;
        })(listeners.output);

        div.appendChild(input);
        div.appendChild(output);

        return div;
    })();

    var obj = {
        div: menu,
        listeners: listeners,
        source: undefined,
        render: render,
        addSource: addSource,
        removeSource: removeSource,
        surface: null,
        connectors: []
    };

    menu.children[2].appendChild(layerControl(obj));
    div.appendChild(controls);

    obj.connectors.push(plumb.addEndpoint(menu, conn.source));
    obj.connectors.push(plumb.addEndpoint(menu, conn.target, conn.targetMid));

    return obj;
};

},{"../SurfaceFactory":52,"../connectors":53,"../jsPlumbInstance":55,"../menuBuilder":68,"../util/guid":70,"./component/numberInput":59,"./component/numberRangeInput":60}],65:[function(require,module,exports){
var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var text = require('./component/textInput');
var numberRange = require('./component/numberRangeInput');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');

function render(data, size) {
    var args = data.listeners;
    var surf = SurfaceFactory.simplex(data.surface,
        [size, size],
        args.seed.value(),
        [
            args.red.min.value(),
            args.green.min.value(),
            args.blue.min.value(),
            args.alpha.min.value(),
            args.x.min.value(),
            args.y.min.value()
        ],
        [
            args.red.max.value(),
            args.green.max.value(),
            args.blue.max.value(),
            args.alpha.max.value(),
            args.x.max.value(),
            args.y.max.value()
        ]);
    //TODO: remove cache hack
    data.surface = surf;
    return surf;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([350, 240], 'metal');
    menu.children[1].innerHTML = 'Simplex';
    menu.id = guid();
    var div = menu.children[4];

    var listeners = {
        seed: {},
        red: {},
        green: {},
        blue: {},
        alpha: {},
        x: {},
        y: {}
    };

    var controls = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        var seedWrapper = text(listeners.seed, onchange, 'Seed: ', '1');

        var redWrapper = numberRange(listeners.red, onchange, 'Red: ', 0, 255);
        var greenWrapper = numberRange(listeners.green, onchange, 'Green: ', 0, 255);
        var blueWrapper = numberRange(listeners.blue, onchange, 'Blue: ', 0, 255);
        var alphaWrapper = numberRange(listeners.alpha, onchange, 'Alpha: ', 0, 255);
        var xWrapper = numberRange(listeners.x, onchange, 'X: ', -100, 100);
        var yWrapper = numberRange(listeners.y, onchange, 'Y: ', -100, 100);

        div.appendChild(seedWrapper);
        div.appendChild(redWrapper);
        div.appendChild(greenWrapper);
        div.appendChild(blueWrapper);
        div.appendChild(alphaWrapper);
        div.appendChild(xWrapper);
        div.appendChild(yWrapper);

        return div;
    })();

    var obj = {
        div: menu,
        listeners: listeners,
        render: render,
        connectors: []
    };

    menu.children[2].appendChild(layerControl(obj));
    div.appendChild(controls);

    obj.connectors.push(plumb.addEndpoint(menu, conn.source));

    return obj;
};

},{"../SurfaceFactory":52,"../connectors":53,"../jsPlumbInstance":55,"../menuBuilder":68,"../util/guid":70,"./component/numberRangeInput":60,"./component/textInput":61}],66:[function(require,module,exports){
var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var text = require('./component/textInput');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');

function render(data, size) {
    var args = data.listeners;
    var surf = SurfaceFactory.solid(data.surface, [size, size], args.color.value());
    //TODO: remove cache hack
    data.surface = surf;
    return surf;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([350, 98], 'metal');
    menu.children[1].innerHTML = 'Solid';
    menu.id = guid();
    var div = menu.children[4];

    var listeners = {
        color: {}
    };

    var controls = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        var colorWrapper = text(listeners.color, onchange, 'Color: ', '#FFF');
        div.appendChild(colorWrapper);

        return div;
    })();

    var out = { div: menu, listeners: listeners, render: render, surface: null, connectors: [] };

    menu.children[2].appendChild(layerControl(out));
    div.appendChild(controls);
    out.connectors.push(plumb.addEndpoint(menu, conn.source));

    return out;
};


},{"../SurfaceFactory":52,"../connectors":53,"../jsPlumbInstance":55,"../menuBuilder":68,"../util/guid":70,"./component/textInput":61}],67:[function(require,module,exports){
var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var text = require('./component/textInput');
var number = require('./component/numberInput');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');

function render(data, size) {
    var args = data.listeners;
    var surf = SurfaceFactory.voronoi(data.surface,
        [size, size], {
            seed: args.seed.value(),
            lineWidth: args.width.value(),
            lineColor: args.color.value(),
            points: args.points.value()
        });

    //TODO: remove cache hack
    data.surface = surf;
    return surf;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([350, 170], 'metal');
    menu.children[1].innerHTML = 'Voronoi';
    menu.id = guid();
    var div = menu.children[4];

    var listeners = {
        seed: {},
        width: {},
        color: {},
        points: {}
    };

    var controls = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        var seedWrapper = text(listeners.seed, onchange, 'Seed: ', '1');
        var widthWrapper = number(listeners.width, onchange, 'Width: ', 1, 1);
        var colorWrapper = text(listeners.color, onchange, 'Color: ', '#000');
        var pointsWrapper = number(listeners.points, onchange, 'Cells: ', 10, 1);

        div.appendChild(seedWrapper);
        div.appendChild(widthWrapper);
        div.appendChild(colorWrapper);
        div.appendChild(pointsWrapper);

        return div;
    })();

    var obj = { div: menu, listeners: listeners, render: render, surface: null, connectors: [] };

    menu.children[2].appendChild(layerControl(obj));
    div.appendChild(controls);

    obj.connectors.push(plumb.addEndpoint(menu, conn.source));

    return obj;
};

},{"../SurfaceFactory":52,"../connectors":53,"../jsPlumbInstance":55,"../menuBuilder":68,"../util/guid":70,"./component/numberInput":59,"./component/textInput":61}],68:[function(require,module,exports){
var plumb = require('./jsPlumbInstance');

function move(menu, binder) {
    var pos = [0, 0];
    var x, y;
    var maxX, maxY;

    function onmousemove(e) {
        e.preventDefault();
        x += e.clientX - pos[0];
        y += e.clientY - pos[1];
        pos[0] = e.clientX;
        pos[1] = e.clientY;

        if(x > 0 && x < maxX)
            menu.style.left = x + 'px';
        else if(x < maxX)
            menu.style.left = '0px';
        else
            menu.style.left = maxX + 'px';

        if(y > 0 && y < maxY)
            menu.style.top = y + 'px';
        else if(y < maxY)
            menu.style.top = '0px';
        else
            menu.style.top = maxY + 'px';

        plumb.repaintEverything(); //TODO: set to this id
    }

    function onmouseup(e) {
        e.preventDefault();
        binder.style.cursor = 'grab';
        document.onmousemove = undefined;
        document.onmouseup = undefined;
    }

    function onmousedown(e) {
        e.preventDefault();

        x = menu.style.left;
        y = menu.style.top;
        maxX = menu.parentElement.clientWidth - menu.clientWidth;
        maxY = menu.parentElement.clientHeight - menu.clientHeight;

        x = x.length > 2 ? Number.parseInt(x.slice(0, -2)) : 0;
        y = y.length > 2 ? Number.parseInt(y.slice(0, -2)) : 0;

        binder.style.cursor = 'grabbing';
        document.onmousemove = onmousemove;
        document.onmouseup = onmouseup;
        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }

    return onmousedown;
}

function resize(menu, binder, type) {
    var pos, x, y, width, height, minwidth, minheight, maxwidth, maxheight;

    pos = [0, 0];

    var resizeWidth = type.width !== undefined;
    var resizeHeight = type.height !== undefined;
    var moveX = type.width;
    var moveY = type.height;

    function onmousemove(e) {
        e.preventDefault();
        if(moveX)
            x += e.clientX - pos[0];
        if(moveY)
            y += e.clientY - pos[1];
        if(resizeWidth)
            if(moveX)
                width -= e.clientX - pos[0];
            else
                width += e.clientX - pos[0];
        if(resizeHeight)
            if(moveY)
                height -= e.clientY - pos[1];
            else
                height += e.clientY - pos[1];

        if(x >= 0 && width >= minwidth)
            menu.style.left = x + 'px';
        else if(x < 0)
            menu.style.left = '0px';

        if(y >= 0 && height >= minheight)
            menu.style.top = y + 'px';
        else if(y < 0)
            menu.style.top = '0px';

        //TODO: find out a way to handle x < 0
        if(x >= 0 && width < maxwidth)
            menu.style.width = width + 'px';
        else if(width > maxwidth)
            menu.style.width = maxwidth + 'px';

        //TODO: find way to handle y < 0
        if(y >= 0 && height < maxheight)
            menu.style.height = height + 'px';
        else if(height > maxheight)
            menu.style.height = maxheight + 'px';

        pos[0] = e.clientX;
        pos[1] = e.clientY;

        plumb.repaintEverything(); //TODO: Set to this id
    }

    function onmouseup(e) {
        e.preventDefault();
        document.onmousemove = undefined;
        document.onmouseup = undefined;
    }

    function onmousedown(e) {
        e.preventDefault();

        x = menu.style.left;
        y = menu.style.top;
        width = menu.style.width;
        height = menu.style.height;
        minwidth = menu.style.min-width;
        minheight = menu.style.min-height;
        maxwidth = menu.style.max-width;
        maxheight = menu.style.max-height;

        x = x.length > 2 ? Number.parseInt(x.slice(0, -2)) : 0;
        y = y.length > 2 ? Number.parseInt(y.slice(0, -2)) : 0;
        width = width.length > 2 ? Number.parseInt(width.slice(0, -2)) : 0;
        height = height.length > 2 ? Number.parseInt(height.slice(0, -2)) : 0;
        minwidth = minwidth.length > 2 ? Number.parseInt(minwidth.slice(0, -2)) : 96;
        minheight = minheight.length > 2 ? Number.parseInt(minheight.slice(0, -2)) : 96;
        maxwidth = maxwidth.length > 2 ? Number.parseInt(maxwidth.slice(0, -2)) : menu.parentElement.clientWidth;
        maxheight = maxheight.length > 2 ? Number.parseInt(maxheight.slice(0, -2)) : menu.parentElement.clientHeight;

        document.onmousemove = onmousemove;
        document.onmouseup = onmouseup;
        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }

    return onmousedown;
}

module.exports = function menu() {
    var width = 0;
    var height = 0;
    var style;

    var newMenu = document.getElementById('menu-template').cloneNode(true);

    if(arguments.length === 2) {
        if(arguments[0] instanceof Array && arguments[0].length === 2) {
            width = arguments[0][0];
            height = arguments[0][1];
            style = arguments[1];
        }
        else {
            width = arguments[0];
            height = arguments[1];
        }
    }
    else if(arguments.length === 1) {
        if(arguments[0] instanceof Array && arguments[0].length > 1) {
            width = arguments[0][0];
            height = arguments[0][1];
        }
        else {
            style = arguments[0];
        }
    }
    else {
        throw new Error('improper arguments for menu');
    }

    if(width && height) {
        newMenu.style.width = width + 'px';
        newMenu.style.height = height + 'px';
    }

    if(style)
        newMenu.classList.add(style);

    newMenu.children[0].onmousedown = resize(newMenu, newMenu.children[0], { width: true, height: true });
    newMenu.children[1].onmousedown = move(newMenu, newMenu.children[1]);
    newMenu.children[2].onmousedown = resize(newMenu, newMenu.children[2], { width: false, height: true });
    newMenu.children[3].onmousedown = resize(newMenu, newMenu.children[3], { width: true });
    newMenu.children[5].onmousedown = resize(newMenu, newMenu.children[5], { width: false });
    newMenu.children[6].onmousedown = resize(newMenu, newMenu.children[6], { width: true, height: false });
    newMenu.children[7].onmousedown = resize(newMenu, newMenu.children[7], { height: false });
    newMenu.children[8].onmousedown = resize(newMenu, newMenu.children[8], { width: false, height: false });

    return newMenu;
};

},{"./jsPlumbInstance":55}],69:[function(require,module,exports){
module.exports = [];
},{}],70:[function(require,module,exports){
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

module.exports = function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

},{}]},{},[52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,1]);
