var gamejs = require('gamejs');
var SurfaceFactory = require('./src/SurfaceFactory');
var menuBuilder = require('./src/menuBuilder');

var solidLayer = require('./src/layers/solid');
var noiseLayer = require('./src/layers/noise');
var voronoiLayer = require('./src/layers/voronoi');
var shadowLayer = require('./src/layers/shadow');

var layerControl = require('./src/layers/control');

//Preload image and sound assets
gamejs.preload(require('./src/images'));

var BORDER_WIDTH = 1;

var wrapper;
var menu;
var menuCanvasContext;
var surface;
var draw = true;
var fetch = true;

var layers = [];

function onchange(e) {
    e.preventDefault();
    function runHandle(listeners) {
        for(var l in listeners) {
            if(listeners[l] instanceof Object && !(listeners[l] instanceof Function)) {
                runHandle(listeners[l]);
            }
            else if(listeners[l] instanceof Function && l === 'handle') {
                listeners[l]();
            }
        }
    }

    for(var l in layers)
        runHandle(layers[l].listeners);

    surface = renderSurface(surface, layers);
}

function buildMenu() {
    var layerOptions = [
        { name: 'Noise', layer: noiseLayer },
        { name: 'Solid', layer: solidLayer },
        { name: 'Voronoi', layer: voronoiLayer }
    ];

    var menu = menuBuilder([700, 522], 'metal');
    var menuCenter = menu.children[4];

    var controlDiv = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        return div;
    })();

    var leftDiv = (function() {
        var div = document.createElement('div');
        div.className = 'leftdiv';

        var menuCanvas = (function() {
            var canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            canvas.className = 'canvas';
            menuCanvasContext = canvas.getContext('2d');
            return canvas;
        })();

        var layerDiv = (function() {
            var div = document.createElement('div');
            div.className = 'controls';
            div.style.width = '100%';
            div.style.display = 'block';
            div.style.padding = '5px';

            var addLayerDiv = (function() {
                var div = document.createElement('div');

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
                    button.style.float = 'right';

                    button.onclick = function(e) {
                        var t = layerOptions[type.value];
                        var lay = t.layer(onchange, layerControl(layers, controlDiv, onchange));
                        layers.push(lay);
                        controlDiv.appendChild(lay.div);
                        onchange(e);
                    };

                    return button;
                })();

                div.appendChild(title);
                div.appendChild(type);
                div.appendChild(add);

                return div;
            })();

            div.appendChild(addLayerDiv);

            return div;
        })();

        div.appendChild(menuCanvas);
        div.appendChild(layerDiv);

        return div;
    })();

    menuCenter.appendChild(leftDiv);
    menuCenter.appendChild(controlDiv);

    return menu;
}

function renderSurface(mainSurface, surfaceArgs) {
    var surfaceLayers = [];
    var size = 64;

    if(!mainSurface)
        mainSurface = new gamejs.graphics.Surface([size, size]);

    mainSurface.clear();

    if(!surfaceArgs || surfaceArgs.length === 0)
        return mainSurface;

    for(var l in layers)
        surfaceLayers.push(surfaceArgs[l].render(surfaceArgs[l], surfaceArgs));

    for(var surf in surfaceLayers)
        mainSurface.blit(surfaceLayers[surf]);

    return mainSurface;
}

function render(surface) {
    menuCanvasContext.putImageData(surface.scale([256, 256]).getImageData(), 0, 0);

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
});

gamejs.onTick(function() {
    if(!menu) {
        menu = buildMenu();
    }

    if(!surface)
        surface = renderSurface(surface, layers);

    if(!wrapper) {
        wrapper = document.getElementById('gjs-canvas-wrapper');
        wrapper.appendChild(menu);
    }

    render(surface);
});
