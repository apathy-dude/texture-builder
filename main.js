var gamejs = require('gamejs');
var menuBuilder = require('./src/menuBuilder');
var plumb = require('./src/jsPlumbInstance');
var conn = require('./src/connectors');

var layerControl = require('./src/layers/component/control');

var layerOptions = require('./src/layers');

//Preload image and sound assets
gamejs.preload(require('./src/images'));

var BORDER_WIDTH = 1;

var wrapper;
var surface;

var anch = false;
var ready = false;

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
    var menu = menuBuilder([328, 110], 'metal');
    menu.children[1].innerHTML = 'Output';
    var menuCenter = menu.children[4];
    menu.id = OUTPUT_ID;

    var layerDiv = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

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
                    var lay = t.layer(onchange, layerControl(layers, onchange));
                    layers[lay.div.id] = lay;

                    wrapper.appendChild(lay.div);
                    plumb.repaintEverything(); //TODO: find way to only update source
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

    menuCenter.appendChild(layerDiv);

    function render(data) {
        if(surface)
            surface.clear();

        if(obj.inputLayer) {
            var surf = data.inputLayer.render(obj.inputLayer);
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

    var obj = { div: menu, listeners: {}, inputLayer: undefined, render: render, addSource: addSource, removeSource: removeSource };

    return obj;
}

function renderSurface(layers) {
    var size = 64;

    if(!layers || !layers[OUTPUT_ID])
        return false;

    return layers[OUTPUT_ID].render(layers[OUTPUT_ID]);
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
        plumb.addEndpoint(OUTPUT_ID, conn.target, conn.targetMid);

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

    ready = true;
});

gamejs.onTick(function() {
    if(!surface)
        surface = renderSurface(surface, layers);

    if(!wrapper)
        wrapper = document.getElementById('gjs-canvas-wrapper');

    render(surface);
});
