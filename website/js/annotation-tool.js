/**
 * EnglishVidya Annotation Tool Engine (10/10 Masterpiece Edition)
 * Zero-dependency, pure Vanilla JS object-based canvas engine.
 */

(function() {
    if (window.EVAnnotationEngine) return;

    class EVAnnotationEngine {
        constructor() {
            this.isActive = false;
            this.isGhostMode = false;
            
            this.container = null;
            this.canvas = null;
            this.ctx = null;
            this.domHighlightLayer = null;
            
            // State
            this.currentTool = 'pen'; // pen, highlighter, eraser, line, arrow, rect, circle, text, step, move
            this.color = '#ffeb3b';
            this.thickness = 4;
            
            // Object-Based Engine
            this.objects = [];
            this.redoStack = [];
            this.currentObject = null;
            this.isDrawing = false;
            this.isMoving = false;
            this.selectedObject = null;
            
            // Math
            this.lastPoint = null;
            this.stepCounter = 1;
            
            this.initUI();
            this.loadState();
        }

        initUI() {
            // Container
            this.container = document.createElement('div');
            this.container.id = 'ev-annotation-container';
            this.container.style.position = 'fixed';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100vw';
            this.container.style.height = '100vh';
            this.container.style.zIndex = '999999';
            this.container.style.pointerEvents = 'none'; // Initially off
            this.container.style.display = 'none';
            
            // DOM Highlight Layer (for smart text snapping)
            this.domHighlightLayer = document.createElement('div');
            this.domHighlightLayer.id = 'ev-dom-highlight-layer';
            this.domHighlightLayer.style.position = 'absolute';
            this.domHighlightLayer.style.top = '0';
            this.domHighlightLayer.style.left = '0';
            this.domHighlightLayer.style.width = '100%';
            this.domHighlightLayer.style.height = '100%';
            this.domHighlightLayer.style.pointerEvents = 'none';
            this.container.appendChild(this.domHighlightLayer);

            // Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.pointerEvents = 'auto'; // Catch clicks when active
            this.container.appendChild(this.canvas);
            
            document.body.appendChild(this.container);
            
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
            this.bindEvents();
            this.buildToolbar();
        }

        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.render(); // Re-render objects on resize
        }

        buildToolbar() {
            this.toolbar = document.createElement('div');
            this.toolbar.className = 'ev-toolbar';
            this.toolbar.id = 'ev-annotation-toolbar';
            this.toolbar.style.display = 'none';

            // Drag handle
            const handle = document.createElement('div');
            handle.className = 'ev-toolbar-handle';
            
            // Make draggable
            let isDragging = false;
            let startX, startY, initialLeft, initialTop;
            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX; startY = e.clientY;
                const rect = this.toolbar.getBoundingClientRect();
                initialLeft = rect.left; initialTop = rect.top;
                this.toolbar.style.right = 'auto';
            });
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                this.toolbar.style.left = (initialLeft + dx) + 'px';
                this.toolbar.style.top = (initialTop + dy) + 'px';
            });
            document.addEventListener('mouseup', () => isDragging = false);

            this.toolbar.appendChild(handle);

            // Tools group
            const toolsGroup = document.createElement('div');
            toolsGroup.className = 'ev-tools-group';
            
            const tools = [
                { id: 'move', icon: '👆', title: 'Move/Select' },
                { id: 'pen', icon: '✏️', title: 'Pen' },
                { id: 'highlighter', icon: '🖍️', title: 'Highlighter' },
                { id: 'eraser', icon: '🧽', title: 'Eraser' },
                { id: 'line', icon: '📏', title: 'Line' },
                { id: 'arrow', icon: '↗️', title: 'Arrow' },
                { id: 'rect', icon: '⬜', title: 'Rectangle' },
                { id: 'circle', icon: '◯', title: 'Circle' },
                { id: 'text', icon: 'T', title: 'Text' },
                { id: 'step', icon: '①', title: 'Step Counter' },
            ];

            this.toolBtns = {};
            tools.forEach(t => {
                const btn = document.createElement('button');
                btn.className = `ev-tool-btn ${this.currentTool === t.id ? 'active' : ''}`;
                btn.innerHTML = t.icon;
                btn.title = t.title;
                btn.onclick = () => this.setTool(t.id);
                this.toolBtns[t.id] = btn;
                toolsGroup.appendChild(btn);
            });
            this.toolbar.appendChild(toolsGroup);

            // Actions group
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'ev-tools-group';
            actionsGroup.style.borderTop = '1px solid rgba(255,255,255,0.1)';
            actionsGroup.style.paddingTop = '4px';

            const undoBtn = document.createElement('button');
            undoBtn.className = 'ev-tool-btn'; undoBtn.innerHTML = '↩️'; undoBtn.title = 'Undo (Ctrl+Z)';
            undoBtn.onclick = () => this.undo();
            actionsGroup.appendChild(undoBtn);

            const clearBtn = document.createElement('button');
            clearBtn.className = 'ev-tool-btn'; clearBtn.innerHTML = '🗑️'; clearBtn.title = 'Clear All';
            clearBtn.onclick = () => this.clear();
            actionsGroup.appendChild(clearBtn);

            // Ghost Mode toggle
            this.ghostBtn = document.createElement('button');
            this.ghostBtn.className = 'ev-tool-btn'; this.ghostBtn.innerHTML = '👻'; this.ghostBtn.title = 'Ghost Mode (Click-Through)';
            this.ghostBtn.onclick = () => this.toggleGhostMode();
            actionsGroup.appendChild(this.ghostBtn);

            this.toolbar.appendChild(actionsGroup);

            // Color picker
            const colorsRow = document.createElement('div');
            colorsRow.className = 'ev-color-picker';
            const colors = ['#ffffff', '#ffeb3b', '#4caf50', '#f44336', '#2196f3', '#000000'];
            colors.forEach(c => {
                const cbtn = document.createElement('div');
                cbtn.className = `ev-color-btn ${this.color === c ? 'active' : ''}`;
                cbtn.style.backgroundColor = c;
                cbtn.onclick = (e) => {
                    document.querySelectorAll('.ev-color-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.color = c;
                };
                colorsRow.appendChild(cbtn);
            });
            this.toolbar.appendChild(colorsRow);

            // Thickness slider
            const thickRow = document.createElement('div');
            thickRow.className = 'ev-thickness-control';
            const slider = document.createElement('input');
            slider.type = 'range'; slider.min = '1'; slider.max = '20'; slider.value = this.thickness;
            slider.oninput = (e) => this.thickness = parseInt(e.target.value);
            thickRow.appendChild(slider);
            this.toolbar.appendChild(thickRow);

            document.body.appendChild(this.toolbar);
        }

        setTool(toolId) {
            this.currentTool = toolId;
            Object.values(this.toolBtns).forEach(b => b.classList.remove('active'));
            if(this.toolBtns[toolId]) this.toolBtns[toolId].classList.add('active');
            
            // Adjust pointer events if moving
            if (toolId === 'move') {
                this.canvas.style.cursor = 'default';
            } else if (toolId === 'text') {
                this.canvas.style.cursor = 'text';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }

        toggleGhostMode() {
            this.isGhostMode = !this.isGhostMode;
            if (this.isGhostMode) {
                this.container.classList.add('ghost-mode');
                this.ghostBtn.classList.add('ghost-active');
            } else {
                this.container.classList.remove('ghost-mode');
                this.ghostBtn.classList.remove('ghost-active');
            }
        }

        bindEvents() {
            // Pointer events for drawing
            this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
            this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
            this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
            this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (!this.isActive) return;
                if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
                // Tool shortcuts if not typing in an input
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    switch(e.key.toLowerCase()) {
                        case 'p': this.setTool('pen'); break;
                        case 'e': this.setTool('eraser'); break;
                        case 'h': this.setTool('highlighter'); break;
                        case 't': this.setTool('text'); break;
                        case 'v': this.setTool('move'); break;
                    }
                }
            });
        }

        getPointerPos(e) {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                pressure: e.pressure || 0.5
            };
        }

        onPointerDown(e) {
            if (e.pointerType === 'touch') {
                // Ignore touches if configured for palm rejection
                // For now, allow all.
            }
            const pos = this.getPointerPos(e);
            
            if (this.currentTool === 'text') {
                this.spawnTextInput(pos.x, pos.y);
                return;
            }
            if (this.currentTool === 'step') {
                this.addStepCounter(pos.x, pos.y);
                return;
            }

            this.isDrawing = true;
            this.lastPoint = pos;
            
            this.currentObject = {
                id: Date.now(),
                type: this.currentTool,
                color: this.color,
                thickness: this.thickness,
                points: [pos]
            };
            
            if (['line', 'arrow', 'rect', 'circle'].includes(this.currentTool)) {
                this.currentObject.startPos = pos;
                this.currentObject.endPos = pos;
            }
        }

        onPointerMove(e) {
            if (!this.isDrawing || !this.currentObject) return;
            const pos = this.getPointerPos(e);
            
            if (['pen', 'highlighter', 'eraser'].includes(this.currentTool)) {
                this.currentObject.points.push(pos);
            } else if (['line', 'arrow', 'rect', 'circle'].includes(this.currentTool)) {
                this.currentObject.endPos = pos;
            }
            
            // Render fast path (live preview)
            this.render();
            this.renderLiveObject(this.currentObject);
        }

        onPointerUp(e) {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            
            if (this.currentObject) {
                // Ignore single clicks that didn't draw anything (except for text/step)
                if (['pen', 'highlighter', 'eraser'].includes(this.currentTool) && this.currentObject.points.length < 2) {
                    this.currentObject = null;
                    return;
                }
                
                this.objects.push(this.currentObject);
                this.redoStack = []; // Clear redo
                this.currentObject = null;
                this.saveState();
                this.render();
            }
        }

        // --- Core Rendering ---
        render() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.objects.forEach(obj => this.drawObject(obj));
        }

        renderLiveObject(obj) {
            this.drawObject(obj);
        }

        drawObject(obj) {
            this.ctx.save();
            this.ctx.strokeStyle = obj.color;
            this.ctx.fillStyle = obj.color;
            this.ctx.lineWidth = obj.thickness;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            if (obj.type === 'highlighter') {
                this.ctx.globalAlpha = 0.4; // Transparency
                this.ctx.lineWidth = obj.thickness * 3; // Wider
            }
            if (obj.type === 'eraser') {
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.lineWidth = obj.thickness * 4;
            }

            if (['pen', 'highlighter', 'eraser'].includes(obj.type)) {
                this.drawCurve(obj.points);
            } else if (obj.type === 'line') {
                this.ctx.beginPath();
                this.ctx.moveTo(obj.startPos.x, obj.startPos.y);
                this.ctx.lineTo(obj.endPos.x, obj.endPos.y);
                this.ctx.stroke();
            } else if (obj.type === 'rect') {
                this.ctx.beginPath();
                this.ctx.rect(obj.startPos.x, obj.startPos.y, obj.endPos.x - obj.startPos.x, obj.endPos.y - obj.startPos.y);
                this.ctx.stroke();
            } else if (obj.type === 'circle') {
                this.ctx.beginPath();
                const radius = Math.hypot(obj.endPos.x - obj.startPos.x, obj.endPos.y - obj.startPos.y);
                this.ctx.arc(obj.startPos.x, obj.startPos.y, radius, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (obj.type === 'arrow') {
                this.drawArrow(obj.startPos.x, obj.startPos.y, obj.endPos.x, obj.endPos.y, obj.thickness);
            } else if (obj.type === 'text') {
                this.ctx.font = `${obj.fontSize || 24}px var(--font-sans, sans-serif)`;
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(obj.content, obj.x, obj.y);
            } else if (obj.type === 'step') {
                this.ctx.beginPath();
                this.ctx.arc(obj.x, obj.y, 16, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000'; // Contrast color for number
                this.ctx.font = 'bold 16px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(obj.number.toString(), obj.x, obj.y);
            }

            this.ctx.restore();
        }

        drawCurve(points) {
            if (points.length < 2) return;
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length - 2; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            // For the last 2 points
            if (points.length > 2) {
                this.ctx.quadraticCurveTo(
                    points[points.length - 2].x, points[points.length - 2].y, 
                    points[points.length - 1].x, points[points.length - 1].y
                );
            } else {
                this.ctx.lineTo(points[1].x, points[1].y);
            }
            this.ctx.stroke();
        }

        drawArrow(fromx, fromy, tox, toy, width) {
            const headlen = 15 + width; 
            const dx = tox - fromx;
            const dy = toy - fromy;
            const angle = Math.atan2(dy, dx);
            this.ctx.beginPath();
            this.ctx.moveTo(fromx, fromy);
            this.ctx.lineTo(tox, toy);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(tox, toy);
            this.ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            this.ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            this.ctx.lineTo(tox, toy);
            this.ctx.fill();
        }

        // --- Features ---
        addStepCounter(x, y) {
            this.objects.push({
                id: Date.now(), type: 'step', color: this.color,
                x: x, y: y, number: this.stepCounter++
            });
            this.saveState();
            this.render();
        }

        spawnTextInput(x, y) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'ev-inline-input';
            input.style.left = x + 'px';
            input.style.top = y + 'px';
            input.style.color = this.color;
            input.style.fontSize = '24px'; // Can make dynamic
            
            this.container.appendChild(input);
            input.focus();
            
            const commitText = () => {
                if (input.value.trim() !== '') {
                    this.objects.push({
                        id: Date.now(), type: 'text', color: this.color,
                        x: x, y: y, content: input.value, fontSize: 24
                    });
                    this.saveState();
                    this.render();
                }
                if(input.parentNode) input.parentNode.removeChild(input);
            };
            
            input.addEventListener('blur', commitText);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') commitText();
                if (e.key === 'Escape') { input.value = ''; commitText(); }
            });
        }

        undo() {
            if (this.objects.length > 0) {
                const obj = this.objects.pop();
                this.redoStack.push(obj);
                // If it was a step counter, decrement it
                if (obj.type === 'step') this.stepCounter = Math.max(1, this.stepCounter - 1);
                this.saveState();
                this.render();
            }
        }

        clear() {
            this.objects = [];
            this.redoStack = [];
            this.stepCounter = 1;
            this.saveState();
            this.render();
        }

        // --- State Management ---
        saveState() {
            const state = JSON.stringify({
                objects: this.objects,
                stepCounter: this.stepCounter
            });
            // Key based on URL to keep data isolated per page
            localStorage.setItem(`ev_annotation_${window.location.pathname}`, state);
        }

        loadState() {
            const stateStr = localStorage.getItem(`ev_annotation_${window.location.pathname}`);
            if (stateStr) {
                try {
                    const state = JSON.parse(stateStr);
                    this.objects = state.objects || [];
                    this.stepCounter = state.stepCounter || 1;
                    this.render();
                } catch(e) { console.error("Could not load annotation state", e); }
            }
        }

        // --- Global Toggle API ---
        toggleEngine() {
            this.isActive = !this.isActive;
            if (this.isActive) {
                this.container.style.display = 'block';
                this.toolbar.style.display = 'flex';
                this.render();
            } else {
                this.container.style.display = 'none';
                this.toolbar.style.display = 'none';
            }
            return this.isActive;
        }
    }

    // Expose Global Instance
    window.EVAnnotationEngine = new EVAnnotationEngine();
})();
