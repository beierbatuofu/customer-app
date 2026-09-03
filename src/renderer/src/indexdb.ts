export default class IndexDB {
  private VERSION = 1;

  private db; // 数据库对象

  public get indexdb() {
    return this.db;
  }

  constructor(bd_name: string, store_name: string, options: Record<string, any> = {}) {
    try {
      this.db = indexedDB.open(bd_name, this.VERSION);
      this.db.addEventListener("upgradeneeded", (event) => {
        const store = event.target.result;
        store.createObjectStore(store_name, options);
      });
    } catch (err) {
      console.warn("数据库打开失败");
    }
  }

  public onSuccess() {
    const db = this.db;
    return new Promise((resolve) => {
      // db.addEventListener('success', (e) => resolve(e));
      db.onsuccess = function (e) {
        resolve(e);
        console.log("数据库打开成功");
      };
    });
  }
}

export function create(db, storeName, data: Record<string, any>) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.add(data);
    request.onsuccess = () => resolve(null);
    request.onerror = (e) => reject(e);
  });
}

export function update(db, storeName, data: Record<string, any>) {
  try {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(null);
      request.onerror = (e) => reject(e);
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

export function remove(db, storeName, data: Record<string, any>) {
  const transaction = db.transaction([storeName], "readwrite");
  const store = transaction.objectStore(storeName);
  const request = store.delete(data);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(null);
    request.onerror = (e) => reject(e);
  });
}

export function reader(db, storeName, id): Promise<Record<string, any> | undefined> {
  try {
    const transaction = db.transaction([storeName], "readonly");

    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  } catch (err) {
    return Promise.reject(err);
  }
}
