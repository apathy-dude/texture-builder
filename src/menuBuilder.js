function move(menu, binder) {
    var pos = [0, 0];
    var x, y;
    var maxX, maxY;

    function onmousemove(e) {
        e.preventDefault();
        x += e.clientX - pos[0];
        y += e.clientY - pos[1];
        pos[0] = e.clientX;
        pos[1] = e.clientY;

        if(x > 0 && x < maxX)
            menu.style.left = x + 'px';
        else if(x < maxX)
            menu.style.left = '0px';
        else
            menu.style.left = maxX + 'px';

        if(y > 0 && y < maxY)
            menu.style.top = y + 'px';
        else if(y < maxY)
            menu.style.top = '0px';
        else
            menu.style.top = maxY + 'px';
    }

    function onmouseup(e) {
        e.preventDefault();
        binder.style.cursor = 'grab';
        document.onmousemove = undefined;
        document.onmouseup = undefined;
    }

    function onmousedown(e) {
        e.preventDefault();

        x = menu.style.left;
        y = menu.style.top;
        maxX = menu.parentElement.clientWidth - menu.clientWidth;
        maxY = menu.parentElement.clientHeight - menu.clientHeight;

        x = x.length > 2 ? Number.parseInt(x.slice(0, -2)) : 0;
        y = y.length > 2 ? Number.parseInt(y.slice(0, -2)) : 0;

        binder.style.cursor = 'grabbing';
        document.onmousemove = onmousemove;
        document.onmouseup = onmouseup;
        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }

    return onmousedown;
}

function resize(menu, binder, type) {
    var pos, x, y, width, height, minwidth, minheight, maxwidth, maxheight;

    pos = [0, 0];

    var resizeWidth = type.width !== undefined;
    var resizeHeight = type.height !== undefined;
    var moveX = type.width;
    var moveY = type.height;

    function onmousemove(e) {
        e.preventDefault();
        if(moveX)
            x += e.clientX - pos[0];
        if(moveY)
            y += e.clientY - pos[1];
        if(resizeWidth)
            if(moveX)
                width -= e.clientX - pos[0];
            else
                width += e.clientX - pos[0];
        if(resizeHeight)
            if(moveY)
                height -= e.clientY - pos[1];
            else
                height += e.clientY - pos[1];

        if(x >= 0 && width >= minwidth)
            menu.style.left = x + 'px';
        else if(x < 0)
            menu.style.left = '0px';

        if(y >= 0 && height >= minheight)
            menu.style.top = y + 'px';
        else if(y < 0)
            menu.style.top = '0px';

        //TODO: find out a way to handle x < 0
        if(x >= 0 && width < maxwidth)
            menu.style.width = width + 'px';
        else if(width > maxwidth)
            menu.style.width = maxwidth + 'px';

        //TODO: find way to handle y < 0
        if(y >= 0 && height < maxheight)
            menu.style.height = height + 'px';
        else if(height > maxheight)
            menu.style.height = maxheight + 'px';

        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }

    function onmouseup(e) {
        e.preventDefault();
        document.onmousemove = undefined;
        document.onmouseup = undefined;
    }

    function onmousedown(e) {
        e.preventDefault();

        x = menu.style.left;
        y = menu.style.top;
        width = menu.style.width;
        height = menu.style.height;
        minwidth = menu.style.min-width;
        minheight = menu.style.min-height;
        maxwidth = menu.style.max-width;
        maxheight = menu.style.max-height;

        x = x.length > 2 ? Number.parseInt(x.slice(0, -2)) : 0;
        y = y.length > 2 ? Number.parseInt(y.slice(0, -2)) : 0;
        width = width.length > 2 ? Number.parseInt(width.slice(0, -2)) : 0;
        height = height.length > 2 ? Number.parseInt(height.slice(0, -2)) : 0;
        minwidth = minwidth.length > 2 ? Number.parseInt(minwidth.slice(0, -2)) : 96;
        minheight = minheight.length > 2 ? Number.parseInt(minheight.slice(0, -2)) : 96;
        maxwidth = maxwidth.length > 2 ? Number.parseInt(maxwidth.slice(0, -2)) : menu.parentElement.clientWidth;
        maxheight = maxheight.length > 2 ? Number.parseInt(maxheight.slice(0, -2)) : menu.parentElement.clientHeight;

        document.onmousemove = onmousemove;
        document.onmouseup = onmouseup;
        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }

    return onmousedown;
}

module.exports = function menu() {
    var width = 0;
    var height = 0;
    var style;

    var newMenu = document.getElementById('menu-template').cloneNode(true);

    if(arguments.length === 2) {
        if(arguments[0] instanceof Array && arguments[0].length === 2) {
            width = arguments[0][0];
            height = arguments[0][1];
            style = arguments[1];
        }
        else {
            width = arguments[0];
            height = arguments[1];
        }
    }
    else if(arguments.length === 1) {
        if(arguments[0] instanceof Array && arguments[0].length > 1) {
            width = arguments[0][0];
            height = arguments[0][1];
        }
        else {
            style = arguments[0];
        }
    }
    else {
        throw new Error('improper arguments for menu');
    }

    if(width && height) {
        newMenu.style.width = width + 'px';
        newMenu.style.height = height + 'px';
    }

    if(style)
        newMenu.classList.add(style);

    newMenu.children[0].onmousedown = resize(newMenu, newMenu.children[0], { width: true, height: true });
    newMenu.children[1].onmousedown = move(newMenu, newMenu.children[1]);
    newMenu.children[2].onmousedown = resize(newMenu, newMenu.children[2], { width: false, height: true });
    newMenu.children[3].onmousedown = resize(newMenu, newMenu.children[3], { width: true });
    newMenu.children[5].onmousedown = resize(newMenu, newMenu.children[5], { width: false });
    newMenu.children[6].onmousedown = resize(newMenu, newMenu.children[6], { width: true, height: false });
    newMenu.children[7].onmousedown = resize(newMenu, newMenu.children[7], { height: false });
    newMenu.children[8].onmousedown = resize(newMenu, newMenu.children[8], { width: false, height: false });

    return newMenu;
};
