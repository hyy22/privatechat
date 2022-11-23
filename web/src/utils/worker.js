import NodeRSA from 'node-rsa';
import { isType } from '.';

function createRsa(key, isPrivateKey = false) {
  const rsa = new NodeRSA();
  rsa.setOptions({
    environment: 'browser',
  });
  rsa.importKey(key, isPrivateKey ? 'pkcs8-private-pem' : 'pkcs8-public-pem');
  return rsa;
}

onmessage = function (event) {
  const { type, payload } = event.data;
  switch (type) {
    case 'encrypt': {
      const rsa = createRsa(payload.key);
      const result = rsa.encrypt(
        isType(payload.target, 'object')
          ? JSON.stringify(payload.target)
          : String(payload.target),
        'base64'
      );
      this.postMessage(result);
      this.close();
      break;
    }
    case 'decrypt': {
      const rsa = createRsa(payload.key, true);
      let result = rsa.decrypt(payload.target, 'utf8');
      try {
        result = JSON.parse(result);
      } catch (e) {
        //
      }
      this.postMessage(result);
      this.close();
    }
  }
};
