module.exports = function(listeners, onchange, label, def) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = label;
    def = def || '';

    var text = (function(listeners) {
        var text = document.createElement('input');
        text.type = 'text';
        text.value = def;
        text.onchange = onchange;

        listeners.value = function() {
            return text.value;
        };

        return text;
    })(listeners);

    wrapper.appendChild(text);

    return wrapper;
};
