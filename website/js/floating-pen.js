document.addEventListener('DOMContentLoaded', () => {
    // Disable on smart-board since it has its own tools
    if (window.location.pathname.includes('/smart-board')) return;

    // Inject the HTML structure
    const widgetHTML = `
      <canvas id="floating-pen-canvas"></canvas>
      <div id="fp-custom-cursor"></div>

      <div id="floating-pen-toolbar">
          <!-- Main Tools -->
          <div class="fp-tool-group">
            <button class="fp-tool-btn active" id="fp-pen-btn" title="Pen">✏️</button>
            <button class="fp-tool-btn" id="fp-highlighter-btn" title="Highlighter">🖍️</button>
            <button class="fp-tool-btn" id="fp-eraser-btn" title="Eraser">🧼</button>
          </div>
          <div class="fp-divider"></div>
          
          <!-- Colors -->
          <div class="fp-color-group" id="fp-color-group">
            <div class="fp-color-swatch active" style="background:#ff3b30;" data-color="#ff3b30"></div>
            <div class="fp-color-swatch" style="background:#4cd964;" data-color="#4cd964"></div>
            <div class="fp-color-swatch" style="background:#007aff;" data-color="#007aff"></div>
            <div class="fp-color-swatch" style="background:#ffcc00;" data-color="#ffcc00"></div>
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
            <button class="fp-tool-btn" id="fp-fullscreen-btn" title="Full Screen">🔲</button>
          </div>
      </div>
      <button id="floating-pen-fab" title="Draw on Page">✏️</button>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const canvas = document.getElementById('floating-pen-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const fab = document.getElementById('floating-pen-fab');
    const toolbar = document.getElementById('floating-pen-toolbar');
    const customCursor = document.getElementById('fp-custom-cursor');

    let isDrawingMode = false;
    let isDrawing = false;
    let currentTool = 'pen';
    let currentColor = '#ff3b30';
    let currentSize = 4;
    
    // History for Undo/Redo
    let history = [];
    let currentPath = [];
    let startPos = {x: 0, y: 0};

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
        document.body.classList.add('fp-cursor-crosshair');

        customCursor.style.background = currentTool === 'eraser' ? '#ffffff' : currentColor;
        customCursor.style.borderColor = currentTool === 'eraser' ? '#000000' : currentColor;
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
            ctx.globalAlpha = 0.4; // Opacity for highlight
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
            // Request full screen
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => console.log(e));
            }
            
            document.body.classList.add('drawing-mode-active');
            toolbar.classList.add('active');
            fab.style.backgroundColor = '#ff3b30';
            fab.innerText = '❌';
            resizeCanvas();
            updateCursor();
            customCursor.style.display = 'block';
        } else {
            // Exit full screen
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(e => console.log(e));
            }
            
            document.body.classList.remove('drawing-mode-active');
            toolbar.classList.remove('active');
            fab.style.backgroundColor = 'var(--accent)';
            fab.innerText = '✏️';
            customCursor.style.display = 'none';
        }
    });

    // Setup Tools
    const tools = ['pen', 'highlighter', 'eraser'];
    tools.forEach(t => {
        const btn = document.getElementById(`fp-${t}-btn`);
        if (btn) {
            btn.addEventListener('click', () => {
                currentTool = t;
                document.querySelectorAll('.fp-tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                setContextStyle();
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

    // Actions
    document.getElementById('fp-undo-btn').addEventListener('click', () => {
        history.pop();
        redrawHistory();
    });
    
    document.getElementById('fp-clear-btn').addEventListener('click', () => {
        history = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById('fp-fullscreen-btn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    });

    // Drawing Logic
    const getPos = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        customCursor.style.left = clientX + 'px';
        customCursor.style.top = clientY + 'px';
        
        return {
            x: clientX + window.scrollX,
            y: clientY + window.scrollY
        };
    };

    const startDraw = (e) => {
        if (!isDrawingMode) return;
        isDrawing = true;
        const pos = getPos(e);
        startPos = pos;
        
        setContextStyle();
        currentPath = [{x: pos.x, y: pos.y}];

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
        getPos(e); // Updates cursor
        if (!isDrawing) return;
        const pos = getPos(e);
        
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        currentPath.push({x: pos.x, y: pos.y});
    };

    const stopDraw = (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        const pos = getPos(e || {clientX: startPos.x, clientY: startPos.y, touches:[{clientX: startPos.x, clientY: startPos.y}]});
        
        history.push({
            tool: currentTool,
            color: currentColor,
            size: currentSize,
            path: currentPath,
            startPos: startPos,
            endPos: pos
        });
        ctx.closePath();
    };

    function redrawHistory() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        history.forEach(item => {
            ctx.globalCompositeOperation = (item.tool === 'eraser') ? 'destination-out' : (item.tool === 'highlighter' ? 'multiply' : 'source-over');
            ctx.globalAlpha = (item.tool === 'highlighter') ? 0.4 : 1.0;
            ctx.strokeStyle = item.color;
            ctx.fillStyle = item.color;
            
            ctx.lineWidth = item.tool === 'eraser' ? item.size * 5 : (item.tool === 'highlighter' ? item.size * 4 : item.size);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            if (item.path.length > 0) {
                ctx.moveTo(item.path[0].x, item.path[0].y);
                for (let i = 1; i < item.path.length; i++) ctx.lineTo(item.path[i].x, item.path[i].y);
            }
            ctx.stroke();
        });
        setContextStyle();
    }

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
});

