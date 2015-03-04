var plumb = require('../../jsPlumbInstance');

module.exports = function(layers, onchange) {
    return function(layer) {
        var div = document.createElement('div');
        div.className = 'menu-controls';

        var close = (function() {
            var button = document.createElement('input');
            button.input = 'button';
            button.className = 'close';

            button.onclick = function(e) {
                if(layers[layer.div.id]) {
                    delete layers[layer.div.id];
                    plumb.detachAllConnections(layer.div);
                    plumb.remove(layer.div);
                    onchange(e);
                }
            };

            return button;
        })();

        div.appendChild(close);

        return div;
    };
};

