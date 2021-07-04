import { ArticleTagCounter } from './dataTypes.js';
import { correspondingTags } from './newsUtils.js';

class Node {
  constructor(tag, tagClass = null) {
    this.tag = tag;
    this.tagClass = tagClass ? tagClass : null;
  }

  evaluate = (interpreterEnvironment, articleTagCounter) => {};

  getTagClass = () => this.tagClass;

  countContentTags = () => {};

  countTags = () => 1;

  compare = (node) => {
    if (
      this.getTagClass === node.getTagClass &&
      this.countContentTags === node.countContentTags
    )
      return true;
    else return false;
  };

  to_s = (start = 0) =>
    `${start * ' '}${this.tag} (${this.tagClass ? this.tagClass : ''})\n`;

  getBestTagClass = () => this.tagClass;
}

class NonUnaryTagNode extends Node {
  constructor(tag, tagClass = null) {
    super(tag, tagClass);
    this.children = [];
    this._containsText = null;
    this.recount = true;
    this.numTags = null;
  }

  addChild = (child) => {
    this.children.push(child);
    this._containsText = null;
    this.recount = true;
  };

  addChildren = (children) => {
    this.children.push(...children);
    this._containsText = null;
    this.recount = true;
  };

  numChildren = () => this.children.length;

  popChildren = () => {
    this.children.pop();
    this._containsText = null;
    this.recount = true;
  };

  countContentTags = () => {
    if (!this._containsText) {
      if (this.numChildren() === 0) return 1;
      else {
        let count = 1;
        for (let i = this.children.length - 1; i >= 0; i--) {
          count += this.children[i].countContentTags();
        }
        this._containsText = count;
      }
    }
    return this._containsText;
  };

  countTags = () => {
    if (this.recount) {
      if (this.children.length === 0) this.numTags = 1;
      else {
        let count = 1;

        for (let i = 0, length = this.children.length; i < length; i++) {
          count += this.children[i].countTags();
        }

        this.numTags = count;
      }

      this.recount = false;
    }

    return this.numTags;
  };

  to_s = (start = 0, typeTag = null) => {
    let tabs = start * ' ';
    let tagClass = this.getTagClass() ? `(${this.getTagClass()})` : null;
    let string = `${tabs}${typeTag ? typeTag : ''}${this.tag} ${tagClass}\n`;

    if (this.numChildren() > 0)
      children = this.children.map((child) => child.to_s(start + 1)).join('');
    else children = '';

    return `${string}${children}`;
  };

  getBestTagClass = () =>
    this.numChildren() === 1
      ? this.children[0].getBestTagClass() || this.tagClass
      : this.tagClass;
}

class DivNode extends NonUnaryTagNode {
  constructor(tagClass = null) {
    super('div', tagClass);
  }

  to_s = (start = 0) => super.to_s(start, 'div');

  simple_evaluation = (interpreterEnvironment) => {
    let length = this.children.length;
    for (let i = 0; i < length; i++) {
      this.children[i].simple_evaluation(interpreterEnvironment);
    }
  };

  validate_articleTagCounter = (articleTagCounter, interpreterEnvironment) => {
    return (
      this.tagClass &&
      (articleTagCounter.values[2] || 0) < 10 &&
      articleTagCounter.verify(
        interpreterEnvironment.decisionTree,
        interpreterEnvironment.acceptancePercentage
      ) &&
      this.countTags() < interpreterEnvironment.maxTagsForAcceptance
    );
  };

  evaluate = (interpreterEnvironment, articleTagCounter) => {
    if (interpreterEnvironment.articleClasses.has(this.tagClass)) {
      interpreterEnvironment.articleClasses.add(this.tagClass);
      articleTagCounter.clear();
    } else {
      if (this.tag === 'article') {
        interpreterEnvironment.confirmedArticleClasses.add(this.tagClass);
        articleTagCounter.clear();
        return;
      }

      let childrenLength = this.children.length;
      articleTagCounter.add(2);

      if (childrenLength === 1) {
        this.children[0].evaluate(interpreterEnvironment, articleTagCounter);
        if (
          this.validate_articleTagCounter(
            articleTagCounter,
            interpreterEnvironment
          )
        ) {
          interpreterEnvironment.articleClasses.add(this.tagClass);
          articleTagCounter.clear();
        }
      } else {
        let newArticleCounter = new ArticleTagCounter();

        for (let i = 0; i < childrenLength; i++) {
          let childArticleCounter = new ArticleTagCounter();
          this.children[i].evaluate(
            interpreterEnvironment,
            childArticleCounter
          );
          newArticleCounter.merge(childArticleCounter);
        }

        if (
          this.validate_articleTagCounter(
            newArticleCounter,
            interpreterEnvironment
          )
        ) {
          interpreterEnvironment.articleClasses.add(this.tagClass);
          articleTagCounter.clear();
        } else {
          articleTagCounter.merge(newArticleCounter);
        }
      }
    }
  };
}

