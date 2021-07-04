import { addNewUser } from '../../signUp.js';
import { store_user_news_website } from '../news/storageNews.js';

const people = [
  ['Ana', [0, 0]],
  ['Ben', [1, 1]],
  ['Johnson', [2, 2]],
  ['Savanah', [3, 3]],
  ['Judy', [4, 4]],
  ['Parker', [5, 5]],
  ['Junior', [6, 6]],
  ['Betany', [7, 7]],
  ['Ella', [8, 8]],
  ['Bil', [0, 1]],
  ['Carter', [5, 6]],
  ['Sarah', [0, 7]],
  ['Jordan', [0, 8]],
  ['Hannah', [4, 8]],
  ['Albert', [2, 3]],
];

const websites_id = {
  0: 1,
  1: 2,
  2: 3,
  3: 9,
  4: 8,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
};

export async function populateDB() {
  for (let i = 0, length = people.length; i < length; i++) {
    const [name, websites] = people[i];

    const id = await addNewUser(
      `${name.toLowerCase()}@ada.com`,
      '123456',
      name,
      0,
      1621101142
    );

    websites.forEach((type) => {
      store_user_news_website(database, id, websites_id[type]);
    });
  }
}
