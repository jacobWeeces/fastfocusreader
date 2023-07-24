if (window.location.href.indexOf('www.google.com') > -1) {
  throw new Error('This extension breaks on Google domains');
} else {
  let extensionIsActive = false;

  function walk(node) {
    var child, next;
    // Skip walking through navigation, tables, SVGs, and code nodes.
    if (node.nodeName.toLowerCase() === 'nav' || node.nodeName.toLowerCase() === 'table' || node.nodeName.toLowerCase() === 'svg' || node.nodeName.toLowerCase() === 'code' || node.nodeName.toLowerCase() === 'button') {
  return; 
    }
    switch (node.nodeType) {
      case 1:
        child = node.firstChild;
        while (child) {
          next = child.nextSibling;
          walk(child);
          child = next;
        }
        break;
      case 3:
        if (extensionIsActive) {
          handleText(node);
        }
        break;
    }
  }

  function handleText(textNode) {
    var v = textNode.nodeValue;
    var words = v.split(' ');

    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var middle = Math.floor(word.length / 2);
        var firstHalf = word.substring(0, middle);
        var secondHalf = word.substring(middle);

        var strongNode = document.createElement('strong');
        var firstHalfNode = document.createTextNode(firstHalf);
        strongNode.appendChild(firstHalfNode);

        var secondHalfNode = document.createElement('span');
        secondHalfNode.style.setProperty("font-weight", "400", "important");
        secondHalfNode.textContent = secondHalf;

        var wordNode = document.createElement('span');
        wordNode.appendChild(strongNode);
        wordNode.appendChild(secondHalfNode);

        words[i] = wordNode.outerHTML;
    }
    var parentNode = textNode.parentNode;
    var newNode = document.createElement('span');
    newNode.innerHTML = words.join(' ');
    parentNode.replaceChild(newNode, textNode);
}

function observeDOM() {
  const observer = new MutationObserver(function(mutationsList, observer) {
    if (extensionIsActive) {
      mutationsList.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) { // Check if it's a text node
              walk(node);
            }
          });
        }
      });
    }
  });

  observer.observe(document.body, {attributes: false, childList: true, subtree: true});
  return observer;
}

const domObserver = observeDOM();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.command === "getState") {
    sendResponse(extensionIsActive);
  } else if (request.command === "activate") {
    extensionIsActive = true;
    walk(document.body);
  } else if (request.command === "deactivate") {
    extensionIsActive = false;
  }
  
  chrome.runtime.sendMessage({message: 'updateTabStorage', state: extensionIsActive}, function(response) {
    return
  });
  
});
}

