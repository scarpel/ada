import {
  gimmeRandom,
  sumArticleElementsTableCode,
  get,
} from '../utils/utils.js';
import {
  Counter,
  createArticleElementsTable,
  ArticleItems,
} from '../utils/dataTypes.js';
import { isLinkValid } from '../utils/websiteUtils.js';
import { ArticleElement } from '../utils/newsDataType.js';

class ArticlePredictor {
  constructor() {
    this.titleTagScore = { h: 10, s: 2, d: 3, a: 3, p: -1 };
    this.headerTagScore = { h: 10, s: 3, d: 3, p: -1 };
    this.descriptionTagScore = { h: 0, s: 0, d: 3, p: 3 };
    this.unwantedImgKeywords = ['avatar', 'logo'];
    this.minLenDesc = 25;
    this._reset();
  }

  _reset = () => {
    this.link = null;
    this.last = [];
    this.img = null;
    this.imgLink = null;
    this.texts = [];
  };

  separate = (node, parents) => {
    this._separate(node, new Set(), parents);

    if (!this.imgLink) this.imgLink = node.link;

    return this.img, this.texts;
  };

  _separate = (node, tagClassSet, parents) => {
    if (node.isLeaf()) {
      if (node.content) {
        let parent = this.last[this.last.length - 1];
        let childrenLength = parent.getChildren().length;

        if (
          (tagClassSet.has(node.tagClass) || !node.tagClass) &&
          childrenLength === 1 &&
          node.tag !== 'img'
        ) {
          parent.compact();
          this.texts.push(parent);
          if (node.tag.length === 2 && node.tag[0] === 'h')
            parent.hasHeader = true;
          parents[parent.tagClass] = this.hashNode(parent);
        } else {
          if (this.link) {
            node.link = this.link;
            this.link = null;
          }

          if (node.tag === 'img') {
            if (
              !this.img &&
              !this.unwantedImgKeywords.some((key) =>
                node.tagClass.includes(key)
              )
            ) {
              if (!node.tagClass || node.tagClass === '')
                this.img = this.last[this.last.length - 1];
              else this.img = node;

              if (node.link) this.imgLink = node.link;
            }
          } else {
            this.texts.push(node);
          }
        }

        if (childrenLength === 1)
          parents[node.tagClass] = this.hashNode(parent);
        tagClassSet.add(node.tagClass);
      }
    } else {
      tagClassSet.add(node.tagClass);

      if (node.tag === 'a') {
        this.link = node.link;
      }

      this.last.push(node);
      let children = node.getChildren();
      let lenChildren = children.length;

      for (let i = 0; i < lenChildren; i++)
        this._separate(children[i], tagClassSet, parents);

      this.last.pop();
    }
  };

  predict = (node, parents = {}) => {
    this._reset();
    this.separate(node, parents);

    if (
      this.img &&
      this.img.tag === 'img' &&
      (!this.imgLink || !isLinkValid(this.img.content))
    ) {
      return [null, null, null, null];
    }

    console.log(this.img, this.texts);

    let [titleIndex, title] = this._predict(
      this.texts,
      this.titleTagScore,
      this._titleExtraFunc,
      -3
    );

    if (titleIndex !== -1) {
      let [headerIndex, header] = this._predict(
        this.texts.slice(0, titleIndex),
        this.headerTagScore,
        this._headerExtraFunc
      );
      let [descriptionIndex, description] = this._predict(
        this.texts.slice(titleIndex + 1),
        this.descriptionTagScore,
        this._descriptionExtraFunc
      );
      let [authorIndex, author] = this._predictAuthor(
        this.texts.slice(
          descriptionIndex ? titleIndex + descriptionIndex + 1 : titleIndex + 1
        )
      );

      return [this.img, header, title, description, author];
    } else return [null, null, null, null, null];
  };

  predictFromNodes = (nodes, randomFactor = 1) => {
    let length = nodes.length;
    let imgs = new Counter();
    let headers = new Counter();
    let titles = new Counter();
    let descriptions = new Counter();
    let authors = new Counter();
    let parents = {};

    if (randomFactor !== 1) {
      let indexes = gimmeRandom(
        Math.ceil(length * (length > 10 ? randomFactor : 1)),
        0,
        length
      );
      let indexesLength = indexes.length;

      for (let i = 0; i < indexesLength; i++) {
        let [img, header, title, description, author] = this.predict(
          nodes[indexes[i]],
          parents
        );

        imgs.add(this.hashNode(img));
        headers.add(this.hashNode(header));
        titles.add(this.hashNode(title));
        descriptions.add(this.hashNode(description));
        authors.add(this.hashNode(author));
      }
    } else {
      for (let i = 0; i < length; i++) {
        let [img, header, title, description, author] = this.predict(
          nodes[i],
          parents
        );

        imgs.add(this.hashNode(img));
        headers.add(this.hashNode(header));
        titles.add(this.hashNode(title));
        descriptions.add(this.hashNode(description));
        authors.add(this.hashNode(author));
      }
    }
    console.log(imgs, headers, titles, descriptions, authors);
    titles = this.verify_table(titles, parents);

    if (titles.keys().length > 0 || length > 35) {
      imgs = this.verify_table(imgs, parents);
      headers = this.verify_table(headers, parents);
      descriptions = this.verify_table(descriptions, parents);
      authors = this.verify_authors_table(authors, parents);
      return createArticleElementsTable(
        this.createElement(imgs.getKeyWithHigherValue()),
        this.createElement(headers.getKeyWithHigherValue()),
        this.createElement(titles.getKeyWithHigherValue()),
        this.createElement(descriptions.getKeyWithHigherValue()),
        this.createElement(authors.getKeyWithHigherValue())
      );
    } else return createArticleElementsTable();
  };

