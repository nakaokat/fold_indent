class Node {
  constructor(id, line) {
    this.id = id;
    this.line = line;
    this.indent = line.text.match(/^\s*/)[0];
    this.indent_level = this.indent ? this.indent.length : 0;
    this.children = [];
    this.parent = null;
    this.isFolded = false;
    this.dot = this.getDotElement();
    this.getElement().addEventListener("click", () => {
      // indent level == 0 のときはなにもしない
      if (this.indent_level === 0) {
        return;
      }
      this.toggleChildren();
      this.updateChildrenIsFolded();
      this.updateIsFolded();
      this.updateDotFoldedStyle();
    });
  }

  getElement() {
    return document.getElementById(`L${this.id}`);
  }

  getDotElement() {
    return this.getElement().querySelector(".dot");
  }

  updateDotFoldedStyle() {
    // border-radius none
    if (this.dot) {
      this.dot.style.borderRadius = this.isFolded ? "0" : "50%";
      this.dot.style.transform = this.isFolded
        ? "rotate(45deg)"
        : "rotate(0deg)";
    }
  }

  // 自分自身と子ノードを隠す
  hide() {
    this._hideSelf();
    this._hideChildren();
  }

  _hideSelf() {
    this.getElement().style.display = "none";
  }

  // 自分自身と子ノードを表示する
  show() {
    this._showSelf();
    this._showChildren();
  }

  _showSelf() {
    this.getElement().style.display = "block";
  }

  isHidden() {
    return this.getElement().style.display === "none";
  }

  toggleChildren() {
    this.children.forEach((child) => {
      child.toggle();
    });
  }

  toggle() {
    if (this.isHidden()) {
      this.show();
    } else {
      this.hide();
    }
  }

  _showChildren() {
    this.children.forEach((child) => {
      child.show();
    });
  }

  _hideChildren() {
    this.children.forEach((child) => {
      child.hide();
    });
  }

  // 指定されたindent_levelの親を探す
  // @returns: Node
  findParent(indent_level) {
    if (this.indent_level === indent_level) {
      return this;
    } else {
      return this.parent ? this.parent.findParent(indent_level) : null;
    }
  }

  _hasChildrenAndItsChildrenAreHidden() {
    return (
      this.children.length > 0 &&
      this.children.every((child) => child.isHidden())
    );
  }

  updateChildrenIsFolded() {
    this.children.forEach((child) => {
      child.updateIsFolded();
    });
  }

  updateIsFolded() {
    this.isFolded = this.children.some((child) => child.isHidden());
    this.updateDotFoldedStyle();
  }
}

function build_nodes(nodes) {
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const node = nodes[i];
    const indent_level_diff = node.indent_level - prev.indent_level;
    if (indent_level_diff > 0) {
      prev.children.push(node);
      node.parent = prev;
    }
    if (indent_level_diff == 0) {
      if (prev.parent) {
        prev.parent.children.push(node);
        node.parent = prev.parent;
      }
    }
    // インデントが減るときには親ノードを探して、見つかったら追加する
    if (indent_level_diff < 0) {
      const found_parent = prev.findParent(node.indent_level - 1);
      if (found_parent) {
        found_parent.children.push(node);
        node.parent = found_parent;
      }
    }
  }
}

// hide indent lines
function fold_indent(indent_level, lines) {
  // map to nodes
  var nodes = lines.map((line) => {
    return new Node(line.id, line);
  });
  build_nodes(nodes);
  // hide indent lines
  nodes.forEach((node) => {
    if (node.indent_level > indent_level) {
      node.hide();
    }
    if (node.indent_level > 0 && node.indent_level <= indent_level) {
      node.show();
    }
  });
  nodes.forEach((node) => {
    node.updateIsFolded();
  });
}

// expand indent lines
function unfold_indent(lines) {
  var nodes = lines.map((line) => {
    return new Node(line.id, line);
  });
  build_nodes(nodes);
  nodes.forEach((node) => {
    if (node.indent_level == 1) {
      node.show();
    }
  });
  nodes.forEach((node) => {
    node.updateIsFolded();
  });
}

scrapbox.PageMenu.addMenu({
  title: "インデントを折りたたむ",
  // TODO: Add your image here
  image: "",
  onClick: () => {
    fold_indent(1, scrapbox.Page.lines);
  },
});

scrapbox.PageMenu.addMenu({
  title: "インデントを展開する",
  // TODO: Add your image here
  image: "",
  onClick: () => {
    unfold_indent(scrapbox.Page.lines);
  },
});
