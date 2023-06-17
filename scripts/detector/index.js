// const detector = document.createElement('div')
// detector.setAttribute('id', 'flowl-screenshoter-extension-detector');
// detector.style.display = 'none';
//
// document.body.appendChild(detector);

function injectScript(file, node) {
  const th = document.getElementsByTagName(node)[0];
  const s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file);
  th.appendChild(s);
}

injectScript(chrome.runtime.getURL('scripts/detector/add-detector.js'), 'body');