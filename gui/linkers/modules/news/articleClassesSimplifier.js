import { ArticleItems } from '../utils/dataTypes.js';
import { sumArticleCode, sumArticleElementsTableCode } from '../utils/utils.js';

function simplify_classes(predictedClasses) {
  let sorted = {};
  let splittedClasses = {};
  let entries = Object.entries(predictedClasses);

  if (entries.length === 1) return predictedClasses;

  for (let i = 0, length = entries.length; i < length; i++) {
    let entry = entries[i];
    let splitted = entry[0].split(' ');

    if (splitted[0] in sorted) {
      sorted[splitted[0]].push(entry);
      splittedClasses[splitted[0]].push(splitted);
    } else {
      sorted[splitted[0]] = [entry];
      splittedClasses[splitted[0]] = [splitted];
    }
  }

  console.log(sorted, splittedClasses);

  return analyse_sorted_classes(sorted, splittedClasses);
}

function createArticleItemsObj() {
  return {
    0: new Set(),
    1: new Set(),
    2: new Set(),
    3: new Set(),
    4: new Set(),
  };
}

function analyse_sorted_classes(sortedClasses, splittedClasses) {
  return Object.assign(
    {},
    ...Object.keys(sortedClasses).map((key) =>
      analyse_sorted_class(sortedClasses[key], splittedClasses[key])
    )
  );
}

function analyse_sorted_class(sortedArray, splittedArray) {
  if (sortedArray.length === 1)
    return { [sortedArray[0][0]]: sortedArray[0][1] };

  const articleItemsObj = createArticleItemsObj();
  const articleItemsKeys = Object.keys(articleItemsObj);
  const articleItemsLength = articleItemsKeys.length;
  let bestArticle = [0, null];

  for (let i = 1, length = sortedArray.length; i < length; i++) {
    const articleObj = sortedArray[i][1];

    for (let j = 0; j < articleItemsLength; j++) {
      const articleKey = articleItemsKeys[j];
      const element = articleObj[articleKey];

      if (element?.tagClass) {
        const articleItemSet = articleItemsObj[articleKey];
        articleItemSet.add(`${element.tag}.${element.tagClass}`);

        if (articleItemSet.size > 1) {
          return Object.fromEntries(sortedArray);
        } else {
          console.log(articleObj[ArticleItems.CODE]);
          const count = sumArticleCode(articleObj[ArticleItems.CODE]);
          if (count > bestArticle[0]) {
            bestArticle = [count, articleObj];
          }
        }
      }
    }
  }

  return { [splittedArray[0][0]]: bestArticle[1] };
}

function calculateDelimiter(currentDelimiter, splittedA, splittedB) {
  for (let i = 1; i < currentDelimiter; i++) {
    if (splittedA[i] !== splittedB[i]) return i;
  }

  return currentDelimiter;
}

function isSame(a, b) {
  if (a[ArticleItems.CODE] !== b[ArticleItems.CODE]) return false;

  let keys = Object.keys(a);
  keys.pop();

  for (let i = 0, length = keys.length; i < length; i++) {
    let key = keys[i];
    if (
      key !== ArticleItems.AUTHOR &&
      a[key].tag !== b[key].tag &&
      a[key].tagClass !== b[key].tagClass
    )
      return false;
  }

  return true;
}

export { simplify_classes };
