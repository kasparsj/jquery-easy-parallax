# [data-parallax]
jQuery plugin for setting up parallax effects easily using data attributes.

## Examples

[See Examples](http://kasparsj.github.io/jquery-data-parallax/bower_components/jquery-data-parallax/examples/)

## Availability

```bash
bower install jquery-data-parallax
```

## Installation

```html
<script src="bower_components/jquery/dist/jquery.min.js"></script>
<script src="bower_components/jquery.requestAnimationFrame/jquery.requestAnimationFrame.min.js"></script>
<script src="bower_components/jquery-data-parallax/jquery.data-parallax.min.js"></script>
```

## Usage

Either use data attributes:

```html
<div data-parallax='{"y":"70%","scale":2,"rotate":180,"opacity":0}'></div>
```

or javascript:

```javascript
$("#selector").parallax({
    "y": "70%",
    "scale": 2,
    "rotate": 180,
    "opacity": 0
});
```

### Properties

All properties can be specified as **number** or **percentage** (string) or **object**.  
Using the object syntax you can explicitly pass in a **from** value (optional), as well as override global options:

```html
<div data-parallax='{"opacity":{"to":1,"from":0.5,"duration":100},"translateY":"50%","duration":200}'></div>
```

### Available properties:

x

y

z

scale

rotate

color

backgroundColor

opacity

### Options

Options can be specified for all properties:

```html
<div data-parallax='{"y":"70%","opacity":1,"duration":"150%"}'></div>
```

as well as (overridden) for each individually:

```html
<div data-parallax='{"y":"70%","opacity":{"to":1,"duration":"85%"},"duration":"150%"}'></div>
```

### Available options:

#### start
**Type:** number or selector  
**Default:** the elements top offset

#### duration
**Type:** number or string (percentage or viewport units) or callback function  
**Default:** element top + height - start

Percentage is calculated against element dimensions rather than viewport: "50%" == 0.5 * $(el).width().  
For viewport relative values, use viewport units: vh or vw.

#### trigger
**Type:** number or string (percentage)  
**Default:**: "100%"

#### ease
**Type:** function or string  
**Default:** "linear"

#### axis
**Type:** string ("x" or "y")  
**Default:** "y"

## Credits
This plugin was inspired from [Parallax Done Right](https://medium.com/@dhg/parallax-done-right-82ced812e61c) and [Perfecting Parallax Scrolling](https://github.com/Form5/parallax)
