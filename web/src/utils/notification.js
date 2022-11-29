export function initNotify() {
  if (!window.Notification) {
    console.error('unsupport Notification api');
    return;
  }
  if (Notification.permission !== 'granted') {
    Notification.requestPermission(function (status) {
      if (Notification.permission !== status) {
        Notification.permission = status;
      }
    });
  }
}

function createNotify(body, title, options = {}) {
  let notify = new Notification(title, {
    body,
    // tag: 'private_chat',
    ...options,
  });
  notify.onclick = () => {
    window.focus();
    notify.close();
  };
  return notify;
}

export function notify(body, title, options = {}) {
  if (!window.Notification) {
    console.error('unsupport Notification api');
    return;
  }
  console.log('notification start');
  let notifier;
  if (Notification.permission === 'granted') {
    notifier = createNotify(body, title, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (status) {
      if (Notification.permission !== status) {
        Notification.permission = status;
      }
      if (status === 'granted') {
        notifier = createNotify(body, title, options);
      }
    });
  } else {
    console.error('granted fail');
  }
  return notifier;
}
