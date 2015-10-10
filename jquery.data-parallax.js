;(function($) {
    'use strict';

    var $window = $(window),
        $elements = null,
        elementsArr,
        animationsArr,
        scrollTop,
        windowHeight = $window.height(),
        windowWidth = $window.width(),
        scrollTicking = false,
        resizeTicking = false,
        isTouchDevice = window.Modernizr && typeof(Modernizr.touchevents) != 'undefined' ? Modernizr.touchevents : testTouchEvents();

    function testTouchEvents() {
        return 'ontouchstart' in window // works on most browsers
            || 'onmsgesturechange' in window; // works on ie10
    }

    $.fn.parallax = function(method) {
        switch (method) {
            case 'reset':
                this.css('transform', '');
                break;
            case 'destroy':
                $elements.not(this);
                break;
            default:
                if (!isTouchDevice) {
                    this.data("parallax-js", method);
                    animationsArr = [];
                    this.each(updateAnimationsArray);
                    if ($elements === null) {
                        $elements = this;
                        window.onresize = onResize;
                        window.onscroll = onScroll;
                        //setInterval(onScroll, 10);
                    }
                    else {
                        $elements.add(this);
                    }
                    elementsArr = $elements.toArray();
                }
        }
        return this;
    };

    function parseOptions() {
        var optionsArr = [],
            dataOptions = this.data("parallax"),
            jsOptions = this.data("parallax-js");
        typeof dataOptions != "undefined" || (dataOptions = {});
        typeof dataOptions == "object" || console.error("Unable to parse data-parallax attribute");
        typeof jsOptions != "undefined" || (jsOptions = {});
        typeof jsOptions == "object" || console.error("Unrecognized options passed to $.fn.parallax");
        if (!Array.isArray(dataOptions)) {
            dataOptions = [dataOptions];
        }
        if (!Array.isArray(jsOptions)) {
            jsOptions = [jsOptions];
        }
        for (var i= 0, len = Math.max(dataOptions.length, jsOptions.length); i<len; i++) {
            var options = $.extend(dataOptions[i] || {}, jsOptions[i] || {});
            typeof options.start == "undefined" || (options.start = convertToElement(options.start));
            typeof options.start != "undefined" || (options.start = this[0]);
            typeof options.trigger != "undefined" || (options.trigger = "100%");
            optionsArr.push(options);
        }
        return optionsArr;
    }

    function updateAnimationsArray(idx) {
        var $this = $(this),
            animations = [],
            optionsArr = parseOptions.call($this);
        for (var i= 0, len = optionsArr.length; i<len; i++) {
            var options = optionsArr[i],
                globalOptions = {
                    axis: options.axis,
                    start: options.start,
                    trigger: options.trigger,
                    duration: options.duration
                },
                animation = {},
                transformOptions = {};
            if (typeof options.x != "undefined") {
                transformOptions.x = mergeOptions(options.x, globalOptions);
            }
            if (typeof options.y != "undefined") {
                transformOptions.y = mergeOptions(options.y, globalOptions);
            }
            if (typeof options.z != "undefined") {
                transformOptions.z = mergeOptions(options.z, globalOptions);
            }
            if (typeof options.scale != "undefined") {
                transformOptions.scale = mergeOptions(options.scale, globalOptions);
            }
            if (typeof options.rotate != "undefined") {
                transformOptions.rotate = mergeOptions(options.rotate, globalOptions);
            }
            if (transformOptions.x || transformOptions.y || transformOptions.z || transformOptions.scale || transformOptions.rotate) {
                animation.transform = new TransformContainer($this, transformOptions);
            }

            if (typeof options.opacity != "undefined") {
                var opacityOptions = mergeOptions(options.opacity, globalOptions);
                animation.opacity = new StyleScene($this, opacityOptions, 'opacity', 1);
            }
            if (typeof options.color != "undefined") {
                var colorOptions = mergeOptions(options.color, globalOptions);
                animation.color = new ColorScene($this, colorOptions, 'color', 0xffffff);
            }
            if (typeof options.backgroundColor != "undefined") {
                var bgColorOptions = mergeOptions(options.backgroundColor, globalOptions);
                animation.bgColor = new ColorScene($this, bgColorOptions, 'backgroundColor', 0xffffff);
            }
            if (typeof options.pin != "undefined") {
                var pinOptions = mergeOptions(options.pin, globalOptions);
                animation.pin = new PinScene($this, pinOptions);
            }
            animations.push(animation);
        }
        animationsArr[idx] = animations;
    }

    function onResize() {
        if (!resizeTicking) {
            window.requestAnimationFrame(function() {
                windowHeight = $window.height();
                windowWidth = $window.width();
                $elements.each(updateAnimationsArray);
            });
            resizeTicking = true;
        }
    }

    function onScroll() {
        if (!scrollTicking) {
            window.requestAnimationFrame(animateElements);
            scrollTicking = true;
        }
    }

    function animateElements() {
        scrollTop = window.scrollY;
        for (var i= 0, len=elementsArr.length; i<len; i++) {
            animateElement.call(elementsArr[i], i);
        }
        scrollTicking = false;
    }

    function animateElement(idx) {
        var animations = animationsArr[idx],
            animation,
            style;
        typeof window.getComputedStyle != "function" || (style = getComputedStyle(this));
        for (var i=0, len=animations.length; i<len; i++) {
            animation = animations[i];
            if (animation.transform) {
                animation.transform.update(style);
            }
            if (animation.color && animation.color.needsUpdate()) {
                animation.color.update(style);
            }
            if (animation.bgColor && animation.bgColor.needsUpdate()) {
                animation.bgColor.update(style);
            }
            if (animation.opacity && animation.opacity.needsUpdate()) {
                animation.opacity.update(style);
            }
            if (animation.pin && animation.pin.needsUpdate()) {
                animation.pin.update(style);
            }
        }
    }

    function mergeOptions(options, globalOptions) {
        if (typeof options != "object") {
            options = {to: options};
        }
        return $.extend({}, globalOptions, options);
    }

    function getOffset(value, axis) {
        if (isElement(value)) {
            var offset = 0;
            do {
                offset += value[axis === 'x' ? 'offsetLeft' : 'offsetTop'];
            } while (value = value.offsetParent);
            return offset;
        }
        return value;
    }

    function isElement(obj) {
        try {
            return obj instanceof HTMLElement;
        }
        catch(e) {
            return (typeof obj === "object") && (obj.nodeType === 1) &&
                (typeof obj.style === "object") && (typeof obj.ownerDocument ==="object");
        }
    }

    function convertToElement(value) {
        if (typeof value === "string") {
            value = $(value);
            if (value.length) {
                return value[0];
            }
            console.error("Invalid parallax start selector: "+value);
        }
        else {
            return value;
        }
    }

    function convertOption(value, maxValue) {
        if (typeof value === "string") {
            var percValue = parseFloat(value) / 100;
            if (value.match(/%/g)) {
                value = percValue * maxValue;
            }
            else {
                var matches = value.match(/v(w|h)/g);
                if (matches) {
                    value = percValue * (matches[0] === 'vw' ? windowWidth : windowHeight);
                }
            }
        }
        else if (typeof value == "function") {
            value = value(maxValue);
        }
        return value;
    }
    
    function interpolate(from, to, progress) {
        return (to - from) * progress + from;
    }

    function Scene($el, options) {
        this.$el = $el;
        this.axis = options.axis;
        this.from = options.from;
        this.to = options.to;
        this.trigger = convertOption(options.trigger, options.axis === 'x' ? windowWidth : windowHeight);
        this.start = convertToElement(options.start) || options.start;
        if (typeof options.ease == "function") {
            this.ease = options.ease;
        }
        else {
            typeof options.ease == "undefined" || (this.ease = $.easing[options.ease]);
            typeof this.ease == "function" || (this.ease = $.easing.linear);
        }

        if (typeof options.duration != "undefined") {
            var maxDuration = options.axis === 'x' ? $el.outerWidth() : $el.outerHeight(),
                durationPx = convertOption(options.duration, maxDuration);
            this.duration = function() {
                return durationPx;
            };
        }
        else {
            var scene = this;
            this.duration = function() {
                return (getOffset(scene.$el[0], options.axis) + scene.$el.outerHeight()) - scene.startPx;
            };
        }
    }
    Scene.STATE_BEFORE = 'before';
    Scene.STATE_DURING = 'during';
    Scene.STATE_AFTER = 'after';
    Scene.prototype = {
        needsUpdate: function() {
            this.updateStart();
            this.updateDuration();
            var prevState = this.state;
            this.updateState();
            return this._needsUpdate(prevState);
        },
        _needsUpdate: function(prevState) {
            return (prevState == Scene.STATE_DURING) || (this.state == Scene.STATE_DURING);
        },
        updateStart: function() {
            this.startPx = Math.max(getOffset(this.start, this.axis) - this.trigger, 0);
        },
        updateDuration: function() {
            this.durationPx = this.duration.call(this);
            if (this.durationPx < 0) {
                console.error("Invalid parallax duration: "+this.durationPx);
            }
        },
        updateState: function() {
            if (scrollTop < this.startPx) {
                this.state = Scene.STATE_BEFORE;
            }
            else if (scrollTop <= (this.startPx + this.durationPx)) {
                this.state = Scene.STATE_DURING;
            }
            else {
                this.state = Scene.STATE_AFTER;
            }
        },
        getProgress: function() {
            if (this.state == Scene.STATE_BEFORE) {
                return 0;
            }
            else if (this.state == Scene.STATE_DURING) {
                var posPx = scrollTop - this.startPx,
                    percent = posPx / this.durationPx,
                    progress = this.ease.call(this, percent);
                return progress;
            }
            else {
                return 1;
            }
        },
        update: function(style) {
            this._setFrom(this._getOldValue(style));
            this._setValue(this._getNewValue(), style);
        },
        _setFrom: function(defaultValue) {
            typeof this.from != "undefined" || (this.from = defaultValue);
        }
    };

    function ScalarScene($el, options, maxValue) {
        options.from = convertOption(options.from, maxValue);
        options.to = convertOption(options.to, maxValue);
        Scene.call(this, $el, options);
    }
    ScalarScene.prototype = $.extend(Object.create(Scene.prototype), {
        _getNewValue: function() {
            return interpolate(this.from, this.to, this.getProgress());
        }
    });
    
    function StyleScene($el, options, styleName, maxValue) {
        this.styleName = styleName;
        ScalarScene.call(this, $el, options, maxValue);
    }
    StyleScene.prototype = $.extend(Object.create(ScalarScene.prototype), {
        _getOldValue: function(style) {
            return parseFloat(style[this.styleName]);
        },
        _setValue: function(newValue) {
            this.$el[0].style[this.styleName] = newValue;
        }
    });
    
    function ColorScene($el, options, styleName, maxValue) {
        StyleScene.call(this, $el, options, styleName, maxValue);
    }
    ColorScene.prototype = $.extend(Object.create(StyleScene.prototype), {
        _getOldValue: function(style) {
            return style[this.styleName];
        },
        _getNewValue: function() {
            var fromColor = RGBColor.fromString(this.from),
                toColor = RGBColor.fromString(this.to);
            fromColor.interpolate(toColor, this.getProgress());
            return fromColor.toString();
        }
    });

    function PinScene($el, options) {
        options.to = convertToElement(options.to) || $el[0];
        Scene.call(this, $el, options);
    }
    PinScene.prototype = $.extend(Object.create(Scene.prototype), {
        _needsUpdate: function(prevState) {
            return prevState != this.state;
        },
        _getOldValue: function(style) {
            var toStyle = getComputedStyle(this.to);
            return {
                position: toStyle.position,
                top: toStyle.top,
                left: toStyle.left
            };
        },
        _getNewValue: function() {
            return this.state == Scene.STATE_DURING ? {
                position: 'fixed',
                top: this.from.top,
                left: this.from.left
            } : this.from;
        },
        _setValue: function(newValue) {
            this.to.style.position = newValue.position;
            this.to.style.top = newValue.top;
            this.to.style.left = newValue.left;
        }
    });
    
    function TransformScene($el, options, propName, maxValue) {
        this.propName = propName;
        ScalarScene.call(this, $el, options, maxValue);
    }
    TransformScene.prototype = $.extend(Object.create(ScalarScene.prototype), {
        _getOldValue: function(transform) {
            return transform.matrix[this.propName]();
        },
        _setValue: function(newValue, transform) {
            transform[this.propName] = newValue;
        }
    });

    function TransformContainer($el, options) {
        this.$el = $el;
        if (options.x) {
            this.x = new TransformScene($el, options.x, 'translateX', windowHeight);
        }
        if (options.y) {
            this.y = new TransformScene($el, options.y, 'translateY', windowHeight);
        }
        if (options.z) {
            this.z = new TransformScene($el, options.z, 'translateZ', windowHeight);
        }
        if (options.scale) {
            this.scale = new TransformScene($el, options.scale, 'scale', 1);
        }
        if (options.rotate) {
            this.rotate = new TransformScene($el, options.rotate, 'rotate', 360);
        }
    }
    TransformContainer.prototype = {
        update: function(style) {
            var transform = new Transform(TransformMatrix.fromStyle(style));
            if (this.x && this.x.needsUpdate()) {
                this.x.update(transform);
            }
            if (this.y && this.y.needsUpdate()) {
                this.y.update(transform);
            }
            if (this.z && this.z.needsUpdate()) {
                this.z.update(transform);
            }
            if (this.scale && this.scale.needsUpdate()) {
                this.scale.update(transform);
            }
            if (this.rotate && this.rotate.needsUpdate()) {
                this.rotate.update(transform);
            }
            if (transform.isSet()) {
                var element = this.$el[0],
                    newValue = transform.toString();
                element.style['-webkit-transform'] = newValue;
                element.style['-moz-transform'] = newValue;
                element.style['-ms-transform'] = newValue;
                element.style['-o-transform'] = newValue;
                element.style.transform = newValue;
            }
        }
    };
    
    function RGBColor(r, g, b, a) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = typeof a === "number" ? a : 1;
    }
    RGBColor.fromArray = function(array, result) {
        result || (result = new RGBColor());
        if (array.length < 3) {
            return result;
        }
        result.r = parseInt(array[0]);
        result.g = parseInt(array[1]);
        result.b = parseInt(array[2]);
        if (array.length > 3) {
            result.a = parseFloat(array[3]);
        }
        return result;
    };
    RGBColor.fromString = function(string, result) {
        if (string.match(/^#([0-9a-f]{3})$/i)) {
            return RGBColor.fromArray([
                parseInt(string.charAt(1),16)*0x11,
                parseInt(string.charAt(2),16)*0x11,
                parseInt(string.charAt(3),16)*0x11
            ], result);
        }
        if (string.match(/^#([0-9a-f]{6})$/i)) {
            return RGBColor.fromArray([
                parseInt(string.substr(1,2),16),
                parseInt(string.substr(3,2),16),
                parseInt(string.substr(5,2),16)
            ], result);
        }
        return RGBColor.fromArray(string.replace(/^rgb(a)?\((.*)\)$/, '$2').split(/, /), result);
    };
    RGBColor.fromHSV = function(hsv, result) {
        result || (result = new RGBColor());
        var r = hsv.v,
            g = hsv.v,
            b = hsv.v;
        if (hsv.s != 0) {
            var f  = hsv.h / 60 - Math.floor(hsv.h / 60);
            var p  = hsv.v * (1 - hsv.s / 100);
            var q  = hsv.v * (1 - hsv.s / 100 * f);
            var t  = hsv.v * (1 - hsv.s / 100 * (1 - f));
            switch (Math.floor(hsv.h / 60)){
                case 0: r = hsv.v; g = t; b = p; break;
                case 1: r = q; g = hsv.v; b = p; break;
                case 2: r = p; g = hsv.v; b = t; break;
                case 3: r = p; g = q; b = hsv.v; break;
                case 4: r = t; g = p; b = hsv.v; break;
                case 5: r = hsv.v; g = p; b = q; break;
            }
        }
        result.r = r * 2.55;
        result.g = g * 2.55;
        result.b = b * 2.55;
        result.a = hsv.a;
        return result;
    };
    RGBColor.prototype = {
        getHue: function(maximum, range) {
            var hue = 0;
            if (range != 0) {
                switch (maximum){
                    case this.r:
                        hue = (this.g - this.b) / range * 60;
                        if (hue < 0) hue += 360;
                        break;
                    case this.g:
                        hue = (this.b - this.r) / range * 60 + 120;
                        break;
                    case this.b:
                        hue = (this.r - this.g) / range * 60 + 240;
                        break;
                }
            }
            return hue;
    
        },
        interpolate: function(to, progress) {
            var src = HSVColor.fromRGB(this),
                dst = HSVColor.fromRGB(to);
            src.interpolate(dst, progress);
            RGBColor.fromHSV(src, this);
        },
        toString: function() {
            if (this.a !== 1) {
                return "rgba("+this.r.toFixed()+","+this.g.toFixed()+","+this.b.toFixed()+","+this.a.toFixed(2)+")";
            }
            return "rgb("+this.r.toFixed()+","+this.g.toFixed()+","+this.b.toFixed()+")";
        }
    };
    
    function HSVColor(h, s, v, a) {
        this.h = h || 0;
        this.s = s || 0;
        this.v = v || 0;
        this.a = typeof a === "number" ? a : 1;
    }
    HSVColor.fromRGB = function(rgb, result) {
        result || (result = new HSVColor());
        var maximum = Math.max(rgb.r, rgb.g, rgb.b);
        var range   = maximum - Math.min(rgb.r, rgb.g, rgb.b);
        result.h = rgb.getHue(maximum, range);
        result.s = (maximum == 0 ? 0 : 100 * range / maximum);
        result.v = maximum / 2.55;
        result.a = rgb.a;
        return result;
    };
    HSVColor.prototype = {
        interpolate: function(to, progress, precision) {
            this.h = interpolate(this.h, to.h, progress);
            this.s = interpolate(this.s, to.s, progress);
            this.v = interpolate(this.v, to.v, progress);
            this.a = interpolate(this.a, to.a, progress);
        },
        toString: function() {
            if (this.a !== 1) {
                return "hsva("+this.h+","+this.s+","+this.v+","+this.a.toFixed(2)+")";
            }
            return "hsv("+this.h+","+this.s+","+this.v+")";
        }
    };

    function Transform(matrix) {
        this.matrix = matrix || new TransformMatrix();
    }
    Transform.prototype = {
        isSet: function() {
            return (typeof this.translateX != "undefined" ||
                    typeof this.translateY != "undefined" ||
                    typeof this.translateZ != "undefined" ||
                    typeof this.scale != "undefined" ||
                    typeof this.rotate != "undefined")
        },
        toString: function() {
            var x = (typeof this.translateX != "undefined" ? this.translateX : this.matrix.translateX()).toFixed(2),
                y = (typeof this.translateY != "undefined" ? this.translateY : this.matrix.translateY()).toFixed(2),
                z = (typeof this.translateZ != "undefined" ? this.translateZ : this.matrix.translateZ()).toFixed(2),
                scale = (typeof this.scale != "undefined" ? this.scale : this.matrix.scale()),
                rotate = (typeof this.rotate != "undefined" ? this.rotate : this.matrix.rotate()),
                string = 'translate3d('+x+'px, '+y+'px, '+z+'px)';
            if (scale != 1) {
                string += ' scale('+scale+')';
            }
            if (rotate) {
                string += 'rotate('+rotate+'deg)';
            }
            return string;
        }
    };

    function TransformMatrix() {
        this.matrix = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    TransformMatrix.fromArray = function(array, result) {
        result || (result = new TransformMatrix());
        if (array.length < 6) {
            return result;
        }
        for (var i=0; i<array.length; i++) {
            array[i] = parseFloat(array[i]);
        }
        if (array.length < 16) {
            array = [
                array[0], array[1], 0, 0,
                array[2], array[3], 0, 0,
                0, 0, 1, 0,
                array[4], array[5], 0, 1
            ];
        }
        result.matrix = array;
        return result;
    };
    TransformMatrix.fromStyle = function(style, result) {
        if (!style) {
            return result || new TransformMatrix();
        }
        var transform = style.transform || style.webkitTransform || style.mozTransform;
        return TransformMatrix.fromArray(transform.replace(/^matrix(3d)?\((.*)\)$/, '$2').split(/, /), result);
    };
    TransformMatrix.prototype = {
        translateX: function() {
            return this.matrix[12];
        },
        translateY: function() {
            return this.matrix[13];
        },
        translateZ: function() {
            return this.matrix[14];
        },
        scale: function() {
            var a = this.matrix[0],
                b = this.matrix[1],
                d = 10;
            return Math.round( Math.sqrt( a*a + b*b ) * d ) / d;
        },
        rotate: function() {
            var a = this.matrix[0],
                b = this.matrix[1];
            return Math.round(Math.atan2(b, a) * (180/Math.PI));
        }
    };

    if (!isTouchDevice) {
        $(function() {

            $("[data-parallax]").parallax();

        });
    }

})(jQuery);

// isArray shim
if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

// console.error shim
if (!console["error"]) {
    console.error = function(message) {
        window.alert(message);
    };
}