  verify_imgs_table = (imgTable) => {
    let keys = imgTable.keys();

    if (keys.length === 1 && !keys[0]) return false;
    else return true;
  };

  verify_table = (table, parents) => {
    table.pop(null);
    let keys = table.keys();
    let length = keys.length;
    if (length > 1) {
      return this.evaluate_parents_of_table(table, parents);
    } else if (length === 1 && keys[0].includes('byline')) table.pop(keys[0]);

    return table;
  };

  verify_authors_table = (table) => {
    table.pop(null);
    return table;
  };

  evaluate_parents_of_table = (table, parents) => {
    let keys = table.keys();
    let length = keys.length;
    if (length <= 1) return table;

    let newTable = new Counter();

    for (let i = 0; i < length; i++) {
      let tagClass = keys[i];
      if (tagClass.indexOf('byline') === -1) {
        let parent = parents[tagClass.slice(tagClass.indexOf('.') + 1)];
        if (parent) {
          if (!newTable.values[parent] && newTable.keys().length === 1)
            return table;
          else newTable.add(parent);
        }
      }
    }

    return newTable.keys() > 0 ? newTable : table;
  };

  hashNode = (node) => {
    if (!node) return null;
    else return `${node.tag}.${node.tagClass}`;
  };

  createElement = (hashNode) => {
    if (!hashNode) return null;
    else {
      let dot = hashNode.find('.');
      return new ArticleElement(
        hashNode.slice(0, dot),
        hashNode.slice(dot + 1)
      );
    }
  };

  validadeClassName = (className) => {
    const lower = className.toLowerCase();
    return !['wildcard', 'follow'].some((value) => lower.includes(value));
  };

  predictFromClasses = (classes, randomFactor = 1, maxSize = 35) => {
    let labeledClasses = {};
    let entries = Object.entries(classes);
    let length = entries.length;

    for (let i = 0; i < length; i++) {
      let [nodeClass, nodes] = entries[i];

      if (nodes.length > 0) {
        if (
          this.validadeClassName(nodeClass) &&
          nodes[0].count_nodes() < maxSize
        ) {
          labeledClasses[nodeClass] = this.predictFromNodes(
            nodes,
            randomFactor
          );
        }
      }
    }

    entries = Object.entries(labeledClasses);
    length = entries.length;
    let newObj = {};

    for (let i = 0; i < length; i++) {
      let [divClass, table] = entries[i];
      if (
        sumArticleElementsTableCode(table) > 0 &&
        table[ArticleItems.CODE] >= '0010'
      )
        newObj[divClass] = table;
    }

    return newObj;
  };

  _assessTag = (tag, scores) => get(scores, tag[0], 0) + this._assessHTag(tag);

  _assessHTag = (tag) => (tag[0] === 'h' ? 10 - parseInt(tag[1]) : 0);

  _titleExtraFunc = (node) => {
    let sum;
    const tagClass = node.tagClass.toLowerCase();

    if (this.img) sum = node.link && node.link === this.imgLink ? 2 : -10;
    else sum = node.link && isLinkValid(node.link) ? 2 : -10;

    if (tagClass.includes('share')) return -1000;
    else if (
      ['title', 'headline'].some((value) => tagClass.includes(value)) &&
      !tagClass.includes('subtitle')
    )
      sum += 10;

    if (node.hasHeader) sum += 11;

    return sum + (!node.tagClass ? -10 : 0);
  };

  _headerExtraFunc = (node) =>
    !node.tagClass ||
    !['date', 'time'].some((word) => node.tagClass.includes(word))
      ? (!node.link || node.link !== this.imgLink ? 0 : -2) +
        (!node.tagClass ? -2 : 0)
      : -15;

  _descriptionExtraFunc = (node) =>
    (!node.link ? 2 : -3) +
    (node.tagClass.toLowerCase().includes('eyebrow') ? 10 : 0) +
    (node.content.trim().length > this.minLenDesc ? 1 : -10);

  _predict = (texts, scoresTable, extraFunc, nodeScoreStart = 0) => {
    if (!texts) return [null, null];

    let node = null;
    let nodeScore = nodeScoreStart;
    let nodeIndex = -1;
    let length = texts.length;

    if (length > 1) {
      for (let i = 0; i < length; i++) {
        let text = texts[i];
        if (text.content.length > 5) {
          let score = this._assessTag(text.tag, scoresTable) + extraFunc(text);

          if (score > nodeScore) {
            node = text;
            nodeScore = score;
            nodeIndex = i;
          }
        }
      }
    } else if (length === 1 && texts[0].tagClass.indexOf('share') === -1) {
      node = texts[0];
      nodeIndex = 0;
    }

    return [nodeIndex, node];
  };

  _predictAuthor(texts) {
    let length = texts.length;

    for (let i = 0; i < length; i++) {
      let text = texts[i];
      const lower = text.tagClass.toLowerCase();
      if (
        text.content &&
        ['author', 'byline'].some((value) => lower.includes(value))
      )
        return [i, text];
    }

    return [null, null];
  }
}

export default ArticlePredictor;
