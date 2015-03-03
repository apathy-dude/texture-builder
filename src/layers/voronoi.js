var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var text = require('./component/textInput');
var number = require('./component/numberInput');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');

function render(data) {
    var args = data.listeners;
    var surf = SurfaceFactory.voronoi(data.surface,
        [64, 64], {
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
    var menu = menuBuilder([350, 175], 'metal');
    menu.id = guid();
    var div = menu.children[4];
    div.innerHTML = 'Voronoi';

    var listeners = {
        seed: {},
        width: {},
        color: {},
        points: {}
    };

    var seedWrapper = text(listeners.seed, onchange, 'Seed: ', '1');

    var widthWrapper = number(listeners.width, onchange, 'Width: ', 1, 1);

    var colorWrapper = text(listeners.color, onchange, 'Color: ', '#000');

    var pointsWrapper = number(listeners.points, onchange, 'Cells: ', 10, 1);

    var obj = { div: menu, listeners: listeners, render: render, surface: null };

    menu.children[2].appendChild(layerControl(obj));
    div.appendChild(seedWrapper);
    div.appendChild(widthWrapper);
    div.appendChild(colorWrapper);
    div.appendChild(pointsWrapper);

    plumb.addEndpoint(menu, conn.source);

    return obj;
};
