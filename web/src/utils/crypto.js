import NodeRSA from 'node-rsa';
import request from './request';
import CryptoWorker from './worker?worker';

/**
 * 导入私钥
 * @returns {Promise}
 */
export function importPrivateKey() {
  const key = new NodeRSA();
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style = 'display: none; width: 0; height: 0; opactity: 0';
    fileInput.accept = '.pem';
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const fileReader = new FileReader();
        fileReader.addEventListener('load', (evt) => {
          let privateKey = evt.target.result;
          try {
            key.importKey(privateKey, 'pkcs8');
          } catch (e) {
            return reject(new Error('私钥文件不合法'));
          }
          const publicKey = key.exportKey('public');
          resolve({ publicKey, privateKey });
        });
        fileReader.readAsText(file);
      } else {
        reject(new Error('请选择私钥文件'));
      }
    });
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  });
}

/**
 * 同步公钥
 * @param {String} key 公钥key
 */
export async function syncPublicKey(key) {
  if (!key) return;
  const result = await request({
    url: '/sync_public_key',
    data: {
      publicKey: key,
    },
  });
  if (result.code !== 0) {
    console.error('公钥同步失败：%s', result.message);
  }
}

// 开启webworker线程处理加解密
function startWorker({ type, payload }) {
  return new Promise((resolve, reject) => {
    const worker = new CryptoWorker();
    worker.onmessage = function (event) {
      resolve(event.data);
    };
    worker.onerror = function (e) {
      reject(e);
    };
    worker.postMessage({ type, payload });
  });
}

/**
 * 公钥加密
 * @param {Object|String} target 加密内容
 * @param {String} key 公钥
 * @returns
 */
export function encrypt(target, key) {
  return startWorker({
    type: 'encrypt',
    payload: { target, key },
  });
}

/**
 * 私钥解密
 * @param {String} target 解密对象
 * @param {String} key 私钥
 * @returns
 */
export function decrypt(target, key) {
  return startWorker({
    type: 'decrypt',
    payload: { target, key },
  });
}
