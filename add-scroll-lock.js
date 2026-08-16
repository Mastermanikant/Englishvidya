const fs = require('fs');
let appJs = fs.readFileSync('D:/Englishvidya/Website_Source/website/js/app.js', 'utf8');

const scrollLockCode = `
  // Centralized Scroll Lock for Modals & Drawers
  window.lockScroll = function() {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll'; // Prevent layout shift from scrollbar disappearing
  };

  window.unlockScroll = function() {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflowY = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  };
`;

if (!appJs.includes('window.lockScroll')) {
  appJs = appJs.replace(/const \$ = \(s\) => document\.querySelector\(s\);/, (match) => match + '\n' + scrollLockCode);
  
  // Replace document.body.style.overflow in SearchEngine
  appJs = appJs.replace(/document\.body\.style\.overflow = 'hidden';/g, 'window.lockScroll();');
  appJs = appJs.replace(/document\.body\.style\.overflow = '';/g, 'window.unlockScroll();');
  
  // Apply to Mobile Drawer
  appJs = appJs.replace(/drawerOverlay\.classList\.add\('active'\);/, "drawerOverlay.classList.add('active');\n      window.lockScroll();");
  appJs = appJs.replace(/drawerOverlay\.classList\.remove\('active'\);/, "drawerOverlay.classList.remove('active');\n      window.unlockScroll();");

  fs.writeFileSync('D:/Englishvidya/Website_Source/website/js/app.js', appJs);
  console.log('app.js updated');
}
