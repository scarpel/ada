import {
  NEWS_WEBSITES,
  NEWS_CATEGORIES,
  NEWS_ARTICLE_CLASSES,
  NEWS_ARTICLE_ELEMENTS,
  NEWS_INVALID_CATEGORIES,
  NEWS_KEYWORDS,
  USERS_NEWS_WEBSITES,
} from '../consts/databaseConsts.js';
import { get_formatted_date } from '../utils/dateUtils.js';
import { get_last_id } from '../utils/databaseUtils.js';
import { download_img } from '../utils/htmlFetcher.js';
import { NEWS_FAVICONS } from '../consts/paths.js';
import { ArticleElement, getCategoryObj } from '../utils/newsDataType.js';
import { NewsWebsiteInfo } from '../utils/dataTypes.js';
import { trim_url_protocols } from '../utils/websiteUtils.js';
import { numTypes, WEBSITE_TYPES } from '../consts/websiteTypes.js';

async function store_news_website(connection, newsWebsiteInfo) {
  try {
    await connection.prepare('BEGIN').run();
    await connection
      .prepare(`INSERT INTO ${NEWS_WEBSITES} VALUES(?,?,?,?,?,?,?)`)
      .run(
        null,
        trim_url_protocols(newsWebsiteInfo.url),
        newsWebsiteInfo.name,
        newsWebsiteInfo.type,
        newsWebsiteInfo.subtype,
        newsWebsiteInfo.score,
        moment().unix()
      );
    let id = await get_last_id(connection, NEWS_WEBSITES);
    if (newsWebsiteInfo.faviconUrl)
      download_img(newsWebsiteInfo.faviconUrl, NEWS_FAVICONS, id, 'ico');
    newsWebsiteInfo.id = id;
    await store_all_about_article(connection, newsWebsiteInfo);
    await store_all_about_categories(
      connection,
      id,
      newsWebsiteInfo.categories,
      newsWebsiteInfo.invalidCategories
    );

    await connection.prepare('COMMIT').run();

    return newsWebsiteInfo;
  } catch (error) {
    connection.prepare('ROLLBACK').run();
    throw error;
  }
}

async function store_news_websites(
  connection,
  newsWebsitesInfo,
  newsInfos,
  userId
) {
  for (let i = newsWebsitesInfo.length - 1; i >= 0; i--) {
    let newsInfo = newsWebsitesInfo[i];

    if (!newsInfo.id) {
      newsInfos[newsInfo.url] = newsInfo;
      await store_news_website(connection, newsInfo);
    }

    return store_user_news_website(connection, userId, newsInfo.id);
  }
}

function store_user_news_website(connection, userId, websiteId) {
  return connection.run(`INSERT INTO ${USERS_NEWS_WEBSITES} VALUES(?,?)`, [
    userId,
    websiteId,
  ]);
}

async function store_all_about_article(connection, websiteInfo) {
  let siteId = websiteInfo.id;
  let entries = Object.entries(websiteInfo.articlesInfo);

  for (let i = entries.length - 1; i >= 0; i--) {
    let [articleClass, articleElements] = entries[i];
    let id = await store_article_class(connection, siteId, articleClass);
    store_article_elements(connection, id, articleElements);
  }
}

function store_all_about_categories(
  connection,
  websiteID,
  categories,
  invalidCategoriesSet
) {
  store_news_categories(connection, websiteID, categories);
  store_news_invalid_categories(connection, websiteID, [
    ...invalidCategoriesSet,
  ]);
}

async function store_news_category(connection, newsWebsiteID, category, name) {
  await connection
    .prepare(`INSERT INTO ${NEWS_CATEGORIES} VALUES(?,?,?,?)`)
    .run(null, category, name, newsWebsiteID);
  return get_last_id(connection, NEWS_CATEGORIES);
}

async function store_news_categories(connection, newsWebsiteID, categories) {
  let entries = Object.entries(categories);

  for (let i = entries.length - 1; i >= 0; i--) {
    let [category, obj] = entries[i];
    obj.id = await store_news_category(
      connection,
      newsWebsiteID,
      category,
      obj.name
    );
  }
}

function store_news_invalid_category(connection, newsWebsiteID, category) {
  connection
    .prepare(`INSERT INTO ${NEWS_INVALID_CATEGORIES} VALUES(?,?,?)`)
    .run(null, category, newsWebsiteID);
}

