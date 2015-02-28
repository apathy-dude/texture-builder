module.exports = function(layers, menu, onchange) {
    return function(layer) {
        var div = document.createElement('div');
        div.className = 'menu-controls';

        var close = (function() {
            var button = document.createElement('input');
            button.input = 'button';
            button.className = 'close';

            button.onclick = function(e) {
                var l = layers.indexOf(layer);
                if(l > -1) {
                    layers.splice(l, 1);
                    menu.removeChild(menu.childNodes[l]);
                    onchange(e);
                }
            };

            return button;
        })();

        var up = (function() {
            var button = document.createElement('input');
            button.input = 'button';
            button.className = 'up-arrow';

            button.onclick = function(e) {
                var l = layers.indexOf(layer);
                if(l > 0) {
                    var tempLayer = layers[l-1];
                    layers[l-1] = layers[l];
                    layers[l] = tempLayer;
                    menu.insertBefore(menu.childNodes[l], menu.childNodes[l-1]);
                    onchange(e);
                }
            };

            return button;
        })();

        var down = (function() {
            var button = document.createElement('input');
            button.input = 'button';
            button.className = 'down-arrow';

            button.onclick = function(e) {
                var l = layers.indexOf(layer);
                if(l > -1 && l < layers.length - 1) {
                    var tempLayer = layers[l];
                    layers[l] = layers[l+1];
                    layers[l+1] = tempLayer;
                    menu.insertBefore(menu.childNodes[l+1], menu.childNodes[l]);
                    onchange(e);
                }
            };

            return button;
        })();

        div.appendChild(close);
        div.appendChild(up);
        div.appendChild(down);

        return div;
    };
};

