import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * 格式化日期为相对时间
 * @param {String} d 日期
 * @returns
 */
export function formatRelativeTime(d) {
  return dayjs(d).fromNow();
}

/**
 * 格式化日期
 * @param {String} d 日期
 * @param {String} fmt 格式
 * @returns
 */
export function formatTime(d, fmt = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs(d).format(fmt);
}

/**
 * 判断元素是否某种类型
 * @param {*} o 元素
 * @param {String} targetType 类型
 * @returns {Boolean}
 */
export const isType = (o, targetType) => {
  return (
    Object.prototype.toString.call(o).toLowerCase() ===
    `[object ${targetType}]`.toLowerCase()
  );
};

/**
 * 深拷贝
 * @param {Object} o 对象
 * @returns
 */
export function deepCopy(o) {
  return JSON.parse(JSON.stringify(o));
}

/**
 * 图片压缩
 * @param {{img: File, size: Number, quality: Number}} param0
 * @returns
 */
export function imgOptimizate({ img, size, quality = 90 }) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', (e) => {
      const { result } = e.target;
      const image = new Image();
      image.addEventListener('load', () => {
        const { width: originalWidth, height: originalHeight } = image;
        if (originalWidth <= size) {
          return resolve(img);
        }
        let canvas = document.createElement('canvas');
        const targetWidth = size;
        const targetHeight = (originalHeight * size) / originalWidth;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          image,
          0,
          0,
          originalWidth,
          originalHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );
        canvas.toBlob(
          (b) => {
            resolve(new File([b], img.name, { type: img.type }));
            canvas = null;
          },
          img.type,
          quality
        );
      });
      image.addEventListener('error', (e) => reject(e));
      image.src = result;
    });
    fileReader.addEventListener('error', (e) => reject(e));
    fileReader.readAsDataURL(img);
  });
}

/**
 * 读取图片内容
 * @param {File} img 图片对象
 * @returns
 */
export function readImageFile(img) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', (e) => {
      resolve(e.target.result);
    });
    fileReader.addEventListener('error', (e) => reject(e));
    fileReader.readAsDataURL(img);
  });
}

/**
 * 下载文件
 * @param {Blob} blob 文件内容
 * @param {String} name 文件名
 */
export function saveFile(blob, name) {
  const a = document.createElement('a');
  a.download = name;
  const url = URL.createObjectURL(blob);
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * 响应式计算
 * @param {Number} px 设计稿尺寸
 * @param {Number} base 基准
 * @returns
 */
export function responsive(px, base = 750) {
  return (document.documentElement.clientWidth * px) / base;
}

/**
 * 数组展开
 * @param {Array} target 展开对象
 * @returns
 */
export function flatArray(target = []) {
  return target.reduce(
    (prev, cur) =>
      !Array.isArray(cur) ? prev.concat(cur) : prev.concat(flatArray(cur)),
    []
  );
}
