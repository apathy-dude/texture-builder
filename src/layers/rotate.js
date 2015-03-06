var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
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

function render(data, size) {
    if(!data.source)
        data.surface = SurfaceFactory.solid(data.surface, [size, size]);
    else {
        var source = data.source.render(data.source, size).clone();
        data.surface = SurfaceFactory.solid(data.surface, [size * 3, size * 3]);
        data.surface.blit(source, [-size, -size]);
        data.surface.blit(source, [-size, 0]);
        data.surface.blit(source, [-size, size]);
        data.surface.blit(source, [0, -size]);
        data.surface.blit(source, [0, 0]);
        data.surface.blit(source, [0, size]);
        data.surface.blit(source, [size, -size]);
        data.surface.blit(source, [size, 0]);
        data.surface.blit(source, [size, size]);
        source = data.surface.rotate(data.listeners.angle.value());
        data.surface = SurfaceFactory.solid(data.surface, [size, size]);
        data.surface.blit(source, [0, 0], [size, size, size, size]);
    }

    return data.surface;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([350, 193], 'metal');
    menu.children[1].innerHTML = 'Rotate';
    menu.id = guid();
    var div = menu.children[4];

    var listeners = {
        angle: {}
    };

    var controls = (function() {
        var div = document.createElement('div');
        div.className = 'controls';

        var angleWrapper = number(listeners.angle, onchange, 'Angle: ', 0, 0, 359);

        div.appendChild(angleWrapper);

        return div;
    })();

    var obj = {
        div: menu,
        listeners: listeners,
        render: render,
        source: undefined,
        addSource: addSource,
        removeSource: removeSource,
        surface: null
    };

    menu.children[2].appendChild(layerControl(obj));
    div.appendChild(controls);

    plumb.addEndpoint(menu, conn.target, conn.targetMid);
    plumb.addEndpoint(menu, conn.source);

    return obj;
};
