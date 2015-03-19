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
