module.exports = function(listeners, onchange, label, def, min, max) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = label;

    var number = (function(listeners) {
        var num = document.createElement('input');
        num.type = 'number';
        num.value = def;
        num.onchange = onchange;

        listeners.value = function() {
            return Number.parseInt(num.value);
        };

        if(min || max || min === 0 || max === 0) {
            listeners.handle = function() {
                var val = Number.parseInt(num.value);
                if(min || min === 0)
                    if(val < min)
                        num.value = min;

                if(max || max === 0)
                    if (val > max)
                        num.value = max;
            };
        }

        return num;
    })(listeners);

    wrapper.appendChild(number);

    return wrapper;
};
