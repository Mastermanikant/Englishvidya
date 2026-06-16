document.addEventListener('DOMContentLoaded', async () => {
  // Initialize localForage store
  const store = localforage.createInstance({
    name: "EnglishVidyaSmartBoard",
    storeName: "boards"
  });

  // UI Elements
  const container = document.getElementById('sb-canvas-container');
  const canvasEl = document.getElementById('sb-canvas');
  const pagesList = document.getElementById('sb-pages-list');
  const btnAddPage = document.getElementById('sb-add-page');
  const zoomSlider = document.getElementById('sb-zoom-slider');
  const zoomLabel = document.getElementById('sb-zoom-label');
  const statusMsg = document.getElementById('sb-status-msg');

  // State
  let pages = []; // Array of page IDs
  let activePageId = null;
  let currentZoom = 1;
  let currentMode = 'select'; // select, pen, text, eraser
  let isDragging = false;
  let lastPosX, lastPosY;

  // Initialize Fabric Canvas
  const canvas = new fabric.Canvas('sb-canvas', {
    width: container.clientWidth,
    height: container.clientHeight,
    isDrawingMode: false,
    backgroundColor: '#111111'
  });

  // Resize handling
  window.addEventListener('resize', () => {
    canvas.setWidth(container.clientWidth);
    canvas.setHeight(container.clientHeight);
    canvas.renderAll();
  });

  // Setup Brush
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.color = '#ffffff';
  canvas.freeDrawingBrush.width = 5;

  // Tools Configuration
  document.getElementById('sb-color-picker').addEventListener('change', (e) => {
    canvas.freeDrawingBrush.color = e.target.value;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'i-text') activeObject.set('fill', e.target.value);
      else if (activeObject.type === 'path') activeObject.set('stroke', e.target.value);
      canvas.renderAll();
      saveCurrentPage();
    }
  });

  document.getElementById('sb-size-slider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    canvas.freeDrawingBrush.width = val;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.set('fontSize', val * 5); // scale mapping
      canvas.renderAll();
      saveCurrentPage();
    }
  });

  // Tool Selection
  const setMode = (mode, btnId) => {
    currentMode = mode;
    document.querySelectorAll('#sb-toolbar .sb-btn').forEach(b => b.classList.remove('active'));
    if (btnId) document.getElementById(btnId).classList.add('active');

    canvas.isDrawingMode = (mode === 'pen');
    canvas.selection = (mode === 'select' || mode === 'eraser');
    
    // Set cursor and object selectivity
    canvas.getObjects().forEach(obj => {
      obj.selectable = (mode === 'select' || mode === 'eraser');
      obj.evented = (mode === 'select' || mode === 'eraser');
    });

    if (mode === 'text') {
      statusMsg.innerText = "Click anywhere on the board to type text.";
    } else {
      statusMsg.innerText = "Ready.";
    }
  };

  document.getElementById('sb-tool-select').addEventListener('click', () => setMode('select', 'sb-tool-select'));
  document.getElementById('sb-tool-pen').addEventListener('click', () => setMode('pen', 'sb-tool-pen'));
  document.getElementById('sb-tool-text').addEventListener('click', () => setMode('text', 'sb-tool-text'));
  document.getElementById('sb-tool-eraser').addEventListener('click', () => {
    setMode('eraser', 'sb-tool-eraser');
    deleteSelected();
  });

  document.getElementById('sb-home').addEventListener('click', () => window.location.href = '/');
  
  document.getElementById('sb-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  });

  document.getElementById('sb-clear').addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the entire board?")) {
      canvas.clear();
      canvas.backgroundColor = '#111111';
      saveCurrentPage();
    }
  });

  // Image Upload
  document.getElementById('sb-image-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target.result;
      fabric.Image.fromURL(data, (img) => {
        img.scaleToWidth(canvas.width / 2);
        canvas.centerObject(img);
        canvas.add(img);
        canvas.renderAll();
        saveCurrentPage();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  });

  // Keyboard Shortcuts & Eraser
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (currentMode !== 'text' || !canvas.getActiveObject()?.isEditing) {
        deleteSelected();
      }
    }
    if (e.ctrlKey && e.key === 'z') { /* Implement Undo/Redo later */ }
  });

  function deleteSelected() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      saveCurrentPage();
    }
  }

  // Text Tool Interaction
  canvas.on('mouse:down', function(opt) {
    var evt = opt.e;
    if (evt.altKey === true) {
      isDragging = true;
      canvas.selection = false;
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
    } else if (currentMode === 'text' && !opt.target) {
      const pointer = canvas.getPointer(opt.e);
      const text = new fabric.IText('Type here', {
        left: pointer.x,
        top: pointer.y,
        fill: document.getElementById('sb-color-picker').value,
        fontSize: document.getElementById('sb-size-slider').value * 5,
        fontFamily: 'Inter, sans-serif'
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
      setMode('select', 'sb-tool-select');
    }
  });

  // Panning Support (Alt + Drag)
  canvas.on('mouse:move', function(opt) {
    if (isDragging) {
      var e = opt.e;
      var vpt = this.viewportTransform;
      vpt[4] += e.clientX - lastPosX;
      vpt[5] += e.clientY - lastPosY;
      this.requestRenderAll();
      lastPosX = e.clientX;
      lastPosY = e.clientY;
    }
  });

  canvas.on('mouse:up', function(opt) {
    this.setViewportTransform(this.viewportTransform);
    isDragging = false;
    canvas.selection = (currentMode === 'select' || currentMode === 'eraser');
  });

  // Zoom Support (Mouse Wheel)
  canvas.on('mouse:wheel', function(opt) {
    var delta = opt.e.deltaY;
    var zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 5) zoom = 5;
    if (zoom < 0.1) zoom = 0.1;
    setZoom(zoom, { x: opt.e.offsetX, y: opt.e.offsetY });
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });

  function setZoom(zoomLvl, point) {
    currentZoom = zoomLvl;
    if (point) {
      canvas.zoomToPoint(point, currentZoom);
    } else {
      canvas.setZoom(currentZoom);
    }
    zoomSlider.value = Math.round(currentZoom * 100);
    zoomLabel.innerText = Math.round(currentZoom * 100) + '%';
  }

  zoomSlider.addEventListener('input', (e) => {
    setZoom(e.target.value / 100);
  });

  document.getElementById('sb-zoom-out').addEventListener('click', () => setZoom(Math.max(0.1, currentZoom - 0.2)));
  document.getElementById('sb-zoom-in').addEventListener('click', () => setZoom(Math.min(5, currentZoom + 0.2)));
  document.getElementById('sb-zoom-reset').addEventListener('click', () => {
    setZoom(1);
    canvas.viewportTransform = [1,0,0,1,0,0];
  });

  // Auto Save on modification
  canvas.on('object:added', saveCurrentPage);
  canvas.on('object:modified', saveCurrentPage);
  canvas.on('object:removed', saveCurrentPage);

  async function saveCurrentPage() {
    if (!activePageId) return;
    const json = canvas.toJSON();
    await store.setItem(activePageId, json);
    statusMsg.innerText = "Saved.";
    setTimeout(() => { if(statusMsg.innerText === "Saved.") statusMsg.innerText = "Ready."; }, 1000);
  }

  // Multi-Page Logic
  async function loadPages() {
    const savedPages = await store.getItem('pages_index');
    if (savedPages && savedPages.length > 0) {
      pages = savedPages;
    } else {
      pages = ['page_' + Date.now()];
      await store.setItem('pages_index', pages);
    }
    renderPagesList();
    loadPage(pages[0]);
  }

  function renderPagesList() {
    pagesList.innerHTML = '';
    pages.forEach((pageId, idx) => {
      const li = document.createElement('li');
      li.className = `sb-page-item ${pageId === activePageId ? 'active' : ''}`;
      li.innerHTML = `
        <span>Board ${idx + 1}</span>
        ${pages.length > 1 ? '<button class="sb-page-del" title="Delete">✖</button>' : ''}
      `;
      li.addEventListener('click', (e) => {
        if (e.target.classList.contains('sb-page-del')) {
          deletePage(pageId);
        } else {
          loadPage(pageId);
        }
      });
      pagesList.appendChild(li);
    });
  }

  async function loadPage(pageId) {
    statusMsg.innerText = "Loading...";
    activePageId = pageId;
    const data = await store.getItem(pageId);
    if (data) {
      canvas.loadFromJSON(data, () => {
        canvas.renderAll();
        statusMsg.innerText = "Ready.";
      });
    } else {
      canvas.clear();
      canvas.backgroundColor = '#111111';
      statusMsg.innerText = "Ready.";
    }
    renderPagesList();
  }

  async function addNewPage() {
    const newId = 'page_' + Date.now();
    pages.push(newId);
    await store.setItem('pages_index', pages);
    loadPage(newId);
  }

  async function deletePage(pageId) {
    if (!confirm("Delete this board?")) return;
    pages = pages.filter(p => p !== pageId);
    await store.setItem('pages_index', pages);
    await store.removeItem(pageId);
    if (activePageId === pageId) {
      loadPage(pages[pages.length - 1]);
    } else {
      renderPagesList();
    }
  }

  btnAddPage.addEventListener('click', addNewPage);

  // PDF Export
  document.getElementById('sb-export-pdf').addEventListener('click', async () => {
    statusMsg.innerText = "Generating PDF...";
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    // Save current active state
    const originalPage = activePageId;
    
    for (let i = 0; i < pages.length; i++) {
      const pId = pages[i];
      const data = await store.getItem(pId);
      
      await new Promise(resolve => {
        if (data) {
          canvas.loadFromJSON(data, () => {
            canvas.renderAll();
            resolve();
          });
        } else {
          canvas.clear();
          canvas.backgroundColor = '#111111';
          resolve();
        }
      });

      const imgData = canvas.toDataURL({ format: 'jpeg', quality: 0.8 });
      if (i > 0) pdf.addPage([canvas.width, canvas.height]);
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    }

    pdf.save('EnglishVidya-Boards.pdf');
    
    // Restore
    loadPage(originalPage);
    statusMsg.innerText = "PDF Downloaded!";
  });

  // Init
  loadPages();
});
