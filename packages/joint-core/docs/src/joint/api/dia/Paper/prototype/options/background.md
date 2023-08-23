An object defining the paper background color and image. It defaults to `false` meaning there is no background set. The configuration object can have the following properties.
* **color**
property sets the paper background color. It accepts all the values accepted by the CSS `background-color` property.
e.g `'red'`, `'rgba(255, 255, 0, 0.5)'`, `'radial-gradient(ellipse at center, red, green);'`
* **image**
property defines the path to the background image file. e.g. `'/my-background.png'`.
* **position**
is an object `{ x: Number, y: Number }` defining the background image position. It also allows to use all the CSS `background-position` property values.
In that case all the paper transformations have no impact on the background image position. It defaults to `center`.
* **size**
is an object `{ width: Number, height: Number }` defining the background image size. It also allows to use all the CSS `background-size` property values. In that case all the paper transformations have no impact on the background size. It defaults to `auto auto`.
* **repeat**
property defines how the background image is repeated. The value could be any value accepted by the CSS `background-repeat` property and few more defined by JointJS. Those are `flip-x`, `flip-y`, `flip-xy` and `watermark`. It defaults to `no-repeat`.
* **quality**
is a coefficient specifying the quality of the image (e.g `0.5` uses only 50% the image size for creating a pattern). Applicable only for the JointJS `repeat` option values. It defaults to `1`.
* **opacity**
is a number in the range `[0,1]` specifying the transparency of the background image (`0` is fully transparent and `1` is fully opaque). It defaults to `1`.
* **watermarkAngle**
is an angle in degrees speficying the slope of the watermark image. Applicable only for the `'watermark'` `repeat` option. It defaults to `20` deg.


```javascript
background: {
   color: '#6764A7',
   image: 'jointjs-logo.png',
   repeat: 'watermark',
   opacity: 0.3
}
```
