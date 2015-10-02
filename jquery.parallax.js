;(function($) {
    'use strict';

    var $window = $(window),
        $elements = null,
        elementsArr,
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
                    var options = method || {};
                    updateParallaxData.call(this, options)
                    if ($elements === null) {
                        $elements = this;
                        window.onresize = onResize;
                        window.onscroll = onScroll;
                    }
                    else {
                        $elements.add(this);
                    }
                    elementsArr = $elements.toArray();
                }
        }
        return this;
    };

    function updateParallaxData(options) {
        options || (options = {});
        this.each(function() {
            var $this = $(this),
                parallax = {},
                translate = $this.data("parallax-translate") || {};
            if (!translate.x && !translate.y && !translate.z) {
                translate = {y: translate};
            }
            options.translate = $.extend(translate, options.translate || {});
            parallax.translateX = getTranslateFunc.call(this, options.translate.x, function() {
                return getMatrix3d.call(this, 12, 4);
            });
            parallax.translateY = getTranslateFunc.call(this, options.translate.y, function() {
                return getMatrix3d.call(this, 13, 5);
            });
            parallax.translateZ = getTranslateFunc.call(this, options.translate.z, function() {
                return getMatrix3d.call(this, 14);
            });
            if (options.scale || typeof $this.data('parallax-scale') != "undefined") {
                parallax.scale = getParallaxFunc.call(this, options.scale || $this.data('parallax-scale'), 1);
            }
            if (options.rotate || typeof $this.data('parallax-rotate') != "undefined") {
                parallax.rotate = getParallaxFunc.call(this, options.rotate || $this.data('parallax-rotate'));
            }
            if (options.opacity || typeof $this.data('parallax-opacity') != "undefined") {
                parallax.opacity = getParallaxFunc.call(this, options.opacity || $this.data('parallax-opacity'), 1);
            }
            $this.data("parallax", parallax);
        });
    }

    function onResize() {
        if (!resizeTicking) {
            window.requestAnimationFrame(function() {
                windowHeight = $window.height();
                windowWidth = $window.width();
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
        scrollTop = $window.scrollTop();

        for (var i=0; i<elementsArr.length; i++) {
            animateElement.call(elementsArr[i]);
        }

        scrollTicking = false;
    }

    function animateElement() {
        var $this = $(this),
            parallax = $this.data("parallax"),
            transform = 'translate3d(' + parallax.translateX.call(this) + 'px,' + parallax.translateY.call(this) + 'px,' + parallax.translateZ.call(this) + 'px)';
        if (parallax.scale) {
            transform += ' scale(' + parallax.scale.call(this) + ')';
        }
        if (parallax.rotate) {
            transform += ' rotate(' + parallax.rotate.call(this) + 'deg)'
        }
        this.style['-webkit-transform'] = transform;
        this.style['-moz-transform'] = transform;
        this.style['-ms-transform'] = transform;
        this.style['-o-transform'] = transform;
        this.style.transform = transform;
        if (parallax.opacity) {
            this.style.opacity = parallax.opacity.call(this);
        }
    }

    function getTranslateFunc(options, valueFunc) {
        if (typeof options == "number" || typeof options == "string") {
            if (options === "dynamic") {
                return function () {
                    valueFunc.call(this);
                };
            }
            options = {
                to: options
            };
        }
        if (typeof options == "undefined" || typeof options.to == "undefined") {
            var value = valueFunc.call(this);
            return function() {
                return value;
            };
        }
        var start = options.start || $(this).offset().top,
            duration = options.duration || "100%",
            from = options.from || 0,
            to = options.to;
        return function() {
            var durationPx = convertToPx(duration),
                fromPx = convertToPx(from),
                toPx = convertToPx(to);
            if (scrollTop >= start && scrollTop <= (start + durationPx)) {
                return easeInOutQuad(scrollTop-start, fromPx, (toPx - fromPx), durationPx).toFixed(2);
            }
        };
    }

    function getParallaxFunc(options, defaultFrom) {
        switch (typeof(options)) {
            case "number":
                options = {
                    to: options
                };
                break;
        }
        var start = options.start || $(this).offset().top,
            duration = options.duration || "100%",
            from = options.from || (defaultFrom || 0),
            to = options.to;
        return function() {
            var durationPx = convertToPx(duration);
            if (scrollTop >= start && scrollTop <= (start + durationPx)) {
                return easeInOutQuad(scrollTop-start, from, (to - from), durationPx);
            }
        };
    }

    function getMatrix3d(mat3dIdx, matIdx) {
        if (!window.getComputedStyle) return;
        var style = getComputedStyle(this),
            transform = style.transform || style.webkitTransform || style.mozTransform,
            mat3d = transform.match(/^matrix3d\((.+)\)$/);
        if(mat3d) return parseFloat(mat3d[1].split(', ')[mat3dIdx]);
        else if (arguments.length < 3) return 0;
        var mat = transform.match(/^matrix\((.+)\)$/);
        return mat ? parseFloat(mat[1].split(', ')[matIdx]) : 0;
    }

    function convertToPx(value, axis) {
        if(typeof value === "string" && value.match(/%/g)) {
            if(axis === 'x') value = (parseFloat(value) / 100) * windowWidth;
            else value = (parseFloat(value) / 100) * windowHeight;
        }
        return value;
    }

    function easeInOutQuad(t, b, c, d) {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
    }

    if (!isTouchDevice) {
        $(function() {

            $('[data-parallax-translate],[data-parallax-scale],[data-parallax-rotate],[data-parallax-opacity]').parallax();

        });
    }

})(jQuery);
