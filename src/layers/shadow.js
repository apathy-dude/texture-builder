var SurfaceFactory = require('../SurfaceFactory');
var menuBuilder = require('../menuBuilder');
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
    else 
    {
        var surf = SurfaceFactory.relative(data.source.render(data.source, size),
            function color(xPos, yPos, sourceInfo, data) {
                var pixel = sourceInfo.get(xPos, yPos);
                pixel[3] += (12 - data.dist) * 3;

                if(data.y < 0) {
                    pixel[0] = 160;
                    pixel[1] = 160;
                    pixel[2] = 160;
                }

                return pixel;
            },
            function callback(xPos, yPos, sourceInfo) {
                var shadowLength = 8;

                if(sourceInfo.get(xPos, yPos)[3] > 0)
                    return false;

                var d;
                for(var sL = 1; sL < shadowLength; sL++) {
                    for(var yMulti = -1; yMulti < 2; yMulti++) {
                        if(yMulti === 0)
                            continue;

                        var yp = yPos + sL * yMulti;
                        var xp = xPos + sL * 0;

                        if(yp > size)
                            yp -= size;
                        else if(yp < 0)
                            yp += size;

                        d = sourceInfo.get(xp, yp);
                        if(d[3] > 0)
                            return { dist: sL, y: yMulti };
                    }
                }

                return false;
            });
        data.surface = surf;
    }

    return data.surface;
}

module.exports = function(onchange, layerControl) {
    var menu = menuBuilder([140, 120], 'metal');
    menu.children[1].innerHTML = 'Shadow';
    menu.id = guid();
    var div = document.createElement('div');

    div.appendChild(layerControl());

    var obj = {
        div: menu,
        listeners: {},
        source: undefined,
        render: render,
        addSource: addSource,
        removeSource: removeSource,
        surface: null
    };

    menu.children[2].appendChild(layerControl(obj));

    plumb.addEndpoint(menu, conn.source);
    plumb.addEndpoint(menu, conn.target, conn.targetMid);

    return obj;
};
