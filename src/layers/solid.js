var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var text = require('./component/textInput');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');

function render(data) {
    var args = data.listeners;
    var surf = SurfaceFactory.solid(data.surface, [64, 64], args.color.value());
    //TODO: remove cache hack
    data.surface = surf;
    return surf;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([350, 110], 'metal');
    menu.id = guid();
    var div = menu.children[4];
    div.innerHTML = 'Solid';

    var listeners = {
        color: {}
    };

    var colorWrapper = text(listeners.color, onchange, 'Color: ', '#FFF');

    var out = { div: menu, listeners: listeners, render: render, surface: null };

    menu.children[2].appendChild(layerControl(out));
    div.appendChild(colorWrapper);

    plumb.addEndpoint(menu, conn.source);

    return out;
};

