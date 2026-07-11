document.addEventListener('DOMContentLoaded', () => {
  const contentArea = document.querySelector('.markdown-body');
  if (!contentArea) return;

  const h2s = contentArea.querySelectorAll('h2');
  if (h2s.length === 0) return;

  // Show control buttons if we have collapsible headings
  const collapseAllBtn = document.getElementById('collapse-all-btn');
  const expandAllBtn = document.getElementById('expand-all-btn');
  if (collapseAllBtn) collapseAllBtn.style.display = 'inline-flex';
  if (expandAllBtn) expandAllBtn.style.display = 'inline-flex';

  h2s.forEach((h2, idx) => {
    // 1. Create a content container for elements between this H2 and the next H2
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content';
    contentDiv.id = `collapsible-section-${idx}`;

    // Move siblings into the container until next H2 (or end)
    let sibling = h2.nextSibling;
    while (sibling) {
      const nextSibling = sibling.nextSibling;
      // If we encounter another H2 or share-box or comments, stop
      if (sibling.nodeType === 1 && (sibling.tagName === 'H2' || sibling.classList.contains('share-box') || sibling.id === 'word-rating-container')) {
        break;
      }
      contentDiv.appendChild(sibling);
      sibling = nextSibling;
    }

    // Insert container after H2
    h2.parentNode.insertBefore(contentDiv, h2.nextSibling);

    // 2. Setup H2 styling and arrow
    h2.classList.add('collapsible-header');
    h2.setAttribute('role', 'button');
    h2.setAttribute('tabindex', '0');
    h2.setAttribute('aria-expanded', 'false');
    h2.setAttribute('aria-controls', `collapsible-section-${idx}`);
    h2.innerHTML = `<span>${h2.innerHTML}</span><span class="toggle-icon">▼</span>`;

    // Collapse by default
    collapseSection(h2, contentDiv);

    // 3. Click handler
    h2.addEventListener('click', toggleSection);
    
    // 4. Keyboard accessibility handler
    h2.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSection();
      }
    });
    
    function toggleSection() {
      const isExpanded = h2.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        collapseSection(h2, contentDiv);
      } else {
        expandSection(h2, contentDiv);
      }
    }
  });

  function collapseSection(header, content) {
    content.style.display = 'none';
    header.classList.add('collapsed');
    header.setAttribute('aria-expanded', 'false');
    header.querySelector('.toggle-icon').textContent = '▼';
  }

  function expandSection(header, content) {
    content.style.display = 'block';
    header.classList.remove('collapsed');
    header.setAttribute('aria-expanded', 'true');
    header.querySelector('.toggle-icon').textContent = '▲';
  }

  // Global actions
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      h2s.forEach((h2, idx) => {
        const content = document.getElementById(`collapsible-section-${idx}`);
        if (content) collapseSection(h2, content);
      });
    });
  }

  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => {
      h2s.forEach((h2, idx) => {
        const content = document.getElementById(`collapsible-section-${idx}`);
        if (content) expandSection(h2, content);
      });
    });
  }
});
