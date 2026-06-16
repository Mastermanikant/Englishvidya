// Ultra-Minimalist Smart Board Logic
let canvas;
let boards = []; // Array of JSON states
let currentBoardIndex = 0;

// Since this script is lazy-loaded after click, DOMContentLoaded has already passed.
// We execute initialization immediately.
if (document.getElementById('sb-canvas')) {
    initBoard();
}

function initBoard() {
    // Setup Fabric Canvas
    canvas = new fabric.Canvas('sb-canvas', {
        isDrawingMode: true,
        backgroundColor: '#111111',
        selection: false
    });

    // Handle Resize
    function resizeCanvas() {
        canvas.setWidth(window.innerWidth);
        canvas.setHeight(window.innerHeight);
        canvas.renderAll();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Setup initial brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = '#ffffff';
    canvas.freeDrawingBrush.width = 5;

    // UI Elements
    const btnPen = document.getElementById('sb-tool-pen');
    const btnEraser = document.getElementById('sb-tool-eraser');
    const colorPicker = document.getElementById('sb-color-picker');
    const sizeSlider = document.getElementById('sb-size-slider');
    const btnAddPage = document.getElementById('sb-add-page');
    const btnClear = document.getElementById('sb-clear');
    const pageIndicator = document.getElementById('sb-page-indicator');

    // Tool logic
    function setTool(tool) {
        document.querySelectorAll('#sb-minimal-toolbar .sb-btn').forEach(btn => btn.classList.remove('active'));
        if (tool === 'pen') {
            if(btnPen) btnPen.classList.add('active');
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush.color = colorPicker ? colorPicker.value : '#ffffff';
            canvas.freeDrawingBrush.width = sizeSlider ? parseInt(sizeSlider.value, 10) : 5;
        } else if (tool === 'eraser') {
            if(btnEraser) btnEraser.classList.add('active');
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush.color = '#111111'; // Eraser faked by drawing background color
            canvas.freeDrawingBrush.width = sizeSlider ? parseInt(sizeSlider.value, 10) * 5 : 25; 
        }
    }

    if(btnPen) btnPen.addEventListener('click', () => setTool('pen'));
    if(btnEraser) btnEraser.addEventListener('click', () => setTool('eraser'));

    // Color & Size
    if(colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            if (btnPen && btnPen.classList.contains('active')) {
                canvas.freeDrawingBrush.color = e.target.value;
            }
        });
    }

    if(sizeSlider) {
        sizeSlider.addEventListener('input', (e) => {
            const size = parseInt(e.target.value, 10);
            if (btnEraser && btnEraser.classList.contains('active')) {
                canvas.freeDrawingBrush.width = size * 5;
            } else {
                canvas.freeDrawingBrush.width = size;
            }
        });
    }

    // Clear Board
    if(btnClear) {
        btnClear.addEventListener('click', () => {
            if(confirm("Are you sure you want to clear the entire page?")) {
                canvas.clear();
                canvas.backgroundColor = '#111111';
                canvas.renderAll();
                // Reset zoom/pan
                canvas.setViewportTransform([1,0,0,1,0,0]);
            }
        });
    }

    // Pages Logic
    function updatePageIndicator() {
        if(pageIndicator) {
            pageIndicator.innerText = `Page ${currentBoardIndex + 1} / ${boards.length + 1}`;
        }
    }

    if(btnAddPage) {
        btnAddPage.addEventListener('click', () => {
            // Save current
            boards[currentBoardIndex] = canvas.toJSON();
            // Move to next
            currentBoardIndex = boards.length;
            // Clear
            canvas.clear();
            canvas.backgroundColor = '#111111';
            canvas.setViewportTransform([1,0,0,1,0,0]); // Reset zoom
            canvas.renderAll();
            updatePageIndicator();
        });
    }
    updatePageIndicator();

    // ==========================================
    // ZOOM AND PAN (2-FINGER TOUCH & TRACKPAD)
    // ==========================================
    
    // 1. Laptop Trackpad (Mouse Wheel)
    canvas.on('mouse:wheel', function(opt) {
        if (opt.e.ctrlKey) {
            // Pinch-to-zoom on trackpad sends wheel + ctrlKey
            var delta = opt.e.deltaY;
            var zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 10) zoom = 10;
            if (zoom < 0.2) zoom = 0.2;
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        } else {
            // 2-finger pan on trackpad sends normal wheel
            var vpt = canvas.viewportTransform;
            vpt[4] -= opt.e.deltaX;
            vpt[5] -= opt.e.deltaY;
            canvas.requestRenderAll();
        }
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });

    // 2. Touch Screen Devices (Tablets, Phones, Digital Boards)
    const upperCanvas = canvas.upperCanvasEl;
    let isPinching = false;
    let initialPinchDistance = 0;
    let initialZoom = 1;
    let initialPinchCenter = { x: 0, y: 0 };

    upperCanvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
            isPinching = true;
            canvas.isDrawingMode = false; // Stop drawing when panning/zooming
            
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            initialPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            initialZoom = canvas.getZoom();
            initialPinchCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2
            };
            e.preventDefault();
        } else if (e.touches.length === 1 && !isPinching) {
            // If just 1 finger, make sure drawing mode is enabled
            canvas.isDrawingMode = true;
        }
    }, {passive: false});

    upperCanvas.addEventListener('touchmove', function(e) {
        if (isPinching && e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            
            // Calculate Zoom
            const scale = currentDistance / initialPinchDistance;
            let newZoom = initialZoom * scale;
            if (newZoom > 10) newZoom = 10;
            if (newZoom < 0.2) newZoom = 0.2;

            const currentCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2
            };

            // Apply Zoom
            canvas.zoomToPoint(new fabric.Point(initialPinchCenter.x, initialPinchCenter.y), newZoom);

            // Apply Pan
            const vpt = canvas.viewportTransform;
            vpt[4] += (currentCenter.x - initialPinchCenter.x);
            vpt[5] += (currentCenter.y - initialPinchCenter.y);
            
            initialPinchCenter = currentCenter; // update center for next move
            
            canvas.requestRenderAll();
            e.preventDefault();
        }
    }, {passive: false});

    upperCanvas.addEventListener('touchend', function(e) {
        if (isPinching && e.touches.length < 2) {
            isPinching = false;
            // Restore drawing mode
            canvas.isDrawingMode = true;
        }
    });
}
