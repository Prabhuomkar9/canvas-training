import React, { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const CONFIG = {
      canvasId: "canvas",
      canvasBackgroundColor: "#180728",

      dotFillColor: "#ffffff",
      dotGap: 18,

      imageChangeTimeDelay: 5000,

      updateSpeeds: { slow: 0.005, fast: 0.05 },
      updateSpeed: 0,

      minParticleRadius: 2,
      maxParticleRadius: 6,

      fieldRadius: 12,
      fieldStrength: 12,

      // Is initialized in initializeSystem()
      noOfBehaviourType: 50,
      behaviourTimeDelay: [0],
      behaviourCircleTimeDuration: 2000,

      wiggleOffset: 4,

      maxHeight: 10,

      randomStateCount: 3,

      // Degree
      randomDirections: [
        0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360,
      ] as number[],
      directionOffset: 15,
    };

    const INPUT = {
      imgSrcRoot: "./../../public/assets/",
      imgSrc: [
        "marketEra.png",
        "web3.png",
        "meta.png",
        "camera.png",
        "reel.png",
      ],
    };

    const DRAW_AREA_RECT = { img: new Image(), x: 0, y: 0, w: 0, h: 0 };
    const MOUSE_POINTER = { x: 0, y: 0 };

    const CANVAS = document.getElementById(
      CONFIG.canvasId,
    )! as HTMLCanvasElement;
    const CONTEXT = CANVAS.getContext("2d", { willReadFrequently: true })!;

    class Utility {
      static random = (l: number, h: number) => l + Math.random() * (h - l);

      static randomInt = (l: number, h: number, fractionDigits = 0) =>
        +(l + Math.random() * (h - l)).toFixed(fractionDigits);

      static randomFromArray<T>(arr: T[], callBackFunc = (ele: T) => ele) {
        return callBackFunc(arr[Math.floor(Math.random() * (arr.length - 1))]);
      }

      static easeInOutCirc = (x: number) =>
        x < 0.5
          ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
          : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;

      static async shuffleArray(arrayLength: number) {
        return new Promise<number[]>((resolve) => {
          const array = Array.from(
            { length: arrayLength },
            (unknown, idx) => idx,
          );

          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }

          resolve(array);
        });
      }
    }

    class Particle {
      // Actual Position
      ax: number;
      ay: number;

      // Current Position
      x: number;
      y: number;

      // Destination Position
      dx: number;
      dy: number;

      // Rendered Position
      rx: number;
      ry: number;

      // Actual Radius
      ar: number;

      // Current Radius
      r: number;

      // Destination Radius
      dr: number;

      // Height from canvas
      ah: number;

      // Behaviour Type
      bt: number;

      // Behaviour Time Delay
      btd: number;

      // Revolution Direction
      rd: number;

      constructor(
        x: number,
        y: number,
        r = Utility.randomInt(
          CONFIG.minParticleRadius,
          CONFIG.maxParticleRadius,
        ),
      ) {
        this.ax = x;
        this.ay = y;

        this.x = x;
        this.y = y;

        this.dx = x;
        this.dy = y;

        this.rx = x;
        this.ry = y;

        this.ar = r;
        this.r = r;
        this.dr = r;

        this.ah = Utility.randomInt(0, CONFIG.maxHeight);

        this.bt = Utility.randomInt(0, CONFIG.noOfBehaviourType);

        this.btd = CONFIG.behaviourTimeDelay[this.bt];

        this.rd = Utility.randomFromArray([-1, 1]);
      }

      moveTo(x: number, y: number) {
        this.ax = x;
        this.ay = y;
        this.dx = x;
        this.dy = y;
      }

      minimize() {
        this.dr = 0;
      }

      maximize() {
        this.dr = this.ar;
      }

      checkMouseMove() {
        const px = this.ax - MOUSE_POINTER.x;
        const py = this.ay - MOUSE_POINTER.y;

        const distance = Math.hypot(px, py);

        this.dx =
          this.ax +
          (px * CONFIG.fieldRadius * CONFIG.fieldStrength) /
            Math.pow(distance, 1.5);
        this.dy =
          this.ay +
          (py * CONFIG.fieldRadius * CONFIG.fieldStrength) /
            Math.pow(distance, 1.5);
      }

      moveCircle(timeStamp: number) {
        const percentage =
          ((timeStamp + this.btd) % CONFIG.behaviourCircleTimeDuration) /
          CONFIG.behaviourCircleTimeDuration;
        const angle = Utility.easeInOutCirc(percentage) * 2 * Math.PI * this.rd;

        this.rx = this.dx + Math.cos(angle) * CONFIG.wiggleOffset;
        this.ry = this.dy + Math.sin(angle) * CONFIG.wiggleOffset;
      }

      implicitPositionUpdate(timeStamp: number) {
        this.checkMouseMove();
        this.moveCircle(timeStamp);

        // If current position and destination position don't match update current position
        if (this.x !== this.rx || this.y !== this.ry || this.r !== this.dr) {
          this.x += (this.rx - this.x) * CONFIG.updateSpeed;
          this.y += (this.ry - this.y) * CONFIG.updateSpeed;
          // this.r += (this.dr - this.r) * CONFIG.updateSpeed * 5
        }
        this.r = this.dr;
      }

      draw(timeStamp: number) {
        this.implicitPositionUpdate(timeStamp);

        CONTEXT.fillStyle = CONFIG.dotFillColor;
        CONTEXT.beginPath();
        CONTEXT.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        CONTEXT.closePath();
        CONTEXT.fill();
      }
    }

    class ParticleSystem {
      particles: Particle[] = [];
      states: { x: number; y: number }[][] = [];
      currState = -1;
      randomStates: { x: number; y: number }[][] = [];
      tempRandomState = -1;
      currRandomState = -1;
      randomOrderArray: number[] = [];

      constructor(input: typeof INPUT) {
        this.initialize(input);
      }

      async initialize(input: typeof INPUT) {
        for (const img of input.imgSrc)
          await this.addImage(`${input.imgSrcRoot}${img}`);

        const particleCount = this.states.reduce(
          (prev, curr) => (prev = Math.max(prev, curr.length)),
          0,
        );

        this.randomOrderArray = await Utility.shuffleArray(particleCount);

        await this.addRandomScatter(particleCount / 3);

        for (let i = 0; i < particleCount; i++)
          this.particles.push(
            new Particle(
              Utility.randomInt(CANVAS.width / 3, (2 * CANVAS.width) / 3),
              Utility.randomInt(CANVAS.height / 3, (2 * CANVAS.height) / 3),
            ),
          );

        this.changeImage();

        tick();
      }

      addImage(src: string) {
        return new Promise<void>((resolve) => {
          const img = new Image();

          img.src = src;

          DRAW_AREA_RECT.img = img;

          img.onload = () => {
            DRAW_AREA_RECT.w = Math.min(
              DRAW_AREA_RECT.img.width,
              CANVAS.width,
              CANVAS.height,
            );
            DRAW_AREA_RECT.h = DRAW_AREA_RECT.w;
            DRAW_AREA_RECT.x = 0.5 * (CANVAS.width - DRAW_AREA_RECT.w);
            DRAW_AREA_RECT.y = 0.5 * (CANVAS.height - DRAW_AREA_RECT.h);

            CONTEXT.drawImage(
              img,
              DRAW_AREA_RECT.x,
              DRAW_AREA_RECT.y,
              DRAW_AREA_RECT.w,
              DRAW_AREA_RECT.h,
            );
            this.states.push(this.dottify());
            CONTEXT.clearRect(
              DRAW_AREA_RECT.x,
              DRAW_AREA_RECT.y,
              DRAW_AREA_RECT.w,
              DRAW_AREA_RECT.h,
            );

            resolve();
          };
        });
      }

      addRandomScatter(particleCount: number) {
        return new Promise<void>((resolve) => {
          const w = 2,
            h = 2;

          const scatter = Array.from({ length: particleCount }, () => {
            const angle =
              Utility.randomFromArray(
                CONFIG.randomDirections,
                (ele) => (ele * Math.PI) / 180,
              ) + Utility.random(0, (CONFIG.directionOffset * Math.PI) / 180);
            const distance = Utility.random(
              0,
              Math.hypot(w * CANVAS.width, h * CANVAS.height),
            );

            return {
              x: CANVAS.width / 2 + distance * Math.cos(angle),
              y: CANVAS.height / 2 + distance * Math.sin(angle),
            };
          });

          this.randomStates.push(scatter);

          // Index starts from 1
          for (let i = 1; i < CONFIG.randomStateCount; i++) {
            let angle = Utility.randomFromArray([-45, 45]);

            const scatter = this.randomStates![
              this.randomStates.length - 1
            ].reduce(
              (prev, curr) => {
                angle += Utility.random(-15, 15);
                angle *= Math.PI / 180;

                const limit = Math.hypot(CANVAS.width / 2, CANVAS.height / 2);
                const distance = Utility.random(limit / 3, limit);

                prev.push({
                  x: curr.x + distance * Math.cos(angle),
                  y: curr.y + distance * Math.sin(angle),
                });
                return prev;
              },
              [] as { x: number; y: number }[],
            );

            this.randomStates.push(scatter);
          }

          resolve();
        });
      }

      dottify() {
        const imageData = CONTEXT.getImageData(
          DRAW_AREA_RECT.x,
          DRAW_AREA_RECT.y,
          DRAW_AREA_RECT.w,
          DRAW_AREA_RECT.h,
        ).data;

        const pixels = imageData.reduce(
          (accumulated, curr, idx, data) => {
            if (idx % 4 === 0)
              accumulated.push({
                x: (idx / 4) % DRAW_AREA_RECT.w,
                y: ~~(idx / 4 / DRAW_AREA_RECT.w),
                alpha: data[idx + 3]!,
              });
            return accumulated;
          },
          [] as { x: number; y: number; alpha: number }[],
        );

        const filteredPixels = pixels.filter(
          (pixel) =>
            pixel.alpha &&
            pixel.x % CONFIG.dotGap === 0 &&
            pixel.y % CONFIG.dotGap === 0,
        );

        return filteredPixels.map((pixel) => ({ x: pixel.x, y: pixel.y }));
      }

      changeImage() {
        // if (this.tempRandomState < this.currState) {
        //   this.tempRandomState = this.tempRandomState + 1
        //   this.currRandomState = Utility.randomInt(0, this.randomStates.length - 1)

        //   this.randomMovement()
        // } else {
        this.currState = (this.currState + 1) % this.states.length;

        CONFIG.updateSpeed = CONFIG.updateSpeeds.fast;

        for (let i = 0; i < this.randomOrderArray.length; i++) {
          const particle = this.particles[this.randomOrderArray[i]];

          const x =
            this.states[this.currState][i % this.states[this.currState].length]
              .x;
          const y =
            this.states[this.currState][i % this.states[this.currState].length]
              .y;

          particle.moveTo(DRAW_AREA_RECT.x + x, DRAW_AREA_RECT.y + y);

          if (i < this.states[this.currState].length) particle.maximize();
          else particle.minimize();
          // }
        }
      }

      randomMovement(depth = 0) {
        if (depth >= CONFIG.randomStateCount) return;

        this.currRandomState =
          (this.currRandomState + 1) % this.randomStates.length;

        CONFIG.updateSpeed = CONFIG.updateSpeeds.slow;

        for (let i = 0; i < CONFIG.randomStateCount; i++) {}

        const limit = Math.hypot(CANVAS.width / 2, CANVAS.height / 2);
        let angle = Utility.randomFromArray([-45, 45, 135, -135]);

        this.particles.forEach((particle, idx) => {
          angle += Utility.random(-15, 15);
          angle *= Math.PI;
          angle /= 180;

          const distance = Utility.random(limit / 3, limit);

          const x = particle.ax + distance * Math.cos(angle);
          const y = particle.ay + distance * Math.sin(angle);

          particle.moveTo(x, y);

          if (idx < this.randomStates[this.currRandomState].length)
            particle.maximize();
          else particle.minimize();
        });

        setTimeout(() => {
          this.randomMovement(depth + 1);
        }, CONFIG.imageChangeTimeDelay / CONFIG.randomStateCount);
      }
    }

    function tick(timeStamp: number = 0) {
      CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
      particleSystem.particles.forEach((p) => p.draw(timeStamp));
      requestAnimationFrame(tick);
    }

    function initializeSystem() {
      CANVAS.style.backgroundColor = CONFIG.canvasBackgroundColor;

      const computedStyle = getComputedStyle(CANVAS);
      CANVAS.width = +computedStyle.width.slice(0, -2);
      CANVAS.height = +computedStyle.height.slice(0, -2);

      // Index Starts from 1
      for (let i = 1; i < CONFIG.noOfBehaviourType; i++)
        CONFIG.behaviourTimeDelay.push(
          (CONFIG.imageChangeTimeDelay / CONFIG.noOfBehaviourType) * i +
            Utility.random(
              -CONFIG.imageChangeTimeDelay / CONFIG.noOfBehaviourType / 2,
              CONFIG.imageChangeTimeDelay / CONFIG.noOfBehaviourType / 2,
            ),
        );

      CONFIG.updateSpeed = CONFIG.updateSpeeds.fast;
    }

    function handleMouseMOve(e: MouseEvent) {
      MOUSE_POINTER.x = e.clientX;
      MOUSE_POINTER.y = e.clientY;
    }

    function handleResize(e?: UIEvent) {
      initializeSystem();
      // CONFIG.maxParticleRadius = Math.min(CANVAS.width, CANVAS.height) * 0.005
      console.log(
        CANVAS.width,
        CANVAS.height,
        CONFIG.dotGap,
        CONFIG.maxParticleRadius,
      );
      // 956 956 18 6
      // 412 915 12 4
    }

    window.addEventListener("mousemove", handleMouseMOve);
    window.addEventListener("resize", handleResize);

    setInterval(() => {
      particleSystem.changeImage();
    }, CONFIG.imageChangeTimeDelay);

    handleResize();

    const particleSystem = new ParticleSystem(INPUT);
  });

  return (
    <main>
      <canvas id="canvas"></canvas>
    </main>
  );
}
