import { isType } from '.';

function parse(val) {
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

export default function (prefix = 'PRICHAT_') {
  return {
    get(key) {
      const data = localStorage.getItem(`${prefix}${key}`);
      return parse(data);
    },
    set(key, value) {
      const fullKey = `${prefix}${key}`;
      let data = value;
      if (isType(value, 'object') || isType(value, 'array')) {
        data = JSON.stringify(value);
      }
      return localStorage.setItem(fullKey, String(data));
    },
    remove(key) {
      const fullKey = `${prefix}${key}`;
      localStorage.removeItem(fullKey);
    },
  };
}
