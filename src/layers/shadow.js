var layerControl = require('./control');
var SurfaceFactory = require('../SurfaceFactory');

function render(data, layers) {
    var args = data.listeners;
    var size = 64;
    var surf = SurfaceFactory.relative(layers[2].render(layers[2]),
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
    //TODO: remove cache hack
    data.surface = surf;
    return surf;
}

module.exports = function(onchange) {
    var div = document.createElement('div');
    div.className = 'control';
    div.innerHTML = 'Shadow';

    div.appendChild(layerControl());

    return { div: div, listeners: {}, render: render, surface: null };
};
