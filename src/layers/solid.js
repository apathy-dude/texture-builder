var SurfaceFactory = require('../SurfaceFactory');
var text = require('./component/textInput');
function render(data) {
    var args = data.listeners;
    var surf = SurfaceFactory.solid(data.surface, [64, 64], args.color.value());
    //TODO: remove cache hack
    data.surface = surf;
    return surf;
}

module.exports = function(onchange, layerControl) {
    var div = document.createElement('div');
    div.className = 'control';
    div.innerHTML = 'Solid';

    var listeners = {
        color: {}
    };

    var colorWrapper = text(listeners.color, onchange, 'Color: ', '#FFF');

    var out = { div: div, listeners: listeners, render: render, surface: null };

    div.appendChild(layerControl(out));
    div.appendChild(colorWrapper);

    return out;
};

