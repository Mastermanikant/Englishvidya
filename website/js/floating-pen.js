document.addEventListener('DOMContentLoaded', () => {
    // Inject the HTML structure into the body
    const widgetHTML = `
      <canvas id="floating-pen-canvas"></canvas>
      <div id="floating-pen-toolbar">
          <button class="fp-tool-btn active" id="fp-pen-btn" title="Pen (Red)">✏️</button>
          <button class="fp-tool-btn" id="fp-highlighter-btn" title="Highlighter (Yellow)">🖍️</button>
          <button class="fp-tool-btn" id="fp-eraser-btn" title="Eraser">🧼</button>
          <button class="fp-tool-btn" id="fp-clear-btn" title="Clear All">🗑️</button>
          <button class="fp-tool-btn" id="fp-screenshot-btn" title="Save Screenshot">📸</button>
      </div>
      <button id="floating-pen-fab" title="Draw on Page">✏️</button>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const canvas = document.getElementById('floating-pen-canvas');
    const ctx = canvas.getContext('2d');
    const fab = document.getElementById('floating-pen-fab');
    const toolbar = document.getElementById('floating-pen-toolbar');
    
    // Tools
    const btnPen = document.getElementById('fp-pen-btn');
    const btnHighlighter = document.getElementById('fp-highlighter-btn');
    const btnEraser = document.getElementById('fp-eraser-btn');
    const btnClear = document.getElementById('fp-clear-btn');
    const btnScreenshot = document.getElementById('fp-screenshot-btn');

    let isDrawingMode = false;
    let isDrawing = false;
    let currentMode = 'pen'; // pen, highlighter, eraser

    // Resize canvas to cover the whole scrollable document
    function resizeCanvas() {
        canvas.width = document.documentElement.scrollWidth;
        canvas.height = document.documentElement.scrollHeight;
        // Keep drawn content on resize? Simplest approach is to let it clear or save/restore.
        // For a basic overlay, clearing on resize is acceptable, but let's try not to if possible.
        setContextStyle();
    }
    
    window.addEventListener('resize', resizeCanvas);
    // Observe DOM changes to resize if content height changes
    const observer = new ResizeObserver(() => {
        if (!isDrawingMode) resizeCanvas();
    });
    observer.observe(document.body);
    resizeCanvas();

    function setContextStyle() {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (currentMode === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = '#ff3b30'; // Red
            ctx.lineWidth = 4;
            ctx.globalAlpha = 1.0;
        } else if (currentMode === 'highlighter') {
            ctx.globalCompositeOperation = 'multiply';
            ctx.strokeStyle = '#ffcc00'; // Yellow
            ctx.lineWidth = 20;
            ctx.globalAlpha = 0.5;
        } else if (currentMode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = 30;
            ctx.globalAlpha = 1.0;
        }
    }

    fab.addEventListener('click', () => {
        isDrawingMode = !isDrawingMode;
        if (isDrawingMode) {
            document.body.classList.add('drawing-mode-active');
            toolbar.classList.add('active');
            fab.style.backgroundColor = '#ff3b30';
            fab.innerText = '❌';
            resizeCanvas(); // Ensure canvas is perfect size before drawing starts
        } else {
            document.body.classList.remove('drawing-mode-active');
            toolbar.classList.remove('active');
            fab.style.backgroundColor = 'var(--accent)';
            fab.innerText = '✏️';
        }
    });

    const setActiveTool = (mode, btn) => {
        currentMode = mode;
        document.querySelectorAll('.fp-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setContextStyle();
    };

    btnPen.addEventListener('click', () => setActiveTool('pen', btnPen));
    btnHighlighter.addEventListener('click', () => setActiveTool('highlighter', btnHighlighter));
    btnEraser.addEventListener('click', () => setActiveTool('eraser', btnEraser));
    
    btnClear.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Drawing Logic
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        // Adjust for scroll
        return {
            x: clientX + window.scrollX - rect.left,
            y: clientY + window.scrollY - rect.top
        };
    };

    const startDraw = (e) => {
        if (!isDrawingMode) return;
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    };

    const draw = (e) => {
        if (!isDrawing || !isDrawingMode) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        e.preventDefault();
    };

    const stopDraw = () => {
        if (!isDrawingMode) return;
        isDrawing = false;
        ctx.closePath();
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseout', stopDraw);

    // Touch events
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    // Screenshot Logic
    btnScreenshot.addEventListener('click', () => {
        const originalText = btnScreenshot.innerText;
        btnScreenshot.innerText = '⏳';
        
        // Disable drawing mode temporarily for clean screenshot if desired, but we want the drawing!
        const performCapture = () => {
            html2canvas(document.body, {
                scrollY: -window.scrollY,
                windowWidth: document.documentElement.clientWidth,
                windowHeight: document.documentElement.clientHeight,
                ignoreElements: (element) => {
                    return element.id === 'floating-pen-toolbar' || element.id === 'floating-pen-fab';
                }
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'EnglishVidya-Notes.png';
                link.href = canvas.toDataURL();
                link.click();
                btnScreenshot.innerText = originalText;
            }).catch(err => {
                console.error("Screenshot failed", err);
                alert("Failed to capture screenshot.");
                btnScreenshot.innerText = originalText;
            });
        };

        if (typeof html2canvas === 'undefined') {
            const script = document.createElement('script');
            script.src = '/assets/js/html2canvas.min.js';
            script.onload = performCapture;
            document.body.appendChild(script);
        } else {
            performCapture();
        }
    });
});
