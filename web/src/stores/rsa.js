import { defineStore } from 'pinia';
import cache from '../utils/cache';
import NodeRSA from 'node-rsa';

export const useRsaStore = defineStore('rsa', {
  state: () => {
    return {
      publicKey: cache().get('public_key') || '',
      privateKey: cache().get('private_key') || '',
    };
  },
  actions: {
    // 更新证书
    updateRsaKeys(pubk, prik) {
      let publicKey = pubk;
      let privateKey = prik;
      if (!pubk || !prik) {
        const key = new NodeRSA({ b: 512 });
        publicKey = key.exportKey('public');
        privateKey = key.exportKey('pkcs8');
      }
      this.publicKey = publicKey;
      this.privateKey = privateKey;
      cache().set('public_key', publicKey);
      cache().set('private_key', privateKey);
    },
  },
});