function store_news_invalid_categories(
  connection,
  newsWebsiteID,
  invalidCategoriesArray
) {
  for (let i = invalidCategoriesArray.length - 1; i >= 0; i--) {
    store_news_invalid_category(
      connection,
      newsWebsiteID,
      invalidCategoriesArray[i]
    );
  }
}

async function store_article_class(connection, newsWebsiteID, articleClass) {
  await connection
    .prepare(`INSERT INTO ${NEWS_ARTICLE_CLASSES} VALUES(?,?,?)`)
    .run(null, articleClass, newsWebsiteID);
  return get_last_id(connection, NEWS_ARTICLE_CLASSES);
}

function store_article_element(
  connection,
  tag,
  tagClass,
  elementType,
  articleClassID
) {
  if (tag) {
    connection
      .prepare(`INSERT INTO ${NEWS_ARTICLE_ELEMENTS} VALUES(?,?,?,?,?)`)
      .run(null, tag, tagClass, elementType, articleClassID);
  }
}

function store_article_elements(connection, articleClassID, articleElements) {
  let entries = Object.entries(articleElements);
  let length = entries.length;

  for (let i = 0; i < length; i++) {
    let [type, element] = entries[i];
    if (element)
      store_article_element(
        connection,
        element.tag,
        element.tagClass,
        type,
        articleClassID
      );
  }
}

async function store_invalid_categories_after_gathering(
  connection,
  knownWebsites
) {
  let values = Object.values(knownWebsites);

  for (let i = values.length - 1; i >= 0; i--) {
    let [_, invalidCategories, newsInfo] = values[i];
    store_news_invalid_categories(connection, newsInfo.id, [
      ...invalidCategories,
    ]);
  }
}

async function store_categories_after_gathering_of_known(
  connection,
  selectedInfos
) {
  for (let i = selectedInfos.length - 1; i >= 0; i--) {
    let [newsInfo, categories] = selectedInfos[i];
    await store_news_categories(connection, newsInfo.id, categories);
  }
}

async function store_keyword(connection, keyword, user_id) {
  await connection
    .prepare(`INSERT INTO ${NEWS_KEYWORDS} VALUES(?,?,?)`)
    .run(null, keyword, user_id);
  return get_last_id(connection, NEWS_KEYWORDS);
}

async function retrieve_categories(connection, newsWebsiteID) {
  let categories = await connection.all(
    `SELECT * FROM ${NEWS_CATEGORIES} WHERE website_id = ${newsWebsiteID}`
  );
  let categoriesLength = categories.length;
  let categoriesObj = {};

  for (let i = 0; i < categoriesLength; i++) {
    let obj = categories[i];
    categoriesObj[obj.url] = getCategoryObj(obj.name, obj.id);
  }

  return categoriesObj;
}

async function retrive_invalid_categories(connection, newsWebsiteID) {
  let categories = await connection.all(
    `SELECT * FROM ${NEWS_INVALID_CATEGORIES} WHERE website_id = ${newsWebsiteID}`
  );
  let categoriesLength = categories.length;
  let categoriesArr = [];

  for (let i = 0; i < categoriesLength; i++)
    categoriesArr.push(categories[i].url);

  return new Set(categoriesArr);
}

async function retrieve_articles_info(connection, newsWebsiteID) {
  let articleClasses = {};
  let values = await connection.all(
    `SELECT id, class FROM ${NEWS_ARTICLE_CLASSES} WHERE website_id=${newsWebsiteID}`
  );

  for (let i = values.length - 1; i >= 0; i--) {
    let { id, class: articleClass } = values[i];
    let obj = {};

    let elements = await connection.all(
      `SELECT tag, class, element_type FROM ${NEWS_ARTICLE_ELEMENTS} WHERE article_class_id=${id}`
    );
    let length = elements.length;

    for (let j = 0; j < length; j++) {
      let element = elements[j];
      obj[element.element_type] = new ArticleElement(
        element.tag,
        element.class
      );
    }

    articleClasses[articleClass] = obj;
  }

  return articleClasses;
}

async function retrieve_newsWebsiteInfos(connection, userId) {
  let websites = connection.all(
    `SELECT * FROM ${NEWS_WEBSITES} WHERE user_id=?`,
    [userId]
  );
  let obj = {};
  let lookupTable = {};

  for (let i = websites.length - 1; i >= 0; i--) {
    let newsInfo = await fill_up_newsWebsiteInfo(
      connection,
      NewsWebsiteInfo.fromObject(websites[i])
    );
    lookupTable[website.url] = newsInfo.id;
    obj[website.id] = newsInfo;
  }

  return [obj, lookupTable];
}

