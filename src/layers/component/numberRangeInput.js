module.exports = function(listeners, onchange, label, minVal, maxVal) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = label;

    listeners.min = {};
    listeners.max = {};

    var min = (function(listeners) {
        var number = document.createElement('input');
        number.type = 'number';
        number.value = minVal;
        number.onchange = onchange;

        listeners.value = function() {
            return Number.parseInt(number.value);
        };

        listeners.handle = function() {
            var val = Number.parseInt(number.value);
            if(val < minVal)
                number.value = minVal;
        };

        return number;
    })(listeners.min);

    var max = (function(listeners) {
        var number = document.createElement('input');
        number.type = 'number';
        number.value = maxVal;
        number.onchange = onchange;

        listeners.value = function() {
            return Number.parseInt(number.value);
        };

        listeners.handle = function() {
            var val = Number.parseInt(number.value);
            if(val > maxVal)
                number.value = maxVal;
        };

        return number;
    })(listeners.max);

    var arrow = (function() {
        var text = document.createElement('span');
        text.innerHTML = '-';

        return text;
    })();

    listeners.handle = function() {
        var minVal = Number.parseInt(min.value);
        var maxVal = Number.parseInt(max.value);
        if(minVal > maxVal)
            min.value = max.value;
    };

    wrapper.appendChild(min);
    wrapper.appendChild(arrow);
    wrapper.appendChild(max);

    return wrapper;
};

