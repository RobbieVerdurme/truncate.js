(function (root, factory) {
    root.Truncate = factory();
}(this, function () {

  var BLOCK_TAGS = ['table', 'thead', 'tbody', 'tfoot', 'tr', 'col', 'colgroup', 'object', 'embed', 'param', 'ol', 'ul', 'dl', 'blockquote', 'select', 'optgroup', 'option', 'textarea', 'script', 'style'];

  /* Trim function.
   * Trim only end of string whitespaces
   *
   * text - String to trim
   *
   * Returns text without end whitespaces
   */
  function trimRight(text) {
    return text.replace(/\s*$/, "");
  }

  function setText(element, text) {
    if (element.innerText) {
      element.innerText = text;
    } else if (element.nodeValue) {
      element.nodeValue = text;
    } else if (element.textContent) {
      element.textContent = text;
    } else {
      return false;
    }
  }

  /* Truncate the nearest sibling node.
   * If no valid immediate sibling is found, traverse one level up to a cousin node.
   *
   * element  - The node to truncate.
   * rootNode - The root node to measure the truncated height.
   * clipNode - The node to insert right after the truncation point.
   * options   - An object containing:
   *             ellipsis  - The ellipsis string to append at the end of the truncation.
   *             maxHeight - The maximum height for the root node (in px).
   *             position  - The position of the truncation ("start", "middle", "end").
   *
   * Returns true if truncation happened, false otherwise.
   */
  function truncateNearestSibling(element, rootNode, clipNode, options) {
    var parent = element.parentElement;
    var prevSibling;

    element.remove();

    // Take into account length of clipNode element previous inserted.
    var clipLength = clipNode ? clipNode.length : 0;

    if (parent.childNodes.length > clipLength) {

      // Valid previous sibling element (sharing same parent node) exists,
      // so attempt to truncate it.
      const children = parent.childNodes;
      prevSibling = children[children.length - 1 - clipLength];
      return truncateTextContent(prevSibling, rootNode, clipNode, options);

    } else {

      // No previous sibling element (sharing same parent node) exists.
      // Therefore, search parent's sibling.

      const children = parent.previousElementSibling?.childNodes;
      prevSibling = children ? children[children.length - 1] : null;

      if (prevSibling && prevSibling.length) {

        // Because traversal is in-order so the algorithm already checked that
        // this point meets the height requirement. As such, it's safe to truncate here.
        setText(prevSibling, prevSibling.textContent + options.ellipsis);
        parent.remove();

        if (clipNode && clipNode.length) {
          parentSibling.append(clipNode);
        }
        return true;
      }
    }

    return false;
  }

  /* Truncates, at the beginning, the text content of a node using binary search */
  function truncateTextStart(element, rootNode, clipNode, options) {
    var original = element.textContent;

    var maxChunk = '';
    var mid, chunk;
    var low = 0;
    var high = original.length;

    while (low <= high) {
      mid = low + ((high - low) >> 1); // Integer division

      chunk = options.ellipsis + trimRight(original.substr(mid - 1, original.length));
      setText(element, chunk);

      if (rootNode.clientHeight > options.maxHeight) {
        // too big, reduce the chunk
        low = mid + 1;
      }
      else {
        // chunk valid, try to get a bigger chunk
        high = mid - 1;
        maxChunk = maxChunk.length > chunk.length ? maxChunk : chunk;
      }
    }

    if (maxChunk.length > 0) {
      setText(element, maxChunk);
      return true;
    } else {
      return truncateNearestSibling(element, rootNode, clipNode, options);
    }
  }

  /* Truncates, at the end, the text content of a node using binary search */
  function truncateTextEnd(element, rootNode, clipNode, options) {
    var original = element.textContent;

    var maxChunk = '';
    var mid, chunk;
    var low = 0;
    var high = original.length;

    // Binary Search
    while (low <= high) {
      mid = low + ((high - low) >> 1); // Integer division

      chunk = trimRight(original.substr(0, mid + 1)) + options.ellipsis;
      setText(element, chunk);

      if (rootNode.clientHeight > options.maxHeight) {
        // too big, reduce the chunk
        high = mid - 1;
      } else {
        // chunk valid, try to get a bigger chunk
        low = mid + 1;
        maxChunk = maxChunk.length > chunk.length ? maxChunk : chunk;
      }
    }

    if (maxChunk.length > 0) {
      setText(element, maxChunk);
      return true;
    } else {
      return truncateNearestSibling(element, rootNode, clipNode, options);
    }
  }

  /* Truncates, at the middle, the text content of a node using binary search */
  function truncateTextMiddle(element, rootNode, clipNode, options) {
    var original = element.textContent;

    var maxChunk = '';
    var low = 0;
    var len = original.length;
    var high = len >> 1;
    var mid, chunk;

    while (low <= high) {
      mid = low + ((high - low) >> 1); // Integer division

      chunk = trimRight(original.substr(0, mid)) + options.ellipsis + original.substr(len - mid, len - mid);
      setText(element, chunk);

      if (rootNode.clientHeight > options.maxHeight) {
        // too big, reduce the chunk
        high = mid - 1;
      }
      else {
        // chunk valid, try to get a bigger chunk
        low = mid + 1;

        maxChunk = maxChunk.length > chunk.length ? maxChunk : chunk;
      }
    }

    if (maxChunk.length > 0) {
      setText(element, maxChunk);
      return true;
    } else {
      return truncateNearestSibling(element, rootNode, clipNode, options);
    }
  }

  /* Truncates the text content of a node using binary search.
   * If no valid truncation point is found, attempt to truncate its nearest sibling.
   *
   * textNode - The  node to truncate.
   * rootNode - The  root node to measure the truncated height.
   * clipNode - The  node to insert right after the truncation point.
   * options   - An object containing:
   *             ellipsis  - The ellipsis string to append at the end of the truncation.
   *             maxHeight - The maximum height for the root node (in px).
   *             position  - The position of the truncation ("start", "middle", "end").
   *
   * Returns true if truncation happened, false otherwise.
   */
  function truncateTextContent(element, rootNode, clipNode, options) { // jshint ignore:line
    if (options.position === "end") {
      return truncateTextEnd(element, rootNode, clipNode, options);
    }
    else if (options.position === "start") {
      return truncateTextStart(element, rootNode, clipNode, options);
    }
    else {
      return truncateTextMiddle(element, rootNode, clipNode, options);
    }
  }

  /* Recursively truncates a nested node. Traverses the children node tree in reverse order. */
  function truncateNestedNodeStart(element, rootNode, clipNode, options) {
    var clonedNode = element.cloneNode(true);
    var children = clonedNode.childNodes;
    var child, child;

    var length = children.length;
    var truncated = false;

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    for (let index = length - 1; index >= 0 && !truncated; index--) {
      child = children[children.length - 1]; // append will remove it from this array => index not valid anymore

      if (child.nodeType === 8) { // comment node
        clonedNode.removeChild(child);
        continue;
      }

      element.insertBefore(child, element.firstChild);

      if (clipNode && clipNode.length) {
        if (BLOCK_TAGS.indexOf(element.tagName.toLowerCase()) >= 0) {
          // Certain elements like <li> should not be appended to.
          element.after(clipNode);
        } else {
          element.append(clipNode);
        }
      }

      if (rootNode.clientHeight > options.maxHeight) {
        if (child.nodeType === 3) { // text node
          truncated = truncateTextContent(child, rootNode, clipNode, options);
        } else {
          truncated = truncateNestedNode(child, rootNode, clipNode, options);
        }
      }

      if (!truncated && clipNode && clipNode.length) {
        clipNode.remove();
      }

    }

    return truncated;
  }

  /* Recursively truncates a nested node. Traverses the children node tree in-order. */
  function truncateNestedNodeEnd(element, rootNode, clipNode, options) {
    var clonedNode = element.cloneNode(true);
    var children = clonedNode.childNodes;
    var child, child;

    var length = children.length;
    var truncated = false;

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    for (let index = 0; index < length && !truncated; index++) {
      child = children[0]; // append removes it in this array => index not correct anymore for this array

      if (child.nodeType === 8) { // comment node
        clonedNode.removeChild(child);
        continue;
      }

      element.appendChild(child);

      if (clipNode && clipNode.length) {
        if (BLOCK_TAGS.indexOf(element.tagName.toLowerCase()) >= 0) {
          // Certain elements like <li> should not be appended to.
          element.after(clipNode);
        } else {
          element.append(clipNode);
        }
      }

      if (rootNode.clientHeight > options.maxHeight) {
        if (child.nodeType === 3) { // text node
          truncated = truncateTextContent(child, rootNode, clipNode, options);
        } else {
          truncated = truncateNestedNode(child, rootNode, clipNode, options);
        }
      }

      if (!truncated && clipNode && clipNode.length) {
        clipNode.remove();
      }

    }

    return truncated;
  }

  /* Recursively truncates a nested node.
   *
   * element  - The  nested node to truncate.
   * rootNode - The  root node to measure the truncated height.
   * clipNode - The  node to insert right after the truncation point.
   * options   - An object containing:
   *             ellipsis  - The ellipsis string to append at the end of the truncation.
   *             maxHeight - The maximum height for the root node (in px).
   *             position  - The position of the truncation ("start", "middle", "end").
   *
   * Returns true if truncation happened, false otherwise.
   */
  function truncateNestedNode(element, rootNode, clipNode, options) { // jshint ignore:line
    if (options.position === "end") {
      return truncateNestedNodeEnd(element, rootNode, clipNode, options);
    }
    else if (options.position === "start") {
      return truncateNestedNodeStart(element, rootNode, clipNode, options);
    }
    else {
      // TODO: Truncate middle for nested = HARDCORE
      return truncateNestedNodeEnd(element, rootNode, clipNode, options);
    }
  }

  /* Public: Creates an instance of Truncate.
   *
   * element - A DOM element to be truncated.
   * options - An Object literal containing setup options.
   *
   * Examples:
   *
   *   var element = document.createElement('span');
   *   element.innerHTML = 'This is<br>odd.';
   *   var truncated = new Truncate(element, {
   *     lines: 1,
   *     lineHeight: 16,
   *     ellipsis: '… ',
   *     showMore: '<a class="show-more">Show More</a>',
   *     showLess: '<a class="show-less">Show Less</a>',
   *     position: "start"
   *   });
   *
   *   // Update HTML
   *   truncated.update('This is not very odd.');
   *
   *   // Undo truncation
   *   truncated.expand();
   *
   *   // Redo truncation
   *   truncated.collapse();
   *
   *   // Update options
   *   truncated.config({ lines : 3 });
   */
  function Truncate(element, options) {
    this.element = element;

    this._name = 'truncate';
    this._defaults = {
      lines: 1,
      ellipsis: '…',
      showMore: '',
      showLess: '',
      position: 'end',
      lineHeight: 'auto'
    };

    this.config(options);

    this.original = this.cached = element.innerHTML;

    this.isTruncated = false; // True if the original content overflows the container.
    this.isCollapsed = true;  // True if the container is currently collapsed.

    this.update();
  }

  Truncate.prototype = {

    /* Public: Replaces the existing options field by the new values.
     *
     * options - The new options object.
     *
     * Returns nothing.
     */
    config: function (options) {
      this.options = Object.assign({}, this._defaults, options);

      if (this.options.lineHeight === 'auto') {
        var lineHeightCss = getComputedStyle(this.element).lineHeight,
          lineHeight = 18; // for Normal we return the default value: 18px

        if (lineHeightCss !== "normal") {
          lineHeight = parseInt(lineHeightCss, 10);
        }

        this.options.lineHeight = lineHeight;
      }

      if (this.options.maxHeight === undefined) {
        this.options.maxHeight = parseInt(this.options.lines, 10) * parseInt(this.options.lineHeight, 10);
      }

      if (this.options.position !== 'start' && this.options.position !== 'middle' && this.options.position !== 'end') {
        this.options.position = 'end';
      }

      this.clipNode = this.element.append(document.createRange().createContextualFragment(this.options.showMore));

      // Forced update if plugin already initialized
      if (this.original) {
        this.update();
      }
    },

    /* Public: Updates the inner HTML of the element and re-truncates. Will not
     * perform an updade if the container is currently expanded, instead it
     * will wait until the next time .collapse() is called.
     *
     * html - The new HTML.
     *
     * Returns nothing.
     */
    update: function (html) {
      var wasExpanded = !this.isCollapsed;

      // Update HTML if provided, otherwise use the current html and restore
      // the truncated content to the original if it's currently present.
      if (typeof html !== 'undefined') {
        this.original = this.element.innerHTML = html;
      } else if (this.isCollapsed && this.element.innerHTML === this.cached) {
        this.element.innerHTML = this.original;
      }

      // Wrap the contents in order to ignore container's margin/padding.
      var wrap = document.createElement('div');
      var children = this.element.childNodes;
      var length = children.length;
      for (let index = 0; index < length; index++) {
        const element = children[0];
        wrap.appendChild(element);
      }

      wrap.style.border = 'none';
      wrap.style.margin = 0;
      wrap.style.padding = 0;
      wrap.style.width = 'auto';
      wrap.style.height = 'auto';
      wrap.style.wordWrap = 'break-word';

      this.element.appendChild(wrap);

      this.isTruncated = false;
      // Check if already meets height requirement
      if (this.element.clientHeight > this.options.maxHeight) {
        this.isTruncated = truncateNestedNode(wrap, wrap, this.clipNode, this.options);

        if (this.isExplicitlyCollapsed) {
          this.isCollapsed = true;
          wasExpanded = false;
        }
      } else {
        this.isCollapsed = false;
      }

      // Restore the wrapped contents
      wrap.replaceWith(...wrap.childNodes);

      // Cache the truncated content
      this.cached = this.element.innerHTML;

      // If the container was expanded when .update() was called then restore
      // it to it's previous state.
      if (wasExpanded) {
        this.element.innerHTML = this.original;
      }
    },

    /* Public: Expands the element to show content in full.
     *
     * Returns nothing.
     */
    expand: function () {
      var includeShowLess = true;

      if (this.isExplicitlyCollapsed) {
        this.isExplicitlyCollapsed = false;
        includeShowLess = false;
      }

      if (!this.isCollapsed) {
        return;
      }

      this.isCollapsed = false;

      this.element.innerHTML = this.isTruncated ? this.original + (includeShowLess ? this.options.showLess : "") : this.original;
    },

    /* Public: Collapses the element to the truncated state.
     * Uses the cached HTML from .update() by default.
     *
     * retruncate - True to retruncate original HTML, otherwise use cached HTML.
     *
     * Returns nothing.
     */
    collapse: function (retruncate) {
      this.isExplicitlyCollapsed = true;

      if (this.isCollapsed) {
        return;
      }

      this.isCollapsed = true;

      retruncate = retruncate || false;
      if (retruncate) {
        this.update();
      } else {
        this.element.innerHTML = this.cached;
      }
    }
  };

  return Truncate;
}));