async function retrieve_newsWebsiteInfo(
  connection,
  websiteId = undefined,
  url = undefined
) {
  let website = await connection.get(
    `SELECT * FROM ${NEWS_WEBSITES} WHERE ${
      websiteId ? `id = ${websiteId}` : `url = '${trim_url_protocols(url)}'`
    }`
  );

  if (website) {
    let newsInfo = await fill_up_newsWebsiteInfo(
      connection,
      NewsWebsiteInfo.fromObject(website)
    );
    return newsInfo;
  }

  return null;
}

async function retrieve_newsWebsiteInfo_from_url(connection, url) {
  let website = await connection.get(
    `SELECT * FROM ${NEWS_WEBSITES} WHERE url = ?`,
    [trim_url_protocols(url)]
  );

  if (website) {
    let newsInfo = NewsWebsiteInfo.fromObject(website, url);
    fill_up_newsWebsiteInfo(connection, newsInfo);
    return newsInfo;
  }

  return null;
}

async function retrieve_keywords(connection, user_id) {
  let result = await connection.all(
    `SELECT * FROM ${NEWS_KEYWORDS} WHERE user_id=?`,
    [user_id]
  );
  let length = result.length;
  let obj = {};

  for (let i = 0; i < length; i++) {
    let { id, keyword } = result[i];
    obj[keyword] = id;
  }

  return obj;
}

async function get_websites_by_types(connection, types, websiteIds = []) {
  const allTypes = types.length === numTypes;
  const setFormat = (arr) => `(${arr})`;

  if (allTypes) {
    if (websiteIds.length) {
      return await connection.all(
        `SELECT * FROM news_websites WHERE id NOT IN ${setFormat(websiteIds)}`
      );
    } else return await connection.all('SELECT * FROM news_websites');
  } else {
    if (websiteIds.length) {
      return await connection.all(
        `SELECT * FROM news_websites WHERE type IN ${setFormat(
          types
        )} AND id NOT IN ${setFormat(websiteIds)}`
      );
    } else
      return await connection.all(
        `SELECT * FROM news_websites WHERE type IN ${setFormat(types)}`
      );
  }
}

function delete_keyword(connection, id) {
  connection.prepare(`DELETE FROM ${NEWS_KEYWORDS} WHERE id=${id}`).run();
}

function delete_news_website(connection, id) {
  connection.prepare(`DELETE FROM ${NEWS_WEBSITES} WHERE id=${id}`).run();
}

function delete_news_category(connection, id) {
  connection.prepare(`DELETE FROM ${NEWS_CATEGORIES} WHERE id=${id}`).run();
}

function delete_user_news_website(connection, userId, websiteId) {
  connection
    .prepare(
      `DELETE FROM ${USERS_NEWS_WEBSITES} WHERE user_id=? AND website_id=?`
    )
    .run(userId, websiteId);
}

async function fill_up_newsWebsiteInfo(connection, newsWebsiteInfo) {
  let id = newsWebsiteInfo.id;
  newsWebsiteInfo.articlesInfo = await retrieve_articles_info(connection, id);
  newsWebsiteInfo.categories = await retrieve_categories(connection, id);
  newsWebsiteInfo.invalidCategories = await retrive_invalid_categories(
    connection,
    id
  );

  return newsWebsiteInfo;
}

export {
  store_news_website,
  store_news_category,
  store_news_categories,
  store_article_class,
  store_article_element,
  store_article_elements,
  retrieve_articles_info,
  retrieve_newsWebsiteInfos,
  retrieve_newsWebsiteInfo,
  store_news_invalid_category,
  store_news_invalid_categories,
  store_all_about_categories,
  fill_up_newsWebsiteInfo,
  retrieve_categories,
  retrive_invalid_categories,
  store_invalid_categories_after_gathering,
  store_news_websites,
  store_categories_after_gathering_of_known,
  store_keyword,
  retrieve_keywords,
  delete_keyword,
  delete_news_website,
  delete_news_category,
  store_user_news_website,
  delete_user_news_website,
  retrieve_newsWebsiteInfo_from_url,
  get_websites_by_types,
};
