var text = require('./component/textInput');
var numberRange = require('./component/numberRangeInput');
var SurfaceFactory = require('../SurfaceFactory');

function render(data) {
    var args = data.listeners;
    var surf = SurfaceFactory.noise(data.surface,
        [64, 64],
        args.seed.value(),
        [
            args.red.min.value(),
            args.green.min.value(),
            args.blue.min.value(),
            args.alpha.min.value()
        ],
        [
            args.red.max.value(),
            args.green.max.value(),
            args.blue.max.value(),
            args.alpha.max.value(),
        ]);
    //TODO: remove cache hack
    data.surface = surf;
    return surf;
}

module.exports = function(onchange, layerControl) {
    var div = document.createElement('div');
    div.className = 'control';
    div.innerHTML = 'Noise';

    var listeners = {
        seed: {},
        red: {},
        green: {},
        blue: {},
        alpha: {}
    };

    var seedWrapper = text(listeners.seed, onchange, 'Seed: ', '1');

    var redWrapper = numberRange(listeners.red, onchange, 'Red: ', 0, 255);
    var greenWrapper = numberRange(listeners.green, onchange, 'Green: ', 0, 255);
    var blueWrapper = numberRange(listeners.blue, onchange, 'Blue: ', 0, 255);
    var alphaWrapper = numberRange(listeners.alpha, onchange, 'Alpha: ', 0, 255);

    var obj = { div: div, listeners: listeners, render: render };

    div.appendChild(layerControl(obj));
    div.appendChild(seedWrapper);
    div.appendChild(redWrapper);
    div.appendChild(greenWrapper);
    div.appendChild(blueWrapper);
    div.appendChild(alphaWrapper);

    return obj;
};
