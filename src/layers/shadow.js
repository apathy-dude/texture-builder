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
        surface: null
    };

    menu.children[2].appendChild(layerControl(obj));
    div.appendChild(controls);

    plumb.addEndpoint(menu, conn.source);
    plumb.addEndpoint(menu, conn.target, conn.targetMid);

    return obj;
};
