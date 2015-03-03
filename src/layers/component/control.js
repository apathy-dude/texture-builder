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
                    layer.div.parentElement.removeChild(layer.div);
                    onchange(e);
                }
            };

            return button;
        })();

        div.appendChild(close);

        return div;
    };
};

