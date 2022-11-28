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
  return new Notification(title, {
    body,
    tag: 'private_chat',
    ...options,
  });
}

export function notify(body, title, options = {}) {
  if (!window.Notification) {
    console.error('unsupport Notification api');
    return;
  }
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
