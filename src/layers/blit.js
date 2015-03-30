var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
var plumb = require('../jsPlumbInstance');
var conn = require('../connectors');
var guid = require('../util/guid');
var surface;

function addSource(data, source, target, connId) {
    if(target === data.topId) {
        data.topInput = source;
        data.topIn = connId;
    }
    else if(target === data.botId) {
        data.bottomInput = source;
        data.botIn = connId;
    }
}

function removeSource(data, connId) {
    if(connId === data.topIn) {
        data.topInput = undefined;
        data.topIn = undefined;
    }
    else if(connId === data.botIn) {
        data.bottomInput = undefined;
        data.botIn = undefined;
    }
}

function render(data, size) {
    if(!data.topInput && !data.bottomInput)
        data.surface = SurfaceFactory.solid(data.surface, [64, 64]);
    else if(!data.topInput)
        data.surface = data.bottomInput.render(data.bottomInput, size);
    else if(!data.bottomInput)
        data.surface = data.topInput.render(data.topInput, size);
    else {
        data.surface = data.topInput.render(data.topInput, size).clone();
        data.surface.blit(data.bottomInput.render(data.bottomInput, size));
    }

    return data.surface;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([110, 120], 'metal');
    menu.setTitle('Blit');
    menu.id = guid();
    var div = menu.content;

    var listeners = {};

    var obj = {
        div: menu,
        listeners: listeners,
        render: render,
        topInput: undefined,
        bottomInput: undefined,
        addSource: addSource,
        removeSource: removeSource,
        topId: undefined,
        botId: undefined,
        topIn: undefined,
        botIn: undefined,
        surface: null,
        connectors: []
    };

    div.appendChild(layerControl(obj));

    var endConn = plumb.addEndpoint(menu, conn.source);
    var topId = plumb.addEndpoint(menu, conn.target, conn.targetTop);
    var botId = plumb.addEndpoint(menu, conn.target, conn.targetBottom);

    obj.connectors.push(endConn);
    obj.connectors.push(topId);
    obj.connectors.push(botId);

    obj.topId = topId.id;
    obj.botId = botId.id;

    return obj;
};
