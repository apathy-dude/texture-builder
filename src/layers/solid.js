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
    var menu = menuBuilder([290, 96], 'metal');
    menu.setTitle('Solid');
    menu.id = guid();
    var div = menu.content;

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

    div.appendChild(layerControl(out));
    div.appendChild(controls);
    out.connectors.push(plumb.addEndpoint(menu, conn.source));

    return out;
};

