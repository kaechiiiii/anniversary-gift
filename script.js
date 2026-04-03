window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) { 
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
var loaded = false;
var init = function () {
    if (loaded) return;
    loaded = true;
    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * window.innerWidth;  
    var height = canvas.height = koef * window.innerHeight; 
    var rand = Math.random;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    var heartPosition = function (rad) {
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };
    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    window.addEventListener('resize', function () {
        width = canvas.width = koef * window.innerWidth;  
        height = canvas.height = koef * window.innerHeight; 
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);
    });

    var traceCount = mobile ? 20 : 50;
    var pointsOrigin = [];
    var i, k;  
    var dr = mobile ? 0.3 : 0.1;
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
    var heartPointsCount = pointsOrigin.length;

    var targetPoints = [];
    var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
    };

    var e = [];
    for (i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
            trace: []
        };
        for (k = 0; k < traceCount; k++) e[i].trace[k] = {x: x, y: y};
    }

    var config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    var time = 0;
    var textAlpha = 0; 

    var loop = function () {
        var n = -Math.cos(time);
        pulse((1 + n) * .5, (1 + n) * .5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;
        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);
        for (i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (10 > length) {
                if (0.95 < rand()) {
                    u.q = ~~(rand() * heartPointsCount);
                }
                else {
                    if (0.99 < rand()) {
                        u.D *= -1;
                    }
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (0 > u.q) {
                        u.q += heartPointsCount;
                    }
                }
            }
            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            for (k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            ctx.fillStyle = u.f;
            for (k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
            }
        }

        // ==========================================
        // TEXT RENDERING INSIDE THE ANIMATION
        // ==========================================
        
        if (textAlpha < 0.9) {
            textAlpha += 0.002; 
        }

        ctx.fillStyle = "rgba(255, 216, 131, " + textAlpha + ")"; 
        ctx.textBaseline = "middle";

        ctx.font = "italic 36px Times New Roman"; 
        ctx.textAlign = "right"; 
        ctx.fillText("Happy 1st anniversary, Ria", (width / 2) - 350, height / 2);

        ctx.textAlign = "left"; 
        ctx.fillText("To more years with you.", (width / 2) + 350, height / 2);

        ctx.font = "italic 24px Times New Roman"; 
        ctx.textAlign = "left"; 
        ctx.fillText("I love you so much!", (width / 2) + 350, (height / 2) + 50);
        // ==========================================

        window.requestAnimationFrame(loop, canvas);
    };
    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);

// ==========================================
// MUSIC PLAYBACK ON CLICK
// ==========================================
document.addEventListener('click', function() {
    var music = document.getElementById('bg-music');
    if (music && music.paused) {
        music.play();
    }
});

// ==========================================
// GALLERY FUNCTIONALITY WITH BACKGROUND GLITTER
// ==========================================
const memories = [
    { src: "pic1.jpg", text: "this is when we're both starting to get comfy together" },
    { src: "pic2.jpg", text: "our reactions are cutie hihi" },
    { src: "pic3.jpg", text: "one of my favs" },
    { src: "pic4.jpg", text: "another goofy pic hahaha" },
    { src: "pic5.jpg", text: "i always have a pic of u eeping on my chest hehe" },
    { src: "pic6.jpg", text: "i just love this picture so much" }
];

let currentIndex = 0;

const enterBtn = document.getElementById('enter-gallery-btn');
const backBtn = document.getElementById('back-btn');
const galleryContainer = document.getElementById('gallery-container');
const heartCanvas = document.getElementById('heart');
const galleryImg = document.getElementById('gallery-img');
const galleryDesc = document.getElementById('gallery-desc');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Add smooth CSS transitions to the images and text
if (galleryImg) galleryImg.style.transition = "opacity 0.3s ease-in-out";
if (galleryDesc) galleryDesc.style.transition = "opacity 0.3s ease-in-out";

// --- GLITTER CREATION FUNCTION ---
function createGlitter() {
    const style = document.createElement('style');
    style.innerHTML = `
        .glitter-star {
            position: absolute;
            background-color: white;
            box-shadow: 0 0 6px rgba(255, 216, 131, 0.9); /* Warm golden glow */
            border-radius: 50%;
            pointer-events: none; /* So you can still click the buttons behind them */
            animation: twinkle infinite ease-in-out;
            z-index: 1; /* Puts glitter in the background */
        }
        .gallery-card {
            position: relative;
            z-index: 10; /* Ensures the pictures and text sit above the glitter */
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);

    if (galleryContainer) {
        // Create 150 little glitter dots
        for (let i = 0; i < 150; i++) {
            let star = document.createElement('div');
            star.className = 'glitter-star';
            
            // Randomize position across the whole screen
            star.style.left = Math.random() * 100 + 'vw';
            star.style.top = Math.random() * 100 + 'vh';
            
            // Randomize size from 1px to 3px
            let size = Math.random() * 2 + 1 + 'px';
            star.style.width = size;
            star.style.height = size;
            
            // Randomize twinkling speed and delay so they don't all blink at once
            star.style.animationDuration = Math.random() * 3 + 2 + 's';
            star.style.animationDelay = Math.random() * 5 + 's';
            
            galleryContainer.appendChild(star);
        }
    }
}
createGlitter();
// ---------------------------------

function updateGallery() {
    if (galleryImg) galleryImg.style.opacity = 0;
    if (galleryDesc) galleryDesc.style.opacity = 0;

    setTimeout(() => {
        if (galleryImg) galleryImg.src = memories[currentIndex].src;
        if (galleryDesc) galleryDesc.innerText = memories[currentIndex].text;
        
        if (galleryImg) galleryImg.style.opacity = 1;
        if (galleryDesc) galleryDesc.style.opacity = 1;
    }, 300);
}

if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        heartCanvas.style.display = 'none';
        enterBtn.style.display = 'none';
        galleryContainer.style.display = 'flex';
        
        if (galleryImg) galleryImg.style.opacity = 0;
        if (galleryDesc) galleryDesc.style.opacity = 0;
        updateGallery();
    });
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        galleryContainer.style.display = 'none';
        heartCanvas.style.display = 'block';
        enterBtn.style.display = 'block';
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + memories.length) % memories.length;
        updateGallery();
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % memories.length;
        updateGallery();
    });
}