// this function runs when the window loads
//and keeps variable out of the global scope.
// I don't love having all of these variable scoped to the window, either, though.

window.onload = function(){
    //notice how the divs are lets and not consts, we'll have to change their contents later
    const view = document.getElementById('content');
    const timeConstant = 125; // ms
    let ticker, timestamp, frame, xform;
    let left = document.getElementById('1');
    let center = document.getElementById('2');
    let right = document.getElementById('3');
    let images = []; 
    let imgCount = 9;
    let index = 0;
    let offset = 0;
    let pressed = false;
    let snap = window.innerWidth;
   

//going to declare the functions first and call functions after all function declarations
//so if you want to the function evaluations, go down to the bottom

//gets called first, obv
    function initialize() {
        let i, stash, el;
        //set all of the image element widths to the window size
        left.setAttribute('width', snap + 'px');
        center.setAttribute('width', snap + 'px');
        right.setAttribute('width', snap + 'px');

        // Predownloads some images and stash them in a hidden div.
        stash = document.getElementById('stash');
        //my images are all named with numbers fortunately
        for (i = 0; i < imgCount; ++i) {
            el = document.createElement('img');
            el.setAttribute('src', 'img-use/' + i + '.jpg');
            stash.appendChild(el);
            //array of image elements
            images.push(el);
        }
    }

    //event listeners -- if touchstart is defined (touchscreen)
    //then use touch events, otherwise, mouse events
    function setupEvents() {
        if (typeof window.ontouchstart !== 'undefined') {
            view.addEventListener('touchstart', tap);
            view.addEventListener('touchmove', drag);
            view.addEventListener('touchend', release);
        }
        view.addEventListener('mousedown', tap);
        view.addEventListener('mousemove', drag);
        view.addEventListener('mouseup', release);
    }

//get the current touch/mouse x value
    function xpos(e) {
        // touch event
        if (e.targetTouches && (e.targetTouches.length >= 1)) {
            return e.targetTouches[0].clientX;
        }

        // mouse event
        return e.clientX;
    }

    //this gets called in display.  
    //it is used to keep our imageCounter in range of the number of images.
    //let's dissect this line:
  //if index is greater than or equal to imagecount (out of our range), return index-imageCount
  //if LESS than imageCount then if also less than zero (also out of our range) return index+ imageCount
  //otherwise, just return index
  //so if index is 9 we get ....0.
  //if index is -1 we get...9.  otherwise, we get index.  i didn't come up with this, but it's nice.
    function wrap(index) {
        return (index >= imgCount) ? (index - imgCount) : (index < 0) ? index + imgCount : index;
    }

    //ok, the render function. i is a number from 1 to 9 that corresponds to
    //an image.  this is the number we pass into the wrap function above.
    //we call this function with value zero when the window loads and then
    // we call it with the number of the image either to the left or right of the current image,
    //depending on which way the mouse is moving.
    function display(i) {
        var id = center.id;
        
        if (i < index) {
            id = left.id;
            left = document.getElementById(center.id);
        } else if (i > index) {
            id = right.id;
            right = document.getElementById(center.id);
        }
        center = document.getElementById(id);
        index = wrap(i);

        left.setAttribute('src', images[wrap(index - 1)].getAttribute('src'));
        center.setAttribute('src', images[index].getAttribute('src'));
        right.setAttribute('src', images[wrap(index + 1)].getAttribute('src'));
        scroll(0);
        left.setAttribute('class', 'leftcard');
        center.setAttribute('class', 'centercard');
        right.setAttribute('class', 'rightcard');
    }

    function scroll(x) {
        var slow, fast;
        //super important, here: offset is current x
        offset = x;
        //our slow transform is going to ease the center image in to place more slowly
        //play with the value we're dividing offset by to see it in action.
        slow = -Math.round(offset / 2);
        fast = -Math.round(offset);

        //xform is an array that enhances cross browser compatibility, see below
        //otherwise this should be recognizable as the css transform: translate3d()
        left.style[xform] = 'translate3d(' + (fast - snap) + 'px, 0, 0)';
        center.style[xform] = 'translate3d(' + slow + 'px, 0, 0)';
        right.style[xform] = 'translate3d(' + (fast + snap) + 'px, 0, 0)';
    }

    //this is our easing function, velocity slows down as we get closer to our destination
    function track() {
        let now, elapsed, delta, v;
        //current time
        now = Date.now();
        //time since the last timestamp
        elapsed = now - timestamp;
        //reset timestamp
        timestamp = now;

        delta = offset - frame;
        frame = offset;
        //v is equal to 
        v = 1000 * delta / (1 + elapsed);
        
        velocity = 0.8 * v + 0.2 * velocity;
    }

    function autoScroll() {
        var elapsed, delta;

        if (amplitude) {
            elapsed = Date.now() - timestamp;
            delta = amplitude * Math.exp(-elapsed / timeConstant);
            if (delta > 10 || delta < -10) {
                scroll(target - delta);
                requestAnimationFrame(autoScroll);
            } else {
                display(index + target / snap);
            }
        }
    }

    //called on touch or press - sets timestamp and invokes track()
    //which runs every .1s and keeps track of elapse time
    function tap(e) {
        pressed = true;
        //get mouse/finger position
        reference = xpos(e);
        //reset velocity and amplitude to 0 
        velocity = amplitude = 0;

        frame = offset;
        timestamp = Date.now();
        clearInterval(ticker);
        ticker = setInterval(track, 100);

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function drag(e) {
        var x, delta;
        if (pressed) {
            x = xpos(e);
            delta = reference - x;
            if (delta > 2 || delta < -2) {
                reference = x;
                scroll(offset + delta);
            }
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function release(e) {
        pressed = false;

        clearInterval(ticker);
        target = offset;
        if (velocity > 10 || velocity < -10) {
            amplitude = 1.2 * velocity;
            target = offset + amplitude;
        }
        target = Math.round(target / snap) * snap;
        target = (target < -snap) ? -snap : (target > snap) ? snap : target;
        amplitude = target - offset;
        timestamp = Date.now();
        requestAnimationFrame(autoScroll);

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    xform = 'transform';
    ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
        var e = prefix + 'Transform';
        if (typeof document.body.style[e] !== 'undefined') {
            xform = e;
            return false;
        }
        return true;
    });

    initialize();
    setupEvents();
    display(0);
}