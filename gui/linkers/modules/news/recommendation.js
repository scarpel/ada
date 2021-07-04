// import { WEBSITE_TYPES } from '../consts/websiteTypes.js';
// import { zeroArray } from '../utils/utils.js';

import { getTypesAndSubtypes, getWebsitesId } from '../utils/newsUtils.js';
import { getRandoms } from '../utils/utils.js';
import { get_websites_by_types } from './storageNews.js';

// const websiteTypesLength = Object.keys(WEBSITE_TYPES).length;

// async function getXMoreFrequent(x) {
//   if (x > 0) {
//     return await database.all(
//       'SELECT id, name FROM users WHERE id>10 ORDER BY news_websites DESC LIMIT ?',
//       [x]
//     );
//   } else return [];
// }

// function getNewsWebsitesFromUser(id) {
//   return database.all(
//     'SELECT u.website_id as id, n.type FROM users_news_websites u, news_websites n WHERE u.user_id=? AND u.website_id=n.id',
//     [id]
//   );
// }

// async function getNewsWebsitesFromUsers(users) {
//   for (let i = 0, length = users.length; i < length; i++) {
//     const user = users[i];
//     user.websites = await getNewsWebsitesFromUser(user.id);
//   }

//   return users;
// }

// function scoreWebsites(websites, reference) {
//   let sum = 0;
//   const total = websites.length;

//   for (let i = 0; i < total; i++) {
//     if (reference.includes(websites[i].type)) {
//       sum++;
//     }
//   }

//   return sum / total;
// }

// function scoreUsersWebsites(users, reference) {
//   for (let i = 0, length = users.length; i < length; i++) {
//     const user = users[i];
//     user.score = scoreWebsites(user.websites, reference);
//   }

//   return users;
// }

// function getXWithBestScore(users, x, cut = 0.5) {
//   return users
//     .filter((user) => user.score >= cut)
//     .sort((a, b) => b.score - a.score)
//     .slice(0, x);
// }

// export {
//   getXMoreFrequent,
//   getNewsWebsitesFromUsers,
//   scoreUsersWebsites,
//   getXWithBestScore,
// };

async function recommendMe(userNewsWebsites, connection = database) {
  const types = getTypesAndSubtypes(userNewsWebsites);
  const ids = getWebsitesId(userNewsWebsites);

  return await get_websites_by_types(connection, types, ids);
}

function chooseForMe(websites, limit = null) {
  const length = websites.length;

  if (length > limit) {
    const randoms = getRandoms(1, length, limit);
    return randoms.map((index) => websites[index]);
  } else return websites;
}

export { recommendMe, chooseForMe };
