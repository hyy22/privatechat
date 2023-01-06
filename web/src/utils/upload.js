import request from './request';
import config from '../config';

export function buildFileInput({ multiple = false, accept, onChange }) {
  // 构造elem
  const input = document.createElement('input');
  input.type = 'file';
  input.style = 'display: none; opacity: 0; width: 0; height: 0;';
  input.multiple = multiple;
  input.accept = accept;
  input.addEventListener('change', onChange);
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

export default function upload(opts = {}) {
  return new Promise((resolve, reject) => {
    const {
      multiple = false,
      maxCount = 0,
      accept,
      maxSize = 0,
      beforeUpload,
    } = opts;
    buildFileInput({
      multiple,
      accept,
      onChange: async function (e) {
        const files = [...e.target.files];
        // 未选文件直接返回
        if (!files.length) {
          return resolve([]);
        }
        // 判断数量
        if (multiple && maxCount > 0 && files.length > maxCount) {
          return reject(new Error(`单次最大允许上传${maxCount}个文件`));
        }
        // 判断大小
        if (
          maxSize > 0 &&
          files.reduce((prev, cur) => prev + cur.size, 0) > maxSize
        ) {
          return reject(new Error(`选中文件大小超出限制${maxSize}`));
        }
        // 自定义限制，需要显式返回true，或者resolve(true)
        if (typeof beforeUpload === 'function') {
          let pass;
          try {
            pass = await beforeUpload(multiple ? files : files[0]);
          } catch (e) {
            return reject(e);
          }
          if (!pass) return;
        }
        // 上传文件
        const formData = new FormData();
        files.forEach((file) => formData.append('file', file));
        const result = await request({
          url: '/upload',
          data: formData,
          loading: true,
        });
        if (result.code === 0) {
          let { files: urls = [] } = result.data;
          urls = urls.map((v) => `${config.BASE_URL}/${v}`);
          resolve(multiple ? urls : urls[0]);
        } else {
          reject(new Error(result.message));
        }
      },
    });
  });
}
