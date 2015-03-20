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
