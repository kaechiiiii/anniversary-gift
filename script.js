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
        initCanvasStars();
        initFog();
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

    var canvasStars = [];
    var numCanvasStars = mobile ? 40 : 80; 

    var initCanvasStars = function() {
        canvasStars = [];
        for (i = 0; i < numCanvasStars; i++) {
            canvasStars.push({
                x: rand() * width,
                y: rand() * height,
                size: rand() * 4 + 3, 
                alpha: rand(), 
                maxAlpha: 0.6 + rand() * 0.4, 
                flashSpeed: 0.01 + rand() * 0.02, 
                goingUp: rand() > 0.5 
            });
        }
    };
    initCanvasStars(); 

    var canvasFog = [];
    var numFog = mobile ? 4 : 8; 

    var initFog = function() {
        canvasFog = [];
        for (i = 0; i < numFog; i++) {
            canvasFog.push({
                x: rand() * width,
                y: rand() * height,
                vx: (rand() - 0.5) * 0.8, 
                vy: (rand() - 0.5) * 0.8,
                r: rand() * 300 + 200 
            });
        }
    };
    initFog();

    var time = 0;
    var textAlpha = 0; 

    var loop = function () {
        var n = -Math.cos(time);
        pulse((1 + n) * .5, (1 + n) * .5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;
        
        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);

        for (i = 0; i < canvasFog.length; i++) {
            var fog = canvasFog[i];
            fog.x += fog.vx;
            fog.y += fog.vy;
            
            if (fog.x < -fog.r) fog.x = width + fog.r;
            if (fog.x > width + fog.r) fog.x = -fog.r;
            if (fog.y < -fog.r) fog.y = height + fog.r;
            if (fog.y > height + fog.r) fog.y = -fog.r;
            
            var grad = ctx.createRadialGradient(fog.x, fog.y, 0, fog.x, fog.y, fog.r);
            grad.addColorStop(0, "rgba(255, 180, 200, 0.04)"); 
            grad.addColorStop(1, "rgba(255, 180, 200, 0)"); 
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(fog.x, fog.y, fog.r, 0, Math.PI * 2);
            ctx.fill();
        }

        for (i = 0; i < canvasStars.length; i++) {
            var star = canvasStars[i];

            if (star.goingUp) {
                star.alpha += star.flashSpeed;
                if (star.alpha >= star.maxAlpha) star.goingUp = false;
            } else {
                star.alpha -= star.flashSpeed;
                if (star.alpha <= 0) {
                    star.alpha = 0;
                    star.goingUp = true;
                }
            }

            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.beginPath();
            ctx.moveTo(0, -star.size);
            ctx.quadraticCurveTo(0, 0, star.size, 0);
            ctx.quadraticCurveTo(0, 0, 0, star.size);
            ctx.quadraticCurveTo(0, 0, -star.size, 0);
            ctx.quadraticCurveTo(0, 0, 0, -star.size);
            ctx.fillStyle = "rgba(255, 216, 131, " + star.alpha + ")";
            ctx.fill();
            ctx.restore();
        }

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

if (galleryImg) galleryImg.style.transition = "opacity 0.3s ease-in-out";
if (galleryDesc) galleryDesc.style.transition = "opacity 0.3s ease-in-out";

function createGlitter() {
    const style = document.createElement('style');
    style.innerHTML = `
        .glitter-star {
            position: absolute;
            background-color: white;
            box-shadow: 0 0 6px rgba(255, 216, 131, 0.9); 
            border-radius: 50%;
            pointer-events: none; 
            animation: twinkle infinite ease-in-out;
            z-index: 1; 
        }
        .gallery-card {
            position: relative;
            z-index: 10; 
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);

    if (galleryContainer) {
        for (let i = 0; i < 150; i++) {
            let star = document.createElement('div');
            star.className = 'glitter-star';
            star.style.left = Math.random() * 100 + 'vw';
            star.style.top = Math.random() * 100 + 'vh';
            let size = Math.random() * 2 + 1 + 'px';
            star.style.width = size;
            star.style.height = size;
            star.style.animationDuration = Math.random() * 3 + 2 + 's';
            star.style.animationDelay = Math.random() * 5 + 's';
            galleryContainer.appendChild(star);
        }
    }
}
createGlitter();

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

// ==========================================
// ROMANTIC LETTER CREATION (NO HTML CHANGES NEEDED!)
// ==========================================

// 1. Create the button to open the letter
const letterBtn = document.createElement('button');
letterBtn.innerText = "Read My Letter 💌";
letterBtn.style.position = 'absolute';
letterBtn.style.bottom = '12%'; // Sits just above/below your Enter Gallery button
letterBtn.style.left = '50%';
letterBtn.style.transform = 'translateX(-50%)';
letterBtn.style.padding = '12px 24px';
letterBtn.style.fontSize = '18px';
letterBtn.style.fontFamily = '"Times New Roman", serif';
letterBtn.style.background = 'rgba(255, 216, 131, 0.15)';
letterBtn.style.color = '#ffd883';
letterBtn.style.border = '1px solid #ffd883';
letterBtn.style.borderRadius = '30px';
letterBtn.style.cursor = 'pointer';
letterBtn.style.zIndex = '100';
letterBtn.style.transition = 'all 0.3s ease';

letterBtn.onmouseover = () => {
    letterBtn.style.background = 'rgba(255, 216, 131, 0.4)';
    letterBtn.style.color = '#fff';
};
letterBtn.onmouseout = () => {
    letterBtn.style.background = 'rgba(255, 216, 131, 0.15)';
    letterBtn.style.color = '#ffd883';
};
document.body.appendChild(letterBtn);

// 2. Create the hidden overlay for the letter
const letterModal = document.createElement('div');
letterModal.style.position = 'fixed';
letterModal.style.top = '0';
letterModal.style.left = '0';
letterModal.style.width = '100vw';
letterModal.style.height = '100vh';
letterModal.style.background = 'rgba(0, 0, 0, 0.85)'; // Dark romantic background
letterModal.style.zIndex = '200';
letterModal.style.display = 'none'; 
letterModal.style.justifyContent = 'center';
letterModal.style.alignItems = 'center';
letterModal.style.opacity = '0';
letterModal.style.transition = 'opacity 0.5s ease';

// 3. Create the paper design
const letterContent = document.createElement('div');
letterContent.style.background = '#fdfbfb'; 
letterContent.style.padding = '40px';
letterContent.style.borderRadius = '15px';
letterContent.style.maxWidth = '500px';
letterContent.style.width = '85%';
letterContent.style.textAlign = 'center';
letterContent.style.fontFamily = '"Times New Roman", serif';
letterContent.style.color = '#333';
letterContent.style.boxShadow = '0 0 30px rgba(255, 216, 131, 0.4)';
letterContent.style.transform = 'scale(0.8)';
letterContent.style.transition = 'transform 0.5s ease';

// ---------------------------------------------------------
// *** EDIT YOUR LETTER HERE ***
// Just change the text between the <p> and </p> tags!
// ---------------------------------------------------------
letterContent.innerHTML = `
    <h2 style="font-style: italic; margin-bottom: 20px; font-size: 28px; color: #b56576;">My Dearest, Ria</h2>
    
    <p style="font-size: 18px; line-height: 1.6; margin-bottom: 15px;">
        Happy 1st anniversary! I can't believe it how we're always together since our first date. I can still remember how I was feeling that day—the nervousness and the excitement. Though you teased me a lot :<
        But I'm thankful enough to say thank you for having the courage to be with me all the time. Thank you for staying and having the patience for loving me. Thank you for existing in this world. I didn't know I needed someone this deep and I'm glad it's you.
        I don't know where this leads us, but I hope you'll stay with me, and I'll keep you safe despite all.
    </p>
    
    <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
        I love you endlessly, completely, and with every piece of who I am.
    </p>
`;
// ---------------------------------------------------------

// 4. Create the close button
const closeLetterBtn = document.createElement('button');
closeLetterBtn.innerText = "Close Letter";
closeLetterBtn.style.padding = '10px 25px';
closeLetterBtn.style.fontSize = '16px';
closeLetterBtn.style.fontFamily = '"Times New Roman", serif';
closeLetterBtn.style.background = '#b56576';
closeLetterBtn.style.color = 'white';
closeLetterBtn.style.border = 'none';
closeLetterBtn.style.borderRadius = '20px';
closeLetterBtn.style.cursor = 'pointer';

letterContent.appendChild(closeLetterBtn);
letterModal.appendChild(letterContent);
document.body.appendChild(letterModal);

// 5. Make the buttons actually work
letterBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    letterModal.style.display = 'flex';
    setTimeout(() => {
        letterModal.style.opacity = '1';
        letterContent.style.transform = 'scale(1)';
    }, 10);
});

closeLetterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    letterModal.style.opacity = '0';
    letterContent.style.transform = 'scale(0.8)';
    setTimeout(() => {
        letterModal.style.display = 'none';
    }, 500);
});

// ==========================================
// BUTTON LOGIC FOR GALLERY TRANSITIONS
// ==========================================
if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        heartCanvas.style.display = 'none';
        enterBtn.style.display = 'none';
        letterBtn.style.display = 'none'; // Hides the letter button when going to gallery
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
        letterBtn.style.display = 'block'; // Brings the letter button back
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
