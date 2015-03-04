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

function render(data) {
    if(!data.topInput && !data.bottomInput)
        data.surface = SurfaceFactory.solid(data.surface, [64, 64]);
    else if(!data.topInput)
        data.surface = data.bottomInput.render(data.bottomInput);
    else if(!data.bottomInput)
        data.surface = data.topInput.render(data.topInput);
    else {
        data.surface = data.topInput.render(data.topInput).clone();
        data.surface.blit(data.bottomInput.render(data.bottomInput));
    }

    return data.surface;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([110, 120], 'metal');
    menu.children[1].innerHTML = 'Blit';
    menu.id = guid();
    var div = menu.children[4];

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
        surface: null
    };

    menu.children[2].appendChild(layerControl(obj));

    plumb.addEndpoint(menu, conn.source);
    var topId = plumb.addEndpoint(menu, conn.target, conn.targetTop);
    var botId = plumb.addEndpoint(menu, conn.target, conn.targetBottom);

    obj.topId = topId.id;
    obj.botId = botId.id;

    return obj;
};
