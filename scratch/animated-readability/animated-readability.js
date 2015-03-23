var READ_RECT_PROPERTIES = [ 'top', 'left', 'width', 'height' ];

var READ_BLACKLISTED_PROPERTIES = {
    display: true,
    position: true,
    top: true,
    left: true,
    width: true,
    height: true,
    right: true,
    bottom: true,
    margin: true,
    marginTop: true,
    marginLeft: true,
    marginBottom: true,
    marginRight: true,
    boxSizing: true,
    MozBoxSizing: true,
    WebkitBoxSizing: true,
    cssText: true,
    webkitLogicalWidth: true,
    webkitLogicalHeight: true,
    textShadow: true,
    alignSelf: true,
};

function readTagElements(element, nextTag) {
    if (!(element instanceof HTMLElement))
        return;
    element.setAttribute('data-read-tag', nextTag.tag);
    nextTag.tag++;
    for (var kid = element.firstChild; kid != null; kid = kid.nextSibling)
        readTagElements(kid, nextTag);
}

function readFindSurvivingTags(element, accumulator) {
    if (!(element instanceof HTMLElement))
        return;
    if (element.hasAttribute('data-read-tag')) {
        accumulator[element.getAttribute('data-read-tag')] = true;
    }
    for (var kid = element.firstChild; kid != null; kid = kid.nextSibling)
        readFindSurvivingTags(kid, accumulator);
}

function readGetBoundingClientRect(element) {
    var rect = element.getBoundingClientRect();
    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top
    };
}

function readFreezeSurvivingContentElements(element, survivingTags) {
    if (!(element instanceof HTMLElement))
        return;
    if (element.hasAttribute('data-frozen'))
        return;
    if (element.hasAttribute('data-read-tag') &&
            survivingTags[element.getAttribute('data-read-tag')]) {
        var rect = readGetBoundingClientRect(element);
        var originalStyle = window.getComputedStyle(element);

        var frozenElement = element.cloneNode(false);
        for (var kid = element.firstChild; kid != null; kid = kid.nextSibling) {
            if (kid.nodeType == 3)
                frozenElement.appendChild(kid.cloneNode(false));
        }

        frozenElement.style.position = 'absolute';
        frozenElement.style.boxSizing = 'border-box';
        READ_RECT_PROPERTIES.forEach(function(property) {
            frozenElement.style[property] = rect[property] + 'px';
        });
        document.body.appendChild(frozenElement);

        frozenElement.setAttribute('data-frozen', 'data-frozen');

        var frozenStyle = window.getComputedStyle(frozenElement);
        for (var property in originalStyle) {
            if (!READ_BLACKLISTED_PROPERTIES[property] &&
                    property.indexOf("-") == -1 &&
                    !/^\d+$/.test(property) &&
                    frozenStyle[property] != originalStyle[property]) {
                frozenElement.style[property] = originalStyle[property];
            }
        }

        frozenElement.classList.add('read-frozen');
        element.classList.add("read-original");
    }

    for (var kid = element.firstChild; kid != null; kid = kid.nextSibling)
        readFreezeSurvivingContentElements(kid, survivingTags);
}

function readFindFinalPositions(element, finalPositions) {
    if (!(element instanceof HTMLElement))
        return;
    if (element.hasAttribute('data-read-tag'))
        finalPositions[element.getAttribute('data-read-tag')] = readGetBoundingClientRect(element);
    for (var kid = element.firstChild; kid != null; kid = kid.nextSibling)
        readFindFinalPositions(kid, finalPositions);
}

function readMoveFrozenElements(element, finalPositions) {
    if (!(element instanceof HTMLElement))
        return;
    if (element.hasAttribute('data-read-tag') && element.hasAttribute('data-frozen')) {
        var rect = finalPositions[element.getAttribute('data-read-tag')];
        READ_RECT_PROPERTIES.forEach(function(property) {
            element.style[property] = rect[property] + 'px';
        });
    }
    for (var kid = element.firstChild; kid != null; kid = kid.nextSibling)
        readMoveFrozenElements(kid, finalPositions);
}

function readMakeReadable() {
    readTagElements(document.body, { tag: 0 });

    var scratchDocument = document.implementation.createHTMLDocument();
    for (var node = document.documentElement.firstChild; node != null; node = node.nextSibling) {
        scratchDocument.documentElement.appendChild(scratchDocument.importNode(node, true));
    }

    var location = document.location;
    var uri = {
        spec: location.href,
        host: location.host,
        prePath: location.protocol + "//" + location.host,
        scheme: location.protocol.substr(0, location.protocol.indexOf(":")),
        pathBase: location.protocol +
            "//" +
            location.host +
            location.pathname.substr(0, location.pathname.lastIndexOf("/") + 1)
    };

    var readability = new Readability(uri, scratchDocument);
    var article = readability.parse();

    var fragment = document.createDocumentFragment();
    var contentContainer = document.createElement('div');
    contentContainer.classList.add('read-content-container');
    fragment.appendChild(contentContainer);
    contentContainer.innerHTML = article.content;

    var survivingTags = {};
    readFindSurvivingTags(contentContainer, survivingTags);

    var finalPositions = {};
    document.body.appendChild(contentContainer);
    readFindFinalPositions(contentContainer, finalPositions);
    document.body.removeChild(contentContainer);

    readFreezeSurvivingContentElements(document.body, survivingTags);

    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', "animated-readability.css");
    link.setAttribute('type', "text/css");
    document.head.appendChild(link);

    document.body.classList.add('read-in-reader-mode-preanim');
    document.body.classList.add('read-main-article-preanim');
    setTimeout(function() {
        document.body.classList.add('read-main-article');
        document.body.classList.remove('read-main-article-preanim');
        document.body.classList.add('read-in-reader-mode');
        document.body.classList.remove('read-in-reader-mode-preanim');
        readMoveFrozenElements(document.body, finalPositions);
    }, 0);
}

