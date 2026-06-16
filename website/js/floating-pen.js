document.addEventListener('DOMContentLoaded', () => {
    // Disable on smart-board
    if (window.location.pathname.includes('/smart-board')) return;

    // Inject the HTML structure
    const widgetHTML = `
      <div id="fp-board-overlay"></div>
      <canvas id="floating-pen-canvas"></canvas>
      <input type="text" id="fp-text-input" placeholder="Type here..." autocomplete="off">
      <div id="fp-custom-cursor"></div>
      <div id="fp-spotlight-overlay"></div>
      <div id="fp-magnifier"></div>

      <div id="floating-pen-toolbar">
          <!-- Main Tools -->
          <div class="fp-tool-group">
            <button class="fp-tool-btn active" id="fp-pen-btn" title="Pen">✏️</button>
            <button class="fp-tool-btn" id="fp-highlighter-btn" title="Highlighter">🖍️</button>
            <button class="fp-tool-btn" id="fp-laser-btn" title="Fading Laser">✨</button>
          </div>
          <div class="fp-tool-group">
            <button class="fp-tool-btn" id="fp-line-btn" title="Line">📏</button>
            <button class="fp-tool-btn" id="fp-rect-btn" title="Rectangle">⬜</button>
            <button class="fp-tool-btn" id="fp-circle-btn" title="Circle">⭕</button>
          </div>
          <div class="fp-tool-group">
            <button class="fp-tool-btn" id="fp-arrow-btn" title="Arrow">↗️</button>
            <button class="fp-tool-btn" id="fp-text-btn" title="Text">T</button>
            <button class="fp-tool-btn" id="fp-eraser-btn" title="Eraser">🧼</button>
          </div>
          <div class="fp-divider"></div>

          <!-- FX Tools -->
          <div class="fp-tool-group">
            <button class="fp-tool-btn" id="fp-spotlight-btn" title="Spotlight">🔦</button>
            <button class="fp-tool-btn" id="fp-magnifier-btn" title="Magnifier">🔎</button>
            <button class="fp-tool-btn" id="fp-board-btn" title="White/Blackboard">📋</button>
          </div>
          <div class="fp-divider"></div>
          
          <!-- Colors -->
          <div class="fp-color-group" id="fp-color-group">
            <div class="fp-color-swatch active" style="background:#ff3b30;" data-color="#ff3b30"></div>
            <div class="fp-color-swatch" style="background:#4cd964;" data-color="#4cd964"></div>
            <div class="fp-color-swatch" style="background:#007aff;" data-color="#007aff"></div>
            <div class="fp-color-swatch" style="background:#ffcc00;" data-color="#ffcc00"></div>
            <div class="fp-color-swatch" style="background:#ffffff;" data-color="#ffffff"></div>
            <div class="fp-color-swatch" style="background:#111111;" data-color="#111111"></div>
            <input type="color" class="fp-color-picker" id="fp-color-picker" value="#ff3b30" title="Custom Color">
          </div>
          
          <!-- Size -->
          <div class="fp-size-group">
            <span style="font-size:12px;">Size:</span>
            <input type="range" class="fp-size-slider" id="fp-size-slider" min="1" max="40" value="4">
          </div>
          <div class="fp-divider"></div>

          <!-- Actions -->
          <div class="fp-tool-group">
            <button class="fp-tool-btn" id="fp-undo-btn" title="Undo">↩️</button>
            <button class="fp-tool-btn" id="fp-clear-btn" title="Clear">💣</button>
            <button class="fp-tool-btn" id="fp-screenshot-btn" title="Screenshot">📸</button>
          </div>
      </div>
      <button id="floating-pen-fab" title="Draw on Page">✏️</button>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const canvas = document.getElementById('floating-pen-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const fab = document.getElementById('floating-pen-fab');
    const toolbar = document.getElementById('floating-pen-toolbar');
    const textInput = document.getElementById('fp-text-input');
    const customCursor = document.getElementById('fp-custom-cursor');
    const spotlightOverlay = document.getElementById('fp-spotlight-overlay');
    const magnifier = document.getElementById('fp-magnifier');
    const boardOverlay = document.getElementById('fp-board-overlay');

    let isDrawingMode = false;
    let isDrawing = false;
    let currentTool = 'pen';
    let currentColor = '#ff3b30';
    let currentSize = 4;
    
    // History for Undo/Redo
    let history = [];
    let currentPath = [];
    let startPos = {x: 0, y: 0};
    
    // Base image for snapshotting during shape drawing
    let snapshotCanvas = null;

    // Fading strokes array
    let laserStrokes = [];

    let boardState = 0; // 0=none, 1=white, 2=black

    function resizeCanvas() {
        canvas.width = document.documentElement.scrollWidth;
        canvas.height = document.documentElement.scrollHeight;
        redrawHistory();
    }
    
    window.addEventListener('resize', resizeCanvas);
    const observer = new ResizeObserver(() => {
        if (!isDrawingMode) {
            canvas.width = document.documentElement.scrollWidth;
            canvas.height = document.documentElement.scrollHeight;
        }
    });
    observer.observe(document.body);
    resizeCanvas();

    function updateCursor() {
        document.body.classList.remove('fp-cursor-crosshair', 'fp-cursor-text', 'fp-cursor-none');
        if (currentTool === 'text') document.body.classList.add('fp-cursor-text');
        else if (currentTool === 'spotlight' || currentTool === 'magnifier') document.body.classList.add('fp-cursor-none');
        else document.body.classList.add('fp-cursor-crosshair');

        customCursor.style.background = currentColor;
        customCursor.style.borderColor = currentColor;
        customCursor.style.width = currentSize + 'px';
        customCursor.style.height = currentSize + 'px';
    }

    function setContextStyle() {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentColor;
        ctx.fillStyle = currentColor;
        ctx.lineWidth = currentSize;
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';

        if (currentTool === 'highlighter') {
            ctx.globalAlpha = 0.4;
            ctx.globalCompositeOperation = 'multiply';
            ctx.lineWidth = currentSize * 4;
        } else if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = currentSize * 5;
        }
        
        updateCursor();
    }

    // Toggle Mode
    fab.addEventListener('click', () => {
        isDrawingMode = !isDrawingMode;
        if (isDrawingMode) {
            document.body.classList.add('drawing-mode-active');
            toolbar.classList.add('active');
            fab.style.backgroundColor = '#ff3b30';
            fab.innerText = '❌';
            resizeCanvas();
            updateCursor();
            customCursor.style.display = 'block';
        } else {
            document.body.classList.remove('drawing-mode-active');
            toolbar.classList.remove('active');
            fab.style.backgroundColor = 'var(--accent)';
            fab.innerText = '✏️';
            customCursor.style.display = 'none';
            spotlightOverlay.style.display = 'none';
            magnifier.style.display = 'none';
            textInput.style.display = 'none';
            boardOverlay.className = '';
            boardState = 0;
        }
    });

    // Setup Tools
    const tools = ['pen', 'highlighter', 'laser', 'line', 'rect', 'circle', 'arrow', 'text', 'eraser', 'spotlight', 'magnifier'];
    tools.forEach(t => {
        const btn = document.getElementById(`fp-${t}-btn`);
        if (btn) {
            btn.addEventListener('click', () => {
                currentTool = t;
                document.querySelectorAll('.fp-tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                setContextStyle();
                
                spotlightOverlay.style.display = t === 'spotlight' ? 'block' : 'none';
                magnifier.style.display = t === 'magnifier' ? 'block' : 'none';
                if(t !== 'text') textInput.style.display = 'none';
            });
        }
    });

    // Colors
    document.querySelectorAll('.fp-color-swatch').forEach(sw => {
        sw.addEventListener('click', (e) => {
            document.querySelectorAll('.fp-color-swatch').forEach(s => s.classList.remove('active'));
            sw.classList.add('active');
            currentColor = sw.dataset.color;
            document.getElementById('fp-color-picker').value = currentColor;
            setContextStyle();
        });
    });
    document.getElementById('fp-color-picker').addEventListener('input', (e) => {
        document.querySelectorAll('.fp-color-swatch').forEach(s => s.classList.remove('active'));
        currentColor = e.target.value;
        setContextStyle();
    });

    // Size
    document.getElementById('fp-size-slider').addEventListener('input', (e) => {
        currentSize = parseInt(e.target.value);
        setContextStyle();
    });

    // Board Toggle
    document.getElementById('fp-board-btn').addEventListener('click', () => {
        boardState = (boardState + 1) % 3;
        boardOverlay.className = '';
        if (boardState === 1) boardOverlay.classList.add('whiteboard');
        if (boardState === 2) boardOverlay.classList.add('blackboard');
    });

    // Actions
    document.getElementById('fp-undo-btn').addEventListener('click', () => {
        history.pop();
        redrawHistory();
    });
    
    document.getElementById('fp-clear-btn').addEventListener('click', () => {
        history = [];
        laserStrokes = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        textInput.style.display = 'none';
    });

    // Drawing Logic
    const getPos = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        customCursor.style.left = clientX + 'px';
        customCursor.style.top = clientY + 'px';
        
        if (currentTool === 'spotlight') {
            spotlightOverlay.style.background = `radial-gradient(circle 150px at ${clientX}px ${clientY}px, transparent 0%, rgba(0,0,0,0.85) 100%)`;
        }
        if (currentTool === 'magnifier') {
            magnifier.style.left = clientX + 'px';
            magnifier.style.top = clientY + 'px';
            // Create magnifier effect using html2canvas later or just scale background
            // Due to limitations, we'll do a simple trick if possible, or skip actual magnification without heavy libraries.
        }

        return {
            x: clientX + window.scrollX,
            y: clientY + window.scrollY
        };
    };

    const startDraw = (e) => {
        if (!isDrawingMode || currentTool === 'spotlight' || currentTool === 'magnifier') return;
        isDrawing = true;
        const pos = getPos(e);
        startPos = pos;
        
        if (currentTool === 'text') {
            if (textInput.style.display === 'block' && textInput.value.trim() !== '') {
                saveTextToHistory();
            }
            textInput.style.display = 'block';
            textInput.style.left = pos.x + 'px';
            textInput.style.top = (pos.y - 10) + 'px';
            textInput.style.color = currentColor;
            textInput.style.fontSize = (currentSize * 5 + 10) + 'px';
            textInput.value = '';
            textInput.focus();
            isDrawing = false;
            return;
        }

        setContextStyle();
        currentPath = [{x: pos.x, y: pos.y}];
        snapshotCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if(currentTool === 'pen' || currentTool === 'laser' || currentTool === 'highlighter' || currentTool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    };

    const draw = (e) => {
        getPos(e); // Updates cursor/spotlight
        if (!isDrawing) return;
        const pos = getPos(e);
        
        if (currentTool === 'pen' || currentTool === 'laser' || currentTool === 'highlighter' || currentTool === 'eraser') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            currentPath.push({x: pos.x, y: pos.y});
        } else {
            // Shapes: restore snapshot and draw new shape bounds
            ctx.putImageData(snapshotCanvas, 0, 0);
            ctx.beginPath();
            if (currentTool === 'line') {
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(pos.x, pos.y);
            } else if (currentTool === 'rect') {
                ctx.rect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
            } else if (currentTool === 'circle') {
                const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
                ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            } else if (currentTool === 'arrow') {
                const headlen = 15 + currentSize; 
                const dx = pos.x - startPos.x;
                const dy = pos.y - startPos.y;
                const angle = Math.atan2(dy, dx);
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
            }
            ctx.stroke();
        }
    };

    const stopDraw = (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        if (currentTool !== 'text' && currentTool !== 'spotlight' && currentTool !== 'magnifier') {
            const pos = getPos(e || {clientX: startPos.x, clientY: startPos.y, touches:[{clientX: startPos.x, clientY: startPos.y}]});
            
            if (currentTool === 'laser') {
                laserStrokes.push({
                    path: currentPath,
                    color: currentColor,
                    size: currentSize,
                    time: Date.now()
                });
            } else {
                history.push({
                    tool: currentTool,
                    color: currentColor,
                    size: currentSize,
                    path: currentPath,
                    startPos: startPos,
                    endPos: pos
                });
            }
            ctx.closePath();
        }
    };

    function saveTextToHistory() {
        if (textInput.value.trim() !== '') {
            history.push({
                tool: 'text',
                color: textInput.style.color,
                size: textInput.style.fontSize,
                text: textInput.value,
                pos: {x: parseInt(textInput.style.left), y: parseInt(textInput.style.top) + parseInt(textInput.style.fontSize)}
            });
            redrawHistory();
        }
        textInput.style.display = 'none';
        textInput.value = '';
    }

    textInput.addEventListener('blur', saveTextToHistory);
    textInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') saveTextToHistory(); });

    function redrawHistory() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        history.forEach(item => {
            ctx.globalCompositeOperation = (item.tool === 'eraser') ? 'destination-out' : (item.tool === 'highlighter' ? 'multiply' : 'source-over');
            ctx.globalAlpha = (item.tool === 'highlighter') ? 0.4 : 1.0;
            ctx.strokeStyle = item.color;
            ctx.fillStyle = item.color;
            
            if (item.tool === 'text') {
                ctx.font = item.size + ' inherit';
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillText(item.text, item.pos.x, item.pos.y);
                return;
            }

            ctx.lineWidth = item.tool === 'eraser' ? item.size * 5 : (item.tool === 'highlighter' ? item.size * 4 : item.size);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            if (item.tool === 'pen' || item.tool === 'highlighter' || item.tool === 'eraser') {
                if (item.path.length > 0) {
                    ctx.moveTo(item.path[0].x, item.path[0].y);
                    for (let i = 1; i < item.path.length; i++) ctx.lineTo(item.path[i].x, item.path[i].y);
                }
            } else if (item.tool === 'line') {
                ctx.moveTo(item.startPos.x, item.startPos.y);
                ctx.lineTo(item.endPos.x, item.endPos.y);
            } else if (item.tool === 'rect') {
                ctx.rect(item.startPos.x, item.startPos.y, item.endPos.x - item.startPos.x, item.endPos.y - item.startPos.y);
            } else if (item.tool === 'circle') {
                const radius = Math.sqrt(Math.pow(item.endPos.x - item.startPos.x, 2) + Math.pow(item.endPos.y - item.startPos.y, 2));
                ctx.arc(item.startPos.x, item.startPos.y, radius, 0, 2 * Math.PI);
            } else if (item.tool === 'arrow') {
                const headlen = 15 + item.size; 
                const dx = item.endPos.x - item.startPos.x;
                const dy = item.endPos.y - item.startPos.y;
                const angle = Math.atan2(dy, dx);
                ctx.moveTo(item.startPos.x, item.startPos.y);
                ctx.lineTo(item.endPos.x, item.endPos.y);
                ctx.lineTo(item.endPos.x - headlen * Math.cos(angle - Math.PI / 6), item.endPos.y - headlen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(item.endPos.x, item.endPos.y);
                ctx.lineTo(item.endPos.x - headlen * Math.cos(angle + Math.PI / 6), item.endPos.y - headlen * Math.sin(angle + Math.PI / 6));
            }
            ctx.stroke();
        });
        setContextStyle();
    }

    // Laser Animation Loop
    function animateLaser() {
        if (!isDrawingMode) {
            requestAnimationFrame(animateLaser);
            return;
        }
        
        const now = Date.now();
        // Remove strokes older than 2s
        const validLasers = laserStrokes.filter(l => now - l.time < 2000);
        if (validLasers.length !== laserStrokes.length) {
            laserStrokes = validLasers;
            redrawHistory(); // Clear dead lasers by redrawing base
        }

        if (laserStrokes.length > 0) {
            redrawHistory(); // Draw base history first
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            laserStrokes.forEach(l => {
                const age = now - l.time;
                const alpha = 1 - (age / 2000);
                if (alpha <= 0) return;
                
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = l.color;
                ctx.lineWidth = l.size;
                ctx.beginPath();
                if (l.path.length > 0) {
                    ctx.moveTo(l.path[0].x, l.path[0].y);
                    for (let i = 1; i < l.path.length; i++) ctx.lineTo(l.path[i].x, l.path[i].y);
                }
                ctx.stroke();
            });
            setContextStyle();
        }
        
        requestAnimationFrame(animateLaser);
    }
    requestAnimationFrame(animateLaser);

    // Mouse events
    document.addEventListener('mousedown', (e) => {
        if(isDrawingMode && e.target.id !== 'floating-pen-toolbar' && !toolbar.contains(e.target)) startDraw(e);
    });
    document.addEventListener('mousemove', (e) => {
        if(isDrawingMode) draw(e);
    });
    document.addEventListener('mouseup', stopDraw);

    // Touch events
    document.addEventListener('touchstart', (e) => {
        if(isDrawingMode && e.target.id !== 'floating-pen-toolbar' && !toolbar.contains(e.target)) startDraw(e);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if(isDrawingMode) {
            if (e.target.id !== 'floating-pen-toolbar' && !toolbar.contains(e.target)) {
                e.preventDefault();
                draw(e);
            }
        }
    }, { passive: false });
    document.addEventListener('touchend', stopDraw);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (!isDrawingMode || e.target === textInput) return;
        if (e.ctrlKey && e.key === 'z') {
            history.pop();
            redrawHistory();
        }
        if (e.key === 'p') document.getElementById('fp-pen-btn').click();
        if (e.key === 'e') document.getElementById('fp-eraser-btn').click();
        if (e.key === 't') document.getElementById('fp-text-btn').click();
    });

    // Screenshot
    document.getElementById('fp-screenshot-btn').addEventListener('click', () => {
        const originalText = document.getElementById('fp-screenshot-btn').innerText;
        document.getElementById('fp-screenshot-btn').innerText = '⏳';
        
        const performCapture = () => {
            html2canvas(document.body, {
                scrollY: -window.scrollY,
                windowWidth: document.documentElement.clientWidth,
                windowHeight: document.documentElement.clientHeight,
                ignoreElements: (element) => element.id === 'floating-pen-toolbar' || element.id === 'floating-pen-fab' || element.id === 'fp-custom-cursor'
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'EnglishVidya-Notes.png';
                link.href = canvas.toDataURL();
                link.click();
                document.getElementById('fp-screenshot-btn').innerText = originalText;
            }).catch(err => {
                alert("Failed to capture screenshot.");
                document.getElementById('fp-screenshot-btn').innerText = originalText;
            });
        };

        if (typeof html2canvas === 'undefined') {
            const script = document.createElement('script');
            script.src = '/assets/js/html2canvas.min.js';
            script.onload = performCapture;
            document.body.appendChild(script);
        } else performCapture();
    });
});