class TagNode extends NonUnaryTagNode {
  constructor(tag) {
    super(tag);
  }

  getTagClass = () => null;

  evaluate = (interpreterEnvironment, articleTagCounter) => {
    let childrenLength = this.numChildren();
    if (childrenLength === 0)
      articleTagCounter.add(correspondingTags[this.tag]);
    else {
      for (let i = 0; i < childrenLength; i++) {
        this.children[i].evaluate(interpreterEnvironment, articleTagCounter);
      }

      articleTagCounter.add(correspondingTags[this.tag]);
    }
  };
}

class UnaryTagNode extends Node {
  constructor(tag) {
    super(tag);
  }

  evaluate = (interpreterEnvironment, articleTagCounter) => {
    articleTagCounter.add(correspondingTags[this.tag]);
  };

  to_s = (start = 0) => `${start * ' '}${this.tag}\n`;

  countContentTags = () => 1;

  numChildren = () => 0;

  addChild = (child) => {};

  popChildren = () => {};

  getTagClass = () => null;
}

class SimpleNode {
  constructor(tag, tagClass = null, content = null) {
    this.tag = tag;
    this.tagClass = tagClass;
    this.content = content;
    this.link = null;
  }

  count_nodes = () => 1;

  to_s = (start = 0) =>
    `${start * ' '}${this.tag}${this.tagClass ? this.tagClass : ''} -> ${
      this.content
    }\n`;

  // __repr__():
  //     return "%s (%s)" % (.tag, this.tagClass)

  getChildren = () => [];

  isLeaf = () => true;

  compact = () => {};

  compactImg = () => {};

  filterChildren = () => 1;
}

class SimpleNonUnaryNode extends SimpleNode {
  constructor(tag, tagClass = null, content = null) {
    super(tag, tagClass, content);
    this.children = [];
  }

  addChild = (node) => {
    this.children.push(node);
  };

  getChildren = () => this.children;

  isLeaf = () => this.children.length === 0;

  count_nodes = () => {
    let sum = 1;

    for (let i = this.children.length - 1; i >= 0; i--)
      sum += this.children[i].count_nodes();

    return sum;
  };

  compact = () => {
    let length = this.children.length;
    for (let i = 0; i < length; i++) {
      let child = this.children[i];
      child.compact();
      this.content = child.content;
      this.link = child.link;
    }

    this.children = [];
  };

  compactImg = () => {
    let length = this.children.length;

    for (let i = 0; i < length; i++) {
      let child = this.children[i];
      child.compact();
      if (!child.tagClass.includes('loading')) {
        this.content = child.content;
        this.link = child.link;
      }
    }

    this.children = [];
  };

  to_s = (start = 0) => {
    let text = super.to_s(start);
    let children =
      this.count_nodes() - 1 > 0
        ? this.children.map((child) => child.to_s(start + 1)).join('')
        : '';

    return `${text}${children}`;
  };

  filterChildren = () => {
    this.children = this.children.filter(
      (child) => child.content || child.getChildren().length > 0
    );
    return this.children.length;
  };
}

class SimpleDivNode extends SimpleNonUnaryNode {
  constructor(tagClass = null, content = null) {
    super('div', tagClass, content);
  }
}

class SimpleUnaryTagNode extends SimpleNode {}

class SimpleTagNode extends SimpleNonUnaryNode {}

export {
  Node,
  NonUnaryTagNode,
  DivNode,
  TagNode,
  UnaryTagNode,
  SimpleNode,
  SimpleNonUnaryNode,
  SimpleDivNode,
  SimpleUnaryTagNode,
  SimpleTagNode,
};
