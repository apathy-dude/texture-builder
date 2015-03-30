var plumb = require('./jsPlumbInstance');

module.exports = function menu() {
    var width = 0;
    var height = 0;
    var style;

    var newMenu = document.getElementById('menu-template').cloneNode(true);

    newMenu.setTitle = function(title) {
        newMenu.children[1].innerHTML = title;
    };

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

/*
    newMenu.children[0].onmousedown = resize(newMenu, newMenu.children[0], { width: true, height: true });
    newMenu.children[1].onmousedown = move(newMenu, newMenu.children[1]);
    newMenu.children[2].onmousedown = resize(newMenu, newMenu.children[2], { width: false, height: true });
    newMenu.children[3].onmousedown = resize(newMenu, newMenu.children[3], { width: true });
    newMenu.children[5].onmousedown = resize(newMenu, newMenu.children[5], { width: false });
    newMenu.children[6].onmousedown = resize(newMenu, newMenu.children[6], { width: true, height: false });
    newMenu.children[7].onmousedown = resize(newMenu, newMenu.children[7], { height: false });
    newMenu.children[8].onmousedown = resize(newMenu, newMenu.children[8], { width: false, height: false });
*/
    
    plumb.draggable(newMenu);

    newMenu.content = newMenu.children[newMenu.children.length - 1];
    
    return newMenu;
};
