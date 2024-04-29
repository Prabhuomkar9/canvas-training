// @ts-nocheck
import React, { useEffect } from "react";
import { img1, img2, img3 } from "~/constants/images";

const test3 = () => {
  useEffect(() => {
    const BASE64_SRC = img3;

    const _C = document.getElementById("c"),
      CT = _C.getContext("2d"),
      IMG_RECT = { img: new Image(), max: 640 },
      DOT_GRID = { rad: 2, gap: 9 },
      NUM_CH = "RGBA".length;

    DOT_GRID.draw = function () {
      CT.fillStyle = "lemonchiffon";

      CT.beginPath();

      DOT_GRID.arr.forEach((c) => {
        CT.moveTo(c.x, c.y);
        CT.arc(c.x, c.y, DOT_GRID.rad, 0, 2 * Math.PI);
      });

      CT.closePath();
      /* fills are expensive, so
       * keep the fill outside the loop
       * if it's the same for all dots */
      CT.fill();
    };

    function dottify() {
      /* get a long array containing
       * the RGBA channel values of all pixels
       * in the specified rectangle going
       * row by row and column by column
       * [R0, G0, B0, A0, R1, G1, B1, A1, ... RN, GN, BN, AN]
       * it's a 4 x IMG_RECT.width x IMG_RECT.height
       * length array (4 because we have 4 channels RGBA) */
      let data = CT.getImageData(
        IMG_RECT.x,
        IMG_RECT.y,
        IMG_RECT.width,
        IMG_RECT.height,
      ).data;

      /* reduce this to a pixel objects array */
      DOT_GRID.arr = data
        .reduce((a, c, i, o) => {
          if (i % NUM_CH === 0)
            a.push({
              /* pixel coordinates within text box */
              x: ((i / NUM_CH) % IMG_RECT.width) + IMG_RECT.x,
              y: Math.floor(i / NUM_CH / IMG_RECT.width) + IMG_RECT.y,
              /* RGBA values for current pixel */
              rgba: o.slice(i, i + NUM_CH),
            });
          return a;
        }, [])
        .filter(
          (c) =>
            c.rgba[NUM_CH - 1] /* non-zero alpha pixels */ &&
            /* only take one every DOT_GRID.gap pixels
             * both horizontally and vertically */
            !(Math.ceil(c.x - 0.5 * DOT_GRID.gap) % DOT_GRID.gap) &&
            !(Math.ceil(c.y - 0.5 * DOT_GRID.gap) % DOT_GRID.gap),
        );

      /* remove original painted image... if you want to */
      CT.clearRect(IMG_RECT.x, IMG_RECT.y, IMG_RECT.width, IMG_RECT.height);

      /* draw grid of dots within text shape */
      DOT_GRID.draw();
    }

    function paint() {
      /* set image source */
      IMG_RECT.img.src = BASE64_SRC;
      /* once the image has loaded,
       * paint it on canvas */
      IMG_RECT.img.onload = function () {
        /* image aspect ratio */
        IMG_RECT.ratio = IMG_RECT.img.width / IMG_RECT.img.height;
        /* dimensions our image needs to have to fit within canvas undistorted */
        IMG_RECT.width = Math.round(
          Math.min(
            IMG_RECT.max,
            IMG_RECT.img.width,
            _C.width,
            _C.height * IMG_RECT.ratio,
          ),
        );
        IMG_RECT.height = Math.round(
          Math.min(
            IMG_RECT.max,
            IMG_RECT.img.height,
            _C.height,
            _C.width / IMG_RECT.ratio,
          ),
        );
        /* top left corner coordinates for image rectangle */
        IMG_RECT.x = Math.round(0.5 * (_C.width - IMG_RECT.width));
        IMG_RECT.y = Math.round(0.5 * (_C.height - IMG_RECT.height));

        /* draw image on canvas */
        CT.drawImage(
          IMG_RECT.img,
          IMG_RECT.x,
          IMG_RECT.y,
          IMG_RECT.width,
          IMG_RECT.height,
        );

        dottify();
      };
    }

    function size() {
      CT.clearRect(0, 0, _C.width, _C.height);

      /* I have found getting the px values
       * of the CSS-set dimensions and then
       * setting them to canvas width/ height
       * to be more reliable than
       * window.innerWidth (or innerHeight) */
      let s = getComputedStyle(_C);

      _C.width = +s.width.slice(0, -2);
      _C.height = +s.height.slice(0, -2);

      paint();
    }

    addEventListener("resize", size);

    ((_) => size())();

    return () => {
      removeEventListener("resize", size);
    };
  });

  return (
    <div className="h-screen w-screen">
      <canvas id="c" className="h-screen w-screen bg-black"></canvas>
    </div>
  );
};

export default test3;
