var text = require('./component/textInput');
var number = require('./component/numberInput');
var SurfaceFactory = require('../SurfaceFactory');

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
    var div = document.createElement('div');
    div.className = 'control';
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

    var obj = { div: div, listeners: listeners, render: render, surface: null };

    div.appendChild(layerControl(obj));
    div.appendChild(seedWrapper);
    div.appendChild(widthWrapper);
    div.appendChild(colorWrapper);
    div.appendChild(pointsWrapper);

    return obj;
};
